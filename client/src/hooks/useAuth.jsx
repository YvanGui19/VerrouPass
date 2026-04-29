import { useState, useEffect, createContext, useContext } from 'react';
import { authApi } from '../utils/api';
import { deriveKeys, hashForServer } from '../utils/crypto';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [encKey, setEncKey] = useState(null);
  const [loading, setLoading] = useState(true);
  // Etat intermediaire entre /login (etape 1 OK, 2FA requise) et /login/totp.
  // Stocke la encKey deja derivee + le challenge JWT pour ne pas redemander
  // le mot de passe a la 2e etape. Reset apres succes ou cancel.
  const [pendingTotp, setPendingTotp] = useState(null);

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
    // Dériver les clés (validation que la dérivation fonctionne avant d'appeler l'API)
    const { authKey } = await deriveKeys(masterPassword, email);

    // Hasher la clé d'authentification pour l'envoi
    const passwordHash = await hashForServer(authKey);

    // Le serveur renvoie une réponse générique (anti-énumération) sans cookies ni tokens.
    // L'utilisateur doit se connecter explicitement après l'inscription.
    const data = await authApi.register(email, passwordHash, invitationCode);

    return data;
  };

  const login = async (email, masterPassword) => {
    // Dériver les clés
    const { authKey, encKey: derivedEncKey } = await deriveKeys(masterPassword, email);

    // Hasher la clé d'authentification pour l'envoi
    const passwordHash = await hashForServer(authKey);

    // Envoyer au serveur (le token est maintenant dans un cookie HttpOnly)
    const data = await authApi.login(email, passwordHash);

    // Si 2FA active : pas de session posee. On garde la encKey + challenge en
    // memoire dans le state du hook pour la 2e etape (loginTotp), sans setUser
    // ni setEncKey. Le passwordHash est aussi conserve : utile si besoin pour
    // la fonction de disable depuis Settings, mais c'est ephemere et oublie
    // au cancel ou au succes.
    if (data.totpRequired) {
      setPendingTotp({
        challenge: data.challenge,
        derivedEncKey,
        passwordHash,
        email
      });
      return { totpRequired: true };
    }

    setUser(data.user);
    setEncKey(derivedEncKey);

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
    setUser(data.user);
    setEncKey(pendingTotp.derivedEncKey);
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

    // Re-dériver la clé de chiffrement
    const { encKey: derivedEncKey } = await deriveKeys(masterPassword, user.email);
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
