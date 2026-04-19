# Guide de démarrage rapide - VerrouPass

Ce guide vous permet de déployer rapidement VerrouPass sur votre VPS en 15 minutes.

## Prérequis

- Un VPS Ubuntu 20.04+ ou Debian 11+
- Un nom de domaine pointant vers votre VPS
- Accès SSH root ou sudo
- 1GB de RAM minimum

## Étape 1 : Préparation (2 min)

Connectez-vous à votre VPS :

```bash
ssh root@votre-ip-vps
```

## Étape 2 : Installation automatique (5 min)

Transférez le script d'installation et exécutez-le :

```bash
# Depuis votre machine locale
scp install.sh root@votre-ip:/root/

# Sur le VPS
chmod +x install.sh
sudo bash install.sh
```

Le script installe automatiquement :
- Node.js 20
- PostgreSQL
- Nginx
- PM2
- Certbot

Suivez les instructions pour configurer PostgreSQL et notez le mot de passe généré.

## Étape 3 : Transférer votre code (2 min)

Depuis votre machine locale :

```bash
# Depuis le dossier du projet
scp -r * root@votre-ip:/var/www/verroupass/
```

Ou avec rsync (recommandé) :

```bash
rsync -avz --exclude 'node_modules' --exclude 'dist' --exclude '.git' ./ root@votre-ip:/var/www/verroupass/
```

## Étape 4 : Configuration (3 min)

Sur le VPS :

```bash
cd /var/www/verroupass

# Configurer le serveur
cd server
cp .env.production .env
nano .env
```

Modifiez ces valeurs dans `.env` :

```env
DATABASE_URL=postgresql://verroupass_user:VOTRE_MOT_DE_PASSE@localhost:5432/verroupass
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
CLIENT_URL=https://verroupass.votredomaine.com
```

## Étape 5 : Installation des dépendances (2 min)

```bash
# Installer les dépendances du serveur
cd /var/www/verroupass/server
npm install --production

# Installer et builder le client
cd /var/www/verroupass/client
npm install
npm run build
```

## Étape 6 : Configuration Nginx (1 min)

```bash
# Copier la configuration
sudo cp /var/www/verroupass/nginx.conf /etc/nginx/sites-available/verroupass

# Modifier le nom de domaine
sudo nano /etc/nginx/sites-available/verroupass
# Remplacez "verroupass.votredomaine.com" par votre vrai domaine

# Activer la configuration
sudo ln -s /etc/nginx/sites-available/verroupass /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Étape 7 : Configuration SSL (2 min)

```bash
sudo certbot --nginx -d verroupass.votredomaine.com
```

Suivez les instructions et choisissez de rediriger HTTP vers HTTPS.

## Étape 8 : Démarrer l'application (1 min)

```bash
cd /var/www/verroupass

# Démarrer avec PM2
pm2 start ecosystem.config.js

# Configurer le démarrage automatique
pm2 startup
pm2 save

# Vérifier que tout fonctionne
pm2 status
pm2 logs verroupass
```

## Étape 9 : Tester l'application (1 min)

Ouvrez votre navigateur et accédez à :

**https://verroupass.votredomaine.com**

Créez votre premier compte et commencez à stocker vos mots de passe !

## Vérifications

### L'application ne s'affiche pas ?

```bash
# Vérifier que le serveur tourne
pm2 status

# Vérifier les logs
pm2 logs verroupass

# Vérifier Nginx
sudo systemctl status nginx
sudo nginx -t
```

### Erreur de connexion à la base de données ?

```bash
# Vérifier PostgreSQL
sudo systemctl status postgresql

# Tester la connexion
psql -U verroupass_user -d verroupass -h localhost
```

### Erreur 502 Bad Gateway ?

```bash
# Redémarrer l'application
pm2 restart verroupass

# Vérifier que le port 3001 est libre
sudo lsof -i :3001
```

## Commandes utiles

```bash
# Voir les logs en temps réel
pm2 logs verroupass

# Redémarrer l'application
pm2 restart verroupass

# Arrêter l'application
pm2 stop verroupass

# Sauvegarder la base de données
/var/www/verroupass/scripts/backup.sh

# Voir les statistiques de la DB
/var/www/verroupass/scripts/db-stats.sh
```

## Sécurité post-installation

### 1. Désactiver l'accès SSH root

```bash
sudo nano /etc/ssh/sshd_config
# Modifier: PermitRootLogin no
sudo systemctl restart ssh
```

### 2. Installer fail2ban

```bash
sudo apt install -y fail2ban
sudo systemctl enable fail2ban
```

### 3. Configurer les sauvegardes automatiques

```bash
crontab -e
# Ajouter cette ligne pour une sauvegarde quotidienne à 2h
0 2 * * * /var/www/verroupass/scripts/backup.sh
```

## Prochaines étapes

1. **Créez votre compte** et ajoutez vos premiers mots de passe
2. **Configurez les sauvegardes automatiques** (voir ci-dessus)
3. **Surveillez les logs** régulièrement : `pm2 logs verroupass`
4. **Gardez le système à jour** : `sudo apt update && sudo apt upgrade`
5. **Lisez la documentation complète** : [DEPLOY.md](./DEPLOY.md)

## Besoin d'aide ?

- Documentation complète : [DEPLOY.md](./DEPLOY.md)
- Documentation serveur : [server/README.md](./server/README.md)
- Documentation client : [client/README.md](./client/README.md)
- Scripts utiles : [scripts/README.md](./scripts/README.md)

---

**Félicitations ! Votre gestionnaire de mots de passe est en ligne ! 🎉**
