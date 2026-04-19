/**
 * Commande edit - Modifier une entrée existante
 */

import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { getVaultItems, updateVaultItem } from '../utils/api.js';
import { decrypt, encrypt, importKey } from '../utils/crypto.js';
import { isAuthenticated, getEncryptionKey } from '../utils/config.js';

export async function editCommand(name) {
  // Vérifier l'authentification
  if (!isAuthenticated()) {
    console.log(chalk.red('Vous devez être connecté. Utilisez: v-login'));
    process.exit(1);
  }

  const spinner = ora('Recherche de l\'entrée...').start();

  try {
    // Récupérer toutes les entrées
    const items = await getVaultItems();

    // Importer la clé de chiffrement
    const encKey = await importKey(getEncryptionKey());

    // Chercher l'entrée correspondante
    let foundItem = null;
    let decryptedData = null;

    for (const item of items) {
      try {
        const data = await decrypt(item.encrypted_data, item.iv, encKey);
        if (data.name.toLowerCase() === name.toLowerCase()) {
          foundItem = item;
          decryptedData = data;
          break;
        }
      } catch (error) {
        // Ignorer les erreurs de déchiffrement
      }
    }

    if (!foundItem) {
      spinner.fail(chalk.red(`Aucune entrée trouvée pour "${name}"`));
      process.exit(1);
    }

    spinner.succeed(chalk.green('Entrée trouvée'));

    console.log(chalk.blue.bold(`\nModifier: ${decryptedData.name}\n`));
    console.log(chalk.gray('Laissez vide pour conserver la valeur actuelle\n'));

    // Demander les nouvelles valeurs
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'Nom:',
        default: decryptedData.name
      },
      {
        type: 'input',
        name: 'username',
        message: 'Identifiant:',
        default: decryptedData.username || ''
      },
      {
        type: 'confirm',
        name: 'changePassword',
        message: 'Modifier le mot de passe ?',
        default: false
      },
      {
        type: 'password',
        name: 'password',
        message: 'Nouveau mot de passe:',
        mask: '*',
        when: (answers) => answers.changePassword,
        default: decryptedData.password || ''
      },
      {
        type: 'input',
        name: 'url',
        message: 'URL:',
        default: decryptedData.url || ''
      },
      {
        type: 'input',
        name: 'notes',
        message: 'Notes:',
        default: decryptedData.notes || ''
      }
    ]);

    // Préparer les nouvelles données
    const newData = {
      name: answers.name || decryptedData.name,
      username: answers.username || decryptedData.username,
      password: answers.changePassword ? answers.password : decryptedData.password,
      url: answers.url || decryptedData.url,
      notes: answers.notes || decryptedData.notes
    };

    const updateSpinner = ora('Chiffrement et mise à jour...').start();

    // Chiffrer les nouvelles données
    const { encryptedData, iv } = await encrypt(newData, encKey);

    // Envoyer la mise à jour
    await updateVaultItem(foundItem.id, encryptedData, iv);

    updateSpinner.succeed(chalk.green('Entrée modifiée avec succès !'));
  } catch (error) {
    spinner.fail(chalk.red('Erreur'));
    console.error(chalk.red(`\n${error.message}`));
    process.exit(1);
  }
}
