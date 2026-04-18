/**
 * Commande list - Lister toutes les entrées du coffre
 */

import chalk from 'chalk';
import ora from 'ora';
import { table } from 'table';
import { getVaultItems } from '../utils/api.js';
import { decrypt, importKey } from '../utils/crypto.js';
import { isAuthenticated, getEncryptionKey } from '../utils/config.js';

export async function listCommand(options) {
  // Vérifier l'authentification
  if (!isAuthenticated()) {
    console.log(chalk.red('Vous devez être connecté. Utilisez: v-login'));
    process.exit(1);
  }

  const spinner = ora('Récupération des entrées...').start();

  try {
    // Récupérer les entrées chiffrées
    const items = await getVaultItems();

    if (items.length === 0) {
      spinner.info(chalk.yellow('Votre coffre est vide'));
      console.log(chalk.gray('Utilisez'), chalk.cyan('v-add'), chalk.gray('pour ajouter une entrée'));
      return;
    }

    spinner.text = 'Déchiffrement des données...';

    // Importer la clé de chiffrement
    const encKey = await importKey(getEncryptionKey());

    // Déchiffrer toutes les entrées
    const decryptedItems = await Promise.all(
      items.map(async (item) => {
        try {
          const data = await decrypt(item.encrypted_data, item.iv, encKey);
          return {
            id: item.id,
            ...data,
            created_at: new Date(item.created_at).toLocaleDateString('fr-FR')
          };
        } catch (error) {
          return {
            id: item.id,
            name: '[Erreur de déchiffrement]',
            username: '',
            url: '',
            error: true
          };
        }
      })
    );

    spinner.succeed(chalk.green(`${decryptedItems.length} entrée(s) trouvée(s)`));

    // Affichage
    if (options.short) {
      // Affichage court : noms uniquement
      console.log();
      decryptedItems.forEach((item, index) => {
        const number = chalk.gray(`${(index + 1).toString().padStart(2, ' ')}. `);
        const name = item.error ? chalk.red(item.name) : chalk.white(item.name);
        console.log(number + name);
      });
    } else {
      // Affichage détaillé : tableau
      const data = [
        [
          chalk.bold('Nom'),
          chalk.bold('Identifiant'),
          chalk.bold('URL'),
          chalk.bold('Créé le')
        ],
        ...decryptedItems.map(item => [
          item.error ? chalk.red(item.name) : chalk.white(item.name),
          chalk.gray(item.username || '-'),
          chalk.blue(item.url || '-'),
          chalk.gray(item.created_at || '-')
        ])
      ];

      console.log('\n' + table(data, {
        border: {
          topBody: '─',
          topJoin: '┬',
          topLeft: '┌',
          topRight: '┐',
          bottomBody: '─',
          bottomJoin: '┴',
          bottomLeft: '└',
          bottomRight: '┘',
          bodyLeft: '│',
          bodyRight: '│',
          bodyJoin: '│',
          joinBody: '─',
          joinLeft: '├',
          joinRight: '┤',
          joinJoin: '┼'
        }
      }));
    }

    console.log(chalk.gray(`\nUtilisez`), chalk.cyan('v-get <nom>'), chalk.gray('pour voir les détails'));
  } catch (error) {
    spinner.fail(chalk.red('Erreur'));
    console.error(chalk.red(`\n${error.message}`));
    process.exit(1);
  }
}
