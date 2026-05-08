import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

async function viewDatabase() {
  try {
    const db = await open({
      filename: './database.sqlite',
      driver: sqlite3.Database
    });

    console.log('=== DATABASE TABLES ===');
    
    // Get all tables
    const tables = await db.all("SELECT name FROM sqlite_master WHERE type='table'");
    
    for (const table of tables) {
      console.log(`\n--- Table: ${table.name} ---`);
      
      // Get table schema
      const columns = await db.all(`PRAGMA table_info(${table.name})`);
      console.log('Columns:');
      columns.forEach(col => {
        console.log(`  - ${col.name} (${col.type})`);
      });
      
      // Get all data
      const rows = await db.all(`SELECT * FROM ${table.name}`);
      console.log(`\nData (${rows.length} records):`);
      
      if (rows.length === 0) {
        console.log('  (No data)');
      } else {
        rows.forEach((row, index) => {
          console.log(`  Row ${index + 1}:`, JSON.stringify(row, null, 4));
        });
      }
      
      console.log('---');
    }
    
    await db.close();
  } catch (error) {
    console.error('Error accessing database:', error);
  }
}

viewDatabase();
