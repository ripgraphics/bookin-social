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

    console.log('📋 Extracting CREATE TABLE statements...\n');

    // Extract only CREATE TABLE statements
    const createTableStatements = [];
    const lines = sql.split('\n');
    let currentStatement = '';
    let inCreateTable = false;

    for (const line of lines) {
      if (line.trim().startsWith('CREATE TABLE')) {
        inCreateTable = true;
        currentStatement = line + '\n';
      } else if (inCreateTable) {
        currentStatement += line + '\n';
        if (line.trim().endsWith(');')) {
          createTableStatements.push(currentStatement.trim());
          currentStatement = '';
          inCreateTable = false;
        }
      }
    }

    console.log(`Found ${createTableStatements.length} CREATE TABLE statements\n`);

    // Execute each CREATE TABLE statement
    for (const statement of createTableStatements) {
      try {
        await client.query(statement);
        const match = statement.match(/CREATE TABLE.*?public\.(\w+)/);
        if (match) {
          console.log(`  ✓ Created table: ${match[1]}`);
        }
      } catch (error) {
        console.error(`  ✗ Error creating table:`, error.message);
      }
    }

    console.log(`\n✅ Table creation completed\n`);

    // Verify tables were created
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema='public' 
      AND table_name IN (
        'conversations', 'messages', 'conversation_participants', 'message_attachments',
        'emails', 'email_recipients', 'email_attachments',
        'calendar_events', 'event_attendees',
        'notes', 'note_folders', 'tags',
        'kanban_boards', 'kanban_columns', 'kanban_cards',
        'invoices', 'invoice_items',
        'contacts', 'contact_groups',
        'tickets', 'ticket_comments',
        'blog_posts', 'blog_categories',
        'products', 'product_variants', 'orders'
      )
      ORDER BY table_name
    `);

    console.log('📋 App tables created:');
    result.rows.forEach(row => console.log(`  ✓ ${row.table_name}`));
    console.log(`\nTotal: ${result.rows.length} app tables\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('✅ Database connection closed');
  }
}

applyMigration();

