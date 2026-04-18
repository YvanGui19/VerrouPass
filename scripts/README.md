# Scripts de gestion VerrouPass

Ce dossier contient des scripts utiles pour la gestion de votre application VerrouPass.

## Scripts disponibles

### db-setup.sql
Initialise la structure de la base de données (tables, index, etc.).

**Usage:**
```bash
sudo -u postgres psql verroupass < scripts/db-setup.sql
```

### backup.sh
Crée une sauvegarde complète de la base de données PostgreSQL.

**Usage:**
```bash
chmod +x scripts/backup.sh
./scripts/backup.sh
```

Les sauvegardes sont stockées dans `/var/backups/verroupass/` et sont automatiquement compressées en gzip. Les sauvegardes de plus de 30 jours sont automatiquement supprimées.

**Sauvegarde automatique avec cron:**
```bash
# Éditer le crontab
crontab -e

# Ajouter cette ligne pour une sauvegarde quotidienne à 2h du matin
0 2 * * * /var/www/verroupass/scripts/backup.sh
```

### restore.sh
Restaure la base de données à partir d'une sauvegarde.

**Usage:**
```bash
chmod +x scripts/restore.sh
./scripts/restore.sh /var/backups/verroupass/backup_20260417_020000.sql.gz
```

⚠️ **ATTENTION:** Cette opération écrase toutes les données actuelles !

### db-stats.sh
Affiche des statistiques détaillées sur la base de données.

**Usage:**
```bash
chmod +x scripts/db-stats.sh
./scripts/db-stats.sh
```

Affiche:
- Nombre d'utilisateurs
- Nombre de mots de passe stockés
- Taille de la base de données
- Taille de chaque table
- Utilisateurs les plus actifs
- Connexions actives

## Permissions

Pour rendre les scripts exécutables:

```bash
chmod +x scripts/*.sh
```

## Conseils de sécurité

1. **Sauvegardes régulières**: Configurez des sauvegardes automatiques quotidiennes
2. **Stockage externe**: Copiez les sauvegardes sur un serveur externe ou service cloud
3. **Tests de restauration**: Testez régulièrement vos sauvegardes
4. **Protection des fichiers**: Assurez-vous que les sauvegardes ne sont accessibles qu'aux utilisateurs autorisés

```bash
# Protéger les sauvegardes
sudo chmod 700 /var/backups/verroupass
sudo chown postgres:postgres /var/backups/verroupass
```
