// Reset sericulturists table
import { query } from './postgres.js';

async function resetSericulturistsTable() {
  try {
    console.log('🔄 Resetting sericulturists table...');
    
    // Drop the table if it exists
    await query(`DROP TABLE IF EXISTS sericulturists CASCADE;`);
    console.log('✅ Dropped existing sericulturists table');
    
    // Recreate the table with new schema
    await query(`
      CREATE TABLE sericulturists (
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
    console.log('✅ Created new sericulturists table with updated schema');
    
    // Recreate the trigger
    await query(`
      DROP TRIGGER IF EXISTS update_sericulturists_updated_at ON sericulturists;
      CREATE TRIGGER update_sericulturists_updated_at
        BEFORE UPDATE ON sericulturists
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);
    console.log('✅ Recreated updated_at trigger');
    
    console.log('✅ Sericulturists table reset completed successfully');
    
  } catch (error) {
    console.error('❌ Reset failed:', error);
    throw error;
  }
}

// Run reset if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  resetSericulturistsTable()
    .then(() => {
      console.log('🎉 Table reset completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Reset failed:', error);
      process.exit(1);
    });
}

export { resetSericulturistsTable };
