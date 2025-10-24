// Safe SQL executor for Supabase migration: splits on semicolons while respecting $$ function bodies
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { Client } = require('pg');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const SQL_PATH = path.resolve(process.cwd(), 'supabase/migrations/0001_init.sql');

function splitSqlRespectingDollar(sql) {
  const statements = [];
  let current = '';
  let inDollar = false;
  let i = 0;
  while (i < sql.length) {
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
      if (stmt && !stmt.startsWith('--')) {
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
  if (tail) statements.push(tail);
  return statements;
}

async function main() {
  if (!fs.existsSync(SQL_PATH)) {
    console.error('Migration file not found:', SQL_PATH);
    process.exit(1);
  }
  const sql = fs.readFileSync(SQL_PATH, 'utf8');
  const statements = splitSqlRespectingDollar(sql);

  const connectionString = process.env.DIRECT_URL || process.env.SUPABASE_CONNECTION_STRING || process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('No connection string in DIRECT_URL/SUPABASE_CONNECTION_STRING/SUPABASE_DB_URL/DATABASE_URL');
    process.exit(1);
  }

  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();

  try {
    for (let idx = 0; idx < statements.length; idx++) {
      const stmt = statements[idx];
      try {
        await client.query(stmt);
        console.log('OK', idx + 1);
      } catch (e) {
        console.error('FAIL', idx + 1, e.message);
        console.error('SQL:', stmt.substring(0, 400));
        process.exit(2);
      }
    }
    console.log('MIGRATION_APPLIED');
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error('ERROR', e.message || e);
  process.exit(2);
});


