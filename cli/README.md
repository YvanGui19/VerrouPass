# VerrouPass CLI

Interface en ligne de commande pour VerrouPass, votre gestionnaire de mots de passe zero-knowledge.

## Installation

### Depuis le dossier du projet

```bash
cd cli
npm install
npm run install-global
```

### Vérifier l'installation

```bash
v-man
```

## Configuration

### Première utilisation

Avant d'utiliser la CLI, assurez-vous que :
1. Le serveur VerrouPass est démarré et accessible
2. Vous avez créé un compte (via l'interface web ou `v register`)

Par défaut, la CLI se connecte à `http://localhost:3001/api`. Pour changer l'URL du serveur :

```bash
# Modifier directement dans le fichier de config
# La config est stockée dans ~/.config/verroupass-cli/
```

## Commandes

### Authentification

#### `v-login`

Se connecter à votre compte VerrouPass.

```bash
# Mode interactif
v-login

# Avec email pré-rempli
v-login --email john@example.com
v-login -e john@example.com
```

**Options :**
- `-e, --email <email>` : Email de connexion

**Exemple :**
```bash
$ v-login
🔐 Connexion à VerrouPass

? Email: john@example.com
? Mot de passe maître: ************
✓ Connexion réussie !

Connecté en tant que: john@example.com
Utilisez v-ls pour voir vos entrées
```

#### `v-exit`

Se déconnecter de votre compte.

```bash
v-exit
```

### Gestion des entrées

#### `v-ls`

Lister toutes les entrées de votre coffre.

```bash
# Affichage détaillé (tableau)
v-ls

# Affichage court (noms uniquement)
v-ls --short
v-ls -s
```

**Options :**
- `-s, --short` : Affichage court (noms uniquement)

**Exemple :**
```bash
$ v-ls
✓ 5 entrée(s) trouvée(s)

┌───────────┬──────────────────┬───────────────────┬────────────┐
│ Nom       │ Identifiant      │ URL               │ Créé le    │
├───────────┼──────────────────┼───────────────────┼────────────┤
│ GitHub    │ john@example.com │ github.com        │ 15/04/2026 │
│ Gmail     │ john@gmail.com   │ mail.google.com   │ 14/04/2026 │
│ Netflix   │ john@example.com │ netflix.com       │ 12/04/2026 │
└───────────┴──────────────────┴───────────────────┴────────────┘

Utilisez v-cat <nom> pour voir les détails
```

#### `v-cat <name>`

Récupérer et afficher une entrée spécifique.

```bash
# Afficher l'entrée
v-cat GitHub

# Afficher l'entrée avec le mot de passe en clair
v-cat GitHub --show-password
v-cat GitHub -p

# Afficher l'entrée et copier le mot de passe
v-cat GitHub --copy
v-cat GitHub -c
```

**Arguments :**
- `<name>` : Nom de l'entrée à récupérer

**Options :**
- `-c, --copy` : Copier le mot de passe dans le presse-papiers
- `-p, --show-password` : Afficher le mot de passe en clair

**Exemple :**
```bash
$ v-cat GitHub --copy
✓ Entrée trouvée

════════════════════════════════════════════════════════════
  GitHub
════════════════════════════════════════════════════════════

Identifiant:    john@example.com
Mot de passe:   ••••••••••••
URL:            https://github.com
Notes:          Mon compte principal

Créé le:        15/04/2026 14:30:00
Modifié le:     15/04/2026 14:30:00

✓ Mot de passe copié dans le presse-papiers
  Il sera automatiquement effacé après 30 secondes
```

#### `v-grep <query>`

Rechercher dans vos entrées.

```bash
v-grep github
v-grep gmail
```

**Arguments :**
- `<query>` : Terme à rechercher (nom, identifiant, URL, notes)

**Exemple :**
```bash
$ v-grep google
✓ 2 résultat(s) trouvé(s)

┌────────────┬──────────────────┬─────────────────┬────────────┐
│ Nom        │ Identifiant      │ URL             │ Créé le    │
├────────────┼──────────────────┼─────────────────┼────────────┤
│ Gmail      │ john@gmail.com   │ mail.google.com │ 14/04/2026 │
│ Google     │ john@gmail.com   │ google.com      │ 10/04/2026 │
└────────────┴──────────────────┴─────────────────┴────────────┘
```

#### `v-touch`

Ajouter une nouvelle entrée au coffre.

```bash
# Mode interactif complet
v-touch

# Avec des options pré-remplies
v-touch --name GitHub --username john@example.com
v-touch -n GitHub -u john@example.com -p MyPassword123
```

**Options :**
- `-n, --name <name>` : Nom de l'application
- `-u, --username <username>` : Nom d'utilisateur ou email
- `-p, --password <password>` : Mot de passe
- `--url <url>` : URL du service
- `--notes <notes>` : Notes supplémentaires

**Exemple :**
```bash
$ v-touch

➕ Ajouter une nouvelle entrée

? Nom de l'application: GitHub
? Identifiant / Email: john@example.com
? Mot de passe: ********
? Voulez-vous générer un mot de passe sécurisé ? No
? URL: https://github.com
? Notes (optionnel): Mon compte principal

✓ Entrée ajoutée avec succès !

Utilisez v-ls pour voir toutes vos entrées
```

#### `v-nano <name>`

Modifier une entrée existante.

```bash
v-nano GitHub
```

**Arguments :**
- `<name>` : Nom de l'entrée à modifier

**Exemple :**
```bash
$ v-nano GitHub
✓ Entrée trouvée

✏️  Modifier: GitHub

Laissez vide pour conserver la valeur actuelle

? Nom: GitHub
? Identifiant: john@example.com
? Modifier le mot de passe ? Yes
? Nouveau mot de passe: ****************
? URL: https://github.com
? Notes: Mon compte principal (modifié)

✓ Entrée modifiée avec succès !
```

#### `v-rm <name>`

Supprimer une entrée du coffre.

```bash
# Avec confirmation
v-rm GitHub

# Sans confirmation (force)
v-rm GitHub --force
v-rm GitHub -f
```

**Arguments :**
- `<name>` : Nom de l'entrée à supprimer

**Options :**
- `-f, --force` : Supprimer sans confirmation

**Exemple :**
```bash
$ v-rm OldAccount
✓ Entrée trouvée

⚠️  ATTENTION: Cette action est irréversible !

Entrée à supprimer:
  Nom: OldAccount
  Identifiant: old@example.com

? Êtes-vous sûr de vouloir supprimer cette entrée ? Yes

✓ Entrée supprimée avec succès
```

### Générateur de mots de passe

#### `v-gen`

Générer un mot de passe sécurisé.

```bash
# Mot de passe par défaut (16 caractères, tous types)
v-gen

# Personnalisé
v-gen --length 32
v-gen -l 20

# Sans symboles
v-gen --no-symbols

# Sans majuscules
v-gen --no-upper

# Avec copie automatique
v-gen --copy
v-gen -c
```

**Options :**
- `-l, --length <number>` : Longueur du mot de passe (défaut: 16, min: 8, max: 128)
- `--no-upper` : Exclure les majuscules
- `--no-lower` : Exclure les minuscules
- `--no-numbers` : Exclure les chiffres
- `--no-symbols` : Exclure les symboles
- `-c, --copy` : Copier dans le presse-papiers

**Exemple :**
```bash
$ v-gen --length 20 --copy

🔑 Mot de passe généré

kX9#mP2$nL4@wR7!qT6&

Longueur: 20 caractères
Entropie: 131.1 bits
Force: Très fort

✓ Copié dans le presse-papiers
```

## Exemples d'utilisation

### Workflow typique

```bash
# 1. Se connecter
v-login -e john@example.com

# 2. Voir toutes les entrées
v-ls

# 3. Récupérer un mot de passe (copie automatique)
v-cat GitHub -c

# 4. Ajouter une nouvelle entrée avec mot de passe généré
v-gen -l 20 -c
v-touch -n "New Service" -u john@example.com

# 5. Rechercher dans les entrées
v-grep google

# 6. Modifier une entrée
v-nano Gmail

# 7. Supprimer une entrée
v-rm "Old Account"

# 8. Se déconnecter
v-exit
```

### Utilisation avec scripts

```bash
#!/bin/bash

# Générer et copier un mot de passe
PASSWORD=$(v-gen -l 32 --silent)
echo "$PASSWORD"

# Ajouter directement une entrée
v-touch \
  --name "API Key" \
  --username "myapp" \
  --password "$PASSWORD" \
  --url "https://api.example.com"
```

## Configuration avancée

### Changer l'URL du serveur

La configuration est stockée dans `~/.config/verroupass-cli/config.json`.

Vous pouvez modifier manuellement ce fichier pour changer l'URL du serveur :

```json
{
  "serverUrl": "https://verroupass.votredomaine.com/api"
}
```

Ou programmatiquement :

```javascript
import config from './src/utils/config.js';
config.saveServerUrl('https://verroupass.votredomaine.com/api');
```

### Emplacement des données

- **Configuration** : `~/.config/verroupass-cli/config.json`
- **Session** : Token JWT et clé de chiffrement stockés dans le fichier de config
- **Logs** : Pas de logs locaux (tout est en mémoire)

## Sécurité

### Comment ça fonctionne ?

1. **Connexion** :
   - Vous entrez votre mot de passe maître
   - La CLI dérive deux clés : une pour l'auth, une pour le chiffrement
   - Seule la clé d'auth (hashée) est envoyée au serveur
   - La clé de chiffrement est stockée localement (chiffrée)

2. **Stockage local** :
   - Token JWT : Pour l'authentification avec le serveur
   - Clé de chiffrement : Pour déchiffrer vos mots de passe localement
   - Les données sont stockées dans un fichier config chiffré

3. **Opérations** :
   - Toutes les opérations de chiffrement/déchiffrement sont faites localement
   - Le serveur ne voit jamais vos mots de passe en clair

### Recommandations

- ✅ Utilisez un mot de passe maître fort et unique
- ✅ Déconnectez-vous après utilisation (`v-exit`)
- ✅ Ne stockez jamais votre mot de passe maître
- ✅ Protégez votre machine avec un mot de passe
- ⚠️ La clé de chiffrement est stockée localement (risque si accès physique à votre machine)

### Limitations connues

- La clé de chiffrement est stockée localement pour éviter de redemander le mot de passe maître à chaque commande
- Si quelqu'un a accès à votre machine et au fichier de config, il peut déchiffrer vos mots de passe
- Pour une sécurité maximale, utilisez `v-exit` après chaque session

## Dépannage

### Erreur de connexion au serveur

```bash
# Vérifier que le serveur est démarré
curl http://localhost:3001/api/health

# Vérifier l'URL configurée
cat ~/.config/verroupass-cli/config.json
```

### Impossible de se connecter

```bash
# Supprimer la session et réessayer
v-exit
v-login
```

### Erreur de déchiffrement

Cause probable : Mauvais mot de passe maître ou corruption de données.

Solution : Assurez-vous d'utiliser le même mot de passe maître que lors du chiffrement.

## Désinstallation

```bash
# Désinstaller globalement
npm uninstall -g verroupass-cli

# Supprimer la configuration
rm -rf ~/.config/verroupass-cli
```

## Développement

### Tester en local (sans installation globale)

```bash
cd cli
npm install
node src/index.js login
node src/index.js list
```

### Déboguer

Ajouter des console.log dans les fichiers sources et exécuter directement avec Node :

```bash
node src/index.js <commande>
```

## Support

Pour plus d'informations :
- Documentation principale : [../README.md](../README.md)
- Documentation serveur : [../server/README.md](../server/README.md)
- Guide de déploiement : [../DEPLOY.md](../DEPLOY.md)

## Licence

MIT - Voir le fichier [LICENSE](../LICENSE) pour plus de détails.
