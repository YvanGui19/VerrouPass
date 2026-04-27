#!/usr/bin/env node
/**
 * Revoque une invitation non encore utilisee (la marque expiree).
 * Usage : node server/scripts/revoke-invitation.js <id>
 *
 * L ID est celui affiche par list-invitations.js.
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
  const id = process.argv[2];
  if (!id) {
    console.error('Usage : node server/scripts/revoke-invitation.js <id>');
    process.exit(1);
  }

  const result = await Invitation.revoke(id);
  if (!result) {
    console.error(`Aucune invitation revocable trouvee avec l ID ${id} (deja utilisee ou inexistante).`);
    process.exit(1);
  }

  console.log(`Invitation ${result.id} revoquee.`);
}

main()
  .catch((err) => {
    console.error('Erreur :', err.message);
    process.exit(1);
  })
  .finally(() => pool.end());
