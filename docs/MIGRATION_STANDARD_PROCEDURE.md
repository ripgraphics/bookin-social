# Standard Migration Procedure

## ⚠️ CRITICAL: READ THIS FIRST BEFORE RUNNING ANY MIGRATION

This document defines the **ONLY** way to run database migrations in this project.

**DO NOT** deviate from this procedure. **DO NOT** try alternative methods.

---

## Standard Migration Script Template

All migration scripts MUST follow this exact pattern:

```javascript
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function applyMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: false
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Read the migration SQL file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', 'YOUR_MIGRATION_FILE.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('🚀 Executing migration...');
    console.log(`📄 File: ${migrationPath}`);
    console.log(`📊 Size: ${(migrationSQL.length / 1024).toFixed(2)} KB\n`);
    
    await client.query(migrationSQL);
    console.log('✅ Migration executed successfully!\n');

    // Verify tables were created (customize this section)
    console.log('🔍 Verifying tables...\n');
    
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN ('your_table_names_here')
      ORDER BY table_name;
    `);

    console.log('📋 Tables created:');
    tablesResult.rows.forEach(row => {
      console.log(`  ✓ public.${row.table_name}`);
    });
    console.log('');

  } catch (error) {
    console.error('❌ Migration error:', error.message);
    
    if (error.message.includes('already exists')) {
      console.log('\n💡 Some tables already exist - this is normal if you ran the migration before.');
      console.log('   Check your Supabase dashboard to verify all tables are present.');
    }
    
    process.exit(1);
  } finally {
    await client.end();
  }
}

applyMigration();
```

---

## How to Run a Migration

### Step 1: Create the Migration Script

1. Create a new JavaScript file in `scripts/` folder
2. Name it descriptively: `applyYourFeatureMigration.js`
3. Copy the template above
4. Update the migration file path
5. Update the table verification list

### Step 2: Run the Migration

```bash
node scripts/applyYourFeatureMigration.js
```

**That's it.** No `npx tsx`, no `esbuild-register`, no TypeScript complications.

---

## Environment Requirements

The migration script requires:
- `DATABASE_URL` in `.env.local`
- `pg` package installed (already in project)
- `dotenv` package installed (already in project)

---

## Common Errors and Solutions

### Error: "already exists"
**Solution:** Tables already created. This is normal. Verify in Supabase dashboard.

### Error: "Cannot find module 'pg'"
**Solution:** Run `npm install pg`

### Error: "DATABASE_URL is not defined"
**Solution:** Check `.env.local` has `DATABASE_URL` set

### Error: "Connection refused"
**Solution:** Check Supabase project is active and connection string is correct

---

## Verification Script Template

After running a migration, verify it with this template:

```javascript
const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function verifyTables() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: false
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN ('table1', 'table2', 'table3')
      ORDER BY table_name;
    `);

    console.log('📋 Tables Found:');
    const expectedTables = ['table1', 'table2', 'table3'];
    const foundTables = tablesResult.rows.map(r => r.table_name);
    
    expectedTables.forEach(table => {
      if (foundTables.includes(table)) {
        console.log(`  ✅ ${table}`);
      } else {
        console.log(`  ❌ ${table} - MISSING!`);
      }
    });
    
    console.log(`\n📊 Status: ${foundTables.length}/${expectedTables.length} tables found`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

verifyTables();
```

---

## Migration Workflow

1. **Create SQL migration file** in `supabase/migrations/`
2. **Create JavaScript migration script** in `scripts/`
3. **Run migration**: `node scripts/applyYourMigration.js`
4. **Verify tables**: `node scripts/verifyYourTables.js`
5. **Test API endpoints** (if applicable)

---

## Examples

### Example 1: Property Management System Migration

**File:** `scripts/applyPMSMigration.js`

```javascript
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function applyPMSMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: false
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '0030_property_management_system.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('🚀 Executing Property Management System migration...');
    await client.query(migrationSQL);
    console.log('✅ Migration executed successfully!\n');

  } catch (error) {
    console.error('❌ Migration error:', error.message);
    if (error.message.includes('already exists')) {
      console.log('\n💡 Tables already exist.');
    }
    process.exit(1);
  } finally {
    await client.end();
  }
}

applyPMSMigration();
```

**Run:** `node scripts/applyPMSMigration.js`

---

## DO NOT

❌ **DO NOT** use `npx tsx`  
❌ **DO NOT** use TypeScript for migration scripts  
❌ **DO NOT** use `esbuild-register`  
❌ **DO NOT** use `supabase db push` (CLI not installed)  
❌ **DO NOT** use REST API / RPC methods  
❌ **DO NOT** try alternative connection methods  

## DO

✅ **DO** use plain JavaScript  
✅ **DO** use `pg` Client directly  
✅ **DO** use `DATABASE_URL` from `.env.local`  
✅ **DO** run with `node scripts/yourScript.js`  
✅ **DO** follow the template exactly  

---

## Quick Reference

**Create migration script:**
```bash
# Copy template to new file
cp scripts/applyPMSMigration.js scripts/applyYourFeature.js
# Edit the file to update paths and table names
```

**Run migration:**
```bash
node scripts/applyYourFeature.js
```

**Verify migration:**
```bash
node scripts/verifyYourTables.js
```

---

## Troubleshooting Checklist

- [ ] Is `DATABASE_URL` in `.env.local`?
- [ ] Is the SQL file path correct?
- [ ] Is `pg` package installed?
- [ ] Is Supabase project active?
- [ ] Did you use plain JavaScript (not TypeScript)?
- [ ] Did you run with `node` (not `npx tsx`)?

---

## Summary

**The ONLY way to run migrations:**

1. Create `.js` file in `scripts/`
2. Use the template above
3. Run: `node scripts/yourScript.js`

**That's it. No exceptions. No alternatives.**

---

*Last Updated: 2025-11-02*  
*This is the definitive migration procedure. Do not deviate.*

