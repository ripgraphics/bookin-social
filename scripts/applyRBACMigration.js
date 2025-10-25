const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function applyRBACMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: false
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Step 1: Apply RBAC tables migration
    console.log('📝 Step 1: Creating RBAC tables...');
    const migration1Path = path.join(__dirname, '..', 'supabase', 'migrations', '0007_enterprise_rbac_system.sql');
    const migration1SQL = fs.readFileSync(migration1Path, 'utf8');
    
    await client.query(migration1SQL);
    console.log('✅ RBAC tables created successfully\n');

    // Step 2: Seed RBAC data
    console.log('📝 Step 2: Seeding RBAC data...');
    const migration2Path = path.join(__dirname, '..', 'supabase', 'migrations', '0008_seed_rbac_data.sql');
    const migration2SQL = fs.readFileSync(migration2Path, 'utf8');
    
    await client.query(migration2SQL);
    console.log('✅ RBAC data seeded successfully\n');

    // Step 3: Verify table creation
    console.log('🔍 Step 3: Verifying table creation...');
    const tableCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('roles', 'permissions', 'role_permissions', 'user_roles')
      ORDER BY table_name;
    `);
    
    console.log('✅ Tables created:');
    tableCheck.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });
    console.log('');

    // Step 4: Verify roles
    console.log('🔍 Step 4: Verifying roles...');
    const rolesCheck = await client.query(`
      SELECT name, display_name, is_system_role 
      FROM public.roles 
      ORDER BY name;
    `);
    
    console.log(`✅ ${rolesCheck.rows.length} roles created:`);
    rolesCheck.rows.forEach(role => {
      const systemBadge = role.is_system_role ? '[SYSTEM]' : '[CUSTOM]';
      console.log(`   ${systemBadge} ${role.name} - ${role.display_name}`);
    });
    console.log('');

    // Step 5: Verify permissions
    console.log('🔍 Step 5: Verifying permissions...');
    const permissionsCheck = await client.query(`
      SELECT resource, COUNT(*) as count
      FROM public.permissions
      GROUP BY resource
      ORDER BY resource;
    `);
    
    console.log(`✅ Permissions created by resource:`);
    let totalPermissions = 0;
    permissionsCheck.rows.forEach(row => {
      console.log(`   - ${row.resource}: ${row.count} permissions`);
      totalPermissions += parseInt(row.count);
    });
    console.log(`   Total: ${totalPermissions} permissions\n`);

    // Step 6: Verify role-permission mappings
    console.log('🔍 Step 6: Verifying role-permission mappings...');
    const mappingsCheck = await client.query(`
      SELECT 
        r.name as role_name,
        COUNT(rp.permission_id) as permission_count
      FROM public.roles r
      LEFT JOIN public.role_permissions rp ON r.id = rp.role_id
      GROUP BY r.name
      ORDER BY r.name;
    `);
    
    console.log('✅ Permissions per role:');
    mappingsCheck.rows.forEach(row => {
      console.log(`   - ${row.role_name}: ${row.permission_count} permissions`);
    });
    console.log('');

    // Step 7: Verify triggers and functions
    console.log('🔍 Step 7: Verifying helper functions...');
    const functionsCheck = await client.query(`
      SELECT routine_name
      FROM information_schema.routines
      WHERE routine_schema = 'public'
      AND routine_name IN (
        'user_has_permission',
        'get_user_permissions',
        'get_user_roles',
        'assign_default_role',
        'prevent_system_role_deletion',
        'update_roles_updated_at'
      )
      ORDER BY routine_name;
    `);
    
    console.log(`✅ ${functionsCheck.rows.length} helper functions created:`);
    functionsCheck.rows.forEach(row => {
      console.log(`   - ${row.routine_name}()`);
    });
    console.log('');

    // Step 8: Check existing users and assign default role
    console.log('📝 Step 8: Checking existing users...');
    const usersCheck = await client.query(`
      SELECT COUNT(*) as count FROM public.users;
    `);
    
    const userCount = parseInt(usersCheck.rows[0].count);
    console.log(`✅ Found ${userCount} existing user(s)`);
    
    if (userCount > 0) {
      console.log('📝 Assigning default "user" role to existing users...');
      await client.query(`
        INSERT INTO public.user_roles (user_id, role_id)
        SELECT u.id, r.id
        FROM public.users u
        CROSS JOIN public.roles r
        WHERE r.name = 'user'
        ON CONFLICT (user_id, role_id) DO NOTHING;
      `);
      console.log('✅ Default roles assigned\n');
    }

    // Final summary
    console.log('🎉 ============================================');
    console.log('🎉 RBAC MIGRATION COMPLETED SUCCESSFULLY!');
    console.log('🎉 ============================================\n');
    console.log('📋 Summary:');
    console.log(`   - ${rolesCheck.rows.length} roles created`);
    console.log(`   - ${totalPermissions} permissions created`);
    console.log(`   - ${functionsCheck.rows.length} helper functions created`);
    console.log(`   - ${userCount} users have default roles\n`);
    console.log('Next steps:');
    console.log('   1. Run: node scripts/createAdminUsersWithRoles.js');
    console.log('   2. Test admin access and permissions');
    console.log('   3. Begin admin dashboard development\n');

  } catch (error) {
    console.error('❌ Migration error:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('✅ Database connection closed');
  }
}

applyRBACMigration();

