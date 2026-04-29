/**
 * Routes pour le CLI
 * Gestion des versions et téléchargements
 */

import express from 'express';
import fs from 'fs';
import path from 'path';

const router = express.Router();

// Version actuelle du CLI
const CURRENT_CLI_VERSION = '2.1.1'; // Patch: missing deleteAccount export
const DOWNLOAD_URL = 'https://verroupass.yvangui.fr/downloads/verroupass-cli.zip';
const CLI_SHA256 = 'd92f2cdc0a45d64101b71a415c81083c340752a21de2e11aad75e9ccbe041bac';

// Chemin physique du ZIP servi par nginx (location /downloads/). Utilisé pour
// renvoyer dynamiquement la taille réelle du fichier dans /api/cli/version,
// pour éviter le drift entre l'archive déployée et la taille affichée par l'UI.
const CLI_ZIP_PATH = '/var/www/verroupass/downloads/verroupass-cli.zip';

function getCliFileSize() {
  try {
    return fs.statSync(CLI_ZIP_PATH).size;
  } catch {
    return null; // Fichier absent en dev local : le frontend affichera 'N/A'
  }
}

/**
 * GET /api/cli/version
 * Retourne la version actuelle du CLI et l'URL de téléchargement
 */
router.get('/version', (req, res) => {
  res.json({
    version: CURRENT_CLI_VERSION,
    downloadUrl: DOWNLOAD_URL,
    releaseDate: '2026-04-29',
    sha256: CLI_SHA256,
    sizeBytes: getCliFileSize(),
    changelog: [
      'Fix critique : alignement crypto avec le client web (PBKDF2 600k + hash PBKDF2 1 iter au lieu de SHA-256 simple). Les comptes créés via le web sont désormais accessibles via la CLI.',
      'Fix critique : login envoie maintenant le bon champ passwordHash (au lieu de password en clair non lu par le serveur).',
      'Nouveau : support de la 2FA TOTP. Si le compte a la 2FA activée, prompt interactif pour code à 6 chiffres ou code de secours après login.',
      'Patch : ajout de l\'export manquant deleteAccount dans utils/api.js (la commande v-account-delete plantait au démarrage du CLI).'
    ],
    breaking: true, // Anciens comptes CLI-only inutilisables (algo crypto changé)
    minVersion: '2.1.0' // Version minimum requise (anciennes versions ne peuvent plus se connecter)
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
