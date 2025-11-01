require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function applyMigrations() {
  const client = new Client({
    connectionString: process.env.DIRECT_URL,
  });

  const migrations = [
    '0016_enhance_profiles_table.sql',
    '0017_create_user_preferences.sql',
    '0018_create_user_sessions.sql',
    '0019_create_user_activity_log.sql',
    '0020_create_two_factor_auth.sql'
  ];

  try {
    await client.connect();
    console.log('Connected to database\n');

    for (const migration of migrations) {
      console.log(`Applying migration: ${migration}...`);
      const migrationPath = path.join(__dirname, '../supabase/migrations', migration);
      const migrationSql = fs.readFileSync(migrationPath, 'utf8');
      
      await client.query(migrationSql);
      console.log(`✓ ${migration} applied successfully\n`);
    }

    console.log('All migrations applied successfully!');

  } catch (error) {
    console.error('Error applying migrations:', error);
  } finally {
    await client.end();
  }
}

applyMigrations();

