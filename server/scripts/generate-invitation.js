#!/usr/bin/env node
/**
 * Genere un code d invitation pour la creation de compte VerrouPass.
 *
 * Usage :
 *   node server/scripts/generate-invitation.js [note] [--days=N]
 *
 * Exemples :
 *   node server/scripts/generate-invitation.js
 *   node server/scripts/generate-invitation.js "Pour ma soeur"
 *   node server/scripts/generate-invitation.js "Pour ma soeur" --days=14
 *
 * Le code est affiche une seule fois a stdout. Il est stocke en base sous forme
 * de hash SHA-256, donc impossible de le retrouver une fois oublie : noter le
 * code immediatement et le transmettre au destinataire via un canal sur (SMS,
 * Signal, en main propre).
 */

import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import pool from '../src/db.js';
import { Invitation } from '../src/models/Invitation.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Charge .env depuis server/.env (le pool DB en a aussi besoin)
dotenv.config({ path: path.join(__dirname, '..', '.env') });

function parseArgs(argv) {
  const args = { note: null, days: null };
  for (const arg of argv.slice(2)) {
    if (arg.startsWith('--days=')) {
      const n = parseInt(arg.split('=')[1], 10);
      if (!Number.isFinite(n) || n <= 0) {
        console.error(`Argument --days invalide : ${arg}`);
        process.exit(1);
      }
      args.days = n;
    } else if (!arg.startsWith('--') && args.note === null) {
      args.note = arg;
    }
  }
  return args;
}

async function main() {
  const { note, days } = parseArgs(process.argv);

  // 24 octets aleatoires en base64url = 32 caracteres url-safe
  // ~192 bits d entropie : impossible a deviner ou brute-forcer en pratique
  const code = crypto.randomBytes(24).toString('base64url');

  const expiresAt = days ? new Date(Date.now() + days * 24 * 60 * 60 * 1000) : null;

  const created = await Invitation.create(code, note, expiresAt);

  console.log('');
  console.log('Code d\'invitation cree :');
  console.log('');
  console.log('   ' + code);
  console.log('');
  if (note) console.log('Note      : ' + note);
  if (expiresAt) {
    console.log('Expire le : ' + expiresAt.toISOString());
  } else {
    console.log('Expire le : jamais');
  }
  console.log('Cree le   : ' + created.created_at.toISOString());
  console.log('ID        : ' + created.id);
  console.log('');
  console.log('A transmettre au destinataire via un canal sur (SMS, Signal, en main propre).');
  console.log('Le code n\'est pas recuperable ulterieurement.');
}

main()
  .catch((err) => {
    console.error('Erreur :', err.message);
    process.exit(1);
  })
  .finally(() => pool.end());
