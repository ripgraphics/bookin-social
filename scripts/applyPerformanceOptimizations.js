const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });

const connectionString = process.env.DIRECT_URL || process.env.SUPABASE_CONNECTION_STRING || process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ Missing database connection string in .env.local');
  console.error('   Required: SUPABASE_DB_URL or DATABASE_URL');
  process.exit(1);
}

async function runMigration(client, migrationFile) {
  const migrationPath = path.resolve(process.cwd(), 'supabase/migrations', migrationFile);
  
  if (!fs.existsSync(migrationPath)) {
    console.error(`❌ Migration file not found: ${migrationPath}`);
    return false;
  }

  const sql = fs.readFileSync(migrationPath, 'utf8');
  console.log(`\n📄 Running migration: ${migrationFile}`);
  console.log('━'.repeat(60));

  try {
    // Execute the entire SQL file as one transaction
    console.log(`  Executing migration...`);
    await client.query(sql);
    console.log(`✅ ${migrationFile} completed successfully`);
    return true;
  } catch (error) {
    console.error(`❌ Migration failed: ${error.message}`);
    console.error('Full error:', error);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting Performance Optimization Migrations');
  console.log('━'.repeat(60));

  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log('✅ Connected to Supabase database');

    const migrations = [
      '0029_optimize_permissions_rpc.sql',
      '0030_add_composite_indexes.sql',
      '0031_optimize_rls_policies.sql'
    ];

    for (const migration of migrations) {
      const success = await runMigration(client, migration);
      if (!success) {
        console.error(`\n❌ Migration ${migration} failed. Stopping.`);
        process.exit(1);
      }
    }

    console.log('\n━'.repeat(60));
    console.log('✅ All performance optimization migrations completed successfully!');
    console.log('\n📊 Expected improvements:');
    console.log('  • Page load time: 8-10s → 2-3s (70% faster)');
    console.log('  • RPC function: 2-3s → 0.5-0.8s');
    console.log('  • RLS overhead: 100-200ms → 10-20ms per query');
    console.log('\n🧪 Next steps:');
    console.log('  1. Test profile page load time');
    console.log('  2. Verify authentication works');
    console.log('  3. Test RBAC features');
    console.log('  4. Monitor Supabase logs for errors');
    console.log('━'.repeat(60));
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main().catch(console.error);
