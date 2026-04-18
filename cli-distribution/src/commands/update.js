/**
 * Commande de vérification des mises à jour
 */

import { c } from '../utils/themes.js';
import { checkForUpdates, displayUpdateNotification, CLI_VERSION } from '../utils/updateChecker.js';
import ora from 'ora';

export async function updateCommand() {
  console.log('');
  console.log(c.primary('Vérification des mises à jour...'));
  console.log('');

  const spinner = ora('Connexion au serveur...').start();

  try {
    const updateInfo = await checkForUpdates();

    spinner.stop();

    if (updateInfo) {
      // Mise à jour disponible
      displayUpdateNotification(updateInfo);

      console.log(c.muted('Pour installer la mise à jour :'));
      console.log('');
      console.log(c.primary('  Windows :'));
      console.log(`    1. Téléchargez le nouveau CLI`);
      console.log(`    2. Extrayez le fichier ZIP`);
      console.log(`    3. Exécutez ${c.success('install.bat')}`);
      console.log('');
      console.log(c.primary('  Linux/macOS :'));
      console.log(`    1. Téléchargez le nouveau CLI`);
      console.log(`    2. Extrayez le fichier ZIP`);
      console.log(`    3. Exécutez ${c.success('./install.sh')}`);
      console.log('');
    } else {
      // Déjà à jour
      console.log(c.success('✓ Vous utilisez la dernière version'));
      console.log('');
      console.log(`  Version actuelle : ${c.highlight(CLI_VERSION)}`);
      console.log('');
    }
  } catch (error) {
    spinner.stop();
    console.log(c.error('✗ Erreur lors de la vérification des mises à jour'));
    console.log('');
    console.log(c.muted('Vérifiez votre connexion internet ou réessayez plus tard.'));
    console.log('');
  }
}
