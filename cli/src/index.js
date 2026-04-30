#!/usr/bin/env node

/**
 * VerrouPass CLI
 * Interface en ligne de commande pour gérer vos mots de passe
 */

import { Command } from 'commander';
import { pathToFileURL } from 'url';
import { c } from './utils/themes.js';
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

// Mapping des commandes Linux-style vers les commandes commander internes.
// `v-ls` -> list, `v-man` -> --help, `v-exit` -> logout, etc.
const BIN_ALIASES = {
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

// Injection de la commande quand le CLI est lance via un bin v-X.
// Apres `npm install -g`, npm cree un wrapper par bin. Sur Windows c'est
// un .cmd qui invoque `node .../index.js`, donc process.argv[1] vaut le
// chemin de index.js et ne nous renseigne plus sur le bin choisi (cf bug
// historique qui empechait v-login/v-ls/etc. de fonctionner sous Windows).
// On passe donc le nom du bin explicitement via les stubs `bin/v-*.js`,
// qui appellent runCli(binName).
export function injectBinCommand(binName) {
  if (!binName || !binName.startsWith('v-')) return;
  const command = binName.slice(2);
  const actualCommand = BIN_ALIASES[command] || command;
  process.argv.splice(2, 0, actualCommand);
}

export function runCli(binName) {
  injectBinCommand(binName);

  // Verification automatique des mises a jour (1x/jour max, non bloquant)
  autoCheckUpdate().catch(() => {}); // Silencieux en cas d'erreur

  const program = new Command();

  program
    .name('v')
    .description(c.primary('VerrouPass CLI - Gestionnaire de mots de passe zero-knowledge'))
    .version('2.3.0');

  program
    .command('login')
    .description('Se connecter à votre compte VerrouPass')
    .option('-e, --email <email>', 'Email de connexion')
    .action(loginCommand);

  program
    .command('logout')
    .description('Se déconnecter de votre compte')
    .action(logoutCommand);

  program
    .command('list')
    .alias('ls')
    .description('Lister toutes les entrées de votre coffre')
    .option('-s, --short', 'Affichage court (noms uniquement)')
    .action(listCommand);

  program
    .command('get <name>')
    .description('Récupérer une entrée spécifique')
    .option('-c, --copy', 'Copier le mot de passe dans le presse-papiers')
    .option('-p, --show-password', 'Afficher le mot de passe en clair')
    .action(getCommand);

  program
    .command('search <query>')
    .alias('find')
    .description('Rechercher dans vos entrées')
    .action(searchCommand);

  program
    .command('add')
    .description('Ajouter une nouvelle entrée au coffre')
    .option('-n, --name <name>', 'Nom de l\'application')
    .option('-u, --username <username>', 'Nom d\'utilisateur ou email')
    .option('-p, --password <password>', 'Mot de passe')
    .option('--url <url>', 'URL du service')
    .option('--notes <notes>', 'Notes supplémentaires')
    .action(addCommand);

  program
    .command('edit <name>')
    .description('Modifier une entrée existante')
    .action(editCommand);

  program
    .command('delete <name>')
    .alias('rm')
    .description('Supprimer une entrée du coffre')
    .option('-f, --force', 'Supprimer sans confirmation')
    .action(deleteCommand);

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

  program
    .command('config')
    .description('Configurer l\'URL du serveur')
    .option('--url <url>', 'Définir l\'URL du serveur')
    .option('--show', 'Afficher la configuration actuelle')
    .action(configCommand);

  program
    .command('account-delete')
    .description('Supprimer définitivement votre compte et toutes vos données')
    .action(deleteAccountCommand);

  program
    .command('update')
    .description('Vérifier et installer les mises à jour')
    .action(updateCommand);

  program.parse(process.argv);
}

// Auto-execution quand on lance `node src/index.js [args]` directement
// (cas dev/debug). En prod, les bins passent par les stubs bin/v-*.js
// qui importent ce module et appellent runCli(binName) explicitement.
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  runCli(null);
}
