import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

// PostgreSQL connection configuration
const dbUser = process.env.DB_USER || 'postgres';
const dbPassword = process.env.DB_PASSWORD || 'postgres';
const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = process.env.DB_PORT || '5432';
const dbName = process.env.DB_NAME || 'pdl_local';
const dbUrl = process.env.DATABASE_URL || `postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}`;
console.log('Database URL:', dbUrl);

const pool = new Pool({
  connectionString: dbUrl,
  max: 20, // maximum number of clients in the pool
  idleTimeoutMillis: 30000, // how long a client is allowed to remain idle before being closed
  connectionTimeoutMillis: 2000, // how long to wait when connecting a new client
});

// Test database connection
export const testConnection = async () => {
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    console.log('✅ PostgreSQL connected successfully');
    return true;
  } catch (error) {
    console.error('❌ PostgreSQL connection failed:', error.message);
    return false;
  }
};

// Initialize database schema
export const initializeDatabase = async () => {
  try {
    const client = await pool.connect();
    
    // Create admins table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'super_admin',
        name VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Add role column if it doesn't exist (migration)
    try {
      await client.query(`
        ALTER TABLE admins ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'super_admin';
      `);
      await client.query(`
        ALTER TABLE admins ADD COLUMN IF NOT EXISTS name VARCHAR(255);
      `);
    } catch (err) {
      console.log('ℹ️ Role/name columns might already exist');
    }

    // Create updated_at trigger
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    await client.query(`
      DROP TRIGGER IF EXISTS update_admins_updated_at ON admins;
      CREATE TRIGGER update_admins_updated_at
        BEFORE UPDATE ON admins
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);

    // Create sericulturists table (for users)
    await client.query(`
      CREATE TABLE IF NOT EXISTS sericulturists (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE,
        password VARCHAR(255),
        phone VARCHAR(20),
        address TEXT,
        role VARCHAR(50),
        ad_office VARCHAR(100),
        registration_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      DROP TRIGGER IF EXISTS update_sericulturists_updated_at ON sericulturists;
      CREATE TRIGGER update_sericulturists_updated_at
        BEFORE UPDATE ON sericulturists
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);

    // Create MIS entries table
    await client.query(`
      CREATE TABLE IF NOT EXISTS mis_entries (
        id SERIAL PRIMARY KEY,
        section VARCHAR(10) NOT NULL,
        farmer_name VARCHAR(255) NOT NULL,
        farmer_id VARCHAR(100) NOT NULL,
        address TEXT,
        phone VARCHAR(20),
        district VARCHAR(100) NOT NULL,
        registration_date DATE,
        land_area VARCHAR(50),
        variety VARCHAR(100),
        plantation_date DATE,
        expected_yield VARCHAR(50),
        notes TEXT,
        created_by INTEGER REFERENCES sericulturists(id),
        ad_office VARCHAR(100),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create trigger for mis_entries updated_at
    await client.query(`
      DROP TRIGGER IF EXISTS update_mis_entries_updated_at ON mis_entries;
      CREATE TRIGGER update_mis_entries_updated_at
        BEFORE UPDATE ON mis_entries
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);

    // Create indexes for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_mis_entries_section ON mis_entries(section);
      CREATE INDEX IF NOT EXISTS idx_mis_entries_ad_office ON mis_entries(ad_office);
      CREATE INDEX IF NOT EXISTS idx_mis_entries_created_by ON mis_entries(created_by);
      CREATE INDEX IF NOT EXISTS idx_mis_entries_district ON mis_entries(district);
    `);

    // =====================================================================
    // MIS REPORTING SCHEMA
    // =====================================================================

    // roles
    await client.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id   SERIAL PRIMARY KEY,
        role_name VARCHAR(50) NOT NULL UNIQUE
      );
    `);
    await client.query(`
      INSERT INTO roles (id, role_name) VALUES
        (1, 'Super Admin'),
        (2, 'MIS Admin'),
        (3, 'AD Office User')
      ON CONFLICT (id) DO NOTHING;
    `);

    // regions
    await client.query(`
      CREATE TABLE IF NOT EXISTS regions (
        id          SERIAL PRIMARY KEY,
        region_name VARCHAR(100) NOT NULL UNIQUE
      );
    `);
    await client.query(`
      INSERT INTO regions (region_name) VALUES
        ('Dharmapuri Region'),
        ('Erode Region'),
        ('Vellore Region'),
        ('Trichy Region'),
        ('Madurai Region'),
        ('Seed Coordination, Hosur'),
        ('Govt. Anna Silk Exchange, Kancheepuram'),
        ('TNSTI, Hosur')
      ON CONFLICT (region_name) DO NOTHING;
    `);

    // ad_offices
    await client.query(`
      CREATE TABLE IF NOT EXISTS ad_offices (
        id          SERIAL PRIMARY KEY,
        region_id   INTEGER REFERENCES regions(id),
        office_name VARCHAR(100) NOT NULL UNIQUE,
        office_code VARCHAR(20),
        is_active   BOOLEAN DEFAULT TRUE
      );
    `);
    // Seed all 27 AD offices
    await client.query(`
      INSERT INTO ad_offices (region_id, office_name, office_code) VALUES
        ((SELECT id FROM regions WHERE region_name='Dharmapuri Region'), 'AD Dharmapuri',              'ADO-01'),
        ((SELECT id FROM regions WHERE region_name='Dharmapuri Region'), 'AD Pennagaram',              'ADO-02'),
        ((SELECT id FROM regions WHERE region_name='Dharmapuri Region'), 'AD Krishnagiri',             'ADO-03'),
        ((SELECT id FROM regions WHERE region_name='Dharmapuri Region'), 'AD Krishnagiri Grainage',    'ADO-04'),
        ((SELECT id FROM regions WHERE region_name='Dharmapuri Region'), 'AD Denkanikottai',           'ADO-05'),
        ((SELECT id FROM regions WHERE region_name='Dharmapuri Region'), 'AD Hosur',                   'ADO-06'),
        ((SELECT id FROM regions WHERE region_name='Dharmapuri Region'), 'AD Hosur Grainage',          'ADO-07'),
        ((SELECT id FROM regions WHERE region_name='Erode Region'),      'AD Salem',                   'ADO-08'),
        ((SELECT id FROM regions WHERE region_name='Erode Region'),      'AD Erode',                   'ADO-09'),
        ((SELECT id FROM regions WHERE region_name='Erode Region'),      'AD Talavady',                'ADO-10'),
        ((SELECT id FROM regions WHERE region_name='Erode Region'),      'AD Madhahalli',              'ADO-11'),
        ((SELECT id FROM regions WHERE region_name='Erode Region'),      'AD Coimbatore',              'ADO-12'),
        ((SELECT id FROM regions WHERE region_name='Erode Region'),      'AD Udumalaipettai',          'ADO-13'),
        ((SELECT id FROM regions WHERE region_name='Erode Region'),      'AD Coonoor',                 'ADO-14'),
        ((SELECT id FROM regions WHERE region_name='Vellore Region'),    'AD Vaniyambadi',             'ADO-15'),
        ((SELECT id FROM regions WHERE region_name='Vellore Region'),    'AD Villupuram',              'ADO-16'),
        ((SELECT id FROM regions WHERE region_name='Vellore Region'),    'AD Tiruvannamalai',          'ADO-17'),
        ((SELECT id FROM regions WHERE region_name='Trichy Region'),     'AD Trichy',                  'ADO-18'),
        ((SELECT id FROM regions WHERE region_name='Trichy Region'),     'AD Namakkal',                'ADO-19'),
        ((SELECT id FROM regions WHERE region_name='Madurai Region'),    'AD Dindigul',                'ADO-20'),
        ((SELECT id FROM regions WHERE region_name='Madurai Region'),    'AD Theni',                   'ADO-21'),
        ((SELECT id FROM regions WHERE region_name='Madurai Region'),    'AD Tenkasi',                 'ADO-22'),
        ((SELECT id FROM regions WHERE region_name='Seed Coordination, Hosur'),                    'AD Avalapalli',    'ADO-23'),
        ((SELECT id FROM regions WHERE region_name='Seed Coordination, Hosur'),                    'AD Kalkondapalli', 'ADO-24'),
        ((SELECT id FROM regions WHERE region_name='Seed Coordination, Hosur'),                    'AD Kollatti',      'ADO-25'),
        ((SELECT id FROM regions WHERE region_name='Govt. Anna Silk Exchange, Kancheepuram'),      'AD Kancheepuram',  'ADO-26'),
        ((SELECT id FROM regions WHERE region_name='TNSTI, Hosur'),                                'AD TNSTI, Hosur',  'ADO-27')
      ON CONFLICT (office_name) DO NOTHING;
    `);

    // financial_years
    await client.query(`
      CREATE TABLE IF NOT EXISTS financial_years (
        id        SERIAL PRIMARY KEY,
        year_name VARCHAR(20) NOT NULL UNIQUE
      );
    `);
    await client.query(`
      INSERT INTO financial_years (year_name) VALUES
        ('2022-23'), ('2023-24'), ('2024-25'), ('2025-26'), ('2026-27')
      ON CONFLICT (year_name) DO NOTHING;
    `);

    // months
    await client.query(`
      CREATE TABLE IF NOT EXISTS months (
        id          SERIAL PRIMARY KEY,
        month_name  VARCHAR(20) NOT NULL UNIQUE,
        month_order INTEGER NOT NULL
      );
    `);
    await client.query(`
      INSERT INTO months (month_name, month_order) VALUES
        ('April',1),('May',2),('June',3),('July',4),('August',5),('September',6),
        ('October',7),('November',8),('December',9),('January',10),('February',11),('March',12)
      ON CONFLICT (month_name) DO NOTHING;
    `);

    // schemes
    await client.query(`
      CREATE TABLE IF NOT EXISTS schemes (
        id          SERIAL PRIMARY KEY,
        scheme_name VARCHAR(100) NOT NULL UNIQUE,
        is_active   BOOLEAN DEFAULT TRUE
      );
    `);
    await client.query(`
      INSERT INTO schemes (scheme_name) VALUES
        ('Plantation Overall'),
        ('Plantation Scheme 2024-25'),
        ('Plantation Scheme 2025-26'),
        ('DFLs Distribution'),
        ('DFLs Consumption'),
        ('Cocoon Production')
      ON CONFLICT (scheme_name) DO NOTHING;
    `);

    // targets
    await client.query(`
      CREATE TABLE IF NOT EXISTS targets (
        id                  SERIAL PRIMARY KEY,
        office_id           INTEGER NOT NULL REFERENCES ad_offices(id),
        scheme_id           INTEGER NOT NULL REFERENCES schemes(id),
        financial_year_id   INTEGER NOT NULL REFERENCES financial_years(id),
        target_acre         NUMERIC(12,2) DEFAULT 0,
        target_farmer       INTEGER DEFAULT 0,
        created_at          TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(office_id, scheme_id, financial_year_id)
      );
    `);

    // mis_reports (main table)
    await client.query(`
      CREATE TABLE IF NOT EXISTS mis_reports (
        id                  SERIAL PRIMARY KEY,
        office_id           INTEGER NOT NULL REFERENCES ad_offices(id),
        region_id           INTEGER NOT NULL REFERENCES regions(id),
        scheme_id           INTEGER NOT NULL REFERENCES schemes(id),
        financial_year_id   INTEGER NOT NULL REFERENCES financial_years(id),
        month_id            INTEGER NOT NULL REFERENCES months(id),
        target_acre         NUMERIC(12,2) DEFAULT 0,
        target_farmer       INTEGER DEFAULT 0,
        ulm_acre            NUMERIC(12,2) DEFAULT 0,
        ulm_farmer          INTEGER DEFAULT 0,
        dm_acre             NUMERIC(12,2) DEFAULT 0,
        dm_farmer           INTEGER DEFAULT 0,
        um_acre             NUMERIC(12,2) DEFAULT 0,
        um_farmer           INTEGER DEFAULT 0,
        status              VARCHAR(20) DEFAULT 'Draft'
                              CHECK (status IN ('Draft','Submitted','Approved','Rejected')),
        submitted_by        INTEGER REFERENCES sericulturists(id),
        submitted_at        TIMESTAMP WITH TIME ZONE,
        created_at          TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at          TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(office_id, scheme_id, financial_year_id, month_id)
      );
    `);

    await client.query(`
      DROP TRIGGER IF EXISTS update_mis_reports_updated_at ON mis_reports;
      CREATE TRIGGER update_mis_reports_updated_at
        BEFORE UPDATE ON mis_reports
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_mis_reports_office   ON mis_reports(office_id);
      CREATE INDEX IF NOT EXISTS idx_mis_reports_scheme   ON mis_reports(scheme_id);
      CREATE INDEX IF NOT EXISTS idx_mis_reports_fy       ON mis_reports(financial_year_id);
      CREATE INDEX IF NOT EXISTS idx_mis_reports_month    ON mis_reports(month_id);
      CREATE INDEX IF NOT EXISTS idx_mis_reports_status   ON mis_reports(status);
    `);

    client.release();
    console.log('✅ Database schema initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    return false;
  }
};

// Generic query function
export const query = async (text, params) => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('📊 Query executed:', { text, duration, rows: result.rowCount });
    return result;
  } catch (error) {
    console.error('❌ Query error:', { text, error: error.message });
    throw error;
  }
};

// Transaction helper
export const transaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// Graceful shutdown
export const closePool = async () => {
  await pool.end();
  console.log('🔒 Database connection pool closed');
};

export default pool;
