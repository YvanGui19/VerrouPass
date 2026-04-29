import crypto from 'crypto';

// TOTP RFC 6238 — implémentation pure Node crypto, sans dépendance externe.
// Aligné sur l'impl client (client/src/utils/totp.js) pour cohérence.
//
// Paramètres figés :
//   - HMAC-SHA1 (compat universelle Google Authenticator, Authy, etc.)
//   - 6 chiffres
//   - période 30s
//   - secret 160 bits (20 bytes), encodé base32 (32 caractères)
//   - validation avec window ±1 (90s effectifs de tolérance)

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const TIME_STEP = 30;
const DIGITS = 6;
const SECRET_BYTES = 20;
const RECOVERY_CODE_BYTES = 10;       // 10 bytes → 16 chars base32 (~80 bits)
const RECOVERY_CODES_COUNT = 10;
const RECOVERY_CODE_GROUPS = 4;       // XXXX-XXXX-XXXX-XXXX

export function base32Encode(bytes) {
  let bits = '';
  for (const byte of bytes) {
    bits += byte.toString(2).padStart(8, '0');
  }
  let result = '';
  for (let i = 0; i + 5 <= bits.length; i += 5) {
    result += ALPHABET[parseInt(bits.slice(i, i + 5), 2)];
  }
  // padding 5-bit non géré : on dimensionne les inputs en multiple de 5 bits
  // (20 bytes = 160 bits = 32 chars exact ; 10 bytes = 80 bits = 16 chars exact).
  return result;
}

export function base32Decode(str) {
  const cleaned = str.toUpperCase().replace(/[\s-]/g, '').replace(/=+$/, '');
  let bits = '';
  for (const char of cleaned) {
    const idx = ALPHABET.indexOf(char);
    if (idx === -1) throw new Error(`Caractère base32 invalide : ${char}`);
    bits += idx.toString(2).padStart(5, '0');
  }
  const bytes = Buffer.alloc(Math.floor(bits.length / 8));
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(bits.slice(i * 8, (i + 1) * 8), 2);
  }
  return bytes;
}

export function generateSecret() {
  return base32Encode(crypto.randomBytes(SECRET_BYTES));
}

function counterToBuffer(counter) {
  const buf = Buffer.alloc(8);
  // counter sur 64 bits big-endian. JS number safe jusqu'à 2^53,
  // largement suffisant (epoch / 30 << 2^53).
  buf.writeUInt32BE(Math.floor(counter / 0x100000000), 0);
  buf.writeUInt32BE(counter >>> 0, 4);
  return buf;
}

function computeCode(secretBytes, counter) {
  const hmac = crypto.createHmac('sha1', secretBytes)
    .update(counterToBuffer(counter))
    .digest();
  // Dynamic truncation RFC 4226 §5.4
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  const otp = binary % Math.pow(10, DIGITS);
  return otp.toString().padStart(DIGITS, '0');
}

export function generateTOTP(secret, timestampMs = Date.now()) {
  const counter = Math.floor(timestampMs / 1000 / TIME_STEP);
  return computeCode(base32Decode(secret), counter);
}

// Validation timing-safe avec window ±1 (accepte le code courant, le précédent
// et le suivant — couvre 90 secondes pour décalage horloge client/serveur).
export function verifyTOTP(secret, code, { window = 1, timestampMs = Date.now() } = {}) {
  if (!code || typeof code !== 'string' || !/^\d{6}$/.test(code)) {
    return false;
  }
  const secretBytes = base32Decode(secret);
  const counter = Math.floor(timestampMs / 1000 / TIME_STEP);
  const candidate = Buffer.from(code, 'utf8');

  for (let delta = -window; delta <= window; delta++) {
    const expected = Buffer.from(computeCode(secretBytes, counter + delta), 'utf8');
    if (expected.length === candidate.length &&
        crypto.timingSafeEqual(expected, candidate)) {
      return true;
    }
  }
  return false;
}

// URI standard pour QR codes (compat Google Auth, Authy, 1Password, etc.)
// Référence : https://github.com/google/google-authenticator/wiki/Key-Uri-Format
export function generateOtpauthUri({ issuer, account, secret }) {
  const label = encodeURIComponent(`${issuer}:${account}`);
  const params = new URLSearchParams({
    secret,
    issuer,
    algorithm: 'SHA1',
    digits: String(DIGITS),
    period: String(TIME_STEP)
  });
  return `otpauth://totp/${label}?${params.toString()}`;
}

// Génère N codes de récupération en base32 (16 chars utiles, ~80 bits chacun),
// formatés XXXX-XXXX-XXXX-XXXX pour lecture humaine. Retourne les codes en clair :
// l'appelant doit les afficher une seule fois à l'utilisateur ET stocker leurs
// hashes bcrypt en DB (jamais le clair).
export function generateRecoveryCodes(count = RECOVERY_CODES_COUNT) {
  const codes = [];
  for (let i = 0; i < count; i++) {
    const raw = base32Encode(crypto.randomBytes(RECOVERY_CODE_BYTES));
    const groupSize = raw.length / RECOVERY_CODE_GROUPS;
    const grouped = [];
    for (let g = 0; g < RECOVERY_CODE_GROUPS; g++) {
      grouped.push(raw.slice(g * groupSize, (g + 1) * groupSize));
    }
    codes.push(grouped.join('-'));
  }
  return codes;
}

// Normalise un code recovery saisi par l'utilisateur (insensible à la casse,
// ignore espaces et tirets) avant comparaison/hashage.
export function normalizeRecoveryCode(input) {
  if (!input || typeof input !== 'string') return '';
  return input.toUpperCase().replace(/[\s-]/g, '');
}
