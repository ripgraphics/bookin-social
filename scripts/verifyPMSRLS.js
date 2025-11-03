const { Client: PgClient } = require('pg');
require('dotenv').config({ path: '.env.local' });

const databaseUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ Missing SUPABASE_DB_URL or DATABASE_URL environment variable');
  process.exit(1);
}

async function verifyPMSRLS() {
  const client = new PgClient({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes("sslmode=require") ? { rejectUnauthorized: false } : undefined,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Check RLS is enabled on PMS tables
    console.log('🔍 Checking RLS Status on PMS Tables:');
    const tables = [
      'property_management',
      'property_assignments',
      'invoices_v2',
      'invoice_line_items',
      'payments',
      'property_expenses',
      'financial_transactions',
      'owner_statements'
    ];

    for (const table of tables) {
      const { rows } = await client.query(
        `SELECT relname, relrowsecurity FROM pg_class WHERE relname = $1`,
        [table]
      );
      
      if (rows.length > 0) {
        const rlsEnabled = rows[0].relrowsecurity;
        console.log(`   ${rlsEnabled ? '✅' : '❌'} ${table}: RLS ${rlsEnabled ? 'enabled' : 'DISABLED'}`);
      } else {
        console.log(`   ⚠️  ${table}: Table not found`);
      }
    }

    // Count policies per table
    console.log('\n📊 RLS Policies Count:');
    const { rows: policyCounts } = await client.query(`
      SELECT tablename, COUNT(*) as policy_count
      FROM pg_policies
      WHERE schemaname = 'public'
      AND tablename IN (
        'property_management',
        'property_assignments',
        'invoices_v2',
        'invoice_line_items',
        'payments',
        'property_expenses',
        'financial_transactions',
        'owner_statements'
      )
      GROUP BY tablename
      ORDER BY tablename
    `);

    policyCounts.forEach(row => {
      console.log(`   ${row.tablename}: ${row.policy_count} policies`);
    });

    // List all policies
    console.log('\n📋 Detailed Policy List:');
    const { rows: policies } = await client.query(`
      SELECT tablename, policyname, cmd, qual, with_check
      FROM pg_policies
      WHERE schemaname = 'public'
      AND tablename IN (
        'property_management',
        'property_assignments',
        'invoices_v2',
        'invoice_line_items',
        'payments',
        'property_expenses',
        'financial_transactions',
        'owner_statements'
      )
      ORDER BY tablename, policyname
    `);

    let currentTable = '';
    policies.forEach(policy => {
      if (policy.tablename !== currentTable) {
        console.log(`\n   📁 ${policy.tablename}:`);
        currentTable = policy.tablename;
      }
      console.log(`      • ${policy.policyname} (${policy.cmd})`);
    });

    console.log('\n✅ RLS Verification Complete');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

verifyPMSRLS();

