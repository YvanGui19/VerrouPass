/**
 * Gestion de la configuration locale
 * Stocke le token JWT et les paramètres utilisateur
 */

import Conf from 'conf';

const config = new Conf({
  projectName: 'verroupass-cli',
  encryptionKey: 'verroupass-secure-storage' // En production, utiliser une clé plus sécurisée
});

export function saveToken(token) {
  config.set('token', token);
}

export function getToken() {
  return config.get('token');
}

export function saveUser(user) {
  config.set('user', user);
}

export function getUser() {
  return config.get('user');
}

export function saveEncryptionKey(key) {
  // Note: Stocker la clé de chiffrement n'est pas idéal pour la sécurité
  // mais nécessaire pour éviter de redemander le mot de passe maître à chaque commande
  // Alternative: demander le mot de passe maître à chaque opération sensible
  config.set('encKey', key);
}

export function getEncryptionKey() {
  return config.get('encKey');
}

export function saveServerUrl(url) {
  config.set('serverUrl', url);
}

export function getServerUrl() {
  return config.get('serverUrl', 'http://localhost:3001/api');
}

export function clearSession() {
  config.delete('token');
  config.delete('user');
  config.delete('encKey');
}

export function isAuthenticated() {
  return !!getToken() && !!getEncryptionKey();
}

export default {
  saveToken,
  getToken,
  saveUser,
  getUser,
  saveEncryptionKey,
  getEncryptionKey,
  saveServerUrl,
  getServerUrl,
  clearSession,
  isAuthenticated
};
