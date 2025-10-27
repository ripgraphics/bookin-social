// Apply RLS recursion fix migration to Supabase
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { Client } = require('pg');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const MIGRATION_FILE = 'supabase/migrations/0008_fix_rls_recursion.sql';

function splitSqlRespectingDollar(sql) {
  const statements = [];
  let current = '';
  let inDollar = false;
  let i = 0;
  
  while (i < sql.length) {
    // Handle single-line comments
    if (sql[i] === '-' && sql[i + 1] === '-' && !inDollar) {
      // Skip until end of line
      while (i < sql.length && sql[i] !== '\n') {
        i++;
      }
      current += '\n';
      i++;
      continue;
    }
    
    // Detect start/end of $$ block
    if (sql[i] === '$' && sql[i + 1] === '$') {
      inDollar = !inDollar;
      current += '$$';
      i += 2;
      continue;
    }
    
    const ch = sql[i];
    if (ch === ';' && !inDollar) {
      const stmt = current.trim();
      // Filter out empty statements and comment-only lines
      if (stmt && stmt.length > 0 && !stmt.match(/^--/)) {
        statements.push(stmt);
      }
      current = '';
      i++;
      continue;
    }
    current += ch;
    i++;
  }
  
  const tail = current.trim();
  if (tail && tail.length > 0 && !tail.match(/^--/)) {
    statements.push(tail);
  }
  
  return statements;
}

async function main() {
  const connectionString = process.env.DIRECT_URL || process.env.SUPABASE_CONNECTION_STRING || process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.error('❌ No connection string found in environment variables');
    console.error('   Expected: DIRECT_URL, SUPABASE_CONNECTION_STRING, SUPABASE_DB_URL, or DATABASE_URL');
    process.exit(1);
  }

  console.log('🔌 Connecting to Supabase...');
  const client = new Client({ 
    connectionString, 
    ssl: { rejectUnauthorized: false } 
  });
  
  await client.connect();
  console.log('✅ Connected to database\n');

  try {
    const fullPath = path.resolve(process.cwd(), MIGRATION_FILE);
    
    if (!fs.existsSync(fullPath)) {
      console.error('❌ Migration file not found:', fullPath);
      process.exit(1);
    }

    console.log('📄 Applying RLS recursion fix migration...');
    const sql = fs.readFileSync(fullPath, 'utf8');
    const statements = splitSqlRespectingDollar(sql);

    for (let idx = 0; idx < statements.length; idx++) {
      const stmt = statements[idx];
      try {
        // Log first 100 chars of statement for debugging
        const preview = stmt.replace(/\s+/g, ' ').substring(0, 100);
        console.log(`   Executing ${idx + 1}/${statements.length}: ${preview}...`);
        await client.query(stmt);
        console.log(`   ✅ Success`);
      } catch (e) {
        console.error(`❌ FAILED at statement ${idx + 1}:`, e.message);
        console.error('SQL preview:', stmt.substring(0, 600));
        process.exit(2);
      }
    }

    console.log('\n🎉 RLS recursion fix migration applied successfully!');
    console.log('\n📊 Summary:');
    console.log('   - Dropped redundant admin SELECT policies on amenities');
    console.log('   - Created is_admin() SECURITY DEFINER function');
    console.log('   - Updated all admin write policies to use is_admin()');
    console.log('   - Public users can now view active amenities without recursion');
    console.log('   - Admins can still manage amenities via admin endpoints');
    
  } finally {
    await client.end();
    console.log('\n✅ Database connection closed');
  }
}

main().catch((e) => {
  console.error('\n❌ ERROR:', e.message || e);
  process.exit(2);
});

