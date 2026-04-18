#!/usr/bin/env node

/**
 * VerrouPass CLI
 * Interface en ligne de commande pour gérer vos mots de passe
 */

import { Command } from 'commander';
import chalk from 'chalk';
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

const program = new Command();

program
  .name('vpass')
  .description(chalk.blue('VerrouPass CLI - Gestionnaire de mots de passe zero-knowledge'))
  .version('1.0.0');

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

// Parser les arguments
program.parse(process.argv);
