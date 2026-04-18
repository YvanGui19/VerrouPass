#!/bin/bash

# ============================================================================
# VerrouPass CLI - Installation Linux/Mac
# ============================================================================

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Obtenir le répertoire du script
INSTALL_DIR="$(cd "$(dirname "$0")" && pwd)"

echo ""
echo "============================================================"
echo "  Installation de VerrouPass CLI"
echo "============================================================"
echo ""

# ============================================================================
# Vérifier Node.js/npm
# ============================================================================

echo -e "${BOLD}[1/4] Vérification de Node.js et npm...${NC}"
echo ""

if ! command -v node &> /dev/null; then
    echo -e "${RED}[ERREUR] Node.js n'est pas installé.${NC}"
    echo ""
    echo "Veuillez installer Node.js depuis https://nodejs.org/"
    echo "Version recommandée: LTS (20.x ou supérieure)"
    echo ""
    echo "Sur Ubuntu/Debian:"
    echo "  curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -"
    echo "  sudo apt-get install -y nodejs"
    echo ""
    echo "Sur Fedora/RHEL:"
    echo "  sudo dnf install nodejs"
    echo ""
    echo "Sur macOS (avec Homebrew):"
    echo "  brew install node"
    echo ""
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo -e "${RED}[ERREUR] npm n'est pas installé.${NC}"
    echo ""
    echo "npm devrait être installé avec Node.js."
    echo "Veuillez réinstaller Node.js depuis https://nodejs.org/"
    echo ""
    exit 1
fi

NODE_VERSION=$(node --version)
NPM_VERSION=$(npm --version)

echo -e "   Node.js: ${GREEN}${NODE_VERSION}${NC}"
echo -e "   npm: ${GREEN}${NPM_VERSION}${NC}"
echo -e "   ${GREEN}OK${NC}"
echo ""

# ============================================================================
# Installer les dépendances
# ============================================================================

echo -e "${BOLD}[2/4] Installation des dépendances npm...${NC}"
echo "   Cela peut prendre quelques minutes..."
echo ""

cd "$INSTALL_DIR"
npm install --no-audit --no-fund

if [ $? -ne 0 ]; then
    echo ""
    echo -e "${RED}[ERREUR] L'installation des dépendances a échoué.${NC}"
    echo ""
    exit 1
fi

echo ""
echo -e "   ${GREEN}OK${NC}"
echo ""

# ============================================================================
# Créer les raccourcis (optionnel)
# ============================================================================

echo -e "${BOLD}[3/4] Création des raccourcis (optionnel)${NC}"
echo ""

# Détecter l'OS
OS="$(uname -s)"
CREATE_DESKTOP=false
CREATE_MENU=false

# Demander pour le raccourci Bureau
if [ "$OS" = "Linux" ]; then
    read -p "Créer un raccourci sur le Bureau ? (o/N): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[OoYy]$ ]]; then
        CREATE_DESKTOP=true

        # Créer le fichier .desktop pour le bureau
        DESKTOP_FILE="$HOME/Desktop/VerrouPass.desktop"

        cat > "$DESKTOP_FILE" << EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=VerrouPass
Comment=Gestionnaire de mots de passe zero-knowledge
Exec=$INSTALL_DIR/verroupass.sh
Icon=dialog-password
Terminal=true
Categories=Utility;Security;
EOF

        chmod +x "$DESKTOP_FILE"

        if [ -f "$DESKTOP_FILE" ]; then
            # Marquer comme trusted sur GNOME
            if command -v gio &> /dev/null; then
                gio set "$DESKTOP_FILE" metadata::trusted true 2>/dev/null || true
            fi
            echo -e "   ${GREEN}Raccourci Bureau créé${NC}"
        else
            echo -e "   ${RED}Raccourci Bureau: ECHEC${NC}"
        fi
    else
        echo "   Raccourci Bureau ignoré"
    fi

    echo ""

    # Demander pour le menu applications
    read -p "Créer un raccourci dans le menu Applications ? (o/N): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[OoYy]$ ]]; then
        CREATE_MENU=true

        # Créer le dossier si nécessaire
        mkdir -p "$HOME/.local/share/applications"

        # Créer le fichier .desktop pour le menu
        MENU_FILE="$HOME/.local/share/applications/verroupass.desktop"

        cat > "$MENU_FILE" << EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=VerrouPass
Comment=Gestionnaire de mots de passe zero-knowledge
Exec=$INSTALL_DIR/verroupass.sh
Icon=dialog-password
Terminal=true
Categories=Utility;Security;
EOF

        chmod +x "$MENU_FILE"

        if [ -f "$MENU_FILE" ]; then
            echo -e "   ${GREEN}Raccourci Menu Applications créé${NC}"
        else
            echo -e "   ${RED}Raccourci Menu Applications: ECHEC${NC}"
        fi
    else
        echo "   Raccourci Menu Applications ignoré"
    fi
else
    echo "   Raccourcis non supportés sur macOS"
    echo "   Vous pouvez utiliser ./verroupass.sh ou l'installation globale"
fi

echo ""

# ============================================================================
# Proposer l'installation globale
# ============================================================================

echo -e "${BOLD}[4/4] Installation globale (optionnel)${NC}"
echo ""
echo "Voulez-vous installer VerrouPass globalement ?"
echo "Cela vous permettra d'utiliser les commandes v-login, v-list, etc."
echo "depuis n'importe quel terminal."
echo ""

read -p "Installer globalement ? (o/N): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[OoYy]$ ]]; then
    echo ""
    echo "Installation globale en cours..."

    # Vérifier si sudo est nécessaire
    if npm install -g . 2>/dev/null; then
        echo ""
        echo -e "${GREEN}Installation globale réussie !${NC}"
        echo "Vous pouvez maintenant utiliser les commandes v-login, v-list, etc."
        echo "depuis n'importe quel terminal."
    else
        echo ""
        echo "Les permissions administrateur sont nécessaires."
        echo "Tentative avec sudo..."
        sudo npm install -g .

        if [ $? -eq 0 ]; then
            echo ""
            echo -e "${GREEN}Installation globale réussie !${NC}"
            echo "Vous pouvez maintenant utiliser les commandes v-login, v-list, etc."
            echo "depuis n'importe quel terminal."
        else
            echo ""
            echo -e "${YELLOW}L'installation globale a échoué.${NC}"
            echo "Vous pouvez l'essayer manuellement avec: sudo npm install -g ."
        fi
    fi
else
    echo ""
    echo "Installation globale ignorée."
    echo "Vous pouvez toujours utiliser ./verroupass.sh"
fi

# ============================================================================
# Fin de l'installation
# ============================================================================

echo ""
echo "============================================================"
echo "  Installation terminée !"
echo "============================================================"
echo ""

# Afficher les raccourcis créés
if [ "$CREATE_DESKTOP" = true ] || [ "$CREATE_MENU" = true ]; then
    echo "Raccourcis créés:"
    [ "$CREATE_DESKTOP" = true ] && echo "  - Bureau: VerrouPass.desktop"
    [ "$CREATE_MENU" = true ] && echo "  - Menu Applications: VerrouPass"
    echo ""
fi

echo "Pour lancer VerrouPass:"

if [ "$CREATE_DESKTOP" = true ] || [ "$CREATE_MENU" = true ]; then
    echo "  - Double-cliquez sur le raccourci VerrouPass"
fi

echo "  - Exécutez: ./verroupass.sh (depuis ce dossier)"

if command -v v-login &> /dev/null; then
    echo "  - Utilisez les commandes v-login, v-list, v-get, etc. depuis un terminal"
fi

echo ""
