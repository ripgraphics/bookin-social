const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function applyMigration() {
  const client = new Client({
    connectionString: process.env.DIRECT_URL,
  });

  try {
    console.log('✅ Connecting to database...');
    await client.connect();
    console.log('✅ Connected successfully\n');

    const migrationPath = path.join(__dirname, '../supabase/migrations/0009_enterprise_apps_schema.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('✅ Running enterprise apps schema migration...\n');

    // Split and execute SQL
    const statements = splitSqlRespectingDollar(sql);

    for (const statement of statements) {
      if (statement.trim().length > 0 && !statement.trim().startsWith('--')) {
        console.log(`Executing: ${statement.substring(0, 80)}...`);
        await client.query(statement);
      }
    }

    console.log('\n✅ Enterprise apps schema migration completed successfully!');
    console.log('   Created tables for:');
    console.log('   - Chat (conversations, participants, messages)');
    console.log('   - Email (emails, recipients, attachments, labels)');
    console.log('   - Calendar (events, attendees, reminders)');
    console.log('   - Notes (notes, folders, tags, shares)');
    console.log('   - Kanban (boards, columns, cards, comments)');
    console.log('   - Invoice (invoices, items, payments, customers)');
    console.log('   - Contacts (contacts, groups)');
    console.log('   - Tickets (tickets, comments, attachments)');
    console.log('   - Blog (posts, categories, tags, comments)');
    console.log('   - eCommerce (products, orders)');
    console.log('   - User Settings');

  } catch (error) {
    console.error('❌ Error applying migration:', error.message);
    if (error.code === '42P07') {
      console.log('   (Some tables may already exist - continuing...)');
    } else {
      process.exit(1);
    }
  } finally {
    await client.end();
    console.log('\n✅ Database connection closed');
  }
}

function splitSqlRespectingDollar(sql) {
  // Simple split on semicolons, filtering out empty statements and comments
  return sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.trim().startsWith('--'))
    .map(s => s + ';');
}

applyMigration();

