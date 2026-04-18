/**
 * Commande get - Récupérer une entrée spécifique
 */

import chalk from 'chalk';
import ora from 'ora';
import clipboard from 'clipboardy';
import { getVaultItems } from '../utils/api.js';
import { decrypt, importKey } from '../utils/crypto.js';
import { isAuthenticated, getEncryptionKey } from '../utils/config.js';

export async function getCommand(name, options) {
  // Vérifier l'authentification
  if (!isAuthenticated()) {
    console.log(chalk.red('✗ Vous devez être connecté. Utilisez: vpass login'));
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
      spinner.fail(chalk.red(`✗ Aucune entrée trouvée pour "${name}"`));
      console.log(chalk.gray('\nUtilisez'), chalk.cyan('vpass list'), chalk.gray('pour voir toutes les entrées'));
      process.exit(1);
    }

    spinner.succeed(chalk.green('✓ Entrée trouvée'));

    // Afficher les détails
    console.log('\n' + chalk.blue.bold('═'.repeat(60)));
    console.log(chalk.white.bold(`  ${decryptedData.name}`));
    console.log(chalk.blue.bold('═'.repeat(60)));
    console.log();

    if (decryptedData.username) {
      console.log(chalk.gray('Identifiant:    ') + chalk.white(decryptedData.username));
    }

    if (decryptedData.password) {
      const password = options.showPassword
        ? chalk.white(decryptedData.password)
        : chalk.gray('••••••••••••');
      console.log(chalk.gray('Mot de passe:   ') + password);
    }

    if (decryptedData.url) {
      console.log(chalk.gray('URL:            ') + chalk.blue(decryptedData.url));
    }

    if (decryptedData.notes) {
      console.log(chalk.gray('Notes:          ') + chalk.white(decryptedData.notes));
    }

    console.log();
    console.log(chalk.gray('Créé le:        ') + new Date(foundItem.created_at).toLocaleString('fr-FR'));
    console.log(chalk.gray('Modifié le:     ') + new Date(foundItem.updated_at).toLocaleString('fr-FR'));
    console.log();

    // Copier dans le presse-papiers si demandé
    if (options.copy && decryptedData.password) {
      try {
        await clipboard.write(decryptedData.password);
        console.log(chalk.green('✓ Mot de passe copié dans le presse-papiers'));
        console.log(chalk.yellow('  Il sera automatiquement effacé après 30 secondes'));

        // Effacer le presse-papiers après 30 secondes
        setTimeout(async () => {
          try {
            const current = await clipboard.read();
            if (current === decryptedData.password) {
              await clipboard.write('');
            }
          } catch (error) {
            // Ignorer les erreurs
          }
        }, 30000);
      } catch (error) {
        console.log(chalk.red('✗ Impossible de copier dans le presse-papiers'));
      }
    }
  } catch (error) {
    spinner.fail(chalk.red('✗ Erreur'));
    console.error(chalk.red(`\n${error.message}`));
    process.exit(1);
  }
}
