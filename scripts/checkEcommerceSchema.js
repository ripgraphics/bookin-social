const { Client } = require('pg');

async function checkSchema() {
  const client = new Client({ 
    connectionString: process.env.DIRECT_URL 
  });
  
  try {
    await client.connect();
    console.log('Connected to database');
    
    console.log('\n=== ORDERS TABLE SCHEMA ===');
    const orders = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'orders' AND table_schema = 'public' 
      ORDER BY ordinal_position;
    `);
    console.table(orders.rows);
    
    console.log('\n=== PRODUCTS TABLE SCHEMA ===');
    const products = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'products' AND table_schema = 'public' 
      ORDER BY ordinal_position;
    `);
    console.table(products.rows);
    
    console.log('\n=== FOREIGN KEY CONSTRAINTS ===');
    const fks = await client.query(`
      SELECT 
        tc.table_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_name IN ('orders', 'products')
        AND tc.table_schema = 'public';
    `);
    console.table(fks.rows);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

checkSchema();
