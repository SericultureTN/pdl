import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '../.env');

if (existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

export function getDatabaseConfig() {
  if (process.env.DATABASE_URL) {
    return { connectionString: process.env.DATABASE_URL };
  }

  const user = process.env.PGUSER || process.env.POSTGRES_USER;
  const password = process.env.PGPASSWORD || process.env.POSTGRES_PASSWORD;
  const host = process.env.PGHOST || process.env.POSTGRES_HOST || 'localhost';
  const port = Number(process.env.PGPORT || process.env.POSTGRES_PORT || 5432);
  const database = process.env.PGDATABASE || process.env.POSTGRES_DB;

  if (user && password != null && password !== '' && database) {
    return {
      user,
      password: String(password),
      host,
      port,
      database,
    };
  }

  return null;
}

export function printDatabaseSetupHelp() {
  console.error('Configure PostgreSQL in Node/.env using one of these options:\n');
  console.error('  DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/pdl\n');
  console.error('  — or —\n');
  console.error('  PGUSER=postgres');
  console.error('  PGPASSWORD=YOUR_PASSWORD');
  console.error('  PGDATABASE=pdl\n');
  console.error('Setup steps:');
  console.error('  1. cd Node && npm run setup:env');
  console.error('  2. Edit Node/.env with your PostgreSQL password');
  console.error('  3. Create database: createdb pdl');
  console.error('  4. npm run dev-postgres\n');
  console.error('Zero-config alternative (no PostgreSQL install needed):');
  console.error('  npm run dev-sqlite');
}

const dbConfig = getDatabaseConfig();

if (!dbConfig) {
  console.warn('⚠️  PostgreSQL not configured (DATABASE_URL / PG* vars missing).');
  console.warn('   Run: npm run setup:env   then edit Node/.env');
  console.warn('   Or use SQLite: npm run dev-sqlite');
}

const pool = dbConfig
  ? new Pool({
      ...dbConfig,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    })
  : null;

// Test database connection
export const testConnection = async () => {
  if (!pool) {
    console.error('❌ PostgreSQL connection failed: no database configuration found');
    printDatabaseSetupHelp();
    return false;
  }

  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    console.log('✅ PostgreSQL connected successfully');
    return true;
  } catch (error) {
    console.error('❌ PostgreSQL connection failed:', error.message);
    if (error.message.includes('password must be a string')) {
      console.error('   → DATABASE_URL or PGPASSWORD is missing. Run: npm run setup:env');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.error('   → PostgreSQL server is not running. Start PostgreSQL service first.');
    } else if (error.message.includes('does not exist')) {
      console.error('   → Database not found. Create it with: createdb pdl');
    }
    return false;
  }
};

// Initialize database schema
export const initializeDatabase = async () => {
  if (!pool) return false;

  try {
    const client = await pool.connect();
    
    // Create admins table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create updated_at trigger
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    await client.query(`
      DROP TRIGGER IF EXISTS update_admins_updated_at ON admins;
      CREATE TRIGGER update_admins_updated_at
        BEFORE UPDATE ON admins
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);

    // Create sericulturists table (for users)
    await client.query(`
      CREATE TABLE IF NOT EXISTS sericulturists (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE,
        password VARCHAR(255),
        phone VARCHAR(20),
        address TEXT,
        role VARCHAR(50),
        ad_office VARCHAR(100),
        registration_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      DROP TRIGGER IF EXISTS update_sericulturists_updated_at ON sericulturists;
      CREATE TRIGGER update_sericulturists_updated_at
        BEFORE UPDATE ON sericulturists
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);

    client.release();
    console.log('✅ Database schema initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    return false;
  }
};

// Generic query function
export const query = async (text, params) => {
  if (!pool) {
    throw new Error('Database not configured. Set DATABASE_URL in Node/.env or use npm run dev-sqlite');
  }

  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('📊 Query executed:', { text: text.slice(0, 80), duration, rows: result.rowCount });
    return result;
  } catch (error) {
    console.error('❌ Query error:', { text: text.slice(0, 80), error: error.message });
    throw error;
  }
};

// Transaction helper
export const transaction = async (callback) => {
  if (!pool) throw new Error('Database not configured');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// Graceful shutdown
export const closePool = async () => {
  if (pool) {
    await pool.end();
    console.log('🔒 Database connection pool closed');
  }
};

export default pool;
