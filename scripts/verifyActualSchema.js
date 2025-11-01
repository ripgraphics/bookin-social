const { createClient } = require('@supabase/supabase-js');

async function verifyActualSchema() {
  const supabase = createClient(
    'https://ciebygczeycjgoihwkuo.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpZWJ5Z2N6ZXljamdvaWh3a3VvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDg4MjYzMywiZXhwIjoyMDc2NDU4NjMzfQ.HKL6RGrRgxDe5fSyFW-0xHyfxSzptZK1ZPmlxWWhzwU'
  );
  
  // Get a real user_id from the database
  const { data: users } = await supabase
    .from('users')
    .select('id')
    .limit(1);
    
  if (!users || users.length === 0) {
    console.log('No users found');
    return;
  }
  
  const userId = users[0].id;
  console.log('Using user_id:', userId);
  
  // Test CONTACTS with migration 0013 schema (simple)
  console.log('\n=== TESTING CONTACTS ===');
  const contactTest = {
    user_id: userId,
    first_name: 'Schema',
    last_name: 'Test',
    email: 'schematest@example.com',
    address: '123 Test St'
  };
  
  const { data: contact, error: contactError } = await supabase
    .from('contacts')
    .insert(contactTest)
    .select();
  
  if (contactError) {
    console.log('Error:', contactError.message);
  } else {
    console.log('✓ SUCCESS - contacts has single "address" field');
    console.log('Columns:', Object.keys(contact[0]).join(', '));
    // Clean up
    await supabase.from('contacts').delete().eq('id', contact[0].id);
  }
  
  // Test TICKETS with migration 0013 schema
  console.log('\n=== TESTING TICKETS ===');
  const ticketTest = {
    user_id: userId,
    title: 'Test Ticket',
    description: 'Test Description',
    category: 'support'
  };
  
  const { data: ticket, error: ticketError } = await supabase
    .from('tickets')
    .insert(ticketTest)
    .select();
  
  if (ticketError) {
    console.log('Error:', ticketError.message);
    
    // Try with subject instead of title
    const ticketTest2 = {
      user_id: userId,
      subject: 'Test Ticket',
      description: 'Test Description'
    };
    
    const { data: ticket2, error: ticketError2 } = await supabase
      .from('tickets')
      .insert(ticketTest2)
      .select();
    
    if (ticketError2) {
      console.log('Error with subject:', ticketError2.message);
    } else {
      console.log('✓ SUCCESS - tickets uses "subject" not "title"');
      console.log('Columns:', Object.keys(ticket2[0]).join(', '));
      // Clean up
      await supabase.from('tickets').delete().eq('id', ticket2[0].id);
    }
  } else {
    console.log('✓ SUCCESS - tickets has "title" field');
    console.log('Columns:', Object.keys(ticket[0]).join(', '));
    // Clean up
    await supabase.from('tickets').delete().eq('id', ticket[0].id);
  }
}

verifyActualSchema();

