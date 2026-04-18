# VerrouPass CLI

Interface en ligne de commande pour votre gestionnaire de mots de passe zero-knowledge.

## Installation rapide

### Windows

1. Décompressez le fichier ZIP
2. Double-cliquez sur `install.bat`
3. Suivez les instructions

Des raccourcis peuvent être créés sur le Bureau et dans le Menu Démarrer.

### Linux

1. Décompressez le fichier ZIP
2. Ouvrez un terminal dans le dossier
3. Rendez le script exécutable : `chmod +x install.sh`
4. Lancez l'installateur : `./install.sh`
5. Suivez les instructions

Des raccourcis peuvent être créés sur le Bureau et dans le menu Applications.

### macOS

1. Décompressez le fichier ZIP
2. Ouvrez un terminal dans le dossier
3. Rendez le script exécutable : `chmod +x install.sh`
4. Lancez l'installateur : `./install.sh`
5. Suivez les instructions

Pour plus de détails, voir le fichier `INSTALLATION.txt`

## Utilisation

Toutes les commandes utilisent le préfixe `v-` pour une frappe rapide.

### Authentification

```bash
# Se connecter
v-login

# Se déconnecter
v-logout
```

### Gestion des mots de passe

```bash
# Lister toutes vos entrées
v-list
# ou
v-ls

# Rechercher une entrée
v-search <terme>
# ou
v-find <terme>

# Afficher une entrée et copier le mot de passe
v-get <nom> -c

# Ajouter une nouvelle entrée
v-add

# Modifier une entrée
v-edit <nom>

# Supprimer une entrée
v-delete <nom>
# ou
v-rm <nom>
```

### Génération de mots de passe

```bash
# Générer un mot de passe aléatoire
v-generate
# ou
v-gen

# Avec options personnalisées
v-gen -l 20 --no-symbols -c
```

Options:
- `-l, --length <nombre>` : Longueur (12-128, défaut: 16)
- `--no-upper` : Exclure les majuscules
- `--no-lower` : Exclure les minuscules
- `--no-numbers` : Exclure les chiffres
- `--no-symbols` : Exclure les symboles
- `-c, --copy` : Copier dans le presse-papier

### Configuration

```bash
# Configurer l'URL du serveur
v-config --url https://api.verroupass.fr

# Afficher la configuration
v-config --show
```

### Suppression de compte

```bash
# Supprimer définitivement votre compte et toutes vos données
v-account-delete
```

**ATTENTION:** Cette action est irréversible et supprimera:
- Tous vos mots de passe sauvegardés
- Toutes vos notes
- Votre compte utilisateur

Une triple confirmation sera demandée pour éviter toute suppression accidentelle.

### Aide

```bash
# Aide générale (utiliser vpass pour l'aide)
vpass --help

# Aide sur une commande spécifique
v-login --help
v-get --help
```

## Sécurité

- Votre mot de passe maître n'est jamais envoyé au serveur
- Tous vos mots de passe sont chiffrés localement avant d'être synchronisés
- Le serveur ne peut jamais déchiffrer vos données (zero-knowledge)

## Support

Pour plus d'informations, consultez la documentation sur https://verroupass.yvangui.fr
