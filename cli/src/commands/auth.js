/**
 * Commandes d'authentification
 */

import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { deriveKeys, hashForServer, exportKey } from '../utils/crypto.js';
import { login as apiLogin, loginTotp as apiLoginTotp } from '../utils/api.js';
import {
  saveToken,
  saveUser,
  saveEncryptionKey,
  clearSession,
  isAuthenticated,
  getUser
} from '../utils/config.js';

// Prompt utilisateur pour la 2e etape 2FA. Demande d abord le mode (TOTP ou
// code de secours), puis le code, avec validation de format. Renvoie un objet
// { totpCode } OU { recoveryCode } pretes a etre passees a apiLoginTotp.
async function promptTotpStep() {
  const { method } = await inquirer.prompt([
    {
      type: 'list',
      name: 'method',
      message: 'Methode de verification 2FA :',
      choices: [
        { name: 'Code a 6 chiffres (application authenticator)', value: 'totp' },
        { name: 'Code de secours', value: 'recovery' }
      ]
    }
  ]);

  if (method === 'totp') {
    const { code } = await inquirer.prompt([
      {
        type: 'input',
        name: 'code',
        message: 'Code a 6 chiffres :',
        filter: (input) => (input || '').trim().replace(/\s/g, ''),
        validate: (input) => /^\d{6}$/.test(input)
          ? true
          : 'Le code doit etre exactement 6 chiffres'
      }
    ]);
    return { totpCode: code };
  }

  const { code } = await inquirer.prompt([
    {
      type: 'input',
      name: 'code',
      message: 'Code de secours (XXXX-XXXX-XXXX-XXXX) :',
      filter: (input) => (input || '').trim(),
      validate: (input) => {
        const cleaned = input.toUpperCase().replace(/[\s-]/g, '');
        return /^[A-Z2-7]{16}$/.test(cleaned)
          ? true
          : 'Code de secours invalide (16 caracteres base32 attendus)';
      }
    }
  ]);
  return { recoveryCode: code };
}

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
    const passwordHash = await hashForServer(authKey);

    spinner.text = 'Connexion au serveur...';

    let response = await apiLogin(email, passwordHash);

    // Si le compte a la 2FA active, le serveur retourne { totpRequired: true,
    // challenge } sans poser de cookies ni renvoyer de token. Il faut une 2e
    // etape avec un code TOTP ou un code de secours.
    if (response.totpRequired) {
      spinner.stop();
      console.log(chalk.yellow('\n2FA activee sur ce compte.'));

      const factor = await promptTotpStep();
      spinner.start('Verification 2FA...');

      response = await apiLoginTotp({
        challenge: response.challenge,
        ...factor
      });

      if (factor.recoveryCode) {
        spinner.warn(chalk.yellow(
          `Code de secours utilise. Codes restants : ${response.recoveryCodesRemaining ?? '?'}.`
        ));
        spinner.start();
      }
    }

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
