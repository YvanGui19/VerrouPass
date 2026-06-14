/**
 * Gestion de la configuration locale
 * Stocke le token JWT et les paramètres utilisateur
 */

import Conf from 'conf';
import { createHash } from 'crypto';
import { hostname, userInfo } from 'os';

/**
 * Génère une clé de chiffrement unique par machine
 * Basée sur des identifiants système (non réversible)
 */
function generateMachineKey() {
  const machineId = `${hostname()}-${userInfo().username}-verroupass-cli-v2`;
  return createHash('sha256').update(machineId).digest('hex').slice(0, 32);
}

const config = new Conf({
  projectName: 'verroupass-cli',
  encryptionKey: generateMachineKey() // Clé unique par machine
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

export function saveConfig(settings) {
  const currentConfig = config.get('settings', {});
  config.set('settings', { ...currentConfig, ...settings });
}

export function getConfig() {
  return config.get('settings', {});
}

export function resetConfig() {
  config.delete('settings');
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
  isAuthenticated,
  saveConfig,
  getConfig,
  resetConfig
};
