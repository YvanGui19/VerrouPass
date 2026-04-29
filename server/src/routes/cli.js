/**
 * Routes pour le CLI
 * Gestion des versions et téléchargements
 */

import express from 'express';

const router = express.Router();

// Version actuelle du CLI
const CURRENT_CLI_VERSION = '2.1.0'; // Fix login + support 2FA TOTP
const DOWNLOAD_URL = 'https://verroupass.yvangui.fr/downloads/verroupass-cli.zip';
const CLI_SHA256 = 'f5f7b0dc917e1df278869d0f87c80af2958b9ab5ce72ac967f1b42b477dc580b';

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
    changelog: [
      'Fix critique : alignement crypto avec le client web (PBKDF2 600k + hash PBKDF2 1 iter au lieu de SHA-256 simple). Les comptes créés via le web sont désormais accessibles via la CLI.',
      'Fix critique : login envoie maintenant le bon champ passwordHash (au lieu de password en clair non lu par le serveur).',
      'Nouveau : support de la 2FA TOTP. Si le compte a la 2FA activée, prompt interactif pour code à 6 chiffres ou code de secours après login.'
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
