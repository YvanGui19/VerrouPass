/**
 * Fonctions cryptographiques pour VerrouPass
 * Utilise l'API Web Crypto pour la dérivation de clés et le chiffrement
 */

const PBKDF2_ITERATIONS = 600000;
const PBKDF2_HASH = 'SHA-256';
const AES_ALGORITHM = 'AES-GCM';
const AES_LENGTH = 256;

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
