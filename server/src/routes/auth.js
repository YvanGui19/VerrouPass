import express from 'express';
  import { User } from '../models/User.js';
  import { generateToken } from '../middleware/auth.js';
  import { loginLimiter, registerLimiter } from '../middleware/rateLimiter.js';

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

  export default router;
