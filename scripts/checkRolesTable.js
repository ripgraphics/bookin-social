const { Client } = require('pg');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

async function checkRolesTable() {
  const client = new Client({
    connectionString: process.env.DIRECT_URL,
  });

  try {
    await client.connect();
    
    const result = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'roles' 
      ORDER BY ordinal_position
    `);

    console.log('Roles table columns:');
    console.log(JSON.stringify(result.rows, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

checkRolesTable();

