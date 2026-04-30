/**
 * Routes pour le CLI
 * Gestion des versions et téléchargements
 */

import express from 'express';
import fs from 'fs';
import path from 'path';

const router = express.Router();

// Version actuelle du CLI
// /!\ Quand on bump : regenerer le ZIP via scripts/release-cli.sh qui met
// aussi a jour CLI_SHA256 ci-dessous (sinon les nouveaux clients verront un
// hash incorrect et refuseront le download).
const CURRENT_CLI_VERSION = '2.3.0'; // Fix dispatch v-* sous Windows
const DOWNLOAD_URL = 'https://verroupass.yvangui.fr/downloads/verroupass-cli.zip';
const CLI_SHA256 = 'ba789a0e486b94cd441d3e53716065c0a91cd890e40c150bbeeadc0c8feb25d3';

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
    releaseDate: '2026-04-30',
    sha256: CLI_SHA256,
    sizeBytes: getCliFileSize(),
    changelog: [
      'Fix : v-login / v-ls / v-cat / etc. fonctionnent maintenant sous Windows. Avant cette version, le wrapper .cmd créé par npm install -g pointait directement sur src/index.js, donc path.basename(process.argv[1]) renvoyait index.js et le dispatch des commandes v-* ne se déclenchait pas.',
      'Refactor : le dispatch passe par des stubs bin/v-*.js qui appellent runCli(binName) explicitement, plus de détection fragile basée sur argv[1]. Comportement identique sous Linux/Mac.'
    ],
    breaking: false,
    minVersion: '2.2.0' // Comptes Argon2id nécessitent libsodium côté CLI (>=2.2.0)
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
