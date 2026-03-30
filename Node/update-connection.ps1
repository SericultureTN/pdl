# Update connection with your actual Supabase details

Write-Host "Please enter your Supabase connection details:" -ForegroundColor Green

# Get connection details from user
$host = Read-Host "Enter Supabase host (e.g., db.abcdefg.supabase.co)"
$password = Read-Host "Enter Supabase password"
$database = Read-Host "Enter database name (default: postgres)" -DefaultValue "postgres"

# Create .env file with correct details
$envContent = @"
# Server Configuration
PORT=4000

# Supabase Database Configuration
DB_USER=postgres
DB_HOST=$host
DB_NAME=$database
DB_PASSWORD=$password
DB_PORT=5432

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

Write-Host ""
Write-Host "✅ .env file updated with your Supabase details!" -ForegroundColor Green
Write-Host "Host: $host" -ForegroundColor Yellow
Write-Host "Database: $database" -ForegroundColor Yellow
Write-Host ""
Write-Host "Now test the connection:" -ForegroundColor Cyan
Write-Host "node simple-test.js" -ForegroundColor White
Write-Host ""
Write-Host "If successful, start the backend:" -ForegroundColor Cyan
Write-Host "npm run dev-postgres" -ForegroundColor White
