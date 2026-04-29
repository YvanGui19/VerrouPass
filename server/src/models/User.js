import pool from '../db.js';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

export const User = {
  async create(email, passwordHash) {
    // Hash the auth key hash again with bcrypt for storage
    const hashedPassword = await bcrypt.hash(passwordHash, SALT_ROUNDS);

    const result = await pool.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at',
      [email.toLowerCase(), hashedPassword]
    );

    return result.rows[0];
  },

  async findByEmail(email) {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    return result.rows[0] || null;
  },

  async findById(id) {
    const result = await pool.query(
      'SELECT id, email, created_at, totp_enabled FROM users WHERE id = $1',
      [id]
    );

    return result.rows[0] || null;
  },

  async verifyPassword(user, passwordHash) {
    return bcrypt.compare(passwordHash, user.password_hash);
  },

  // --- TOTP / 2FA ---

  // Stocke le secret TOTP chiffré en attendant la confirmation par /enable.
  // totp_enabled reste FALSE jusqu'à preuve d'un code valide à l'enable.
  async setTotpPendingSecret(userId, encrypted) {
    await pool.query(
      `UPDATE users
         SET totp_secret_enc = $1,
             totp_secret_iv = $2,
             totp_secret_tag = $3,
             totp_enabled = FALSE,
             totp_recovery_codes_hashed = ARRAY[]::TEXT[]
       WHERE id = $4`,
      [encrypted.ciphertext, encrypted.iv, encrypted.tag, userId]
    );
  },

  // Active effectivement le TOTP et stocke les hashes bcrypt des recovery codes.
  async enableTotp(userId, recoveryCodesHashed) {
    await pool.query(
      `UPDATE users
         SET totp_enabled = TRUE,
             totp_recovery_codes_hashed = $1
       WHERE id = $2`,
      [recoveryCodesHashed, userId]
    );
  },

  // Désactive le TOTP : reset complet du secret et des recovery codes.
  async disableTotp(userId) {
    await pool.query(
      `UPDATE users
         SET totp_enabled = FALSE,
             totp_secret_enc = NULL,
             totp_secret_iv = NULL,
             totp_secret_tag = NULL,
             totp_recovery_codes_hashed = ARRAY[]::TEXT[]
       WHERE id = $1`,
      [userId]
    );
  },

  // Remplace la liste des recovery codes hashés (utilisé pour consommer un code
  // single-use : on retire le hash correspondant).
  async setRecoveryCodesHashed(userId, hashes) {
    await pool.query(
      'UPDATE users SET totp_recovery_codes_hashed = $1 WHERE id = $2',
      [hashes, userId]
    );
  }
};

export default User;
