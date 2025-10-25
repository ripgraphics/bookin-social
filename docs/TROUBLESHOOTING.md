# Troubleshooting Guide - RBAC System

## Issue: Internal Server Error / 500 Error on Home Page

### Symptoms
- Page shows "Internal Server Error"
- Terminal shows `ENOENT: no such file or directory, open '.next/routes-manifest.json'`
- GET / returns 500 status

### Cause
The dev server was running with an old `.next` cache that was cleared, causing file reference errors.

### Solution
**Restart the dev server:**

```powershell
# Stop all Node.js processes
taskkill /F /IM node.exe

# Start dev server fresh
npm run dev
```

Or use the quick restart command:
```powershell
taskkill /F /IM node.exe; npm run dev
```

---

## Issue: "column users.role does not exist"

### Symptoms
- Error in terminal: `User query failed: column users.role does not exist`
- Cannot login or view user data

### Cause
The old single `role` column was removed. The system now uses the RBAC tables (`user_roles`, `roles`, etc.).

### Solution
1. **Verify RBAC migration was applied:**
   ```bash
   node scripts/applyRBACMigration.js
   ```

2. **Check if RBAC tables exist:**
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('roles', 'permissions', 'role_permissions', 'user_roles');
   ```

3. **Verify getCurrentUser is updated:**
   - Should NOT query `users.role`
   - Should query `user_roles` and `roles` tables
   - Should fetch permissions via `get_user_permissions()` RPC

---

## Issue: Admin Can't See Edit/Delete Options

### Symptoms
- Logged in as admin but can't see 3-dot menu on listings
- Regular users and admins see same interface

### Possible Causes & Solutions

**1. User doesn't have admin role assigned:**
```sql
-- Check user's roles
SELECT * FROM get_user_roles((SELECT id FROM users WHERE email = 'admin@bookin.social'));

-- If no roles, assign admin role
INSERT INTO user_roles (user_id, role_id)
SELECT 
  (SELECT id FROM users WHERE email = 'admin@bookin.social'),
  (SELECT id FROM roles WHERE name = 'admin')
ON CONFLICT DO NOTHING;
```

**2. getCurrentUser not fetching roles:**
```typescript
// Check browser console for getCurrentUser logs
// Should see: [getCurrentUser] Profile loaded, took Xms

// Verify getCurrentUser returns roles and permissions
console.log(currentUser?.roles); // Should show array of roles
console.log(currentUser?.permissions); // Should show array of permission names
```

**3. Browser cache:**
```powershell
# Clear Next.js cache
Remove-Item -Path .next -Recurse -Force

# Restart dev server
taskkill /F /IM node.exe
npm run dev

# Clear browser cache (Ctrl+Shift+Delete)
# Or hard reload (Ctrl+F5)
```

**4. Permission utility not imported:**
Check `ListingClient.tsx`:
```typescript
import { canEditListing, canDeleteListing } from "@/app/utils/permissions";

// Should use:
const canEdit = canEditListing(currentUser, listingOwnerId);
const canDelete = canDeleteListing(currentUser, listingOwnerId);

// NOT:
const canEdit = currentUser?.role === 'admin'; // Old way
```

---

## Issue: RPC Function Errors

### Symptoms
- Error: `function public.get_user_permissions(uuid) does not exist`
- Error: `function public.get_user_roles(uuid) does not exist`

### Cause
Helper functions weren't created during migration.

### Solution
Re-run the RBAC migration:
```bash
node scripts/applyRBACMigration.js
```

Or manually create functions:
```sql
-- Check if functions exist
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('get_user_permissions', 'get_user_roles', 'user_has_permission');

-- If missing, run: supabase/migrations/0007_enterprise_rbac_system.sql
```

---

## Issue: Permission Checks Always Return False

### Symptoms
- `hasPermission()` always returns false
- `canEditListing()` always returns false
- Even admins can't edit

### Debug Steps

**1. Check if user has permissions in database:**
```sql
-- Get user ID
SELECT id FROM users WHERE email = 'admin@bookin.social';

-- Check permissions
SELECT * FROM get_user_permissions('USER_ID_HERE');

-- Should see listings.edit.any, listings.delete.any, etc.
```

**2. Check if roles have permissions:**
```sql
-- View admin role permissions
SELECT p.name
FROM role_permissions rp
JOIN permissions p ON rp.permission_id = p.id
WHERE rp.role_id = (SELECT id FROM roles WHERE name = 'admin');

-- Should see 30 permissions
```

**3. Check if user has roles:**
```sql
SELECT r.name
FROM user_roles ur
JOIN roles r ON ur.role_id = r.id
WHERE ur.user_id = 'USER_ID_HERE';

-- Should see: admin, user (or super_admin, user)
```

**4. Verify getCurrentUser returns data:**
```typescript
// In browser console on any page:
console.log(JSON.stringify(currentUser, null, 2));

// Should show:
// {
//   id: "...",
//   firstName: "Admin",
//   lastName: "User",
//   roles: [
//     { name: "admin", display_name: "Administrator", ... },
//     { name: "user", display_name: "User", ... }
//   ],
//   permissions: [
//     "listings.edit.any",
//     "listings.delete.any",
//     ...
//   ]
// }
```

---

## Issue: TypeScript Errors

### Symptoms
- Type errors in IDE
- Build fails with type mismatches

### Common Fixes

**1. Role type mismatch:**
```typescript
// OLD (don't use):
if (currentUser?.role === 'admin') { }

// NEW (use this):
import { hasRole, isAdmin } from "@/app/utils/permissions";
if (isAdmin(currentUser)) { }
```

**2. Missing types:**
Ensure `SafeRole` is exported from `app/types/index.ts`:
```typescript
export type SafeRole = {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  is_system_role?: boolean;
};
```

**3. getCurrentUser type:**
Ensure `SafeUser` includes roles and permissions:
```typescript
export type SafeUser = {
  // ... other fields
  roles?: SafeRole[];
  permissions?: string[];
};
```

---

## Issue: Database Connection Errors

### Symptoms
- Migration scripts fail
- "Connection refused" errors
- SSL certificate errors

### Solution

**Check environment variables:**
```bash
# .env.local should have:
DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
DIRECT_URL=postgresql://postgres.[project-ref]:[password]@aws-0-us-east-1.pooler.supabase.com:5432/postgres
```

**Test connection:**
```bash
node scripts/checkUsersSchema.js
```

**Check Supabase dashboard:**
- Verify database is running
- Check pooler settings
- Verify no IP restrictions

---

## Issue: Roles Not Persisting

### Symptoms
- Assign role but it doesn't stick
- Role appears then disappears
- User loses admin access

### Possible Causes

**1. RLS policies blocking:**
```sql
-- Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'user_roles';

-- If blocking, check policies:
SELECT * FROM pg_policies WHERE tablename = 'user_roles';
```

**2. Expiration dates:**
```sql
-- Check if role has expired
SELECT ur.*, r.name 
FROM user_roles ur
JOIN roles r ON ur.role_id = r.id
WHERE ur.user_id = 'USER_ID_HERE';

-- If expires_at is in the past, update:
UPDATE user_roles 
SET expires_at = NULL 
WHERE user_id = 'USER_ID_HERE';
```

---

## Quick Diagnostics

### Run Full System Check

```bash
# 1. Check database tables
node -e "const {Client}=require('pg');require('dotenv').config({path:'.env.local'});const c=new Client({connectionString:process.env.DATABASE_URL,ssl:false});c.connect().then(()=>c.query('SELECT table_name FROM information_schema.tables WHERE table_schema=\\'public\\' AND table_name IN (\\'roles\\',\\'permissions\\',\\'role_permissions\\',\\'user_roles\\')')).then(r=>{console.log('Tables:',r.rows);c.end()});"

# 2. Check admin user
node -e "const {Client}=require('pg');require('dotenv').config({path:'.env.local'});const c=new Client({connectionString:process.env.DATABASE_URL,ssl:false});c.connect().then(()=>c.query('SELECT * FROM get_user_roles((SELECT id FROM users WHERE email=\\'admin@bookin.social\\'))')).then(r=>{console.log('Admin roles:',r.rows);c.end()});"

# 3. Check permissions
node -e "const {Client}=require('pg');require('dotenv').config({path:'.env.local'});const c=new Client({connectionString:process.env.DATABASE_URL,ssl:false});c.connect().then(()=>c.query('SELECT * FROM get_user_permissions((SELECT id FROM users WHERE email=\\'admin@bookin.social\\')) LIMIT 5')).then(r=>{console.log('Admin permissions:',r.rows);c.end()});"
```

### Test Login

1. Go to http://localhost:3003
2. Login as admin: `admin@bookin.social` / `Admin123!`
3. Open browser console (F12)
4. Check for errors
5. Navigate to any listing
6. Look for 3-dot menu

---

## Getting Help

If issues persist:

1. **Check logs:**
   - Browser console (F12 → Console tab)
   - Terminal running dev server
   - Database logs in Supabase dashboard

2. **Gather information:**
   - What you were trying to do
   - What happened instead
   - Error messages (exact text)
   - Which user account (email)

3. **Review documentation:**
   - `docs/rbac-system-complete.md` - Full reference
   - `docs/PHASE-1-2-COMPLETE.md` - Implementation guide
   - `docs/QUICK-START.md` - Testing guide

---

## Common Commands

```bash
# Restart dev server
taskkill /F /IM node.exe && npm run dev

# Clear cache and restart
Remove-Item -Path .next -Recurse -Force; npm run dev

# Re-run migrations
node scripts/applyRBACMigration.js

# Create admin users
node scripts/createAdminUsersWithRoles.js

# Check database schema
node scripts/checkUsersSchema.js

# View all users with roles (in database)
psql $DATABASE_URL -c "SELECT u.email, array_agg(r.name) as roles FROM users u LEFT JOIN user_roles ur ON u.id=ur.user_id LEFT JOIN roles r ON ur.role_id=r.id GROUP BY u.email;"
```

---

**Last Updated**: October 24, 2025  
**Version**: RBAC Phase 1 & 2

