import express from 'express';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';

const router = express.Router();

// Get all tables and their data
router.get('/view', async (req, res) => {
  try {
    const db = await open({
      filename: './database.sqlite',
      driver: sqlite3.Database
    });

    const tables = await db.all("SELECT name FROM sqlite_master WHERE type='table'");
    const result = {};

    for (const table of tables) {
      if (table.name === 'sqlite_sequence') continue; // Skip internal table
      
      // Get table schema
      const columns = await db.all(`PRAGMA table_info(${table.name})`);
      
      // Get all data
      const rows = await db.all(`SELECT * FROM ${table.name}`);
      
      result[table.name] = {
        columns: columns,
        data: rows,
        count: rows.length
      };
    }

    await db.close();
    
    res.json({
      ok: true,
      database: result
    });
  } catch (error) {
    console.error('Database viewer error:', error);
    res.status(500).json({ error: 'Failed to view database' });
  }
});

export default router;
