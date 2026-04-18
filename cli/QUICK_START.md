# Démarrage rapide - VerrouPass CLI

Guide rapide pour installer et utiliser la CLI VerrouPass en 5 minutes.

## Installation (2 min)

```bash
# 1. Aller dans le dossier CLI
cd D:\Code\VerrouPass\cli

# 2. Installer les dépendances
npm install

# 3. Installer globalement
npm run install-global

# 4. Vérifier l'installation
vpass --version
```

## Première utilisation (3 min)

### 1. Démarrer le serveur (si pas déjà fait)

```bash
# Dans un autre terminal
cd D:\Code\VerrouPass\server
npm run dev
```

### 2. Se connecter

```bash
vpass login
```

Entrez votre email et mot de passe maître (le même que pour l'interface web).

### 3. Commandes de base

```bash
# Lister toutes vos entrées
vpass list

# Voir une entrée spécifique et copier le mot de passe
vpass get GitHub -c

# Ajouter une nouvelle entrée
vpass add

# Rechercher
vpass search google

# Générer un mot de passe
vpass generate -l 20 -c

# Modifier une entrée
vpass edit Gmail

# Supprimer une entrée
vpass delete "Old Account"

# Se déconnecter
vpass logout
```

## Exemples pratiques

### Récupérer rapidement un mot de passe

```bash
# Copie automatique dans le presse-papiers
vpass get GitHub -c

# Maintenant collez (Ctrl+V) où vous voulez !
```

### Ajouter une nouvelle entrée rapidement

```bash
# Générer un mot de passe et le copier
vpass generate -l 20 -c

# Ajouter l'entrée (le mot de passe est déjà dans le presse-papiers)
vpass add -n "NewService" -u "john@example.com"
# Puis collez le mot de passe quand demandé
```

### Workflow complet

```bash
# 1. Se connecter le matin
vpass login -e john@example.com

# 2. Voir ce que vous avez
vpass list --short

# 3. Récupérer des mots de passe au besoin
vpass get Gmail -c
vpass get GitHub -c

# 4. Ajouter de nouveaux comptes
vpass add

# 5. Se déconnecter le soir
vpass logout
```

## Astuces

### Alias pratiques

Ajoutez ces alias à votre `.bashrc` ou `.zshrc` :

```bash
# Alias pour les commandes fréquentes
alias vpl='vpass list'
alias vpg='vpass get'
alias vpa='vpass add'
alias vps='vpass search'
alias vpgen='vpass generate -c'
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
vpass search google

# Trouver par identifiant
vpass search john@gmail.com
```

### Copie automatique

```bash
# Toujours avec -c pour copier automatiquement
vpass get GitHub -c
vpass generate -c
```

## Commandes essentielles

```bash
vpass login              # Se connecter
vpass list              # Lister
vpass get <nom> -c      # Récupérer et copier
vpass add               # Ajouter
vpass search <query>    # Rechercher
vpass generate -c       # Générer un mot de passe
vpass logout            # Se déconnecter
```

## Aide

```bash
# Aide générale
vpass --help

# Aide sur une commande spécifique
vpass get --help
vpass generate --help
```

## Support

Documentation complète : [README.md](./README.md)

---

**C'est tout ! Vous êtes prêt à utiliser VerrouPass depuis le terminal. 🚀**
