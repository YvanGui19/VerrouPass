import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Test connection
pool.query('SELECT NOW()', (err) => {
  if (err) {
    console.error('Database connection error:', err.message);
  } else {
    console.log('Connected to PostgreSQL database');
  }
});

// Initialize tables
export async function initDatabase() {
  const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `;

  const createVaultItemsTable = `
    CREATE TABLE IF NOT EXISTS vault_items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      encrypted_data TEXT NOT NULL,
      iv VARCHAR(64) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `;

  const createIndex = `
    CREATE INDEX IF NOT EXISTS idx_vault_user ON vault_items(user_id);
  `;

  try {
    await pool.query(createUsersTable);
    await pool.query(createVaultItemsTable);
    await pool.query(createIndex);
    console.log('Database tables initialized');
  } catch (err) {
    console.error('Error initializing database:', err.message);
  }
}

export default pool;
