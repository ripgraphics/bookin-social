const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testPermissions() {
  try {
    console.log('Testing super admin permissions...\n');
    
    // Get super admin user
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, email, first_name, last_name")
      .eq("email", "superadmin@bookin.social")
      .single();

    if (userError || !userData) {
      console.error('❌ User query failed:', userError?.message);
      return;
    }

    console.log(`📧 User: ${userData.email} (${userData.first_name} ${userData.last_name})`);
    console.log(`🆔 User ID: ${userData.id}\n`);

    // Test RPC call
    console.log('Calling get_user_permissions RPC...');
    const { data: permissions, error: permError } = await supabase.rpc(
      'get_user_permissions',
      { p_user_id: userData.id }
    );

    if (permError) {
      console.error('❌ RPC Error:', permError);
      return;
    }

    console.log(`✅ RPC returned ${permissions?.length || 0} permissions:\n`);
    if (permissions && permissions.length > 0) {
      permissions.forEach(p => {
        console.log(`   - ${p.permission_name}`);
      });
    } else {
      console.log('   ⚠️  No permissions returned!');
    }

    // Check for admin.dashboard.access
    const hasDashboardAccess = permissions?.some(p => p.permission_name === 'admin.dashboard.access');
    console.log(`\n🎯 Has admin.dashboard.access: ${hasDashboardAccess ? '✅ YES' : '❌ NO'}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testPermissions();

