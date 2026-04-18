/**
 * Palette de couleurs pour VerrouPass CLI
 * Inspirée du terminal du portfolio
 */

import chalk from 'chalk';

/**
 * Couleurs du CLI (style portfolio)
 */
const colors = {
  primary: chalk.greenBright,     // Lime/vert (couleur principale)
  success: chalk.greenBright,      // Succès
  error: chalk.red,                // Erreurs
  warning: chalk.yellow,           // Avertissements
  info: chalk.cyan,                // Informations (accent cyan)
  muted: chalk.gray,               // Texte secondaire
  highlight: chalk.white,          // Mise en valeur
  bold: chalk.bold                 // Gras
};

/**
 * Raccourcis pour les couleurs
 */
export const c = {
  primary: colors.primary,
  success: colors.success,
  error: colors.error,
  warning: colors.warning,
  info: colors.info,
  muted: colors.muted,
  highlight: colors.highlight,
  bold: colors.bold
};

// Export par défaut
export default c;
