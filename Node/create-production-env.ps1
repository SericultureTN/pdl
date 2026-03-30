# Create production .env file with correct credentials

Write-Host "Creating production .env file with correct credentials..." -ForegroundColor Green

$envContent = @"
# Server Configuration
PORT=4000

# PostgreSQL Database Connection (corrected password)
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

Write-Host "✅ Production .env file created successfully!" -ForegroundColor Green
Write-Host "🔗 Database: Tnseripdl@123@db.rmtyykiyeehnyvcaajap.supabase.co" -ForegroundColor Yellow
Write-Host "🌐 CORS: https://pdl-ruddy.vercel.app" -ForegroundColor Yellow
Write-Host "🚀 You can now start the backend with: npm run dev-postgres" -ForegroundColor Cyan
Write-Host "" -ForegroundColor White
Write-Host "📋 Next Steps:" -ForegroundColor Magenta
Write-Host "1. Test database connection: node simple-test.js" -ForegroundColor White
Write-Host "2. Start backend: npm run dev-postgres" -ForegroundColor White
Write-Host "3. Deploy to hosting platform (Render, Railway, etc.)" -ForegroundColor White
Write-Host "4. Update Vercel with your backend URL" -ForegroundColor White
