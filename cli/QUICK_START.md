# Démarrage rapide - VerrouPass CLI

Guide rapide pour installer et utiliser la CLI VerrouPass en 5 minutes.

## Installation (2 min)

```bash
# 1. Aller dans le dossier CLI
cd cli

# 2. Installer les dépendances
npm install

# 3. Installer globalement
npm run install-global

# 4. Vérifier l'installation
v-man
```

## Première utilisation (3 min)

### 1. Démarrer le serveur (si pas déjà fait)

```bash
# Dans un autre terminal, depuis la racine du projet
cd server
npm run dev
```

### 2. Se connecter

```bash
v-login
```

Entrez votre email et mot de passe maître (le même que pour l'interface web).

### 3. Commandes de base

```bash
# Lister toutes vos entrées
v-ls

# Voir une entrée spécifique et copier le mot de passe
v-cat GitHub -c

# Ajouter une nouvelle entrée
v-touch

# Rechercher
v-grep google

# Générer un mot de passe
v-gen -l 20 -c

# Modifier une entrée
v-nano Gmail

# Supprimer une entrée
v-rm "Old Account"

# Se déconnecter
v-exit
```

## Exemples pratiques

### Récupérer rapidement un mot de passe

```bash
# Copie automatique dans le presse-papiers
v-cat GitHub -c

# Maintenant collez (Ctrl+V) où vous voulez !
```

### Ajouter une nouvelle entrée rapidement

```bash
# Générer un mot de passe et le copier
v-gen -l 20 -c

# Ajouter l'entrée (le mot de passe est déjà dans le presse-papiers)
v-touch -n "NewService" -u "john@example.com"
# Puis collez le mot de passe quand demandé
```

### Workflow complet

```bash
# 1. Se connecter le matin
v-login -e john@example.com

# 2. Voir ce que vous avez
v-ls --short

# 3. Récupérer des mots de passe au besoin
v-cat Gmail -c
v-cat GitHub -c

# 4. Ajouter de nouveaux comptes
v-touch

# 5. Se déconnecter le soir
v-exit
```

## Astuces

### Alias pratiques

Ajoutez ces alias à votre `.bashrc` ou `.zshrc` :

```bash
# Alias pour les commandes fréquentes
alias vpl='v-ls'
alias vpg='v-cat'
alias vpa='v-touch'
alias vps='v-grep'
alias vpgen='v-gen -c'
```

Ensuite :

```bash
vpl                    # Liste les entrées
vpg GitHub -c          # Récupère GitHub
vpgen                  # Génère et copie un mot de passe
```

### Recherche rapide

```bash
# Trouver toutes les entrées Google
v-grep google

# Trouver par identifiant
v-grep john@gmail.com
```

### Copie automatique

```bash
# Toujours avec -c pour copier automatiquement
v-cat GitHub -c
v-gen -c
```

## Commandes essentielles

```bash
v-login              # Se connecter
v-ls                 # Lister
v-cat <nom> -c       # Récupérer et copier
v-touch              # Ajouter
v-grep <query>       # Rechercher
v-gen -c             # Générer un mot de passe
v-exit               # Se déconnecter
```

## Aide

```bash
# Aide générale
v-man

# Aide sur une commande spécifique
v-cat --help
v-gen --help
```

## Support

Documentation complète : [README.md](./README.md)

---

**C'est tout ! Vous êtes prêt à utiliser VerrouPass depuis le terminal. 🚀**
