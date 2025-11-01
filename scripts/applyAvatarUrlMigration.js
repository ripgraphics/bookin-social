const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function applyMigration() {
  const client = new Client({
    connectionString: process.env.DIRECT_URL
  });
  
  try {
    await client.connect();
    console.log('✅ Connected to database');

    const sql = fs.readFileSync(
      path.join(__dirname, '..', 'supabase', 'migrations', '0028_add_avatar_url_to_profiles.sql'),
      'utf8'
    );

    console.log('📝 Applying migration: 0028_add_avatar_url_to_profiles.sql');
    await client.query(sql);
    
    console.log('✅ Migration applied successfully!');
  } catch (error) {
    console.error('❌ Failed to apply migration:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('✅ Database connection closed');
  }
}

applyMigration();

