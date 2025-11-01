const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });

const connectionString = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;

async function vacuumTable(tableName) {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log(`  ⏳ VACUUM ${tableName}...`);
    await client.query(`VACUUM ${tableName}`);
    console.log(`  ✅ ${tableName} vacuumed`);
  } catch (error) {
    console.error(`  ❌ ${tableName} failed: ${error.message}`);
  } finally {
    await client.end();
  }
}

async function main() {
  console.log('🧹 VACUUM TABLES (Clean up dead rows)');
  console.log('═'.repeat(80));
  
  const tables = [
    'public.profiles',
    'public.listings',
    'public.user_posts',
    'public.conversations',
    'public.messages'
  ];
  
  for (const table of tables) {
    await vacuumTable(table);
  }
  
  console.log('\n✅ VACUUM complete');
}

main();

