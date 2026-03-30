# 🗄️ Supabase Database Setup Guide

## 📋 Quick Setup Steps

### 1. 🚀 Run the Setup Script

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard
2. **Select your project**
3. **Open SQL Editor**: Click "SQL Editor" in left sidebar
4. **Click "New query"**
5. **Copy and paste** the entire contents of `Node/supabase-setup.sql`
6. **Click "Run"** to execute all commands

### 2. 🔧 Update Environment Variables

1. **Copy the template**:
   ```bash
   cp Node/env.example Node/.env
   ```

2. **Edit the .env file** and replace `[YOUR-PASSWORD]` with your actual Supabase password:
   ```bash
   DATABASE_URL=postgresql://postgres:your_actual_password@db.rmtyykiyeehnyvcaajap.supabase.co:5432/postgres
   ```

### 3. 🚀 Start the Backend

```bash
cd Node
npm run dev-postgres
```

### 4. ✅ Test the Connection

- **Backend should start** on port 4000
- **Check console** for database connection messages
- **Test login** with: `admin@example.com` / `Admin123!`

## 📊 Database Structure Created

### Tables Created:
- ✅ **admins** - Admin user accounts
- ✅ **sericulturists** - Sericulturist profiles
- ✅ **pdl_schemes** - Government schemes
- ✅ **applications** - Scheme applications
- ✅ **reports** - Generated reports

### Default Admin User:
- **Email**: `admin@example.com`
- **Password**: `Admin123!`
- **Role**: `admin`

### Sample Schemes Added:
- Silk Worm Rearing Subsidy (₹25,000)
- Mulberry Plantation Support (₹15,000)
- Technical Training Program (Free)

## 🔍 Verification Steps

### 1. Check Tables in Supabase:
- Go to "Table Editor" in Supabase
- You should see all tables created
- Verify admin user exists in `admins` table

### 2. Test API Endpoints:
```bash
# Health check
curl http://localhost:4000/health

# Login test
curl -X POST http://localhost:4000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Admin123!"}'
```

### 3. Frontend Connection:
- Start frontend: `cd Client && npm run dev`
- Visit: http://localhost:5173
- Login with admin credentials

## 🎯 Next Steps

1. **✅ Database setup complete**
2. **✅ Backend running**
3. **✅ Frontend connected**
4. **🚀 Deploy to Vercel**

## 📱 Troubleshooting

### Common Issues:
- **Connection failed**: Check password in .env file
- **Login failed**: Verify admin user exists in database
- **CORS errors**: Ensure CORS_ORIGIN matches frontend URL

### Solutions:
- **Reset password**: Update in Supabase dashboard
- **Check logs**: Look at backend console output
- **Verify URL**: Ensure DATABASE_URL is correct

## 🌟 Ready for Production!

Once setup is complete:
- ✅ **Database**: Configured and ready
- ✅ **Backend**: Connected to Supabase
- ✅ **Frontend**: Ready for deployment
- ✅ **Admin**: Default user created

Your PDL Admin Portal is now fully configured with Supabase! 🎉
