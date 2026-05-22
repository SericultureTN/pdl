import { query, transaction } from './postgres.js';

export const misServices = {
  // Create MIS entry
  async create(entry) {
    try {
      const result = await query(`
        INSERT INTO mis_entries (
          section, farmer_name, farmer_id, address, phone, 
          district, registration_date, land_area, variety,
          plantation_date, expected_yield, notes,
          created_by, ad_office, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW())
        RETURNING *
      `, [
        entry.section,
        entry.farmerName,
        entry.farmerId,
        entry.address,
        entry.phone,
        entry.district,
        entry.registrationDate,
        entry.landArea,
        entry.variety,
        entry.plantationDate,
        entry.expectedYield,
        entry.notes,
        entry.createdBy,
        entry.adOffice
      ]);

      return { ok: true, entry: result.rows[0] };
    } catch (error) {
      console.error('Create MIS entry error:', error);
      return { ok: false, error: 'Failed to create entry' };
    }
  },

  // Get all entries with filtering
  async getAll(filters = {}) {
    try {
      let sql = `
        SELECT me.*, s.name as created_by_name
        FROM mis_entries me
        LEFT JOIN sericulturists s ON me.created_by = s.id
        WHERE 1=1
      `;
      const params = [];
      let paramIndex = 1;

      // Filter by section
      if (filters.section) {
        sql += ` AND me.section = $${paramIndex}`;
        params.push(filters.section);
        paramIndex++;
      }

      // Filter by ad_office (for regular users)
      if (filters.adOffice) {
        sql += ` AND me.ad_office = $${paramIndex}`;
        params.push(filters.adOffice);
        paramIndex++;
      }

      // Filter by district
      if (filters.district) {
        sql += ` AND me.district = $${paramIndex}`;
        params.push(filters.district);
        paramIndex++;
      }

      // Filter by farmer name (search)
      if (filters.search) {
        sql += ` AND me.farmer_name ILIKE $${paramIndex}`;
        params.push(`%${filters.search}%`);
        paramIndex++;
      }

      sql += ` ORDER BY me.created_at DESC`;

      // Pagination
      if (filters.limit) {
        sql += ` LIMIT $${paramIndex}`;
        params.push(parseInt(filters.limit));
        paramIndex++;
      }

      if (filters.offset) {
        sql += ` OFFSET $${paramIndex}`;
        params.push(parseInt(filters.offset));
        paramIndex++;
      }

      const result = await query(sql, params);
      return { ok: true, entries: result.rows };
    } catch (error) {
      console.error('Get MIS entries error:', error);
      return { ok: false, error: 'Failed to fetch entries' };
    }
  },

  // Get entry by ID
  async getById(id) {
    try {
      const result = await query(`
        SELECT me.*, s.name as created_by_name
        FROM mis_entries me
        LEFT JOIN sericulturists s ON me.created_by = s.id
        WHERE me.id = $1
      `, [id]);

      if (result.rows.length === 0) {
        return { ok: false, error: 'Entry not found' };
      }

      return { ok: true, entry: result.rows[0] };
    } catch (error) {
      console.error('Get MIS entry error:', error);
      return { ok: false, error: 'Failed to fetch entry' };
    }
  },

  // Update entry
  async update(id, entry) {
    try {
      const result = await query(`
        UPDATE mis_entries SET
          section = $1,
          farmer_name = $2,
          farmer_id = $3,
          address = $4,
          phone = $5,
          district = $6,
          registration_date = $7,
          land_area = $8,
          variety = $9,
          plantation_date = $10,
          expected_yield = $11,
          notes = $12,
          updated_at = NOW()
        WHERE id = $13
        RETURNING *
      `, [
        entry.section,
        entry.farmerName,
        entry.farmerId,
        entry.address,
        entry.phone,
        entry.district,
        entry.registrationDate,
        entry.landArea,
        entry.variety,
        entry.plantationDate,
        entry.expectedYield,
        entry.notes,
        id
      ]);

      if (result.rows.length === 0) {
        return { ok: false, error: 'Entry not found' };
      }

      return { ok: true, entry: result.rows[0] };
    } catch (error) {
      console.error('Update MIS entry error:', error);
      return { ok: false, error: 'Failed to update entry' };
    }
  },

  // Delete entry
  async delete(id) {
    try {
      const result = await query(`
        DELETE FROM mis_entries WHERE id = $1 RETURNING id
      `, [id]);

      if (result.rows.length === 0) {
        return { ok: false, error: 'Entry not found' };
      }

      return { ok: true };
    } catch (error) {
      console.error('Delete MIS entry error:', error);
      return { ok: false, error: 'Failed to delete entry' };
    }
  },

  // Get statistics by section
  async getStatistics() {
    try {
      const result = await query(`
        SELECT 
          section,
          COUNT(*) as total_entries,
          COUNT(DISTINCT district) as total_districts,
          SUM(CAST(land_area AS DECIMAL)) as total_land_area,
          SUM(CAST(expected_yield AS DECIMAL)) as total_expected_yield
        FROM mis_entries
        GROUP BY section
        ORDER BY section
      `);
      return { ok: true, statistics: result.rows };
    } catch (error) {
      console.error('Get MIS statistics error:', error);
      return { ok: false, error: 'Failed to fetch statistics' };
    }
  }
};
