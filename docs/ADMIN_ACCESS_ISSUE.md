# Admin Dashboard Access Issue - Critical Bug Report

## Summary
While implementing the Property Management System (PMS) navigation and attempting to test the admin dashboard, a critical bug was discovered that prevents admin users from accessing the admin area.

## What Was Completed
✅ **Property Management System added to Admin Sidebar**
- Added `Building2` icon import to `app/components/admin/AdminSidebar.tsx`
- Added "Property Management" menu item to the Apps section
- PMS now appears as the 12th app in the admin sidebar navigation

## Critical Bug Discovered

### Issue
Admin and super admin users cannot access `/admin` dashboard - they are redirected to the homepage even though they have the required `admin.dashboard.access` permission in the database.

### Root Cause
The `getCurrentUser()` function in `app/actions/getCurrentUser.ts` uses a **global in-memory cache** that is shared across all requests in the Node.js process:

```typescript
// Simple in-memory cache to prevent duplicate calls
let userCache: { user: any; timestamp: number } | null = null;
const CACHE_DURATION = 1000; // 1 second cache
```

**Problem**: This cache is not request-scoped. When User A logs in, their data (including permissions) is cached globally. When User B logs in, they may receive User A's cached data, including User A's permissions.

### Evidence
1. **Database Verification**: Direct database query confirms admin user has `admin.dashboard.access` permission:
   ```
   🔑 Permissions (via RPC):
      - admin.dashboard.access
      - admin.users.manage
      - admin.stats.view
      - admin.logs.view
   ```

2. **Behavior**: 
   - User logs in as regular user → no admin access (correct)
   - User logs out, logs in as admin → still no admin access (incorrect - using cached data from previous user)
   - Server restart → still redirects (cache persists across server restarts because browser session is maintained)

3. **Code Flow**:
   - `app/(admin)/layout.tsx` calls `getCurrentUser()`
   - `getCurrentUser()` returns cached user without permissions
   - `canAccessAdminDashboard(currentUser)` returns `false`
   - User is redirected to homepage

## Recommended Fix

### Option 1: Request-Scoped Cache (Recommended)
Use Next.js's `cache()` function to make the cache request-scoped:

```typescript
import { cache } from 'react';

export const getCurrentUser = cache(async () => {
  try {
    // ... existing logic without global userCache
  } catch (error) {
    return null;
  }
});
```

### Option 2: Remove Cache Entirely
If caching is not critical for performance, remove the global cache:

```typescript
export default async function getCurrentUser() {
  try {
    const startTime = Date.now();
    
    // Use optimized approach for production (direct pg pool)
    if (USE_DIRECT_PG) {
      return await getCurrentUserOptimized(startTime);
    }
    
    // Use Supabase client for local development
    return await getCurrentUserSupabase(startTime);
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[getCurrentUser] Error:', error);
    }
    return null;
  }
}
```

### Option 3: Session-Based Cache
Use a session-based cache keyed by the user's session token:

```typescript
const userCacheMap = new Map<string, { user: any; timestamp: number }>();

export default async function getCurrentUser() {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) return null;
    
    const cacheKey = session.access_token;
    const cached = userCacheMap.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.user;
    }
    
    // ... fetch user data
    
    userCacheMap.set(cacheKey, { user, timestamp: Date.now() });
    return user;
  } catch (error) {
    return null;
  }
}
```

## Impact
- **Severity**: CRITICAL
- **Affected**: All admin/super admin users
- **Workaround**: None currently available
- **Security Risk**: Potential for permission escalation if a regular user's session is cached after an admin's session

## Next Steps
1. Implement Option 1 (Request-Scoped Cache) as it's the most Next.js-idiomatic solution
2. Test admin access with multiple users
3. Verify no permission leakage between sessions
4. Continue with comprehensive admin dashboard testing (Phase 2 of the original plan)

## Testing Checklist (Once Fixed)
- [ ] PMS visible in sidebar navigation
- [ ] Admin user can access `/admin`
- [ ] Super admin user can access `/admin`
- [ ] Regular user cannot access `/admin`
- [ ] Permissions don't leak between user sessions
- [ ] All 12 apps load successfully
- [ ] PMS CRUD operations work
- [ ] No console or connection errors

## Files Modified
- `app/components/admin/AdminSidebar.tsx` - Added PMS navigation item
- `scripts/checkAdminPermissions.js` - Created to verify database permissions

## Files Requiring Fix
- `app/actions/getCurrentUser.ts` - Global cache needs to be request-scoped

