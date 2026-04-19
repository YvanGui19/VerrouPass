/**
 * Commandes d'authentification
 */

import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { deriveKeys, hashForServer, exportKey } from '../utils/crypto.js';
import { login as apiLogin } from '../utils/api.js';
import {
  saveToken,
  saveUser,
  saveEncryptionKey,
  clearSession,
  isAuthenticated,
  getUser
} from '../utils/config.js';

export async function loginCommand(options) {
  console.log(chalk.blue.bold('\nConnexion à VerrouPass\n'));

  // Vérifier si déjà connecté
  if (isAuthenticated()) {
    const currentUser = getUser();
    console.log(chalk.yellow(`Vous êtes déjà connecté en tant que ${currentUser.email}`));
    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: 'Voulez-vous vous reconnecter ?',
        default: false
      }
    ]);

    if (!confirm) {
      return;
    }

    clearSession();
  }

  // Demander les identifiants
  let email = options.email;
  let masterPassword;

  const questions = [];

  if (!email) {
    questions.push({
      type: 'input',
      name: 'email',
      message: 'Email:',
      validate: (input) => {
        if (!input || !input.includes('@')) {
          return 'Veuillez entrer un email valide';
        }
        return true;
      }
    });
  }

  questions.push({
    type: 'password',
    name: 'masterPassword',
    message: 'Mot de passe maître:',
    mask: '*',
    validate: (input) => {
      if (!input || input.length < 12) {
        return 'Le mot de passe doit contenir au moins 12 caractères (recommandation OWASP)';
      }
      return true;
    }
  });

  const answers = await inquirer.prompt(questions);
  email = email || answers.email;
  masterPassword = answers.masterPassword;

  // Dérivation des clés
  const spinner = ora('Dérivation des clés de chiffrement...').start();

  try {
    const { authKey, encKey } = await deriveKeys(masterPassword, email);
    const hashedPassword = await hashForServer(authKey);

    spinner.text = 'Connexion au serveur...';

    // Connexion au serveur
    const response = await apiLogin(email, hashedPassword);

    // Sauvegarder la session
    saveToken(response.token);
    saveUser(response.user);

    // Exporter et sauvegarder la clé de chiffrement
    const exportedKey = await exportKey(encKey);
    saveEncryptionKey(exportedKey);

    spinner.succeed(chalk.green('Connexion réussie !'));
    console.log(chalk.gray(`\nConnecté en tant que: ${chalk.white(response.user.email)}`));
    console.log(chalk.gray('Utilisez'), chalk.cyan('v-ls'), chalk.gray('pour voir vos entrées'));
  } catch (error) {
    spinner.fail(chalk.red('Erreur de connexion'));
    console.error(chalk.red(`\n${error.message}`));
    process.exit(1);
  }
}

export async function logoutCommand() {
  if (!isAuthenticated()) {
    console.log(chalk.yellow('Vous n\'êtes pas connecté'));
    return;
  }

  const user = getUser();

  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: `Se déconnecter de ${user.email} ?`,
      default: true
    }
  ]);

  if (confirm) {
    clearSession();
    console.log(chalk.green('Déconnexion réussie'));
  }
}
