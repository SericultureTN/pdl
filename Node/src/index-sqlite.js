import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import sqlite3 from "sqlite3";
import { open } from "sqlite";

const app = express();

const PORT = Number(process.env.PORT || 4000);
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:5173";

// Middleware
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      
      const allowedOrigins = CORS_ORIGIN.split(',');
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true
  })
);

// SQLite Database Setup
let db;

async function initializeDatabase() {
  try {
    db = await open({
      filename: './database.sqlite',
      driver: sqlite3.Database
    });

    // Create tables
    await db.exec(`
      CREATE TABLE IF NOT EXISTS admins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS sericulturists (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE,
        phone TEXT,
        address TEXT,
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS pdl_schemes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        amount DECIMAL(10,2),
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create default admin if not exists
    const existingAdmin = await db.get('SELECT id FROM admins WHERE email = ?', ['admin@example.com']);
    if (!existingAdmin) {
      const passwordHash = await bcrypt.hash('Admin123!', 10);
      await db.run(
        'INSERT INTO admins (email, password_hash) VALUES (?, ?)',
        ['admin@example.com', passwordHash]
      );
      console.log('✅ Default admin created: admin@example.com / Admin123!');
    }

    // Create sample sericulturist
    const existingSericulturist = await db.get('SELECT id FROM sericulturists LIMIT 1');
    if (!existingSericulturist) {
      await db.run(`
        INSERT INTO sericulturists (name, email, phone, address, status) 
        VALUES (?, ?, ?, ?, ?)
      `, ['John Doe', 'john@example.com', '1234567890', '123 Main St, City', 'active']);
      console.log('✅ Sample sericulturist created');
    }

    console.log('✅ SQLite database initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    return false;
  }
}

// Authentication middleware
const requireAuth = async (req, res, next) => {
  const token = req.cookies.token || req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'local_dev_secret_change_me_in_production');
    const admin = await db.get('SELECT id, email FROM admins WHERE id = ?', [decoded.id]);
    
    if (!admin) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    req.admin = admin;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Health check
app.get("/health", async (_req, res) => {
  const dbConnected = db ? true : false;
  return res.json({ 
    ok: true, 
    database: dbConnected ? 'connected' : 'disconnected',
    type: 'SQLite',
    timestamp: new Date().toISOString()
  });
});

// Login endpoint
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const admin = await db.get('SELECT * FROM admins WHERE email = ?', [email]);
    
    if (!admin || !(await bcrypt.compare(password, admin.password_hash))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: admin.id, email: admin.email },
      process.env.JWT_SECRET || 'local_dev_secret_change_me_in_production',
      { expiresIn: '24h' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: false, // Set to true in production with HTTPS
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    return res.json({
      ok: true,
      user: {
        id: admin.id,
        email: admin.email
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Login failed' });
  }
});

// Logout endpoint
app.post("/api/admin/logout", (req, res) => {
  res.clearCookie("token", { path: "/" });
  return res.json({ ok: true });
});

// Get current user info
app.get("/api/me", requireAuth, (req, res) => {
  return res.json({ 
    ok: true, 
    user: {
      id: req.admin.id,
      email: req.admin.email
    }
  });
});

// Admin dashboard
app.get("/api/admin/dashboard", requireAuth, async (req, res) => {
  try {
    const [sericulturistCount, activeSericulturistCount, schemeCount] = await Promise.all([
      db.get('SELECT COUNT(*) as count FROM sericulturists'),
      db.get('SELECT COUNT(*) as count FROM sericulturists WHERE status = "active"'),
      db.get('SELECT COUNT(*) as count FROM pdl_schemes')
    ]);

    return res.json({
      ok: true,
      message: `Welcome, ${req.admin.email}!`,
      statistics: {
        totalSericulturists: sericulturistCount.count,
        activeSericulturists: activeSericulturistCount.count,
        totalSchemes: schemeCount.count,
        activeUsers: 1
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Get all sericulturists
app.get("/api/sericulturists", requireAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const [sericulturists, total] = await Promise.all([
      db.all('SELECT * FROM sericulturists ORDER BY created_at DESC LIMIT ? OFFSET ?', [limit, offset]),
      db.get('SELECT COUNT(*) as count FROM sericulturists')
    ]);

    return res.json({
      ok: true,
      sericulturists,
      pagination: {
        page,
        limit,
        total: total.count,
        totalPages: Math.ceil(total.count / limit)
      }
    });
  } catch (error) {
    console.error('Get sericulturists error:', error);
    return res.status(500).json({ error: 'Failed to fetch sericulturists' });
  }
});

// Create sericulturist
app.post("/api/sericulturists", requireAuth, async (req, res) => {
  try {
    const { name, email, phone, address, status = 'active' } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const result = await db.run(
      'INSERT INTO sericulturists (name, email, phone, address, status) VALUES (?, ?, ?, ?, ?)',
      [name, email, phone, address, status]
    );

    return res.json({
      ok: true,
      sericulturist: {
        id: result.lastID,
        name,
        email,
        phone,
        address,
        status
      }
    });
  } catch (error) {
    console.error('Create sericulturist error:', error);
    return res.status(500).json({ error: 'Failed to create sericulturist' });
  }
});

// Get statistics
app.get("/api/sericulturists/statistics", requireAuth, async (req, res) => {
  try {
    const [total, active, inactive] = await Promise.all([
      db.get('SELECT COUNT(*) as count FROM sericulturists'),
      db.get('SELECT COUNT(*) as count FROM sericulturists WHERE status = "active"'),
      db.get('SELECT COUNT(*) as count FROM sericulturists WHERE status = "inactive"')
    ]);

    return res.json({
      ok: true,
      statistics: {
        totalSericulturists: total.count,
        activeSericulturists: active.count,
        inactiveSericulturists: inactive.count,
        newThisMonth: 0 // TODO: Implement monthly calculation
      }
    });
  } catch (error) {
    console.error('Get statistics error:', error);
    return res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Start server
async function startServer() {
  try {
    const dbInitialized = await initializeDatabase();
    if (!dbInitialized) {
      console.error('❌ Failed to initialize database');
      return;
    }

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🔑 Login: http://localhost:${PORT}/api/login`);
      console.log(`👤 Default admin: admin@example.com / Admin123!`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
  }
}

startServer();

export default app;
