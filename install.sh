#!/bin/bash

###############################################################################
# Script d'installation automatique de VerrouPass sur Ubuntu/Debian
#
# Usage: sudo bash install.sh
#
# Ce script installe et configure automatiquement:
# - Node.js 20.x
# - PostgreSQL
# - Nginx
# - PM2
# - Certbot
#
# IMPORTANT: Lisez ce script avant de l'exécuter !
###############################################################################

set -euo pipefail  # Arrêter en cas d'erreur, variable non définie, ou échec dans un pipe

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Vérifier que le script est exécuté en tant que root
if [ "$EUID" -ne 0 ]; then
    log_error "Ce script doit être exécuté en tant que root (utilisez sudo)"
    exit 1
fi

log_info "Début de l'installation de VerrouPass..."
echo ""

# Variables de configuration
APP_DIR="/var/www/verroupass"
APP_USER="verroupass"
DB_NAME="verroupass"
DB_USER="verroupass_user"

###############################################################################
# 1. Mise à jour du système
###############################################################################
log_info "Mise à jour du système..."
apt update && apt upgrade -y
log_success "Système mis à jour"

###############################################################################
# 2. Installation des dépendances système
###############################################################################
log_info "Installation des dépendances système..."
apt install -y curl wget git build-essential
log_success "Dépendances système installées"

###############################################################################
# 3. Installation de Node.js 20.x
###############################################################################
log_info "Installation de Node.js 20.x..."
if command -v node &> /dev/null; then
    log_warning "Node.js est déjà installé (version $(node --version))"
else
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
    log_success "Node.js $(node --version) installé"
fi

###############################################################################
# 4. Installation de PostgreSQL
###############################################################################
log_info "Installation de PostgreSQL..."
if command -v psql &> /dev/null; then
    log_warning "PostgreSQL est déjà installé"
else
    apt install -y postgresql postgresql-contrib
    systemctl start postgresql
    systemctl enable postgresql
    log_success "PostgreSQL installé et démarré"
fi

###############################################################################
# 5. Installation de Nginx
###############################################################################
log_info "Installation de Nginx..."
if command -v nginx &> /dev/null; then
    log_warning "Nginx est déjà installé"
else
    apt install -y nginx
    systemctl start nginx
    systemctl enable nginx
    log_success "Nginx installé et démarré"
fi

###############################################################################
# 6. Installation de PM2
###############################################################################
log_info "Installation de PM2..."
if command -v pm2 &> /dev/null; then
    log_warning "PM2 est déjà installé (version $(pm2 --version))"
else
    npm install -g pm2
    log_success "PM2 installé"
fi

###############################################################################
# 7. Installation de Certbot
###############################################################################
log_info "Installation de Certbot..."
if command -v certbot &> /dev/null; then
    log_warning "Certbot est déjà installé"
else
    apt install -y certbot python3-certbot-nginx
    log_success "Certbot installé"
fi

###############################################################################
# 8. Configuration du pare-feu
###############################################################################
log_info "Configuration du pare-feu (UFW)..."
if command -v ufw &> /dev/null; then
    ufw allow OpenSSH
    ufw allow 'Nginx Full'
    echo "y" | ufw enable
    log_success "Pare-feu configuré"
else
    log_warning "UFW n'est pas installé, ignoré"
fi

###############################################################################
# 9. Création de l'utilisateur application
###############################################################################
log_info "Création de l'utilisateur $APP_USER..."
if id "$APP_USER" &>/dev/null; then
    log_warning "L'utilisateur $APP_USER existe déjà"
else
    useradd -r -s /bin/bash -d /home/$APP_USER -m $APP_USER
    log_success "Utilisateur $APP_USER créé"
fi

###############################################################################
# 10. Création du répertoire de l'application
###############################################################################
log_info "Création du répertoire $APP_DIR..."
mkdir -p $APP_DIR
mkdir -p $APP_DIR/logs
chown -R $APP_USER:$APP_USER $APP_DIR
log_success "Répertoire de l'application créé"

###############################################################################
# 11. Configuration de PostgreSQL
###############################################################################
echo ""
log_info "Configuration de PostgreSQL..."
log_warning "Vous devez maintenant configurer la base de données manuellement"
echo ""
echo "Générez un mot de passe sécurisé pour la base de données:"
DB_PASSWORD=$(openssl rand -base64 32)
echo -e "${GREEN}Mot de passe généré: ${YELLOW}$DB_PASSWORD${NC}"
echo ""
echo "Exécutez les commandes suivantes:"
echo -e "${BLUE}sudo -u postgres psql -c \"CREATE DATABASE $DB_NAME;\"${NC}"
echo -e "${BLUE}sudo -u postgres psql -c \"CREATE USER $DB_USER WITH ENCRYPTED PASSWORD '$DB_PASSWORD';\"${NC}"
echo -e "${BLUE}sudo -u postgres psql -c \"GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;\"${NC}"
echo ""
read -p "Appuyez sur Entrée une fois la configuration terminée..."

###############################################################################
# 12. Récapitulatif
###############################################################################
echo ""
echo "=============================================================================="
log_success "Installation des composants terminée !"
echo "=============================================================================="
echo ""
echo "Prochaines étapes manuelles:"
echo ""
echo "1. Transférez votre code vers $APP_DIR:"
echo -e "   ${BLUE}scp -r * $APP_USER@votre-ip:$APP_DIR/${NC}"
echo ""
echo "2. Installez les dépendances:"
echo -e "   ${BLUE}cd $APP_DIR/server && npm install --production${NC}"
echo -e "   ${BLUE}cd $APP_DIR/client && npm install && npm run build${NC}"
echo ""
echo "3. Configurez le fichier .env:"
echo -e "   ${BLUE}cd $APP_DIR/server${NC}"
echo -e "   ${BLUE}cp .env.example .env${NC}"
echo -e "   ${BLUE}nano .env${NC}"
echo ""
echo "   DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME"
echo "   JWT_SECRET=$(openssl rand -hex 64)"
echo "   CLIENT_URL=https://votre-domaine.com"
echo ""
echo "4. Configurez Nginx:"
echo -e "   ${BLUE}cp $APP_DIR/nginx.conf /etc/nginx/sites-available/verroupass${NC}"
echo -e "   ${BLUE}ln -s /etc/nginx/sites-available/verroupass /etc/nginx/sites-enabled/${NC}"
echo -e "   ${BLUE}nginx -t && systemctl reload nginx${NC}"
echo ""
echo "5. Configurez SSL avec Certbot:"
echo -e "   ${BLUE}certbot --nginx -d votre-domaine.com${NC}"
echo ""
echo "6. Démarrez l'application avec PM2:"
echo -e "   ${BLUE}cd $APP_DIR && pm2 start ecosystem.config.js${NC}"
echo -e "   ${BLUE}pm2 startup && pm2 save${NC}"
echo ""
echo "=============================================================================="
log_info "Pour plus de détails, consultez le fichier DEPLOY.md"
echo "=============================================================================="
echo ""
