/**
 * Fonctions cryptographiques pour le CLI VerrouPass
 *
 * IMPORTANT : doit rester strictement aligne avec client/src/utils/crypto.js.
 * Tout drift entraine l incompatibilite des comptes entre CLI et web.
 *
 * Deux KDF supportes :
 *  - kdf_version = 1 : PBKDF2-SHA256 600k iterations (legacy, comptes
 *    crees avant 2026-04-30). Salt = email lowercase.
 *  - kdf_version = 2 : Argon2id (libsodium-wrappers-sumo, m=64MiB t=3 p=1).
 *    Salt = 16 bytes random per-user, servi par /api/auth/kdf-info.
 *
 * Le client interroge /api/auth/kdf-info avant /login pour choisir l algo.
 * Le helper deriveKeysForUser (utils/deriveForUser.js) encapsule ce flow.
 *
 * Format commun en sortie :
 *  - Split : authKeyBytes = derives[0..32], encKeyBytes = derives[32..64]
 *  - passwordHash envoye au serveur : PBKDF2(authKey, salt='verroupass-server-auth',
 *    1 iter, SHA-256, 256 bits) -> hex (64 chars)
 *  - encKey : import AES-GCM 256 bits depuis encKeyBytes
 */

import { webcrypto } from 'crypto';
const crypto = webcrypto;

const PBKDF2_ITERATIONS = 600000;
const PBKDF2_HASH = 'SHA-256';
const AES_ALGORITHM = 'AES-GCM';
const AES_LENGTH = 256;
const SERVER_AUTH_SALT = 'verroupass-server-auth';

// Identifiants stockes dans users.kdf_version (cf migration 002).
export const KDF_VERSION = Object.freeze({
  PBKDF2_SHA256_600K: 1,
  ARGON2ID: 2
});

// Parametres Argon2id par defaut (RFC 9106 third option, p=1 force par libsodium).
export const ARGON2ID_DEFAULT_PARAMS = Object.freeze({ m: 65536, t: 3, p: 1 });

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
 * Derive authKey + encKey via Argon2id (libsodium-wrappers-sumo, lazy-loade).
 * Strict equivalent du helper cote web pour garantir que les memes (mdp, salt)
 * produisent les memes cles entre CLI et navigateur.
 *
 * @param {string} masterPassword
 * @param {Uint8Array} salt - exactement 16 bytes
 * @param {{m:number,t:number,p:number}} params
 */
let _sodiumPromise = null;
async function getSodium() {
  if (!_sodiumPromise) {
    _sodiumPromise = (async () => {
      const mod = await import('libsodium-wrappers-sumo');
      const sodium = mod.default || mod;
      await sodium.ready;
      return sodium;
    })();
  }
  return _sodiumPromise;
}

export function generateKdfSalt() {
  return crypto.getRandomValues(new Uint8Array(16));
}

export function decodeKdfSalt(base64Salt) {
  return new Uint8Array(Buffer.from(base64Salt, 'base64'));
}

export async function deriveKeysArgon2id(masterPassword, salt, params = ARGON2ID_DEFAULT_PARAMS) {
  if (params.p !== 1) {
    throw new Error('Argon2id: p doit etre 1 (contrainte libsodium)');
  }
  if (!(salt instanceof Uint8Array) || salt.length !== 16) {
    throw new Error('Argon2id: salt doit etre un Uint8Array de 16 bytes');
  }

  const sodium = await getSodium();

  // 64 bytes (= 512 bits, identique au split PBKDF2).
  const derived = sodium.crypto_pwhash(
    64,
    masterPassword,
    salt,
    params.t,
    params.m * 1024,
    sodium.crypto_pwhash_ALG_ARGON2ID13
  );

  const authKeyBytes = derived.slice(0, 32);
  const encKeyBytes = derived.slice(32, 64);

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
