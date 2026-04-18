import rateLimit from 'express-rate-limit';

  // Rate limiter global - protection générale
  export const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Max 100 requêtes par IP
    message: { error: 'Trop de requêtes, veuillez réessayer plus tard.' },
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Rate limiter strict pour login - protection brute-force
  export const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Max 5 tentatives de connexion
    message: {
      error: 'Trop de tentatives de connexion. Veuillez réessayer dans 15 minutes.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Ne compte que les échecs
  });

  // Rate limiter pour register - éviter spam d'inscriptions
  export const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 heure
    max: 3, // Max 3 inscriptions par heure
    message: {
      error: 'Trop de tentatives d\'inscription. Veuillez réessayer dans 1 heure.'
    },
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Rate limiter pour API vault - protection contre extraction massive
  export const vaultLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // Max 50 requêtes
    message: {
      error: 'Trop de requêtes vers le coffre. Veuillez ralentir.'
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
