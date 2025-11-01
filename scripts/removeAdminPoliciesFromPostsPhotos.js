const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function removeAdminPolicies() {
  const client = new Client({
    connectionString: process.env.DIRECT_URL,
  });

  try {
    console.log('✅ Connecting to database...');
    await client.connect();
    console.log('✅ Connected successfully\n');

    console.log('📝 Removing recursive admin policies...');
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '0027_remove_user_posts_photos_admin_policies.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    await client.query(migrationSQL);
    console.log('✅ Admin policies removed successfully\n');

    // Verify policies
    console.log('🔍 Verifying policies...');
    const rlsResult = await client.query(`
      SELECT tablename, policyname, cmd
      FROM pg_policies
      WHERE schemaname = 'public' 
      AND tablename IN ('user_posts', 'user_photos')
      ORDER BY tablename, policyname;
    `);
    console.log('Remaining policies:');
    rlsResult.rows.forEach(policy => {
      console.log(`  - ${policy.tablename}: ${policy.policyname} (${policy.cmd})`);
    });

    console.log('\n✅ Migration completed successfully!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n✅ Database connection closed');
  }
}

removeAdminPolicies();

