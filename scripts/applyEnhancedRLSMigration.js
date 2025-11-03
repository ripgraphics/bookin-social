const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function applyEnhancedRLSMigration() {
  const client = new Client({
    connectionString: process.env.SUPABASE_DB_URL || process.env.DATABASE_URL,
    ssl: (process.env.SUPABASE_DB_URL || process.env.DATABASE_URL).includes("sslmode=require") ? { rejectUnauthorized: false } : undefined,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Read the migration SQL file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '0031_add_pms_enhanced_rls.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('🚀 Executing Enhanced PMS RLS migration...');
    console.log(`📄 File: ${migrationPath}`);
    console.log(`📊 Size: ${(migrationSQL.length / 1024).toFixed(2)} KB\n`);
    
    await client.query(migrationSQL);
    console.log('✅ Migration executed successfully!\n');

    // Verify policies were created
    console.log('🔍 Verifying new RLS policies...\n');
    
    const policiesResult = await client.query(`
      SELECT tablename, policyname, cmd
      FROM pg_policies
      WHERE schemaname = 'public'
      AND tablename IN (
        'property_management',
        'invoices_v2',
        'payments',
        'property_expenses'
      )
      ORDER BY tablename, policyname;
    `);

    console.log('📋 Policies in place:');
    let currentTable = '';
    policiesResult.rows.forEach(row => {
      if (row.tablename !== currentTable) {
        console.log(`\n   📁 ${row.tablename}:`);
        currentTable = row.tablename;
      }
      console.log(`      • ${row.policyname} (${row.cmd})`);
    });

    console.log('\n✅ Enhanced RLS Migration Complete!');
    console.log('✨ All additional security policies are now active\n');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

applyEnhancedRLSMigration();

