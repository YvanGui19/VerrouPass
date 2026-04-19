#!/bin/bash

###############################################################################
# Script de build du client VerrouPass (React + Vite)
#
# Usage: ./build.sh [environment]
#
# Arguments:
#   environment : "production" (défaut) ou "development"
#
# Ce script:
# 1. Installe les dépendances npm
# 2. Build l'application React avec Vite
# 3. Optimise les assets pour la production
# 4. Crée le dossier dist/ prêt pour le déploiement
###############################################################################

set -euo pipefail  # Arrêter en cas d'erreur, variable non définie, ou échec dans un pipe

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Fonction pour afficher les messages
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Environnement (production par défaut)
ENV=${1:-production}

log_info "Début du build du client VerrouPass"
log_info "Environnement: $ENV"
echo ""

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "package.json" ]; then
    log_error "Le fichier package.json n'existe pas. Exécutez ce script depuis le dossier client/"
    exit 1
fi

###############################################################################
# 1. Installation des dépendances
###############################################################################
log_info "Installation des dépendances npm..."
if [ "$ENV" == "production" ]; then
    npm ci --production=false  # Installer aussi les devDependencies pour le build
else
    npm install
fi
log_success "Dépendances installées"

###############################################################################
# 2. Copier le fichier d'environnement approprié
###############################################################################
if [ -f ".env.$ENV" ]; then
    log_info "Copie du fichier .env.$ENV vers .env"
    cp ".env.$ENV" .env
    log_success "Fichier d'environnement configuré"
else
    log_warning "Le fichier .env.$ENV n'existe pas, utilisation de .env existant ou valeurs par défaut"
fi

###############################################################################
# 3. Nettoyage du dossier dist précédent
###############################################################################
if [ -d "dist" ]; then
    log_info "Nettoyage du dossier dist/ existant..."
    rm -rf dist
    log_success "Dossier dist/ nettoyé"
fi

###############################################################################
# 4. Build de l'application
###############################################################################
log_info "Build de l'application React avec Vite..."
if [ "$ENV" == "production" ]; then
    npm run build
else
    npm run build -- --mode development
fi
log_success "Build terminé"

###############################################################################
# 5. Vérification du build
###############################################################################
log_info "Vérification du build..."
if [ ! -d "dist" ]; then
    log_error "Le dossier dist/ n'a pas été créé. Le build a échoué."
    exit 1
fi

if [ ! -f "dist/index.html" ]; then
    log_error "Le fichier dist/index.html n'existe pas. Le build est incomplet."
    exit 1
fi

# Afficher la taille du build
DIST_SIZE=$(du -sh dist | cut -f1)
log_success "Taille du build: $DIST_SIZE"

###############################################################################
# 6. Récapitulatif
###############################################################################
echo ""
echo "=============================================================================="
log_success "Build terminé avec succès !"
echo "=============================================================================="
echo ""
echo "Le dossier dist/ contient votre application prête pour le déploiement."
echo ""
echo "Contenu du dossier dist/:"
ls -lh dist/ | tail -n +2
echo ""
echo "Pour tester localement:"
echo -e "  ${BLUE}npm run preview${NC}"
echo ""
echo "Pour déployer sur votre VPS:"
echo -e "  ${BLUE}scp -r dist/* user@vps:/var/www/verroupass/client/dist/${NC}"
echo ""
echo "Ou utilisez rsync pour une synchronisation plus efficace:"
echo -e "  ${BLUE}rsync -avz --delete dist/ user@vps:/var/www/verroupass/client/dist/${NC}"
echo ""
echo "=============================================================================="
