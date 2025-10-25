# Admin Users Setup Guide

## Overview
This guide will help you create super admin and admin users for your Bookin application with proper role-based permissions.

## Step 1: Add Role System to Database

### Run this SQL in your Supabase Dashboard:

1. **Go to your Supabase Dashboard**
2. **Navigate to SQL Editor**
3. **Run the following SQL commands:**

```sql
-- Add role column to users table
ALTER TABLE public.users ADD COLUMN role TEXT DEFAULT 'user' NOT NULL;

-- Create index for role queries
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

-- Add check constraint for valid roles
ALTER TABLE public.users ADD CONSTRAINT check_valid_role 
CHECK (role IN ('user', 'admin', 'super_admin'));

-- Update existing users to have 'user' role
UPDATE public.users SET role = 'user' WHERE role IS NULL;
```

## Step 2: Create Admin Users

After running the SQL above, run this command in your terminal:

```bash
node scripts/createAdminUsersSimple.js
```

This will create:
- **Super Admin**: `superadmin@bookin.social` / `SuperAdmin123!`
- **Admin**: `admin@bookin.social` / `Admin123!`

## Step 3: Verify Setup

After creating the users, you should see output like:

```
📋 All users with roles:
- Direct Link (directlink@bookin.social) - Role: user
- Super Admin (superadmin@bookin.social) - Role: super_admin
- Admin User (admin@bookin.social) - Role: admin
```

## Role Permissions

### User (default)
- Can create, edit, and delete their own listings
- Can make reservations
- Can manage their own profile

### Admin
- Can do everything a user can do
- Can edit and delete ANY listing
- Can view all user data
- Cannot delete users

### Super Admin
- Can do everything an admin can do
- Can delete users
- Can manage all user roles
- Full system access

## Testing Admin Features

1. **Login as Super Admin**:
   - Email: `superadmin@bookin.social`
   - Password: `SuperAdmin123!`

2. **Login as Admin**:
   - Email: `admin@bookin.social`
   - Password: `Admin123!`

3. **Test Admin Permissions**:
   - Navigate to any listing (even ones you didn't create)
   - You should see the 3-dot menu with Edit and Delete options
   - Try editing a listing created by another user
   - Try deleting a listing created by another user

## Security Notes

- **Change default passwords** after first login
- **Super Admin** has full system access - use carefully
- **Admin** can manage listings but not users
- All role checks are enforced both client-side and server-side

## Troubleshooting

### If you get "column users.role does not exist":
- Make sure you ran the SQL commands in Step 1
- Check that the migration was successful in Supabase dashboard

### If admin users can't edit listings:
- Verify the role was set correctly in the database
- Check that the application code is updated (already done)
- Clear browser cache and try again

### If you need to manually set a user's role:
```sql
UPDATE public.users 
SET role = 'admin' 
WHERE email = 'user@example.com';
```

## Files Modified

1. **Database Schema**: Added `role` column to `public.users`
2. **Types**: Updated `SafeUser` type to include role
3. **getCurrentUser**: Now fetches and returns user role
4. **API Routes**: Updated to check admin permissions
5. **ListingClient**: Updated to show edit/delete for admins
6. **Scripts**: Created admin user creation scripts

## Next Steps

After setting up admin users:

1. **Test the functionality** by logging in as different roles
2. **Create additional admin users** if needed
3. **Consider adding admin dashboard** for user management
4. **Implement role-based UI** (hide/show features based on role)
5. **Add audit logging** for admin actions

---

**Status**: ✅ Ready to implement  
**Estimated Time**: 5-10 minutes  
**Dependencies**: Supabase dashboard access
