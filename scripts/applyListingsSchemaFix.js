const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function applyListingsSchemaFix() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: false
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Read the migration SQL file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '0005_fix_listings_schema.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📝 Executing listings schema fix migration...\n');
    await client.query(migrationSQL);
    console.log('✅ Migration executed successfully\n');

    // Verify the fix
    console.log('🔍 Verifying columns were added...\n');
    const columnsResult = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'listings'
      AND column_name IN ('location_value', 'price')
      ORDER BY column_name;
    `);

    if (columnsResult.rows.length === 2) {
      console.log('✅ Both columns successfully added:\n');
      columnsResult.rows.forEach(col => {
        const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
        const hasDefault = col.column_default ? `DEFAULT ${col.column_default}` : 'NO DEFAULT';
        console.log(`  ${col.column_name.padEnd(20)} ${col.data_type.padEnd(10)} ${nullable.padEnd(10)} ${hasDefault}`);
      });
    } else {
      console.log('⚠️  WARNING: Expected 2 columns, found:', columnsResult.rows.length);
    }

    console.log('\n✅ LISTINGS SCHEMA FIX COMPLETE!\n');
    console.log('Next step: Restart dev server and test homepage');

  } catch (error) {
    console.error('❌ Migration error:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

applyListingsSchemaFix();

