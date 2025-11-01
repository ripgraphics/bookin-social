const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

async function applySchemaFixes() {
  const client = new Client({
    connectionString: process.env.DIRECT_URL,
  });

  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('✅ Connected successfully\n');

    const migrationPath = path.join(__dirname, '../supabase/migrations/0014_fix_schema_mismatches.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('Applying schema fixes...\n');
    await client.query(sql);

    console.log('✅ Schema fixes applied successfully!\n');
    console.log('Fixed:');
    console.log('  ✓ Added user_id to conversations');
    console.log('  ✓ Added created_at to conversation_participants');
    console.log('  ✓ Added user_id to messages');
    console.log('  ✓ Added user_id to emails');
    console.log('  ✓ Added user_id to kanban_columns');
    console.log('  ✓ Added updated_at to kanban_columns');
    console.log('  ✓ Added user_id to kanban_cards');
    console.log('  ✓ Added user_id to products');
    console.log('  ✓ Added user_id to orders');
    console.log('  ✓ Created indexes for performance');

  } catch (error) {
    console.error('❌ Error applying migration:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\nDisconnected from database.');
  }
}

applySchemaFixes();

