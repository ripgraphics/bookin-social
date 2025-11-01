const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });

const connectionString = process.env.DIRECT_URL || process.env.SUPABASE_CONNECTION_STRING || process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;

async function main() {
  console.log('🔄 Rolling back RLS optimization...');
  
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log('✅ Connected to database');

    const sql = fs.readFileSync('supabase/migrations/0032_rollback_rls_optimization.sql', 'utf8');
    await client.query(sql);
    
    console.log('✅ Rollback complete - RLS policies restored to original state');
  } catch (error) {
    console.error('❌ Rollback failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();

