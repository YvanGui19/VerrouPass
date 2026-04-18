import express from 'express';
  import { User } from '../models/User.js';
  import { generateToken, authenticateToken } from '../middleware/auth.js';
  import { loginLimiter, registerLimiter } from '../middleware/rateLimiter.js';
  import pool from '../db.js';
  import bcrypt from 'bcrypt';

  const router = express.Router();

  // POST /api/auth/register - avec rate limiting strict
  router.post('/register', registerLimiter, async (req, res) => {
    try {
      const { email, passwordHash } = req.body;

      // Validation
      if (!email || !passwordHash) {
        return res.status(400).json({ error: 'Email et mot de passe requis' });
      }

      if (!email.includes('@')) {
        return res.status(400).json({ error: 'Email invalide' });
      }

      // Vérifier si l'utilisateur existe déjà
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(409).json({ error: 'Un compte avec cet email existe déjà' });
      }

      // Créer l'utilisateur
      const user = await User.create(email, passwordHash);

      // Générer le token
      const token = generateToken(user.id, user.email);

      res.status(201).json({
        message: 'Compte créé avec succès',
        user: {
          id: user.id,
          email: user.email,
          createdAt: user.created_at
        },
        token
      });
    } catch (err) {
      console.error('Erreur inscription:', err);
      res.status(500).json({ error: 'Erreur lors de la création du compte' });
    }
  });

  // POST /api/auth/login - avec rate limiting anti-brute-force
  router.post('/login', loginLimiter, async (req, res) => {
    try {
      const { email, passwordHash } = req.body;

      // Validation
      if (!email || !passwordHash) {
        return res.status(400).json({ error: 'Email et mot de passe requis' });
      }

      // Trouver l'utilisateur
      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
      }

      // Vérifier le mot de passe
      const isValid = await User.verifyPassword(user, passwordHash);
      if (!isValid) {
        return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
      }

      // Générer le token
      const token = generateToken(user.id, user.email);

      res.json({
        message: 'Connexion réussie',
        user: {
          id: user.id,
          email: user.email,
          createdAt: user.created_at
        },
        token
      });
    } catch (err) {
      console.error('Erreur connexion:', err);
      res.status(500).json({ error: 'Erreur lors de la connexion' });
    }
  });

  // POST /api/auth/verify - Vérifier si le token est valide
  router.post('/verify', async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

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

  // PUT /api/auth/change-password - Changer le mot de passe maître
  router.put('/change-password', authenticateToken, async (req, res) => {
    try {
      const { oldPasswordHash, newPasswordHash, reencryptedItems } = req.body;
      const userId = req.user.userId;

      // Validation
      if (!oldPasswordHash || !newPasswordHash) {
        return res.status(400).json({ error: 'Ancien et nouveau mot de passe requis' });
      }

      if (!Array.isArray(reencryptedItems)) {
        return res.status(400).json({ error: 'reencryptedItems doit être un tableau' });
      }

      // Récupérer l'utilisateur pour vérification
      const user = await User.findByEmail(req.user.email);
      if (!user) {
        return res.status(404).json({ error: 'Utilisateur non trouvé' });
      }

      // Vérifier l'ancien mot de passe
      const isValid = await User.verifyPassword(user, oldPasswordHash);
      if (!isValid) {
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

        await client.query('COMMIT');

        res.json({ message: 'Mot de passe maître changé avec succès' });
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    } catch (err) {
      console.error('Erreur changement mot de passe:', err);
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
        return res.status(400).json({ error: 'Mot de passe requis pour supprimer le compte' });
      }

      // Récupérer l'utilisateur avec password_hash pour vérification
      const user = await User.findByEmail(req.user.email);
      if (!user) {
        return res.status(404).json({ error: 'Utilisateur non trouvé' });
      }

      // Vérifier le mot de passe
      const isValid = await User.verifyPassword(user, passwordHash);
      if (!isValid) {
        return res.status(401).json({ error: 'Mot de passe incorrect' });
      }

      // Supprimer toutes les vault_items de l'utilisateur
      await pool.query('DELETE FROM vault_items WHERE user_id = $1', [userId]);

      // Supprimer l'utilisateur
      await pool.query('DELETE FROM users WHERE id = $1', [userId]);

      res.json({ message: 'Compte supprimé avec succès' });
    } catch (err) {
      console.error('Erreur suppression compte:', err);
      res.status(500).json({ error: 'Erreur lors de la suppression du compte' });
    }
  });

  export default router;
