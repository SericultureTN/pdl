# Setup local database options for PDL development

Write-Host "Setting up local database options for PDL development..." -ForegroundColor Green

Write-Host "" -ForegroundColor White
Write-Host "Choose your database option:" -ForegroundColor Cyan
Write-Host "1. PostgreSQL (recommended for production-like setup)" -ForegroundColor Yellow
Write-Host "2. SQLite (simpler, no installation needed)" -ForegroundColor Yellow
Write-Host "3. Supabase (cloud database)" -ForegroundColor Yellow

$choice = Read-Host "Enter your choice (1-3)"

if ($choice -eq "1") {
    Write-Host "Setting up PostgreSQL..." -ForegroundColor Green
    
    $postgresEnv = @"
# Server Configuration
PORT=4000

# PostgreSQL Database Connection (Local)
DB_USER=postgres
DB_HOST=localhost
DB_DATABASE=pdl_db
DB_PASSWORD=postgres
DB_PORT=5432
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/pdl_db

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
    
    $postgresEnv | Out-File -FilePath ".env" -Encoding UTF8
    
    Write-Host "PostgreSQL configuration created!" -ForegroundColor Green
    Write-Host "Make sure PostgreSQL is installed and running" -ForegroundColor Yellow
    Write-Host "Create database: CREATE DATABASE pdl_db;" -ForegroundColor Yellow
    Write-Host "Default user: postgres / postgres" -ForegroundColor Yellow
    
} elseif ($choice -eq "2") {
    Write-Host "Setting up SQLite..." -ForegroundColor Green
    
    $sqliteEnv = @"
# Server Configuration
PORT=4000

# SQLite Database Connection
DATABASE_PATH=./database.sqlite

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
    
    $sqliteEnv | Out-File -FilePath ".env" -Encoding UTF8
    
    Write-Host "SQLite configuration created!" -ForegroundColor Green
    Write-Host "No installation required - uses local file" -ForegroundColor Yellow
    Write-Host "Database file: database.sqlite" -ForegroundColor Yellow
    
} elseif ($choice -eq "3") {
    Write-Host "Setting up Supabase..." -ForegroundColor Green
    
    $supabaseEnv = @"
# Server Configuration
PORT=4000

# Supabase Database Connection
DATABASE_URL=postgresql://postgres:Tnseripdl%40123@db.rmtyykiyeehnyvcaajap.supabase.co:5432/postgres

# JWT Configuration
JWT_SECRET=your-secure-random-string-here

# CORS Configuration
CORS_ORIGIN=http://localhost:5173,https://pdl-ruddy.vercel.app

# Environment
NODE_ENV=development

# Admin Credentials
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=Admin123!
"@
    
    $supabaseEnv | Out-File -FilePath ".env" -Encoding UTF8
    
    Write-Host "Supabase configuration created!" -ForegroundColor Green
    Write-Host "Make sure your Supabase project is active" -ForegroundColor Yellow
    
} else {
    Write-Host "Invalid choice. Please run again and select 1-3." -ForegroundColor Red
    exit
}

Write-Host "" -ForegroundColor White
Write-Host "Next Steps:" -ForegroundColor Magenta
Write-Host "1. Install dependencies: npm install" -ForegroundColor White
Write-Host "2. Start the server: npm run dev-postgres" -ForegroundColor White
Write-Host "3. Test the connection: curl http://localhost:4000/health" -ForegroundColor White
Write-Host "4. Start frontend: cd ../Client && npm run dev" -ForegroundColor White
