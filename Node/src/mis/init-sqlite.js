import { seedMisIfEmpty, ensureMisMonthRecords } from './seed.js';

export { ensureMisMonthRecords };

export async function initMisSqlite(db) {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS mis_regions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS mis_ad_offices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      region_id INTEGER NOT NULL REFERENCES mis_regions(id)
    );

    CREATE TABLE IF NOT EXISTS mis_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'supervisor', 'ad_user')),
      region_id INTEGER REFERENCES mis_regions(id),
      ad_office_id INTEGER REFERENCES mis_ad_offices(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS mis_plantation_overall (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ad_office_id INTEGER NOT NULL REFERENCES mis_ad_offices(id),
      month TEXT NOT NULL,
      financial_year TEXT NOT NULL,
      base_acre REAL DEFAULT 0,
      base_farmer REAL DEFAULT 0,
      ulm_acre REAL DEFAULT 0,
      ulm_farmer REAL DEFAULT 0,
      dm_acre REAL DEFAULT 0,
      dm_farmer REAL DEFAULT 0,
      UNIQUE(ad_office_id, month, financial_year)
    );

    CREATE TABLE IF NOT EXISTS mis_plantation_scheme (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ad_office_id INTEGER NOT NULL REFERENCES mis_ad_offices(id),
      month TEXT NOT NULL,
      financial_year TEXT NOT NULL,
      scheme_year TEXT NOT NULL,
      category TEXT NOT NULL,
      ulm_acre REAL DEFAULT 0,
      ulm_farmer REAL DEFAULT 0,
      dm_acre REAL DEFAULT 0,
      dm_farmer REAL DEFAULT 0,
      UNIQUE(ad_office_id, month, financial_year, scheme_year, category)
    );

    CREATE TABLE IF NOT EXISTS mis_dfls_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ad_office_id INTEGER NOT NULL REFERENCES mis_ad_offices(id),
      month TEXT NOT NULL,
      financial_year TEXT NOT NULL,
      sheet_type TEXT NOT NULL CHECK(sheet_type IN ('distribution', 'consumption', 'cocoon')),
      ulm_json TEXT NOT NULL DEFAULT '{}',
      dm_json TEXT NOT NULL DEFAULT '{}',
      UNIQUE(ad_office_id, month, financial_year, sheet_type)
    );
  `);

  await seedMisIfEmpty(db);
}
