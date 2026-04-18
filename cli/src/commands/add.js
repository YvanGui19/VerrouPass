/**
 * Commande add - Ajouter une nouvelle entrée
 */

import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { createVaultItem } from '../utils/api.js';
import { encrypt, importKey } from '../utils/crypto.js';
import { isAuthenticated, getEncryptionKey } from '../utils/config.js';

export async function addCommand(options) {
  // Vérifier l'authentification
  if (!isAuthenticated()) {
    console.log(chalk.red('✗ Vous devez être connecté. Utilisez: vpass login'));
    process.exit(1);
  }

  console.log(chalk.blue.bold('\n➕ Ajouter une nouvelle entrée\n'));

  // Collecter les informations
  const questions = [];

  if (!options.name) {
    questions.push({
      type: 'input',
      name: 'name',
      message: 'Nom de l\'application:',
      validate: (input) => {
        if (!input) return 'Le nom est requis';
        return true;
      }
    });
  }

  if (!options.username) {
    questions.push({
      type: 'input',
      name: 'username',
      message: 'Identifiant / Email:',
      default: ''
    });
  }

  if (!options.password) {
    questions.push({
      type: 'password',
      name: 'password',
      message: 'Mot de passe:',
      mask: '*',
      default: ''
    });

    questions.push({
      type: 'confirm',
      name: 'generatePassword',
      message: 'Voulez-vous générer un mot de passe sécurisé ?',
      default: false,
      when: (answers) => !answers.password
    });
  }

  questions.push(
    {
      type: 'input',
      name: 'url',
      message: 'URL:',
      default: options.url || ''
    },
    {
      type: 'input',
      name: 'notes',
      message: 'Notes (optionnel):',
      default: options.notes || ''
    }
  );

  const answers = await inquirer.prompt(questions);

  // Gérer la génération de mot de passe
  let password = options.password || answers.password;

  if (answers.generatePassword) {
    const { generatePassword } = await import('./generate.js');
    password = await generatePassword({ length: 16, upper: true, lower: true, numbers: true, symbols: true, copy: false, silent: true });
    console.log(chalk.green(`✓ Mot de passe généré: ${chalk.white(password)}`));

    const { useGenerated } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'useGenerated',
        message: 'Utiliser ce mot de passe ?',
        default: true
      }
    ]);

    if (!useGenerated) {
      const { manualPassword } = await inquirer.prompt([
        {
          type: 'password',
          name: 'manualPassword',
          message: 'Entrez votre mot de passe:',
          mask: '*'
        }
      ]);
      password = manualPassword;
    }
  }

  // Préparer les données
  const data = {
    name: options.name || answers.name,
    username: options.username || answers.username,
    password: password,
    url: answers.url,
    notes: answers.notes
  };

  const spinner = ora('Chiffrement et enregistrement...').start();

  try {
    // Importer la clé de chiffrement
    const encKey = await importKey(getEncryptionKey());

    // Chiffrer les données
    const { encryptedData, iv } = await encrypt(data, encKey);

    // Envoyer au serveur
    await createVaultItem(encryptedData, iv);

    spinner.succeed(chalk.green('✓ Entrée ajoutée avec succès !'));
    console.log(chalk.gray('\nUtilisez'), chalk.cyan('vpass list'), chalk.gray('pour voir toutes vos entrées'));
  } catch (error) {
    spinner.fail(chalk.red('✗ Erreur'));
    console.error(chalk.red(`\n${error.message}`));
    process.exit(1);
  }
}
