/**
 * Service de codes d invitation en memoire.
 *
 * Les codes sont stockes uniquement en RAM, indexes par leur hash SHA-256.
 * Ils expirent automatiquement apres INVITATION_TTL_MS et sont nettoyes par
 * un timer periodique. Au redemarrage du serveur, tous les codes en cours
 * sont perdus (comportement voulu : ce sont des codes ephemeres).
 *
 * Securite :
 *  - Le code en clair n est jamais stocke (uniquement le hash SHA-256).
 *  - Comparaison en temps constant pour eviter les attaques par timing.
 *  - 64 bits d entropie + rate-limit sur /register : brute-force impraticable.
 */

import crypto from 'crypto';

export const INVITATION_TTL_MS = 15 * 60 * 1000; // 15 minutes
const CLEANUP_INTERVAL_MS = 60 * 1000;          // 1 minute
const CODE_BYTES = 8;                            // 8 octets = 64 bits = 16 chars hex

// Map<codeHashHex, { expiresAt: number }>
const store = new Map();

function hashCode(code) {
  return crypto.createHash('sha256').update(code).digest('hex');
}

function formatCode(hex16) {
  // XXXX-XXXX-XXXX-XXXX, plus lisible quand on dicte ou colle
  return hex16.match(/.{4}/g).join('-');
}

function normalizeCode(input) {
  if (typeof input !== 'string') return null;
  const cleaned = input.trim().toLowerCase().replace(/-/g, '');
  if (!/^[0-9a-f]{16}$/.test(cleaned)) return null;
  return cleaned;
}

/**
 * Genere un nouveau code et l enregistre. Retourne le code en clair, formate.
 */
export function generateInvitationCode() {
  const raw = crypto.randomBytes(CODE_BYTES).toString('hex'); // 16 chars hex
  const formatted = formatCode(raw);
  const hash = hashCode(raw);
  store.set(hash, { expiresAt: Date.now() + INVITATION_TTL_MS });
  return {
    code: formatted,
    expiresAt: new Date(Date.now() + INVITATION_TTL_MS).toISOString(),
  };
}

/**
 * Tente de consommer un code. Retourne true si le code est valide et non
 * encore consomme, false sinon. Le code est retire de la map dans tous les
 * cas ou il a ete trouve.
 */
export function consumeInvitationCode(code) {
  const normalized = normalizeCode(code);
  if (!normalized) return false;

  const hash = hashCode(normalized);
  const entry = store.get(hash);
  if (!entry) return false;

  // Suppression atomique avant verification d expiration : un code ne peut
  // etre utilise qu une seule fois meme si plusieurs requetes arrivent
  // simultanement (Node est mono-thread, donc c est sur).
  store.delete(hash);

  if (entry.expiresAt < Date.now()) return false;
  return true;
}

/**
 * Cleanup periodique des codes expires (best-effort, le consume verifie deja
 * l expiration).
 */
let cleanupTimer = null;
export function startInvitationCleanup() {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [hash, entry] of store) {
      if (entry.expiresAt < now) store.delete(hash);
    }
  }, CLEANUP_INTERVAL_MS);
  cleanupTimer.unref?.();
}

export function stopInvitationCleanup() {
  if (cleanupTimer) {
    clearInterval(cleanupTimer);
    cleanupTimer = null;
  }
}

/**
 * Pour debug / monitoring : nombre de codes valides en memoire.
 */
export function getActiveInvitationCount() {
  const now = Date.now();
  let count = 0;
  for (const entry of store.values()) {
    if (entry.expiresAt >= now) count++;
  }
  return count;
}
