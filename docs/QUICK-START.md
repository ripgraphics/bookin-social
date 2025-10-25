# 🚀 Quick Start Guide - RBAC System

## Test the System RIGHT NOW

### Step 1: Start the Dev Server (if not running)

```bash
npm run dev
```

Server will start at: http://localhost:3003

### Step 2: Login as Admin

**Option A: Super Admin (Full Access)**
```
Email: superadmin@bookin.social
Password: SuperAdmin123!
```

**Option B: Admin (Almost Full Access)**
```
Email: admin@bookin.social
Password: Admin123!
```

### Step 3: Test Admin Powers

1. **Navigate to any listing** (even ones you didn't create)
2. **Look for the 3-dot vertical icon** (⋮) in the top-right of the listing page
3. **Click it** to see the dropdown menu
4. **You should see:**
   - ✏️ Edit Listing
   - 🗑️ Delete Listing

5. **Try editing a listing:**
   - Click "Edit Listing"
   - Make changes
   - Click "Update"
   - Changes should save successfully

6. **Try deleting a listing** (optional):
   - Click "Delete Listing"
   - Confirm the deletion
   - Listing should be removed
   - You'll be redirected to the home page

### Step 4: Test Regular User (for comparison)

1. **Logout** (click your avatar → Logout)
2. **Login with your existing account** (e.g., ripgraphics.com@gmail.com)
3. **Navigate to someone else's listing**
4. **The 3-dot menu should NOT appear** (or should only appear on your own listings)

This confirms the permission system is working correctly!

## What You Can Do Now

### As Super Admin
- ✅ Edit ANY listing
- ✅ Delete ANY listing
- ✅ Manage user roles (via database, UI coming in Phase 3)
- ✅ Create custom roles and permissions
- ✅ Full system access

### As Admin
- ✅ Edit ANY listing
- ✅ Delete ANY listing
- ✅ Manage users (UI coming in Phase 3)
- ✅ View system statistics
- ⛔ Cannot assign super_admin role
- ⛔ Cannot delete users

### As Regular User
- ✅ Edit own listings only
- ✅ Delete own listings only
- ✅ Create new listings
- ✅ Make reservations
- ⛔ Cannot edit/delete other users' listings

## Common Tasks

### Elevate an Existing User to Admin

**Option 1: Via Database** (fastest)
```sql
-- Get the user's ID
SELECT id, first_name, last_name, email FROM public.users WHERE email = 'user@example.com';

-- Assign admin role
INSERT INTO public.user_roles (user_id, role_id)
SELECT 
  (SELECT id FROM public.users WHERE email = 'user@example.com'),
  (SELECT id FROM public.roles WHERE name = 'admin')
ON CONFLICT DO NOTHING;
```

**Option 2: Via CLI Script** (if you create elevateUserRole.js)
```bash
node scripts/elevateUserRole.js user@example.com admin
```

### View All Users and Their Roles

```sql
SELECT 
  u.first_name,
  u.last_name,
  u.email,
  array_agg(r.name) as roles
FROM public.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
LEFT JOIN public.roles r ON ur.role_id = r.id
GROUP BY u.id, u.first_name, u.last_name, u.email
ORDER BY u.created_at;
```

### View All Permissions for a Role

```sql
SELECT 
  p.name,
  p.resource,
  p.action,
  p.scope,
  p.description
FROM public.role_permissions rp
JOIN public.permissions p ON rp.permission_id = p.id
WHERE rp.role_id = (SELECT id FROM public.roles WHERE name = 'admin')
ORDER BY p.resource, p.action;
```

### Check User's Permissions

```sql
-- Using the helper function
SELECT * FROM get_user_permissions('USER_ID_HERE');

-- Or manually
SELECT DISTINCT p.name
FROM public.user_roles ur
JOIN public.role_permissions rp ON ur.role_id = rp.role_id
JOIN public.permissions p ON rp.permission_id = p.id
WHERE ur.user_id = 'USER_ID_HERE'
AND (ur.expires_at IS NULL OR ur.expires_at > NOW());
```

## Troubleshooting

### Issue: Don't see the 3-dot menu as admin

**Check:**
1. Make sure you're logged in as superadmin@bookin.social or admin@bookin.social
2. Clear browser cache and reload
3. Verify roles in database:
   ```sql
   SELECT * FROM get_user_roles((SELECT id FROM users WHERE email = 'superadmin@bookin.social'));
   ```

### Issue: Getting "Unauthorized" error when editing

**Check:**
1. Verify getCurrentUser is fetching permissions:
   - Check browser console for `[getCurrentUser]` logs
2. Check database:
   ```sql
   SELECT * FROM get_user_permissions((SELECT id FROM users WHERE email = 'admin@bookin.social'));
   ```
3. Verify role-permission mappings:
   ```sql
   SELECT * FROM role_permissions WHERE role_id = (SELECT id FROM roles WHERE name = 'admin');
   ```

### Issue: Cache/build problems

```bash
# Clear Next.js cache
Remove-Item -Path .next -Recurse -Force

# Restart dev server
npm run dev
```

## Next Steps

Once you've verified the RBAC system works:

1. ✅ **Create more admin users** if needed
2. ✅ **Test all permission scenarios**
3. ✅ **Prepare for Phase 3**: Admin Dashboard UI
4. ✅ **Consider custom permissions** for your specific features

## Need Help?

### Check Documentation
- `docs/rbac-system-complete.md` - Full technical reference
- `docs/PHASE-1-2-COMPLETE.md` - Implementation summary
- `docs/admin-users-setup.md` - Admin setup guide (if using old simple approach)

### Useful Commands
```bash
# View migration history
ls supabase/migrations/

# Re-run migrations (if needed)
node scripts/applyRBACMigration.js

# Create new admin users
node scripts/createAdminUsersWithRoles.js

# Check database connection
node scripts/checkUsersSchema.js
```

---

**Quick Test Checklist:**
- [ ] Login as super admin
- [ ] See 3-dot menu on any listing
- [ ] Edit someone else's listing successfully
- [ ] Delete a test listing successfully
- [ ] Login as regular user
- [ ] Cannot see 3-dot menu on others' listings
- [ ] Can see 3-dot menu on own listings

✅ **All checks passed? Your RBAC system is working perfectly!**

---

**Time to test**: 5 minutes  
**Difficulty**: Easy  
**Status**: Ready NOW 🎉

