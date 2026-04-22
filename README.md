# VerrouPass 🔐

Un gestionnaire de mots de passe **zero-knowledge** sécurisé, open-source, et auto-hébergé.

## Qu'est-ce que VerrouPass ?

VerrouPass est une application web qui vous permet de stocker tous vos mots de passe en toute sécurité. L'architecture **zero-knowledge** garantit que personne, pas même le serveur, ne peut lire vos mots de passe.

### Caractéristiques principales

- 🔒 **Zero-knowledge** : Le serveur ne peut jamais lire vos mots de passe
- 🔐 **Chiffrement AES-256-GCM** : Standard militaire de chiffrement
- 🛡️ **PBKDF2** : 600 000 iterations pour la derivation de cles
- 🌐 **Auto-hébergé** : Vos données restent sur votre serveur
- 📱 **Interface moderne** : Design épuré avec Tailwind CSS
- 💻 **CLI disponible** : Interface en ligne de commande pour terminaux
- 🔑 **Générateur de mots de passe** : Créez des mots de passe sécurisés
- 🔍 **Recherche rapide** : Trouvez vos entrées instantanément
- 🚀 **Open-source** : Code transparent et auditable

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
   - Vous créez un mot de passe maître
   - Deux clés sont dérivées : une pour l'authentification, une pour le chiffrement
   - Seule la clé d'authentification (hashée) est envoyée au serveur
   - La clé de chiffrement reste dans votre navigateur

2. **Stockage des mots de passe** :
   - Vos mots de passe sont chiffrés dans votre navigateur (AES-256-GCM)
   - Le serveur stocke uniquement les données chiffrées
   - Même l'administrateur du serveur ne peut pas les lire

3. **Récupération** :
   - Vous vous reconnectez avec votre mot de passe maître
   - La clé de chiffrement est re-dérivée localement
   - Vos données sont déchiffrées dans votre navigateur

## Démarrage rapide

### Prérequis

- Node.js 20+
- PostgreSQL 13+
- Un VPS Ubuntu/Debian (pour le déploiement)
- Un nom de domaine (optionnel mais recommandé)

### Installation en local (développement)

1. **Cloner le projet** :
```bash
git clone https://github.com/votre-repo/verroupass.git
cd verroupass
```

2. **Configurer et démarrer le serveur** :
```bash
cd server
npm install
cp .env.example .env
# Éditer .env avec vos paramètres PostgreSQL
npm run dev
```

3. **Configurer et démarrer le client** :
```bash
cd client
npm install
npm run dev
```

4. **Accéder à l'application** :
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

Voir [cli/QUICK_START.md](./cli/QUICK_START.md) pour plus de détails.

### Déploiement sur VPS

Consultez le guide complet de déploiement : **[DEPLOY.md](./DEPLOY.md)**

**Résumé rapide** :
```bash
# Sur votre VPS, exécuter le script d'installation
sudo bash install.sh

# Transférer votre code
scp -r * user@vps:/var/www/verroupass/

# Installer et builder
cd /var/www/verroupass/server && npm install --production
cd /var/www/verroupass/client && npm install && npm run build

# Configurer et démarrer
cp server/.env.production server/.env
# Éditer server/.env avec vos valeurs
pm2 start ecosystem.config.js
```

## Structure du projet

```
verroupass/
├── client/                  # Application React (frontend)
│   ├── src/
│   │   ├── components/      # Composants React
│   │   ├── hooks/           # Hooks personnalisés
│   │   └── utils/           # Utilitaires (crypto, api)
│   ├── build.sh             # Script de build
│   └── README.md
│
├── server/                  # API Node.js (backend)
│   ├── src/
│   │   ├── models/          # Modèles de données
│   │   ├── routes/          # Routes API
│   │   └── middleware/      # Middleware Express
│   └── README.md
│
├── cli/                     # Interface en ligne de commande
│   ├── src/
│   │   ├── commands/        # Commandes CLI
│   │   └── utils/           # Utilitaires (crypto, api, config)
│   ├── QUICK_START.md       # Démarrage rapide
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
├── DEPLOY.md                # Guide de déploiement complet
└── README.md                # Ce fichier
```

## Documentation

- **[Guide de déploiement](./DEPLOY.md)** : Déploiement complet sur VPS
- **[README Serveur](./server/README.md)** : Documentation de l'API backend
- **[README Client](./client/README.md)** : Documentation du frontend React
- **[README CLI](./cli/README.md)** : Documentation de l'interface en ligne de commande
- **[Scripts](./scripts/README.md)** : Documentation des scripts de gestion

## Fonctionnalités

### Pour les utilisateurs

**Interface web :**
- ✅ Créer un compte sécurisé
- ✅ Ajouter des mots de passe avec :
  - Nom de l'application/service
  - Identifiant ou email
  - Mot de passe
  - URL du site
  - Notes supplémentaires
- ✅ Modifier les entrées existantes
- ✅ Supprimer des entrées
- ✅ Rechercher dans le coffre
- ✅ Générer des mots de passe sécurisés
- ✅ Copier les mots de passe dans le presse-papiers
- ✅ Afficher/masquer les mots de passe

**Interface CLI (ligne de commande) :**
- ✅ Toutes les fonctionnalités de l'interface web
- ✅ Copie automatique dans le presse-papiers
- ✅ Interface interactive ou avec options
- ✅ Scriptable pour l'automatisation
- ✅ Rapide et légère

### Pour les administrateurs

- ✅ Installation automatisée (script `install.sh`)
- ✅ Gestion avec PM2 (redémarrage automatique)
- ✅ Sauvegardes automatiques de la base de données
- ✅ Logs centralisés
- ✅ Statistiques de la base de données
- ✅ Configuration SSL avec Let's Encrypt
- ✅ Reverse proxy avec Nginx

## Sécurité

### Mesures de sécurité implémentées

- 🔐 **Chiffrement zero-knowledge** : AES-256-GCM côté client
- 🔑 **Derivation de cles** : PBKDF2 avec 600 000 iterations
- 🛡️ **Hash des mots de passe** : bcrypt avec 10 rounds
- 🔒 **HTTPS obligatoire** : Certificat Let's Encrypt gratuit
- 🌐 **Headers de sécurité** : Helmet.js
- 🚫 **CORS configuré** : Accès restreint au client
- 📝 **JWT sécurisés** : Tokens signés avec expiration
- 🔥 **Pare-feu** : UFW configuré

### Bonnes pratiques recommandées

1. **Utilisez un mot de passe maître très fort**
   - Au moins 16 caractères
   - Mélange de lettres, chiffres, et symboles
   - Unique à VerrouPass

2. **Sauvegardes régulières**
   - Configurez des sauvegardes automatiques quotidiennes
   - Stockez les sauvegardes sur un serveur externe

3. **Mises à jour**
   - Gardez Node.js, PostgreSQL, et Nginx à jour
   - Surveillez les vulnérabilités npm : `npm audit`

4. **Monitoring**
   - Surveillez les logs : `pm2 logs verroupass`
   - Vérifiez l'utilisation des ressources : `pm2 monit`

## Scripts utiles

### Gestion de l'application

```bash
# Démarrer l'application
pm2 start ecosystem.config.js

# Voir les logs en temps réel
pm2 logs verroupass

# Redémarrer l'application
pm2 restart verroupass

# Statut de l'application
pm2 status
```

### Gestion de la base de données

```bash
# Sauvegarder la base de données
./scripts/backup.sh

# Restaurer depuis une sauvegarde
./scripts/restore.sh /var/backups/verroupass/backup_20260417.sql.gz

# Afficher les statistiques
./scripts/db-stats.sh
```

### Mise à jour de l'application

```bash
cd /var/www/verroupass

# Sauvegarder d'abord !
./scripts/backup.sh

# Mettre à jour le code
git pull

# Mettre à jour le serveur
cd server && npm install --production

# Rebuild le client
cd ../client && npm install && npm run build

# Redémarrer
pm2 restart verroupass
```

## FAQ

### Que se passe-t-il si j'oublie mon mot de passe maître ?

Malheureusement, **il n'y a aucun moyen de récupérer vos données**. C'est le prix de la sécurité zero-knowledge : même l'administrateur ne peut pas réinitialiser votre mot de passe. Vous devrez créer un nouveau compte.

### Mes mots de passe sont-ils vraiment sécurisés ?

Oui ! Vos mots de passe sont chiffrés avec AES-256-GCM (standard militaire) avant d'être envoyés au serveur. La clé de chiffrement ne quitte jamais votre navigateur. Le serveur ne stocke que des données illisibles.

### Puis-je accéder à mes mots de passe depuis plusieurs appareils ?

Oui ! Tant que vous connaissez votre email et votre mot de passe maître, vous pouvez vous connecter depuis n'importe quel appareil.

### Pourquoi auto-héberger au lieu d'utiliser LastPass/1Password ?

- ✅ **Contrôle total** : Vos données sont sur votre serveur
- ✅ **Transparence** : Code open-source auditable
- ✅ **Pas d'abonnement** : Coût unique du VPS
- ✅ **Confidentialité** : Aucun tiers n'accède à vos données
- ✅ **Personnalisable** : Vous pouvez modifier le code

### L'application est-elle compatible mobile ?

L'interface web est responsive et fonctionne sur mobile. Pour une expérience optimale, vous pouvez l'ajouter à l'écran d'accueil (PWA).

## Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](./LICENSE) pour plus de détails.

## Support

Pour toute question ou problème :
1. Consultez la documentation dans les fichiers README
2. Vérifiez les logs : `pm2 logs verroupass`
3. Ouvrez une issue sur GitHub

## Avertissement

⚠️ **Important** :
- Utilisez cette application à vos propres risques
- Faites des sauvegardes régulières de votre base de données
- Utilisez un mot de passe maître très fort
- Ne partagez jamais votre mot de passe maître
- Gardez votre VPS à jour et sécurisé

## Remerciements

Construit avec :
- [Node.js](https://nodejs.org/)
- [React](https://react.dev/)
- [PostgreSQL](https://www.postgresql.org/)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Express.js](https://expressjs.com/)

---

**VerrouPass** - Gardez vos mots de passe en sécurité 🔐
