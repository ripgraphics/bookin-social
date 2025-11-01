const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function applyMigration() {
  const client = new Client({
    connectionString: process.env.DIRECT_URL
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '0022_fix_app_rls_policies.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📝 Applying fixed RLS policies migration...\n');
    
    await client.query(migrationSQL);
    
    console.log('✅ Migration applied successfully!\n');

    // Verify policies were created
    console.log('🔍 Verifying RLS policies...\n');
    
    const verifyQuery = `
      SELECT 
        tablename,
        COUNT(*) as policy_count
      FROM pg_policies 
      WHERE schemaname = 'public' 
      AND tablename IN (
        'notes', 'conversations', 'messages', 'emails', 'calendar_events',
        'kanban_boards', 'kanban_columns', 'invoices', 'invoice_items',
        'contacts', 'blog_posts', 'tickets', 'products', 'orders'
      )
      GROUP BY tablename
      ORDER BY tablename
    `;
    
    const result = await client.query(verifyQuery);
    
    console.log('📊 RLS Policies After Fix:');
    result.rows.forEach(row => {
      console.log(`  - ${row.tablename}: ${row.policy_count} policies`);
    });
    
    console.log(`\n✅ Total: ${result.rows.reduce((sum, row) => sum + parseInt(row.policy_count), 0)} policies`);

  } catch (error) {
    console.error('❌ Error applying migration:', error.message);
    if (error.detail) console.error('Detail:', error.detail);
    if (error.hint) console.error('Hint:', error.hint);
    if (error.position) console.error('Position:', error.position);
    process.exit(1);
  } finally {
    await client.end();
  }
}

applyMigration();

