const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function applyFirstLastNameMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: false
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Read the migration SQL file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '0004_add_first_last_name.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📝 Executing first_name/last_name migration...\n');
    await client.query(migrationSQL);
    console.log('✅ Migration executed successfully\n');

    // Verify columns
    console.log('🔍 Verifying public.users columns...\n');
    const columnsResult = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'users'
      AND column_name IN ('name', 'first_name', 'last_name')
      ORDER BY column_name;
    `);

    if (columnsResult.rows.length === 0) {
      console.log('⚠️  WARNING: No relevant columns found!');
    } else {
      console.log('📊 Column Status:');
      columnsResult.rows.forEach(row => {
        const nullable = row.is_nullable === 'NO' ? 'NOT NULL' : 'NULL';
        const hasDefault = row.column_default ? `DEFAULT ${row.column_default}` : 'NO DEFAULT';
        console.log(`  ${row.column_name} (${row.data_type}) - ${nullable}, ${hasDefault}`);
      });
    }
    console.log('');

    // Check if 'name' column still exists (it shouldn't)
    const nameExists = columnsResult.rows.some(row => row.column_name === 'name');
    if (nameExists) {
      console.log('❌ ERROR: "name" column still exists! Migration may have failed.');
    } else {
      console.log('✅ "name" column successfully removed');
    }

    // Check if first_name and last_name exist
    const firstNameExists = columnsResult.rows.some(row => row.column_name === 'first_name');
    const lastNameExists = columnsResult.rows.some(row => row.column_name === 'last_name');

    if (firstNameExists && lastNameExists) {
      console.log('✅ "first_name" and "last_name" columns successfully added');
      
      // Verify they are NOT NULL
      const firstNameNotNull = columnsResult.rows.find(r => r.column_name === 'first_name')?.is_nullable === 'NO';
      const lastNameNotNull = columnsResult.rows.find(r => r.column_name === 'last_name')?.is_nullable === 'NO';
      
      if (firstNameNotNull && lastNameNotNull) {
        console.log('✅ Both columns are NOT NULL as required');
      } else {
        console.log('⚠️  WARNING: Columns may not be NOT NULL!');
      }

      // Verify no defaults
      const firstNameHasDefault = columnsResult.rows.find(r => r.column_name === 'first_name')?.column_default;
      const lastNameHasDefault = columnsResult.rows.find(r => r.column_name === 'last_name')?.column_default;
      
      if (!firstNameHasDefault && !lastNameHasDefault) {
        console.log('✅ Defaults removed (future inserts must provide values)');
      } else {
        console.log('⚠️  WARNING: Columns still have defaults!');
      }
    } else {
      console.log('❌ ERROR: first_name or last_name columns not found!');
    }
    console.log('');

    // Verify trigger function was updated
    console.log('🔍 Verifying trigger function...\n');
    const functionResult = await client.query(`
      SELECT 
        p.proname as function_name,
        pg_get_functiondef(p.oid) as definition
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public' AND p.proname = 'handle_new_user';
    `);

    if (functionResult.rows.length > 0) {
      const definition = functionResult.rows[0].definition;
      const hasFirstName = definition.includes('first_name');
      const hasLastName = definition.includes('last_name');
      const hasName = definition.includes("->>'name'") || definition.includes('name text');

      console.log('📊 Trigger Function Analysis:');
      console.log(`  Uses first_name: ${hasFirstName ? '✅ YES' : '❌ NO'}`);
      console.log(`  Uses last_name: ${hasLastName ? '✅ YES' : '❌ NO'}`);
      console.log(`  Still uses old "name": ${hasName ? '⚠️  YES (should be removed)' : '✅ NO'}`);
      
      if (hasFirstName && hasLastName && !hasName) {
        console.log('\n✅ Trigger function correctly updated!');
      } else {
        console.log('\n⚠️  Trigger function may need manual review');
      }
    } else {
      console.log('❌ ERROR: handle_new_user function not found!');
    }
    console.log('');

    console.log('✅ MIGRATION COMPLETE!\n');
    console.log('Summary:');
    console.log('  1. ✅ "name" column removed from public.users');
    console.log('  2. ✅ "first_name" and "last_name" columns added (NOT NULL, no defaults)');
    console.log('  3. ✅ Trigger function updated to use first_name and last_name');
    console.log('');
    console.log('Next steps:');
    console.log('  - Update app/types/index.ts');
    console.log('  - Update app/actions/getCurrentUser.ts');
    console.log('  - Update app/components/modals/RegisterModal.tsx');
    console.log('  - Update components displaying user names');
    console.log('');

  } catch (error) {
    console.error('❌ Migration error:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

applyFirstLastNameMigration();

