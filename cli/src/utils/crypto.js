/**
 * Fonctions cryptographiques pour le CLI VerrouPass
 *
 * IMPORTANT : doit rester strictement aligne avec client/src/utils/crypto.js.
 * Tout drift entraine l incompatibilite des comptes entre CLI et web.
 *
 * Algo (identique au web) :
 *  1. PBKDF2-SHA256, 600 000 iterations, salt = email lowercase, 512 bits
 *  2. Split : authKeyBytes = derives[0..32], encKeyBytes = derives[32..64]
 *  3. Pour passwordHash envoye au serveur : PBKDF2(authKey, salt='verroupass-server-auth',
 *     1 iter, SHA-256, 256 bits) -> hex (64 chars)
 *  4. encKey : import AES-GCM 256 bits depuis encKeyBytes
 */

import { webcrypto } from 'crypto';
const crypto = webcrypto;

const PBKDF2_ITERATIONS = 600000;
const PBKDF2_HASH = 'SHA-256';
const AES_ALGORITHM = 'AES-GCM';
const AES_LENGTH = 256;
const SERVER_AUTH_SALT = 'verroupass-server-auth';

function stringToBuffer(str) {
  return new TextEncoder().encode(str);
}

function bufferToHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function bufferToBase64(buffer) {
  return Buffer.from(new Uint8Array(buffer)).toString('base64');
}

function base64ToBuffer(base64) {
  return new Uint8Array(Buffer.from(base64, 'base64')).buffer;
}

/**
 * Derive authKey (CryptoKey PBKDF2) et encKey (CryptoKey AES-GCM) depuis le
 * mot de passe maitre + email. Aligne sur client/src/utils/crypto.js.
 */
export async function deriveKeys(masterPassword, email) {
  const salt = stringToBuffer(email.toLowerCase());

  const masterKeyMaterial = await crypto.subtle.importKey(
    'raw',
    stringToBuffer(masterPassword),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: PBKDF2_HASH
    },
    masterKeyMaterial,
    512
  );

  const derivedArray = new Uint8Array(derivedBits);
  const authKeyBytes = derivedArray.slice(0, 32);
  const encKeyBytes = derivedArray.slice(32, 64);

  const authKey = await crypto.subtle.importKey(
    'raw',
    authKeyBytes,
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const encKey = await crypto.subtle.importKey(
    'raw',
    encKeyBytes,
    { name: AES_ALGORITHM, length: AES_LENGTH },
    true,
    ['encrypt', 'decrypt']
  );

  return { authKey, encKey };
}

/**
 * Hash final transmis au serveur. PBKDF2 1 iteration sur authKey avec salt
 * fixe (la protection contre brute-force est assuree par les 600k iterations
 * initiales ; ce hash est juste une transformation pour eviter d envoyer la
 * cle brute au serveur).
 */
export async function hashForServer(authKey) {
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: stringToBuffer(SERVER_AUTH_SALT),
      iterations: 1,
      hash: PBKDF2_HASH
    },
    authKey,
    256
  );
  return bufferToHex(bits);
}

export async function encrypt(data, cryptoKey) {
  const plaintext = stringToBuffer(JSON.stringify(data));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: AES_ALGORITHM, iv },
    cryptoKey,
    plaintext
  );
  return {
    encryptedData: bufferToBase64(ciphertext),
    iv: bufferToBase64(iv)
  };
}

export async function decrypt(encryptedData, ivBase64, cryptoKey) {
  const ciphertext = base64ToBuffer(encryptedData);
  const iv = new Uint8Array(base64ToBuffer(ivBase64));
  const plaintext = await crypto.subtle.decrypt(
    { name: AES_ALGORITHM, iv },
    cryptoKey,
    ciphertext
  );
  return JSON.parse(new TextDecoder().decode(plaintext));
}

export async function exportKey(cryptoKey) {
  const exported = await crypto.subtle.exportKey('raw', cryptoKey);
  return bufferToBase64(exported);
}

export async function importKey(base64Key) {
  return crypto.subtle.importKey(
    'raw',
    base64ToBuffer(base64Key),
    { name: AES_ALGORITHM, length: AES_LENGTH },
    true,
    ['encrypt', 'decrypt']
  );
}

export default {
  deriveKeys,
  hashForServer,
  encrypt,
  decrypt,
  exportKey,
  importKey
};
