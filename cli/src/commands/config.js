/**
 * Commande config - Configurer l'URL du serveur
 */

import inquirer from 'inquirer';
import chalk from 'chalk';
import { saveServerUrl, getServerUrl } from '../utils/config.js';

export async function configCommand(options) {
  console.log(chalk.blue.bold('\n⚙️  Configuration de VerrouPass CLI\n'));

  if (options.show) {
    // Afficher la configuration actuelle
    const currentUrl = getServerUrl();
    console.log(chalk.gray('URL du serveur actuelle:'));
    console.log(chalk.white(currentUrl));
    console.log();
    return;
  }

  if (options.url) {
    // Définir l'URL directement via option
    saveServerUrl(options.url);
    console.log(chalk.green('✓ URL du serveur mise à jour'));
    console.log(chalk.gray('Nouvelle URL:'), chalk.white(options.url));
    return;
  }

  // Mode interactif
  const currentUrl = getServerUrl();

  console.log(chalk.gray('URL actuelle:'), chalk.white(currentUrl));
  console.log();

  const { newUrl } = await inquirer.prompt([
    {
      type: 'input',
      name: 'newUrl',
      message: 'Nouvelle URL du serveur:',
      default: currentUrl,
      validate: (input) => {
        if (!input) return 'L\'URL est requise';
        if (!input.startsWith('http://') && !input.startsWith('https://')) {
          return 'L\'URL doit commencer par http:// ou https://';
        }
        return true;
      }
    }
  ]);

  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: `Confirmer le changement vers ${newUrl} ?`,
      default: true
    }
  ]);

  if (confirm) {
    saveServerUrl(newUrl);
    console.log(chalk.green('\n✓ Configuration mise à jour avec succès'));
    console.log(chalk.gray('Nouvelle URL:'), chalk.white(newUrl));
  } else {
    console.log(chalk.gray('Changement annulé'));
  }
}
