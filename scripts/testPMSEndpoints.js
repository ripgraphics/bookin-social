const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

// Test users with their credentials
const TEST_USERS = {
  owner: {
    email: 'ripgraphics.com@gmail.com',
    password: 'TestPMS2024!',
    role: 'Property Owner'
  },
  host: {
    email: 'ripgraphics2@gmail.com',
    password: 'TestPMS2024!',
    role: 'Host'
  },
  admin: {
    email: 'admin@bookin.social',
    password: 'TestPMS2024!',
    role: 'Admin'
  },
  superadmin: {
    email: 'superadmin@bookin.social',
    password: 'TestPMS2024!',
    role: 'Super Admin'
  }
};

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

async function testEndpoint(method, url, session, body = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include cookies
    };

    // Extract cookies from session if available
    if (session?.access_token) {
      // For Next.js, we need to use cookies, but fetch API doesn't support setting cookies directly
      // We'll need to use the Supabase client's session cookie or test differently
      // For now, we'll test without auth (which will fail but show the endpoint exists)
      options.headers['Authorization'] = `Bearer ${session.access_token}`;
    }

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    const data = await response.json().catch(() => ({}));
    
    return {
      status: response.status,
      ok: response.ok,
      data: data,
      error: !response.ok ? (data.error || `HTTP ${response.status}`) : null
    };
  } catch (error) {
    return {
      status: 0,
      ok: false,
      data: null,
      error: error.message
    };
  }
}

async function loginAsUser(email, password) {
  try {
    const supabase = createClient(supabaseUrl, anonKey);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return { success: false, token: null, error: error.message };
    }

    return { success: true, session: data.session, token: data.session?.access_token || null, error: null };
  } catch (error) {
    return { success: false, token: null, error: error.message };
  }
}

async function runTests() {
  console.log('🧪 PMS API Endpoint Testing\n');
  console.log('='.repeat(80));
  console.log(`Base URL: ${BASE_URL}\n`);

  const results = {
    passed: 0,
    failed: 0,
    skipped: 0,
    tests: []
  };

  // Test as Owner
  console.log('📋 Testing as Property Owner...\n');
  const ownerLogin = await loginAsUser(TEST_USERS.owner.email, TEST_USERS.owner.password);
  
  if (!ownerLogin.success) {
    console.log(`❌ Failed to login as owner: ${ownerLogin.error}`);
    results.tests.push({
      user: 'Owner',
      test: 'Login',
      status: 'FAILED',
      error: ownerLogin.error
    });
    results.failed++;
  } else {
    console.log('✅ Owner login successful\n');
    results.tests.push({
      user: 'Owner',
      test: 'Login',
      status: 'PASSED'
    });
    results.passed++;

    // Test GET /api/properties/management
    // Note: Next.js API routes use cookie-based auth, so direct fetch won't work
    // These tests verify endpoint structure, actual auth testing requires browser
    const propertiesResult = await testEndpoint(
      'GET',
      `${BASE_URL}/api/properties/management`,
      ownerLogin.session
    );
    
    const propertiesTest = {
      user: 'Owner',
      test: 'GET /api/properties/management',
      status: propertiesResult.ok ? 'PASSED' : 'FAILED',
      statusCode: propertiesResult.status,
      error: propertiesResult.error,
      dataCount: propertiesResult.data?.length || 0
    };
    
    if (propertiesTest.status === 'PASSED') {
      console.log(`✅ GET /api/properties/management - ${propertiesTest.dataCount} properties`);
      results.passed++;
    } else {
      console.log(`❌ GET /api/properties/management - ${propertiesTest.error}`);
      results.failed++;
    }
    results.tests.push(propertiesTest);

    // Test GET /api/invoices/v2
    const invoicesResult = await testEndpoint(
      'GET',
      `${BASE_URL}/api/invoices/v2`,
      ownerLogin.session
    );
    
    const invoicesTest = {
      user: 'Owner',
      test: 'GET /api/invoices/v2',
      status: invoicesResult.ok ? 'PASSED' : 'FAILED',
      statusCode: invoicesResult.status,
      error: invoicesResult.error,
      dataCount: invoicesResult.data?.length || 0
    };
    
    if (invoicesTest.status === 'PASSED') {
      console.log(`✅ GET /api/invoices/v2 - ${invoicesTest.dataCount} invoices`);
      results.passed++;
    } else {
      console.log(`❌ GET /api/invoices/v2 - ${invoicesTest.error}`);
      results.failed++;
    }
    results.tests.push(invoicesTest);

    // Test GET /api/expenses
    const expensesResult = await testEndpoint(
      'GET',
      `${BASE_URL}/api/expenses`,
      ownerLogin.session
    );
    
    const expensesTest = {
      user: 'Owner',
      test: 'GET /api/expenses',
      status: expensesResult.ok ? 'PASSED' : 'FAILED',
      statusCode: expensesResult.status,
      error: expensesResult.error,
      dataCount: expensesResult.data?.length || 0
    };
    
    if (expensesTest.status === 'PASSED') {
      console.log(`✅ GET /api/expenses - ${expensesTest.dataCount} expenses`);
      results.passed++;
    } else {
      console.log(`❌ GET /api/expenses - ${expensesTest.error}`);
      results.failed++;
    }
    results.tests.push(expensesTest);
  }

  // Test as Host
  console.log('\n📋 Testing as Host...\n');
  const hostLogin = await loginAsUser(TEST_USERS.host.email, TEST_USERS.host.password);
  
  if (!hostLogin.success) {
    console.log(`❌ Failed to login as host: ${hostLogin.error}`);
    results.tests.push({
      user: 'Host',
      test: 'Login',
      status: 'FAILED',
      error: hostLogin.error
    });
    results.failed++;
  } else {
    console.log('✅ Host login successful\n');
    results.tests.push({
      user: 'Host',
      test: 'Login',
      status: 'PASSED'
    });
    results.passed++;

    // Test GET /api/properties/management (should only see assigned properties)
    const hostPropertiesResult = await testEndpoint(
      'GET',
      `${BASE_URL}/api/properties/management`,
      hostLogin.session
    );
    
    const hostPropertiesTest = {
      user: 'Host',
      test: 'GET /api/properties/management',
      status: hostPropertiesResult.ok ? 'PASSED' : 'FAILED',
      statusCode: hostPropertiesResult.status,
      error: hostPropertiesResult.error,
      dataCount: hostPropertiesResult.data?.length || 0
    };
    
    if (hostPropertiesTest.status === 'PASSED') {
      console.log(`✅ GET /api/properties/management - ${hostPropertiesTest.dataCount} assigned properties`);
      results.passed++;
    } else {
      console.log(`❌ GET /api/properties/management - ${hostPropertiesTest.error}`);
      results.failed++;
    }
    results.tests.push(hostPropertiesTest);
  }

  // Test as Admin
  console.log('\n📋 Testing as Admin...\n');
  const adminLogin = await loginAsUser(TEST_USERS.admin.email, TEST_USERS.admin.password);
  
  if (!adminLogin.success) {
    console.log(`❌ Failed to login as admin: ${adminLogin.error}`);
    results.tests.push({
      user: 'Admin',
      test: 'Login',
      status: 'FAILED',
      error: adminLogin.error
    });
    results.failed++;
  } else {
    console.log('✅ Admin login successful\n');
    results.tests.push({
      user: 'Admin',
      test: 'Login',
      status: 'PASSED'
    });
    results.passed++;

    // Test GET /api/properties/management (should see all properties)
    const adminPropertiesResult = await testEndpoint(
      'GET',
      `${BASE_URL}/api/properties/management`,
      adminLogin.session
    );
    
    const adminPropertiesTest = {
      user: 'Admin',
      test: 'GET /api/properties/management',
      status: adminPropertiesResult.ok ? 'PASSED' : 'FAILED',
      statusCode: adminPropertiesResult.status,
      error: adminPropertiesResult.error,
      dataCount: adminPropertiesResult.data?.length || 0
    };
    
    if (adminPropertiesTest.status === 'PASSED') {
      console.log(`✅ GET /api/properties/management - ${adminPropertiesTest.dataCount} properties (all)`);
      results.passed++;
    } else {
      console.log(`❌ GET /api/properties/management - ${adminPropertiesTest.error}`);
      results.failed++;
    }
    results.tests.push(adminPropertiesTest);
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('\n📊 Test Summary:');
  console.log(`   ✅ Passed: ${results.passed}`);
  console.log(`   ❌ Failed: ${results.failed}`);
  console.log(`   ⏭️  Skipped: ${results.skipped}`);
  console.log(`   📈 Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);

  return results;
}

// Run if called directly
if (require.main === module) {
  runTests()
    .then((results) => {
      console.log('\n✅ Testing completed');
      process.exit(results.failed > 0 ? 1 : 0);
    })
    .catch((error) => {
      console.error('\n❌ Testing failed:', error);
      process.exit(1);
    });
}

module.exports = { runTests };
