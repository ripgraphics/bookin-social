const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

const PERSONAL_EMAIL = 'bookin.social34@hotmail.com';

async function assignSuperAdmin() {
  const client = new Client({
    connectionString: process.env.SUPABASE_DB_URL || process.env.DATABASE_URL,
    ssl: (process.env.SUPABASE_DB_URL || process.env.DATABASE_URL)?.includes("sslmode=require") 
      ? { rejectUnauthorized: false } 
      : undefined,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Step 1: Find the user
    const { rows: users } = await client.query(`
      SELECT id, email, first_name, last_name
      FROM public.users
      WHERE email = $1
      LIMIT 1
    `, [PERSONAL_EMAIL]);

    if (users.length === 0) {
      throw new Error(`User with email ${PERSONAL_EMAIL} not found`);
    }

    const user = users[0];
    console.log(`👤 Found user: ${user.first_name} ${user.last_name} (${user.email})`);
    console.log(`   User ID: ${user.id}\n`);

    // Step 2: Get super_admin role ID
    const { rows: roles } = await client.query(`
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
    const { rows: existingRoles } = await client.query(`
      SELECT ur.user_id, ur.role_id
      FROM public.user_roles ur
      WHERE ur.user_id = $1 AND ur.role_id = $2
    `, [user.id, superAdminRole.id]);

    if (existingRoles.length > 0) {
      console.log('ℹ️  User already has super_admin role assigned');
      console.log('✅ No action needed\n');
      return { assigned: false, alreadyHadRole: true };
    }

    // Step 4: Assign super_admin role
    console.log('📝 Assigning super_admin role...');
    await client.query(`
      INSERT INTO public.user_roles (user_id, role_id, assigned_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (user_id, role_id) DO NOTHING
    `, [user.id, superAdminRole.id]);

    // Step 5: Verify assignment
    const { rows: verifyRoles } = await client.query(`
      SELECT ur.user_id, ur.role_id, r.name, r.display_name
      FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = $1 AND ur.role_id = $2
    `, [user.id, superAdminRole.id]);

    if (verifyRoles.length > 0) {
      console.log('✅ Super admin role assigned successfully!');
      console.log(`   Role: ${verifyRoles[0].display_name}\n`);
      return { assigned: true, alreadyHadRole: false };
    } else {
      throw new Error('Failed to verify role assignment');
    }
  } catch (error) {
    console.error('❌ Error assigning super admin role:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run if called directly
if (require.main === module) {
  assignSuperAdmin()
    .then((result) => {
      if (result.assigned) {
        console.log('✅ Super admin role assignment completed successfully');
      }
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { assignSuperAdmin };

