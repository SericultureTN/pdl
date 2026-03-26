# 🚀 PDL Vercel Deployment Script (PowerShell)

Write-Host "🚀 Starting PDL Vercel Deployment..." -ForegroundColor Green

# Check if Vercel CLI is installed
try {
    $vercelVersion = vercel --version
    Write-Host "✅ Vercel CLI already installed: $vercelVersion" -ForegroundColor Green
} catch {
    Write-Host "📦 Installing Vercel CLI..." -ForegroundColor Yellow
    npm install -g vercel
}

# Navigate to client directory
Set-Location Client

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm install

# Build the project
Write-Host "🔨 Building the project..." -ForegroundColor Yellow
npm run build

# Check if build was successful
if (Test-Path "dist") {
    Write-Host "✅ Build successful!" -ForegroundColor Green
} else {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

# Deploy to Vercel
Write-Host "🚀 Deploying to Vercel..." -ForegroundColor Yellow
vercel --prod

Write-Host "🎉 Deployment completed!" -ForegroundColor Green
Write-Host "📱 Your app should be live at: https://your-app-name.vercel.app" -ForegroundColor Cyan
