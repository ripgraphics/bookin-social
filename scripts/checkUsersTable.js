const { Client } = require('pg');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

async function checkUsersTable() {
  const client = new Client({
    connectionString: process.env.DIRECT_URL,
  });

  try {
    await client.connect();
    console.log('Connected to database\n');

    const result = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'users' 
      ORDER BY ordinal_position
    `);

    console.log('Users table columns:');
    console.log(JSON.stringify(result.rows, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

checkUsersTable();

