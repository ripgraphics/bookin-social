// ⚠️ DEPRECATED: This script uses the OLD schema design
// Use scripts/backfillEnterpriseSchema.js instead
// This script is kept for reference only

const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function backfillUsers() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: false
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Step 1: Backfill public.users from auth.users
    console.log('\n📝 Backfilling public.users from auth.users...');
    const usersResult = await client.query(`
      INSERT INTO public.users (id, email, name, created_at, updated_at)
      SELECT 
        id,
        email,
        COALESCE(raw_user_meta_data->>'name', split_part(email, '@', 1)) as name,
        created_at,
        updated_at
      FROM auth.users
      ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        name = COALESCE(EXCLUDED.name, public.users.name),
        updated_at = now();
    `);
    console.log(`✅ Backfilled/updated ${usersResult.rowCount} users in public.users`);

    // Step 2: Backfill public.profiles from auth.users
    console.log('\n📝 Backfilling public.profiles from auth.users...');
    const profilesResult = await client.query(`
      INSERT INTO public.profiles (user_id, created_at, updated_at)
      SELECT 
        id,
        created_at,
        updated_at
      FROM auth.users
      ON CONFLICT (user_id) DO NOTHING;
    `);
    console.log(`✅ Backfilled ${profilesResult.rowCount} profiles in public.profiles`);

    // Step 3: Verify the data
    console.log('\n🔍 Verifying data...');
    const authUsersCount = await client.query('SELECT COUNT(*) FROM auth.users');
    const publicUsersCount = await client.query('SELECT COUNT(*) FROM public.users');
    const profilesCount = await client.query('SELECT COUNT(*) FROM public.profiles');

    console.log(`\n📊 Summary:`);
    console.log(`  - auth.users: ${authUsersCount.rows[0].count} users`);
    console.log(`  - public.users: ${publicUsersCount.rows[0].count} users`);
    console.log(`  - public.profiles: ${profilesCount.rows[0].count} profiles`);

    if (authUsersCount.rows[0].count === publicUsersCount.rows[0].count && 
        authUsersCount.rows[0].count === profilesCount.rows[0].count) {
      console.log('\n✅ All tables are in sync!');
    } else {
      console.log('\n⚠️  Warning: Table counts do not match!');
    }

  } catch (error) {
    console.error('❌ Backfill error:', error.message);
    console.error('Details:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

backfillUsers();

