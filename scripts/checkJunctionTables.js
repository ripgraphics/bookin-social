const { Client } = require('pg');

async function checkJunctionTables() {
  const client = new Client({ 
    connectionString: process.env.DIRECT_URL 
  });
  
  try {
    await client.connect();
    console.log('Connected to database');
    
    console.log('\n=== CHECKING FOR JUNCTION TABLES ===');
    const junctionTables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE (table_name LIKE '%note%tag%' OR table_name LIKE '%tag%note%') 
        AND table_schema = 'public' 
      ORDER BY table_name;
    `);
    console.log('Junction tables:', junctionTables.rows.map(r => r.table_name));
    
    console.log('\n=== ALL NOTE-RELATED TABLES ===');
    const allTables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name LIKE '%note%' AND table_schema = 'public' 
      ORDER BY table_name;
    `);
    console.log('All note tables:', allTables.rows.map(r => r.table_name));
    
    // Check if there's a notes_tags junction table
    console.log('\n=== CHECKING FOR notes_tags TABLE ===');
    const notesTags = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'notes_tags' AND table_schema = 'public';
    `);
    console.log('notes_tags table exists:', notesTags.rows.length > 0);
    
    if (notesTags.rows.length > 0) {
      const schema = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'notes_tags' AND table_schema = 'public' 
        ORDER BY ordinal_position;
      `);
      console.log('notes_tags schema:');
      console.table(schema.rows);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

checkJunctionTables();
