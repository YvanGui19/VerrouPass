-- Migration 003 : ajout du salt KDF par utilisateur
--
-- À appliquer manuellement sur la base prod :
--   psql "$DATABASE_URL" -f server/migrations/003_add_kdf_salt.sql
--
-- Ajout idempotent (IF NOT EXISTS) pour pouvoir rejouer sans erreur.
--
-- Colonne :
--   kdf_salt BYTEA : 16 bytes aléatoires générés à l'inscription Argon2id.
--                    Servi au client via /api/auth/kdf-info pour qu'il puisse
--                    re-dériver les clés à chaque login. Nullable car les
--                    comptes legacy PBKDF2 (kdf_version=1) utilisent un salt
--                    déterministe = email.lower() et n'en ont pas besoin.
--                    Devient NOT NULL implicitement à la migration v1 -> v2
--                    (le code applicatif garantit qu'un compte v2 a un salt).
--
-- Pourquoi un salt aléatoire par utilisateur (alors que PBKDF2 utilisait
-- l'email) :
--   - OWASP Cryptographic Storage Cheat Sheet recommande explicitement un
--     salt aléatoire >= 16 bytes par mot de passe.
--   - Empêche un attaquant qui connaît l'email d'une cible de précomputer
--     une rainbow table contre le salt déterministe AVANT d'avoir accès
--     à la DB.
--   - Le coût d'Argon2id (64 MiB par tentative) rend cette précomputation
--     déjà très chère, mais la défense en profondeur exige un salt random.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS kdf_salt BYTEA;
