import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

// PostgreSQL connection configuration
const dbUser = process.env.DB_USER || 'postgres';
const dbPassword = process.env.DB_PASSWORD || 'postgres';
const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = process.env.DB_PORT || '5432';
const dbName = process.env.DB_NAME || 'pdl_local';
const dbUrl = process.env.DATABASE_URL || `postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}`;
console.log('Database URL:', dbUrl);

const pool = new Pool({
  connectionString: dbUrl,
  max: 20, // maximum number of clients in the pool
  idleTimeoutMillis: 30000, // how long a client is allowed to remain idle before being closed
  connectionTimeoutMillis: 2000, // how long to wait when connecting a new client
});

// Test database connection
export const testConnection = async () => {
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    console.log('✅ PostgreSQL connected successfully');
    return true;
  } catch (error) {
    console.error('❌ PostgreSQL connection failed:', error.message);
    return false;
  }
};

// Initialize database schema
export const initializeDatabase = async () => {
  try {
    const client = await pool.connect();
    
    // Create admins table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'super_admin',
        name VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Add role column if it doesn't exist (migration)
    try {
      await client.query(`
        ALTER TABLE admins ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'super_admin';
      `);
      await client.query(`
        ALTER TABLE admins ADD COLUMN IF NOT EXISTS name VARCHAR(255);
      `);
    } catch (err) {
      console.log('ℹ️ Role/name columns might already exist');
    }

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

    // Create MIS entries table
    await client.query(`
      CREATE TABLE IF NOT EXISTS mis_entries (
        id SERIAL PRIMARY KEY,
        section VARCHAR(10) NOT NULL,
        farmer_name VARCHAR(255) NOT NULL,
        farmer_id VARCHAR(100) NOT NULL,
        address TEXT,
        phone VARCHAR(20),
        district VARCHAR(100) NOT NULL,
        registration_date DATE,
        land_area VARCHAR(50),
        variety VARCHAR(100),
        plantation_date DATE,
        expected_yield VARCHAR(50),
        notes TEXT,
        created_by INTEGER REFERENCES sericulturists(id),
        ad_office VARCHAR(100),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create trigger for mis_entries updated_at
    await client.query(`
      DROP TRIGGER IF EXISTS update_mis_entries_updated_at ON mis_entries;
      CREATE TRIGGER update_mis_entries_updated_at
        BEFORE UPDATE ON mis_entries
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);

    // Create indexes for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_mis_entries_section ON mis_entries(section);
      CREATE INDEX IF NOT EXISTS idx_mis_entries_ad_office ON mis_entries(ad_office);
      CREATE INDEX IF NOT EXISTS idx_mis_entries_created_by ON mis_entries(created_by);
      CREATE INDEX IF NOT EXISTS idx_mis_entries_district ON mis_entries(district);
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
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('📊 Query executed:', { text, duration, rows: result.rowCount });
    return result;
  } catch (error) {
    console.error('❌ Query error:', { text, error: error.message });
    throw error;
  }
};

// Transaction helper
export const transaction = async (callback) => {
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
  await pool.end();
  console.log('🔒 Database connection pool closed');
};

export default pool;
