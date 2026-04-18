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
      'SELECT id, email, created_at FROM users WHERE id = $1',
      [id]
    );

    return result.rows[0] || null;
  },

  async verifyPassword(user, passwordHash) {
    return bcrypt.compare(passwordHash, user.password_hash);
  }
};

export default User;
