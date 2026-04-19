import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

import { initDatabase } from './db.js';
import authRoutes from './routes/auth.js';
import vaultRoutes from './routes/vault.js';
import cliRoutes from './routes/cli.js';
import logger from './utils/logger.js';

// Charger les variables d'environnement
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware de sécurité
app.use(helmet());

// Trust proxy - nécessaire pour Nginx reverse proxy
app.set('trust proxy', true);

// CORS - autoriser le client
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));

// Parser JSON et cookies
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/vault', vaultRoutes);
app.use('/api/cli', cliRoutes);

// Route de santé
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Gestion des erreurs 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route non trouvée' });
});

// Gestion globale des erreurs
app.use((err, req, res, next) => {
  logger.error('Erreur serveur:', { error: err.message, stack: err.stack });
  res.status(500).json({ error: 'Erreur interne du serveur' });
});

// Démarrer le serveur
async function start() {
  try {
    // Initialiser la base de données
    await initDatabase();

    app.listen(PORT, () => {
      logger.info(`Serveur VerrouPass demarré`, {
        port: PORT,
        mode: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString()
      });
    });
  } catch (err) {
    logger.error('Erreur au démarrage du serveur:', { error: err.message, stack: err.stack });
    process.exit(1);
  }
}

start();
