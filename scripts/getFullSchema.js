const { createClient } = require('@supabase/supabase-js');

async function getFullSchema() {
  const supabase = createClient(
    'https://ciebygczeycjgoihwkuo.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpZWJ5Z2N6ZXljamdvaWh3a3VvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDg4MjYzMywiZXhwIjoyMDc2NDU4NjMzfQ.HKL6RGrRgxDe5fSyFW-0xHyfxSzptZK1ZPmlxWWhzwU'
  );
  
  console.log('=== TESTING COLUMN COMBINATIONS ===\n');
  
  // Test contacts with various field combinations
  console.log('CONTACTS - Testing fields:');
  const contactTests = [
    { desc: 'city only', fields: { first_name: 'T', last_name: 'T', email: 't@t.com', city: 'Test' } },
    { desc: 'province only', fields: { first_name: 'T', last_name: 'T', email: 't@t.com', province: 'Test' } },
    { desc: 'region only', fields: { first_name: 'T', last_name: 'T', email: 't@t.com', region: 'Test' } },
    { desc: 'postal_code only', fields: { first_name: 'T', last_name: 'T', email: 't@t.com', postal_code: '12345' } },
  ];
  
  for (const test of contactTests) {
    const { error } = await supabase.from('contacts').insert(test.fields);
    if (!error) {
      console.log(`  ✓ ${test.desc} - SUCCESS`);
      // Clean up
      await supabase.from('contacts').delete().eq('email', test.fields.email);
      break;
    } else {
      console.log(`  ✗ ${test.desc} - ${error.message}`);
    }
  }
  
  // Test tickets
  console.log('\nTICKETS - Testing fields:');
  const ticketTests = [
    { desc: 'type field', fields: { title: 'Test', description: 'Test', type: 'bug' } },
    { desc: 'priority field', fields: { title: 'Test', description: 'Test', priority: 'high' } },
    { desc: 'ticket_type field', fields: { title: 'Test', description: 'Test', ticket_type: 'bug' } },
  ];
  
  for (const test of ticketTests) {
    const { error } = await supabase.from('tickets').insert(test.fields);
    if (!error) {
      console.log(`  ✓ ${test.desc} - SUCCESS`);
      // Clean up
      await supabase.from('tickets').delete().eq('title', test.fields.title);
      break;
    } else {
      console.log(`  ✗ ${test.desc} - ${error.message}`);
    }
  }
}

getFullSchema();

