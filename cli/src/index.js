#!/usr/bin/env node

/**
 * VerrouPass CLI
 * Interface en ligne de commande pour gérer vos mots de passe
 */

import { Command } from 'commander';
import chalk from 'chalk';
import path from 'path';
import { fileURLToPath } from 'url';
import { c } from './utils/themes.js';

// Détecter le nom du binaire appelé pour les commandes v-*
const binName = path.basename(process.argv[1]);

// Si appelé via v-<commande>, injecter la commande dans les arguments
if (binName.startsWith('v-')) {
  const command = binName.slice(2); // Enlever "v-"
  // Mapper les commandes Linux-style vers les commandes internes
  const aliases = {
    'ls': 'list',
    'cat': 'get',
    'grep': 'search',
    'find': 'search',
    'touch': 'add',
    'nano': 'edit',
    'rm': 'delete',
    'gen': 'generate',
    'exit': 'logout',
    'man': '--help'
  };
  const actualCommand = aliases[command] || command;
  // Injecter la commande dans argv avant les autres arguments
  process.argv.splice(2, 0, actualCommand);
}
import { loginCommand } from './commands/auth.js';
import { logoutCommand } from './commands/auth.js';
import { listCommand } from './commands/list.js';
import { getCommand } from './commands/get.js';
import { addCommand } from './commands/add.js';
import { editCommand } from './commands/edit.js';
import { deleteCommand } from './commands/delete.js';
import { generateCommand } from './commands/generate.js';
import { searchCommand } from './commands/search.js';
import { configCommand } from './commands/config.js';
import { deleteAccountCommand } from './commands/account.js';
import { updateCommand } from './commands/update.js';
import { autoCheckUpdate } from './utils/autoUpdateCheck.js';

// Vérification automatique des mises à jour (une fois par jour max, non bloquant)
autoCheckUpdate().catch(() => {}); // Silencieux en cas d'erreur

const program = new Command();

program
  .name('v')
  .description(c.primary('VerrouPass CLI - Gestionnaire de mots de passe zero-knowledge'))
  .version('2.0.0');

// Commande: login
program
  .command('login')
  .description('Se connecter à votre compte VerrouPass')
  .option('-e, --email <email>', 'Email de connexion')
  .action(loginCommand);

// Commande: logout
program
  .command('logout')
  .description('Se déconnecter de votre compte')
  .action(logoutCommand);

// Commande: list
program
  .command('list')
  .alias('ls')
  .description('Lister toutes les entrées de votre coffre')
  .option('-s, --short', 'Affichage court (noms uniquement)')
  .action(listCommand);

// Commande: get
program
  .command('get <name>')
  .description('Récupérer une entrée spécifique')
  .option('-c, --copy', 'Copier le mot de passe dans le presse-papiers')
  .option('-p, --show-password', 'Afficher le mot de passe en clair')
  .action(getCommand);

// Commande: search
program
  .command('search <query>')
  .alias('find')
  .description('Rechercher dans vos entrées')
  .action(searchCommand);

// Commande: add
program
  .command('add')
  .description('Ajouter une nouvelle entrée au coffre')
  .option('-n, --name <name>', 'Nom de l\'application')
  .option('-u, --username <username>', 'Nom d\'utilisateur ou email')
  .option('-p, --password <password>', 'Mot de passe')
  .option('--url <url>', 'URL du service')
  .option('--notes <notes>', 'Notes supplémentaires')
  .action(addCommand);

// Commande: edit
program
  .command('edit <name>')
  .description('Modifier une entrée existante')
  .action(editCommand);

// Commande: delete
program
  .command('delete <name>')
  .alias('rm')
  .description('Supprimer une entrée du coffre')
  .option('-f, --force', 'Supprimer sans confirmation')
  .action(deleteCommand);

// Commande: generate
program
  .command('generate')
  .alias('gen')
  .description('Générer un mot de passe sécurisé')
  .option('-l, --length <number>', 'Longueur du mot de passe', '16')
  .option('--no-upper', 'Exclure les majuscules')
  .option('--no-lower', 'Exclure les minuscules')
  .option('--no-numbers', 'Exclure les chiffres')
  .option('--no-symbols', 'Exclure les symboles')
  .option('-c, --copy', 'Copier dans le presse-papiers')
  .action(generateCommand);

// Commande: config
program
  .command('config')
  .description('Configurer l\'URL du serveur')
  .option('--url <url>', 'Définir l\'URL du serveur')
  .option('--show', 'Afficher la configuration actuelle')
  .action(configCommand);

// Commande: account delete
program
  .command('account-delete')
  .description('Supprimer définitivement votre compte et toutes vos données')
  .action(deleteAccountCommand);

// Commande: update
program
  .command('update')
  .description('Vérifier et installer les mises à jour')
  .action(updateCommand);

// Parser les arguments
program.parse(process.argv);
