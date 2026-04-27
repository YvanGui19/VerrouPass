#!/usr/bin/env node
/**
 * Demande au serveur la generation d un code d invitation valable 15 minutes.
 * Le code est imprime sur stdout, a transmettre au destinataire par un canal
 * sur (SMS, Signal, en main propre).
 *
 * A executer SUR LE VPS qui heberge le backend : par defaut, le script tape
 * directement sur http://localhost:3001 (port d ecoute Node), bypassant
 * Cloudflare et nginx. C est plus simple et plus rapide qu un appel public,
 * et ca evite les challenges anti-bot de Cloudflare.
 *
 * Pre-requis :
 *   - ADMIN_INVITATION_TOKEN defini dans server/.env (ce script le lit)
 *   - Le backend Node ecoute sur le port indique (PORT du .env, defaut 3001)
 *
 * Usage :
 *   node server/scripts/request-invitation.js
 *   node server/scripts/request-invitation.js --url=https://verroupass.example.com
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const port = process.env.PORT || 3001;
const baseUrl =
  process.argv.find((a) => a.startsWith('--url='))?.split('=')[1] ||
  `http://localhost:${port}`;

const token = process.env.ADMIN_INVITATION_TOKEN;
if (!token || token.length < 32) {
  console.error('ADMIN_INVITATION_TOKEN absent ou trop court (32+ caracteres requis).');
  console.error('Generer un token : node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
  process.exit(1);
}

const url = new URL('/api/admin/invitation', baseUrl).toString();

try {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'X-Admin-Token': token },
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`Echec ${res.status} : ${body}`);
    process.exit(1);
  }

  const data = await res.json();
  console.log('');
  console.log('Code d\'invitation :');
  console.log('');
  console.log('   ' + data.code);
  console.log('');
  console.log('Expire a    : ' + data.expiresAt);
  console.log('Validite    : ' + data.ttlMinutes + ' minutes');
  console.log('');
  console.log('A transmettre via SMS / Signal / canal sur. Le code n est plus recuperable.');
} catch (err) {
  console.error('Erreur reseau :', err.message);
  process.exit(1);
}
