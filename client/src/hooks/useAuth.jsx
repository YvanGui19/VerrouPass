import { useState, useEffect, createContext, useContext } from 'react';
import { authApi } from '../utils/api';
import { deriveKeys, hashForServer } from '../utils/crypto';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [encKey, setEncKey] = useState(null);
  const [loading, setLoading] = useState(true);

  // Vérifier le token au chargement
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      authApi.verify()
        .then(data => {
          if (data.valid) {
            setUser(data.user);
          } else {
            localStorage.removeItem('token');
          }
        })
        .catch(() => {
          localStorage.removeItem('token');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const register = async (email, masterPassword) => {
    // Dériver les clés
    const { authKey, encKey: derivedEncKey } = await deriveKeys(masterPassword, email);

    // Hasher la clé d'authentification pour l'envoi
    const passwordHash = await hashForServer(authKey);

    // Envoyer au serveur
    const data = await authApi.register(email, passwordHash);

    // Stocker le token et la clé de chiffrement
    localStorage.setItem('token', data.token);
    setUser(data.user);
    setEncKey(derivedEncKey);

    return data;
  };

  const login = async (email, masterPassword) => {
    // Dériver les clés
    const { authKey, encKey: derivedEncKey } = await deriveKeys(masterPassword, email);

    // Hasher la clé d'authentification pour l'envoi
    const passwordHash = await hashForServer(authKey);

    // Envoyer au serveur
    const data = await authApi.login(email, passwordHash);

    // Stocker le token et la clé de chiffrement
    localStorage.setItem('token', data.token);
    setUser(data.user);
    setEncKey(derivedEncKey);

    return data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setEncKey(null);
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
    register,
    login,
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
