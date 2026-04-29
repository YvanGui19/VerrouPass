import express from 'express';
import bcrypt from 'bcrypt';
import { User } from '../models/User.js';
import {
  authenticateToken,
  revokeAllUserRefreshTokens
} from '../middleware/auth.js';
import { totpManageLimiter } from '../middleware/rateLimiter.js';
import {
  generateSecret,
  generateOtpauthUri,
  verifyTOTP,
  generateRecoveryCodes,
  normalizeRecoveryCode
} from '../utils/totp.js';
import {
  encryptSecret,
  decryptSecret
} from '../utils/secretCrypto.js';
import { securityLogger } from '../utils/logger.js';

const RECOVERY_CODE_BCRYPT_ROUNDS = 12;
const ISSUER = 'VerrouPass';

const router = express.Router();

// Toutes les routes ici exigent un access token valide.
router.use(authenticateToken);
router.use(totpManageLimiter);

// POST /api/auth/totp/setup
// Initie l'activation : génère un nouveau secret, le chiffre et le persiste
// avec totp_enabled = FALSE. L'utilisateur doit ensuite scanner le QR puis
// confirmer via /enable. Si /enable n'est jamais appelé, le secret pending
// reste sans effet (totp_enabled = FALSE), et un nouveau /setup l'écrasera.
router.post('/setup', async (req, res) => {
  try {
    const userId = req.user.userId;
    const email = req.user.email;

    // Refuser si déjà activé : il faut /disable d'abord
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    if (user.totp_enabled) {
      securityLogger.totp(req, email, 'setup', false, 'already_enabled');
      return res.status(409).json({
        error: '2FA déjà activée. Désactivez-la d\'abord pour la reconfigurer.'
      });
    }

    const secret = generateSecret();
    const encrypted = encryptSecret(secret);
    await User.setTotpPendingSecret(userId, encrypted);

    const otpauthUri = generateOtpauthUri({
      issuer: ISSUER,
      account: email,
      secret
    });

    securityLogger.totp(req, email, 'setup', true);

    // Le secret en clair n'est renvoyé qu'à cette étape (pour le QR et la
    // saisie manuelle). Le client doit le présenter à l'utilisateur puis
    // l'oublier après /enable.
    res.json({
      secret,
      otpauthUri,
      issuer: ISSUER,
      account: email,
      digits: 6,
      period: 30,
      algorithm: 'SHA1'
    });
  } catch (err) {
    securityLogger.totp(req, req.user?.email, 'setup', false, 'server_error');
    res.status(500).json({ error: 'Erreur lors de l\'initialisation 2FA' });
  }
});

// POST /api/auth/totp/enable
// Confirme l'activation : vérifie un code TOTP (preuve que l'utilisateur a
// bien scanné le QR), active totp_enabled=TRUE, génère et persiste 10 recovery
// codes hashés bcrypt, révoque tous les refresh tokens existants (force
// re-login sur les autres sessions, qui devront passer par TOTP).
// Body : { totpCode: "123456" }
router.post('/enable', async (req, res) => {
  try {
    const userId = req.user.userId;
    const email = req.user.email;
    const { totpCode } = req.body;

    if (!totpCode || typeof totpCode !== 'string') {
      return res.status(400).json({ error: 'Code TOTP requis' });
    }

    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    if (user.totp_enabled) {
      securityLogger.totp(req, email, 'enable', false, 'already_enabled');
      return res.status(409).json({ error: '2FA déjà activée' });
    }
    if (!user.totp_secret_enc || !user.totp_secret_iv || !user.totp_secret_tag) {
      securityLogger.totp(req, email, 'enable', false, 'no_pending_setup');
      return res.status(400).json({
        error: 'Aucune configuration 2FA en attente. Lancez /setup d\'abord.'
      });
    }

    const secret = decryptSecret({
      ciphertext: user.totp_secret_enc,
      iv: user.totp_secret_iv,
      tag: user.totp_secret_tag
    });

    if (!verifyTOTP(secret, totpCode)) {
      securityLogger.totp(req, email, 'enable', false, 'invalid_code');
      return res.status(401).json({ error: 'Code TOTP incorrect' });
    }

    // Génération + hashage des recovery codes
    const recoveryCodes = generateRecoveryCodes();
    const hashes = await Promise.all(
      recoveryCodes.map((code) =>
        bcrypt.hash(normalizeRecoveryCode(code), RECOVERY_CODE_BCRYPT_ROUNDS)
      )
    );

    await User.enableTotp(userId, hashes);
    // Révoque toutes les sessions existantes pour forcer re-login avec TOTP
    await revokeAllUserRefreshTokens(userId);

    securityLogger.totp(req, email, 'enable', true);

    // Les codes en clair ne sont retournés qu'ici, à afficher une seule fois
    res.json({
      message: '2FA activée. Sauvegardez ces codes de secours, ils ne seront plus jamais affichés.',
      recoveryCodes
    });
  } catch (err) {
    securityLogger.totp(req, req.user?.email, 'enable', false, 'server_error');
    res.status(500).json({ error: 'Erreur lors de l\'activation 2FA' });
  }
});

// POST /api/auth/totp/disable
// Désactivation : exige le mot de passe maître (passwordHash) ET un code TOTP
// valide (ou recovery code) pour empêcher un attaquant ayant volé l'access
// token de désactiver le 2FA. Reset complet du secret et des recovery codes.
// Révoque toutes les sessions existantes.
// Body : { passwordHash, totpCode } OU { passwordHash, recoveryCode }
router.post('/disable', async (req, res) => {
  try {
    const userId = req.user.userId;
    const email = req.user.email;
    const { passwordHash, totpCode, recoveryCode } = req.body;

    if (!passwordHash) {
      return res.status(400).json({ error: 'Mot de passe requis' });
    }
    if (!totpCode && !recoveryCode) {
      return res.status(400).json({ error: 'Code TOTP ou code de secours requis' });
    }

    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    if (!user.totp_enabled) {
      securityLogger.totp(req, email, 'disable', false, 'not_enabled');
      return res.status(409).json({ error: '2FA n\'est pas activée' });
    }

    const passwordOk = await User.verifyPassword(user, passwordHash);
    if (!passwordOk) {
      securityLogger.totp(req, email, 'disable', false, 'invalid_password');
      return res.status(401).json({ error: 'Mot de passe incorrect' });
    }

    let secondFactorOk = false;
    if (totpCode) {
      const secret = decryptSecret({
        ciphertext: user.totp_secret_enc,
        iv: user.totp_secret_iv,
        tag: user.totp_secret_tag
      });
      secondFactorOk = verifyTOTP(secret, totpCode);
    } else {
      const normalized = normalizeRecoveryCode(recoveryCode);
      for (const hash of user.totp_recovery_codes_hashed) {
        if (await bcrypt.compare(normalized, hash)) {
          secondFactorOk = true;
          break;
        }
      }
    }

    if (!secondFactorOk) {
      securityLogger.totp(req, email, 'disable', false, 'invalid_second_factor');
      return res.status(401).json({ error: 'Code 2FA incorrect' });
    }

    await User.disableTotp(userId);
    await revokeAllUserRefreshTokens(userId);

    securityLogger.totp(req, email, 'disable', true);

    res.json({ message: '2FA désactivée' });
  } catch (err) {
    securityLogger.totp(req, req.user?.email, 'disable', false, 'server_error');
    res.status(500).json({ error: 'Erreur lors de la désactivation 2FA' });
  }
});

// GET /api/auth/totp/status
// Petit helper pour le frontend : indique si la 2FA est activée et combien de
// codes de secours restent. Utilisé par la page Settings pour afficher l'état.
router.get('/status', async (req, res) => {
  try {
    const user = await User.findByEmail(req.user.email);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    res.json({
      enabled: user.totp_enabled,
      recoveryCodesRemaining: (user.totp_recovery_codes_hashed || []).length
    });
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la récupération du statut 2FA' });
  }
});

export default router;
