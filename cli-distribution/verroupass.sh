#!/bin/bash

# ============================================================================
# VerrouPass CLI - Lanceur Linux/Mac
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
cd "$SCRIPT_DIR"

echo "Vérification de l'environnement..."
echo ""

# ============================================================================
# Vérifier Node.js/npm
# ============================================================================

if ! command -v node &> /dev/null; then
    echo -e "${RED}[ERREUR] Node.js n'est pas installé.${NC}"
    echo ""
    echo "Veuillez installer Node.js depuis https://nodejs.org/"
    echo "Version recommandée: LTS (20.x ou supérieure)"
    echo ""
    echo "Après l'installation, relancez ce programme."
    echo ""
    read -p "Appuyez sur Entrée pour quitter..."
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo -e "${RED}[ERREUR] npm n'est pas installé.${NC}"
    echo ""
    echo "npm devrait être installé avec Node.js."
    echo "Veuillez réinstaller Node.js depuis https://nodejs.org/"
    echo ""
    read -p "Appuyez sur Entrée pour quitter..."
    exit 1
fi

NODE_VERSION=$(node --version)
NPM_VERSION=$(npm --version)

echo -e "Node.js: ${GREEN}${NODE_VERSION}${NC}"
echo -e "npm: ${GREEN}${NPM_VERSION}${NC}"
echo ""

# ============================================================================
# Vérifier et installer les dépendances
# ============================================================================

if [ ! -d "node_modules" ]; then
    echo "Installation des dépendances..."
    echo "Cela peut prendre quelques minutes la première fois."
    echo ""
    npm install --no-audit --no-fund

    if [ $? -ne 0 ]; then
        echo ""
        echo -e "${RED}[ERREUR] L'installation des dépendances a échoué.${NC}"
        echo ""
        read -p "Appuyez sur Entrée pour quitter..."
        exit 1
    fi

    echo ""
    echo "Installation terminée !"
    echo ""
fi

# ============================================================================
# Lancer VerrouPass CLI
# ============================================================================

clear
echo ""
echo "============================================================"
echo "  VerrouPass - Gestionnaire de mots de passe zero-knowledge"
echo "============================================================"
echo ""

# Lancer le CLI avec Node.js
node src/index.js "$@"

# Si aucun argument n'est passé, afficher l'aide
if [ $# -eq 0 ]; then
    echo ""
    echo "Pour utiliser VerrouPass, utilisez les commandes:"
    echo "  v-login      - Se connecter"
    echo "  v-list       - Lister vos mots de passe"
    echo "  v-get        - Récupérer un mot de passe"
    echo "  v-add        - Ajouter un mot de passe"
    echo "  v-generate   - Générer un mot de passe"
    echo ""
    echo "Ou installez globalement avec: sudo npm install -g ."
    echo ""
fi

# Pause si lancé depuis un raccourci
if [ -t 0 ]; then
    read -p "Appuyez sur Entrée pour quitter..."
fi
