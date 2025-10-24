const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function testConnection() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: false
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Test listings query
    const result = await client.query('SELECT COUNT(*) FROM listings');
    console.log('📊 Listings count:', result.rows[0].count);

    // Get a sample listing
    const sampleResult = await client.query('SELECT * FROM listings LIMIT 1');
    if (sampleResult.rows.length > 0) {
      console.log('📋 Sample listing:', sampleResult.rows[0]);
    } else {
      console.log('📋 No listings found');
    }

  } catch (error) {
    console.error('❌ Database connection error:', error.message);
  } finally {
    await client.end();
  }
}

testConnection();
