const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function seedProfileContent() {
  const client = new Client({
    connectionString: process.env.DIRECT_URL,
  });

  try {
    console.log('✅ Connecting to database...');
    await client.connect();
    console.log('✅ Connected successfully\n');

    // Step 1: Apply table migrations
    console.log('📝 Step 1: Creating user_posts and user_photos tables...');
    const migration24Path = path.join(__dirname, '..', 'supabase', 'migrations', '0024_create_user_posts.sql');
    const migration24SQL = fs.readFileSync(migration24Path, 'utf8');
    await client.query(migration24SQL);
    console.log('✅ user_posts table created\n');

    const migration25Path = path.join(__dirname, '..', 'supabase', 'migrations', '0025_create_user_photos.sql');
    const migration25SQL = fs.readFileSync(migration25Path, 'utf8');
    await client.query(migration25SQL);
    console.log('✅ user_photos table created\n');

    // Step 2: Apply seed migration
    console.log('📝 Step 2: Seeding profile content...');
    const seedMigrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '0026_seed_profile_content.sql');
    const seedSQL = fs.readFileSync(seedMigrationPath, 'utf8');
    await client.query(seedSQL);
    console.log('✅ Profile content seeded successfully\n');

    // Step 3: Verify data was inserted
    console.log('🔍 Step 3: Verifying seeded data...');
    
    // Check posts count
    const postsResult = await client.query(`
      SELECT COUNT(*) as count FROM public.user_posts;
    `);
    console.log(`   Posts: ${postsResult.rows[0].count}`);

    // Check photos count
    const photosResult = await client.query(`
      SELECT COUNT(*) as count FROM public.user_photos;
    `);
    console.log(`   Photos: ${photosResult.rows[0].count}\n`);

    console.log('✅ Profile content seeding completed successfully!');

  } catch (error) {
    console.error('❌ Error seeding profile content:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n✅ Database connection closed');
  }
}

seedProfileContent();

