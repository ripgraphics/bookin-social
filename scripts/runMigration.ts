import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE in .env.local');
  process.exit(1);
}

async function runMigration() {
  const sqlPath = path.resolve(process.cwd(), 'supabase/migrations/0001_init.sql');
  
  if (!fs.existsSync(sqlPath)) {
    console.error(`Migration file not found: ${sqlPath}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(sqlPath, 'utf8');
  
  console.log('Executing migration via Supabase REST API with service role...');
  
  try {
    // Use Supabase REST API to execute raw SQL via RPC
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY!,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY!}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ query: sql })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Migration failed (${response.status}): ${errorText}`);
    }

    const result = await response.json();
    console.log('Migration executed successfully!', result);
    process.exit(0);
  } catch (error: any) {
    console.error('Migration error:', error.message || error);
    process.exit(1);
  }
}

runMigration();

