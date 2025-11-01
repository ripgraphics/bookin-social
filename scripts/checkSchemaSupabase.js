const { createClient } = require('@supabase/supabase-js');

async function checkSchemas() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  try {
    console.log('=== DATABASE SCHEMA (SOURCE OF TRUTH) ===\n');
    
    // Get schema for failing tables
    const tables = ['contacts', 'tickets', 'profiles', 'invoices', 'note_folders'];
    
    for (const table of tables) {
      console.log(`\n${table.toUpperCase()} TABLE:`);
      
      // Try to get a sample record to see the structure
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`  Error: ${error.message}`);
      } else if (data && data.length > 0) {
        console.log('  Columns:', Object.keys(data[0]).join(', '));
      } else {
        console.log('  Table exists but no data');
        // Try to insert a test record to see what columns are expected
        const testData = {};
        const { error: insertError } = await supabase
          .from(table)
          .insert(testData);
        
        if (insertError) {
          console.log(`  Insert error reveals columns: ${insertError.message}`);
        }
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkSchemas();
