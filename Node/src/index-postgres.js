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
import { misServices } from './mis-services.js';
import { getMasterData, targetServices, misReportServices } from './mis-report-services.js';

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

    console.log('Admin not found, trying sericulturist login for:', email);

    // Try sericulturist login (Section Admin or User)
    try {
      console.log('Calling sericulturistServices.login...');
      const sericulturistResult = await sericulturistServices.login(email, password);
      console.log('Sericulturist login result:', sericulturistResult);

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

    // Validate phone number (10 digits only if provided)
    if (phone && phone.trim()) {
      const phoneRegex = /^\d{10}$/;
      if (!phoneRegex.test(phone.trim())) {
        return res.status(400).json({ error: "Phone number must be exactly 10 digits" });
      }
    }

    // Section admin can only create users in their own AD office
    // AND can only create 'user' role (not section_admin)
    let finalAdOffice = ad_office?.trim() || null;
    let finalRole = role?.trim() || 'user';

    if (req.user.role === ROLES.SECTION_ADMIN) {
      finalAdOffice = req.user.ad_office;
      // Force role to 'user' - Section Admin cannot create other Section Admins
      finalRole = 'user';
    }

    const userData = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: password?.trim() || null,
      phone: phone?.trim() || null,
      address: address?.trim() || null,
      role: finalRole,
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

    // Validate phone number (10 digits only if provided)
    if (phone && phone.trim()) {
      const phoneRegex = /^\d{10}$/;
      if (!phoneRegex.test(phone.trim())) {
        return res.status(400).json({ error: "Phone number must be exactly 10 digits" });
      }
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

// Bulk operations - Only Super Admin (MUST be before /:id routes)
app.delete("/api/sericulturists/bulk", requireSuperAdmin, async (req, res) => {
  try {
    const { ids } = req.body;
    console.log('Bulk delete request received, IDs:', ids);

    if (!Array.isArray(ids) || ids.length === 0) {
      console.log('Invalid IDs array:', ids);
      return res.status(400).json({ error: "IDs array is required" });
    }

    // Validate and convert IDs to numbers
    const validIds = ids
      .map(id => typeof id === 'string' ? parseInt(id) : id)
      .filter(id => typeof id === 'number' && !isNaN(id));
    console.log('Valid IDs for deletion:', validIds);

    if (validIds.length === 0) {
      return res.status(400).json({ error: "No valid sericulturist IDs provided" });
    }

    const result = await sericulturistServices.bulkDelete(validIds);
    
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

app.put("/api/sericulturists/bulk/status", requireSuperAdmin, async (req, res) => {
  try {
    const { ids, status } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "IDs array is required" });
    }

    if (!status || !['active', 'inactive'].includes(status)) {
      return res.status(400).json({ error: "Status must be 'active' or 'inactive'" });
    }

    // Validate and convert IDs to numbers
    const validIds = ids
      .map(id => typeof id === 'string' ? parseInt(id) : id)
      .filter(id => typeof id === 'number' && !isNaN(id));

    if (validIds.length === 0) {
      return res.status(400).json({ error: "No valid sericulturist IDs provided" });
    }

    const result = await sericulturistServices.bulkUpdateStatus(validIds, status);
    
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

app.delete("/api/sericulturists/:id", requireSuperAdmin, async (req, res) => {
  try {
    console.log('Delete request received, ID param:', req.params.id, 'Type:', typeof req.params.id);
    const id = parseInt(req.params.id);
    console.log('Parsed ID:', id, 'Type:', typeof id);
    if (isNaN(id)) {
      console.log('Invalid ID - NaN');
      return res.status(400).json({ error: "Invalid sericulturist ID" });
    }

    const result = await sericulturistServices.delete(id);
    console.log('Delete result:', result);
    
    if (!result.ok) {
      return res.status(404).json({ error: result.error });
    }

    return res.json({ ok: true, message: "Sericulturist deleted successfully" });
  } catch (error) {
    console.error('Delete sericulturist error:', error);
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

// MIS Entries API - All authenticated users can create entries
app.post("/api/mis/entries", requireAuth, async (req, res) => {
  try {
    const entry = req.body;
    
    // Validate required fields
    if (!entry.section || !entry.farmerName || !entry.farmerId) {
      return res.status(400).json({ error: "Section, Farmer Name, and Farmer ID are required" });
    }

    // Add user info
    entry.createdBy = req.user.id;
    entry.adOffice = req.user.ad_office;

    const result = await misServices.create(entry);
    
    if (!result.ok) {
      return res.status(400).json({ error: result.error });
    }

    return res.status(201).json({ ok: true, entry: result.entry });
  } catch (error) {
    console.error('Create MIS entry error:', error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Get MIS entries - filtered by user role
app.get("/api/mis/entries", requireAuth, async (req, res) => {
  try {
    const { section, district, search, limit = 50, offset = 0 } = req.query;
    
    const filters = { limit: parseInt(limit), offset: parseInt(offset) };
    
    // Super Admin sees all entries
    if (req.user.role === ROLES.SUPER_ADMIN) {
      if (section) filters.section = section;
      if (district) filters.district = district;
    } 
    // Section Admin sees entries from their assigned section
    else if (req.user.role === ROLES.SECTION_ADMIN) {
      filters.section = req.user.ad_office; // MIS, PLS, PRC, or POC
    } 
    // Regular users see entries from their AD office
    else {
      filters.adOffice = req.user.ad_office;
      if (section) filters.section = section;
    }
    
    if (search) filters.search = search;

    const result = await misServices.getAll(filters);
    
    if (!result.ok) {
      return res.status(500).json({ error: result.error });
    }

    return res.json({ ok: true, entries: result.entries });
  } catch (error) {
    console.error('Get MIS entries error:', error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Get MIS entry by ID
app.get("/api/mis/entries/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid entry ID" });
    }

    const result = await misServices.getById(id);
    
    if (!result.ok) {
      return res.status(404).json({ error: result.error });
    }

    // Check if user can access this entry
    if (req.user.role === ROLES.SECTION_ADMIN && result.entry.section !== req.user.ad_office) {
      return res.status(403).json({ error: "Access denied" });
    }

    return res.json({ ok: true, entry: result.entry });
  } catch (error) {
    console.error('Get MIS entry error:', error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Update MIS entry - only Super Admin or Section Admin
app.put("/api/mis/entries/:id", requireSectionAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid entry ID" });
    }

    // Check if entry exists and user has access
    const existing = await misServices.getById(id);
    if (!existing.ok) {
      return res.status(404).json({ error: existing.error });
    }

    // Section Admin can only update entries in their section
    if (req.user.role === ROLES.SECTION_ADMIN && existing.entry.section !== req.user.ad_office) {
      return res.status(403).json({ error: "Access denied" });
    }

    const result = await misServices.update(id, req.body);
    
    if (!result.ok) {
      return res.status(400).json({ error: result.error });
    }

    return res.json({ ok: true, entry: result.entry });
  } catch (error) {
    console.error('Update MIS entry error:', error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Delete MIS entry - only Super Admin
app.delete("/api/mis/entries/:id", requireSuperAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid entry ID" });
    }

    const result = await misServices.delete(id);
    
    if (!result.ok) {
      return res.status(404).json({ error: result.error });
    }

    return res.json({ ok: true, message: "Entry deleted successfully" });
  } catch (error) {
    console.error('Delete MIS entry error:', error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Get MIS statistics
app.get("/api/mis/statistics", requireSectionAdmin, async (req, res) => {
  try {
    const result = await misServices.getStatistics();
    
    if (!result.ok) {
      return res.status(500).json({ error: result.error });
    }

    return res.json({ ok: true, statistics: result.statistics });
  } catch (error) {
    console.error('Get MIS statistics error:', error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// =====================================================================
// AUTH — /me endpoint
// =====================================================================

app.get("/api/me", requireAuth, (req, res) => {
  return res.json({ ok: true, user: req.user });
});

// =====================================================================
// MASTER DATA ROUTES
// =====================================================================

app.get("/api/regions", requireAuth, async (_req, res) => {
  try {
    const result = await getMasterData.regions();
    return res.json(result);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

app.get("/api/ad-offices", requireAuth, async (req, res) => {
  try {
    const result = await getMasterData.adOffices(req.query.region_id || null);
    return res.json(result);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

app.get("/api/financial-years", requireAuth, async (_req, res) => {
  try {
    const result = await getMasterData.financialYears();
    return res.json(result);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

app.get("/api/months", requireAuth, async (_req, res) => {
  try {
    const result = await getMasterData.months();
    return res.json(result);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

app.get("/api/schemes", requireAuth, async (_req, res) => {
  try {
    const result = await getMasterData.schemes();
    return res.json(result);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// =====================================================================
// TARGET ROUTES (Super Admin / MIS Admin only)
// =====================================================================

app.post("/api/targets", requireSectionAdmin, async (req, res) => {
  try {
    const { officeId, schemeId, financialYearId, targetAcre, targetFarmer } = req.body;
    if (!officeId || !schemeId || !financialYearId) {
      return res.status(400).json({ error: "officeId, schemeId, financialYearId are required" });
    }
    const result = await targetServices.upsert({ officeId, schemeId, financialYearId, targetAcre, targetFarmer });
    return res.json(result);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

app.get("/api/targets", requireAuth, async (req, res) => {
  try {
    const { officeId, schemeId, financialYearId } = req.query;
    const result = await targetServices.getForOffice({ officeId, schemeId, financialYearId });
    return res.json(result);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// =====================================================================
// MIS REPORT ROUTES
// =====================================================================

// GET /api/mis-report — list reports with filters
app.get("/api/mis-report", requireAuth, async (req, res) => {
  try {
    const { scheme_id, year_id, month_id, status, limit, offset } = req.query;

    // AD Office User can only see their own office
    let officeId = req.query.office_id || null;
    if (req.user.role === ROLES.USER || req.user.role === 'user') {
      const officeRow = await query(
        'SELECT id FROM ad_offices WHERE office_name=$1', [req.user.ad_office]
      );
      officeId = officeRow.rows[0]?.id || null;
    }

    const result = await misReportServices.getReports({
      schemeId: scheme_id || null,
      yearId:   year_id   || null,
      monthId:  month_id  || null,
      officeId,
      status:   status    || null,
      limit:    parseInt(limit)  || 100,
      offset:   parseInt(offset) || 0,
    });
    return res.json(result);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// GET /api/monthly-report — load one office+scheme+year+month (with carry-forward ULM)
app.get("/api/monthly-report", requireAuth, async (req, res) => {
  try {
    const { office_name, scheme_name, year_name, month_name } = req.query;

    // Derive office_name from JWT for AD Office User
    let officeName = office_name;
    if (req.user.role === ROLES.USER || req.user.role === 'user') {
      officeName = req.user.ad_office;
    }
    if (!officeName || !scheme_name || !year_name || !month_name) {
      return res.status(400).json({ error: "office_name, scheme_name, year_name, month_name required" });
    }

    const result = await misReportServices.loadReport({
      officeName, schemeName: scheme_name, yearName: year_name, monthName: month_name,
    });
    return res.json(result);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// GET /api/monthly-report/all — load ALL offices for scheme+year+month (admin view)
app.get("/api/monthly-report/all", requireSectionAdmin, async (req, res) => {
  try {
    const { scheme_name, year_name, month_name } = req.query;
    if (!scheme_name || !year_name || !month_name) {
      return res.status(400).json({ error: "scheme_name, year_name, month_name required" });
    }
    const result = await misReportServices.loadAllOfficesReport({
      schemeName: scheme_name, yearName: year_name, monthName: month_name,
    });
    return res.json(result);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// POST /api/mis-report — save / upsert a single office report
app.post("/api/mis-report", requireAuth, async (req, res) => {
  try {
    const { office_name, scheme_name, year_name, month_name, dm_acre, dm_farmer, status } = req.body;

    let officeName = office_name;
    if (req.user.role === ROLES.USER || req.user.role === 'user') {
      officeName = req.user.ad_office;
    }
    if (!officeName || !scheme_name || !year_name || !month_name) {
      return res.status(400).json({ error: "office_name, scheme_name, year_name, month_name required" });
    }

    const resolvedStatus = status || 'Draft';
    const result = await misReportServices.saveReport({
      officeName, schemeName: scheme_name, yearName: year_name, monthName: month_name,
      dmAcre: dm_acre, dmFarmer: dm_farmer,
      submittedBy: resolvedStatus === 'Submitted' ? (req.user.id || null) : null,
      status: resolvedStatus,
    });
    return res.json(result);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// POST /api/mis-report/bulk — save all offices at once (admin)
app.post("/api/mis-report/bulk", requireSectionAdmin, async (req, res) => {
  try {
    const { rows, scheme_name, year_name, month_name, status } = req.body;
    if (!Array.isArray(rows) || !scheme_name || !year_name || !month_name) {
      return res.status(400).json({ error: "rows[], scheme_name, year_name, month_name required" });
    }
    const resolvedStatus = status || 'Draft';
    const result = await misReportServices.saveBulkReports({
      rows, schemeName: scheme_name, yearName: year_name, monthName: month_name,
      submittedBy: resolvedStatus === 'Submitted' ? (req.user.id || null) : null,
      status: resolvedStatus,
    });
    return res.json(result);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// PUT /api/mis-report/:id — update status (Approve / Reject)
app.put("/api/mis-report/:id", requireSectionAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid report ID" });
    const { status } = req.body;
    const result = await misReportServices.updateStatus({ reportId: id, status, updatedBy: req.user.id });
    if (!result.ok) return res.status(400).json({ error: result.error });
    return res.json(result);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// =====================================================================
// DASHBOARD ROUTES
// =====================================================================

app.get("/api/dashboard-summary", requireAuth, async (req, res) => {
  try {
    const { scheme_id, year_id } = req.query;
    const result = await misReportServices.dashboardSummary({
      schemeId: scheme_id || null,
      yearId:   year_id   || null,
    });
    return res.json(result);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

app.get("/api/submission-status", requireSectionAdmin, async (req, res) => {
  try {
    const { scheme_id, year_id, month_id } = req.query;
    if (!scheme_id || !year_id || !month_id) {
      return res.status(400).json({ error: "scheme_id, year_id, month_id required" });
    }
    const result = await misReportServices.submissionStatus({
      schemeId: scheme_id, yearId: year_id, monthId: month_id,
    });
    return res.json(result);
  } catch (e) {
    return res.status(500).json({ error: e.message });
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
