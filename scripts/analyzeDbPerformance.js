const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });

const connectionString = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ Missing SUPABASE_DB_URL in .env.local');
  process.exit(1);
}

async function analyzePerformance() {
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log('🔍 DATABASE PERFORMANCE ANALYSIS');
    console.log('═'.repeat(80));
    
    // 1. Test get_user_permissions RPC function
    console.log('\n📊 1. Testing get_user_permissions RPC Function');
    console.log('─'.repeat(80));
    
    // Get a real user ID first
    const { rows: users } = await client.query(`
      SELECT id FROM public.users LIMIT 1
    `);
    
    if (users.length > 0) {
      const userId = users[0].id;
      console.log(`Testing with user ID: ${userId}`);
      
      const start = Date.now();
      const { rows: permissions } = await client.query(`
        SELECT * FROM get_user_permissions($1)
      `, [userId]);
      const duration = Date.now() - start;
      
      console.log(`✓ Execution time: ${duration}ms`);
      console.log(`✓ Permissions returned: ${permissions.length}`);
      
      // Get EXPLAIN ANALYZE
      const { rows: explain } = await client.query(`
        EXPLAIN ANALYZE SELECT * FROM get_user_permissions($1)
      `, [userId]);
      
      console.log('\nQuery Plan:');
      explain.forEach(row => console.log(`  ${row['QUERY PLAN']}`));
    } else {
      console.log('⚠️  No users found in database');
    }
    
    // 2. Check index usage
    console.log('\n\n📊 2. Index Usage Statistics');
    console.log('─'.repeat(80));
    
    const { rows: indexStats } = await client.query(`
      SELECT 
        schemaname,
        relname as tablename,
        indexrelname as indexname,
        idx_scan as scans,
        idx_tup_read as tuples_read,
        idx_tup_fetch as tuples_fetched
      FROM pg_stat_user_indexes
      WHERE schemaname = 'public'
      ORDER BY idx_scan DESC
      LIMIT 20
    `);
    
    console.log('\nTop 20 Most Used Indexes:');
    console.table(indexStats);
    
    // 3. Check for missing indexes on foreign keys
    console.log('\n\n📊 3. Foreign Keys Without Indexes');
    console.log('─'.repeat(80));
    
    const { rows: missingIndexes } = await client.query(`
      SELECT
        c.conrelid::regclass AS table_name,
        string_agg(a.attname, ', ') AS columns,
        c.conname AS constraint_name
      FROM pg_constraint c
      JOIN pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
      WHERE c.contype = 'f'
        AND NOT EXISTS (
          SELECT 1
          FROM pg_index i
          WHERE i.indrelid = c.conrelid
            AND c.conkey::int[] <@ i.indkey::int[]
        )
      GROUP BY c.conrelid, c.conname
      ORDER BY c.conrelid::regclass::text
    `);
    
    if (missingIndexes.length > 0) {
      console.log('⚠️  Foreign keys without indexes:');
      console.table(missingIndexes);
    } else {
      console.log('✓ All foreign keys have indexes');
    }
    
    // 4. Analyze user_roles table performance
    console.log('\n\n📊 4. Analyzing user_roles Query Performance');
    console.log('─'.repeat(80));
    
    if (users.length > 0) {
      const userId = users[0].id;
      
      const { rows: explainRoles } = await client.query(`
        EXPLAIN ANALYZE
        SELECT ur.role_id, r.name
        FROM public.user_roles ur
        INNER JOIN public.roles r ON ur.role_id = r.id
        WHERE ur.user_id = $1
          AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
      `, [userId]);
      
      console.log('Query Plan for user_roles lookup:');
      explainRoles.forEach(row => console.log(`  ${row['QUERY PLAN']}`));
    }
    
    // 5. Analyze profiles query performance
    console.log('\n\n📊 5. Analyzing profiles Query Performance');
    console.log('─'.repeat(80));
    
    if (users.length > 0) {
      const userId = users[0].id;
      
      const { rows: explainProfiles } = await client.query(`
        EXPLAIN ANALYZE
        SELECT * FROM public.profiles WHERE user_id = $1
      `, [userId]);
      
      console.log('Query Plan for profiles lookup:');
      explainProfiles.forEach(row => console.log(`  ${row['QUERY PLAN']}`));
    }
    
    // 6. Check RLS policy overhead
    console.log('\n\n📊 6. RLS Policies on Critical Tables');
    console.log('─'.repeat(80));
    
    const { rows: rlsPolicies } = await client.query(`
      SELECT 
        schemaname,
        tablename,
        policyname,
        permissive,
        roles,
        cmd,
        qual,
        with_check
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename IN ('profiles', 'user_roles', 'user_posts', 'images', 'listings')
      ORDER BY tablename, policyname
    `);
    
    console.log(`Found ${rlsPolicies.length} RLS policies on critical tables:`);
    rlsPolicies.forEach(policy => {
      console.log(`\n  Table: ${policy.tablename}`);
      console.log(`  Policy: ${policy.policyname}`);
      console.log(`  Command: ${policy.cmd}`);
      console.log(`  Using: ${policy.qual || policy.with_check || 'N/A'}`);
    });
    
    // 7. Table sizes and row counts
    console.log('\n\n📊 7. Table Sizes and Row Counts');
    console.log('─'.repeat(80));
    
    const { rows: tableSizes } = await client.query(`
      SELECT 
        schemaname,
        relname as tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||relname)) AS size,
        n_live_tup AS row_count,
        n_dead_tup AS dead_rows
      FROM pg_stat_user_tables
      WHERE schemaname = 'public'
      ORDER BY pg_total_relation_size(schemaname||'.'||relname) DESC
      LIMIT 20
    `);
    
    console.table(tableSizes);
    
    // 8. Slow query candidates
    console.log('\n\n📊 8. Query Performance Summary');
    console.log('─'.repeat(80));
    
    const { rows: queryStats } = await client.query(`
      SELECT 
        schemaname,
        relname as tablename,
        seq_scan,
        seq_tup_read,
        idx_scan,
        idx_tup_fetch,
        n_tup_ins,
        n_tup_upd,
        n_tup_del
      FROM pg_stat_user_tables
      WHERE schemaname = 'public'
      ORDER BY seq_scan DESC
      LIMIT 10
    `);
    
    console.log('Tables with most sequential scans (potential missing indexes):');
    console.table(queryStats);
    
    console.log('\n═'.repeat(80));
    console.log('✅ Analysis complete');
    
  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

analyzePerformance();

