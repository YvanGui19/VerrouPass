import pool from '../db.js';

export const VaultItem = {
  async create(userId, encryptedData, iv) {
    const result = await pool.query(
      `INSERT INTO vault_items (user_id, encrypted_data, iv)
       VALUES ($1, $2, $3)
       RETURNING id, encrypted_data, iv, created_at, updated_at`,
      [userId, encryptedData, iv]
    );

    return result.rows[0];
  },

  async findAllByUser(userId) {
    const result = await pool.query(
      `SELECT id, encrypted_data, iv, created_at, updated_at
       FROM vault_items
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    return result.rows;
  },

  async findById(id, userId) {
    const result = await pool.query(
      `SELECT id, encrypted_data, iv, created_at, updated_at
       FROM vault_items
       WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    return result.rows[0] || null;
  },

  async update(id, userId, encryptedData, iv) {
    const result = await pool.query(
      `UPDATE vault_items
       SET encrypted_data = $1, iv = $2, updated_at = NOW()
       WHERE id = $3 AND user_id = $4
       RETURNING id, encrypted_data, iv, created_at, updated_at`,
      [encryptedData, iv, id, userId]
    );

    return result.rows[0] || null;
  },

  async delete(id, userId) {
    const result = await pool.query(
      'DELETE FROM vault_items WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );

    return result.rows[0] || null;
  }
};

export default VaultItem;
