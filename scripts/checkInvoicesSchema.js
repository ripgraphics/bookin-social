const { Client } = require('pg');

async function checkSchema() {
  const client = new Client({ 
    connectionString: process.env.DIRECT_URL 
  });
  
  try {
    await client.connect();
    console.log('Connected to database');
    
    console.log('\n=== INVOICES TABLE SCHEMA ===');
    const invoices = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'invoices' AND table_schema = 'public' 
      ORDER BY ordinal_position;
    `);
    console.table(invoices.rows);
    
    console.log('\n=== CONTACTS TABLE SCHEMA ===');
    const contacts = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'contacts' AND table_schema = 'public' 
      ORDER BY ordinal_position;
    `);
    console.table(contacts.rows);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

checkSchema();
