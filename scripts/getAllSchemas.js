const { createClient } = require('@supabase/supabase-js');

async function getAllSchemas() {
  const supabase = createClient(
    'https://ciebygczeycjgoihwkuo.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpZWJ5Z2N6ZXljamdvaWh3a3VvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDg4MjYzMywiZXhwIjoyMDc2NDU4NjMzfQ.HKL6RGrRgxDe5fSyFW-0xHyfxSzptZK1ZPmlxWWhzwU'
  );
  
  const tables = ['contacts', 'tickets', 'profiles', 'invoices', 'note_folders'];
  
  console.log('=== DATABASE SCHEMA (SOURCE OF TRUTH) ===\n');
  
  for (const table of tables) {
    console.log(`\n${table.toUpperCase()} TABLE:`);
    
    // Try to get a sample record to see actual columns
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .limit(1);
    
    if (error) {
      console.log(`  Error fetching: ${error.message}`);
    } else if (data && data.length > 0) {
      console.log('  Columns:', Object.keys(data[0]).join(', '));
    } else {
      // No data, try to infer from schema by attempting minimal insert
      console.log('  No data found, attempting to discover columns...');
      
      const { error: insertError } = await supabase
        .from(table)
        .insert({});
      
      if (insertError) {
        console.log(`  Error hint: ${insertError.message}`);
      }
    }
  }
}

getAllSchemas();

