export async function initMisPostgres(db) {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS mis_plantation_overall (
      id SERIAL PRIMARY KEY,
      ad_office_id INTEGER NOT NULL REFERENCES poc_offices(id),
      month VARCHAR(50) NOT NULL,
      financial_year VARCHAR(20) NOT NULL,
      base_acre DOUBLE PRECISION DEFAULT 0,
      base_farmer DOUBLE PRECISION DEFAULT 0,
      ulm_acre DOUBLE PRECISION DEFAULT 0,
      ulm_farmer DOUBLE PRECISION DEFAULT 0,
      dm_acre DOUBLE PRECISION DEFAULT 0,
      dm_farmer DOUBLE PRECISION DEFAULT 0,
      UNIQUE(ad_office_id, month, financial_year)
    );

    CREATE TABLE IF NOT EXISTS mis_plantation_scheme (
      id SERIAL PRIMARY KEY,
      ad_office_id INTEGER NOT NULL REFERENCES poc_offices(id),
      month VARCHAR(50) NOT NULL,
      financial_year VARCHAR(20) NOT NULL,
      scheme_year VARCHAR(20) NOT NULL,
      category VARCHAR(50) NOT NULL,
      ulm_acre DOUBLE PRECISION DEFAULT 0,
      ulm_farmer DOUBLE PRECISION DEFAULT 0,
      dm_acre DOUBLE PRECISION DEFAULT 0,
      dm_farmer DOUBLE PRECISION DEFAULT 0,
      UNIQUE(ad_office_id, month, financial_year, scheme_year, category)
    );

    CREATE TABLE IF NOT EXISTS mis_dfls_data (
      id SERIAL PRIMARY KEY,
      ad_office_id INTEGER NOT NULL REFERENCES poc_offices(id),
      month VARCHAR(50) NOT NULL,
      financial_year VARCHAR(20) NOT NULL,
      sheet_type VARCHAR(50) NOT NULL CHECK(sheet_type IN ('distribution', 'consumption', 'cocoon')),
      ulm_json TEXT NOT NULL DEFAULT '{}',
      dm_json TEXT NOT NULL DEFAULT '{}',
      UNIQUE(ad_office_id, month, financial_year, sheet_type)
    );
  `);

  console.log('✅ MIS PostgreSQL schema ready');
}

export { ensureMisMonthRecords } from './seed.js';
