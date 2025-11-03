const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function seedPMSTestData() {
  const client = new Client({
    connectionString: process.env.SUPABASE_DB_URL || process.env.DATABASE_URL,
    ssl: (process.env.SUPABASE_DB_URL || process.env.DATABASE_URL).includes("sslmode=require") 
      ? { rejectUnauthorized: false } 
      : undefined,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Read the migration SQL file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '0032_seed_pms_test_data.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('🚀 Seeding PMS test data...');
    console.log(`📄 File: ${migrationPath}`);
    console.log(`📊 Size: ${(migrationSQL.length / 1024).toFixed(2)} KB\n`);
    
    await client.query(migrationSQL);
    console.log('✅ Seed migration executed successfully!\n');

    // Verify seeded data
    console.log('🔍 Verifying seeded data...\n');
    
    const verifyQueries = [
      { name: 'Properties', query: 'SELECT COUNT(*) as count FROM public.property_management' },
      { name: 'Assignments', query: 'SELECT COUNT(*) as count FROM public.property_assignments' },
      { name: 'Invoices', query: 'SELECT COUNT(*) as count FROM public.invoices_v2' },
      { name: 'Invoice Line Items', query: 'SELECT COUNT(*) as count FROM public.invoice_line_items' },
      { name: 'Expenses', query: 'SELECT COUNT(*) as count FROM public.property_expenses' },
      { name: 'Payments', query: 'SELECT COUNT(*) as count FROM public.payments' },
      { name: 'Reservations (test)', query: `SELECT COUNT(*) as count FROM public.reservations 
        WHERE total_price IN (1200, 900) OR start_date >= CURRENT_DATE - INTERVAL '40 days'` }
    ];

    console.log('📊 Data Summary:');
    for (const { name, query } of verifyQueries) {
      const result = await client.query(query);
      console.log(`   ${name}: ${result.rows[0].count}`);
    }

    // Get user IDs that own properties (for testing as owner)
    console.log('\n👤 Users with PMS Roles:');
    const ownerResult = await client.query(`
      SELECT DISTINCT u.id, u.email, u.first_name, u.last_name, 'Owner' as role
      FROM public.users u
      JOIN public.property_management pm ON pm.owner_id = u.id
      LIMIT 3
    `);
    
    const hostResult = await client.query(`
      SELECT DISTINCT u.id, u.email, u.first_name, u.last_name, pa.role
      FROM public.users u
      JOIN public.property_assignments pa ON pa.user_id = u.id
      WHERE pa.status = 'active'
      LIMIT 2
    `);
    
    ownerResult.rows.forEach(user => {
      console.log(`   ${user.email} (${user.first_name} ${user.last_name}): ${user.id} [${user.role}]`);
    });
    
    hostResult.rows.forEach(user => {
      console.log(`   ${user.email} (${user.first_name} ${user.last_name}): ${user.id} [${user.role}]`);
    });

    console.log('\n✅ PMS test data seeding completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Use the users above for CRUD testing');
    console.log('   2. Users with properties = Property Owners');
    console.log('   3. Users with assignments = Hosts/Co-Hosts');
    console.log('   4. Run comprehensive CRUD tests');
    console.log('   5. Check browser for PMS dashboard access\n');

  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    if (error.message.includes('NOTICE:')) {
      // PostgreSQL NOTICE messages are not errors
      console.log('\n⚠️  Check the NOTICE messages above for details');
    } else {
      process.exit(1);
    }
  } finally {
    await client.end();
  }
}

seedPMSTestData();

