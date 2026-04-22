/**
 * TOTP Implementation (RFC 6238)
 * Pure client-side TOTP code generation using Web Crypto API
 * Zero external dependencies
 */

/**
 * Decode a base32-encoded string to Uint8Array
 * TOTP secrets are typically base32-encoded
 * @param {string} base32 - Base32 encoded string
 * @returns {Uint8Array} - Decoded bytes
 */
export function base32Decode(base32) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  // Normalize: uppercase, remove spaces and dashes, strip padding
  const cleaned = base32.toUpperCase().replace(/[\s-]/g, '').replace(/=+$/, '');

  let bits = '';
  for (const char of cleaned) {
    const index = alphabet.indexOf(char);
    if (index === -1) {
      throw new Error(`Invalid base32 character: ${char}`);
    }
    bits += index.toString(2).padStart(5, '0');
  }

  const bytes = new Uint8Array(Math.floor(bits.length / 8));
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(bits.slice(i * 8, (i + 1) * 8), 2);
  }

  return bytes;
}

/**
 * Generate HMAC-SHA1 using Web Crypto API
 * @param {Uint8Array} key - Secret key bytes
 * @param {Uint8Array} data - Data to sign
 * @returns {Promise<Uint8Array>} - HMAC signature
 */
async function hmacSha1(key, data) {
  const cryptoKey = await window.crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );

  const signature = await window.crypto.subtle.sign('HMAC', cryptoKey, data);
  return new Uint8Array(signature);
}

/**
 * Generate a TOTP code following RFC 6238
 * @param {string} secret - Base32-encoded secret
 * @param {number} timeStep - Time step in seconds (default 30)
 * @param {number} digits - Number of digits (default 6)
 * @param {number} timestamp - Unix timestamp in ms (default now)
 * @returns {Promise<string>} - TOTP code (zero-padded)
 */
export async function generateTOTP(secret, timeStep = 30, digits = 6, timestamp = Date.now()) {
  // Decode the base32 secret
  const keyBytes = base32Decode(secret);

  // Calculate time counter (number of time steps since epoch)
  const counter = Math.floor(timestamp / 1000 / timeStep);

  // Convert counter to 8-byte big-endian buffer
  const counterBuffer = new ArrayBuffer(8);
  const counterView = new DataView(counterBuffer);
  // Use two 32-bit writes for compatibility (BigInt not needed)
  counterView.setUint32(0, Math.floor(counter / 0x100000000), false);
  counterView.setUint32(4, counter >>> 0, false);

  // Generate HMAC-SHA1
  const hmac = await hmacSha1(keyBytes, new Uint8Array(counterBuffer));

  // Dynamic truncation (RFC 4226 Section 5.4)
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary = (
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff)
  );

  // Generate digits
  const otp = binary % Math.pow(10, digits);
  return otp.toString().padStart(digits, '0');
}

/**
 * Get remaining seconds until next TOTP code refresh
 * @param {number} timeStep - Time step in seconds (default 30)
 * @returns {number} - Seconds remaining (1-30)
 */
export function getTimeRemaining(timeStep = 30) {
  return timeStep - (Math.floor(Date.now() / 1000) % timeStep);
}

/**
 * Validate a TOTP secret format (base32)
 * @param {string} secret - Secret to validate
 * @returns {boolean} - True if valid format
 */
export function validateTOTPSecret(secret) {
  if (!secret || typeof secret !== 'string') return false;
  const cleaned = secret.toUpperCase().replace(/[\s-=]/g, '');
  const validChars = /^[A-Z2-7]+$/;
  // Minimum 16 characters for reasonable security (80 bits)
  return validChars.test(cleaned) && cleaned.length >= 16;
}

/**
 * Parse otpauth:// URI (standard format from QR codes)
 * Format: otpauth://totp/Label?secret=XXX&issuer=YYY
 * @param {string} uri - otpauth URI
 * @returns {Object|null} - Parsed data or null if invalid
 */
export function parseOTPAuthURI(uri) {
  try {
    const url = new URL(uri);
    if (url.protocol !== 'otpauth:') return null;
    if (url.host !== 'totp') return null;

    const secret = url.searchParams.get('secret');
    const issuer = url.searchParams.get('issuer');
    const label = decodeURIComponent(url.pathname.slice(1));

    if (!secret || !validateTOTPSecret(secret)) return null;

    return { secret: secret.toUpperCase(), issuer, label };
  } catch {
    return null;
  }
}

/**
 * Format a TOTP code for display (add space in middle)
 * @param {string} code - 6-digit code
 * @returns {string} - Formatted code "123 456"
 */
export function formatTOTPCode(code) {
  if (!code || code.length !== 6) return code;
  return `${code.slice(0, 3)} ${code.slice(3)}`;
}
