const { createClient } = require('@supabase/supabase-js');
const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

const PERSONAL_EMAIL = 'bookin.social34@hotmail.com';

async function setupPersonalAccount() {
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

  // Connect to database
  const dbClient = new Client({
    connectionString: process.env.SUPABASE_DB_URL || process.env.DATABASE_URL,
    ssl: (process.env.SUPABASE_DB_URL || process.env.DATABASE_URL)?.includes("sslmode=require") 
      ? { rejectUnauthorized: false } 
      : undefined,
  });

  try {
    await dbClient.connect();
    console.log('✅ Connected to database\n');

    // Step 1: Check if user exists in public.users
    const { rows: existingUsers } = await dbClient.query(`
      SELECT id, email, first_name, last_name, auth_user_id
      FROM public.users
      WHERE email = $1
      LIMIT 1
    `, [PERSONAL_EMAIL]);

    let userId;
    let authUserId;

    if (existingUsers.length > 0) {
      // User exists in public.users
      const user = existingUsers[0];
      userId = user.id;
      authUserId = user.auth_user_id;
      console.log(`✅ User found in public.users:`);
      console.log(`   Name: ${user.first_name} ${user.last_name}`);
      console.log(`   User ID: ${userId}`);
      console.log(`   Auth User ID: ${authUserId || 'NULL'}\n`);
    } else {
      // User doesn't exist in public.users - need to find in auth.users
      console.log(`⚠️  User not found in public.users, checking auth.users...\n`);
      
      // Try to find user in auth.users using admin API
      const { data: authUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
      
      if (listError) {
        throw new Error(`Failed to list auth users: ${listError.message}`);
      }

      const authUser = authUsers.users.find(u => u.email === PERSONAL_EMAIL);
      
      if (!authUser) {
        throw new Error(`User with email ${PERSONAL_EMAIL} not found in auth.users. Please create the auth user first.`);
      }

      authUserId = authUser.id;
      console.log(`✅ Found user in auth.users:`);
      console.log(`   Email: ${authUser.email}`);
      console.log(`   Auth User ID: ${authUserId}\n`);

      // Create user in public.users
      console.log('📝 Creating user record in public.users...');
      const insertResult = await dbClient.query(`
        INSERT INTO public.users (auth_user_id, email, first_name, last_name, created_at, updated_at)
        VALUES ($1, $2, $3, $4, NOW(), NOW())
        RETURNING id, email, first_name, last_name
      `, [
        authUserId,
        PERSONAL_EMAIL,
        authUser.user_metadata?.first_name || 'Shane',
        authUser.user_metadata?.last_name || 'Cox'
      ]);

      userId = insertResult.rows[0].id;
      console.log(`✅ Created user record:`);
      console.log(`   User ID: ${userId}`);
      console.log(`   Name: ${insertResult.rows[0].first_name} ${insertResult.rows[0].last_name}\n`);
    }

    // Step 2: Get super_admin role ID
    const { rows: roles } = await dbClient.query(`
      SELECT id, name, display_name
      FROM public.roles
      WHERE name = 'super_admin'
      LIMIT 1
    `);

    if (roles.length === 0) {
      throw new Error('super_admin role not found in database');
    }

    const superAdminRole = roles[0];
    console.log(`🔑 Found role: ${superAdminRole.display_name} (${superAdminRole.name})`);
    console.log(`   Role ID: ${superAdminRole.id}\n`);

    // Step 3: Check if user already has super_admin role
    const { rows: existingRoles } = await dbClient.query(`
      SELECT ur.user_id, ur.role_id
      FROM public.user_roles ur
      WHERE ur.user_id = $1 AND ur.role_id = $2
    `, [userId, superAdminRole.id]);

    if (existingRoles.length > 0) {
      console.log('ℹ️  User already has super_admin role assigned');
      console.log('✅ No action needed\n');
      return { assigned: false, alreadyHadRole: true, userId };
    }

    // Step 4: Assign super_admin role
    console.log('📝 Assigning super_admin role...');
    await dbClient.query(`
      INSERT INTO public.user_roles (user_id, role_id, assigned_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (user_id, role_id) DO NOTHING
    `, [userId, superAdminRole.id]);

    // Step 5: Verify assignment
    const { rows: verifyRoles } = await dbClient.query(`
      SELECT ur.user_id, ur.role_id, r.name, r.display_name
      FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = $1 AND ur.role_id = $2
    `, [userId, superAdminRole.id]);

    if (verifyRoles.length > 0) {
      console.log('✅ Super admin role assigned successfully!');
      console.log(`   Role: ${verifyRoles[0].display_name}\n`);
      return { assigned: true, alreadyHadRole: false, userId };
    } else {
      throw new Error('Failed to verify role assignment');
    }
  } catch (error) {
    console.error('❌ Error setting up personal account:', error);
    throw error;
  } finally {
    await dbClient.end();
  }
}

// Run if called directly
if (require.main === module) {
  setupPersonalAccount()
    .then((result) => {
      if (result.assigned) {
        console.log('✅ Personal account setup completed successfully');
      }
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { setupPersonalAccount };

