#!/bin/bash

# ============================================================================
# VerrouPass CLI - Désinstallation Linux/Mac
# ============================================================================

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Obtenir le répertoire du script
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo ""
echo "============================================================"
echo "  Désinstallation de VerrouPass CLI"
echo "============================================================"
echo ""
echo "Que souhaitez-vous désinstaller ?"
echo ""
echo "  1) Désinstallation standard (recommandé)"
echo "     - Supprime les raccourcis"
echo "     - Désinstalle la version globale"
echo "     - Supprime les dépendances npm"
echo "     - Conserve les fichiers sources et votre configuration"
echo ""
echo "  2) Désinstallation complète"
echo "     - Tout ce qui précède +"
echo "     - Supprime TOUS les fichiers sources"
echo "     - Supprime votre configuration utilisateur (~/.config/verroupass-cli/)"
echo "     - ATTENTION: Suppression définitive !"
echo ""
echo "  3) Annuler"
echo ""

read -p "Votre choix (1/2/3): " -n 1 -r CHOICE
echo ""
echo ""

FULL_UNINSTALL=false

case $CHOICE in
    1)
        echo "Désinstallation standard..."
        ;;
    2)
        echo -e "${YELLOW}ATTENTION: Désinstallation complète${NC}"
        echo "Tous les fichiers sources et votre configuration seront supprimés."
        echo ""
        read -p "Êtes-vous VRAIMENT sûr ? (tapez 'oui' pour confirmer): " CONFIRM
        if [ "$CONFIRM" = "oui" ]; then
            FULL_UNINSTALL=true
            echo ""
            echo "Désinstallation complète..."
        else
            echo ""
            echo "Désinstallation annulée."
            exit 0
        fi
        ;;
    3|*)
        echo "Désinstallation annulée."
        exit 0
        ;;
esac

echo ""

# Supprimer le raccourci Bureau
if [ -f "$HOME/Desktop/VerrouPass.desktop" ]; then
    rm "$HOME/Desktop/VerrouPass.desktop"
    echo -e "${GREEN}Raccourci Bureau supprimé${NC}"
fi

# Supprimer le raccourci Menu Applications
if [ -f "$HOME/.local/share/applications/verroupass.desktop" ]; then
    rm "$HOME/.local/share/applications/verroupass.desktop"
    echo -e "${GREEN}Raccourci Menu Applications supprimé${NC}"
fi

# Désinstaller la version globale
if command -v v-login &> /dev/null; then
    echo ""
    echo "Désinstallation de la version globale..."

    # Essayer sans sudo d'abord
    if npm uninstall -g verroupass-cli 2>/dev/null; then
        echo -e "${GREEN}Version globale désinstallée${NC}"
    else
        # Essayer avec sudo
        echo "Les permissions administrateur sont nécessaires."
        sudo npm uninstall -g verroupass-cli
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}Version globale désinstallée${NC}"
        else
            echo -e "${YELLOW}La désinstallation globale a échoué${NC}"
            echo "Vous pouvez essayer manuellement: sudo npm uninstall -g verroupass-cli"
        fi
    fi
fi

# Supprimer node_modules
if [ -d "$SCRIPT_DIR/node_modules" ]; then
    echo ""
    echo "Suppression des dépendances..."
    rm -rf "$SCRIPT_DIR/node_modules"
    echo -e "${GREEN}Dépendances supprimées${NC}"
fi

# Supprimer package-lock.json
if [ -f "$SCRIPT_DIR/package-lock.json" ]; then
    rm "$SCRIPT_DIR/package-lock.json"
fi

# Si désinstallation complète, supprimer tout
if [ "$FULL_UNINSTALL" = true ]; then
    echo ""
    echo "Suppression de la configuration utilisateur..."

    # Supprimer la configuration utilisateur
    if [ -d "$HOME/.config/verroupass-cli" ]; then
        rm -rf "$HOME/.config/verroupass-cli"
        echo -e "${GREEN}Configuration utilisateur supprimée${NC}"
    fi

    echo ""
    echo "Suppression des fichiers sources..."

    # Sauvegarder le répertoire parent
    PARENT_DIR="$(dirname "$SCRIPT_DIR")"
    FOLDER_NAME="$(basename "$SCRIPT_DIR")"

    # Aller dans le répertoire parent pour pouvoir supprimer le dossier
    cd "$PARENT_DIR"

    # Supprimer tout le dossier
    rm -rf "$SCRIPT_DIR"

    echo ""
    echo "============================================================"
    echo "  Désinstallation complète terminée"
    echo "============================================================"
    echo ""
    echo -e "${GREEN}VerrouPass CLI a été complètement supprimé.${NC}"
    echo "Le dossier '$FOLDER_NAME' a été supprimé."
    echo ""
else
    echo ""
    echo "============================================================"
    echo "  Désinstallation terminée"
    echo "============================================================"
    echo ""
    echo "VerrouPass CLI a été désinstallé."
    echo ""
    echo "Fichiers conservés:"
    echo "  - Fichiers sources (dans ce dossier)"
    echo "  - Configuration utilisateur (~/.config/verroupass-cli/)"
    echo ""
    echo "Pour supprimer complètement, vous pouvez:"
    echo "  - Relancer ce script et choisir l'option 2"
    echo "  - Ou supprimer manuellement ce dossier"
    echo ""
fi
