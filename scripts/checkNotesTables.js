const { Client } = require('pg');

async function checkNotesTables() {
  const client = new Client({ 
    connectionString: process.env.DIRECT_URL 
  });
  
  try {
    await client.connect();
    console.log('Connected to database');
    
    console.log('\n=== NOTES-RELATED TABLES ===');
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name LIKE '%note%' AND table_schema = 'public' 
      ORDER BY table_name;
    `);
    console.log('Notes tables:', tables.rows.map(r => r.table_name));
    
    if (tables.rows.length > 0) {
      for (const table of tables.rows) {
        console.log(`\n=== ${table.table_name.toUpperCase()} SCHEMA ===`);
        const schema = await client.query(`
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_name = '${table.table_name}' AND table_schema = 'public' 
          ORDER BY ordinal_position;
        `);
        console.table(schema.rows);
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

checkNotesTables();
