const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function listAllUsers() {
  const client = new Client({
    connectionString: process.env.SUPABASE_DB_URL || process.env.DATABASE_URL,
    ssl: (process.env.SUPABASE_DB_URL || process.env.DATABASE_URL)?.includes("sslmode=require") 
      ? { rejectUnauthorized: false } 
      : undefined,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Query all users with their roles
    const query = `
      SELECT 
        u.id,
        u.email,
        u.first_name,
        u.last_name,
        u.auth_user_id,
        COALESCE(
          json_agg(
            json_build_object(
              'id', r.id,
              'name', r.name,
              'display_name', r.display_name
            )
          ) FILTER (WHERE r.id IS NOT NULL),
          '[]'::json
        ) as roles
      FROM public.users u
      LEFT JOIN public.user_roles ur ON u.id = ur.user_id
      LEFT JOIN public.roles r ON ur.role_id = r.id
      GROUP BY u.id, u.email, u.first_name, u.last_name, u.auth_user_id
      ORDER BY u.email;
    `;

    const result = await client.query(query);
    
    console.log(`📊 Found ${result.rows.length} users:\n`);
    console.log('='.repeat(80));
    
    result.rows.forEach((user, index) => {
      const isTestAccount = user.email !== 'bookin.social34@hotmail.com';
      const roleNames = user.roles.map(r => r.name).join(', ') || 'No roles';
      
      console.log(`\n${index + 1}. ${user.first_name || ''} ${user.last_name || ''} (${isTestAccount ? 'TEST' : 'PERSONAL'})`);
      console.log(`   Email: ${user.email}`);
      console.log(`   User ID: ${user.id}`);
      console.log(`   Auth User ID: ${user.auth_user_id || 'NULL'}`);
      console.log(`   Roles: ${roleNames}`);
    });
    
    console.log('\n' + '='.repeat(80));
    console.log(`\n📝 Summary:`);
    console.log(`   Total users: ${result.rows.length}`);
    console.log(`   Test accounts: ${result.rows.filter(u => u.email !== 'bookin.social34@hotmail.com').length}`);
    console.log(`   Personal account: ${result.rows.filter(u => u.email === 'bookin.social34@hotmail.com').length}`);
    
    return result.rows;
  } catch (error) {
    console.error('❌ Error listing users:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run if called directly
if (require.main === module) {
  listAllUsers()
    .then(() => {
      console.log('\n✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { listAllUsers };

