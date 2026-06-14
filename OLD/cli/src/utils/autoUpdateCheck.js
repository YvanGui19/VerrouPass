/**
 * Vérification automatique des mises à jour (non intrusive)
 * S'exécute une fois par jour maximum
 */

import { checkForUpdates, displayUpdateNotification } from './updateChecker.js';
import { getConfig, saveConfig } from './config.js';

const ONE_DAY = 24 * 60 * 60 * 1000; // 24 heures en millisecondes

/**
 * Vérifie si on doit vérifier les mises à jour
 * @returns {boolean}
 */
function shouldCheck() {
  const config = getConfig();
  const lastCheck = config.lastUpdateCheck || 0;
  const now = Date.now();

  return (now - lastCheck) > ONE_DAY;
}

/**
 * Enregistre la date de la dernière vérification
 */
function recordCheck() {
  saveConfig({ lastUpdateCheck: Date.now() });
}

/**
 * Vérifie les mises à jour de manière non intrusive
 * - Maximum une fois par jour
 * - Silencieux en cas d'erreur
 * - Ne bloque pas l'exécution
 */
export async function autoCheckUpdate() {
  if (!shouldCheck()) {
    return; // Déjà vérifié récemment
  }

  try {
    const updateInfo = await checkForUpdates();

    recordCheck();

    if (updateInfo) {
      // Afficher la notification seulement si mise à jour disponible
      displayUpdateNotification(updateInfo);
    }
  } catch (error) {
    // Silencieux en cas d'erreur (offline, timeout, etc.)
    recordCheck(); // Enregistrer quand même pour ne pas réessayer à chaque commande
  }
}
