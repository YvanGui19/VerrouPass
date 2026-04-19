#!/bin/bash

###############################################################################
# Script pour afficher les statistiques de la base de données VerrouPass
#
# Usage: ./db-stats.sh
###############################################################################

set -euo pipefail

# Couleurs pour les messages
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
DB_NAME="verroupass"

echo -e "${BLUE}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║    STATISTIQUES BASE DE DONNÉES VERROUPASS        ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════╝${NC}"
echo ""

# Statistiques générales
echo -e "${YELLOW}═══ Statistiques générales ═══${NC}"
sudo -u postgres psql "$DB_NAME" -c "
SELECT
  'Nombre d''utilisateurs' AS statistique,
  COUNT(*) AS valeur
FROM users
UNION ALL
SELECT
  'Nombre de mots de passe stockés' AS statistique,
  COUNT(*) AS valeur
FROM vault_items;
" -P pager=off

echo ""
echo -e "${YELLOW}═══ Taille de la base de données ═══${NC}"
sudo -u postgres psql "$DB_NAME" -c "
SELECT
  pg_size_pretty(pg_database_size('$DB_NAME')) AS \"Taille totale\";
" -P pager=off

echo ""
echo -e "${YELLOW}═══ Taille des tables ═══${NC}"
sudo -u postgres psql "$DB_NAME" -c "
SELECT
  schemaname AS schema,
  tablename AS \"Table\",
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS \"Taille\"
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
" -P pager=off

echo ""
echo -e "${YELLOW}═══ Utilisateurs les plus actifs ═══${NC}"
sudo -u postgres psql "$DB_NAME" -c "
SELECT
  u.email,
  COUNT(v.id) AS \"Nombre de mots de passe\",
  MAX(v.created_at) AS \"Dernière activité\"
FROM users u
LEFT JOIN vault_items v ON u.id = v.user_id
GROUP BY u.email
ORDER BY COUNT(v.id) DESC
LIMIT 10;
" -P pager=off

echo ""
echo -e "${YELLOW}═══ Connexions actives ═══${NC}"
sudo -u postgres psql "$DB_NAME" -c "
SELECT
  COUNT(*) AS \"Connexions actives\"
FROM pg_stat_activity
WHERE datname = '$DB_NAME';
" -P pager=off

echo ""
