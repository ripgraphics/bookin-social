import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { Pool } from 'pg';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const DB_URL = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;

if (!DB_URL) {
  console.error('❌ Missing SUPABASE_DB_URL or DATABASE_URL in .env.local');
  process.exit(1);
}

async function runMigration() {
  const sqlPath = path.resolve(process.cwd(), 'supabase/migrations/0030_property_management_system.sql');
  
  if (!fs.existsSync(sqlPath)) {
    console.error(`❌ Migration file not found: ${sqlPath}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(sqlPath, 'utf8');
  
  console.log('🚀 Executing Property Management System migration...');
  console.log(`📄 File: ${sqlPath}`);
  console.log(`📊 Size: ${(sql.length / 1024).toFixed(2)} KB\n`);

  const pool = new Pool({
    connectionString: DB_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔌 Connecting to database...');
    const client = await pool.connect();
    
    console.log('✅ Connected!\n');
    console.log('📝 Executing migration SQL...');
    
    await client.query(sql);
    
    console.log('✅ Migration executed successfully!\n');
    console.log('📋 Created:');
    console.log('   • 8 tables (property_management, property_assignments, invoices_v2, etc.)');
    console.log('   • 40+ indexes for performance');
    console.log('   • 20+ RLS policies for security');
    console.log('   • 3 helper functions');
    console.log('   • 2 automatic triggers');
    console.log('\n🎉 Property Management System is ready!');
    
    client.release();
    await pool.end();
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Migration error:', error.message);
    
    if (error.message.includes('already exists')) {
      console.log('\n💡 Some tables already exist - this is normal if you ran the migration before.');
      console.log('   Check your Supabase dashboard to verify all tables are present.');
    }
    
    await pool.end();
    process.exit(1);
  }
}

runMigration();

