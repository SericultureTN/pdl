# Create .env file with raw password (no encoding)

Write-Host "Creating .env file with raw password..." -ForegroundColor Green

$envContent = @"
# Server Configuration
PORT=4000

# PostgreSQL Database Connection
DATABASE_URL=postgresql://postgres:Tnseripdl@123@db.rmtyykiyeehnyvcaajap.supabase.co:5432/postgres

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

Write-Host ".env file created with raw password!" -ForegroundColor Green
Write-Host "Testing with raw password format..." -ForegroundColor Yellow
Write-Host "If this fails, we may need to check Supabase settings" -ForegroundColor Cyan
