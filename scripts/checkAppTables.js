const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function checkTables() {
  const client = new Client({
    connectionString: process.env.DIRECT_URL
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Check which app tables exist
    const tablesQuery = `
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename IN (
        'conversations', 'messages', 'conversation_participants',
        'notes', 'emails', 'calendar_events', 
        'kanban_boards', 'kanban_columns', 'kanban_tasks',
        'invoices', 'invoice_items', 'contacts',
        'blog_posts', 'tickets', 'products', 'orders'
      )
      ORDER BY tablename
    `;
    
    const tablesResult = await client.query(tablesQuery);
    console.log('📋 App Tables Found:');
    console.log(tablesResult.rows.map(r => `  - ${r.tablename}`).join('\n'));
    console.log(`\nTotal: ${tablesResult.rows.length} tables\n`);

    // Check RLS policies for notes table
    if (tablesResult.rows.some(r => r.tablename === 'notes')) {
      console.log('🔒 Checking RLS Policies for NOTES table:');
      const notesRLSQuery = `
        SELECT 
          policyname,
          cmd as command,
          qual as using_expression,
          with_check as with_check_expression
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'notes'
        ORDER BY policyname
      `;
      const notesRLS = await client.query(notesRLSQuery);
      
      if (notesRLS.rows.length === 0) {
        console.log('  ❌ NO RLS POLICIES FOUND FOR NOTES TABLE!');
      } else {
        notesRLS.rows.forEach(policy => {
          console.log(`  - ${policy.policyname} (${policy.command})`);
        });
      }
      console.log('');
    }

    // Check RLS policies for conversations table
    if (tablesResult.rows.some(r => r.tablename === 'conversations')) {
      console.log('🔒 Checking RLS Policies for CONVERSATIONS table:');
      const convRLSQuery = `
        SELECT 
          policyname,
          cmd as command
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'conversations'
        ORDER BY policyname
      `;
      const convRLS = await client.query(convRLSQuery);
      
      if (convRLS.rows.length === 0) {
        console.log('  ❌ NO RLS POLICIES FOUND FOR CONVERSATIONS TABLE!');
      } else {
        convRLS.rows.forEach(policy => {
          console.log(`  - ${policy.policyname} (${policy.command})`);
        });
      }
      console.log('');
    }

    // Check RLS policies for messages table
    if (tablesResult.rows.some(r => r.tablename === 'messages')) {
      console.log('🔒 Checking RLS Policies for MESSAGES table:');
      const msgRLSQuery = `
        SELECT 
          policyname,
          cmd as command
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'messages'
        ORDER BY policyname
      `;
      const msgRLS = await client.query(msgRLSQuery);
      
      if (msgRLS.rows.length === 0) {
        console.log('  ❌ NO RLS POLICIES FOUND FOR MESSAGES TABLE!');
      } else {
        msgRLS.rows.forEach(policy => {
          console.log(`  - ${policy.policyname} (${policy.command})`);
        });
      }
      console.log('');
    }

    // Check notes table schema
    if (tablesResult.rows.some(r => r.tablename === 'notes')) {
      console.log('📊 NOTES Table Schema:');
      const notesSchemaQuery = `
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public' 
        AND table_name = 'notes'
        ORDER BY ordinal_position
      `;
      const notesSchema = await client.query(notesSchemaQuery);
      notesSchema.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : ''}`);
      });
      console.log('');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkTables();

