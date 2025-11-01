const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function testTables() {
  const client = new Client({
    connectionString: process.env.DIRECT_URL,
  });

  try {
    console.log('✅ Connecting to database...');
    await client.connect();
    console.log('✅ Connected successfully\n');

    // Check if tables exist
    console.log('📝 Checking if tables exist...');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('user_posts', 'user_photos');
    `);
    console.log('Found tables:', tablesResult.rows.map(r => r.table_name));
    
    if (tablesResult.rows.length === 0) {
      console.log('❌ Tables do not exist!');
      return;
    }

    // Check RLS policies
    console.log('\n📝 Checking RLS policies...');
    const rlsResult = await client.query(`
      SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
      FROM pg_policies
      WHERE schemaname = 'public' 
      AND tablename IN ('user_posts', 'user_photos');
    `);
    console.log('RLS Policies:', rlsResult.rows.length);
    rlsResult.rows.forEach(policy => {
      console.log(`  - ${policy.tablename}: ${policy.policyname} (${policy.cmd})`);
    });

    // Check if data exists
    console.log('\n📝 Checking data...');
    const postsCount = await client.query('SELECT COUNT(*) FROM public.user_posts');
    const photosCount = await client.query('SELECT COUNT(*) FROM public.user_photos');
    console.log(`Posts: ${postsCount.rows[0].count}`);
    console.log(`Photos: ${photosCount.rows[0].count}`);

    // Test a simple query
    console.log('\n📝 Testing query...');
    const testQuery = await client.query(`
      SELECT * FROM public.user_posts LIMIT 1;
    `);
    console.log('Test query result:', testQuery.rows.length > 0 ? 'Success' : 'No data');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await client.end();
    console.log('\n✅ Database connection closed');
  }
}

testTables();

