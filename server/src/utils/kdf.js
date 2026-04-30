// Constantes liées au KDF (Key Derivation Function) côté serveur.
// Le KDF est exécuté côté client : le serveur ne dérive jamais le master
// password. Ce module sert uniquement à :
//   - identifier le KDF d'un utilisateur (users.kdf_version)
//   - servir les paramètres par défaut via /api/auth/kdf-info
//   - typer les paramètres acceptés à l'inscription / migration

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
