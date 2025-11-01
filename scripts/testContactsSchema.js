const { createClient } = require('@supabase/supabase-js');

async function testContactsSchema() {
  const supabase = createClient(
    'https://ciebygczeycjgoihwkuo.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpZWJ5Z2N6ZXljamdvaWh3a3VvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDg4MjYzMywiZXhwIjoyMDc2NDU4NjMzfQ.HKL6RGrRgxDe5fSyFW-0xHyfxSzptZK1ZPmlxWWhzwU'
  );
  
  try {
    console.log('=== TESTING CONTACTS SCHEMA ===\n');
    
    // Test 1: Try to insert with single address field
    console.log('Test 1: Single address field');
    const testData1 = {
      first_name: 'Test',
      last_name: 'User',
      email: 'test@example.com',
      address: '123 Main St'
    };
    
    const { error: error1 } = await supabase
      .from('contacts')
      .insert(testData1);
    
    if (error1) {
      console.log('Error:', error1.message);
    } else {
      console.log('Success with single address field');
    }
    
    // Test 2: Try with individual address fields
    console.log('\nTest 2: Individual address fields');
    const testData2 = {
      first_name: 'Test2',
      last_name: 'User2', 
      email: 'test2@example.com',
      address_line1: '123 Main St',
      city: 'Anytown',
      state: 'CA',
      postal_code: '12345',
      country: 'USA'
    };
    
    const { error: error2 } = await supabase
      .from('contacts')
      .insert(testData2);
    
    if (error2) {
      console.log('Error:', error2.message);
    } else {
      console.log('Success with individual address fields');
    }
    
    // Test 3: Try with minimal fields
    console.log('\nTest 3: Minimal fields only');
    const testData3 = {
      first_name: 'Test3',
      last_name: 'User3',
      email: 'test3@example.com'
    };
    
    const { error: error3 } = await supabase
      .from('contacts')
      .insert(testData3);
    
    if (error3) {
      console.log('Error:', error3.message);
    } else {
      console.log('Success with minimal fields');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testContactsSchema();
