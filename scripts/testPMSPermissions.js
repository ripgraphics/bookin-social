const { Client: PgClient } = require('pg');
require('dotenv').config({ path: '.env.local' });

const databaseUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ Missing DATABASE_URL or SUPABASE_DB_URL');
  process.exit(1);
}

async function testPMSPermissions() {
  const pgClient = new PgClient({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes("sslmode=require") ? { rejectUnauthorized: false } : undefined
  });

  try {
    await pgClient.connect();
    console.log('✅ Connected to database\n');

    const adminEmail = 'admin@bookin.social';
    console.log(`Testing PMS access for: ${adminEmail}\n`);

    // Get public.users ID
    const { rows: userRows } = await pgClient.query(
      'SELECT id, first_name, last_name FROM public.users WHERE email = $1',
      [adminEmail]
    );

    if (userRows.length === 0) {
      console.error('❌ Public user entry not found for admin email');
      return;
    }
    const publicUserId = userRows[0].id;
    console.log(`📧 User: ${adminEmail} (${userRows[0].first_name} ${userRows[0].last_name})`);
    console.log(`🆔 User ID: ${publicUserId}\n`);

    // Get roles
    const { rows: roles } = await pgClient.query(
      `SELECT r.name, r.display_name
       FROM public.user_roles ur
       JOIN public.roles r ON ur.role_id = r.id
       WHERE ur.user_id = $1`,
      [publicUserId]
    );
    console.log('👤 Roles:');
    roles.forEach(role => console.log(`   - ${role.display_name} (${role.name})`));
    console.log('');

    // Test admin dashboard access
    const hasAdminAccess = roles.some(r => r.name === 'admin' || r.name === 'super_admin');
    console.log(`🎯 Has admin role: ${hasAdminAccess ? '✅ YES' : '❌ NO'}`);
    console.log('');

    // Check PMS access
    console.log('🏠 Checking PMS access:');
    
    // Check if property owner
    const { rows: properties } = await pgClient.query(
      'SELECT id FROM public.property_management WHERE owner_id = $1 LIMIT 1',
      [publicUserId]
    );
    console.log(`   - Is Property Owner: ${properties.length > 0 ? '✅ YES' : '❌ NO'}`);

    // Check if host
    const { rows: hostAssignments } = await pgClient.query(
      `SELECT id FROM public.property_assignments 
       WHERE user_id = $1 AND role = 'host' AND status = 'active' LIMIT 1`,
      [publicUserId]
    );
    console.log(`   - Is Host: ${hostAssignments.length > 0 ? '✅ YES' : '❌ NO'}`);

    // Check if co-host
    const { rows: coHostAssignments } = await pgClient.query(
      `SELECT id FROM public.property_assignments 
       WHERE user_id = $1 AND role = 'co_host' AND status = 'active' LIMIT 1`,
      [publicUserId]
    );
    console.log(`   - Is Co-Host: ${coHostAssignments.length > 0 ? '✅ YES' : '❌ NO'}`);

    // Check if guest (has reservations)
    const { rows: reservations } = await pgClient.query(
      'SELECT id FROM public.reservations WHERE user_id = $1 LIMIT 1',
      [publicUserId]
    );
    console.log(`   - Is Guest: ${reservations.length > 0 ? '✅ YES' : '❌ NO'}`);

    console.log('');
    console.log(`📊 PMS Role: ${hasAdminAccess ? 'admin (redirected to admin PMS)' : 
      properties.length > 0 ? 'owner' :
      hostAssignments.length > 0 ? 'host' :
      coHostAssignments.length > 0 ? 'co_host' :
      reservations.length > 0 ? 'guest' :
      'none'}`);
    console.log('');

  } catch (error) {
    console.error('❌ An unexpected error occurred:', error);
  } finally {
    await pgClient.end();
    console.log('✅ Database connection closed');
  }
}

testPMSPermissions();

