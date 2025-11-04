const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function verifyRoleCoverage() {
  const client = new Client({
    connectionString: process.env.SUPABASE_DB_URL || process.env.DATABASE_URL,
    ssl: (process.env.SUPABASE_DB_URL || process.env.DATABASE_URL)?.includes("sslmode=require") 
      ? { rejectUnauthorized: false } 
      : undefined,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    console.log('🔍 Verifying PMS Role Coverage...\n');
    console.log('='.repeat(80));

    // Check property owners
    const { rows: owners } = await client.query(`
      SELECT DISTINCT u.id, u.email, u.first_name, u.last_name
      FROM public.property_management pm
      JOIN public.users u ON pm.owner_id = u.id
      ORDER BY u.email
    `);

    console.log(`\n📊 Property Owners (${owners.length}):`);
    owners.forEach(owner => {
      console.log(`   - ${owner.first_name} ${owner.last_name} (${owner.email})`);
    });

    // Check host assignments
    const { rows: hosts } = await client.query(`
      SELECT DISTINCT u.id, u.email, u.first_name, u.last_name, pa.role
      FROM public.property_assignments pa
      JOIN public.users u ON pa.user_id = u.id
      WHERE pa.role IN ('host', 'co-host')
      ORDER BY pa.role, u.email
    `);

    console.log(`\n📊 Hosts/Co-Hosts (${hosts.length}):`);
    const hostMap = new Map();
    hosts.forEach(host => {
      if (!hostMap.has(host.email)) {
        hostMap.set(host.email, []);
      }
      hostMap.get(host.email).push(host.role);
    });
    hostMap.forEach((roles, email) => {
      const host = hosts.find(h => h.email === email);
      console.log(`   - ${host.first_name} ${host.last_name} (${email}) - Roles: ${roles.join(', ')}`);
    });

    // Check guests (users with reservations)
    const { rows: guests } = await client.query(`
      SELECT DISTINCT u.id, u.email, u.first_name, u.last_name
      FROM public.reservations r
      JOIN public.users u ON r.user_id = u.id
      ORDER BY u.email
      LIMIT 10
    `);

    console.log(`\n📊 Guests (with reservations, showing first 10):`);
    guests.forEach(guest => {
      console.log(`   - ${guest.first_name} ${guest.last_name} (${guest.email})`);
    });

    // Check admin users
    const { rows: admins } = await client.query(`
      SELECT DISTINCT u.id, u.email, u.first_name, u.last_name, r.name as role_name
      FROM public.users u
      JOIN public.user_roles ur ON u.id = ur.user_id
      JOIN public.roles r ON ur.role_id = r.id
      WHERE r.name IN ('admin', 'super_admin')
      ORDER BY r.name, u.email
    `);

    console.log(`\n📊 Admins (${admins.length}):`);
    admins.forEach(admin => {
      console.log(`   - ${admin.first_name} ${admin.last_name} (${admin.email}) - ${admin.role_name}`);
    });

    console.log('\n' + '='.repeat(80));
    console.log('\n✅ Role Coverage Summary:');
    console.log(`   Property Owners: ${owners.length > 0 ? '✅' : '❌'}`);
    console.log(`   Hosts/Co-Hosts: ${hosts.length > 0 ? '✅' : '❌'}`);
    console.log(`   Guests: ${guests.length > 0 ? '✅' : '❌'}`);
    console.log(`   Admins: ${admins.length > 0 ? '✅' : '❌'}`);

    if (owners.length > 0 && hosts.length > 0 && guests.length > 0 && admins.length > 0) {
      console.log('\n🎉 All required roles are covered for PMS testing!');
    } else {
      console.log('\n⚠️  Some roles are missing. Please ensure all roles are covered.');
    }

  } catch (error) {
    console.error('❌ Error verifying role coverage:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run if called directly
if (require.main === module) {
  verifyRoleCoverage()
    .then(() => {
      console.log('\n✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { verifyRoleCoverage };

