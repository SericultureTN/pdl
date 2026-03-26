# 🚀 Vercel Deployment Guide

## 📋 Prerequisites

1. **Vercel Account**: Sign up at https://vercel.com
2. **GitHub Account**: Connect your GitHub account to Vercel
3. **Repository**: Push your code to GitHub

## 🛠️ Deployment Steps

### 1. Push Code to GitHub

```bash
# Add all changes
git add .

# Commit changes
git commit -m "feat: Add Vercel deployment configuration"

# Push to GitHub
git push origin main
```

### 2. Deploy to Vercel

#### Option A: Via Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

#### Option B: Via Vercel Dashboard
1. Go to https://vercel.com/dashboard
2. Click "Add New..." → "Project"
3. Import your GitHub repository  
4. Configure settings (see below)
5. Click "Deploy"

### 3. Vercel Configuration

#### Build Settings:
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `Client/dist`
- **Install Command**: `npm install`

#### Environment Variables:
```
VITE_API_URL=https://your-backend-url.com
NODE_ENV=production
```

## 🔧 Backend Deployment Options

### Option 1: Vercel Serverless Functions
Create `api/` folder in your project for serverless functions

### Option 2: External Backend Service
Deploy your Node.js backend to:
- **Heroku**: https://heroku.com
- **Render**: https://render.com
- **Railway**: https://railway.app
- **DigitalOcean**: https://digitalocean.com

### Option 3: Vercel Edge Functions
For better performance, use edge functions

## 📱 Configuration Files Created

### `Client/vercel.json`
```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite"
}
```

### `Client/.env.example`
Environment variables template

## 🌐 Access Your App

After deployment:
1. **Frontend URL**: `https://your-app-name.vercel.app`
2. **Backend URL**: Your configured backend service

## 🔍 Troubleshooting

### Common Issues:
1. **Build Failures**: Check `package.json` scripts
2. **API Errors**: Verify backend URL and CORS settings
3. **Environment Variables**: Ensure they're set in Vercel dashboard

### Debug Commands:
```bash
# Local build test
cd Client && npm run build

# Deploy preview
vercel
```

## 📊 Performance Optimization

### Build Optimizations:
- Code splitting configured
- Asset optimization
- Gzip compression

### Caching:
- Static assets cached
- API calls optimized
- CDN distribution

## 🔄 Continuous Deployment

Vercel automatically:
- Deploys on push to main branch
- Creates preview URLs for PRs
- Rolls back on errors

## 📞 Support

- **Vercel Docs**: https://vercel.com/docs
- **Vercel Status**: https://vercel-status.com
- **GitHub Issues**: Project repository issues
