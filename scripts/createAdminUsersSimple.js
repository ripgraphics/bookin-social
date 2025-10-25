const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createAdminUsers() {
  try {
    console.log('🚀 Creating admin users...');

    // First, let's check if the role column exists
    console.log('1. Checking if role column exists...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, first_name, last_name, email, role')
      .limit(1);

    if (usersError) {
      console.error('Error checking users table:', usersError.message);
      console.log('\n❌ Please run the role migration first:');
      console.log('1. Go to your Supabase dashboard');
      console.log('2. Navigate to SQL Editor');
      console.log('3. Run this SQL:');
      console.log(`
ALTER TABLE public.users ADD COLUMN role TEXT DEFAULT 'user' NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
ALTER TABLE public.users ADD CONSTRAINT check_valid_role CHECK (role IN ('user', 'admin', 'super_admin'));
UPDATE public.users SET role = 'user' WHERE role IS NULL;
      `);
      console.log('\n4. Then run this script again');
      process.exit(1);
    }

    console.log('✅ Role column exists');

    // Create Super Admin user
    console.log('\n2. Creating Super Admin user...');
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
      console.error('Error creating super admin auth user:', superAdminAuthError.message);
    } else {
      console.log('✅ Super Admin auth user created:', superAdminAuth.user.email);
      
      // Update the user role in public.users
      const { error: superAdminRoleError } = await supabase
        .from('users')
        .update({ role: 'super_admin' })
        .eq('auth_user_id', superAdminAuth.user.id);

      if (superAdminRoleError) {
        console.error('Error updating super admin role:', superAdminRoleError.message);
      } else {
        console.log('✅ Super Admin role updated');
      }
    }

    // Create Admin user
    console.log('\n3. Creating Admin user...');
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
      console.error('Error creating admin auth user:', adminAuthError.message);
    } else {
      console.log('✅ Admin auth user created:', adminAuth.user.email);
      
      // Update the user role in public.users
      const { error: adminRoleError } = await supabase
        .from('users')
        .update({ role: 'admin' })
        .eq('auth_user_id', adminAuth.user.id);

      if (adminRoleError) {
        console.error('Error updating admin role:', adminRoleError.message);
      } else {
        console.log('✅ Admin role updated');
      }
    }

    // List all users with their roles
    console.log('\n📋 All users with roles:');
    const { data: allUsers, error: allUsersError } = await supabase
      .from('users')
      .select('id, first_name, last_name, email, role, created_at')
      .order('created_at', { ascending: true });

    if (allUsersError) {
      console.error('Error fetching users:', allUsersError.message);
    } else {
      allUsers.forEach(user => {
        console.log(`- ${user.first_name} ${user.last_name} (${user.email}) - Role: ${user.role}`);
      });
    }

    console.log('\n🎉 Admin users created successfully!');
    console.log('\n📧 Login credentials:');
    console.log('Super Admin: superadmin@bookin.social / SuperAdmin123!');
    console.log('Admin: admin@bookin.social / Admin123!');

  } catch (error) {
    console.error('❌ Failed to create admin users:', error.message);
    process.exit(1);
  }
}

createAdminUsers();
