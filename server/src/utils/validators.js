/**
 * Fonctions de validation pour la sécurité
 * Implémente les recommandations OWASP
 */

/**
 * Validation d'email conforme RFC 5322
 * Cette regex couvre la grande majorité des cas d'usage valides
 * tout en restant pratique pour un usage applicatif
 *
 * @param {string} email - Email à valider
 * @returns {boolean} true si l'email est valide
 */
export function isValidEmail(email) {
  if (!email || typeof email !== 'string') {
    return false;
  }

  // Longueur maximale selon RFC 5321
  if (email.length > 254) {
    return false;
  }

  // Regex RFC 5322 simplifiée mais robuste
  // Couvre: local-part@domain
  // Local part: lettres, chiffres, et caractères spéciaux autorisés
  // Domain: sous-domaines avec tirets autorisés, TLD de 2+ caractères
  const emailRegex = /^(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])$/i;

  if (!emailRegex.test(email)) {
    return false;
  }

  // Vérifications supplémentaires
  const [localPart, domain] = email.split('@');

  // Local part max 64 caractères selon RFC 5321
  if (localPart.length > 64) {
    return false;
  }

  // Le domaine ne doit pas commencer ou finir par un tiret
  const domainParts = domain.split('.');
  for (const part of domainParts) {
    if (part.startsWith('-') || part.endsWith('-')) {
      return false;
    }
  }

  // TLD doit avoir au moins 2 caractères
  const tld = domainParts[domainParts.length - 1];
  if (tld.length < 2) {
    return false;
  }

  return true;
}

/**
 * Validation de la force du mot de passe
 * Exige minimum 12 caractères selon les recommandations OWASP 2024
 *
 * @param {string} password - Mot de passe à valider
 * @returns {object} { valid: boolean, errors: string[] }
 */
export function validatePasswordStrength(password) {
  const errors = [];

  if (!password || typeof password !== 'string') {
    return { valid: false, errors: ['Mot de passe requis'] };
  }

  // Minimum 12 caractères (OWASP recommendation)
  if (password.length < 12) {
    errors.push('Le mot de passe doit contenir au moins 12 caractères');
  }

  // Maximum pour éviter les attaques DoS via bcrypt
  if (password.length > 128) {
    errors.push('Le mot de passe ne doit pas dépasser 128 caractères');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validation du hash de mot de passe reçu du client
 * Le client envoie un hash SHA-256 (64 caractères hex)
 *
 * @param {string} passwordHash - Hash à valider
 * @returns {boolean} true si le format est valide
 */
export function isValidPasswordHash(passwordHash) {
  if (!passwordHash || typeof passwordHash !== 'string') {
    return false;
  }

  // SHA-256 produit 64 caractères hexadécimaux
  const sha256Regex = /^[a-f0-9]{64}$/i;
  return sha256Regex.test(passwordHash);
}

/**
 * Nettoie une chaîne pour éviter les injections
 *
 * @param {string} input - Chaîne à nettoyer
 * @param {number} maxLength - Longueur maximale
 * @returns {string} Chaîne nettoyée
 */
export function sanitizeString(input, maxLength = 255) {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Supprimer les caractères de contrôle
  let sanitized = input.replace(/[\x00-\x1F\x7F]/g, '');

  // Tronquer à la longueur maximale
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized.trim();
}

export default {
  isValidEmail,
  validatePasswordStrength,
  isValidPasswordHash,
  sanitizeString
};
