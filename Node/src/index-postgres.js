import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { testConnection, initializeDatabase, closePool, query } from './postgres.js';
import { sericulturistServices } from './sericulturist-services.js';
import { authServices, initializeDefaultAdmin } from './auth-postgres.js';

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
      // Allow requests with no origin (like mobile apps or curl requests)
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

// Health check
app.get("/health", async (_req, res) => {
  const dbConnected = await testConnection();
  return res.json({ 
    ok: true, 
    database: dbConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// Test endpoint for sericulturist login
app.post("/api/test-login", async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Test login for:', email);
    
    const sericulturistResult = await sericulturistServices.login(email, password);
    
    if (sericulturistResult.ok) {
      const token = jwt.sign(
        { 
          id: sericulturistResult.sericulturist.id, 
          email: sericulturistResult.sericulturist.email, 
          role: 'sericulturist',
          ad_office: sericulturistResult.sericulturist.ad_office,
          name: sericulturistResult.sericulturist.name
        },
        process.env.JWT_SECRET || "dev_secret_change_me",
        { expiresIn: "24h" }
      );

      res.cookie("token", token, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: 24 * 60 * 60 * 1000,
      });

      return res.json({
        ok: true,
        user: {
          id: sericulturistResult.sericulturist.id,
          email: sericulturistResult.sericulturist.email,
          role: 'sericulturist',
          name: sericulturistResult.sericulturist.name,
          ad_office: sericulturistResult.sericulturist.ad_office
        }
      });
    } else {
      return res.status(401).json({ error: sericulturistResult.error });
    }
  } catch (error) {
    console.error('Test login error:', error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Login endpoint
app.post("/api/login", async (req, res) => {
  console.log('=== LOGIN ENDPOINT CALLED ===');
  try {
    const { email, password } = req.body;
    console.log('Request body:', { email, password: '***' });

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // First try admin login (Super Admin)
    console.log('Trying admin login for:', email);
    const adminResult = await query(
      "SELECT * FROM admins WHERE email = $1",
      [email.trim().toLowerCase()]
    );

    if (adminResult.rows.length > 0) {
      console.log('Admin user found');
      const admin = adminResult.rows[0];
      const passwordMatch = await bcrypt.compare(password, admin.password_hash);

      if (!passwordMatch) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Check if admin has a specific role, default to super_admin
      const adminRole = admin.role || 'super_admin';

      const token = jwt.sign(
        { 
          id: admin.id, 
          email: admin.email, 
          role: adminRole, 
          name: admin.name || 'Super Administrator',
          ad_office: null // Super admin has access to all AD offices
        },
        process.env.JWT_SECRET || "dev_secret_change_me",
        { expiresIn: "24h" }
      );

      res.cookie("token", token, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: 24 * 60 * 60 * 1000,
      });

      return res.json({
        ok: true,
        user: {
          id: admin.id,
          email: admin.email,
          role: adminRole,
          name: admin.name || 'Super Administrator',
          ad_office: null
        }
      });
    }

    console.log('Admin not found, trying sericulturist login');

    // Try sericulturist login (Section Admin or User)
    try {
      const sericulturistResult = await sericulturistServices.login(email, password);

      if (sericulturistResult.ok) {
        const sericulturist = sericulturistResult.sericulturist;
        
        // Map sericulturist role to new role system
        // section_admin or user
        let userRole = 'user';
        if (sericulturist.role === 'section_admin' || sericulturist.role === 'admin') {
          userRole = 'section_admin';
        }

        const token = jwt.sign(
          { 
            id: sericulturist.id, 
            email: sericulturist.email, 
            role: userRole,
            ad_office: sericulturist.ad_office,
            name: sericulturist.name
          },
          process.env.JWT_SECRET || "dev_secret_change_me",
          { expiresIn: "24h" }
        );

        res.cookie("token", token, {
          httpOnly: true,
          secure: false,
          sameSite: "lax",
          maxAge: 24 * 60 * 60 * 1000,
        });

        return res.json({
          ok: true,
          user: {
            id: sericulturist.id,
            email: sericulturist.email,
            role: userRole,
            name: sericulturist.name,
            ad_office: sericulturist.ad_office
          }
        });
      }
    } catch (error) {
      console.error('Sericulturist login error:', error);
    }

    return res.status(401).json({ error: "Invalid credentials" });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/admin/logout", (req, res) => {
  res.clearCookie("token", { path: "/" });
  return res.json({ ok: true });
});

app.post("/api/admin/register", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    const result = await authServices.register(email, password);
    
    if (!result.ok) {
      return res.status(400).json({ error: result.error });
    }

    return res.status(201).json({ 
      ok: true, 
      admin: result.admin 
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Auth middleware
const requireAuth = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET || "dev_secret_change_me");
    
    // Add user info to request
    req.user = payload;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ error: "UNAUTHENTICATED" });
  }
};

// Role-based middleware helpers
const ROLES = {
  SUPER_ADMIN: 'super_admin',
  SECTION_ADMIN: 'section_admin',
  USER: 'user'
};

// Require Super Admin
const requireSuperAdmin = async (req, res, next) => {
  try {
    await requireAuth(req, res, () => {
      if (req.user.role !== ROLES.SUPER_ADMIN) {
        return res.status(403).json({ error: "Super Admin access required" });
      }
      next();
    });
  } catch (error) {
    return res.status(401).json({ error: "Authentication failed" });
  }
};

// Require Section Admin or higher
const requireSectionAdmin = async (req, res, next) => {
  try {
    await requireAuth(req, res, () => {
      if (req.user.role !== ROLES.SUPER_ADMIN && req.user.role !== ROLES.SECTION_ADMIN) {
        return res.status(403).json({ error: "Section Admin access required" });
      }
      next();
    });
  } catch (error) {
    return res.status(401).json({ error: "Authentication failed" });
  }
};

// Require any authenticated user
const requireAnyUser = async (req, res, next) => {
  try {
    await requireAuth(req, res, () => {
      // Any authenticated user can proceed
      next();
    });
  } catch (error) {
    return res.status(401).json({ error: "Authentication failed" });
  }
};

// Build AD Office filter for queries
const buildADOfficeFilter = (user, tableAlias = '') => {
  const prefix = tableAlias ? `${tableAlias}.` : '';
  
  // Super admin sees all data
  if (user.role === ROLES.SUPER_ADMIN) {
    return { whereClause: '', params: [] };
  }
  
  // Section admin and regular user only see their AD office data
  if (user.ad_office) {
    return { 
      whereClause: `WHERE ${prefix}ad_office = $1`, 
      params: [user.ad_office] 
    };
  }
  
  // Fallback - no data access
  return { whereClause: 'WHERE 1=0', params: [] };
};

// Get current user info
app.get("/api/me", requireAuth, (req, res) => {
  return res.json({ 
    ok: true, 
    user: {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role,
      name: req.user.name,
      ad_office: req.user.ad_office
    }
  });
});

// Admin specific routes
app.get("/api/admin/me", requireSuperAdmin, (req, res) => {
  return res.json({ ok: true, admin: req.user });
});

app.get("/api/admin/dashboard", requireSuperAdmin, async (req, res) => {
  try {
    const [statsResult] = await Promise.all([
      sericulturistServices.getStatistics()
    ]);

    return res.json({
      ok: true,
      message: `Welcome, ${req.user.email}!`,
      admin: req.user,
      serverTime: new Date().toISOString(),
      statistics: statsResult.ok ? statsResult.statistics : null
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Sericulturist Management Routes
// Get all sericulturists - filtered by AD office for non-super-admin users
app.get("/api/sericulturists", requireAnyUser, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const status = req.query.status || '';

    // Build AD office filter
    const { whereClause, params } = buildADOfficeFilter(req.user, 's');

    const result = await sericulturistServices.getAllWithFilter(page, limit, search, status, whereClause, params);
    
    if (!result.ok) {
      return res.status(500).json({ error: result.error });
    }

    return res.json({ ok: true, ...result });
  } catch (error) {
    console.error('Get sericulturists error:', error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/sericulturists/:id", requireAnyUser, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid sericulturist ID" });
    }

    const result = await sericulturistServices.getById(id);
    
    if (!result.ok) {
      return res.status(404).json({ error: result.error });
    }

    // Check if user has access to this sericulturist's AD office
    if (req.user.role !== ROLES.SUPER_ADMIN && 
        result.sericulturist.ad_office !== req.user.ad_office) {
      return res.status(403).json({ error: "Access denied - different AD office" });
    }

    return res.json({ ok: true, sericulturist: result.sericulturist });
  } catch (error) {
    console.error('Get sericulturist error:', error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/sericulturists", requireSectionAdmin, async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      address,
      role,
      ad_office,
      status
    } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: "Name and email are required" });
    }

    // Section admin can only create users in their own AD office
    let finalAdOffice = ad_office?.trim() || null;
    if (req.user.role === ROLES.SECTION_ADMIN) {
      finalAdOffice = req.user.ad_office;
    }

    const userData = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: password?.trim() || null,
      phone: phone?.trim() || null,
      address: address?.trim() || null,
      role: role?.trim() || 'user',
      ad_office: finalAdOffice,
      status: status || 'active'
    };

    const result = await sericulturistServices.create(userData);
    
    if (!result.ok) {
      return res.status(400).json({ error: result.error });
    }

    return res.status(201).json({ ok: true, sericulturist: result.sericulturist });
  } catch (error) {
    console.error('Create sericulturist error:', error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.put("/api/sericulturists/:id", requireSectionAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid sericulturist ID" });
    }

    // First check if user has access to this sericulturist
    if (req.user.role === ROLES.SECTION_ADMIN) {
      const existing = await sericulturistServices.getById(id);
      if (!existing.ok) {
        return res.status(404).json({ error: existing.error });
      }
      if (existing.sericulturist.ad_office !== req.user.ad_office) {
        return res.status(403).json({ error: "Access denied - different AD office" });
      }
    }

    const {
      name,
      email,
      password,
      phone,
      address,
      role,
      ad_office,
      status
    } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: "Name and email are required" });
    }

    const userData = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: password?.trim() || null,
      phone: phone?.trim() || null,
      address: address?.trim() || null,
      role: role?.trim() || null,
      ad_office: ad_office?.trim() || null,
      status: status || 'active'
    };

    const result = await sericulturistServices.update(id, userData);
    
    if (!result.ok) {
      return res.status(404).json({ error: result.error });
    }

    return res.json({ ok: true, sericulturist: result.sericulturist });
  } catch (error) {
    console.error('Update sericulturist error:', error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.delete("/api/sericulturists/:id", requireSuperAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid sericulturist ID" });
    }

    const result = await sericulturistServices.delete(id);
    
    if (!result.ok) {
      return res.status(404).json({ error: result.error });
    }

    return res.json({ ok: true, message: "Sericulturist deleted successfully" });
  } catch (error) {
    console.error('Delete sericulturist error:', error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Bulk operations - Only Super Admin
app.put("/api/sericulturists/bulk/status", requireSuperAdmin, async (req, res) => {
  try {
    const { ids, status } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "IDs array is required" });
    }

    if (!status || !['active', 'inactive'].includes(status)) {
      return res.status(400).json({ error: "Status must be 'active' or 'inactive'" });
    }

    const result = await sericulturistServices.bulkUpdateStatus(ids, status);
    
    if (!result.ok) {
      return res.status(500).json({ error: result.error });
    }

    return res.json({ 
      ok: true, 
      message: `Updated ${result.updatedCount} sericulturists` 
    });
  } catch (error) {
    console.error('Bulk update error:', error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.delete("/api/sericulturists/bulk", requireSuperAdmin, async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "IDs array is required" });
    }

    const result = await sericulturistServices.bulkDelete(ids);
    
    if (!result.ok) {
      return res.status(500).json({ error: result.error });
    }

    return res.json({ 
      ok: true, 
      message: `Deleted ${result.deletedCount} sericulturists` 
    });
  } catch (error) {
    console.error('Bulk delete error:', error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Statistics endpoint
app.get("/api/sericulturists/statistics", requireSuperAdmin, async (req, res) => {
  try {
    const result = await sericulturistServices.getStatistics();
    
    if (!result.ok) {
      return res.status(500).json({ error: result.error });
    }

    return res.json({ ok: true, statistics: result.statistics });
  } catch (error) {
    console.error('Get statistics error:', error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/admin/profile", requireSuperAdmin, async (req, res) => {
  try {
    const result = await authServices.getAdminById(req.user.id);
    if (!result.ok) {
      return res.status(404).json({ error: result.error });
    }
    return res.json({ ok: true, admin: result.admin });
  } catch (error) {
    console.error('Profile error:', error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.put("/api/admin/password", requireSuperAdmin, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Current password and new password are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: "New password must be at least 6 characters" });
    }

    const result = await authServices.updatePassword(req.user.id, currentPassword, newPassword);
    
    if (!result.ok) {
      return res.status(400).json({ error: result.error });
    }

    return res.json({ ok: true, message: "Password updated successfully" });
  } catch (error) {
    console.error('Update password error:', error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Super admin routes (get all admins, delete admin, etc.)
app.get("/api/admin/admins", requireSuperAdmin, async (req, res) => {
  try {
    const result = await authServices.getAllAdmins();
    if (!result.ok) {
      return res.status(500).json({ error: result.error });
    }
    return res.json({ ok: true, admins: result.admins });
  } catch (error) {
    console.error('Get admins error:', error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Error handling middleware
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: "Internal server error" });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🔄 Shutting down gracefully...');
  await closePool();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🔄 Shutting down gracefully...');
  await closePool();
  process.exit(0);
});

// Start server
const startServer = async () => {
  try {
    console.log('🔄 Starting server...');
    
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error('❌ Failed to connect to database. Please check your PostgreSQL configuration.');
      return;
    }

    // Initialize database schema
    const schemaInitialized = await initializeDatabase();
    if (!schemaInitialized) {
      console.error('❌ Failed to initialize database schema.');
      return;
    }

    // Initialize default admin user
    await initializeDefaultAdmin();

    console.log('✅ Server ready for serverless deployment');
  } catch (error) {
    console.error('❌ Failed to start server:', error);
  }
};

// Initialize server for serverless
startServer();

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 PostgreSQL server running on http://localhost:${PORT}`);
    console.log(`🌐 CORS enabled for: ${CORS_ORIGIN}`);
  });
}

// Export for Vercel serverless
export default app;
