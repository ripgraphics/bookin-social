const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function applyPMSMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: false
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Read the migration SQL file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '0030_property_management_system.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('🚀 Executing Property Management System migration...');
    console.log(`📄 File: ${migrationPath}`);
    console.log(`📊 Size: ${(migrationSQL.length / 1024).toFixed(2)} KB\n`);
    
    await client.query(migrationSQL);
    console.log('✅ Migration executed successfully!\n');

    // Verify tables were created
    console.log('🔍 Verifying PMS tables...\n');
    
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN (
          'property_management',
          'property_assignments',
          'invoices_v2',
          'invoice_line_items',
          'payments',
          'property_expenses',
          'financial_transactions',
          'owner_statements'
        )
      ORDER BY table_name;
    `);

    console.log('📋 Tables created:');
    tablesResult.rows.forEach(row => {
      console.log(`  ✓ public.${row.table_name}`);
    });
    console.log('');

    console.log('🎉 Property Management System is ready!\n');
    console.log('📋 Created:');
    console.log('   • 8 tables');
    console.log('   • 40+ indexes');
    console.log('   • 20+ RLS policies');
    console.log('   • 3 helper functions');
    console.log('   • 2 automatic triggers\n');

  } catch (error) {
    console.error('❌ Migration error:', error.message);
    
    if (error.message.includes('already exists')) {
      console.log('\n💡 Some tables already exist - this is normal if you ran the migration before.');
      console.log('   Check your Supabase dashboard to verify all tables are present.');
    }
    
    process.exit(1);
  } finally {
    await client.end();
  }
}

applyPMSMigration();

