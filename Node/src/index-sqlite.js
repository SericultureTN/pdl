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
import databaseViewerRouter from "./database-viewer.js";

const app = express();

const PORT = Number(process.env.PORT || 4000);
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:5173,http://127.0.0.1:60039";

// Middleware
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);
      
      // Allow all localhost and 127.0.0.1 origins for local development
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        return callback(null, true);
      }
      
      // Check specific allowed origins
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

      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        status TEXT DEFAULT 'active',
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

    // Create sample users if not exist
    const sampleUsers = [
      { name: 'John User', email: 'user@example.com', password: 'User123!', role: 'user' },
      { name: 'Jane Manager', email: 'manager@example.com', password: 'Manager123!', role: 'manager' },
      { name: 'Bob Viewer', email: 'viewer@example.com', password: 'Viewer123!', role: 'viewer' }
    ];

    for (const user of sampleUsers) {
      const existingUser = await db.get('SELECT id FROM users WHERE email = ?', [user.email]);
      if (!existingUser) {
        const passwordHash = await bcrypt.hash(user.password, 10);
        await db.run(
          'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
          [user.name, user.email, passwordHash, user.role]
        );
        console.log(`✅ Sample user created: ${user.email} / ${user.password} (${user.role})`);
      }
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
    
    let user = null;
    
    if (decoded.type === 'admin') {
      user = await db.get('SELECT id, email FROM admins WHERE id = ?', [decoded.id]);
      if (user) {
        user.type = 'admin';
      }
    } else if (decoded.type === 'user') {
      user = await db.get('SELECT id, email, name, role FROM users WHERE id = ? AND status = "active"', [decoded.id]);
      if (user) {
        user.type = 'user';
      }
    }
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    req.user = user;
    req.admin = user.type === 'admin' ? user : null; // Keep for backward compatibility
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

// Database viewer (no auth required for local development)
app.use("/api/database", databaseViewerRouter);

// Login endpoint
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    let user = null;
    let userType = null;

    // Try admin login first
    const admin = await db.get('SELECT *, "admin" as type FROM admins WHERE email = ?', [email]);
    if (admin && await bcrypt.compare(password, admin.password_hash)) {
      user = admin;
      userType = 'admin';
    }

    // If not admin, try user login
    if (!user) {
      const regularUser = await db.get('SELECT *, "user" as type FROM users WHERE email = ? AND status = "active"', [email]);
      if (regularUser && await bcrypt.compare(password, regularUser.password_hash)) {
        user = regularUser;
        userType = 'user';
      }
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        type: userType,
        role: user.role || null
      },
      process.env.JWT_SECRET || 'local_dev_secret_change_me_in_production',
      { expiresIn: '24h' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: false, // Set to true in production with HTTPS
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    const responseUser = {
      id: user.id,
      email: user.email,
      type: userType
    };

    if (userType === 'user') {
      responseUser.name = user.name;
      responseUser.role = user.role;
    }

    return res.json({
      ok: true,
      user: responseUser,
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
  const userData = {
    id: req.user.id,
    email: req.user.email,
    type: req.user.type
  };

  if (req.user.type === 'user') {
    userData.name = req.user.name;
    userData.role = req.user.role;
  }

  return res.json({ 
    ok: true, 
    user: userData
  });
});

// Admin dashboard
app.get("/api/admin/dashboard", requireAuth, async (req, res) => {
  try {
    const [sericulturistCount, activeSericulturistCount, schemeCount, userCount, activeUserCount, adminCount] = await Promise.all([
      db.get('SELECT COUNT(*) as count FROM sericulturists'),
      db.get('SELECT COUNT(*) as count FROM sericulturists WHERE status = "active"'),
      db.get('SELECT COUNT(*) as count FROM pdl_schemes'),
      db.get('SELECT COUNT(*) as count FROM users'),
      db.get('SELECT COUNT(*) as count FROM users WHERE status = "active"'),
      db.get('SELECT COUNT(*) as count FROM admins')
    ]);

    return res.json({
      ok: true,
      message: `Welcome, ${req.user.email}!`,
      statistics: {
        totalSericulturists: sericulturistCount.count,
        activeSericulturists: activeSericulturistCount.count,
        totalSchemes: schemeCount.count,
        totalUsers: userCount.count,
        activeUsers: activeUserCount.count,
        totalAdmins: adminCount.count,
        inactiveUsers: userCount.count - activeUserCount.count,
        inactiveSericulturists: sericulturistCount.count - activeSericulturistCount.count
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

// Get sericulturist by ID
app.get("/api/sericulturists/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const sericulturist = await db.get('SELECT * FROM sericulturists WHERE id = ?', [id]);
    
    if (!sericulturist) {
      return res.status(404).json({ error: 'Sericulturist not found' });
    }

    return res.json({
      ok: true,
      sericulturist
    });
  } catch (error) {
    console.error('Get sericulturist error:', error);
    return res.status(500).json({ error: 'Failed to fetch sericulturist' });
  }
});

// Update sericulturist
app.put("/api/sericulturists/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, address, status } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const existingSericulturist = await db.get('SELECT id FROM sericulturists WHERE id = ?', [id]);
    if (!existingSericulturist) {
      return res.status(404).json({ error: 'Sericulturist not found' });
    }

    await db.run(
      'UPDATE sericulturists SET name = ?, email = ?, phone = ?, address = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [name, email, phone, address, status, id]
    );

    return res.json({
      ok: true,
      sericulturist: {
        id: parseInt(id),
        name,
        email,
        phone,
        address,
        status
      }
    });
  } catch (error) {
    console.error('Update sericulturist error:', error);
    return res.status(500).json({ error: 'Failed to update sericulturist' });
  }
});

// Delete sericulturist
app.delete("/api/sericulturists/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const existingSericulturist = await db.get('SELECT id FROM sericulturists WHERE id = ?', [id]);
    if (!existingSericulturist) {
      return res.status(404).json({ error: 'Sericulturist not found' });
    }

    await db.run('DELETE FROM sericulturists WHERE id = ?', [id]);

    return res.json({
      ok: true,
      message: 'Sericulturist deleted successfully'
    });
  } catch (error) {
    console.error('Delete sericulturist error:', error);
    return res.status(500).json({ error: 'Failed to delete sericulturist' });
  }
});

// Bulk update status
app.put("/api/sericulturists/bulk/status", requireAuth, async (req, res) => {
  try {
    const { ids, status } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'IDs array is required' });
    }

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const placeholders = ids.map(() => '?').join(',');
    await db.run(
      `UPDATE sericulturists SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id IN (${placeholders})`,
      [status, ...ids]
    );

    return res.json({
      ok: true,
      message: `${ids.length} sericulturists updated successfully`
    });
  } catch (error) {
    console.error('Bulk update status error:', error);
    return res.status(500).json({ error: 'Failed to bulk update status' });
  }
});

// Bulk delete
app.delete("/api/sericulturists/bulk", requireAuth, async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'IDs array is required' });
    }

    const placeholders = ids.map(() => '?').join(',');
    const result = await db.run(
      `DELETE FROM sericulturists WHERE id IN (${placeholders})`,
      [...ids]
    );

    return res.json({
      ok: true,
      message: `${result.changes} sericulturists deleted successfully`
    });
  } catch (error) {
    console.error('Bulk delete error:', error);
    return res.status(500).json({ error: 'Failed to bulk delete sericulturists' });
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

// User Management APIs

// Get all users (admin only)
app.get("/api/users", requireAuth, async (req, res) => {
  try {
    // Only admin can access all users
    if (req.user.type !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const [users, total] = await Promise.all([
      db.all('SELECT id, name, email, role, status, created_at, updated_at FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?', [limit, offset]),
      db.get('SELECT COUNT(*) as count FROM users')
    ]);

    return res.json({
      ok: true,
      users,
      pagination: {
        page,
        limit,
        total: total.count,
        totalPages: Math.ceil(total.count / limit)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    return res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Create user (admin only)
app.post("/api/users", requireAuth, async (req, res) => {
  try {
    // Only admin can create users
    if (req.user.type !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { name, email, password, role = 'user', status = 'active' } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await db.run(
      'INSERT INTO users (name, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?)',
      [name, email, passwordHash, role, status]
    );

    return res.json({
      ok: true,
      user: {
        id: result.lastID,
        name,
        email,
        role,
        status
      }
    });
  } catch (error) {
    console.error('Create user error:', error);
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(400).json({ error: 'Email already exists' });
    }
    return res.status(500).json({ error: 'Failed to create user' });
  }
});

// Update user (admin only or own profile)
app.put("/api/users/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, status, currentPassword, newPassword } = req.body;
    
    // Check permissions: admin can update any user, users can only update themselves
    if (req.user.type !== 'admin' && req.user.id !== parseInt(id)) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    const existingUser = await db.get('SELECT id FROM users WHERE id = ?', [id]);
    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    let updateFields = [];
    let updateValues = [];

    if (name) {
      updateFields.push('name = ?');
      updateValues.push(name);
    }

    if (email) {
      updateFields.push('email = ?');
      updateValues.push(email);
    }

    // Only admin can change role and status
    if (req.user.type === 'admin') {
      if (role) {
        updateFields.push('role = ?');
        updateValues.push(role);
      }
      if (status) {
        updateFields.push('status = ?');
        updateValues.push(status);
      }
    }

    // Password change
    if (newPassword) {
      if (req.user.type === 'admin' || currentPassword) {
        // For admin, no current password needed. For user, current password required.
        if (req.user.type !== 'admin') {
          const currentUser = await db.get('SELECT password_hash FROM users WHERE id = ?', [id]);
          const passwordMatch = await bcrypt.compare(currentPassword, currentUser.password_hash);
          if (!passwordMatch) {
            return res.status(400).json({ error: 'Current password is incorrect' });
          }
        }
        
        const passwordHash = await bcrypt.hash(newPassword, 10);
        updateFields.push('password_hash = ?');
        updateValues.push(passwordHash);
      } else {
        return res.status(400).json({ error: 'Current password is required to change password' });
      }
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateValues.push(id);

    await db.run(
      `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    // Return updated user data
    const updatedUser = await db.get('SELECT id, name, email, role, status FROM users WHERE id = ?', [id]);

    return res.json({
      ok: true,
      user: updatedUser
    });
  } catch (error) {
    console.error('Update user error:', error);
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(400).json({ error: 'Email already exists' });
    }
    return res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete user (admin only)
app.delete("/api/users/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Only admin can delete users
    if (req.user.type !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const existingUser = await db.get('SELECT id FROM users WHERE id = ?', [id]);
    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    await db.run('DELETE FROM users WHERE id = ?', [id]);

    return res.json({
      ok: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    return res.status(500).json({ error: 'Failed to delete user' });
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
