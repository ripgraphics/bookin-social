const { createClient } = require('@supabase/supabase-js');

async function testContactsEnterprise() {
  const supabase = createClient(
    'https://ciebygczeycjgoihwkuo.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpZWJ5Z2N6ZXljamdvaWh3a3VvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDg4MjYzMywiZXhwIjoyMDc2NDU4NjMzfQ.HKL6RGrRgxDe5fSyFW-0xHyfxSzptZK1ZPmlxWWhzwU'
  );
  
  const { data: users } = await supabase.from('users').select('id').limit(1);
  const userId = users[0].id;
  
  console.log('=== TESTING CONTACTS (Enterprise Schema) ===\n');
  
  const contactTest = {
    user_id: userId,
    first_name: 'John',
    last_name: 'Doe',
    email: 'john.doe@test.com',
    phone: '555-1234',
    company: 'Test Inc',
    address_line1: '123 Main St',
    city: 'Springfield',
    state_province: 'IL',
    postal_code: '62701',
    country: 'USA'
  };
  
  const { data: contact, error } = await supabase
    .from('contacts')
    .insert(contactTest)
    .select();
  
  if (error) {
    console.log('Error:', error.message);
  } else {
    console.log('✓ SUCCESS!');
    console.log('Actual columns:', Object.keys(contact[0]).join(', '));
    // Clean up
    await supabase.from('contacts').delete().eq('id', contact[0].id);
  }
}

testContactsEnterprise();

