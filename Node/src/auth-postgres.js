import bcrypt from 'bcrypt';
import { query } from './postgres.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";
const COOKIE_NAME = "pdl_admin_token";
const SALT_ROUNDS = 12;

// JWT Token functions
export function signAdminToken({ adminId, email }) {
  return jwt.sign({ sub: adminId, email, role: "admin" }, JWT_SECRET, {
    expiresIn: "2h"
  });
}

export function getAuthCookieName() {
  return COOKIE_NAME;
}

export function requireAdmin(req, res, next) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return res.status(401).json({ error: "UNAUTHENTICATED" });

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (payload?.role !== "admin") return res.status(403).json({ error: "FORBIDDEN" });
    req.admin = { id: payload.sub, email: payload.email };
    return next();
  } catch {
    return res.status(401).json({ error: "UNAUTHENTICATED" });
  }
}

export function cookieOptions(req) {
  const isHttps = req.secure || req.headers["x-forwarded-proto"] === "https";
  return {
    httpOnly: true,
    secure: isHttps,
    sameSite: "lax",
    path: "/",
    maxAge: 2 * 60 * 60 * 1000
  };
}

// PostgreSQL Authentication functions
export const authServices = {
  // Register new admin
  async register(email, password) {
    try {
      // Check if admin already exists
      const existingAdmin = await query(
        'SELECT id FROM admins WHERE email = $1',
        [email]
      );
      
      if (existingAdmin.rows.length > 0) {
        return { ok: false, error: 'Admin already exists' };
      }

      // Hash password and create admin
      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
      
      const result = await query(
        'INSERT INTO admins (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at',
        [email, passwordHash]
      );

      const admin = result.rows[0];
      return { 
        ok: true, 
        admin: { 
          id: admin.id, 
          email: admin.email, 
          createdAt: admin.created_at 
        } 
      };
    } catch (error) {
      console.error('Registration error:', error);
      return { ok: false, error: 'Registration failed' };
    }
  },

  // Login admin
  async login(email, password) {
    try {
      const result = await query(
        'SELECT id, email, password_hash, created_at FROM admins WHERE email = $1',
        [email]
      );

      if (result.rows.length === 0) {
        return { ok: false, error: 'Invalid credentials' };
      }

      const admin = result.rows[0];
      const isValidPassword = await bcrypt.compare(password, admin.password_hash);

      if (!isValidPassword) {
        return { ok: false, error: 'Invalid credentials' };
      }

      return { 
        ok: true, 
        admin: { 
          id: admin.id, 
          email: admin.email, 
          createdAt: admin.created_at 
        } 
      };
    } catch (error) {
      console.error('Login error:', error);
      return { ok: false, error: 'Login failed' };
    }
  },

  // Get admin by ID
  async getAdminById(adminId) {
    try {
      const result = await query(
        'SELECT id, email, created_at, updated_at FROM admins WHERE id = $1',
        [adminId]
      );

      if (result.rows.length === 0) {
        return { ok: false, error: 'Admin not found' };
      }

      const admin = result.rows[0];
      return { 
        ok: true, 
        admin: { 
          id: admin.id, 
          email: admin.email, 
          createdAt: admin.created_at,
          updatedAt: admin.updated_at
        } 
      };
    } catch (error) {
      console.error('Get admin error:', error);
      return { ok: false, error: 'Failed to get admin' };
    }
  },

  // Update admin password
  async updatePassword(adminId, currentPassword, newPassword) {
    try {
      // First verify current password
      const result = await query(
        'SELECT password_hash FROM admins WHERE id = $1',
        [adminId]
      );

      if (result.rows.length === 0) {
        return { ok: false, error: 'Admin not found' };
      }

      const isValidPassword = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
      if (!isValidPassword) {
        return { ok: false, error: 'Current password is incorrect' };
      }

      // Hash new password and update
      const newPasswordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
      
      await query(
        'UPDATE admins SET password_hash = $1 WHERE id = $2',
        [newPasswordHash, adminId]
      );

      return { ok: true };
    } catch (error) {
      console.error('Update password error:', error);
      return { ok: false, error: 'Failed to update password' };
    }
  },

  // Delete admin
  async deleteAdmin(adminId) {
    try {
      const result = await query(
        'DELETE FROM admins WHERE id = $1 RETURNING id',
        [adminId]
      );

      if (result.rows.length === 0) {
        return { ok: false, error: 'Admin not found' };
      }

      return { ok: true };
    } catch (error) {
      console.error('Delete admin error:', error);
      return { ok: false, error: 'Failed to delete admin' };
    }
  },

  // Get all admins (for super admin functionality)
  async getAllAdmins() {
    try {
      const result = await query(
        'SELECT id, email, created_at, updated_at FROM admins ORDER BY created_at DESC'
      );

      return { 
        ok: true, 
        admins: result.rows.map(admin => ({
          id: admin.id,
          email: admin.email,
          createdAt: admin.created_at,
          updatedAt: admin.updated_at
        }))
      };
    } catch (error) {
      console.error('Get all admins error:', error);
      return { ok: false, error: 'Failed to get admins' };
    }
  }
};

// Initialize default admin if no admins exist
export const initializeDefaultAdmin = async () => {
  try {
    const result = await query('SELECT COUNT(*) as count FROM admins');
    const adminCount = parseInt(result.rows[0].count);

    if (adminCount === 0) {
      const defaultEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
      const defaultPassword = process.env.ADMIN_PASSWORD || 'Admin123!';

      const registrationResult = await authServices.register(defaultEmail, defaultPassword);
      
      if (registrationResult.ok) {
        console.log(`✅ Default admin created: ${defaultEmail}`);
        console.log(`🔑 Default password: ${defaultPassword}`);
        console.log('⚠️  Please change the default password after first login!');
      } else {
        console.error('❌ Failed to create default admin:', registrationResult.error);
      }
    }
  } catch (error) {
    console.error('❌ Failed to initialize default admin:', error);
  }
};
