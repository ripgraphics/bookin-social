const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function applyAddressMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: false
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '0009_add_address_fields.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📝 Applying address fields migration...');
    await client.query(migrationSQL);
    console.log('✅ Migration applied successfully!\n');

    // Verify the new columns
    console.log('🔍 Verifying new columns...');
    const { rows } = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema='public' 
        AND table_name='listings' 
        AND column_name IN (
          'address_line1', 'address_line2', 'city', 'state_province', 
          'postal_code', 'country', 'country_code', 'formatted_address', 
          'latitude', 'longitude'
        )
      ORDER BY column_name;
    `);

    console.log('New address columns:');
    rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });

    // Check existing data
    console.log('\n📊 Checking existing listings...');
    const { rows: listings } = await client.query(`
      SELECT 
        id, 
        title, 
        location_value, 
        country_code, 
        formatted_address 
      FROM public.listings 
      LIMIT 5;
    `);

    console.log(`\nFound ${listings.length} listings (showing first 5):`);
    listings.forEach(listing => {
      console.log(`\n  📍 ${listing.title}`);
      console.log(`     - ID: ${listing.id}`);
      console.log(`     - location_value: ${listing.location_value || 'null'}`);
      console.log(`     - country_code: ${listing.country_code || 'null'}`);
      console.log(`     - formatted_address: ${listing.formatted_address || 'null'}`);
    });

    console.log('\n✨ Migration complete!\n');
    console.log('📋 Next steps:');
    console.log('   1. Update TypeScript types to include new address fields');
    console.log('   2. Install Mapbox dependencies: npm install @mapbox/mapbox-sdk');
    console.log('   3. Add NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN to .env.local');
    console.log('   4. Create AddressInput component with autocomplete');
    console.log('   5. Update forms and display components');

  } catch (error) {
    console.error('❌ Error applying migration:', error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('✅ Database connection closed');
  }
}

applyAddressMigration();

