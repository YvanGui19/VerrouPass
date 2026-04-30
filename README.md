# VerrouPass

Un gestionnaire de mots de passe **zero-knowledge** securise, open-source, et auto-heberge.

## Qu'est-ce que VerrouPass ?

VerrouPass est une application web qui vous permet de stocker tous vos mots de passe en toute securite. L'architecture **zero-knowledge** garantit que personne, pas meme le serveur, ne peut lire vos mots de passe.

### Caracteristiques principales

- **Zero-knowledge** : Le serveur ne peut jamais lire vos mots de passe
- **Chiffrement AES-256-GCM** : Standard militaire de chiffrement
- **Argon2id** : derivation de cles via libsodium (RFC 9106, m=64 MiB, t=3, p=1) avec salt random 16B per-user. Comptes legacy PBKDF2-600k migres silencieusement.
- **Auto-heberge** : Vos donnees restent sur votre serveur
- **Interface moderne** : Design epure avec Tailwind CSS
- **CLI disponible** : Interface en ligne de commande pour terminaux
- **Generateur de mots de passe** : Creez des mots de passe securises
- **Recherche rapide** : Trouvez vos entrees instantanement
- **Open-source** : Code transparent et auditable

## Architecture

### Stack Technique

**Backend (serveur)**
- Node.js 20+ & Express.js
- PostgreSQL
- JWT pour l'authentification
- bcrypt pour les mots de passe utilisateurs

**Frontend (client)**
- React 18 avec Vite
- Tailwind CSS
- Web Crypto API pour le chiffrement
- React Router v6

**CLI (interface en ligne de commande)**
- Node.js avec Commander.js
- Chiffrement identique au client web
- Copie automatique dans le presse-papiers
- Interface interactive avec Inquirer.js

### Comment fonctionne le zero-knowledge ?

1. **Inscription/Connexion** :
   - Vous creez un mot de passe maitre
   - Deux cles sont derivees : une pour l'authentification, une pour le chiffrement
   - Seule la cle d'authentification (hashee) est envoyee au serveur
   - La cle de chiffrement reste dans votre navigateur

2. **Stockage des mots de passe** :
   - Vos mots de passe sont chiffres dans votre navigateur (AES-256-GCM)
   - Le serveur stocke uniquement les donnees chiffrees
   - Meme l'administrateur du serveur ne peut pas les lire

3. **Recuperation** :
   - Vous vous reconnectez avec votre mot de passe maitre
   - La cle de chiffrement est re-derivee localement
   - Vos donnees sont dechiffrees dans votre navigateur

## Demarrage rapide

### Prerequis

- Node.js 20+
- PostgreSQL 13+
- Un VPS Ubuntu/Debian (pour le deploiement)
- Un nom de domaine (optionnel mais recommande)

### Installation en local (developpement)

1. **Cloner le projet** :
```bash
git clone https://github.com/YvanGui19/VerrouPass.git
cd verroupass
```

2. **Configurer et demarrer le serveur** :
```bash
cd server
npm install
cp .env.example .env
# Editer .env avec vos parametres PostgreSQL
npm run dev
```

3. **Configurer et demarrer le client** :
```bash
cd client
npm install
npm run dev
```

4. **Acceder a l'application** :
Ouvrir http://localhost:5173

### Utilisation avec la CLI

```bash
cd cli
npm install
npm run install-global

# Utiliser la CLI
v-login
v-ls
v-cat GitHub -c
```

Voir [cli/QUICK_START.md](./cli/QUICK_START.md) pour plus de details.

### Deploiement sur VPS

Consultez le guide complet de deploiement : **[DEPLOY.md](./DEPLOY.md)**

**Resume rapide** :
```bash
# Sur votre VPS, executer le script d'installation
sudo bash install.sh

# Transferer votre code
scp -r * user@vps:/var/www/verroupass/

# Installer et builder
cd /var/www/verroupass/server && npm install --production
cd /var/www/verroupass/client && npm install && npm run build

# Configurer et demarrer
cp server/.env.production server/.env
# Editer server/.env avec vos valeurs
pm2 start ecosystem.config.js
```

## Structure du projet

```
verroupass/
├── client/                  # Application React (frontend)
│   ├── src/
│   │   ├── components/      # Composants React
│   │   ├── hooks/           # Hooks personnalises
│   │   └── utils/           # Utilitaires (crypto, api)
│   ├── build.sh             # Script de build
│   └── README.md
│
├── server/                  # API Node.js (backend)
│   ├── src/
│   │   ├── models/          # Modeles de donnees
│   │   ├── routes/          # Routes API
│   │   └── middleware/      # Middleware Express
│   └── README.md
│
├── cli/                     # Interface en ligne de commande
│   ├── src/
│   │   ├── commands/        # Commandes CLI
│   │   └── utils/           # Utilitaires (crypto, api, config)
│   ├── QUICK_START.md       # Demarrage rapide
│   └── README.md
│
├── scripts/                 # Scripts de gestion
│   ├── backup.sh            # Sauvegarde de la DB
│   ├── restore.sh           # Restauration de la DB
│   ├── db-setup.sql         # Initialisation de la DB
│   └── db-stats.sh          # Statistiques de la DB
│
├── nginx.conf               # Configuration Nginx
├── ecosystem.config.js      # Configuration PM2
├── install.sh               # Script d'installation VPS
├── DEPLOY.md                # Guide de deploiement complet
└── README.md                # Ce fichier
```

## Documentation

- **[Guide de deploiement](./DEPLOY.md)** : Deploiement complet sur VPS
- **[README Serveur](./server/README.md)** : Documentation de l'API backend
- **[README Client](./client/README.md)** : Documentation du frontend React
- **[README CLI](./cli/README.md)** : Documentation de l'interface en ligne de commande
- **[Scripts](./scripts/README.md)** : Documentation des scripts de gestion

## Fonctionnalites

### Pour les utilisateurs

**Interface web :**
- Creer un compte securise
- Ajouter des mots de passe avec :
  - Nom de l'application/service
  - Identifiant ou email
  - Mot de passe
  - URL du site
  - Notes supplementaires
- Modifier les entrees existantes
- Supprimer des entrees
- Rechercher dans le coffre
- Generer des mots de passe securises
- Copier les mots de passe dans le presse-papiers
- Afficher/masquer les mots de passe

**Interface CLI (ligne de commande) :**
- Toutes les fonctionnalites de l'interface web
- Copie automatique dans le presse-papiers
- Interface interactive ou avec options
- Scriptable pour l'automatisation
- Rapide et legere

### Pour les administrateurs

- Installation automatisee (script `install.sh`)
- Gestion avec PM2 (redemarrage automatique)
- Sauvegardes automatiques de la base de donnees
- Logs centralises
- Statistiques de la base de donnees
- Configuration SSL avec Let's Encrypt
- Reverse proxy avec Nginx

## Securite

### Mesures de securite implementees

- **Chiffrement zero-knowledge** : AES-256-GCM cote client
- **Derivation de cles** : Argon2id (RFC 9106, libsodium, m=64 MiB, t=3, p=1, salt random 16B per-user). Comptes legacy PBKDF2-600k auto-migres au prochain login.
- **Hash des mots de passe** : bcrypt avec 12 rounds sur le passwordHash transmis
- **HTTPS obligatoire** : Certificat Let's Encrypt gratuit
- **Headers de securite** : Helmet.js
- **CORS configure** : Acces restreint au client
- **JWT securises** : Tokens signes avec expiration
- **Pare-feu** : UFW configure

### Bonnes pratiques recommandees

1. **Utilisez un mot de passe maitre tres fort**
   - Au moins 16 caracteres
   - Melange de lettres, chiffres, et symboles
   - Unique a VerrouPass

2. **Sauvegardes regulieres**
   - Configurez des sauvegardes automatiques quotidiennes
   - Stockez les sauvegardes sur un serveur externe

3. **Mises a jour**
   - Gardez Node.js, PostgreSQL, et Nginx a jour
   - Surveillez les vulnerabilites npm : `npm audit`

4. **Monitoring**
   - Surveillez les logs : `pm2 logs verroupass`
   - Verifiez l'utilisation des ressources : `pm2 monit`

## Scripts utiles

### Gestion de l'application

```bash
# Demarrer l'application
pm2 start ecosystem.config.js

# Voir les logs en temps reel
pm2 logs verroupass

# Redemarrer l'application
pm2 restart verroupass

# Statut de l'application
pm2 status
```

### Gestion de la base de donnees

```bash
# Sauvegarder la base de donnees
./scripts/backup.sh

# Restaurer depuis une sauvegarde
./scripts/restore.sh /var/backups/verroupass/backup_20260417.sql.gz

# Afficher les statistiques
./scripts/db-stats.sh
```

### Mise a jour de l'application

```bash
cd /var/www/verroupass

# Sauvegarder d'abord !
./scripts/backup.sh

# Mettre a jour le code
git pull

# Mettre a jour le serveur
cd server && npm install --production

# Rebuild le client
cd ../client && npm install && npm run build

# Redemarrer
pm2 restart verroupass
```

## FAQ

### Que se passe-t-il si j'oublie mon mot de passe maitre ?

Malheureusement, **il n'y a aucun moyen de recuperer vos donnees**. C'est le prix de la securite zero-knowledge : meme l'administrateur ne peut pas reinitialiser votre mot de passe. Vous devrez creer un nouveau compte.

### Mes mots de passe sont-ils vraiment securises ?

Oui ! Vos mots de passe sont chiffres avec AES-256-GCM (standard militaire) avant d'etre envoyes au serveur. La cle de chiffrement ne quitte jamais votre navigateur. Le serveur ne stocke que des donnees illisibles.

### Puis-je acceder a mes mots de passe depuis plusieurs appareils ?

Oui ! Tant que vous connaissez votre email et votre mot de passe maitre, vous pouvez vous connecter depuis n'importe quel appareil.

### Pourquoi auto-heberger au lieu d'utiliser LastPass/1Password ?

- **Controle total** : Vos donnees sont sur votre serveur
- **Transparence** : Code open-source auditable
- **Pas d'abonnement** : Cout unique du VPS
- **Confidentialite** : Aucun tiers n'accede a vos donnees
- **Personnalisable** : Vous pouvez modifier le code

### L'application est-elle compatible mobile ?

L'interface web est responsive et fonctionne sur mobile. Pour une experience optimale, vous pouvez l'ajouter a l'ecran d'accueil (PWA).

## Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](./LICENSE) pour plus de details.

## Support

Pour toute question ou probleme :
1. Consultez la documentation dans les fichiers README
2. Verifiez les logs : `pm2 logs verroupass`
3. Ouvrez une issue sur GitHub

## Avertissement

**Important** :
- Utilisez cette application a vos propres risques
- Faites des sauvegardes regulieres de votre base de donnees
- Utilisez un mot de passe maitre tres fort
- Ne partagez jamais votre mot de passe maitre
- Gardez votre VPS a jour et securise

## Remerciements

Construit avec :
- [Node.js](https://nodejs.org/)
- [React](https://react.dev/)
- [PostgreSQL](https://www.postgresql.org/)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Express.js](https://expressjs.com/)

---

**VerrouPass** - Gardez vos mots de passe en securite
