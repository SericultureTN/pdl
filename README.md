# 🌾 PDL Admin Portal

A comprehensive admin dashboard for managing sericulturists and PDL (Post-Development Loan) schemes.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Git

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/SericultureTN/pdl.git
   cd pdl
   ```

2. **Backend Setup**
   ```bash
   cd Node
   npm install
   npm run dev-sqlite
   ```
   - Backend runs on `http://localhost:4000`
   - Uses SQLite database for local development
   - Default admin: `admin@example.com` / `Admin123!`

3. **Frontend Setup**
   ```bash
   cd Client
   npm install
   npm run dev
   ```
   - Frontend runs on `http://localhost:5173`
   - Automatically connects to local backend

4. **Access Application**
   - Open `http://localhost:5173` in browser
   - Login with admin credentials
   - Start managing users and data

## 📁 Project Structure

```
pdl/
├── Client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/        # Page components
│   │   └── services/     # API services
│   └── package.json
├── Node/                  # Express backend
│   ├── src/
│   │   ├── index-sqlite.js    # Main server file
│   │   └── api/         # API routes
│   └── package.json
└── README.md
```

## 🔧 Features

### User Management
- ✅ Create, Read, Update, Delete users
- ✅ Search and filter users
- ✅ Bulk operations
- ✅ User status management

### Dashboard
- ✅ Real-time statistics
- ✅ Interactive charts
- ✅ Mobile responsive design
- ✅ Authentication system

### Reports
- ✅ MIS (Management Information System)
- ✅ PLS (Progress Loan Scheme)
- ✅ PRC (Progress Report Card)
- ✅ POC (Progress of Cultivation)

## 🗄️ Database

### Local Development (SQLite)
- Database file: `Node/database.sqlite`
- Auto-initialization on first run
- Sample data included

### Production (PostgreSQL)
- Supabase integration ready
- Environment variables configuration
- Connection pooling

## 🚀 Deployment

### Vercel (Recommended)
```bash
# Deploy frontend
cd Client
npm run build
vercel --prod

# Deploy backend
cd Node
vercel --prod
```

### Environment Variables
```bash
# Backend
DATABASE_URL=postgresql://user:password@host:5432/database
JWT_SECRET=your-secret-key
CORS_ORIGIN=https://yourdomain.com
NODE_ENV=production

# Frontend
VITE_API_URL=https://your-backend-url.com/api
```

## 📱 API Endpoints

### Authentication
- `POST /api/login` - User login
- `POST /api/admin/logout` - User logout
- `GET /api/me` - Get current user

### Users
- `GET /api/sericulturists` - Get all users
- `POST /api/sericulturists` - Create user
- `PUT /api/sericulturists/:id` - Update user
- `DELETE /api/sericulturists/:id` - Delete user

### Dashboard
- `GET /api/admin/dashboard` - Dashboard data
- `GET /api/sericulturists/statistics` - User statistics

## 🛠️ Development Scripts

### Backend
```bash
npm run dev-sqlite    # Start with SQLite
npm run dev-postgres  # Start with PostgreSQL
npm run start-sqlite  # Production with SQLite
npm run start-postgres # Production with PostgreSQL
```

### Frontend
```bash
npm run dev           # Development server
npm run build         # Build for production
npm run preview       # Preview production build
```

## 🔐 Default Credentials

```
Email: admin@example.com
Password: Admin123!
```

## 📞 Support

For issues and support:
- Check the [Issues](https://github.com/SericultureTN/pdl/issues) page
- Review the [Wiki](https://github.com/SericultureTN/pdl/wiki) for documentation
- Contact the development team

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**🌾 PDL Admin Portal** - Empowering sericulturists with modern management tools.