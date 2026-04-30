// Constantes liées au KDF (Key Derivation Function) côté serveur.
// Le KDF est exécuté côté client : le serveur ne dérive jamais le master
// password. Ce module sert uniquement à :
//   - identifier le KDF d'un utilisateur (users.kdf_version)
//   - servir les paramètres par défaut via /api/auth/kdf-info
//   - générer / dériver le salt KDF (16 bytes par utilisateur)
//   - typer les paramètres acceptés à l'inscription / migration

import crypto from 'crypto';

// Identifiants stockés dans users.kdf_version (cf migration 002).
export const KDF_VERSION = Object.freeze({
  PBKDF2_SHA256_600K: 1,
  ARGON2ID: 2
});

// Paramètres Argon2id par défaut servis aux nouveaux clients.
// RFC 9106 "third recommended option" / OWASP 2024 navigateur.
// p=1 imposé par libsodium (mono-thread) côté client.
export const ARGON2ID_DEFAULT_PARAMS = Object.freeze({
  m: 65536,  // KiB (64 MiB)
  t: 3,      // itérations
  p: 1       // parallélisme
});

// Longueur du salt KDF en bytes (libsodium crypto_pwhash_SALTBYTES = 16).
export const KDF_SALT_LEN = 16;

// Validation stricte d'un objet kdfParams reçu côté API.
// Garde-fou contre des paramètres dégénérés (ex: m=1, t=1) qui
// affaibliraient irrémédiablement le compte. Fourchettes larges mais
// pas absurdes.
export function isValidArgon2idParams(params) {
  if (!params || typeof params !== 'object') return false;
  const { m, t, p } = params;
  if (!Number.isInteger(m) || !Number.isInteger(t) || !Number.isInteger(p)) return false;
  // m : entre 19 MiB (OWASP min) et 1 GiB
  if (m < 19456 || m > 1048576) return false;
  // t : entre 1 et 10 (au-delà = UX inacceptable)
  if (t < 1 || t > 10) return false;
  // p : libsodium force 1 ; rejeter toute autre valeur
  if (p !== 1) return false;
  return true;
}

// Génère un salt KDF cryptographiquement aléatoire (16 bytes).
// Utilisé à l'inscription Argon2id. Stocké tel quel en DB (BYTEA), envoyé
// au client en base64 via /kdf-info.
export function generateKdfSalt() {
  return crypto.randomBytes(KDF_SALT_LEN);
}

// Cle HMAC pour calculer le salt deterministe des emails inconnus
// (anti-enumeration via /kdf-info). Lue depuis l'env au premier appel.
// Si KDF_SALT_HMAC_KEY n'est pas definie, fallback sur une cle aleatoire
// generee au boot : effective pour la session courante mais change au
// restart serveur. Un warning est affiche pour pousser a configurer
// proprement l'env var.
let _hmacKey = null;
function getHmacKey() {
  if (_hmacKey) return _hmacKey;

  const envKey = process.env.KDF_SALT_HMAC_KEY;
  if (envKey && /^[0-9a-fA-F]{64}$/.test(envKey)) {
    _hmacKey = Buffer.from(envKey, 'hex');
    return _hmacKey;
  }

  // Fallback : cle aleatoire au boot. Solide pour la session, change
  // au restart (acceptable : aucun secret persistant ne depend de cette
  // cle, elle ne sert qu'a stabiliser la reponse anti-enum).
  console.warn(
    '[KDF] KDF_SALT_HMAC_KEY absent ou mal forme (32 bytes hex requis). ' +
    'Fallback sur cle aleatoire au boot. Configurer .env pour stabiliser ' +
    'le salt anti-enumeration entre redemarrages.'
  );
  _hmacKey = crypto.randomBytes(32);
  return _hmacKey;
}

// Calcule un salt KDF deterministe pour un email inconnu.
// HMAC-SHA256(KDF_SALT_HMAC_KEY, email.lower())[0..16]. Le client recoit
// un salt indistinguable d'un vrai salt random (16 bytes opaques).
// Repete pour le meme email = meme reponse a chaque fois (impossible de
// distinguer "user inconnu" de "user existant" en repetant l'appel).
export function kdfSaltForUnknownEmail(email) {
  const normalized = email.toLowerCase();
  const mac = crypto.createHmac('sha256', getHmacKey());
  mac.update(normalized, 'utf8');
  return mac.digest().slice(0, KDF_SALT_LEN);
}
