const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

async function checkPermissions() {
  const client = new Client({
    connectionString,
    ssl: false
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Get admin user
    const userResult = await client.query(`
      SELECT u.id, u.email, u.first_name, u.last_name
      FROM public.users u
      WHERE u.email = 'admin@bookin.social'
    `);

    if (userResult.rows.length === 0) {
      console.log('❌ Admin user not found');
      return;
    }

    const adminUser = userResult.rows[0];
    console.log(`📧 User: ${adminUser.email} (${adminUser.first_name} ${adminUser.last_name})`);
    console.log(`🆔 User ID: ${adminUser.id}\n`);

    // Get roles
    const rolesResult = await client.query(`
      SELECT r.name, r.display_name
      FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = $1
    `, [adminUser.id]);

    console.log('👤 Roles:');
    rolesResult.rows.forEach(role => {
      console.log(`   - ${role.display_name} (${role.name})`);
    });
    console.log('');

    // Get permissions via RPC
    const permissionsResult = await client.query(`
      SELECT * FROM public.get_user_permissions($1)
    `, [adminUser.id]);

    console.log('🔑 Permissions (via RPC):');
    if (permissionsResult.rows.length === 0) {
      console.log('   ❌ No permissions found!');
    } else {
      permissionsResult.rows.forEach(row => {
        console.log(`   - ${row.permission_name}`);
      });
    }
    console.log('');

    // Check if admin.dashboard.access exists
    const hasDashboardAccess = permissionsResult.rows.some(row => row.permission_name === 'admin.dashboard.access');
    console.log(`🎯 Has admin.dashboard.access: ${hasDashboardAccess ? '✅ YES' : '❌ NO'}`);

    // Direct query to check role_permissions
    const directPermissionsResult = await client.query(`
      SELECT p.name, p.description
      FROM public.role_permissions rp
      JOIN public.permissions p ON rp.permission_id = p.id
      JOIN public.user_roles ur ON rp.role_id = ur.role_id
      WHERE ur.user_id = $1
      AND p.name LIKE 'admin%'
      ORDER BY p.name
    `, [adminUser.id]);

    console.log('\n🔍 Admin permissions (direct query):');
    if (directPermissionsResult.rows.length === 0) {
      console.log('   ❌ No admin permissions found!');
    } else {
      directPermissionsResult.rows.forEach(perm => {
        console.log(`   - ${perm.name}: ${perm.description}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
    console.log('\n✅ Database connection closed');
  }
}

checkPermissions();

