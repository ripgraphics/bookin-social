// Apply amenities system migration to Supabase
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { Client } = require('pg');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const MIGRATION_FILES = [
  'supabase/migrations/0002_amenities_system.sql',
  'supabase/migrations/0003_seed_amenities.sql'
];

function splitSqlRespectingDollar(sql) {
  const statements = [];
  let current = '';
  let inDollar = false;
  let inComment = false;
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

async function applyMigrationFile(client, filePath) {
  const fullPath = path.resolve(process.cwd(), filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.error('❌ Migration file not found:', fullPath);
    return false;
  }

  console.log('\n📄 Applying migration:', filePath);
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
      return false;
    }
  }

  console.log(`✅ Migration ${filePath} completed successfully`);
  return true;
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
  console.log('✅ Connected to database');

  try {
    for (const migrationFile of MIGRATION_FILES) {
      const success = await applyMigrationFile(client, migrationFile);
      if (!success) {
        console.error('\n❌ Migration failed. Stopping.');
        process.exit(2);
      }
    }
    
    console.log('\n🎉 All amenities migrations applied successfully!');
    console.log('\n📊 Summary:');
    console.log('   - Created amenity_categories table');
    console.log('   - Created amenities table');
    console.log('   - Created listing_amenities table');
    console.log('   - Applied RLS policies');
    console.log('   - Seeded ~70 amenities in 12 categories');
    
  } finally {
    await client.end();
    console.log('\n✅ Database connection closed');
  }
}

main().catch((e) => {
  console.error('\n❌ ERROR:', e.message || e);
  process.exit(2);
});

