-- Script SQL pour initialiser la base de données VerrouPass
--
-- Usage:
-- psql -U verroupass_user -d verroupass -f db-setup.sql
--
-- Ou depuis un autre utilisateur:
-- sudo -u postgres psql verroupass < db-setup.sql

-- Création de la table users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Création de la table vault_items
CREATE TABLE IF NOT EXISTS vault_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  encrypted_data TEXT NOT NULL,
  iv VARCHAR(64) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_vault_user ON vault_items(user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Commentaires pour la documentation
COMMENT ON TABLE users IS 'Stockage des utilisateurs avec authentification';
COMMENT ON TABLE vault_items IS 'Stockage chiffré des mots de passe (zero-knowledge)';
COMMENT ON COLUMN vault_items.encrypted_data IS 'Données chiffrées côté client (AES-256-GCM)';
COMMENT ON COLUMN vault_items.iv IS 'Vecteur d''initialisation pour le chiffrement';

-- Afficher un message de confirmation
SELECT 'Base de données initialisée avec succès!' AS status;
