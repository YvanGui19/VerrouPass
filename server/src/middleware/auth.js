import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import pool from '../db.js';

// Durée de vie des tokens
const ACCESS_TOKEN_EXPIRES = '15m';  // Token d'accès court (15 minutes)
const REFRESH_TOKEN_EXPIRES_DAYS = 7; // Refresh token 7 jours

export function authenticateToken(req, res, next) {
  // Chercher le token dans le cookie HttpOnly OU dans le header Authorization (CLI)
  let token = req.cookies?.accessToken;

  // Fallback pour le CLI qui utilise Authorization header
  if (!token) {
    const authHeader = req.headers['authorization'];
    token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  }

  if (!token) {
    return res.status(401).json({ error: 'Token d\'authentification requis' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Un challenge TOTP intermédiaire (totpPending=true) ne doit JAMAIS être
    // accepté comme access token sur les routes protégées : il sert
    // exclusivement pour la 2e étape du login (POST /api/auth/login/totp).
    if (decoded.totpPending === true) {
      return res.status(403).json({ error: 'Token invalide (challenge 2FA non utilisable ici)' });
    }
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expiré', code: 'TOKEN_EXPIRED' });
    }
    return res.status(403).json({ error: 'Token invalide' });
  }
}

// Génère le challenge JWT court (5min) émis par /login quand 2FA est activée.
// L'utilisateur doit le présenter à /login/totp avec un code valide pour
// échanger ce challenge contre des cookies de session.
export function generateTotpChallenge(userId, email) {
  return jwt.sign(
    { userId, email, totpPending: true },
    process.env.JWT_SECRET,
    { expiresIn: '5m' }
  );
}

export function verifyTotpChallenge(token) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.totpPending !== true) {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}

export function generateAccessToken(userId, email) {
  return jwt.sign(
    { userId, email },
    process.env.JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRES }
  );
}

// Génère un refresh token sécurisé et le stocke en base
export async function generateRefreshToken(userId) {
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRES_DAYS);

  // Stocker le hash du token en base (pas le token brut)
  await pool.query(
    'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
    [userId, tokenHash, expiresAt]
  );

  return { token, expiresAt };
}

// Vérifie un refresh token
export async function verifyRefreshToken(token) {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const result = await pool.query(
    `SELECT rt.*, u.email
     FROM refresh_tokens rt
     JOIN users u ON rt.user_id = u.id
     WHERE rt.token_hash = $1 AND rt.revoked = FALSE AND rt.expires_at > NOW()`,
    [tokenHash]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0];
}

// Révoque un refresh token
export async function revokeRefreshToken(token) {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  await pool.query(
    'UPDATE refresh_tokens SET revoked = TRUE WHERE token_hash = $1',
    [tokenHash]
  );
}

// Révoque tous les refresh tokens d'un utilisateur
export async function revokeAllUserRefreshTokens(userId) {
  await pool.query(
    'UPDATE refresh_tokens SET revoked = TRUE WHERE user_id = $1',
    [userId]
  );
}

// Nettoie les tokens expirés (à appeler périodiquement)
export async function cleanupExpiredTokens() {
  await pool.query('DELETE FROM refresh_tokens WHERE expires_at < NOW() OR revoked = TRUE');
}

// Options pour les cookies sécurisés
export function getCookieOptions(isProduction = process.env.NODE_ENV === 'production') {
  return {
    httpOnly: true,
    secure: isProduction, // HTTPS only en production
    sameSite: 'strict',
    path: '/'
  };
}

export default {
  authenticateToken,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  revokeRefreshToken,
  revokeAllUserRefreshTokens,
  cleanupExpiredTokens,
  getCookieOptions
};
