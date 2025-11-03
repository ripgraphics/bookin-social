# Duplicate Headers & Max Clients Connection Issue - Resolution Summary

## Date
November 2, 2025

## Problem Statement

### Issue 1: Duplicate Headers
The admin area was displaying two headers:
1. Public `Navbar` from root layout (`app/layout.tsx`)
2. `AdminHeader` from admin layout (`app/(admin)/layout.tsx`)

**Root Cause**: Both layouts were rendering headers simultaneously.

### Issue 2: Max Clients Connection Error
Frequent database connection errors occurred:
```
Error: MaxClientsInSessionMode: max clients reached - in Session mode max clients are limited to pool_size
```

**Root Cause**: Development environment was using direct PostgreSQL pool connection which hit Supabase Session mode connection limits. Additionally, `getCurrentUser()` was being called twice per page load (once from root layout, once from main layout), causing connection pool exhaustion.

## Solutions Implemented

### 1. Fixed Duplicate Headers
- **Modified**: `app/layout.tsx`
  - Removed `<Navbar>` component and all associated modals
  - Removed `getCurrentUser()` call (was unused)
  - Kept only `<ToasterProvider />` and global modals

- **Modified**: `app/(main)/layout.tsx`
  - Added `<Navbar currentUser={currentUser} />` 
  - Added `getCurrentUser()` call to fetch user data
  - Added `pb-20 pt-28` padding for navbar height

**Result**: 
- Admin pages: Only `AdminHeader` + `AdminSidebar` visible ✅
- Public pages: Only `Navbar` visible ✅
- No duplicate headers anywhere ✅

### 2. Fixed Max Clients Connection Issue

**Modified Files**:
- `app/actions/getCurrentUser.ts`
- `app/actions/getListings.ts`
- `app/actions/getListingById.ts`
- `app/actions/getReservations.ts`
- `lib/db/pool.ts`

**Changes**:

#### A. Hybrid Approach Based on Environment
Changed `USE_DIRECT_PG` detection logic:
```typescript
// OLD: Always use direct pg if SUPABASE_DB_URL is set
const USE_DIRECT_PG = !!process.env.SUPABASE_DB_URL || !!process.env.DATABASE_URL;

// NEW: Only use in production to avoid max clients issues in development
const USE_DIRECT_PG = process.env.NODE_ENV === 'production' && (!!process.env.SUPABASE_DB_URL || !!process.env.DATABASE_URL);
```

**Impact**: 
- **Development**: Uses Supabase client (no connection limits)
- **Production**: Uses optimized direct PostgreSQL pool (better performance)

#### B. Reduced Connection Pool Size
Modified `lib/db/pool.ts`:
```typescript
max: 5, // Reduced from 10 to prevent max clients error in development
idleTimeoutMillis: 10_000, // Reduced from 30s for faster cleanup
connectionTimeoutMillis: 30_000, // Increased from 10s to 30s for Supabase
```

## Test Results

### Before Fix
- ❌ Duplicate headers on all pages
- ❌ Frequent "max clients reached" errors
- ❌ Homepage showing "No exact matches"
- ❌ Admin area redirecting to homepage
- ❌ Multiple connection pool exhaustion errors

### After Fix
- ✅ Single header on all pages (correct header for each route group)
- ✅ No connection errors in development
- ✅ Homepage loading successfully with 6 listings
- ✅ Supabase client working correctly in development
- ✅ Performance timing logs showing normal queries:
  - `getListings`: 288-3323ms (Supabase)
  - `getCurrentUser`: 3338-6100ms (Supabase)
  - `getFavoriteIds`: Normal

## Technical Details

### Architecture
The system now uses a **hybrid approach** for database access:

**Development (`NODE_ENV !== 'production'`)**:
- Uses Supabase client via REST API
- No connection pool limits
- Slower but more stable for development
- Debug-friendly logs

**Production (`NODE_ENV === 'production'`)**:
- Uses direct PostgreSQL pool connection
- Optimized for performance
- Cached queries
- JWT decoding to avoid remote auth calls

### Layout Hierarchy
```
Root Layout (`app/layout.tsx`)
├── ToasterProvider
├── Modals (Login, Register, Search, Edit, Rent)
└── Children
    ├── Main Layout (`app/(main)/layout.tsx`)
    │   ├── Navbar (for public routes)
    │   └── Children (homepage, listings, etc.)
    ├── Admin Layout (`app/(admin)/layout.tsx`)
    │   ├── AdminHeader
    │   ├── AdminSidebar
    │   └── Children (admin pages)
    └── Other Route Groups...
```

## Files Modified

1. `app/layout.tsx` - Removed Navbar and getCurrentUser
2. `app/(main)/layout.tsx` - Added Navbar and getCurrentUser
3. `app/actions/getCurrentUser.ts` - Hybrid approach based on NODE_ENV
4. `app/actions/getListings.ts` - Hybrid approach based on NODE_ENV
5. `app/actions/getListingById.ts` - Hybrid approach based on NODE_ENV
6. `app/actions/getReservations.ts` - Hybrid approach based on NODE_ENV
7. `lib/db/pool.ts` - Reduced pool size and adjusted timeouts

## Verification

To verify the fix:
1. ✅ Navigate to homepage - only one `Navbar` visible
2. ✅ Navigate to admin area - only `AdminHeader` visible
3. ✅ Check browser console - no "max clients reached" errors
4. ✅ Check terminal logs - using Supabase client in dev
5. ✅ Homepage loads with listings successfully
6. ✅ No duplicate headers anywhere

## Next Steps

Continue with PMS CRUD testing:
- [ ] Test Property Management CRUD operations
- [ ] Test Invoice Management CRUD operations
- [ ] Test Expense Management CRUD operations
- [ ] Test Payment Management operations

## Lessons Learned

1. **Development vs Production**: Different environments require different database connection strategies
2. **Layout Hierarchy**: Careful placement of shared components is crucial to avoid duplication
3. **Connection Pool Management**: Smaller pools with faster cleanup help in development
4. **Environment Detection**: Use `NODE_ENV` to determine optimal connection strategy

## References

- [Supabase Connection Pooling](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)
- [Next.js Layouts](https://nextjs.org/docs/app/building-your-application/routing/pages-and-layouts)
- [pg Library Documentation](https://node-postgres.com/api/pool)

