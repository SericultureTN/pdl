# Setup local database for PDL development

Write-Host "Setting up local database for PDL development..." -ForegroundColor Green

# Create local .env file with local database configuration
$localEnvContent = @"
# Server Configuration
PORT=4000

# PostgreSQL Database Connection (Local)
DATABASE_URL=postgresql://postgres:Tnseripdl@123@localhost:5432/pdl_db

# JWT Configuration
JWT_SECRET=local_dev_secret_change_me_in_production

# CORS Configuration
CORS_ORIGIN=http://localhost:5173,https://pdl-ruddy.vercel.app

# Environment
NODE_ENV=development

# Admin Credentials
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=Admin123!
"@

# Write to .env file
$localEnvContent | Out-File -FilePath ".env" -Encoding UTF8

Write-Host "Local database configuration created!" -ForegroundColor Green
Write-Host "Database: localhost:5432/pdl_db" -ForegroundColor Yellow
Write-Host "CORS: http://localhost:5173" -ForegroundColor Yellow
Write-Host "" -ForegroundColor White
Write-Host "Next Steps:" -ForegroundColor Magenta
Write-Host "1. Install PostgreSQL on your machine" -ForegroundColor White
Write-Host "2. Create database 'pdl_db'" -ForegroundColor White
Write-Host "3. Start the backend server" -ForegroundColor White
Write-Host "4. Test the connection" -ForegroundColor White
Write-Host "" -ForegroundColor White
Write-Host "Commands to run:" -ForegroundColor Cyan
Write-Host "1. npm install" -ForegroundColor White
Write-Host "2. npm run dev-postgres" -ForegroundColor White
