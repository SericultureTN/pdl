import { query, transaction } from './postgres.js';

export const sericulturistServices = {
  // Login sericulturist
  async login(email, password) {
    try {
      console.log('Attempting login for email:', email);
      const result = await query(`
        SELECT id, name, email, password, phone, address, role, ad_office, status, created_at
        FROM sericulturists 
        WHERE email = $1 AND status = 'active'
      `, [email.trim().toLowerCase()]);

      console.log('Query result rows:', result.rows.length);

      if (result.rows.length === 0) {
        console.log('User not found or inactive');
        return { ok: false, error: 'User not found or inactive' };
      }

      const sericulturist = result.rows[0];
      console.log('Found user:', sericulturist.name, 'Password match:', sericulturist.password === password);
      
      // For simplicity, compare password directly (in production, use bcrypt)
      if (sericulturist.password !== password) {
        console.log('Password mismatch');
        return { ok: false, error: 'Invalid password' };
      }

      console.log('Login successful');
      return { ok: true, sericulturist };
    } catch (error) {
      console.error('Sericulturist login error:', error);
      return { ok: false, error: 'Login failed' };
    }
  },

  // Create new sericulturist
  async create(userData) {
    try {
      const {
        name,
        email,
        password,
        phone,
        address,
        role,
        ad_office,
        status = 'active'
      } = userData;

      const result = await query(`
        INSERT INTO sericulturists (name, email, password, phone, address, role, ad_office, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, name, email, phone, address, role, ad_office, status, created_at
      `, [name, email, password, phone, address, role, ad_office, status]);

      return { ok: true, sericulturist: result.rows[0] };
    } catch (error) {
      console.error('Create sericulturist error:', error);
      if (error.code === '23505') {
        return { ok: false, error: 'Email already exists' };
      }
      return { ok: false, error: 'Failed to create sericulturist' };
    }
  },

  // Get all sericulturists with pagination
  async getAll(page = 1, limit = 10, search = '', status = '') {
    try {
      const offset = (page - 1) * limit;
      let whereClause = 'WHERE 1=1';
      const params = [];
      let paramCount = 0;

      if (search) {
        paramCount++;
        whereClause += ` AND (name ILIKE $${paramCount} OR email ILIKE $${paramCount} OR phone ILIKE $${paramCount})`;
        params.push(`%${search}%`);
      }

      if (status) {
        paramCount++;
        whereClause += ` AND status = $${paramCount}`;
        params.push(status);
      }

      // Get total count
      const countResult = await query(`
        SELECT COUNT(*) as total FROM sericulturists ${whereClause}
      `, params);

      // Get sericulturists
      const sericulturistsResult = await query(`
        SELECT id, name, email, phone, address, role, ad_office, status, 
               created_at, updated_at
        FROM sericulturists 
        ${whereClause}
        ORDER BY created_at DESC 
        LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
      `, [...params, limit, offset]);

      const total = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(total / limit);

      return {
        ok: true,
        sericulturists: sericulturistsResult.rows,
        pagination: {
          current: page,
          total: totalPages,
          limit,
          totalItems: total
        }
      };
    } catch (error) {
      console.error('Get sericulturists error:', error);
      return { ok: false, error: 'Failed to fetch sericulturists' };
    }
  },

  // Get sericulturist by ID
  async getById(id) {
    try {
      const result = await query(`
        SELECT id, name, email, phone, address, role, ad_office, status,
               created_at, updated_at
        FROM sericulturists WHERE id = $1
      `, [id]);

      if (result.rows.length === 0) {
        return { ok: false, error: 'Sericulturist not found' };
      }

      return { ok: true, sericulturist: result.rows[0] };
    } catch (error) {
      console.error('Get sericulturist error:', error);
      return { ok: false, error: 'Failed to fetch sericulturist' };
    }
  },

  // Update sericulturist
  async update(id, userData) {
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
      } = userData;

      const result = await query(`
        UPDATE sericulturists 
        SET name = $1, email = $2, password = $3, phone = $4, address = $5, role = $6, ad_office = $7, status = $8, updated_at = CURRENT_TIMESTAMP
        WHERE id = $9
        RETURNING id, name, email, phone, address, role, ad_office, status, created_at, updated_at
      `, [name, email, password, phone, address, role, ad_office, status, id]);

      if (result.rows.length === 0) {
        return { ok: false, error: 'Sericulturist not found' };
      }

      return { ok: true, sericulturist: result.rows[0] };
    } catch (error) {
      console.error('Update sericulturist error:', error);
      if (error.code === '23505') {
        return { ok: false, error: 'Email already exists' };
      }
      return { ok: false, error: 'Failed to update sericulturist' };
    }
  },

  // Delete sericulturist
  async delete(id) {
    try {
      const result = await query(`
        DELETE FROM sericulturists WHERE id = $1 RETURNING id
      `, [id]);

      if (result.rows.length === 0) {
        return { ok: false, error: 'Sericulturist not found' };
      }

      return { ok: true };
    } catch (error) {
      console.error('Delete sericulturist error:', error);
      return { ok: false, error: 'Failed to delete sericulturist' };
    }
  },

  // Get statistics
  async getStatistics() {
    try {
      const [totalResult, activeResult, inactiveResult, recentResult] = await Promise.all([
        query('SELECT COUNT(*) as count FROM sericulturists'),
        query("SELECT COUNT(*) as count FROM sericulturists WHERE status = 'active'"),
        query("SELECT COUNT(*) as count FROM sericulturists WHERE status = 'inactive'"),
        query(`
          SELECT COUNT(*) as count 
          FROM sericulturists 
          WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
        `)
      ]);

      const total = parseInt(totalResult.rows[0].count);
      const active = parseInt(activeResult.rows[0].count);
      const inactive = parseInt(inactiveResult.rows[0].count);
      const recent = parseInt(recentResult.rows[0].count);

      return {
        ok: true,
        statistics: {
          total,
          active,
          inactive,
          recent,
          activePercentage: total > 0 ? Math.round((active / total) * 100) : 0,
          recentGrowth: recent
        }
      };
    } catch (error) {
      console.error('Get statistics error:', error);
      return { ok: false, error: 'Failed to fetch statistics' };
    }
  },

  // Bulk operations
  async bulkUpdateStatus(ids, status) {
    try {
      const result = await query(`
        UPDATE sericulturists 
        SET status = $1 
        WHERE id = ANY($2)
        RETURNING id
      `, [status, ids]);

      return { ok: true, updatedCount: result.rows.length };
    } catch (error) {
      console.error('Bulk update error:', error);
      return { ok: false, error: 'Failed to update sericulturists' };
    }
  },

  async bulkDelete(ids) {
    try {
      const result = await query(`
        DELETE FROM sericulturists 
        WHERE id = ANY($1)
        RETURNING id
      `, [ids]);

      return { ok: true, deletedCount: result.rows.length };
    } catch (error) {
      console.error('Bulk delete error:', error);
      return { ok: false, error: 'Failed to delete sericulturists' };
    }
  }
};
