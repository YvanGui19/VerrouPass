/**
 * Commande search - Rechercher dans les entrées
 */

import chalk from 'chalk';
import ora from 'ora';
import { table } from 'table';
import { getVaultItems } from '../utils/api.js';
import { decrypt, importKey } from '../utils/crypto.js';
import { isAuthenticated, getEncryptionKey } from '../utils/config.js';

export async function searchCommand(query) {
  // Vérifier l'authentification
  if (!isAuthenticated()) {
    console.log(chalk.red('✗ Vous devez être connecté. Utilisez: vpass login'));
    process.exit(1);
  }

  const spinner = ora(`Recherche de "${query}"...`).start();

  try {
    // Récupérer toutes les entrées
    const items = await getVaultItems();

    // Importer la clé de chiffrement
    const encKey = await importKey(getEncryptionKey());

    // Déchiffrer et filtrer
    const results = [];
    const searchLower = query.toLowerCase();

    for (const item of items) {
      try {
        const data = await decrypt(item.encrypted_data, item.iv, encKey);

        // Rechercher dans tous les champs
        const matchName = data.name?.toLowerCase().includes(searchLower);
        const matchUsername = data.username?.toLowerCase().includes(searchLower);
        const matchUrl = data.url?.toLowerCase().includes(searchLower);
        const matchNotes = data.notes?.toLowerCase().includes(searchLower);

        if (matchName || matchUsername || matchUrl || matchNotes) {
          results.push({
            id: item.id,
            ...data,
            created_at: new Date(item.created_at).toLocaleDateString('fr-FR')
          });
        }
      } catch (error) {
        // Ignorer les erreurs de déchiffrement
      }
    }

    if (results.length === 0) {
      spinner.info(chalk.yellow(`Aucun résultat pour "${query}"`));
      return;
    }

    spinner.succeed(chalk.green(`✓ ${results.length} résultat(s) trouvé(s)`));

    // Afficher les résultats
    const data = [
      [
        chalk.bold('Nom'),
        chalk.bold('Identifiant'),
        chalk.bold('URL'),
        chalk.bold('Créé le')
      ],
      ...results.map(item => [
        chalk.white(item.name),
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

    console.log(chalk.gray(`Utilisez`), chalk.cyan('vpass get <nom>'), chalk.gray('pour voir les détails'));
  } catch (error) {
    spinner.fail(chalk.red('✗ Erreur'));
    console.error(chalk.red(`\n${error.message}`));
    process.exit(1);
  }
}
