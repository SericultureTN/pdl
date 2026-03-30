# 🚀 Backend Deployment Guide

## 📋 Problem Analysis

**❌ Current Issue**: 404 NOT_FOUND errors
**🔍 Root Cause**: Frontend is trying to connect to `https://pdltn.vercel.app/api` (frontend URL) instead of backend URL
**✅ Solution**: Deploy backend separately and update API URL

## 🔧 Backend Deployment Options

### 1. **Render (Recommended)**
```bash
# 1. Create account at https://render.com
# 2. Connect your GitHub repository
# 3. Select "New Web Service"
# 4. Choose repository: SericultureTN/pdl
# 5. Root directory: Node
# 6. Runtime: Node
# 7. Build Command: npm install
# 8. Start Command: npm run dev-postgres
# 9. Environment Variables:
#    PORT=4000
#    DATABASE_URL=postgresql://postgres:Tnseripdl%40123@db.rmtyykiyeehnyvcaajap.supabase.co:5432/postgres
#    JWT_SECRET=your_jwt_secret_here
#    CORS_ORIGIN=https://pdl-ruddy.vercel.app
```

### 2. **Railway**
```bash
# 1. Create account at https://railway.app
# 2. Connect GitHub repository
# 3. Deploy Node service
# 4. Set environment variables
# 5. Railway will provide the deployment URL
```

### 3. **Heroku**
```bash
# 1. Install Heroku CLI
# 2. Create Heroku app
heroku create your-pdl-backend

# 3. Set environment variables
heroku config:set PORT=4000
heroku config:set DATABASE_URL=postgresql://postgres:Tnseripdl%40123@db.rmtyykiyeehnyvcaajap.supabase.co:5432/postgres
heroku config:set JWT_SECRET=your_jwt_secret_here
heroku config:set CORS_ORIGIN=https://pdl-ruddy.vercel.app

# 4. Deploy
git subtree push --prefix Node heroku main
```

### 4. **DigitalOcean App Platform**
```bash
# 1. Create account at https://cloud.digitalocean.com
# 2. Create new app
# 3. Connect GitHub repository
# 4. Set build and run commands
# 5. Configure environment variables
```

## 🔧 Environment Variables Setup

### **Required Environment Variables:**
```bash
PORT=4000
DATABASE_URL=postgresql://postgres:Tnseripdl%40123@db.rmtyykiyeehnyvcaajap.supabase.co:5432/postgres
JWT_SECRET=your_long_random_jwt_secret_here
CORS_ORIGIN=https://pdl-ruddy.vercel.app
NODE_ENV=production
```

### **Optional Environment Variables:**
```bash
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=Admin123!
```

## 🚀 Deployment Steps

### **Step 1: Choose Hosting Platform**
Select one of the options above (Render recommended)

### **Step 2: Deploy Backend**
1. Connect your GitHub repository
2. Configure build settings
3. Set environment variables
4. Deploy the application

### **Step 3: Test Backend**
```bash
# Test health endpoint
curl https://your-backend-url.com/health

# Test login endpoint
curl -X POST https://your-backend-url.com/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Admin123!"}'
```

### **Step 4: Update Frontend**
1. Go to Vercel dashboard
2. Set environment variable: `VITE_API_URL=https://your-backend-url.com/api`
3. Redeploy frontend

### **Step 5: Test Full Application**
1. Visit: https://pdl-ruddy.vercel.app
2. Login with: admin@example.com / Admin123!
3. Verify dashboard loads with data

## 🔍 Troubleshooting

### **Common Issues:**

**1. CORS Errors:**
```bash
# Make sure CORS_ORIGIN includes your frontend URL
CORS_ORIGIN=https://pdl-ruddy.vercel.app
```

**2. Database Connection:**
```bash
# Verify DATABASE_URL is correct
# Test with: node Node/simple-test.js
```

**3. Port Issues:**
```bash
# Make sure PORT is set to 4000
PORT=4000
```

**4. Build Failures:**
```bash
# Check package.json scripts
"scripts": {
  "dev-postgres": "node --watch src/index-postgres.js"
}
```

## 📱 Testing Checklist

### **Backend Tests:**
- [ ] Health endpoint responds: `GET /health`
- [ ] Login works: `POST /api/login`
- [ ] Dashboard data loads: `GET /api/admin/dashboard`
- [ ] CORS headers are correct

### **Frontend Tests:**
- [ ] Login screen appears
- [ ] Authentication works
- [ ] Dashboard loads with data
- [ ] Mobile navigation works

### **Integration Tests:**
- [ ] Frontend connects to backend
- [ ] User authentication flow works
- [ ] Data is stored and retrieved
- [ ] Error handling works properly

## 🎯 Quick Start

### **For Immediate Testing:**
1. **Deploy to Render** (fastest option)
2. **Get your backend URL** (e.g., `https://your-app.onrender.com`)
3. **Update Vercel environment**: `VITE_API_URL=https://your-app.onrender.com/api`
4. **Test the application**

### **For Production:**
1. **Choose production hosting** (Render, Railway, Heroku, etc.)
2. **Configure all environment variables**
3. **Set up monitoring and logging**
4. **Configure custom domain** (optional)

## 📞 Support

### **If you need help:**
1. **Check deployment logs** for errors
2. **Verify environment variables** are set correctly
3. **Test API endpoints** individually
4. **Check CORS configuration**

### **Useful Commands:**
```bash
# Test backend health
curl https://your-backend-url.com/health

# Test API connection
curl -X POST https://your-backend-url.com/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Admin123!"}'

# Check CORS headers
curl -I https://your-backend-url.com/api/login
```

---

**🎉 Once your backend is deployed and the API URL is updated, the 404 errors will be resolved and your application will work properly!**
