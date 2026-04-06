import dotenv from 'dotenv';
dotenv.config();

console.log('=== Database Connection Debug ===');
console.log('DATABASE_URL:', process.env.DATABASE_URL);
console.log('JWT_SECRET:', process.env.JWT_SECRET);
console.log('CORS_ORIGIN:', process.env.CORS_ORIGIN);
console.log('NODE_ENV:', process.env.NODE_ENV);

import { testConnection } from './src/postgres.js';

async function testDbConnection() {
  console.log('\n🔍 Testing database connection...');
  const result = await testConnection();
  
  if (result) {
    console.log('✅ Database connection successful!');
  } else {
    console.log('❌ Database connection failed!');
    console.log('\n🔧 Possible issues:');
    console.log('1. Database URL is incorrect');
    console.log('2. Password needs URL encoding');
    console.log('3. Supabase project is not active');
    console.log('4. Network connectivity issues');
    console.log('5. Environment variables not set correctly');
  }
  
  console.log('\n🚀 Testing raw connection...');
  try {
    const { Pool } = await import('pg');
    
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
    
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time, version() as postgres_version');
    client.release();
    
    console.log('✅ Raw PostgreSQL connection successful!');
    console.log('Current time:', result.rows[0].current_time);
    console.log('PostgreSQL version:', result.rows[0].postgres_version);
    
  } catch (error) {
    console.error('❌ Raw connection failed:', error.message);
    console.error('Error details:', error);
  }
}

testDbConnection();
