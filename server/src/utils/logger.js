/**
 * Configuration du logger Winston pour la sécurité
 * Implémente les recommandations OWASP pour le logging sécurisé
 */

import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Répertoire des logs
const logsDir = path.join(__dirname, '../../logs');

// Niveaux de log personnalisés incluant 'security'
const customLevels = {
  levels: {
    error: 0,
    warn: 1,
    security: 2,
    info: 3,
    debug: 4
  },
  colors: {
    error: 'red',
    warn: 'yellow',
    security: 'magenta',
    info: 'green',
    debug: 'blue'
  }
};

// Format JSON structuré avec timestamp
const jsonFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Format console pour le développement
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
    return `${timestamp} [${level}]: ${message} ${metaStr}`;
  })
);

// Transport pour les erreurs
const errorTransport = new DailyRotateFile({
  filename: path.join(logsDir, 'error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  level: 'error',
  format: jsonFormat,
  maxSize: '20m',
  maxFiles: '30d',
  zippedArchive: true
});

// Transport pour tous les logs combinés
const combinedTransport = new DailyRotateFile({
  filename: path.join(logsDir, 'combined-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  format: jsonFormat,
  maxSize: '20m',
  maxFiles: '14d',
  zippedArchive: true
});

// Transport spécifique pour les événements de sécurité
const securityTransport = new DailyRotateFile({
  filename: path.join(logsDir, 'security-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  level: 'security',
  format: jsonFormat,
  maxSize: '50m',
  maxFiles: '90d', // Conservation plus longue pour les audits de sécurité
  zippedArchive: true
});

// Créer le logger
const logger = winston.createLogger({
  levels: customLevels.levels,
  level: process.env.LOG_LEVEL || 'info',
  defaultMeta: { service: 'verroupass-server' },
  transports: [
    errorTransport,
    combinedTransport,
    securityTransport
  ]
});

// Ajouter les couleurs personnalisées
winston.addColors(customLevels.colors);

// En développement, ajouter la console
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat,
    level: 'debug'
  }));
}

/**
 * Masque les données sensibles pour le logging
 * @param {string} email - Email à masquer partiellement
 * @returns {string} Email masqué
 */
function maskEmail(email) {
  if (!email || typeof email !== 'string') return '[invalid]';
  const parts = email.split('@');
  if (parts.length !== 2) return '[invalid]';
  const local = parts[0];
  const domain = parts[1];
  const maskedLocal = local.length > 2
    ? local[0] + '*'.repeat(Math.min(local.length - 2, 5)) + local[local.length - 1]
    : '**';
  return `${maskedLocal}@${domain}`;
}

/**
 * Extrait l'adresse IP de la requête
 * @param {object} req - Requête Express
 * @returns {string} Adresse IP
 */
function getClientIP(req) {
  return req.ip ||
         req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
         req.connection?.remoteAddress ||
         'unknown';
}

/**
 * Logger pour les événements de sécurité
 */
const securityLogger = {
  /**
   * Log une tentative de connexion
   */
  loginAttempt: (req, email, success, reason = null) => {
    logger.log('security', 'LOGIN_ATTEMPT', {
      event: 'LOGIN_ATTEMPT',
      email: maskEmail(email),
      success,
      reason,
      ip: getClientIP(req),
      userAgent: req.headers['user-agent'] || 'unknown',
      timestamp: new Date().toISOString()
    });
  },

  /**
   * Log une tentative d'inscription
   */
  registerAttempt: (req, email, success, reason = null) => {
    logger.log('security', 'REGISTER_ATTEMPT', {
      event: 'REGISTER_ATTEMPT',
      email: maskEmail(email),
      success,
      reason,
      ip: getClientIP(req),
      userAgent: req.headers['user-agent'] || 'unknown',
      timestamp: new Date().toISOString()
    });
  },

  /**
   * Log une déconnexion
   */
  logout: (req, email) => {
    logger.log('security', 'LOGOUT', {
      event: 'LOGOUT',
      email: maskEmail(email),
      ip: getClientIP(req),
      timestamp: new Date().toISOString()
    });
  },

  /**
   * Log un changement de mot de passe
   */
  passwordChange: (req, email, success, reason = null) => {
    logger.log('security', 'PASSWORD_CHANGE', {
      event: 'PASSWORD_CHANGE',
      email: maskEmail(email),
      success,
      reason,
      ip: getClientIP(req),
      timestamp: new Date().toISOString()
    });
  },

  /**
   * Log une suppression de compte
   */
  accountDeletion: (req, email, success, reason = null) => {
    logger.log('security', 'ACCOUNT_DELETION', {
      event: 'ACCOUNT_DELETION',
      email: maskEmail(email),
      success,
      reason,
      ip: getClientIP(req),
      timestamp: new Date().toISOString()
    });
  },

  /**
   * Log un évènement TOTP (setup, enable, disable, login_totp_*, recovery_used)
   */
  totp: (req, email, action, success, reason = null) => {
    logger.log('security', 'TOTP', {
      event: 'TOTP',
      action,
      email: maskEmail(email),
      success,
      reason,
      ip: getClientIP(req),
      userAgent: req.headers['user-agent'] || 'unknown',
      timestamp: new Date().toISOString()
    });
  },

  /**
   * Log un accès suspect ou une anomalie
   */
  suspiciousActivity: (req, description, details = {}) => {
    logger.log('security', 'SUSPICIOUS_ACTIVITY', {
      event: 'SUSPICIOUS_ACTIVITY',
      description,
      ip: getClientIP(req),
      userAgent: req.headers['user-agent'] || 'unknown',
      ...details,
      timestamp: new Date().toISOString()
    });
  }
};

export { logger, securityLogger };
export default logger;
