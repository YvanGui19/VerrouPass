# VerrouPass - Serveur Backend

Serveur Node.js/Express pour VerrouPass, un gestionnaire de mots de passe zero-knowledge.

## Stack Technique

- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Base de données**: PostgreSQL
- **Authentification**: JWT (JSON Web Tokens)
- **Sécurité**: Helmet, CORS, bcrypt
- **Chiffrement**: Zero-knowledge (chiffrement côté client)

## Architecture Zero-Knowledge

Le serveur ne peut **jamais** lire les mots de passe stockés :
- Les données sont chiffrées côté client avant l'envoi
- Le serveur stocke uniquement des données chiffrées
- La clé de déchiffrement reste toujours sur le client

## Installation

### Développement

```bash
cd server
npm install
cp .env.example .env
# Configurer le fichier .env
npm run dev
```

### Production

```bash
cd server
npm install --production
cp .env.production .env
# Configurer le fichier .env avec des valeurs de production
npm start
```

## Configuration

### Variables d'environnement

Créez un fichier `.env` basé sur `.env.example` ou `.env.production`:

```env
# Serveur
PORT=3001
NODE_ENV=production

# Base de données
DATABASE_URL=postgresql://user:password@localhost:5432/verroupass

# JWT
JWT_SECRET=votre-cle-secrete-tres-longue-et-aleatoire
JWT_EXPIRES_IN=7d

# CORS
CLIENT_URL=https://verroupass.votredomaine.com
```

**IMPORTANT**: Générez un JWT_SECRET sécurisé :
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## Structure du projet

```
server/
├── src/
│   ├── db.js                 # Configuration PostgreSQL
│   ├── index.js              # Point d'entrée
│   ├── middleware/
│   │   └── auth.js           # Middleware d'authentification JWT
│   ├── models/
│   │   ├── User.js           # Modèle utilisateur
│   │   └── VaultItem.js      # Modèle entrée de coffre
│   └── routes/
│       ├── auth.js           # Routes d'authentification
│       └── vault.js          # Routes du coffre
├── .env.example              # Exemple de configuration
├── .env.production           # Template de configuration production
└── package.json
```

## API Endpoints

### Authentification

**POST /api/auth/register**
- Inscription d'un nouvel utilisateur
- Body: `{ email, password }`
- Retourne: `{ token, user }`

**POST /api/auth/login**
- Connexion utilisateur
- Body: `{ email, password }`
- Retourne: `{ token, user }`

**GET /api/auth/me**
- Récupérer l'utilisateur actuel
- Header: `Authorization: Bearer <token>`
- Retourne: `{ user }`

### Coffre-fort (Vault)

Toutes les routes nécessitent l'authentification (JWT token).

**GET /api/vault**
- Récupérer toutes les entrées du coffre
- Retourne: `{ items: [...] }`

**GET /api/vault/:id**
- Récupérer une entrée spécifique
- Retourne: `{ item }`

**POST /api/vault**
- Créer une nouvelle entrée
- Body: `{ encryptedData, iv }`
- Retourne: `{ item }`

**PUT /api/vault/:id**
- Modifier une entrée
- Body: `{ encryptedData, iv }`
- Retourne: `{ item }`

**DELETE /api/vault/:id**
- Supprimer une entrée
- Retourne: `{ id }`

### Health Check

**GET /api/health**
- Vérifier que le serveur fonctionne
- Retourne: `{ status: 'ok', timestamp }`

## Base de données

### Schéma

**Table: users**
- `id` (UUID, PK)
- `email` (VARCHAR, UNIQUE)
- `password_hash` (VARCHAR)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**Table: vault_items**
- `id` (UUID, PK)
- `user_id` (UUID, FK → users)
- `encrypted_data` (TEXT) - Données chiffrées
- `iv` (VARCHAR) - Vecteur d'initialisation
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### Initialisation

Les tables sont créées automatiquement au premier démarrage.

Pour réinitialiser manuellement :
```bash
psql -U verroupass_user -d verroupass -f ../scripts/db-setup.sql
```

## Sécurité

### Mesures implémentées

1. **Helmet**: Headers de sécurité HTTP
2. **CORS**: Restriction des origines autorisées
3. **bcrypt**: Hash des mots de passe utilisateurs (10 rounds)
4. **JWT**: Tokens signés pour l'authentification
5. **Zero-knowledge**: Chiffrement côté client
6. **Validation**: Validation des entrées utilisateur
7. **Rate limiting**: (à implémenter si nécessaire)

### Bonnes pratiques

- Utilisez HTTPS en production (via Nginx + Let's Encrypt)
- Changez le JWT_SECRET régulièrement
- Limitez les tentatives de connexion
- Surveillez les logs pour détecter les activités suspectes
- Gardez Node.js et les dépendances à jour

## Scripts

```bash
# Développement avec hot-reload
npm run dev

# Production
npm start

# Vérifier les dépendances vulnérables
npm audit

# Mettre à jour les dépendances
npm update
```

## Déploiement

Voir le fichier [DEPLOY.md](../DEPLOY.md) à la racine du projet pour un guide complet de déploiement sur VPS.

### Résumé rapide

1. Installer Node.js 20+, PostgreSQL, Nginx, PM2
2. Cloner le code sur le serveur
3. Configurer `.env` avec les valeurs de production
4. Installer les dépendances : `npm install --production`
5. Démarrer avec PM2 : `pm2 start ../ecosystem.config.js`

## Logs

### Développement
Les logs sont affichés dans la console.

### Production (avec PM2)
```bash
# Voir les logs en temps réel
pm2 logs verroupass

# Logs d'erreur uniquement
pm2 logs verroupass --err

# Logs dans les fichiers
/var/www/verroupass/logs/error.log
/var/www/verroupass/logs/out.log
```

## Monitoring

### Avec PM2
```bash
# Statut de l'application
pm2 status

# Moniteur en temps réel
pm2 monit

# Informations détaillées
pm2 show verroupass
```

### Métriques importantes
- Utilisation CPU et RAM
- Nombre de requêtes par seconde
- Temps de réponse moyen
- Taux d'erreur
- Connexions actives à PostgreSQL

## Maintenance

### Mise à jour

```bash
# Arrêter l'application
pm2 stop verroupass

# Mettre à jour le code
git pull

# Installer les nouvelles dépendances
npm install --production

# Redémarrer
pm2 restart verroupass
```

### Sauvegarde

```bash
# Sauvegarder la base de données
../scripts/backup.sh

# Restaurer depuis une sauvegarde
../scripts/restore.sh /var/backups/verroupass/backup_YYYYMMDD.sql.gz
```

## Dépannage

### Le serveur ne démarre pas
```bash
# Vérifier les logs
pm2 logs verroupass

# Vérifier la configuration
cat .env

# Tester la connexion PostgreSQL
psql $DATABASE_URL
```

### Erreurs de connexion à la base de données
```bash
# Vérifier que PostgreSQL fonctionne
sudo systemctl status postgresql

# Tester la connexion
psql -U verroupass_user -d verroupass -h localhost
```

### Erreurs JWT
- Vérifiez que JWT_SECRET est défini dans .env
- Assurez-vous qu'il est suffisamment long et aléatoire
- Si changé, tous les utilisateurs devront se reconnecter

## Support

Pour plus d'informations :
- Documentation Express : https://expressjs.com/
- Documentation PostgreSQL : https://www.postgresql.org/docs/
- Documentation JWT : https://jwt.io/
