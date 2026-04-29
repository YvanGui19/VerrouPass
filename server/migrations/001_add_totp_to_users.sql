-- Migration 001 : ajout du support TOTP (2FA) sur la table users
--
-- À appliquer manuellement sur la base prod :
--   psql "$DATABASE_URL" -f server/migrations/001_add_totp_to_users.sql
--
-- Ajout idempotent (IF NOT EXISTS) pour pouvoir rejouer sans erreur.
-- Colonnes :
--   totp_secret_enc            : secret TOTP chiffré AES-256-GCM (base64), NULL tant que 2FA non activé
--   totp_secret_iv             : IV 12 bytes du chiffrement (base64), NULL tant que 2FA non activé
--   totp_secret_tag            : tag d'auth GCM 16 bytes (base64), NULL tant que 2FA non activé
--   totp_enabled               : flag d'activation effective (après vérif d'un code à l'enable)
--   totp_recovery_codes_hashed : tableau de hashes bcrypt des recovery codes restants (single-use)

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS totp_secret_enc TEXT,
  ADD COLUMN IF NOT EXISTS totp_secret_iv TEXT,
  ADD COLUMN IF NOT EXISTS totp_secret_tag TEXT,
  ADD COLUMN IF NOT EXISTS totp_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS totp_recovery_codes_hashed TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
