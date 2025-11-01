require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

async function checkTables() {
  const client = new Client({
    connectionString: process.env.DIRECT_URL,
  });

  try {
    await client.connect();
    console.log('Connected to database\n');

    const tables = ['profiles', 'user_preferences', 'user_sessions', 'user_activity_log', 'two_factor_auth'];

    for (const table of tables) {
      const result = await client.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position;
      `, [table]);

      if (result.rows.length > 0) {
        console.log(`✓ Table '${table}' exists with ${result.rows.length} columns`);
      } else {
        console.log(`✗ Table '${table}' does NOT exist`);
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

checkTables();

