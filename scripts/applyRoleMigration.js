const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyRoleMigration() {
  try {
    console.log('🚀 Applying role migration...');

    // Read the migration file
    const fs = require('fs');
    const migrationSQL = fs.readFileSync('./supabase/migrations/0006_add_user_roles.sql', 'utf8');

    // Split by semicolon and execute each statement
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`Executing: ${statement.substring(0, 50)}...`);
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        if (error) {
          console.error(`Error executing statement: ${error.message}`);
          console.error(`Statement: ${statement}`);
        } else {
          console.log('✅ Statement executed successfully');
        }
      }
    }

    console.log('✅ Role migration applied successfully!');
    
    // List current users and their roles
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, first_name, last_name, email, role, created_at')
      .order('created_at', { ascending: true });

    if (usersError) {
      console.error('Error fetching users:', usersError.message);
    } else {
      console.log('\n📋 Current users:');
      users.forEach(user => {
        console.log(`- ${user.first_name} ${user.last_name} (${user.email}) - Role: ${user.role}`);
      });
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

applyRoleMigration();
