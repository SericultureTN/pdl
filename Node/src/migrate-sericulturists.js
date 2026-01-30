// Migration script to update sericulturists table structure
import { query } from './postgres.js';

async function migrateSericulturistsTable() {
  try {
    console.log('🔄 Starting sericulturists table migration...');
    
    // Add new columns if they don't exist
    try {
      await query(`ALTER TABLE sericulturists ADD COLUMN IF NOT EXISTS password VARCHAR(255);`);
      console.log('✅ Added password column');
    } catch (err) {
      console.log('ℹ️ Password column might already exist:', err.message);
    }
    
    try {
      await query(`ALTER TABLE sericulturists ADD COLUMN IF NOT EXISTS role VARCHAR(50);`);
      console.log('✅ Added role column');
    } catch (err) {
      console.log('ℹ️ Role column might already exist:', err.message);
    }
    
    try {
      await query(`ALTER TABLE sericulturists ADD COLUMN IF NOT EXISTS ad_office VARCHAR(100);`);
      console.log('✅ Added ad_office column');
    } catch (err) {
      console.log('ℹ️ AD Office column might already exist:', err.message);
    }
    
    // Drop old columns if they exist
    try {
      await query(`ALTER TABLE sericulturists DROP COLUMN IF EXISTS farm_size;`);
      console.log('✅ Dropped farm_size column');
    } catch (err) {
      console.log('ℹ️ farm_size column might not exist:', err.message);
    }
    
    try {
      await query(`ALTER TABLE sericulturists DROP COLUMN IF EXISTS experience_years;`);
      console.log('✅ Dropped experience_years column');
    } catch (err) {
      console.log('ℹ️ experience_years column might not exist:', err.message);
    }
    
    console.log('✅ Sericulturists table migration completed successfully');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run migration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateSericulturistsTable()
    .then(() => {
      console.log('🎉 Migration completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

export { migrateSericulturistsTable };
