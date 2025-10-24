const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function backfillEnterpriseSchema() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: false
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Check current state
    console.log('📊 Current State:');
    const authCount = await client.query('SELECT COUNT(*) FROM auth.users');
    const usersCount = await client.query('SELECT COUNT(*) FROM public.users');
    const profilesCount = await client.query('SELECT COUNT(*) FROM public.profiles');
    console.log(`  - auth.users: ${authCount.rows[0].count} users`);
    console.log(`  - public.users: ${usersCount.rows[0].count} users`);
    console.log(`  - public.profiles: ${profilesCount.rows[0].count} profiles\n`);

    // Step 1: Backfill public.users from auth.users
    console.log('📝 Step 1: Backfilling public.users from auth.users...');
    const usersResult = await client.query(`
      INSERT INTO public.users (auth_user_id, email, first_name, last_name, created_at, updated_at)
      SELECT 
        au.id as auth_user_id,
        au.email,
        COALESCE(au.raw_user_meta_data->>'first_name', 'Direct') as first_name,
        COALESCE(au.raw_user_meta_data->>'last_name', 'Link') as last_name,
        au.created_at,
        au.updated_at
      FROM auth.users au
      WHERE NOT EXISTS (
        SELECT 1 FROM public.users pu WHERE pu.auth_user_id = au.id
      );
    `);
    console.log(`✅ Inserted ${usersResult.rowCount} users into public.users\n`);

    // Step 2: Backfill public.profiles from public.users
    console.log('📝 Step 2: Backfilling public.profiles from public.users...');
    const profilesResult = await client.query(`
      INSERT INTO public.profiles (user_id, created_at, updated_at)
      SELECT 
        pu.id as user_id,
        pu.created_at,
        pu.updated_at
      FROM public.users pu
      WHERE NOT EXISTS (
        SELECT 1 FROM public.profiles pp WHERE pp.user_id = pu.id
      );
    `);
    console.log(`✅ Inserted ${profilesResult.rowCount} profiles into public.profiles\n`);

    // Step 3: Verify the backfill
    console.log('🔍 Verifying backfill...');
    const newAuthCount = await client.query('SELECT COUNT(*) FROM auth.users');
    const newUsersCount = await client.query('SELECT COUNT(*) FROM public.users');
    const newProfilesCount = await client.query('SELECT COUNT(*) FROM public.profiles');

    console.log('\n📊 Final State:');
    console.log(`  - auth.users: ${newAuthCount.rows[0].count} users`);
    console.log(`  - public.users: ${newUsersCount.rows[0].count} users`);
    console.log(`  - public.profiles: ${newProfilesCount.rows[0].count} profiles\n`);

    // Verify data integrity
    console.log('🔍 Verifying data integrity...');
    const integrityCheck = await client.query(`
      SELECT 
        au.id as auth_user_id,
        au.email as auth_email,
        pu.id as public_user_id,
        pu.auth_user_id as public_auth_user_id,
        pu.first_name,
        pu.last_name,
        pu.email as public_email,
        pp.id as profile_id,
        pp.user_id as profile_user_id
      FROM auth.users au
      LEFT JOIN public.users pu ON au.id = pu.auth_user_id
      LEFT JOIN public.profiles pp ON pu.id = pp.user_id;
    `);

    if (integrityCheck.rows.length > 0) {
      console.log('\n✅ Data Integrity Check:');
      integrityCheck.rows.forEach((row, idx) => {
        console.log(`\n  User ${idx + 1}:`);
        console.log(`    auth.users.id: ${row.auth_user_id}`);
        console.log(`    public.users.id: ${row.public_user_id}`);
        console.log(`    public.users.auth_user_id: ${row.public_auth_user_id} ${row.auth_user_id === row.public_auth_user_id ? '✅' : '❌'}`);
        console.log(`    Email: ${row.auth_email}`);
        console.log(`    Name: ${row.first_name} ${row.last_name}`);
        console.log(`    public.profiles.id: ${row.profile_id}`);
        console.log(`    public.profiles.user_id: ${row.profile_user_id} ${row.public_user_id === row.profile_user_id ? '✅' : '❌'}`);
      });
    }

    // Final validation
    if (newAuthCount.rows[0].count === newUsersCount.rows[0].count && 
        newAuthCount.rows[0].count === newProfilesCount.rows[0].count) {
      console.log('\n✅ SUCCESS: All tables are in sync!');
      console.log('✅ Enterprise schema backfill complete!\n');
      console.log('Next steps:');
      console.log('  1. Navigate to http://localhost:3003');
      console.log('  2. Login with your existing credentials');
      console.log('  3. Verify user name displays as "Direct Link"');
      console.log('  4. Test creating a listing\n');
    } else {
      console.log('\n⚠️  WARNING: Table counts do not match!');
      console.log('Please investigate the data integrity issues.\n');
    }

  } catch (error) {
    console.error('❌ Backfill error:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('✅ Database connection closed');
  }
}

backfillEnterpriseSchema();

