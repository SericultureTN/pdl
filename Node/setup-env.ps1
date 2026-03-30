# Create .env file with Supabase credentials

Write-Host "Creating .env file with your Supabase credentials..." -ForegroundColor Green

# Create the .env file content
$envContent = @"
# Server Configuration
PORT=4000

# PostgreSQL Database Connection
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

Write-Host ".env file created successfully!" -ForegroundColor Green
Write-Host "You can now start the backend with: npm run dev-postgres" -ForegroundColor Yellow
Write-Host "Login credentials: admin@example.com / Admin123!" -ForegroundColor Cyan
