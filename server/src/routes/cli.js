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
const CURRENT_CLI_VERSION = '2.2.0'; // Argon2id support + dual KDF login
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
      'Nouveau : support du KDF Argon2id (libsodium-wrappers-sumo, m=64MiB t=3 p=1, RFC 9106). Indispensable pour les comptes crees ou migres depuis le 2026-04-30.',
      'Nouveau : login dual-KDF. Le CLI interroge /api/auth/kdf-info avant de deriver les cles, puis utilise Argon2id ou PBKDF2 selon ce que le serveur indique. Les comptes PBKDF2 legacy continuent de fonctionner.',
      'Cleanup : suppression de la fonction register inutilisee (l inscription se fait uniquement via le frontend web).'
    ],
    breaking: true, // Versions <2.2.0 ne peuvent pas se connecter aux comptes Argon2id
    minVersion: '2.2.0' // Comptes Argon2id necessitent libsodium cote CLI
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
