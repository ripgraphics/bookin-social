const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function checkUserIds() {
  const client = new Client({
    connectionString: process.env.DIRECT_URL
  });

  try {
    await client.connect();

    // Check admin user
    const adminQuery = `
      SELECT id, auth_user_id, first_name, last_name, email
      FROM public.users
      WHERE email = 'admin@bookin.social'
    `;
    const adminResult = await client.query(adminQuery);
    console.log('Admin User:');
    console.log(adminResult.rows[0]);
    console.log('');

    // Check notes
    const notesQuery = `
      SELECT id, title, user_id
      FROM public.notes
      LIMIT 5
    `;
    const notesResult = await client.query(notesQuery);
    console.log('Notes in database:');
    notesResult.rows.forEach(note => {
      console.log(`  - ${note.title} (user_id: ${note.user_id})`);
    });
    console.log('');

    // Check if user_ids match
    const adminUserId = adminResult.rows[0]?.id;
    const noteUserId = notesResult.rows[0]?.user_id;
    
    if (adminUserId === noteUserId) {
      console.log('✅ User IDs MATCH - notes belong to admin user');
    } else {
      console.log('❌ User IDs DO NOT MATCH!');
      console.log(`   Admin user ID: ${adminUserId}`);
      console.log(`   Note user ID: ${noteUserId}`);
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

checkUserIds();

