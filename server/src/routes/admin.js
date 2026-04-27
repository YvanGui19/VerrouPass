/**
 * Routes administratives, protegees par un token statique en .env.
 * Pas de session ni JWT : un simple secret partage suffit pour l usage CLI/curl.
 *
 * Variable requise : ADMIN_INVITATION_TOKEN (32+ caracteres aleatoires).
 * Generer avec : node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 */

import express from 'express';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';

import { generateInvitationCode } from '../services/invitations.js';
import { securityLogger } from '../utils/logger.js';

const router = express.Router();

// Rate limit strict pour proteger contre le brute-force du token admin
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,                  // 30 requetes / 15 min / IP
  message: { error: 'Trop de requetes admin.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Comparaison en temps constant pour eviter le timing attack sur le token
function safeCompare(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const ba = Buffer.from(a, 'utf8');
  const bb = Buffer.from(b, 'utf8');
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

function requireAdminToken(req, res, next) {
  const expected = process.env.ADMIN_INVITATION_TOKEN;
  if (!expected || expected.length < 32) {
    return res.status(500).json({ error: 'ADMIN_INVITATION_TOKEN non configure' });
  }
  const provided = req.headers['x-admin-token'];
  if (!safeCompare(provided || '', expected)) {
    securityLogger.suspiciousActivity(req, 'Tentative admin avec token invalide', {
      route: req.path,
    });
    return res.status(401).json({ error: 'Token admin invalide' });
  }
  next();
}

// POST /api/admin/invitation - genere un code d invitation valable 15 min
router.post('/invitation', adminLimiter, requireAdminToken, (req, res) => {
  const { code, expiresAt } = generateInvitationCode();
  res.json({
    code,
    expiresAt,
    ttlMinutes: 15,
  });
});

export default router;
