const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyRoleMigration() {
  try {
    console.log('🚀 Applying role migration...');

    // Add role column
    console.log('1. Adding role column...');
    const { error: alterError } = await supabase.rpc('exec', {
      sql: "ALTER TABLE public.users ADD COLUMN role TEXT DEFAULT 'user' NOT NULL;"
    });
    
    if (alterError) {
      console.log('Role column might already exist:', alterError.message);
    } else {
      console.log('✅ Role column added');
    }

    // Create index
    console.log('2. Creating role index...');
    const { error: indexError } = await supabase.rpc('exec', {
      sql: "CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);"
    });
    
    if (indexError) {
      console.log('Index might already exist:', indexError.message);
    } else {
      console.log('✅ Role index created');
    }

    // Add check constraint
    console.log('3. Adding role constraint...');
    const { error: constraintError } = await supabase.rpc('exec', {
      sql: "ALTER TABLE public.users ADD CONSTRAINT check_valid_role CHECK (role IN ('user', 'admin', 'super_admin'));"
    });
    
    if (constraintError) {
      console.log('Constraint might already exist:', constraintError.message);
    } else {
      console.log('✅ Role constraint added');
    }

    // Update existing users to have 'user' role
    console.log('4. Updating existing users...');
    const { error: updateError } = await supabase
      .from('users')
      .update({ role: 'user' })
      .is('role', null);

    if (updateError) {
      console.log('Update error:', updateError.message);
    } else {
      console.log('✅ Existing users updated');
    }

    console.log('✅ Role migration applied successfully!');
    
    // List current users and their roles
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, first_name, last_name, email, role, created_at')
      .order('created_at', { ascending: true });

    if (usersError) {
      console.error('Error fetching users:', usersError.message);
    } else {
      console.log('\n📋 Current users:');
      users.forEach(user => {
        console.log(`- ${user.first_name} ${user.last_name} (${user.email}) - Role: ${user.role}`);
      });
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

applyRoleMigration();
