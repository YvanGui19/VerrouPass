// Helpers de dérivation de clés "user-aware" : ils interrogent
// /api/auth/kdf-info pour savoir quel KDF utiliser, puis dérivent.
//
// Utilisé par tous les flows qui partent de (email, masterPassword) sur
// un compte existant : login, unlockVault, change-password (vérification
// de l'ancien mdp), delete-account, totp-disable.
//
// Pas utilisé pour register : un nouveau compte est toujours en Argon2id
// avec un salt random généré localement (cf useAuth.register).

import {
  deriveKeys,
  deriveKeysArgon2id,
  decodeKdfSalt,
  KDF_VERSION
} from './crypto';
import { authApi } from './api';

/**
 * Dérive les clés en utilisant les paramètres KDF déjà connus (par exemple
 * récupérés une fois au début d'un flow change-password puis réutilisés).
 *
 * @param {string} masterPassword
 * @param {string} email - utilisé uniquement comme salt pour le KDF v1
 * @param {{kdfVersion:number, kdfParams:object, kdfSalt:string|null}} kdfInfo
 * @returns {Promise<{authKey: CryptoKey, encKey: CryptoKey}>}
 */
export async function deriveKeysWithKnownKdf(masterPassword, email, kdfInfo) {
  if (kdfInfo.kdfVersion === KDF_VERSION.PBKDF2_SHA256_600K) {
    return await deriveKeys(masterPassword, email);
  }
  if (kdfInfo.kdfVersion === KDF_VERSION.ARGON2ID) {
    if (!kdfInfo.kdfSalt) {
      throw new Error('kdfInfo Argon2id incomplet : kdfSalt manquant');
    }
    const salt = decodeKdfSalt(kdfInfo.kdfSalt);
    return await deriveKeysArgon2id(masterPassword, salt, kdfInfo.kdfParams);
  }
  throw new Error(`KDF version inconnue: ${kdfInfo.kdfVersion}`);
}

/**
 * Interroge /kdf-info puis dérive les clés. Retourne aussi le kdfInfo
 * pour que l'appelant puisse le réutiliser (ex: change-password qui
 * doit re-dériver avec le même algo pour le nouveau mdp).
 *
 * @param {string} masterPassword
 * @param {string} email
 * @returns {Promise<{authKey: CryptoKey, encKey: CryptoKey, kdfInfo: object}>}
 */
export async function deriveKeysForUser(masterPassword, email) {
  const kdfInfo = await authApi.kdfInfo(email);
  const keys = await deriveKeysWithKnownKdf(masterPassword, email, kdfInfo);
  return { ...keys, kdfInfo };
}
