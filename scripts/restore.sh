#!/bin/bash

###############################################################################
# Script de restauration de la base de données VerrouPass
#
# Usage: ./restore.sh fichier_sauvegarde.sql.gz
#
# ATTENTION: Cette opération écrase toutes les données actuelles !
###############################################################################

set -euo pipefail

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Configuration
DB_NAME="verroupass"

# Vérifier qu'un fichier a été fourni
if [ -z "$1" ]; then
    echo -e "${RED}Erreur: Veuillez spécifier un fichier de sauvegarde${NC}"
    echo "Usage: ./restore.sh fichier_sauvegarde.sql.gz"
    exit 1
fi

BACKUP_FILE="$1"

# Vérifier que le fichier existe
if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}Erreur: Le fichier '$BACKUP_FILE' n'existe pas${NC}"
    exit 1
fi

echo -e "${YELLOW}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${YELLOW}║         RESTAURATION DE BASE DE DONNÉES           ║${NC}"
echo -e "${YELLOW}╚════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${RED}⚠ ATTENTION ⚠${NC}"
echo "Cette opération va ÉCRASER toutes les données actuelles"
echo "de la base de données '$DB_NAME' !"
echo ""
echo "Fichier de sauvegarde: $BACKUP_FILE"
echo ""
read -p "Êtes-vous sûr de vouloir continuer ? (tapez 'oui' pour confirmer): " CONFIRM

if [ "$CONFIRM" != "oui" ]; then
    echo -e "${YELLOW}Opération annulée${NC}"
    exit 0
fi

echo ""
echo -e "${YELLOW}Démarrage de la restauration...${NC}"

# Arrêter l'application si elle tourne
if command -v pm2 &> /dev/null; then
    echo "Arrêt de l'application..."
    pm2 stop verroupass || true
fi

# Décompresser si nécessaire
TEMP_FILE=""
if [[ "$BACKUP_FILE" == *.gz ]]; then
    echo "Décompression de la sauvegarde..."
    TEMP_FILE="/tmp/restore_temp_$(date +%s).sql"
    gunzip -c "$BACKUP_FILE" > "$TEMP_FILE"
    RESTORE_FILE="$TEMP_FILE"
else
    RESTORE_FILE="$BACKUP_FILE"
fi

# Restaurer la base de données
echo "Restauration de la base de données..."
if sudo -u postgres psql "$DB_NAME" < "$RESTORE_FILE"; then
    echo ""
    echo -e "${GREEN}✓ Restauration réussie !${NC}"

    # Nettoyer le fichier temporaire
    if [ -n "$TEMP_FILE" ]; then
        rm -f "$TEMP_FILE"
    fi

    # Redémarrer l'application
    if command -v pm2 &> /dev/null; then
        echo "Redémarrage de l'application..."
        pm2 restart verroupass
    fi

    echo ""
    echo -e "${GREEN}La base de données a été restaurée avec succès${NC}"
else
    echo ""
    echo -e "${RED}✗ Erreur lors de la restauration${NC}"

    # Nettoyer le fichier temporaire
    if [ -n "$TEMP_FILE" ]; then
        rm -f "$TEMP_FILE"
    fi

    # Essayer de redémarrer l'application
    if command -v pm2 &> /dev/null; then
        pm2 restart verroupass || true
    fi

    exit 1
fi
