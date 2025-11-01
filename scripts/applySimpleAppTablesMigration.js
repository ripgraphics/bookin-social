const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function applyMigration() {
  const client = new Client({
    connectionString: process.env.DIRECT_URL,
  });

  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('✅ Connected successfully\n');

    const migrationPath = path.join(__dirname, '../supabase/migrations/0013_create_app_tables_simple.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('Creating all application tables...\n');
    await client.query(sql);

    console.log('✅ All application tables created successfully!\n');
  } catch (error) {
    console.error('❌ Error applying migration:', error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('Disconnected from database.');
  }
}

applyMigration();

