const { Client } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function setupAdminUser() {
  const client = new Client({
    connectionString: process.env.DIRECT_URL,
  });

  try {
    console.log('✅ Connecting to database...');
    await client.connect();
    console.log('✅ Connected successfully\n');

    const userId = 'bccf3aaa-eae2-4e41-884b-caa162629886';

    // Check if user already has admin role
    const checkRole = await client.query(`
      SELECT ur.user_id, ur.role_id, r.name
      FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = $1 AND r.name IN ('admin', 'super_admin')
    `, [userId]);

    if (checkRole.rows.length > 0) {
      console.log(`✅ User already has ${checkRole.rows[0].name} role assigned`);
      return;
    }

    // Get admin role ID
    const roleResult = await client.query(`
      SELECT id, name FROM public.roles WHERE name = 'admin'
    `);

    if (roleResult.rows.length === 0) {
      console.error('❌ Admin role not found in database');
      process.exit(1);
    }

    const adminRoleId = roleResult.rows[0].id;
    console.log(`✅ Found admin role: ${roleResult.rows[0].name} (${adminRoleId})`);

    // Assign admin role to user
    await client.query(`
      INSERT INTO public.user_roles (user_id, role_id, assigned_by)
      VALUES ($1, $2, $1)
    `, [userId, adminRoleId]);

    console.log('✅ Admin role assigned successfully!');
    console.log(`   User ID: ${userId}`);
    console.log(`   Role: admin`);

  } catch (error) {
    console.error('❌ Error setting up admin user:', error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n✅ Database connection closed');
  }
}

setupAdminUser();

