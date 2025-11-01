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

    console.log('📋 Applying enterprise apps schema migration...\n');

    // Split SQL into statements by semicolon
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && s !== '');

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      
      // Skip comments
      if (statement.trim().startsWith('--')) continue;
      
      try {
        await client.query(statement);
        successCount++;
        if (statement.includes('CREATE TABLE')) {
          const match = statement.match(/CREATE TABLE.*?public\.(\w+)/);
          if (match) {
            console.log(`  ✓ Created table: ${match[1]}`);
          }
        }
      } catch (error) {
        errorCount++;
        console.error(`  ✗ Error in statement ${i + 1}:`, error.message);
        console.error(`    Statement: ${statement.substring(0, 100)}...`);
        // Continue with next statement instead of failing entirely
      }
    }

    console.log(`\n✅ Migration completed: ${successCount} successful, ${errorCount} errors\n`);

    // Verify tables were created
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema='public' 
      AND table_name LIKE '%'
      AND table_name NOT IN ('schema_migrations', 'spatial_ref_sys')
      ORDER BY table_name
    `);

    console.log('📋 All tables in database:');
    result.rows.forEach(row => console.log(`  ✓ ${row.table_name}`));
    console.log(`\nTotal: ${result.rows.length} tables\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('✅ Database connection closed');
  }
}

applyMigration();

