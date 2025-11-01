const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function applyMigration() {
  const client = new Client({
    connectionString: process.env.DIRECT_URL,
  });

  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('✅ Connected successfully\n');

    const migrationPath = path.join(__dirname, '../supabase/migrations/0012_create_app_tables.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('Creating all application tables...\n');

    await client.query(sql);

    console.log('✅ Migration applied successfully!\n');
    console.log('Created tables for:');
    console.log('  - Chat (conversations, messages, participants)');
    console.log('  - Email (emails, recipients, attachments)');
    console.log('  - Calendar (events, attendees)');
    console.log('  - Notes');
    console.log('  - Kanban (boards, columns, cards)');
    console.log('  - Invoices');
    console.log('  - Contacts');
    console.log('  - Tickets');
    console.log('  - Blog Posts');
    console.log('  - eCommerce (products, orders)');

  } catch (error) {
    console.error('❌ Error applying migration:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\nDisconnected from database.');
  }
}

applyMigration();

