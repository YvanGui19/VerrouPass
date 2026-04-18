/**
 * Routes pour le CLI
 * Gestion des versions et téléchargements
 */

import express from 'express';

const router = express.Router();

// Version actuelle du CLI
const CURRENT_CLI_VERSION = '2.0.0'; // Version avec couleurs portfolio + générateur
const DOWNLOAD_URL = 'https://verroupass.yvangui.fr/downloads/verroupass-cli.zip';

/**
 * GET /api/cli/version
 * Retourne la version actuelle du CLI et l'URL de téléchargement
 */
router.get('/version', (req, res) => {
  res.json({
    version: CURRENT_CLI_VERSION,
    downloadUrl: DOWNLOAD_URL,
    releaseDate: '2024-04-18',
    changelog: [
      'Nouvelles couleurs du portfolio (vert lime + cyan)',
      'Suppression du système de 10 thèmes',
      'Taille optimisée (29.8 KB)',
      'Compatibilité avec le générateur Chaos Engine'
    ],
    breaking: false, // Pas de changements cassants
    minVersion: '1.0.0' // Version minimum requise
  });
});

/**
 * GET /api/cli/download
 * Redirige vers le téléchargement du CLI
 */
router.get('/download', (req, res) => {
  res.redirect(DOWNLOAD_URL);
});

export default router;
