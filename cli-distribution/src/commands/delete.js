/**
 * Commande delete - Supprimer une entrée
 */

import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { getVaultItems, deleteVaultItem } from '../utils/api.js';
import { decrypt, importKey } from '../utils/crypto.js';
import { isAuthenticated, getEncryptionKey } from '../utils/config.js';

export async function deleteCommand(name, options) {
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

    // Confirmer la suppression (sauf si --force)
    if (!options.force) {
      console.log(chalk.yellow.bold('\nATTENTION: Cette action est irréversible !\n'));
      console.log(chalk.gray('Entrée à supprimer:'));
      console.log(chalk.white(`  Nom: ${decryptedData.name}`));
      console.log(chalk.white(`  Identifiant: ${decryptedData.username || '-'}`));
      console.log();

      const { confirm } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: 'Êtes-vous sûr de vouloir supprimer cette entrée ?',
          default: false
        }
      ]);

      if (!confirm) {
        console.log(chalk.gray('Suppression annulée'));
        return;
      }
    }

    const deleteSpinner = ora('Suppression en cours...').start();

    // Supprimer l'entrée
    await deleteVaultItem(foundItem.id);

    deleteSpinner.succeed(chalk.green('Entrée supprimée avec succès'));
  } catch (error) {
    spinner.fail(chalk.red('Erreur'));
    console.error(chalk.red(`\n${error.message}`));
    process.exit(1);
  }
}
