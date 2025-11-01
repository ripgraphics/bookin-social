const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function seedAmenities() {
  const client = new Client({
    connectionString: process.env.DIRECT_URL,
  });

  try {
    console.log('✅ Connecting to database...');
    await client.connect();
    console.log('✅ Connected successfully\n');

    const migrationPath = path.join(__dirname, '../supabase/migrations/0003_seed_amenities.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('✅ Running amenities seed migration...\n');

    // Execute the SQL
    await client.query(sql);

    console.log('✅ Amenities seed migration completed successfully!');

  } catch (error) {
    console.error('❌ Error seeding amenities:', error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n✅ Database connection closed');
  }
}

seedAmenities();

