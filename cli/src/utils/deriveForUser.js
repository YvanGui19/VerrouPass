/**
 * Helper de derivation "user-aware" cote CLI.
 *
 * Interroge /api/auth/kdf-info pour savoir quel KDF utiliser pour un email
 * donne (PBKDF2 legacy ou Argon2id), puis derive avec le bon algo. Equivalent
 * exact du helper cote web (client/src/utils/deriveForUser.js) pour garantir
 * que les memes credentials produisent les memes cles entre CLI et navigateur.
 *
 * Utilise par : loginCommand, deleteAccountCommand.
 */

import {
  deriveKeys,
  deriveKeysArgon2id,
  decodeKdfSalt,
  KDF_VERSION
} from './crypto.js';
import { kdfInfo } from './api.js';

export async function deriveKeysForUser(masterPassword, email) {
  const info = await kdfInfo(email);

  if (info.kdfVersion === KDF_VERSION.PBKDF2_SHA256_600K) {
    const keys = await deriveKeys(masterPassword, email);
    return { ...keys, kdfInfo: info };
  }
  if (info.kdfVersion === KDF_VERSION.ARGON2ID) {
    if (!info.kdfSalt) {
      throw new Error('Reponse /kdf-info incomplete : kdfSalt manquant');
    }
    const salt = decodeKdfSalt(info.kdfSalt);
    const keys = await deriveKeysArgon2id(masterPassword, salt, info.kdfParams);
    return { ...keys, kdfInfo: info };
  }
  throw new Error(`KDF version inconnue: ${info.kdfVersion}`);
}
