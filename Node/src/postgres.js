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
  console.error('  3. Create database: createdb pdl (or npm run setup:db)');
  console.error('  4. npm run dev\n');
}

const dbConfig = getDatabaseConfig();

if (!dbConfig) {
  console.warn('⚠️  PostgreSQL not configured (DATABASE_URL / PG* vars missing).');
  console.warn('   Run: npm run setup:env   then edit Node/.env');
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

// One-time, idempotent rename of the 4 core POC tables to their poc_ prefixed
// names. Safe to call on every boot: no-ops once the rename has happened
// (new name already exists) and no-ops on a fresh database (old name never
// existed) — either way the CREATE TABLE IF NOT EXISTS statements that run
// right after this take over from wherever it left off. Must run before any
// of those CREATE TABLE calls, otherwise they'd create an empty poc_* table
// first and the rename would have nothing left to rename.
async function renameTableIfExists(oldName, newName) {
  if (!pool) return;
  await query(`
    DO $$
    BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '${oldName}')
         AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '${newName}') THEN
        EXECUTE 'ALTER TABLE ' || quote_ident('${oldName}') || ' RENAME TO ' || quote_ident('${newName}');
      END IF;
    END $$;
  `);
}

export async function renamePocTables() {
  if (!pool) return;
  await renameTableIfExists('offices', 'poc_offices');
  await renameTableIfExists('users', 'poc_users');
  await renameTableIfExists('targets', 'poc_targets');
  await renameTableIfExists('reports', 'poc_reports');
  console.log('✅ Checked poc_* table renames (offices/users/targets/reports)');
}

// Initialize database schema
export const initializeDatabase = async () => {
  if (!pool) return false;

  try {
    const client = await pool.connect();
    
    // Create targets table. government_reeling targets are monthly (one row per
    // Office + fiscal year + month); government_twisting and private_reeling
    // stay annual, keyed by unit_code (Unit Code / Category), unchanged. The
    // office_id/set_by_user_id columns and their indexes are owned by
    // user-migration.js's ensureTargetsUserColumns (it has to run the
    // legacy-column-rename dance before an index on office_id can exist).
    await client.query(`
      CREATE TABLE IF NOT EXISTS poc_targets (
        id SERIAL PRIMARY KEY,
        unit_type VARCHAR(30) NOT NULL CHECK (unit_type IN ('government_reeling', 'government_twisting', 'private_reeling')),
        unit_code VARCHAR(100),
        fiscal_year VARCHAR(20) NOT NULL,
        physical_target JSONB NOT NULL DEFAULT '{}'::jsonb,
        budget_annual JSONB,
        is_current BOOLEAN NOT NULL DEFAULT TRUE,
        locked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        revised_from_target_id INTEGER REFERENCES poc_targets(id),
        revision_reason TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        created_by VARCHAR(255)
      );
    `);

    await client.query(`ALTER TABLE poc_targets ALTER COLUMN unit_code DROP NOT NULL;`);
    // Month name (e.g. "July") — only used/required for government_reeling's monthly targets.
    await client.query(`ALTER TABLE poc_targets ADD COLUMN IF NOT EXISTS month VARCHAR(20);`);

    // Twisting/Private Reeling: one "current" target per unit_type + unit_code + fiscal_year
    // (unit_code is NULL for government_reeling rows, so this index doesn't constrain them —
    // Postgres treats NULLs as distinct, hence the separate index below).
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS targets_current_key
        ON poc_targets (unit_type, unit_code, fiscal_year)
        WHERE is_current;
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
    throw new Error('Database not configured. Set DATABASE_URL in Node/.env (see npm run setup:env)');
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
