/**
 * Creates the PDL application database if it does not exist.
 * Reads credentials from Node/.env (DATABASE_URL or PG* variables).
 */
import dotenv from 'dotenv';
import { existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import pkg from 'pg';
import { getDatabaseConfig, printDatabaseSetupHelp } from '../src/postgres.js';

const { Client } = pkg;
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '../.env');

if (existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

const PLACEHOLDER = 'YOUR_PASSWORD';

function hasPlaceholderPassword(config) {
  if (config.connectionString?.includes(PLACEHOLDER)) return true;
  if (config.password === PLACEHOLDER) return true;
  return false;
}

function adminConnectionConfig(config, targetDb = 'postgres') {
  if (config.connectionString) {
    const url = new URL(config.connectionString);
    url.pathname = `/${targetDb}`;
    return { connectionString: url.toString() };
  }
  return { ...config, database: targetDb };
}

async function main() {
  const config = getDatabaseConfig();
  if (!config) {
    console.error('\n❌ PostgreSQL is not configured.\n');
    printDatabaseSetupHelp();
    process.exit(1);
  }

  if (hasPlaceholderPassword(config)) {
    console.error('\n❌ Node/.env still contains YOUR_PASSWORD placeholder.\n');
    console.error('Edit Node/.env and set your real PostgreSQL password:');
    console.error('  DATABASE_URL=postgresql://postgres:YOUR_REAL_PASSWORD@localhost:5432/pdl\n');
    console.error('This is the password you chose when installing PostgreSQL 17.');
    process.exit(1);
  }

  const dbName = config.database
    || (config.connectionString ? new URL(config.connectionString).pathname.replace(/^\//, '') : 'pdl');

  if (!dbName || dbName === 'postgres') {
    console.error('❌ Target database name must be "pdl" (not "postgres").');
    process.exit(1);
  }

  const admin = new Client(adminConnectionConfig(config, 'postgres'));

  try {
    await admin.connect();
    console.log('✅ Connected to PostgreSQL server');

    const exists = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);
    if (exists.rowCount > 0) {
      console.log(`ℹ️  Database "${dbName}" already exists`);
    } else {
      await admin.query(`CREATE DATABASE "${dbName}"`);
      console.log(`✅ Created database "${dbName}"`);
    }

    console.log('\nNext step:');
    console.log('  npm run dev-postgres');
  } catch (error) {
    console.error('\n❌ Database setup failed:', error.message);
    if (error.message.includes('password authentication failed')) {
      console.error('\n→ Wrong password in Node/.env.');
      console.error('  Update DATABASE_URL with the password from PostgreSQL installation.');
    }
    process.exit(1);
  } finally {
    await admin.end().catch(() => {});
  }
}

main();
