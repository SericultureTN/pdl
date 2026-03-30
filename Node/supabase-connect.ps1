# Supabase Database Connection Setup

Write-Host "=== Supabase Database Connection Setup ===" -ForegroundColor Green
Write-Host ""

# Step 1: Create .env file with Supabase configuration
Write-Host "Step 1: Creating .env file..." -ForegroundColor Yellow

$envContent = @"
# Server Configuration
PORT=4000

# Supabase Database Configuration
DB_USER=postgres
DB_HOST=db.rmtyykiyeehnyvcaajap.supabase.co
DB_NAME=postgres
DB_PASSWORD=Tnseripdl@123
DB_PORT=5432

# Alternative: Use DATABASE_URL format
DATABASE_URL=postgresql://postgres:Tnseripdl%40123@db.rmtyykiyeehnyvcaajap.supabase.co:5432/postgres

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here_make_it_long_and_random

# CORS Configuration
CORS_ORIGIN=http://localhost:5173

# Admin Credentials
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=Admin123!

# Environment
NODE_ENV=development
"@

# Write to .env file
$envContent | Out-File -FilePath ".env" -Encoding UTF8
Write-Host "✅ .env file created successfully!" -ForegroundColor Green

# Step 2: Test database connection
Write-Host ""
Write-Host "Step 2: Testing database connection..." -ForegroundColor Yellow

# Create a simple test script
$testScript = @"
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
    console.log('🔄 Testing connection to Supabase...');
    console.log(\`Host: \${process.env.DB_HOST}\`);
    console.log(\`User: \${process.env.DB_USER}\`);
    console.log(\`Database: \${process.env.DB_NAME}\`);
    
    const client = await pool.connect();
    console.log('✅ Connection successful!');
    
    // Test basic query
    const result = await client.query('SELECT NOW() as current_time, version() as postgres_version');
    console.log('📊 Database Info:', result.rows[0]);
    
    client.release();
    process.exit(0);
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('🔍 Check:');
    console.error('   1. Supabase project is active');
    console.error('   2. Hostname is correct');
    console.error('   3. Password is correct');
    console.error('   4. Network connectivity');
    process.exit(1);
  }
}

testConnection();
"@

# Write test script
$testScript | Out-File -FilePath "test-connection.js" -Encoding UTF8

# Run the test
Write-Host "Running connection test..." -ForegroundColor Cyan
node test-connection.js

# Clean up
Remove-Item "test-connection.js" -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "=== Connection Test Complete ===" -ForegroundColor Green
Write-Host ""
Write-Host "If connection was successful, you can now:" -ForegroundColor Yellow
Write-Host "1. Run: npm run dev-postgres" -ForegroundColor White
Write-Host "2. Run the SQL setup script in Supabase" -ForegroundColor White
Write-Host "3. Test the application" -ForegroundColor White
Write-Host ""
