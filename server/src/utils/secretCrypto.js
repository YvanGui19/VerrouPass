import crypto from 'crypto';

// Chiffrement symétrique des secrets TOTP au repos (AES-256-GCM).
//
// La clé maître TOTP_ENCRYPTION_KEY est une string hex de 64 caractères
// (32 bytes), générée par `openssl rand -hex 32` et stockée dans
// server/.env. Elle ne quitte jamais le serveur.
//
// Format de stockage : 3 valeurs base64 (ciphertext, iv 12B, tag 16B)
// stockées dans 3 colonnes séparées de la table users.

const ALGORITHM = 'aes-256-gcm';
const IV_BYTES = 12;     // 96 bits, recommandé pour GCM
const KEY_BYTES = 32;    // 256 bits

let cachedKey = null;

function getKey() {
  if (cachedKey) return cachedKey;

  const hex = process.env.TOTP_ENCRYPTION_KEY;
  if (!hex) {
    throw new Error(
      'TOTP_ENCRYPTION_KEY manquante dans server/.env. ' +
      'Générer avec : openssl rand -hex 32'
    );
  }
  if (!/^[0-9a-fA-F]{64}$/.test(hex)) {
    throw new Error(
      'TOTP_ENCRYPTION_KEY invalide : doit être 64 caractères hex ' +
      '(32 bytes). Régénérer avec : openssl rand -hex 32'
    );
  }

  cachedKey = Buffer.from(hex, 'hex');
  if (cachedKey.length !== KEY_BYTES) {
    throw new Error('TOTP_ENCRYPTION_KEY ne fait pas 32 bytes après décodage.');
  }
  return cachedKey;
}

export function encryptSecret(plaintext) {
  const key = getKey();
  const iv = crypto.randomBytes(IV_BYTES);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const ciphertext = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final()
  ]);
  const tag = cipher.getAuthTag();

  return {
    ciphertext: ciphertext.toString('base64'),
    iv: iv.toString('base64'),
    tag: tag.toString('base64')
  };
}

export function decryptSecret({ ciphertext, iv, tag }) {
  const key = getKey();
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    key,
    Buffer.from(iv, 'base64')
  );
  decipher.setAuthTag(Buffer.from(tag, 'base64'));

  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(ciphertext, 'base64')),
    decipher.final()
  ]);
  return plaintext.toString('utf8');
}

// Validation au démarrage du serveur : appeler en haut de index.js après
// dotenv.config() pour échouer vite si la clé est absente/malformée.
export function assertTotpKeyConfigured() {
  getKey();
}
