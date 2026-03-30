# Create .env file with correct individual variables for postgres.js

Write-Host "Creating .env file with individual PostgreSQL variables..." -ForegroundColor Green

$envContent = @"
# Server Configuration
PORT=4000

# PostgreSQL Individual Variables (for postgres.js)
DB_USER=postgres
DB_HOST=db.rmtyykiyeehnyvcaajap.supabase.co
DB_NAME=postgres
DB_PASSWORD=Tnseripdl@123
DB_PORT=5432

# Alternative DATABASE_URL (for reference)
DATABASE_URL=postgresql://postgres:Tnseripdl%40123@db.rmtyykiyeehnyvcaajap.supabase.co:5432/postgres

# JWT Configuration
JWT_SECRET=change_me_to_a_long_random_secret_pdl_admin_portal_2024

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

Write-Host ".env file created with individual PostgreSQL variables!" -ForegroundColor Green
Write-Host "DB_PASSWORD: Tnseripdl@123" -ForegroundColor Yellow
Write-Host "DB_HOST: db.rmtyykiyeehnyvcaajap.supabase.co" -ForegroundColor Cyan
Write-Host "You can now start the backend with: npm run dev-postgres" -ForegroundColor Green
