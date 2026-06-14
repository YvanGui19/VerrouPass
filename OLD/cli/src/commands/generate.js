/**
 * Commande generate - Générer un mot de passe sécurisé
 */

import chalk from 'chalk';
import clipboard from 'clipboardy';
import { webcrypto } from 'crypto';

const crypto = webcrypto;

// Fonction pour calculer l'entropie
function calculateEntropy(password, charset) {
  const length = password.length;
  const charsetSize = charset.length;
  return Math.log2(Math.pow(charsetSize, length));
}

// Fonction pour évaluer la force du mot de passe
function getStrength(entropy) {
  if (entropy < 28) return { label: 'Très faible', color: 'red' };
  if (entropy < 36) return { label: 'Faible', color: 'yellow' };
  if (entropy < 60) return { label: 'Moyen', color: 'blue' };
  if (entropy < 128) return { label: 'Fort', color: 'green' };
  return { label: 'Très fort', color: 'green' };
}

// Fonction pour générer un mot de passe (peut être appelée depuis d'autres commandes)
export async function generatePassword(options) {
  const length = parseInt(options.length) || 16;

  // Vérifier la longueur
  if (length < 8 || length > 128) {
    throw new Error('La longueur doit être entre 8 et 128 caractères');
  }

  // Construire le jeu de caractères
  let charset = '';
  const charsets = {
    upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lower: 'abcdefghijklmnopqrstuvwxyz',
    numbers: '0123456789',
    symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?'
  };

  if (options.upper !== false) charset += charsets.upper;
  if (options.lower !== false) charset += charsets.lower;
  if (options.numbers !== false) charset += charsets.numbers;
  if (options.symbols !== false) charset += charsets.symbols;

  if (charset.length === 0) {
    throw new Error('Au moins un type de caractère doit être sélectionné');
  }

  // Générer le mot de passe avec crypto sécurisé
  const randomValues = crypto.getRandomValues(new Uint8Array(length));
  let password = '';

  for (let i = 0; i < length; i++) {
    password += charset[randomValues[i] % charset.length];
  }

  // S'assurer qu'au moins un caractère de chaque type est présent
  const types = [];
  if (options.upper !== false) types.push(charsets.upper);
  if (options.lower !== false) types.push(charsets.lower);
  if (options.numbers !== false) types.push(charsets.numbers);
  if (options.symbols !== false) types.push(charsets.symbols);

  // Vérifier que chaque type est représenté
  for (const typeCharset of types) {
    let hasType = false;
    for (const char of password) {
      if (typeCharset.includes(char)) {
        hasType = true;
        break;
      }
    }

    // Si un type manque, remplacer un caractère aléatoire
    if (!hasType) {
      const pos = randomValues[0] % password.length;
      const randomChar = typeCharset[randomValues[1] % typeCharset.length];
      password = password.substring(0, pos) + randomChar + password.substring(pos + 1);
    }
  }

  return password;
}

export async function generateCommand(options) {
  try {
    const password = await generatePassword(options);

    // Calculer l'entropie
    let charset = '';
    if (options.upper !== false) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (options.lower !== false) charset += 'abcdefghijklmnopqrstuvwxyz';
    if (options.numbers !== false) charset += '0123456789';
    if (options.symbols !== false) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';

    const entropy = calculateEntropy(password, charset);
    const strength = getStrength(entropy);

    // Afficher le mot de passe
    if (!options.silent) {
      console.log('\n' + chalk.blue.bold('Mot de passe généré\n'));
      console.log(chalk.white.bold(password));
      console.log();
      console.log(chalk.gray(`Longueur: ${password.length} caractères`));
      console.log(chalk.gray(`Entropie: ${entropy.toFixed(1)} bits`));
      console.log(chalk.gray(`Force: ${chalk[strength.color](strength.label)}`));
      console.log();

      // Copier dans le presse-papiers si demandé
      if (options.copy) {
        try {
          await clipboard.write(password);
          console.log(chalk.green('Copié dans le presse-papiers'));
        } catch (error) {
          console.log(chalk.red('Impossible de copier dans le presse-papiers'));
        }
      }
    }

    return password;
  } catch (error) {
    console.error(chalk.red(error.message));
    process.exit(1);
  }
}
