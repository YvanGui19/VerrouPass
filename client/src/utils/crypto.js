/**
 * Fonctions cryptographiques pour VerrouPass
 * Utilise l'API Web Crypto pour la dérivation de clés et le chiffrement
 */

const PBKDF2_ITERATIONS = 600000;
const PBKDF2_HASH = 'SHA-256';
const AES_ALGORITHM = 'AES-GCM';
const AES_LENGTH = 256;

// Identifiants de KDF stockés dans users.kdf_version (cf migration 002).
export const KDF_VERSION = Object.freeze({
  PBKDF2_SHA256_600K: 1,
  ARGON2ID: 2
});

// Paramètres Argon2id par défaut : RFC 9106 "third recommended option" et
// défaut OWASP 2024 pour une dérivation côté navigateur. p=1 imposé par
// libsodium (mono-thread), accepté en échange de l'audit Cure53 et de
// l'implémentation de référence de Frank Denis.
//   m : mémoire en KiB (65536 = 64 MiB)
//   t : itérations (3)
//   p : parallélisme (1, contrainte libsodium)
export const ARGON2ID_DEFAULT_PARAMS = Object.freeze({ m: 65536, t: 3, p: 1 });

/**
 * Dériver les clés d'authentification et de chiffrement depuis le mot de passe maître
 */
export async function deriveKeys(masterPassword, email) {
  const encoder = new TextEncoder();

  // Utiliser l'email comme salt (normalisé en minuscules)
  const salt = encoder.encode(email.toLowerCase());

  // Dériver une clé maître de 512 bits depuis le mot de passe
  const masterKeyMaterial = await window.crypto.subtle.importKey(
    'raw',
    encoder.encode(masterPassword),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const derivedBits = await window.crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: PBKDF2_ITERATIONS,
      hash: PBKDF2_HASH
    },
    masterKeyMaterial,
    512 // 64 bytes = 512 bits
  );

  // Séparer les 512 bits en deux clés de 256 bits
  const derivedArray = new Uint8Array(derivedBits);
  const authKeyBytes = derivedArray.slice(0, 32); // Premiers 256 bits pour l'auth
  const encKeyBytes = derivedArray.slice(32, 64); // Derniers 256 bits pour le chiffrement

  // Créer la clé d'authentification (pour hacher et envoyer au serveur)
  const authKey = await window.crypto.subtle.importKey(
    'raw',
    authKeyBytes,
    'PBKDF2',
    false,
    ['deriveBits']
  );

  // Créer la clé de chiffrement (pour chiffrer les données localement)
  const encKey = await window.crypto.subtle.importKey(
    'raw',
    encKeyBytes,
    { name: AES_ALGORITHM, length: AES_LENGTH },
    true,
    ['encrypt', 'decrypt']
  );

  return { authKey, encKey };
}

/**
 * Dériver les clés via Argon2id (libsodium WASM, lazy-loadé).
 * Même signature de retour que deriveKeys() pour rester drop-in.
 *
 * Note libsodium :
 * - L'API crypto_pwhash impose un salt de 16 bytes. On dérive un salt
 *   déterministe à partir de l'email via SHA-256 tronqué (le salt n'a
 *   pas besoin d'être secret, juste unique par utilisateur).
 * - p (parallélisme) est forcé à 1 par libsodium ; on rejette toute
 *   valeur différente pour ne pas créer de divergence silencieuse.
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

export async function deriveKeysArgon2id(masterPassword, email, params = ARGON2ID_DEFAULT_PARAMS) {
  if (params.p !== 1) {
    throw new Error('Argon2id: p doit être 1 (contrainte libsodium)');
  }

  const sodium = await getSodium();
  const encoder = new TextEncoder();

  // Salt déterministe = SHA-256(email.lower()) tronqué à 16 bytes.
  const emailHashBuf = await window.crypto.subtle.digest(
    'SHA-256',
    encoder.encode(email.toLowerCase())
  );
  const salt = new Uint8Array(emailHashBuf).slice(0, sodium.crypto_pwhash_SALTBYTES);

  // Dérive 64 bytes (= 512 bits, identique au PBKDF2 actuel).
  const derived = sodium.crypto_pwhash(
    64,
    masterPassword,
    salt,
    params.t,                   // opslimit (itérations)
    params.m * 1024,            // memlimit en bytes (KiB → bytes)
    sodium.crypto_pwhash_ALG_ARGON2ID13
  );

  // Split 32+32 comme PBKDF2 actuel.
  const authKeyBytes = derived.slice(0, 32);
  const encKeyBytes = derived.slice(32, 64);

  // Importer comme CryptoKey (compat hashForServer + AES-GCM existants).
  const authKey = await window.crypto.subtle.importKey(
    'raw',
    authKeyBytes,
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const encKey = await window.crypto.subtle.importKey(
    'raw',
    encKeyBytes,
    { name: AES_ALGORITHM, length: AES_LENGTH },
    true,
    ['encrypt', 'decrypt']
  );

  return { authKey, encKey };
}

/**
 * Hasher la clé d'authentification pour l'envoyer au serveur
 */
export async function hashForServer(authKey) {
  const encoder = new TextEncoder();
  const salt = encoder.encode('verroupass-server-auth');

  // Note: 1 itération est acceptable ici car la clé d'entrée (authKey) est déjà
  // dérivée avec PBKDF2 600k itérations. Ce hash final est juste une transformation
  // pour éviter d'envoyer la clé brute au serveur, pas une protection contre brute-force.
  const bits = await window.crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 1,
      hash: 'SHA-256'
    },
    authKey,
    256
  );

  // Convertir en hex
  const hashArray = Array.from(new Uint8Array(bits));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Exporter une clé de chiffrement pour le stockage
 */
export async function exportKey(cryptoKey) {
  const exported = await window.crypto.subtle.exportKey('raw', cryptoKey);
  const exportedKeyBuffer = new Uint8Array(exported);
  return btoa(String.fromCharCode.apply(null, exportedKeyBuffer));
}

/**
 * Importer une clé de chiffrement depuis le stockage
 */
export async function importKey(base64Key) {
  const binaryString = atob(base64Key);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return await window.crypto.subtle.importKey(
    'raw',
    bytes,
    { name: AES_ALGORITHM, length: AES_LENGTH },
    true,
    ['encrypt', 'decrypt']
  );
}

/**
 * Chiffrer des données avec AES-GCM
 */
export async function encrypt(data, cryptoKey) {
  const encoder = new TextEncoder();
  const plaintext = encoder.encode(JSON.stringify(data));

  // Générer un IV aléatoire
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  const ciphertext = await window.crypto.subtle.encrypt(
    {
      name: AES_ALGORITHM,
      iv: iv
    },
    cryptoKey,
    plaintext
  );

  // Retourner les données chiffrées et l'IV en base64
  return {
    encryptedData: btoa(String.fromCharCode.apply(null, new Uint8Array(ciphertext))),
    iv: btoa(String.fromCharCode.apply(null, iv))
  };
}

/**
 * Déchiffrer des données avec AES-GCM
 */
export async function decrypt(encryptedData, ivBase64, cryptoKey) {
  // Décoder depuis base64
  const ciphertext = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
  const iv = Uint8Array.from(atob(ivBase64), c => c.charCodeAt(0));

  const plaintext = await window.crypto.subtle.decrypt(
    {
      name: AES_ALGORITHM,
      iv: iv
    },
    cryptoKey,
    ciphertext
  );

  const decoder = new TextDecoder();
  return JSON.parse(decoder.decode(plaintext));
}
