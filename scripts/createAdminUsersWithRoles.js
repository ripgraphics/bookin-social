const { createClient } = require('@supabase/supabase-js');
const { Client: PgClient } = require('pg');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const databaseUrl = process.env.DATABASE_URL;

if (!supabaseUrl || !supabaseServiceKey || !databaseUrl) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createAdminUsers() {
  const pgClient = new PgClient({
    connectionString: databaseUrl,
    ssl: false
  });

  try {
    await pgClient.connect();
    console.log('✅ Connected to database\n');

    // Create Super Admin user
    console.log('📝 Creating Super Admin user...');
    const { data: superAdminAuth, error: superAdminAuthError } = await supabase.auth.admin.createUser({
      email: 'superadmin@bookin.social',
      password: 'SuperAdmin123!',
      email_confirm: true,
      user_metadata: {
        first_name: 'Super',
        last_name: 'Admin'
      }
    });

    if (superAdminAuthError) {
      console.error('❌ Error creating super admin auth user:', superAdminAuthError.message);
    } else {
      console.log(`✅ Super Admin auth user created: ${superAdminAuth.user.email}`);
      
      // Get the public.users.id for this auth user
      const userResult = await pgClient.query(
        'SELECT id FROM public.users WHERE auth_user_id = $1',
        [superAdminAuth.user.id]
      );
      
      if (userResult.rows.length === 0) {
        console.log('⚠️  Waiting for trigger to create public.users entry...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const retryResult = await pgClient.query(
          'SELECT id FROM public.users WHERE auth_user_id = $1',
          [superAdminAuth.user.id]
        );
        
        if (retryResult.rows.length === 0) {
          console.error('❌ Failed to find public.users entry for super admin');
        } else {
          await assignRole(pgClient, retryResult.rows[0].id, 'super_admin');
        }
      } else {
        await assignRole(pgClient, userResult.rows[0].id, 'super_admin');
      }
    }

    // Create Admin user
    console.log('\n📝 Creating Admin user...');
    const { data: adminAuth, error: adminAuthError } = await supabase.auth.admin.createUser({
      email: 'admin@bookin.social',
      password: 'Admin123!',
      email_confirm: true,
      user_metadata: {
        first_name: 'Admin',
        last_name: 'User'
      }
    });

    if (adminAuthError) {
      console.error('❌ Error creating admin auth user:', adminAuthError.message);
    } else {
      console.log(`✅ Admin auth user created: ${adminAuth.user.email}`);
      
      // Get the public.users.id for this auth user
      const userResult = await pgClient.query(
        'SELECT id FROM public.users WHERE auth_user_id = $1',
        [adminAuth.user.id]
      );
      
      if (userResult.rows.length === 0) {
        console.log('⚠️  Waiting for trigger to create public.users entry...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const retryResult = await pgClient.query(
          'SELECT id FROM public.users WHERE auth_user_id = $1',
          [adminAuth.user.id]
        );
        
        if (retryResult.rows.length === 0) {
          console.error('❌ Failed to find public.users entry for admin');
        } else {
          await assignRole(pgClient, retryResult.rows[0].id, 'admin');
        }
      } else {
        await assignRole(pgClient, userResult.rows[0].id, 'admin');
      }
    }

    // List all users with their roles
    console.log('\n📋 All users with roles:');
    const usersWithRoles = await pgClient.query(`
      SELECT 
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        array_agg(r.name ORDER BY r.name) as roles
      FROM public.users u
      LEFT JOIN public.user_roles ur ON u.id = ur.user_id
      LEFT JOIN public.roles r ON ur.role_id = r.id
      GROUP BY u.id, u.first_name, u.last_name, u.email
      ORDER BY u.created_at;
    `);

    usersWithRoles.rows.forEach(user => {
      const roles = user.roles.filter(r => r !== null).join(', ');
      console.log(`   - ${user.first_name} ${user.last_name} (${user.email})`);
      console.log(`     Roles: ${roles || 'none'}`);
    });

    console.log('\n🎉 Admin users created successfully!');
    console.log('\n📧 Login credentials:');
    console.log('   Super Admin: superadmin@bookin.social / SuperAdmin123!');
    console.log('   Admin: admin@bookin.social / Admin123!');
    console.log('\n💡 Next steps:');
    console.log('   1. Login as super admin or admin');
    console.log('   2. Navigate to any listing');
    console.log('   3. Verify you can see edit/delete options on all listings');
    console.log('   4. Test the admin dashboard (once implemented)\n');

  } catch (error) {
    console.error('❌ Failed to create admin users:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    await pgClient.end();
    console.log('✅ Database connection closed');
  }
}

async function assignRole(pgClient, userId, roleName) {
  try {
    // Get role ID
    const roleResult = await pgClient.query(
      'SELECT id FROM public.roles WHERE name = $1',
      [roleName]
    );
    
    if (roleResult.rows.length === 0) {
      console.error(`❌ Role "${roleName}" not found`);
      return;
    }
    
    const roleId = roleResult.rows[0].id;
    
    // Assign role to user
    await pgClient.query(
      `INSERT INTO public.user_roles (user_id, role_id) 
       VALUES ($1, $2) 
       ON CONFLICT (user_id, role_id) DO NOTHING`,
      [userId, roleId]
    );
    
    console.log(`✅ Assigned "${roleName}" role`);
  } catch (error) {
    console.error(`❌ Error assigning "${roleName}" role:`, error.message);
  }
}

createAdminUsers();

