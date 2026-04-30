# Guide de Déploiement - VerrouPass

Ce guide vous explique comment déployer VerrouPass sur votre VPS Ubuntu/Debian.

## Table des matières

1. [Prérequis](#prérequis)
2. [Préparation du VPS](#préparation-du-vps)
3. [Installation des dépendances](#installation-des-dépendances)
4. [Configuration de PostgreSQL](#configuration-de-postgresql)
5. [Déploiement de l'application](#déploiement-de-lapplication)
6. [Configuration Nginx](#configuration-nginx)
7. [Configuration SSL avec Let's Encrypt](#configuration-ssl)
8. [Gestion avec PM2](#gestion-avec-pm2)
9. [Maintenance](#maintenance)

---

## Prérequis

- Un VPS Ubuntu 20.04+ ou Debian 11+
- Un nom de domaine pointant vers votre VPS (ex: verroupass.votredomaine.com)
- Accès SSH root ou sudo
- Au moins 1GB de RAM recommandé

---

## Préparation du VPS

### 1. Connexion et mise à jour du système

```bash
ssh root@votre-ip-vps

# Mise à jour du système
apt update && apt upgrade -y
```

### 2. Création d'un utilisateur non-root (recommandé)

```bash
# Créer un nouvel utilisateur
adduser verroupass
usermod -aG sudo verroupass

# Se connecter avec le nouvel utilisateur
su - verroupass
```

### 3. Configuration du pare-feu

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

---

## Installation des dépendances

### 1. Installation de Node.js 20.x

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Vérifier l'installation
node --version  # doit afficher v20.x.x
npm --version
```

### 2. Installation de PostgreSQL

```bash
sudo apt install -y postgresql postgresql-contrib

# Démarrer PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Vérifier le statut
sudo systemctl status postgresql
```

### 3. Installation de Nginx

```bash
sudo apt install -y nginx

# Démarrer Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 4. Installation de PM2 (gestionnaire de processus Node.js)

```bash
sudo npm install -g pm2
```

### 5. Installation de Certbot (pour SSL)

```bash
sudo apt install -y certbot python3-certbot-nginx
```

---

## Configuration de PostgreSQL

### 1. Créer la base de données et l'utilisateur

```bash
# Se connecter à PostgreSQL
sudo -u postgres psql

# Dans le shell PostgreSQL, exécuter:
CREATE DATABASE verroupass;
CREATE USER verroupass_user WITH ENCRYPTED PASSWORD 'VOTRE_MOT_DE_PASSE_SECURISE';
GRANT ALL PRIVILEGES ON DATABASE verroupass TO verroupass_user;
\q
```

### 2. Noter les informations de connexion

```
Database: verroupass
User: verroupass_user
Password: VOTRE_MOT_DE_PASSE_SECURISE
Host: localhost
Port: 5432
```

**URL de connexion :**
```
postgresql://verroupass_user:VOTRE_MOT_DE_PASSE_SECURISE@localhost:5432/verroupass
```

---

## Déploiement de l'application

### 1. Créer le répertoire de l'application

```bash
sudo mkdir -p /var/www/verroupass
sudo chown $USER:$USER /var/www/verroupass
cd /var/www/verroupass
```

### 2. Cloner ou transférer votre code

**Option A : Avec Git**
```bash
git clone https://github.com/votre-repo/verroupass.git .
```

**Option B : Avec SCP (depuis votre machine locale)**
```bash
# Sur votre machine locale (depuis le dossier du projet):
scp -r * verroupass@votre-ip:/var/www/verroupass/
```

**Option C : Avec SFTP**
```bash
# Utilisez FileZilla ou WinSCP pour transférer les fichiers
```

### 3. Installer les dépendances du serveur

```bash
cd /var/www/verroupass/server
npm install --production
```

### 4. Installer les dépendances du client et builder

```bash
cd /var/www/verroupass/client
npm install
npm run build
```

Le dossier `dist` contient maintenant votre application React compilée.

### 5. Configurer les variables d'environnement

```bash
cd /var/www/verroupass/server
cp .env.example .env
nano .env
```

Modifier le fichier `.env` avec vos valeurs de production :

```env
# Server
PORT=3001
NODE_ENV=production

# Database
DATABASE_URL=postgresql://verroupass_user:VOTRE_MOT_DE_PASSE_SECURISE@localhost:5432/verroupass

# JWT - GÉNÉRER UNE CLÉ ALÉATOIRE SÉCURISÉE
JWT_SECRET=CHANGEZ_CETTE_CLE_PAR_UNE_VALEUR_ALEATOIRE_TRES_LONGUE_ET_SECURISEE
JWT_EXPIRES_IN=7d

# 2FA / TOTP - clé maître AES-256-GCM pour chiffrer les secrets TOTP au repos
# Le serveur refuse de démarrer si elle est absente ou mal formée (32 bytes hex).
TOTP_ENCRYPTION_KEY=GENERER_AVEC_OPENSSL_RAND_HEX_32

# Admin - token statique requis par POST /api/admin/invitation pour
# générer les codes d'invitation. Sans lui, aucun nouvel utilisateur ne
# peut s'inscrire (l'inscription par invitation est le seul mode
# supporté). Doit faire au moins 32 caractères.
ADMIN_INVITATION_TOKEN=GENERER_AVEC_NODE_RANDOM_BYTES_32_HEX

# CORS
CLIENT_URL=https://verroupass.votredomaine.com
```

**Pour générer un JWT_SECRET sécurisé :**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Pour générer TOTP_ENCRYPTION_KEY :**
```bash
openssl rand -hex 32
```

**Pour générer ADMIN_INVITATION_TOKEN :**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

> ⚠️ **Ne jamais regénérer TOTP_ENCRYPTION_KEY après mise en service** : tous les
> secrets TOTP enregistrés deviendraient indéchiffrables et les utilisateurs avec
> 2FA active seraient bloqués. La sauvegarder dans un coffre.

> 💡 **`ADMIN_INVITATION_TOKEN` peut être régénéré** : il invalide juste
> les codes d'invitation déjà émis (qui de toute façon expirent au bout
> de 15 min en RAM). Aucune donnée utilisateur n'est touchée.

### Générer un code d'invitation pour le premier compte

Une fois le serveur démarré, utilisez `ADMIN_INVITATION_TOKEN` pour
générer un code valide 15 minutes :

```bash
TOKEN=$(grep ^ADMIN_INVITATION_TOKEN= /var/www/verroupass/server/.env | cut -d= -f2-)
curl -X POST -H "x-admin-token: $TOKEN" https://verroupass.votredomaine.com/api/admin/invitation
```

Réponse :

```json
{ "code": "xxxx-xxxx-xxxx-xxxx", "expiresAt": "...", "ttlMinutes": 15 }
```

Allez ensuite sur `/register` avec ce code pour créer le premier compte.

### 6. Initialiser la base de données

```bash
cd /var/www/verroupass/server
node src/index.js
# Appuyez sur Ctrl+C après quelques secondes (les tables sont créées)
```

---

## Configuration Nginx

### 1. Créer la configuration Nginx

```bash
sudo nano /etc/nginx/sites-available/verroupass
```

Coller la configuration suivante :

```nginx
server {
    listen 80;
    server_name verroupass.votredomaine.com;

    # Client (React App)
    location / {
        root /var/www/verroupass/client/dist;
        try_files $uri $uri/ /index.html;

        # Cache pour les assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # API Backend
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Limite de taille des uploads
    client_max_body_size 10M;
}
```

### 2. Activer la configuration

```bash
# Créer un lien symbolique
sudo ln -s /etc/nginx/sites-available/verroupass /etc/nginx/sites-enabled/

# Tester la configuration
sudo nginx -t

# Redémarrer Nginx
sudo systemctl reload nginx
```

---

## Configuration SSL avec Let's Encrypt

### 1. Obtenir un certificat SSL gratuit

```bash
sudo certbot --nginx -d verroupass.votredomaine.com
```

Suivez les instructions :
- Entrez votre email
- Acceptez les conditions
- Choisissez de rediriger HTTP vers HTTPS (recommandé)

### 2. Renouvellement automatique

Le certificat se renouvelle automatiquement. Vérifier avec :

```bash
sudo certbot renew --dry-run
```

---

## Gestion avec PM2

### 1. Créer la configuration PM2

```bash
cd /var/www/verroupass
nano ecosystem.config.js
```

Coller le contenu suivant :

```javascript
module.exports = {
  apps: [{
    name: 'verroupass',
    cwd: '/var/www/verroupass/server',
    script: 'src/index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production'
    },
    error_file: '/var/www/verroupass/logs/error.log',
    out_file: '/var/www/verroupass/logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};
```

### 2. Créer le dossier des logs

```bash
mkdir -p /var/www/verroupass/logs
```

### 3. Démarrer l'application avec PM2

```bash
cd /var/www/verroupass
pm2 start ecosystem.config.js

# Vérifier le statut
pm2 status

# Voir les logs
pm2 logs verroupass
```

### 4. Configurer PM2 pour démarrer au boot

```bash
pm2 startup
# Suivre les instructions affichées

# Sauvegarder la configuration actuelle
pm2 save
```

---

## Maintenance

### Commandes utiles

**PM2 :**
```bash
pm2 status                    # Statut de l'application
pm2 logs verroupass          # Voir les logs en temps réel
pm2 restart verroupass       # Redémarrer l'application
pm2 stop verroupass          # Arrêter l'application
pm2 delete verroupass        # Supprimer l'application de PM2
```

**Nginx :**
```bash
sudo systemctl status nginx   # Statut de Nginx
sudo nginx -t                 # Tester la configuration
sudo systemctl reload nginx   # Recharger la configuration
sudo systemctl restart nginx  # Redémarrer Nginx
```

**PostgreSQL :**
```bash
sudo systemctl status postgresql    # Statut de PostgreSQL
sudo -u postgres psql               # Se connecter à PostgreSQL
```

### Mise à jour de l'application

```bash
cd /var/www/verroupass

# Sauvegarder la base de données
sudo -u postgres pg_dump verroupass > backup_$(date +%Y%m%d).sql

# Mettre à jour le code (si Git)
git pull

# Mettre à jour les dépendances du serveur
cd server
npm install --production

# Rebuild le client
cd ../client
npm install
npm run build

# Redémarrer l'application
pm2 restart verroupass
```

### Sauvegarde de la base de données

**Sauvegarde manuelle :**
```bash
sudo -u postgres pg_dump verroupass > backup_verroupass_$(date +%Y%m%d).sql
```

**Sauvegarde automatique (crontab) :**
```bash
crontab -e

# Ajouter cette ligne pour une sauvegarde quotidienne à 2h du matin
0 2 * * * sudo -u postgres pg_dump verroupass > /var/backups/verroupass_$(date +\%Y\%m\%d).sql
```

### Restauration de la base de données

```bash
sudo -u postgres psql verroupass < backup_verroupass_20260417.sql
```

### Surveillance des logs

```bash
# Logs de l'application
pm2 logs verroupass

# Logs Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Logs PostgreSQL
sudo tail -f /var/log/postgresql/postgresql-*.log
```

### Vérification de l'utilisation des ressources

```bash
# Utilisation CPU/RAM
htop

# Espace disque
df -h

# Processus PM2
pm2 monit
```

---

## Sécurité supplémentaire

### 1. Désactiver l'accès root SSH

```bash
sudo nano /etc/ssh/sshd_config
```

Modifier :
```
PermitRootLogin no
```

Redémarrer SSH :
```bash
sudo systemctl restart ssh
```

### 2. Installer fail2ban (protection contre les attaques brute-force)

```bash
sudo apt install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 3. Mise à jour automatique de sécurité

```bash
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

---

## Dépannage

### L'application ne démarre pas

```bash
# Vérifier les logs PM2
pm2 logs verroupass

# Vérifier si le port 3001 est utilisé
sudo lsof -i :3001

# Vérifier la connexion à PostgreSQL
sudo -u postgres psql -c "SELECT version();"
```

### Nginx retourne 502 Bad Gateway

```bash
# Vérifier que l'application tourne
pm2 status

# Vérifier les logs Nginx
sudo tail -f /var/log/nginx/error.log

# Redémarrer l'application
pm2 restart verroupass
```

### Impossible de se connecter à la base de données

```bash
# Vérifier que PostgreSQL tourne
sudo systemctl status postgresql

# Vérifier les identifiants dans .env
cat /var/www/verroupass/server/.env

# Tester la connexion manuellement
psql -U verroupass_user -d verroupass -h localhost
```

---

## Accéder à votre application

Une fois tout configuré, accédez à votre application via :

**https://verroupass.votredomaine.com**

Créez votre premier compte et commencez à stocker vos mots de passe en toute sécurité !

---

## Support

Pour toute question ou problème :
- Vérifiez les logs : `pm2 logs verroupass`
- Consultez la documentation PostgreSQL, Nginx, et PM2
- Assurez-vous que votre nom de domaine pointe correctement vers votre VPS

---

**Note importante sur la sécurité :**
- Changez TOUS les mots de passe par défaut
- Utilisez un JWT_SECRET vraiment aléatoire et long
- Gardez votre système à jour
- Faites des sauvegardes régulières de votre base de données
- Ne partagez jamais vos clés ou mots de passe
