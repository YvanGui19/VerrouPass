-- Migration 002 : ajout du suivi du KDF (Key Derivation Function) par utilisateur
--
-- À appliquer manuellement sur la base prod :
--   psql "$DATABASE_URL" -f server/migrations/002_add_kdf_to_users.sql
--
-- Ajout idempotent (IF NOT EXISTS) pour pouvoir rejouer sans erreur.
-- Le KDF est exécuté côté client (le serveur ne voit jamais le master password).
-- Cette colonne sert uniquement au pré-login (endpoint /api/auth/kdf-info)
-- pour indiquer au client quel algo + quels paramètres utiliser.
--
-- Colonnes :
--   kdf_version : 1 = PBKDF2-SHA256-600k (legacy), 2 = Argon2id (RFC 9106)
--                 DEFAULT 1 pour ne pas casser les comptes existants ; les
--                 nouveaux comptes inséreront 2 explicitement.
--   kdf_params  : JSONB nullable. Pour Argon2id : { "m": 65536, "t": 3, "p": 4 }
--                 (mémoire en KiB, itérations, parallélisme). NULL pour PBKDF2
--                 dont les paramètres sont figés (600k iterations SHA-256).

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS kdf_version SMALLINT NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS kdf_params JSONB;
