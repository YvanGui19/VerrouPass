import express from 'express';
  import { User } from '../models/User.js';
  import {
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken,
    revokeRefreshToken,
    revokeAllUserRefreshTokens,
    authenticateToken,
    getCookieOptions
  } from '../middleware/auth.js';
  import { loginLimiter, registerLimiter } from '../middleware/rateLimiter.js';
  import pool from '../db.js';
  import bcrypt from 'bcrypt';
  import { securityLogger } from '../utils/logger.js';
  import { isValidEmail } from '../utils/validators.js';

  const router = express.Router();

  // Constantes pour les durées des cookies
  const ACCESS_TOKEN_MAX_AGE = 15 * 60 * 1000; // 15 minutes
  const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 jours

  // POST /api/auth/register - avec rate limiting strict
  router.post('/register', registerLimiter, async (req, res) => {
    try {
      const { email, passwordHash } = req.body;

      // Validation
      if (!email || !passwordHash) {
        securityLogger.registerAttempt(req, email, false, 'missing_credentials');
        return res.status(400).json({ error: 'Email et mot de passe requis' });
      }

      // Validation email RFC 5322
      if (!isValidEmail(email)) {
        securityLogger.registerAttempt(req, email, false, 'invalid_email_format');
        return res.status(400).json({ error: 'Format d\'email invalide' });
      }

      // Validation du hash de mot de passe (doit avoir min 12 caractères cote client)
      if (!passwordHash || passwordHash.length < 64) {
        securityLogger.registerAttempt(req, email, false, 'invalid_password_hash');
        return res.status(400).json({ error: 'Format de mot de passe invalide' });
      }

      // Vérifier si l'utilisateur existe déjà
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        securityLogger.registerAttempt(req, email, false, 'email_already_exists');
        return res.status(409).json({ error: 'Un compte avec cet email existe déjà' });
      }

      // Créer l'utilisateur
      const user = await User.create(email, passwordHash);

      // Générer les tokens
      const accessToken = generateAccessToken(user.id, user.email);
      const { token: refreshToken, expiresAt } = await generateRefreshToken(user.id);

      // Définir les cookies HttpOnly
      const cookieOptions = getCookieOptions();
      res.cookie('accessToken', accessToken, {
        ...cookieOptions,
        maxAge: ACCESS_TOKEN_MAX_AGE
      });
      res.cookie('refreshToken', refreshToken, {
        ...cookieOptions,
        maxAge: REFRESH_TOKEN_MAX_AGE,
        path: '/api/auth' // Refresh token uniquement pour les routes auth
      });

      securityLogger.registerAttempt(req, email, true);

      res.status(201).json({
        message: 'Compte créé avec succès',
        user: {
          id: user.id,
          email: user.email,
          createdAt: user.created_at
        },
        // Token aussi dans le body pour le CLI
        token: accessToken
      });
    } catch (err) {
      securityLogger.registerAttempt(req, req.body?.email, false, 'server_error');
      res.status(500).json({ error: 'Erreur lors de la création du compte' });
    }
  });

  // POST /api/auth/login - avec rate limiting anti-brute-force
  router.post('/login', loginLimiter, async (req, res) => {
    try {
      const { email, passwordHash } = req.body;

      // Validation
      if (!email || !passwordHash) {
        securityLogger.loginAttempt(req, email, false, 'missing_credentials');
        return res.status(400).json({ error: 'Email et mot de passe requis' });
      }

      // Trouver l'utilisateur
      const user = await User.findByEmail(email);
      if (!user) {
        securityLogger.loginAttempt(req, email, false, 'user_not_found');
        return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
      }

      // Vérifier le mot de passe
      const isValid = await User.verifyPassword(user, passwordHash);
      if (!isValid) {
        securityLogger.loginAttempt(req, email, false, 'invalid_password');
        return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
      }

      // Générer les tokens
      const accessToken = generateAccessToken(user.id, user.email);
      const { token: refreshToken, expiresAt } = await generateRefreshToken(user.id);

      // Définir les cookies HttpOnly
      const cookieOptions = getCookieOptions();
      res.cookie('accessToken', accessToken, {
        ...cookieOptions,
        maxAge: ACCESS_TOKEN_MAX_AGE
      });
      res.cookie('refreshToken', refreshToken, {
        ...cookieOptions,
        maxAge: REFRESH_TOKEN_MAX_AGE,
        path: '/api/auth'
      });

      securityLogger.loginAttempt(req, email, true);

      res.json({
        message: 'Connexion réussie',
        user: {
          id: user.id,
          email: user.email,
          createdAt: user.created_at
        },
        // Token aussi dans le body pour le CLI
        token: accessToken
      });
    } catch (err) {
      securityLogger.loginAttempt(req, req.body?.email, false, 'server_error');
      res.status(500).json({ error: 'Erreur lors de la connexion' });
    }
  });

  // POST /api/auth/verify - Vérifier si le token est valide
  router.post('/verify', async (req, res) => {
    // Chercher le token dans le cookie ou le header
    let token = req.cookies?.accessToken;
    if (!token) {
      const authHeader = req.headers['authorization'];
      token = authHeader && authHeader.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ valid: false });
    }

    try {
      const jwt = await import('jsonwebtoken');
      const decoded = jwt.default.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);

      if (!user) {
        return res.status(401).json({ valid: false });
      }

      res.json({
        valid: true,
        user: {
          id: user.id,
          email: user.email,
          createdAt: user.created_at
        }
      });
    } catch (err) {
      res.status(401).json({ valid: false });
    }
  });

  // POST /api/auth/refresh - Rafraîchir le token d'accès
  router.post('/refresh', async (req, res) => {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token requis' });
    }

    try {
      const tokenData = await verifyRefreshToken(refreshToken);

      if (!tokenData) {
        return res.status(401).json({ error: 'Refresh token invalide ou expiré' });
      }

      // Générer un nouveau access token
      const accessToken = generateAccessToken(tokenData.user_id, tokenData.email);

      // Définir le nouveau cookie
      const cookieOptions = getCookieOptions();
      res.cookie('accessToken', accessToken, {
        ...cookieOptions,
        maxAge: ACCESS_TOKEN_MAX_AGE
      });

      res.json({
        message: 'Token rafraîchi',
        // Token aussi dans le body pour le CLI
        token: accessToken
      });
    } catch (err) {
      res.status(500).json({ error: 'Erreur lors du rafraîchissement du token' });
    }
  });

  // POST /api/auth/logout - Déconnexion (révoque les tokens)
  router.post('/logout', async (req, res) => {
    const refreshToken = req.cookies?.refreshToken;

    try {
      // Révoquer le refresh token si présent
      if (refreshToken) {
        await revokeRefreshToken(refreshToken);
      }

      // Supprimer les cookies
      const cookieOptions = getCookieOptions();
      res.clearCookie('accessToken', cookieOptions);
      res.clearCookie('refreshToken', { ...cookieOptions, path: '/api/auth' });

      res.json({ message: 'Déconnexion réussie' });
    } catch (err) {
      res.status(500).json({ error: 'Erreur lors de la déconnexion' });
    }
  });

  // PUT /api/auth/change-password - Changer le mot de passe maître
  router.put('/change-password', authenticateToken, async (req, res) => {
    try {
      const { oldPasswordHash, newPasswordHash, reencryptedItems } = req.body;
      const userId = req.user.userId;

      // Validation
      if (!oldPasswordHash || !newPasswordHash) {
        securityLogger.passwordChange(req, req.user.email, false, 'missing_passwords');
        return res.status(400).json({ error: 'Ancien et nouveau mot de passe requis' });
      }

      if (!Array.isArray(reencryptedItems)) {
        securityLogger.passwordChange(req, req.user.email, false, 'invalid_reencrypted_items');
        return res.status(400).json({ error: 'reencryptedItems doit être un tableau' });
      }

      // Récupérer l'utilisateur pour vérification
      const user = await User.findByEmail(req.user.email);
      if (!user) {
        securityLogger.passwordChange(req, req.user.email, false, 'user_not_found');
        return res.status(404).json({ error: 'Utilisateur non trouvé' });
      }

      // Vérifier l'ancien mot de passe
      const isValid = await User.verifyPassword(user, oldPasswordHash);
      if (!isValid) {
        securityLogger.passwordChange(req, req.user.email, false, 'invalid_old_password');
        return res.status(401).json({ error: 'Ancien mot de passe incorrect' });
      }

      // Démarrer une transaction
      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        // Hash le nouveau mot de passe avec bcrypt (comme à l'inscription)
        const hashedNewPassword = await bcrypt.hash(newPasswordHash, 12);

        // Mettre à jour le mot de passe de l'utilisateur
        await client.query(
          'UPDATE users SET password_hash = $1 WHERE id = $2',
          [hashedNewPassword, userId]
        );

        // Mettre à jour toutes les entrées re-chiffrées
        for (const item of reencryptedItems) {
          await client.query(
            'UPDATE vault_items SET encrypted_data = $1, iv = $2 WHERE id = $3 AND user_id = $4',
            [item.encryptedData, item.iv, item.id, userId]
          );
        }

        // Révoquer tous les refresh tokens existants (force re-login partout)
        await revokeAllUserRefreshTokens(userId);

        await client.query('COMMIT');

        // Générer de nouveaux tokens
        const accessToken = generateAccessToken(userId, req.user.email);
        const { token: refreshToken } = await generateRefreshToken(userId);

        // Définir les nouveaux cookies
        const cookieOptions = getCookieOptions();
        res.cookie('accessToken', accessToken, {
          ...cookieOptions,
          maxAge: ACCESS_TOKEN_MAX_AGE
        });
        res.cookie('refreshToken', refreshToken, {
          ...cookieOptions,
          maxAge: REFRESH_TOKEN_MAX_AGE,
          path: '/api/auth'
        });

        securityLogger.passwordChange(req, req.user.email, true);

        res.json({
          message: 'Mot de passe maître changé avec succès',
          token: accessToken
        });
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    } catch (err) {
      securityLogger.passwordChange(req, req.user?.email, false, 'server_error');
      res.status(500).json({ error: 'Erreur lors du changement de mot de passe' });
    }
  });

  // DELETE /api/auth/account - Supprimer définitivement le compte
  router.delete('/account', authenticateToken, async (req, res) => {
    try {
      const { passwordHash } = req.body;
      const userId = req.user.userId;

      // Validation
      if (!passwordHash) {
        securityLogger.accountDeletion(req, req.user.email, false, 'missing_password');
        return res.status(400).json({ error: 'Mot de passe requis pour supprimer le compte' });
      }

      // Récupérer l'utilisateur avec password_hash pour vérification
      const user = await User.findByEmail(req.user.email);
      if (!user) {
        securityLogger.accountDeletion(req, req.user.email, false, 'user_not_found');
        return res.status(404).json({ error: 'Utilisateur non trouvé' });
      }

      // Vérifier le mot de passe
      const isValid = await User.verifyPassword(user, passwordHash);
      if (!isValid) {
        securityLogger.accountDeletion(req, req.user.email, false, 'invalid_password');
        return res.status(401).json({ error: 'Mot de passe incorrect' });
      }

      // Supprimer toutes les vault_items de l'utilisateur
      await pool.query('DELETE FROM vault_items WHERE user_id = $1', [userId]);

      // Supprimer l'utilisateur (les refresh_tokens sont supprimés par CASCADE)
      await pool.query('DELETE FROM users WHERE id = $1', [userId]);

      // Supprimer les cookies
      const cookieOptions = getCookieOptions();
      res.clearCookie('accessToken', cookieOptions);
      res.clearCookie('refreshToken', { ...cookieOptions, path: '/api/auth' });

      securityLogger.accountDeletion(req, req.user.email, true);

      res.json({ message: 'Compte supprimé avec succès' });
    } catch (err) {
      securityLogger.accountDeletion(req, req.user?.email, false, 'server_error');
      res.status(500).json({ error: 'Erreur lors de la suppression du compte' });
    }
  });

  export default router;
