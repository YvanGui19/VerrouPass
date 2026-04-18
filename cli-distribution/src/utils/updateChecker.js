/**
 * Vérification des mises à jour du CLI
 */

import axios from 'axios';
import { c } from './themes.js';
import { getServerUrl } from './config.js';

// Version actuelle du CLI
export const CLI_VERSION = '2.0.0';

/**
 * Vérifie si une mise à jour est disponible
 * @returns {Promise<object|null>} Informations de mise à jour ou null
 */
export async function checkForUpdates() {
  try {
    const serverUrl = getServerUrl();
    const response = await axios.get(`${serverUrl}/cli/version`, {
      timeout: 3000 // 3 secondes max
    });

    const { version, downloadUrl, changelog } = response.data;

    // Comparer les versions
    if (isNewerVersion(version, CLI_VERSION)) {
      return {
        available: true,
        currentVersion: CLI_VERSION,
        latestVersion: version,
        downloadUrl,
        changelog
      };
    }

    return null;
  } catch (error) {
    // Silencieux si erreur (offline, etc.)
    return null;
  }
}

/**
 * Compare deux versions
 * @param {string} latest - Version distante (ex: "2.0.0")
 * @param {string} current - Version actuelle (ex: "1.0.0")
 * @returns {boolean} True si latest > current
 */
function isNewerVersion(latest, current) {
  const latestParts = latest.split('.').map(Number);
  const currentParts = current.split('.').map(Number);

  for (let i = 0; i < 3; i++) {
    if (latestParts[i] > currentParts[i]) return true;
    if (latestParts[i] < currentParts[i]) return false;
  }

  return false;
}

/**
 * Affiche un message de mise à jour disponible
 * @param {object} updateInfo - Informations de mise à jour
 */
export function displayUpdateNotification(updateInfo) {
  console.log('');
  console.log(c.info('═'.repeat(60)));
  console.log(c.highlight('  MISE À JOUR DISPONIBLE'));
  console.log(c.info('═'.repeat(60)));
  console.log('');
  console.log(`  Version actuelle : ${c.muted(updateInfo.currentVersion)}`);
  console.log(`  Nouvelle version : ${c.success(updateInfo.latestVersion)}`);
  console.log('');

  if (updateInfo.changelog && updateInfo.changelog.length > 0) {
    console.log(c.primary('  Nouveautés :'));
    updateInfo.changelog.forEach(item => {
      console.log(`    ${c.success('•')} ${item}`);
    });
    console.log('');
  }

  console.log(c.primary('  Pour mettre à jour :'));
  console.log(`    1. Téléchargez : ${c.info(updateInfo.downloadUrl)}`);
  console.log(`    2. Ou utilisez : ${c.success('v-update')}`);
  console.log('');
  console.log(c.info('═'.repeat(60)));
  console.log('');
}

/**
 * Vérifie et affiche une notification si mise à jour disponible
 * Appelé automatiquement au démarrage des commandes
 */
export async function checkAndNotify() {
  const updateInfo = await checkForUpdates();

  if (updateInfo) {
    displayUpdateNotification(updateInfo);
  }
}
