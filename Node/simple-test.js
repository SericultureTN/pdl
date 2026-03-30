import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: { rejectUnauthorized: false }
});

async function testConnection() {
  try {
    console.log('Testing connection to Supabase...');
    console.log('Host:', process.env.DB_HOST);
    console.log('User:', process.env.DB_USER);
    console.log('Database:', process.env.DB_NAME);
    
    const client = await pool.connect();
    console.log('Connection successful!');
    
    // Test basic query
    const result = await client.query('SELECT NOW() as current_time, version() as postgres_version');
    console.log('Database Info:', result.rows[0]);
    
    client.release();
    process.exit(0);
  } catch (error) {
    console.error('Connection failed:', error.message);
    console.error('Check:');
    console.error('1. Supabase project is active');
    console.error('2. Hostname is correct');
    console.error('3. Password is correct');
    console.error('4. Network connectivity');
    process.exit(1);
  }
}

testConnection();
