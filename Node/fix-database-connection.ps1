# Fix database connection for Vercel deployment

Write-Host "Fixing database connection for Vercel deployment..." -ForegroundColor Green

# Update .env file with correct database URL
$envContent = @"
# Server Configuration
PORT=4000

# PostgreSQL Database Connection (URL-encoded password for Vercel)
DATABASE_URL=postgresql://postgres:Tnseripdl%40123@db.rmtyykiyeehnyvcaajap.supabase.co:5432/postgres

# JWT Configuration
JWT_SECRET=your-secure-random-string-here

# CORS Configuration
CORS_ORIGIN=https://pdl-ruddy.vercel.app

# Environment
NODE_ENV=production

# Admin Credentials
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=Admin123!
"@

# Write to .env file
$envContent | Out-File -FilePath ".env" -Encoding UTF8

Write-Host "Database configuration updated!" -ForegroundColor Green
Write-Host "Database: Tnseripdl@123@db.rmtyykiyeehnyvcaajap.supabase.co" -ForegroundColor Yellow
Write-Host "CORS: https://pdl-ruddy.vercel.app" -ForegroundColor Yellow
Write-Host "" -ForegroundColor White
Write-Host "Next Steps:" -ForegroundColor Magenta
Write-Host "1. Test database connection" -ForegroundColor White
Write-Host "2. Restart backend if needed" -ForegroundColor White
Write-Host "3. Verify database is connected" -ForegroundColor White
Write-Host "" -ForegroundColor White
Write-Host "Testing database connection..." -ForegroundColor Cyan
