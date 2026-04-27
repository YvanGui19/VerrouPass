#!/usr/bin/env node
/**
 * Liste toutes les invitations existantes (utilisees, expirees, valides).
 * Usage : node server/scripts/list-invitations.js
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import pool from '../src/db.js';
import { Invitation } from '../src/models/Invitation.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function main() {
  const rows = await Invitation.list();
  if (rows.length === 0) {
    console.log('Aucune invitation enregistree.');
    return;
  }

  const now = new Date();
  console.log('');
  for (const row of rows) {
    let status;
    if (row.used_at) {
      status = `utilisee le ${new Date(row.used_at).toISOString()}`;
    } else if (row.expires_at && new Date(row.expires_at) < now) {
      status = `expiree le ${new Date(row.expires_at).toISOString()}`;
    } else if (row.expires_at) {
      status = `valide jusqu au ${new Date(row.expires_at).toISOString()}`;
    } else {
      status = 'valide (sans expiration)';
    }

    console.log('ID    : ' + row.id);
    console.log('Note  : ' + (row.note || '(aucune)'));
    console.log('Cree  : ' + new Date(row.created_at).toISOString());
    console.log('Etat  : ' + status);
    if (row.used_by_user_id) console.log('User  : ' + row.used_by_user_id);
    console.log('');
  }
}

main()
  .catch((err) => {
    console.error('Erreur :', err.message);
    process.exit(1);
  })
  .finally(() => pool.end());
