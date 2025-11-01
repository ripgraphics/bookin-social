const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function applyMigration() {
  const client = new Client({ 
    connectionString: process.env.DIRECT_URL 
  });
  
  try {
    await client.connect();
    console.log('Connected to database');
    
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, '../supabase/migrations/0015_add_products_category_and_images.sql'),
      'utf8'
    );
    
    console.log('Applying migration...');
    await client.query(migrationSQL);
    console.log('✓ Migration applied successfully');
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

applyMigration();
