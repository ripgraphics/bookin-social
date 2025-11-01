const { Pool } = require('pg');

async function checkSchemas() {
  const pool = new Pool({ 
    connectionString: process.env.DIRECT_URL
  });
  
  try {
    console.log('=== DATABASE SCHEMA (SOURCE OF TRUTH) ===\n');
    
    // Get schema for failing tables
    const tables = ['contacts', 'tickets', 'profiles', 'invoices', 'note_folders'];
    
    for (const table of tables) {
      console.log(`\n${table.toUpperCase()} TABLE:`);
      const result = await pool.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = $1
        ORDER BY ordinal_position
      `, [table]);
      
      if (result.rows.length === 0) {
        console.log('  Table does not exist');
      } else {
        result.rows.forEach(row => {
          console.log(`  ${row.column_name} (${row.data_type}) ${row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
        });
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkSchemas();