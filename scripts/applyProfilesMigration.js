const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function applyMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: false
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '0002_add_profiles_images_and_trigger.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📝 Applying profiles and images migration...');

    // Execute the migration
    await client.query(migrationSQL);

    console.log('✅ Migration applied successfully!');
    console.log('\n📊 Summary:');
    console.log('  - Created public.images table with RLS');
    console.log('  - Removed image column from public.users');
    console.log('  - Created public.profiles table with avatar_image_id and cover_image_id FKs');
    console.log('  - Added RLS policies for images and profiles');
    console.log('  - Created handle_new_user() function');
    console.log('  - Added trigger to auto-create user profiles on signup');
    console.log('  - Added indexes for performance');
    console.log('  - Added updated_at triggers');
    console.log('  - Added named foreign key constraints');

    // Backfill profiles for existing users
    console.log('\n🔄 Backfilling profiles for existing users...');
    const backfillResult = await client.query(`
      INSERT INTO public.profiles (user_id, created_at, updated_at)
      SELECT id, created_at, updated_at 
      FROM auth.users
      WHERE id NOT IN (SELECT user_id FROM public.profiles)
      ON CONFLICT (user_id) DO NOTHING;
    `);
    console.log(`✅ Backfilled ${backfillResult.rowCount} profiles`);

    // Verify the setup
    console.log('\n🔍 Verifying setup...');
    const tablesCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'profiles', 'images')
      ORDER BY table_name;
    `);
    console.log('Tables:', tablesCheck.rows.map(r => r.table_name).join(', '));

    const constraintsCheck = await client.query(`
      SELECT 
        tc.table_name, 
        tc.constraint_name, 
        tc.constraint_type
      FROM information_schema.table_constraints tc
      WHERE tc.table_schema = 'public' 
      AND tc.table_name IN ('profiles', 'images')
      AND tc.constraint_type = 'FOREIGN KEY'
      ORDER BY tc.table_name, tc.constraint_name;
    `);
    console.log('\nForeign Keys:');
    constraintsCheck.rows.forEach(r => {
      console.log(`  - ${r.table_name}.${r.constraint_name}`);
    });

  } catch (error) {
    console.error('❌ Migration error:', error.message);
    console.error('Details:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

applyMigration();
