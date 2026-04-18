#!/bin/bash

###############################################################################
# Script de sauvegarde de la base de données VerrouPass
#
# Usage: ./backup.sh [nom_fichier_optionnel]
#
# Crée une sauvegarde complète de la base de données PostgreSQL
###############################################################################

set -e

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Configuration
DB_NAME="verroupass"
BACKUP_DIR="/var/backups/verroupass"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Nom du fichier de sauvegarde
if [ -z "$1" ]; then
    BACKUP_FILE="${BACKUP_DIR}/backup_${TIMESTAMP}.sql"
else
    BACKUP_FILE="${BACKUP_DIR}/$1"
fi

# Créer le répertoire de sauvegarde s'il n'existe pas
mkdir -p "$BACKUP_DIR"

echo -e "${YELLOW}Démarrage de la sauvegarde de la base de données...${NC}"
echo "Base de données: $DB_NAME"
echo "Fichier: $BACKUP_FILE"
echo ""

# Effectuer la sauvegarde
if sudo -u postgres pg_dump "$DB_NAME" > "$BACKUP_FILE"; then
    # Compresser la sauvegarde
    gzip -f "$BACKUP_FILE"
    BACKUP_FILE="${BACKUP_FILE}.gz"

    # Afficher les informations
    SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo ""
    echo -e "${GREEN}✓ Sauvegarde réussie !${NC}"
    echo "Fichier: $BACKUP_FILE"
    echo "Taille: $SIZE"
    echo ""

    # Supprimer les anciennes sauvegardes (garder les 30 derniers jours)
    find "$BACKUP_DIR" -name "backup_*.sql.gz" -type f -mtime +30 -delete
    echo -e "${YELLOW}Anciennes sauvegardes (> 30 jours) supprimées${NC}"
else
    echo ""
    echo -e "${RED}✗ Erreur lors de la sauvegarde${NC}"
    exit 1
fi
