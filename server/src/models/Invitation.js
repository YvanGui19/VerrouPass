import crypto from 'crypto';
import pool from '../db.js';

function hashCode(code) {
  return crypto.createHash('sha256').update(code).digest('hex');
}

export const Invitation = {
  /**
   * Cherche une invitation valide (non utilisee, non expiree) par son code.
   * Retourne la ligne complete ou null.
   */
  async findValidByCode(code) {
    if (!code || typeof code !== 'string') return null;
    const codeHash = hashCode(code);

    const result = await pool.query(
      `SELECT id, code_hash, note, expires_at, used_at, used_by_user_id, created_at
       FROM invitations
       WHERE code_hash = $1
         AND used_at IS NULL
         AND (expires_at IS NULL OR expires_at > NOW())`,
      [codeHash]
    );

    return result.rows[0] || null;
  },

  /**
   * Marque une invitation comme utilisee, dans une transaction passee en parametre.
   * Doit etre appelee dans la meme transaction que la creation de l utilisateur,
   * pour eviter qu un code soit consomme sans qu un compte soit cree.
   */
  async markUsed(client, invitationId, userId) {
    await client.query(
      `UPDATE invitations
       SET used_at = NOW(), used_by_user_id = $1
       WHERE id = $2 AND used_at IS NULL`,
      [userId, invitationId]
    );
  },

  /**
   * Cree une nouvelle invitation. Utilise par le script CLI.
   * @param {string} code - Code en clair (sera hashe en SHA-256).
   * @param {string|null} note - Note libre pour identifier le destinataire.
   * @param {Date|null} expiresAt - Date d expiration optionnelle.
   */
  async create(code, note = null, expiresAt = null) {
    const codeHash = hashCode(code);
    const result = await pool.query(
      `INSERT INTO invitations (code_hash, note, expires_at)
       VALUES ($1, $2, $3)
       RETURNING id, created_at`,
      [codeHash, note, expiresAt]
    );
    return result.rows[0];
  },

  /**
   * Liste les invitations (pour debug ou admin CLI).
   */
  async list() {
    const result = await pool.query(
      `SELECT id, note, expires_at, used_at, used_by_user_id, created_at
       FROM invitations
       ORDER BY created_at DESC`
    );
    return result.rows;
  },

  /**
   * Revoque une invitation non utilisee (la marque comme expiree).
   */
  async revoke(invitationId) {
    const result = await pool.query(
      `UPDATE invitations
       SET expires_at = NOW()
       WHERE id = $1 AND used_at IS NULL
       RETURNING id`,
      [invitationId]
    );
    return result.rows[0] || null;
  },
};

export default Invitation;
