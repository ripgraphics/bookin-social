const { Client } = require('pg');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function main() {
  const cs = process.env.DIRECT_URL || process.env.SUPABASE_CONNECTION_STRING || process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
  if (!cs) {
    console.error('No connection string in env');
    process.exit(1);
  }
  const client = new Client({ connectionString: cs, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    const q = `
      select table_name
      from information_schema.tables
      where table_schema = 'public'
        and table_name in ('users','listings','reservations','user_favorites')
      order by table_name
    `;
    const res = await client.query(q);
    console.log('TABLES', res.rows.map(r => r.table_name));
  } finally {
    await client.end();
  }
}

main().catch(e => { console.error('ERROR', e.message || e); process.exit(2); });


