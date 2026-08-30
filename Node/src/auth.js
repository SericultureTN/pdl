import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query } from './postgres.js';

const JWT_SECRET = process.env.JWT_SECRET || 'local_dev_secret_change_me_in_production';
const SALT_ROUNDS = 12;
const COOKIE_NAME = 'token';

const ROLES = ['admin', 'secondary_admin', 'user'];

function validateRoleScoping({ role, section_id, group_id, office_id }) {
  if (!ROLES.includes(role)) {
    return `role must be one of: ${ROLES.join(', ')}`;
  }
  if (role === 'user') {
    if (!section_id || !group_id || !office_id) {
      return 'Section, Group, and Office are required for role "user"';
    }
  } else if (section_id || group_id || office_id) {
    return 'Section/Group/Office must not be set for admin or secondary_admin';
  }
  return null;
}

const USER_SELECT = `
  SELECT u.id, u.name, u.email, u.phone, u.address, u.role, u.designation,
         u.section_id, sec.name AS section_name,
         u.group_id, g.name AS group_name,
         u.office_id, o.name AS office_name,
         u.status, u.created_at, u.updated_at
  FROM poc_users u
  LEFT JOIN sections sec ON sec.id = u.section_id
  LEFT JOIN groups g ON g.id = u.group_id
  LEFT JOIN poc_offices o ON o.id = u.office_id
`;

export const usersService = {
  async create(input) {
    const { name, email, password, phone, address, role, designation, section_id, group_id, office_id, status = 'active' } = input;

    if (!name || !email || !password) {
      return { ok: false, error: 'Name, email, and password are required' };
    }

    const scopingError = validateRoleScoping({ role, section_id, group_id, office_id });
    if (scopingError) {
      return { ok: false, error: scopingError };
    }

    try {
      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
      const result = await query(
        `
        INSERT INTO poc_users (name, email, phone, password_hash, address, role, designation, section_id, group_id, office_id, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id
        `,
        [name.trim(), email.trim().toLowerCase(), phone || null, passwordHash, address || null, role, designation || null, section_id || null, group_id || null, office_id || null, status]
      );
      return this.getById(result.rows[0].id);
    } catch (error) {
      if (error.code === '23505') {
        return { ok: false, error: 'Email already exists' };
      }
      console.error('Create user error:', error);
      return { ok: false, error: 'Failed to create user' };
    }
  },

  async update(id, input) {
    const { name, email, password, phone, address, role, designation, section_id, group_id, office_id, status } = input;

    const scopingError = validateRoleScoping({ role, section_id, group_id, office_id });
    if (scopingError) {
      return { ok: false, error: scopingError };
    }

    try {
      const passwordHash = password ? await bcrypt.hash(password, SALT_ROUNDS) : null;
      const result = await query(
        `
        UPDATE poc_users SET
          name = $1, email = $2, phone = $3, address = $4, role = $5, designation = $6,
          section_id = $7, group_id = $8, office_id = $9, status = $10,
          password_hash = COALESCE($11, password_hash),
          updated_at = now()
        WHERE id = $12
        RETURNING id
        `,
        [name, email?.trim().toLowerCase(), phone || null, address || null, role, designation || null, section_id || null, group_id || null, office_id || null, status, passwordHash, id]
      );
      if (result.rows.length === 0) {
        return { ok: false, error: 'User not found' };
      }
      return this.getById(id);
    } catch (error) {
      if (error.code === '23505') {
        return { ok: false, error: 'Email already exists' };
      }
      console.error('Update user error:', error);
      return { ok: false, error: 'Failed to update user' };
    }
  },

  async getById(id) {
    const result = await query(`${USER_SELECT} WHERE u.id = $1`, [id]);
    if (result.rows.length === 0) {
      return { ok: false, error: 'User not found' };
    }
    return { ok: true, user: result.rows[0] };
  },

  async getByEmail(email) {
    const result = await query(`${USER_SELECT} WHERE u.email = $1`, [email.trim().toLowerCase()]);
    return result.rows[0] || null;
  },

  async list(page = 1, limit = 10, search = '', status = '', role = '') {
    const offset = (page - 1) * limit;
    let where = 'WHERE 1=1';
    const params = [];
    let n = 0;

    if (search) {
      n++;
      where += ` AND (u.name ILIKE $${n} OR u.email ILIKE $${n} OR u.phone ILIKE $${n})`;
      params.push(`%${search}%`);
    }
    if (status) {
      n++;
      where += ` AND u.status = $${n}`;
      params.push(status);
    }
    if (role) {
      n++;
      where += ` AND u.role = $${n}`;
      params.push(role);
    }

    const countResult = await query(`SELECT COUNT(*) AS total FROM poc_users u ${where}`, params);
    const usersResult = await query(
      `${USER_SELECT} ${where} ORDER BY u.created_at DESC LIMIT $${n + 1} OFFSET $${n + 2}`,
      [...params, limit, offset]
    );

    const total = parseInt(countResult.rows[0].total, 10);
    return {
      ok: true,
      users: usersResult.rows,
      pagination: { current: page, total: Math.ceil(total / limit), limit, totalItems: total },
    };
  },

  async delete(id) {
    const result = await query('DELETE FROM poc_users WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return { ok: false, error: 'User not found' };
    }
    return { ok: true };
  },

  async bulkUpdateStatus(ids, status) {
    const result = await query('UPDATE poc_users SET status = $1 WHERE id = ANY($2) RETURNING id', [status, ids]);
    return { ok: true, updatedCount: result.rows.length };
  },

  async bulkDelete(ids) {
    const result = await query('DELETE FROM poc_users WHERE id = ANY($1) RETURNING id', [ids]);
    return { ok: true, deletedCount: result.rows.length };
  },

  async getStatistics() {
    const [totalResult, activeResult, inactiveResult] = await Promise.all([
      query('SELECT COUNT(*) AS count FROM poc_users'),
      query(`SELECT COUNT(*) AS count FROM poc_users WHERE status = 'active'`),
      query(`SELECT COUNT(*) AS count FROM poc_users WHERE status = 'inactive'`),
    ]);
    const total = parseInt(totalResult.rows[0].count, 10);
    const active = parseInt(activeResult.rows[0].count, 10);
    const inactive = parseInt(inactiveResult.rows[0].count, 10);
    return {
      ok: true,
      statistics: { total, active, inactive, activePercentage: total > 0 ? Math.round((active / total) * 100) : 0 },
    };
  },

  async login(email, password) {
    const user = await this.getByEmail(email);
    if (!user) {
      return { ok: false, error: 'Invalid credentials' };
    }
    if (user.status !== 'active') {
      return { ok: false, error: 'Account is inactive' };
    }
    const hashResult = await query('SELECT password_hash FROM poc_users WHERE id = $1', [user.id]);
    const passwordMatch = await bcrypt.compare(password, hashResult.rows[0].password_hash);
    if (!passwordMatch) {
      return { ok: false, error: 'Invalid credentials' };
    }
    return { ok: true, user };
  },
};

export function signUserToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      sectionId: user.section_id,
      groupId: user.group_id,
      officeId: user.office_id,
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

export function getAuthCookieName() {
  return COOKIE_NAME;
}

export function cookieOptions() {
  return { httpOnly: true, secure: false, sameSite: 'lax', maxAge: 24 * 60 * 60 * 1000 };
}

export function requireAuth(req, res, next) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    return next();
  } catch (error) {
    return res.status(401).json({ error: 'UNAUTHENTICATED' });
  }
}

// Self-contained (verifies the token itself rather than assuming requireAuth
// already ran earlier in the chain) — route registrations use this alone.
export function requireRole(...roles) {
  return (req, res, next) => {
    return requireAuth(req, res, () => {
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({ error: 'FORBIDDEN' });
      }
      return next();
    });
  };
}

// Resource-level check for single-resource GET/PUT on reports/targets — a
// 'user' can't reach another office's record by guessing its numeric id.
// List-endpoint scoping (GET /api/targets, GET /api/reports) is done inline
// in index.js's route handlers, keyed off req.user.role/officeId directly.
export function assertOwnOffice(resourceOfficeId, req, res) {
  if (req.user.role === 'user' && resourceOfficeId !== req.user.officeId) {
    res.status(403).json({ error: 'FORBIDDEN' });
    return false;
  }
  return true;
}
