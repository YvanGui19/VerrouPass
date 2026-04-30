import { useState, useEffect, createContext, useContext } from 'react';
import { authApi } from '../utils/api';
import {
  deriveKeysArgon2id,
  hashForServer,
  generateKdfSalt,
  ARGON2ID_DEFAULT_PARAMS,
  KDF_VERSION
} from '../utils/crypto';
import { deriveKeysForUser } from '../utils/deriveForUser';
import { migrateAccountToArgon2id } from '../utils/migrateKdf';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [encKey, setEncKey] = useState(null);
  const [loading, setLoading] = useState(true);
  // Etat intermediaire entre /login (etape 1 OK, 2FA requise) et /login/totp.
  // Stocke la encKey deja derivee + le challenge JWT pour ne pas redemander
  // le mot de passe a la 2e etape. Reset apres succes ou cancel.
  // Inclut aussi masterPassword + kdfInfo (eph) pour permettre la migration
  // silencieuse PBKDF2 -> Argon2id juste apres l'etape 2FA.
  const [pendingTotp, setPendingTotp] = useState(null);
  // True pendant la re-encryption du coffre lors d'une migration KDF.
  // L'UI peut afficher un overlay informatif "Mise a jour du chiffrement...".
  const [migrating, setMigrating] = useState(false);

  // Vérifier le token au chargement (via cookie HttpOnly)
  useEffect(() => {
    authApi.verify()
      .then(data => {
        if (data.valid) {
          setUser(data.user);
        }
      })
      .catch(() => {
        // Cookie invalide ou absent, pas connecté
      })
      .finally(() => setLoading(false));
  }, []);

  const register = async (email, masterPassword, invitationCode) => {
    // Tous les nouveaux comptes sont en Argon2id avec un salt random 16B
    // généré côté client. Le serveur valide le format et stocke tel quel.
    const salt = generateKdfSalt();
    const { authKey } = await deriveKeysArgon2id(masterPassword, salt, ARGON2ID_DEFAULT_PARAMS);

    // Hasher la clé d'authentification pour l'envoi
    const passwordHash = await hashForServer(authKey);

    // Le serveur renvoie une réponse générique (anti-énumération) sans cookies ni tokens.
    // L'utilisateur doit se connecter explicitement après l'inscription.
    const saltBase64 = btoa(String.fromCharCode.apply(null, salt));
    const data = await authApi.register(email, passwordHash, invitationCode, {
      kdfVersion: KDF_VERSION.ARGON2ID,
      kdfParams: ARGON2ID_DEFAULT_PARAMS,
      kdfSalt: saltBase64
    });

    return data;
  };

  // Helper interne : si le user vient d'achever un login en kdf_version=1,
  // declenche la migration silencieuse vers Argon2id avant d'exposer la
  // session. En cas d'echec on log et on continue avec PBKDF2 (la session
  // reste fonctionnelle, retry au prochain login).
  const finalizeLoginWithMaybeMigration = async ({
    userData,
    email,
    masterPassword,
    derivedEncKey,
    passwordHash,
    kdfInfo
  }) => {
    if (kdfInfo?.kdfVersion === KDF_VERSION.PBKDF2_SHA256_600K) {
      setMigrating(true);
      try {
        const { newEncKey } = await migrateAccountToArgon2id(
          masterPassword,
          email,
          derivedEncKey,
          passwordHash
        );
        setUser(userData);
        setEncKey(newEncKey);
      } catch (migrateErr) {
        // eslint-disable-next-line no-console
        console.warn('Migration KDF PBKDF2 -> Argon2id echouee, on continue avec PBKDF2', migrateErr);
        setUser(userData);
        setEncKey(derivedEncKey);
      } finally {
        setMigrating(false);
      }
    } else {
      setUser(userData);
      setEncKey(derivedEncKey);
    }
  };

  const login = async (email, masterPassword) => {
    // Étape 0 : interroger /kdf-info pour savoir quel KDF utiliser, puis
    // dériver les clés avec le bon algo. Géré par deriveKeysForUser.
    const { authKey, encKey: derivedEncKey, kdfInfo } =
      await deriveKeysForUser(masterPassword, email);

    // Hasher la clé d'authentification pour l'envoi
    const passwordHash = await hashForServer(authKey);

    // Envoyer au serveur (le token est maintenant dans un cookie HttpOnly)
    const data = await authApi.login(email, passwordHash);

    // Si 2FA active : pas de session posee. On garde la encKey + challenge en
    // memoire dans le state du hook pour la 2e etape (loginTotp). On garde
    // aussi masterPassword + kdfInfo pour permettre la migration silencieuse
    // apres validation 2FA si le compte est en v1.
    if (data.totpRequired) {
      setPendingTotp({
        challenge: data.challenge,
        derivedEncKey,
        passwordHash,
        email,
        masterPassword,
        kdfInfo
      });
      return { totpRequired: true };
    }

    await finalizeLoginWithMaybeMigration({
      userData: data.user,
      email,
      masterPassword,
      derivedEncKey,
      passwordHash,
      kdfInfo
    });

    return data;
  };

  // 2e etape du login quand 2FA est active. A appeler apres un login() qui a
  // retourne { totpRequired: true }. Reutilise la encKey deja derivee.
  const loginTotp = async ({ totpCode, recoveryCode }) => {
    if (!pendingTotp) {
      throw new Error('Aucune connexion 2FA en attente. Recommencez la connexion.');
    }
    const data = await authApi.loginTotp({
      challenge: pendingTotp.challenge,
      totpCode,
      recoveryCode
    });

    await finalizeLoginWithMaybeMigration({
      userData: data.user,
      email: pendingTotp.email,
      masterPassword: pendingTotp.masterPassword,
      derivedEncKey: pendingTotp.derivedEncKey,
      passwordHash: pendingTotp.passwordHash,
      kdfInfo: pendingTotp.kdfInfo
    });

    setPendingTotp(null);
    return data;
  };

  const cancelTotpFlow = () => setPendingTotp(null);

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (err) {
      // Ignorer les erreurs de déconnexion
    }
    setUser(null);
    setEncKey(null);
    setPendingTotp(null);
  };

  const unlockVault = async (masterPassword) => {
    if (!user) throw new Error('Non connecté');

    // Re-dériver la clé de chiffrement avec le KDF actuel du user.
    const { encKey: derivedEncKey } = await deriveKeysForUser(masterPassword, user.email);
    setEncKey(derivedEncKey);

    return derivedEncKey;
  };

  const value = {
    user,
    encKey,
    loading,
    isAuthenticated: !!user,
    isUnlocked: !!encKey,
    pendingTotp: !!pendingTotp,
    pendingTotpEmail: pendingTotp?.email || null,
    migrating,
    register,
    login,
    loginTotp,
    cancelTotpFlow,
    logout,
    unlockVault
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return context;
}

export default useAuth;
