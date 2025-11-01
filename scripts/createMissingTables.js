const { Client } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function createMissingTables() {
  const client = new Client({
    connectionString: process.env.DIRECT_URL,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Create notes table (it's referenced by note_folders)
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.notes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        folder_id UUID REFERENCES public.note_folders(id) ON DELETE SET NULL,
        is_pinned BOOLEAN DEFAULT FALSE,
        is_archived BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
      );
    `);
    console.log('✓ Created table: notes');

    // Create tags table for notes
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.tags (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        color TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
        UNIQUE(user_id, name)
      );
    `);
    console.log('✓ Created table: tags');

    // Create note_tags junction table
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.note_tags (
        note_id UUID NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
        tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
        PRIMARY KEY (note_id, tag_id)
      );
    `);
    console.log('✓ Created table: note_tags');

    // Create ticket_comments table
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.ticket_comments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
      );
    `);
    console.log('✓ Created table: ticket_comments');

    // Create calendar_event_attendees alias (the table exists as event_attendees)
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.calendar_event_attendees (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        event_id UUID NOT NULL REFERENCES public.calendar_events(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
        UNIQUE(event_id, user_id)
      );
    `);
    console.log('✓ Created table: calendar_event_attendees');

    console.log('\n✅ All missing tables created successfully!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('✅ Database connection closed');
  }
}

createMissingTables();

