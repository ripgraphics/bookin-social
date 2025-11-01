const { Client } = require('pg');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

async function checkAllTables() {
  const client = new Client({
    connectionString: process.env.DIRECT_URL,
  });

  try {
    await client.connect();
    console.log('Connected to database\n');

    // Get all tables in public schema
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);

    console.log('=== EXISTING TABLES IN PUBLIC SCHEMA ===\n');
    console.log(tablesResult.rows.map(r => r.table_name).join('\n'));
    console.log('\n');

    // Check if app tables exist
    const appTables = [
      'conversations', 'conversation_participants', 'messages',
      'emails', 'email_recipients', 'email_attachments',
      'calendar_events', 'event_attendees',
      'notes', 'kanban_boards', 'kanban_columns', 'kanban_cards',
      'invoices', 'contacts', 'tickets', 'blog_posts',
      'products', 'orders'
    ];

    console.log('=== APP TABLES STATUS ===\n');
    for (const table of appTables) {
      const exists = tablesResult.rows.some(r => r.table_name === table);
      console.log(`${exists ? '✓' : '✗'} ${table}`);
    }

    // Check users table columns
    console.log('\n=== USERS TABLE COLUMNS ===\n');
    const usersColumns = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'users' 
      ORDER BY ordinal_position
    `);
    
    usersColumns.rows.forEach(col => {
      console.log(`${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

checkAllTables();

