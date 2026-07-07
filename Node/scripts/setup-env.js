import { copyFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const examplePath = resolve(__dirname, '../.env.example');
const envPath = resolve(__dirname, '../.env');

if (existsSync(envPath)) {
  console.log('ℹ️  Node/.env already exists — no changes made.');
  console.log('   Edit it with your PostgreSQL password if connection fails.');
  process.exit(0);
}

if (!existsSync(examplePath)) {
  console.error('❌ Node/.env.example not found.');
  process.exit(1);
}

copyFileSync(examplePath, envPath);
console.log('✅ Created Node/.env from .env.example');
console.log('   Edit DATABASE_URL (or PGUSER/PGPASSWORD/PGDATABASE) before running dev-postgres.');
