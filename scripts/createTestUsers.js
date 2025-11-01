const { Client } = require('pg');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

async function createTestUsers() {
  const client = new Client({
    connectionString: process.env.DIRECT_URL,
  });

  try {
    await client.connect();
    console.log('Connected to database\n');

    // Create test users in auth.users first
    const testUsers = [
      { email: 'alice@test.com', firstName: 'Alice', lastName: 'Johnson' },
      { email: 'bob@test.com', firstName: 'Bob', lastName: 'Smith' },
      { email: 'charlie@test.com', firstName: 'Charlie', lastName: 'Brown' }
    ];

    for (const user of testUsers) {
      console.log(`Creating user: ${user.email}...`);
      
      // Check if user already exists in auth.users
      const existingAuthUser = await client.query(
        'SELECT id FROM auth.users WHERE email = $1',
        [user.email]
      );

      let authUserId;

      if (existingAuthUser.rows.length > 0) {
        console.log(`  ✓ Auth user already exists`);
        authUserId = existingAuthUser.rows[0].id;
      } else {
        // Create in auth.users
        const hashedPassword = await bcrypt.hash('password123', 10);
        const userMetadata = JSON.stringify({ first_name: user.firstName, last_name: user.lastName });
        const authResult = await client.query(
          `INSERT INTO auth.users (
            id, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at
          ) VALUES (
            gen_random_uuid(), $1, $2, NOW(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            $3::jsonb,
            NOW(), NOW()
          ) RETURNING id`,
          [user.email, hashedPassword, userMetadata]
        );
        authUserId = authResult.rows[0].id;
        console.log(`  ✓ Created in auth.users`);
      }

      // Check if user exists in public.users
      const existingPublicUser = await client.query(
        'SELECT id FROM public.users WHERE auth_user_id = $1',
        [authUserId]
      );

      let publicUserId;

      if (existingPublicUser.rows.length > 0) {
        console.log(`  ✓ Public user already exists`);
        publicUserId = existingPublicUser.rows[0].id;
      } else {
        // Create in public.users
        const publicResult = await client.query(
          `INSERT INTO public.users (
            auth_user_id, email, first_name, last_name, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, NOW(), NOW()
          ) RETURNING id`,
          [authUserId, user.email, user.firstName, user.lastName]
        );
        publicUserId = publicResult.rows[0].id;
        console.log(`  ✓ Created in public.users`);
      }

      // Check if profile exists
      const existingProfile = await client.query(
        'SELECT id FROM public.profiles WHERE user_id = $1',
        [publicUserId]
      );

      if (existingProfile.rows.length === 0) {
        // Create profile
        await client.query(
          `INSERT INTO public.profiles (
            user_id, bio, created_at, updated_at
          ) VALUES (
            $1, $2, NOW(), NOW()
          )`,
          [publicUserId, `Test user: ${user.firstName} ${user.lastName}`]
        );
        console.log(`  ✓ Created profile`);
      } else {
        console.log(`  ✓ Profile already exists`);
      }

      console.log(`✅ User ${user.email} ready\n`);
    }

    console.log('All test users created successfully!');
    console.log('\nCredentials:');
    console.log('  Email: alice@test.com, bob@test.com, charlie@test.com');
    console.log('  Password: password123');

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

createTestUsers();

