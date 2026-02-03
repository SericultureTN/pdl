# PostgreSQL Integration Setup Guide

## 🚀 Quick Setup

### 1. Install PostgreSQL
- **Windows**: Download from [postgresql.org](https://www.postgresql.org/download/windows/)
- **Mac**: `brew install postgresql`
- **Linux**: `sudo apt-get install postgresql postgresql-contrib`

### 2. Create Database
```sql
-- Open pgAdmin or psql and run:
CREATE DATABASE pdl_db;
CREATE USER pdl_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE pdl_db TO pdl_user;
```

### 3. Update Environment Variables
Edit `Node/.env`:
```env
# PostgreSQL Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=pdl_db
DB_USER=postgres  # or pdl_user if you created one
DB_PASSWORD=your_actual_password_here
```

### 4. Start PostgreSQL Server
- **Windows**: Start PostgreSQL service from Services
- **Mac**: `brew services start postgresql`
- **Linux**: `sudo systemctl start postgresql`

### 5. Run the Application
```bash
cd Node
npm run dev-postgres
```

## 📊 Database Schema

### Admins Table
```sql
CREATE TABLE admins (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### Sericulturists Table (Future Use)
```sql
CREATE TABLE sericulturists (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20),
    address TEXT,
    registration_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## 🔐 Authentication Features

- **JWT-based authentication** with secure cookies
- **Password hashing** using bcrypt (12 salt rounds)
- **Auto-created default admin** (if no admins exist)
- **Password change** functionality
- **Admin management** (list all admins, delete admin)

## 🛠️ Available API Endpoints

### Authentication
- `POST /api/admin/login` - Login admin
- `POST /api/admin/logout` - Logout admin
- `POST /api/admin/register` - Register new admin
- `GET /api/admin/me` - Get current admin profile

### Admin Management
- `GET /api/admin/profile` - Get admin details
- `PUT /api/admin/password` - Change password
- `GET /api/admin/admins` - List all admins (super admin)

### System
- `GET /health` - Health check (includes database status)

## 🧪 Testing

### Test Database Connection
```bash
curl http://localhost:4000/health
```

### Test Login
```bash
curl -X POST http://localhost:4000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Admin123!"}' \
  -c cookies.txt
```

### Test Protected Route
```bash
curl -X GET http://localhost:4000/api/admin/me \
  -b cookies.txt
```

## 🔧 Troubleshooting

### Common Issues

1. **Connection Failed**
   - Check PostgreSQL service is running
   - Verify database credentials in `.env`
   - Ensure database exists: `CREATE DATABASE pdl_db;`

2. **Permission Denied**
   - Check user has database privileges
   - Verify password in `.env` is correct

3. **Port Already in Use**
   - Change PORT in `.env` or stop conflicting service

### Database Migration (SQLite to PostgreSQL)
If you have existing SQLite data:
```bash
# Export SQLite data
sqlite3 data/app.db .dump > backup.sql

# Import to PostgreSQL (may need manual adjustments)
psql -d pdl_db -f backup.sql
```

## 🚀 Production Considerations

1. **Security**
   - Change default admin password immediately
   - Use strong JWT secret
   - Enable SSL for database connections

2. **Performance**
   - Add database indexes
   - Use connection pooling (already configured)
   - Monitor query performance

3. **Backup**
   - Regular database backups
   - Point-in-time recovery setup

## 📝 Environment Variables Reference

```env
# Server
PORT=4000
CORS_ORIGIN=http://localhost:5173

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=pdl_db
DB_USER=postgres
DB_PASSWORD=your_password

# Security
JWT_SECRET=your_long_random_secret_here

# Default Admin
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=Admin123!
```
