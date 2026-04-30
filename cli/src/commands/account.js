/**
 * Commande account - Gérer le compte utilisateur
 */

import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { deleteAccount } from '../utils/api.js';
import { hashForServer } from '../utils/crypto.js';
import { deriveKeysForUser } from '../utils/deriveForUser.js';
import { isAuthenticated, getUser, clearSession } from '../utils/config.js';

export async function deleteAccountCommand() {
  // Vérifier l'authentification
  if (!isAuthenticated()) {
    console.log(chalk.red('Vous devez être connecté. Utilisez: v-login'));
    process.exit(1);
  }

  const user = getUser();

  console.log(chalk.red.bold('\nSuppression de compte\n'));
  console.log(chalk.yellow.bold('ATTENTION: Cette action est IRRÉVERSIBLE !'));
  console.log('');
  console.log('Toutes vos données seront définitivement supprimées:');
  console.log('  - Tous vos mots de passe sauvegardés');
  console.log('  - Toutes vos notes');
  console.log('  - Votre compte utilisateur');
  console.log('');
  console.log(chalk.gray(`Compte: ${user.email}`));
  console.log('');

  // Première confirmation
  const { confirmFirst } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirmFirst',
      message: 'Êtes-vous sûr de vouloir supprimer votre compte ?',
      default: false
    }
  ]);

  if (!confirmFirst) {
    console.log(chalk.gray('Suppression annulée'));
    return;
  }

  // Deuxième confirmation avec saisie
  const { confirmText } = await inquirer.prompt([
    {
      type: 'input',
      name: 'confirmText',
      message: 'Tapez "SUPPRIMER" en majuscules pour confirmer:',
      validate: (input) => {
        if (input === 'SUPPRIMER') {
          return true;
        }
        return 'Vous devez taper exactement "SUPPRIMER" pour confirmer';
      }
    }
  ]);

  if (confirmText !== 'SUPPRIMER') {
    console.log(chalk.gray('Suppression annulée'));
    return;
  }

  // Demander le mot de passe maître
  const { masterPassword } = await inquirer.prompt([
    {
      type: 'password',
      name: 'masterPassword',
      message: 'Mot de passe maître (pour confirmation):',
      mask: '*',
      validate: (input) => {
        if (!input || input.length < 8) {
          return 'Le mot de passe doit contenir au moins 8 caractères';
        }
        return true;
      }
    }
  ]);

  const spinner = ora('Vérification et suppression du compte...').start();

  try {
    // Deriver les cles avec le KDF actuel du user (interroge /kdf-info).
    const { authKey } = await deriveKeysForUser(masterPassword, user.email);
    const hashedPassword = await hashForServer(authKey);

    // Supprimer le compte
    const response = await deleteAccount(hashedPassword);

    // Effacer la session locale
    clearSession();

    spinner.succeed(chalk.green('Compte supprimé avec succès'));
    console.log('');
    console.log(chalk.gray(`${response.deletedItems} mot(s) de passe supprimé(s)`));
    console.log('');
    console.log(chalk.white('Votre compte et toutes vos données ont été définitivement supprimés.'));
    console.log(chalk.gray('Au revoir !'));
    console.log('');
  } catch (error) {
    spinner.fail(chalk.red('Erreur lors de la suppression'));
    console.error(chalk.red(`\n${error.message}`));
    process.exit(1);
  }
}
