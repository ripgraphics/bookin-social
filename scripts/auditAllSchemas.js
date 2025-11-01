const { Client } = require('pg');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

async function auditAllSchemas() {
  const client = new Client({
    connectionString: process.env.DIRECT_URL,
  });

  try {
    await client.connect();
    console.log('Connected to database\n');
    console.log('========================================');
    console.log('DATABASE SCHEMA AUDIT');
    console.log('========================================\n');

    const appTables = [
      'conversations', 'conversation_participants', 'messages',
      'emails', 'email_recipients', 'email_attachments',
      'calendar_events', 'event_attendees',
      'notes', 'kanban_boards', 'kanban_columns', 'kanban_cards',
      'invoices', 'contacts', 'tickets', 'blog_posts',
      'products', 'orders'
    ];

    const issues = [];

    for (const table of appTables) {
      console.log(`\n--- ${table.toUpperCase()} ---`);
      
      const result = await client.query(`
        SELECT 
          column_name, 
          data_type, 
          is_nullable,
          column_default
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = $1 
        ORDER BY ordinal_position
      `, [table]);

      if (result.rows.length === 0) {
        console.log(`  ❌ TABLE DOES NOT EXIST`);
        issues.push(`${table}: TABLE MISSING`);
        continue;
      }

      const columns = result.rows.map(r => r.column_name);
      console.log(`  Columns: ${columns.join(', ')}`);

      // Check for user_id column (except for tables that don't need it)
      const needsUserId = !['conversation_participants', 'email_recipients', 'email_attachments', 'event_attendees'].includes(table);
      
      if (needsUserId && !columns.includes('user_id')) {
        console.log(`  ❌ MISSING: user_id column`);
        issues.push(`${table}: Missing user_id column`);
      } else if (needsUserId) {
        console.log(`  ✓ Has user_id column`);
      }

      // Check for common required columns
      const requiredColumns = {
        'id': true,
        'created_at': true,
        'updated_at': !['conversation_participants', 'event_attendees', 'email_recipients', 'email_attachments'].includes(table)
      };

      for (const [col, required] of Object.entries(requiredColumns)) {
        if (required && !columns.includes(col)) {
          console.log(`  ❌ MISSING: ${col} column`);
          issues.push(`${table}: Missing ${col} column`);
        }
      }
    }

    console.log('\n\n========================================');
    console.log('ISSUES SUMMARY');
    console.log('========================================\n');
    
    if (issues.length === 0) {
      console.log('✅ No schema issues found!');
    } else {
      console.log(`❌ Found ${issues.length} issues:\n`);
      issues.forEach(issue => console.log(`  - ${issue}`));
    }

    console.log('\n');

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

auditAllSchemas();

