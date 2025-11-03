# Property Management System - Dual Access Implementation Progress

## Overview
Implementing a comprehensive dual-access Property Management System where both frontend users (property owners, hosts, co-hosts, guests) and backend admins can access PMS features with role-based views and data isolation.

## Completed (Phase 1 - Foundation)

### ✅ 1. Role Detection Utilities
**File**: `app/utils/pms-access.ts`

**Functions Implemented:**
- `isPropertyOwner(userId)` - Check if user owns properties
- `isHost(userId)` - Check if user is assigned as host
- `isCoHost(userId)` - Check if user is assigned as co-host
- `isPMSUser(userId)` - Check if user has any PMS role
- `canAccessPMS(user)` - Determine if user can access frontend PMS
- `getPMSRole(userId)` - Return primary PMS role for dashboard
- `isAdmin(user)` - Check if user is admin (for admin PMS access)
- `getUserPropertyIds(userId)` - Get user's property IDs (for owners)
- `getUserAssignedPropertyIds(userId)` - Get user's assigned property IDs (for hosts/co-hosts)

### ✅ 2. Frontend Route Structure
**Directory**: `app/(main)/apps/property-management/`

**Created:**
- `page.tsx` - Main PMS entry point with role detection and routing

### ✅ 3. Role-Specific Dashboard Components
**Directory**: `app/components/property-management/frontend/`

**Created:**
- `OwnerDashboard.tsx` - Dashboard for property owners
  - Total properties, revenue, pending expenses, active reservations
  - Quick actions: View properties, review expenses, financial statements
  - Pending expense approvals list
  - Recent invoices list

- `HostDashboard.tsx` - Dashboard for hosts and co-hosts
  - Assigned properties, commissions, pending invoices, submitted expenses
  - Quick actions: View properties, create invoice, submit expense
  - Assigned properties list
  - Recent invoices list

- `GuestDashboard.tsx` - Dashboard for guests
  - Total invoices, total paid, pending payment, upcoming trips
  - Pending payments list
  - Recent invoices with download receipt functionality
  - Upcoming reservations list

### ✅ 4. Dashboard API Endpoints
**Created:**
- `app/api/pms/owner/dashboard/route.ts` - Owner-specific metrics and data
- `app/api/pms/host/dashboard/route.ts` - Host/co-host-specific metrics and data
- `app/api/pms/guest/dashboard/route.ts` - Guest-specific metrics and data
- `app/api/pms/check-access/route.ts` - Check if user has PMS access

### ✅ 5. Navigation Integration
**File**: `app/components/navbar/UserMenu.tsx`

**Changes:**
- Added "Property Management" menu item
- Conditional display based on `hasPMSAccess` state
- Client-side PMS access check via API
- Positioned between "My properties" and "Host your home"

## Architecture Decisions

### Data Isolation Strategy
1. **Frontend PMS** (`/apps/property-management`):
   - Role detection on page load
   - Redirects admins to admin PMS
   - Redirects users without access to homepage
   - Shows role-appropriate dashboard

2. **Backend PMS** (`/admin/apps/property-management`):
   - Existing admin-only access via layout middleware
   - System-wide data access
   - Admin-specific features and bulk actions

### API Route Patterns
All dashboard endpoints follow this pattern:
```typescript
1. Authenticate user via Supabase
2. Get public.users id from auth_user_id
3. Query role-specific data with appropriate filters
4. Return aggregated stats and recent items
```

### Role Priority
When determining primary role:
1. Owner (highest priority)
2. Host
3. Co-Host
4. Guest (lowest priority)

## Next Steps

### Phase 2: Frontend PMS Pages (In Progress)
- [ ] Create `properties/page.tsx` - User's properties list
- [ ] Create `properties/[id]/page.tsx` - Property details
- [ ] Create `invoices/page.tsx` - User's invoices list
- [ ] Create `invoices/[id]/page.tsx` - Invoice details
- [ ] Create `invoices/new/page.tsx` - Create invoice (hosts only)
- [ ] Create `expenses/page.tsx` - Expenses list
- [ ] Create `expenses/[id]/page.tsx` - Expense details
- [ ] Create `expenses/new/page.tsx` - Submit expense
- [ ] Create `payments/page.tsx` - Payment history
- [ ] Create `statements/page.tsx` - Financial statements (owners only)

### Phase 3: API Route Updates with Role-Based Filtering
- [ ] Update `app/api/properties/management/route.ts`
- [ ] Update `app/api/invoices/v2/route.ts`
- [ ] Update `app/api/expenses/route.ts`
- [ ] Update `app/api/payments/route.ts`

### Phase 4: Admin PMS Differentiation
- [ ] Add "Admin View" indicator to admin PMS pages
- [ ] Add system-wide statistics
- [ ] Add bulk actions
- [ ] Add configuration options

### Phase 5: RLS Policies
- [ ] Create RLS policies for `property_management` table
- [ ] Create RLS policies for `invoices_v2` table
- [ ] Create RLS policies for `property_expenses` table
- [ ] Create RLS policies for `payments` table

### Phase 6: Testing
- [ ] Test as Property Owner
- [ ] Test as Host
- [ ] Test as Co-Host
- [ ] Test as Guest
- [ ] Test as Admin
- [ ] Verify data isolation
- [ ] Verify permission checks

## Technical Notes

### Component Reuse
The following shared components are reused across both admin and frontend PMS:
- `StatusBadge.tsx`
- `StatCard.tsx`
- `LoadingSkeleton.tsx`
- `PropertyForm.tsx` (will be modified to hide admin-only fields)
- `InvoiceForm.tsx` (will be modified for operational invoices)
- `ExpenseForm.tsx`
- `ReceiptUploader.tsx`

### Performance Considerations
- Dashboard API endpoints use parallel queries where possible
- Limited result sets (e.g., 5 recent items) for faster loading
- Aggregations done in database queries, not in application code

### Security Considerations
- All API routes check authentication
- Role-based filtering applied at query level
- Server-side access checks on all pages
- RLS policies will provide additional database-level security

## Files Created/Modified

### New Files (11)
1. `app/utils/pms-access.ts`
2. `app/(main)/apps/property-management/page.tsx`
3. `app/components/property-management/frontend/OwnerDashboard.tsx`
4. `app/components/property-management/frontend/HostDashboard.tsx`
5. `app/components/property-management/frontend/GuestDashboard.tsx`
6. `app/api/pms/owner/dashboard/route.ts`
7. `app/api/pms/host/dashboard/route.ts`
8. `app/api/pms/guest/dashboard/route.ts`
9. `app/api/pms/check-access/route.ts`
10. `docs/PMS_DUAL_ACCESS_PROGRESS.md` (this file)

### Modified Files (1)
1. `app/components/navbar/UserMenu.tsx`

## Status
**Phase 1 Complete**: Foundation and role-specific dashboards implemented.
**Phase 2 Complete**: All frontend PMS pages implemented for properties, invoices, expenses, payments, and statements.
**Phase 3 Complete**: All API routes updated with role-based filtering and database-level security.
**Phase 4 Complete**: RLS policies verified and enhanced for comprehensive database-level security.
**Next**: Comprehensive testing, validation, and production deployment preparation.

