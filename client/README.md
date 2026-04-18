# VerrouPass - Client Frontend

Application React pour VerrouPass, un gestionnaire de mots de passe zero-knowledge.

## Stack Technique

- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Router**: React Router v6
- **HTTP Client**: Axios
- **Cryptographie**: Web Crypto API (natif du navigateur)

## Architecture Zero-Knowledge

Le client gère **tout le chiffrement** localement :
- Les mots de passe ne quittent JAMAIS le client en clair
- Chiffrement AES-256-GCM avec la Web Crypto API
- Dérivation de clés avec PBKDF2 (100 000 itérations)
- Deux clés dérivées : une pour l'authentification, une pour le chiffrement

## Installation

### Développement

```bash
cd client
npm install
npm run dev
```

L'application sera accessible sur http://localhost:5173

### Production

```bash
cd client
npm install
npm run build
```

Le build sera dans le dossier `dist/`

## Configuration

### Variables d'environnement

Créez un fichier `.env` basé sur `.env.example`:

```env
# URL de l'API (avec proxy Vite en dev, chemin absolu en prod)
VITE_API_URL=/api

# Nom de l'application
VITE_APP_NAME=VerrouPass

# Version
VITE_APP_VERSION=1.0.0
```

En développement, le proxy Vite redirige `/api` vers `http://localhost:3001` (voir `vite.config.js`).

## Structure du projet

```
client/
├── public/
│   └── vault.svg            # Logo/icône
├── src/
│   ├── components/
│   │   ├── Auth/
│   │   │   ├── Login.jsx    # Page de connexion
│   │   │   └── Register.jsx # Page d'inscription
│   │   ├── Vault/
│   │   │   ├── VaultList.jsx    # Liste des entrées
│   │   │   ├── VaultItem.jsx    # Affichage d'une entrée
│   │   │   ├── VaultForm.jsx    # Formulaire ajout/modification
│   │   │   └── UnlockPrompt.jsx # Demande de mot de passe maître
│   │   └── Generator/
│   │       └── PasswordGenerator.jsx # Générateur de mots de passe
│   ├── hooks/
│   │   ├── useAuth.js       # Hook d'authentification
│   │   └── useVault.js      # Hook de gestion du coffre
│   ├── utils/
│   │   ├── api.js           # Client API Axios
│   │   ├── crypto.js        # Fonctions de chiffrement
│   │   └── entropy.js       # Calcul de l'entropie des mots de passe
│   ├── App.jsx              # Routeur principal
│   ├── main.jsx             # Point d'entrée
│   └── index.css            # Styles Tailwind
├── .env.example             # Exemple de configuration
├── .env.production          # Configuration de production
├── build.sh                 # Script de build
├── package.json
├── vite.config.js           # Configuration Vite
└── tailwind.config.js       # Configuration Tailwind
```

## Fonctionnalités

### Authentification
- Inscription avec email et mot de passe maître
- Connexion avec dérivation de clés (PBKDF2)
- Gestion de session avec JWT
- Protection des routes privées

### Coffre-fort
- Ajout d'entrées (nom, identifiant, mot de passe, URL, notes)
- Modification d'entrées existantes
- Suppression d'entrées
- Recherche dans le coffre
- Affichage/masquage des mots de passe
- Copie dans le presse-papiers

### Générateur de mots de passe
- Génération aléatoire sécurisée
- Longueur configurable (8-64 caractères)
- Options : majuscules, minuscules, chiffres, symboles
- Indicateur de force (entropie)
- Copie et insertion directe

## Sécurité

### Chiffrement

Le module `src/utils/crypto.js` gère tout le chiffrement :

```javascript
// Dérivation des clés à partir du mot de passe maître
const { authKey, encKey } = await deriveKeys(masterPassword, email);

// Chiffrement des données
const { encryptedData, iv } = await encrypt(data, encKey);

// Déchiffrement
const data = await decrypt(encryptedData, iv, encKey);
```

### Flux d'authentification

1. **Inscription**:
   - Dérive `authKey` et `encKey` depuis le mot de passe maître
   - Hash `authKey` avec SHA-256 → envoyé au serveur comme "mot de passe"
   - Garde `encKey` en mémoire (jamais envoyé)

2. **Connexion**:
   - Re-dérive les mêmes clés
   - Authentifie avec `authKey` hashé
   - Récupère le JWT
   - Déchiffre toutes les entrées avec `encKey`

3. **Stockage des entrées**:
   - Chiffre les données avec `encKey` et AES-256-GCM
   - Génère un IV aléatoire unique
   - Envoie `{ encryptedData, iv }` au serveur

### Points de sécurité importants

- ✅ Le mot de passe maître ne quitte jamais le navigateur
- ✅ La clé de chiffrement reste en mémoire (contexte React)
- ✅ Chaque entrée a un IV unique
- ✅ Pas de stockage local du mot de passe maître
- ✅ Session sécurisée avec JWT
- ⚠️ En fermant l'onglet, l'utilisateur doit se reconnecter

## Scripts npm

```bash
# Développement avec hot-reload
npm run dev

# Build de production
npm run build

# Prévisualiser le build
npm run preview

# Linter (si configuré)
npm run lint
```

## Build de production

### Méthode 1 : Manuelle

```bash
npm install
npm run build
```

### Méthode 2 : Avec le script

```bash
chmod +x build.sh
./build.sh production
```

### Résultat

Le dossier `dist/` contient :
- `index.html` - Page principale
- `assets/` - JS, CSS, et autres assets optimisés
- Tous les fichiers sont minifiés et optimisés

## Déploiement

### Sur un VPS avec Nginx

1. **Transférer le build**:
```bash
# Via SCP
scp -r dist/* user@vps:/var/www/verroupass/client/dist/

# Via rsync (recommandé)
rsync -avz --delete dist/ user@vps:/var/www/verroupass/client/dist/
```

2. **Configuration Nginx** (déjà dans `../nginx.conf`):
```nginx
location / {
    root /var/www/verroupass/client/dist;
    try_files $uri $uri/ /index.html;
}
```

3. **Recharger Nginx**:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

### Avec un hébergeur statique

Le dossier `dist/` peut être déployé sur :
- Netlify
- Vercel
- GitHub Pages
- Cloudflare Pages

**Important**: Configurez une règle de réécriture pour rediriger toutes les routes vers `index.html` (pour React Router).

## Développement

### Ajouter une nouvelle page

1. Créer le composant dans `src/components/`
2. Ajouter la route dans `src/App.jsx`
3. Éventuellement protéger avec `<PrivateRoute>`

### Modifier le style

Tailwind CSS est utilisé. Modifiez les classes directement dans les composants.

Pour personnaliser le thème :
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: { /* vos couleurs */ }
      }
    }
  }
}
```

### Ajouter une API call

Utilisez `src/utils/api.js` :
```javascript
import api from '../utils/api';

const response = await api.get('/api/vault');
const data = response.data;
```

## Tests

### Test du build

```bash
npm run build
npm run preview
```

Ouvrir http://localhost:4173 pour tester le build de production.

### Test du chiffrement

Ouvrir la console du navigateur et vérifier :
- Les requêtes réseau ne contiennent jamais de mots de passe en clair
- Les données stockées dans le serveur sont chiffrées

## Compatibilité navigateurs

L'application nécessite :
- Web Crypto API (supporté par tous les navigateurs modernes)
- ES6+ JavaScript
- Support des modules ES

Navigateurs compatibles :
- Chrome/Edge 60+
- Firefox 57+
- Safari 11+
- Opera 47+

## Dépannage

### Erreur de connexion à l'API

Vérifiez :
- Le serveur backend est démarré
- La configuration CORS dans le backend
- L'URL de l'API dans `.env`

### Erreur de déchiffrement

Cause probable : Mauvais mot de passe maître ou corruption de données.

Solution : L'utilisateur doit utiliser le mot de passe exact utilisé lors du chiffrement.

### Le build échoue

```bash
# Nettoyer le cache
rm -rf node_modules dist
npm install
npm run build
```

## Performance

### Optimisations appliquées

- Code splitting automatique (Vite)
- Minification JS et CSS
- Tree shaking
- Compression gzip (via Nginx)
- Cache des assets statiques (1 an)

### Taille du bundle

Build de production typique : ~200-300 KB (gzippé)

## Support

Pour plus d'informations :
- Documentation React : https://react.dev/
- Documentation Vite : https://vitejs.dev/
- Documentation Tailwind : https://tailwindcss.com/
- Web Crypto API : https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API
