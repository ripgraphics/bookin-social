const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function diagnoseListingsSchema() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: false
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Check if listings table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'listings'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      console.log('❌ ERROR: public.listings table does not exist!');
      return;
    }

    console.log('✅ public.listings table exists\n');

    // Get actual columns in listings table
    console.log('📊 Actual Columns in public.listings:\n');
    const actualColumns = await client.query(`
      SELECT 
        column_name, 
        data_type, 
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'listings'
      ORDER BY ordinal_position;
    `);

    actualColumns.rows.forEach(col => {
      const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
      const hasDefault = col.column_default ? `DEFAULT ${col.column_default}` : '';
      console.log(`  ${col.column_name.padEnd(20)} ${col.data_type.padEnd(25)} ${nullable.padEnd(10)} ${hasDefault}`);
    });

    // Define expected columns
    const expectedColumns = {
      'id': 'uuid',
      'user_id': 'uuid',
      'title': 'text',
      'description': 'text',
      'image_src': 'text',
      'category': 'text',
      'room_count': 'integer',
      'bathroom_count': 'integer',
      'guest_count': 'integer',
      'location_value': 'text',
      'price': 'integer',
      'created_at': 'timestamp with time zone'
    };

    console.log('\n📋 Expected Columns:\n');
    Object.entries(expectedColumns).forEach(([name, type]) => {
      console.log(`  ${name.padEnd(20)} ${type}`);
    });

    // Compare
    console.log('\n🔍 Comparison:\n');
    
    const actualColumnNames = actualColumns.rows.map(r => r.column_name);
    const expectedColumnNames = Object.keys(expectedColumns);

    // Check for missing columns
    const missing = expectedColumnNames.filter(name => !actualColumnNames.includes(name));
    if (missing.length > 0) {
      console.log('❌ MISSING COLUMNS:');
      missing.forEach(col => {
        console.log(`   - ${col} (${expectedColumns[col]})`);
      });
    } else {
      console.log('✅ All expected columns exist');
    }

    // Check for extra columns
    const extra = actualColumnNames.filter(name => !expectedColumnNames.includes(name));
    if (extra.length > 0) {
      console.log('\n⚠️  EXTRA COLUMNS (not expected by code):');
      extra.forEach(col => {
        const colInfo = actualColumns.rows.find(r => r.column_name === col);
        console.log(`   - ${col} (${colInfo.data_type})`);
      });
    }

    // Check for type mismatches
    console.log('\n🔍 Type Checking:\n');
    let typeMismatches = false;
    actualColumns.rows.forEach(col => {
      if (expectedColumns[col.column_name]) {
        const expectedType = expectedColumns[col.column_name];
        const actualType = col.data_type;
        
        // Normalize type comparisons
        const typeMatch = 
          (expectedType === 'integer' && actualType === 'integer') ||
          (expectedType === 'text' && actualType === 'text') ||
          (expectedType === 'uuid' && actualType === 'uuid') ||
          (expectedType === 'timestamp with time zone' && actualType === 'timestamp with time zone');

        if (!typeMatch) {
          console.log(`⚠️  Type mismatch: ${col.column_name}`);
          console.log(`   Expected: ${expectedType}`);
          console.log(`   Actual:   ${actualType}`);
          typeMismatches = true;
        }
      }
    });

    if (!typeMismatches && missing.length === 0) {
      console.log('✅ All column types match expected');
    }

    // Generate fix SQL if needed
    if (missing.length > 0 || extra.length > 0) {
      console.log('\n📝 Suggested Fix SQL:\n');
      console.log('```sql');
      
      missing.forEach(col => {
        const type = expectedColumns[col];
        console.log(`ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS ${col} ${type};`);
      });

      console.log('```');
    }

    console.log('\n✅ Diagnosis complete!');

  } catch (error) {
    console.error('❌ Diagnosis error:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

diagnoseListingsSchema();

