const { createClient } = require('@supabase/supabase-js');
const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

const TEST_PASSWORD = 'TestPMS2024!';
const PERSONAL_EMAIL = 'bookin.social34@hotmail.com';

async function resetTestPasswords() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  // Connect to database to get users
  const dbClient = new Client({
    connectionString: process.env.SUPABASE_DB_URL || process.env.DATABASE_URL,
    ssl: (process.env.SUPABASE_DB_URL || process.env.DATABASE_URL)?.includes("sslmode=require") 
      ? { rejectUnauthorized: false } 
      : undefined,
  });

  try {
    await dbClient.connect();
    console.log('✅ Connected to database\n');

    // Get all users except personal account
    const { rows: users } = await dbClient.query(`
      SELECT id, email, auth_user_id
      FROM public.users
      WHERE email != $1
      ORDER BY email
    `, [PERSONAL_EMAIL]);

    console.log(`📝 Found ${users.length} test users to reset passwords for\n`);
    console.log('='.repeat(80));

    const results = [];

    for (const user of users) {
      if (!user.auth_user_id) {
        console.log(`⚠️  Skipping ${user.email} - no auth_user_id`);
        results.push({ email: user.email, success: false, reason: 'No auth_user_id' });
        continue;
      }

      try {
        // Update password using Supabase Admin API
        const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
          user.auth_user_id,
          { password: TEST_PASSWORD }
        );

        if (error) {
          console.log(`❌ ${user.email}: ${error.message}`);
          results.push({ email: user.email, success: false, reason: error.message });
        } else {
          console.log(`✅ ${user.email}: Password reset successfully`);
          results.push({ email: user.email, success: true });
        }
      } catch (err) {
        console.log(`❌ ${user.email}: ${err.message}`);
        results.push({ email: user.email, success: false, reason: err.message });
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('\n📊 Summary:');
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    console.log(`   ✅ Successful: ${successful}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`   🔑 Test password: ${TEST_PASSWORD}`);
    console.log(`\n   ⚠️  Personal account (${PERSONAL_EMAIL}) was skipped`);

    if (failed > 0) {
      console.log('\n❌ Failed users:');
      results.filter(r => !r.success).forEach(r => {
        console.log(`   - ${r.email}: ${r.reason}`);
      });
    }

    return results;
  } catch (error) {
    console.error('❌ Error resetting passwords:', error);
    throw error;
  } finally {
    await dbClient.end();
  }
}

// Run if called directly
if (require.main === module) {
  resetTestPasswords()
    .then(() => {
      console.log('\n✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { resetTestPasswords };

