# Create updated .env file with latest configuration

Write-Host "Creating updated .env file with latest configuration..." -ForegroundColor Green

$envContent = @"
# Server Configuration
PORT=4000

# PostgreSQL Database Connection
DATABASE_URL=postgresql://postgres:Tnseripdl%40123@db.rmtyykiyeehnyvcaajap.supabase.co:5432/postgres

# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# JWT Configuration
JWT_SECRET=change_me_to_a_long_random_secret_pdl_admin_portal_2024

# CORS Configuration
CORS_ORIGIN=https://pdl-ruddy.vercel.app,http://localhost:5173

# Admin Credentials
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=Admin123!

# Environment
NODE_ENV=development
"@

# Write to .env file
$envContent | Out-File -FilePath ".env" -Encoding UTF8

Write-Host "✅ Updated .env file created successfully!" -ForegroundColor Green
Write-Host "🔗 Database: Tnseripdl@123@db.rmtyykiyeehnyvcaajap.supabase.co" -ForegroundColor Yellow
Write-Host "🌐 CORS: https://pdl-ruddy.vercel.app,http://localhost:5173" -ForegroundColor Yellow
Write-Host "🚀 You can now start the backend with: npm run dev-postgres" -ForegroundColor Cyan
