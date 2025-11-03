const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function verifyPMSTables() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: false
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Check all PMS tables
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

    console.log('📋 Property Management System Tables:');
    console.log('═══════════════════════════════════════\n');
    
    const expectedTables = [
      'financial_transactions',
      'invoice_line_items',
      'invoices_v2',
      'owner_statements',
      'payments',
      'property_assignments',
      'property_expenses',
      'property_management'
    ];
    
    const foundTables = tablesResult.rows.map(r => r.table_name);
    
    expectedTables.forEach(table => {
      if (foundTables.includes(table)) {
        console.log(`  ✅ ${table}`);
      } else {
        console.log(`  ❌ ${table} - MISSING!`);
      }
    });
    
    console.log('\n' + '═══════════════════════════════════════');
    console.log(`\n📊 Status: ${foundTables.length}/${expectedTables.length} tables found`);
    
    if (foundTables.length === expectedTables.length) {
      console.log('\n🎉 All Property Management System tables are present!');
      console.log('\n✅ Phase 1 Backend: Database Ready');
      console.log('\n📋 Next Steps:');
      console.log('   1. Test API endpoints');
      console.log('   2. Create seed data');
      console.log('   3. Build frontend UI');
    } else {
      console.log('\n⚠️  Some tables are missing. Run the migration again.');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

verifyPMSTables();

