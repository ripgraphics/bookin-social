require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

async function checkSchema() {
  const client = new Client({
    connectionString: process.env.DIRECT_URL,
  });

  try {
    await client.connect();
    console.log('Connected to database\n');

    const result = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'products'
      ORDER BY ordinal_position;
    `);

    console.log('Products table schema:');
    console.table(result.rows);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

checkSchema();

