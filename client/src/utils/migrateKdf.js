// Migration silencieuse PBKDF2 -> Argon2id côté client.
//
// Déclenchée par useAuth juste après un login réussi sur un compte legacy
// (kdf_version=1). Le mot de passe maître est inchangé, mais on re-dérive
// les clés avec Argon2id (nouveau salt random) et on re-chiffre tout le
// coffre. Le serveur valide via /api/auth/migrate-kdf.
//
// Atomicité : si le client crashe ou la requête échoue avant que le serveur
// COMMIT la transaction, l'état DB reste sur PBKDF2 -> retry au prochain
// login (idempotent côté serveur via 409 si déjà v2).

import {
  deriveKeysArgon2id,
  hashForServer,
  encrypt,
  decrypt,
  generateKdfSalt,
  ARGON2ID_DEFAULT_PARAMS,
  KDF_VERSION
} from './crypto';
import api, { authApi } from './api';

/**
 * Migre le compte courant vers Argon2id.
 *
 * @param {string} masterPassword - mdp en clair, encore en mémoire après login
 * @param {string} email - email du user (pour usage interne uniquement)
 * @param {CryptoKey} oldEncKey - encKey PBKDF2 actuelle (pour déchiffrer)
 * @param {string} oldPasswordHash - hash PBKDF2 envoyé au serveur (proof-of-knowledge)
 * @returns {Promise<{newEncKey: CryptoKey, kdfVersion: number, kdfParams: object, kdfSalt: Uint8Array}>}
 */
export async function migrateAccountToArgon2id(masterPassword, email, oldEncKey, oldPasswordHash) {
  // 1. Récupérer tout le coffre avec l'ancienne session.
  // GET /api/vault renvoie { items: [...] } avec des clés snake_case
  // (encrypted_data, iv) comme stockées en DB.
  const itemsResp = await api.get('/vault');
  const items = (itemsResp.data && itemsResp.data.items) || [];

  // 2. Déchiffrer chaque item avec l'ancienne encKey (en mémoire).
  const decryptedItems = [];
  for (const item of items) {
    const data = await decrypt(item.encrypted_data, item.iv, oldEncKey);
    decryptedItems.push({ id: item.id, data });
  }

  // 3. Générer un salt random 16B et dériver les nouvelles clés Argon2id.
  const newSalt = generateKdfSalt();
  const { authKey: newAuthKey, encKey: newEncKey } =
    await deriveKeysArgon2id(masterPassword, newSalt, ARGON2ID_DEFAULT_PARAMS);
  const newPasswordHash = await hashForServer(newAuthKey);

  // 4. Re-chiffrer chaque item avec la nouvelle encKey (nouvel IV à chaque fois).
  const reencryptedItems = [];
  for (const { id, data } of decryptedItems) {
    const { encryptedData, iv } = await encrypt(data, newEncKey);
    reencryptedItems.push({ id, encryptedData, iv });
  }

  // 5. Envoyer la transaction au serveur (atomique : tout ou rien).
  const newSaltBase64 = btoa(String.fromCharCode.apply(null, newSalt));
  await authApi.migrateKdf({
    oldPasswordHash,
    newPasswordHash,
    kdfVersion: KDF_VERSION.ARGON2ID,
    kdfParams: ARGON2ID_DEFAULT_PARAMS,
    kdfSalt: newSaltBase64,
    reencryptedItems
  });

  return {
    newEncKey,
    kdfVersion: KDF_VERSION.ARGON2ID,
    kdfParams: ARGON2ID_DEFAULT_PARAMS,
    kdfSalt: newSalt
  };
}
