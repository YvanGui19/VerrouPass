import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

import { initDatabase } from './db.js';
import authRoutes from './routes/auth.js';
import totpRoutes from './routes/totp.js';
import vaultRoutes from './routes/vault.js';
import cliRoutes from './routes/cli.js';
import adminRoutes from './routes/admin.js';
import { startInvitationCleanup } from './services/invitations.js';
import { assertTotpKeyConfigured } from './utils/secretCrypto.js';
import logger from './utils/logger.js';

// Charger les variables d'environnement
dotenv.config();

// Fail-fast si TOTP_ENCRYPTION_KEY manquante / mal formée. Empeche un demarrage
// silencieux qui crasherait au premier setup TOTP en production.
assertTotpKeyConfigured();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware de securite.
// Les en-tetes critiques (CSP, HSTS, X-Frame-Options, X-Content-Type-Options,
// Referrer-Policy, Permissions-Policy, COOP, CORP) sont deja appliques en
// amont par nginx via /etc/nginx/snippets/verroupass-security-headers.conf.
// On desactive les directives helmet qui font doublon pour eviter les
// en-tetes contradictoires (cas reel observe : X-Frame-Options DENY/nginx +
// SAMEORIGIN/helmet sur les reponses /api/). On garde uniquement les
// directives helmet qui ne sont pas servies par nginx :
//   - hidePoweredBy : retire X-Powered-By: Express
//   - dnsPrefetchControl, ieNoOpen, noSniff (small extras)
app.use(helmet({
  contentSecurityPolicy: false,    // nginx
  strictTransportSecurity: false,  // nginx (HSTS)
  frameguard: false,               // nginx (X-Frame-Options)
  referrerPolicy: false,           // nginx
  crossOriginOpenerPolicy: false,  // nginx
  crossOriginResourcePolicy: false // nginx
}));

// Trust proxy - exactement 1 hop (Nginx reverse proxy local)
// "true" ferait confiance à toute la chaîne X-Forwarded-For et permettrait de spoofer
// l'IP cliente pour contourner le rate limiting.
app.set('trust proxy', 1);

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
app.use('/api/auth/totp', totpRoutes);
app.use('/api/vault', vaultRoutes);
app.use('/api/cli', cliRoutes);
app.use('/api/admin', adminRoutes);

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

    // Cleanup periodique des codes d'invitation expires (en memoire)
    startInvitationCleanup();

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
