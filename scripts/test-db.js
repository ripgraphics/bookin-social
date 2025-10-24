// Simple Supabase Postgres connectivity test using SUPABASE_DB_URL (or DATABASE_URL)
// Loads env from .env.local and runs a trivial SELECT 1

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { Client } = require('pg');

// Load env from .env.local if present
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

const connectionString = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
if (!connectionString) {
  console.error('Missing SUPABASE_DB_URL/DATABASE_URL');
  process.exit(1);
}

const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });

client
  .connect()
  .then(() => client.query('select 1'))
  .then((res) => {
    console.log('DB_OK', res.rows[0]);
    return client.end();
  })
  .catch((err) => {
    console.error('DB_ERROR', err.message || err);
    process.exit(2);
  });


