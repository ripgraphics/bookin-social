# Property Management System - Comprehensive CRUD Testing Plan

## Overview
This document outlines the complete testing plan for all CRUD operations across all user roles in the Property Management System.

## Test Data Summary

### Seeded Data
- **Properties**: 3 properties managed
- **Assignments**: 2 host/co-host assignments
- **Invoices**: 2 invoices (1 rental, 1 operational)
- **Invoice Line Items**: 6 line items
- **Expenses**: 3 expenses (2 pending, 1 approved)
- **Payments**: 2 payments (1 partial, 1 full)
- **Reservations**: 3 reservations (for guest testing)

### Test Users
1. **Property Owner**: `ripgraphics.com@gmail.com` (Owner role)
2. **Host**: `ripgraphics2@gmail.com` (host role)
3. **Co-Host**: `ripgraphics1@gmail.com` (co_host role)
4. **Guest**: Users with reservations (for guest testing)

## Testing Checklist

### Phase 1: Property Owner Testing

#### Dashboard Access
- [ ] Navigate to `/apps/property-management`
- [ ] Verify Owner Dashboard loads correctly
- [ ] Verify stats cards display:
  - [ ] Total Properties count
  - [ ] Total Revenue amount
  - [ ] Pending Expenses count
  - [ ] Active Reservations count
- [ ] Verify Quick Actions section displays
- [ ] Verify Recent Invoices list displays
- [ ] Verify Pending Expenses list displays

#### Properties Management
**List Properties**
- [ ] Navigate to `/apps/property-management/properties`
- [ ] Verify only owner's properties are displayed
- [ ] Verify property cards show correct information
- [ ] Test filtering/search (if implemented)
- [ ] Test pagination (if implemented)

**View Property Details**
- [ ] Click on a property from the list
- [ ] Verify property details page loads
- [ ] Verify all property information displays correctly
- [ ] Verify assignments section shows hosts/co-hosts
- [ ] Verify invoices section shows property invoices
- [ ] Verify expenses section shows property expenses

**Create Property**
- [ ] Navigate to `/apps/property-management/properties/new`
- [ ] Fill out property form
- [ ] Select a listing
- [ ] Set management type
- [ ] Set commission rates
- [ ] Submit form
- [ ] Verify property created successfully
- [ ] Verify property appears in list

**Edit Property**
- [ ] Navigate to property edit page
- [ ] Modify property details
- [ ] Update commission rates
- [ ] Submit changes
- [ ] Verify changes saved correctly
- [ ] Verify updated data displays in details page

**Delete Property**
- [ ] Navigate to property details page
- [ ] Click delete button
- [ ] Confirm deletion
- [ ] Verify property removed from list
- [ ] Verify related data handled correctly

#### Invoice Management
**List Invoices**
- [ ] Navigate to `/apps/property-management/invoices`
- [ ] Verify all invoices for owner's properties display
- [ ] Verify rental invoices display
- [ ] Verify operational invoices display
- [ ] Test filtering by status
- [ ] Test filtering by type

**View Invoice Details**
- [ ] Click on an invoice
- [ ] Verify invoice details display correctly
- [ ] Verify line items display correctly
- [ ] Verify payment history displays (if applicable)
- [ ] Verify invoice can be downloaded as PDF (if implemented)

**Create Invoice**
- [ ] Navigate to `/apps/property-management/invoices/new`
- [ ] Fill out invoice form
- [ ] Select property
- [ ] Add line items
- [ ] Set dates and amounts
- [ ] Submit invoice
- [ ] Verify invoice created successfully
- [ ] Verify invoice appears in list

**Edit Invoice (Unpaid Only)**
- [ ] Navigate to unpaid invoice edit page
- [ ] Modify invoice details
- [ ] Update line items
- [ ] Submit changes
- [ ] Verify changes saved
- [ ] Verify paid invoices cannot be edited

**Delete Invoice**
- [ ] Navigate to invoice details
- [ ] Delete invoice
- [ ] Verify invoice removed
- [ ] Verify only invoices issued by owner can be deleted

#### Expense Management
**List Expenses**
- [ ] Navigate to `/apps/property-management/expenses`
- [ ] Verify all expenses for owner's properties display
- [ ] Test filtering by status
- [ ] Test filtering by property
- [ ] Test filtering by expense type

**View Expense Details**
- [ ] Click on an expense
- [ ] Verify expense details display correctly
- [ ] Verify receipt displays (if uploaded)
- [ ] Verify approval status displays
- [ ] Verify can approve/reject (owner only)

**Approve Expense**
- [ ] Navigate to pending expense
- [ ] Click approve button
- [ ] Verify expense status changes to approved
- [ ] Verify expense appears in approved list
- [ ] Verify notification sent (if implemented)

**Reject Expense**
- [ ] Navigate to pending expense
- [ ] Click reject button
- [ ] Enter rejection reason
- [ ] Submit rejection
- [ ] Verify expense status changes to rejected
- [ ] Verify rejection reason displays

**Delete Expense**
- [ ] Navigate to pending/rejected expense
- [ ] Delete expense
- [ ] Verify expense removed
- [ ] Verify approved expenses cannot be deleted

#### Financial Statements
- [ ] Navigate to `/apps/property-management/statements`
- [ ] Verify statements load correctly
- [ ] Verify revenue breakdown displays
- [ ] Verify expense breakdown displays
- [ ] Verify net income calculation
- [ ] Test period filtering (if implemented)
- [ ] Test property filtering (if implemented)
- [ ] Verify statements can be downloaded (if implemented)

### Phase 2: Host/Co-Host Testing

#### Dashboard Access
- [ ] Login as host/co-host
- [ ] Navigate to `/apps/property-management`
- [ ] Verify Host Dashboard loads correctly
- [ ] Verify stats cards display:
  - [ ] Assigned Properties count
  - [ ] Total Commissions amount
  - [ ] Pending Invoices count
  - [ ] Submitted Expenses count
- [ ] Verify Quick Actions section displays
- [ ] Verify Recent Assignments list displays

#### Properties Management
**View Assigned Properties**
- [ ] Navigate to `/apps/property-management/properties`
- [ ] Verify only assigned properties display
- [ ] Verify property cards show correct information
- [ ] Verify cannot see unassigned properties

**View Property Details**
- [ ] Click on assigned property
- [ ] Verify property details display
- [ ] Verify role indicator shows (host/co-host)
- [ ] Verify cannot edit property (owner only)
- [ ] Verify can view invoices and expenses

#### Invoice Management
**List Invoices**
- [ ] Navigate to `/apps/property-management/invoices`
- [ ] Verify only invoices created by host display
- [ ] Verify operational invoices display
- [ ] Verify cannot see other hosts' invoices

**Create Operational Invoice**
- [ ] Navigate to `/apps/property-management/invoices/new`
- [ ] Fill out invoice form
- [ ] Select assigned property
- [ ] Set invoice type to 'operational'
- [ ] Add line items (cleaning, repair, maintenance)
- [ ] Set issued_to as property owner
- [ ] Submit invoice
- [ ] Verify invoice created successfully
- [ ] Verify invoice appears in owner's list

**Edit Invoice**
- [ ] Navigate to unpaid invoice edit page
- [ ] Modify invoice details
- [ ] Submit changes
- [ ] Verify changes saved
- [ ] Verify only invoices issued by host can be edited

**Delete Invoice**
- [ ] Delete invoice issued by host
- [ ] Verify invoice removed
- [ ] Verify cannot delete other hosts' invoices

#### Expense Management
**List Expenses**
- [ ] Navigate to `/apps/property-management/expenses`
- [ ] Verify only expenses created by host display
- [ ] Verify pending expenses display
- [ ] Verify approved expenses display
- [ ] Verify rejected expenses display

**Submit Expense**
- [ ] Navigate to `/apps/property-management/expenses/new`
- [ ] Fill out expense form
- [ ] Select assigned property
- [ ] Set expense type
- [ ] Enter description and amount
- [ ] Upload receipt (if available)
- [ ] Submit expense
- [ ] Verify expense created with 'pending' status
- [ ] Verify expense appears in owner's pending list

**Edit Expense (Pending Only)**
- [ ] Navigate to pending expense edit page
- [ ] Modify expense details
- [ ] Submit changes
- [ ] Verify changes saved
- [ ] Verify approved/rejected expenses cannot be edited

**Delete Expense**
- [ ] Delete pending expense
- [ ] Verify expense removed
- [ ] Verify approved expenses cannot be deleted

### Phase 3: Guest Testing

#### Dashboard Access
- [ ] Login as guest (user with reservations)
- [ ] Navigate to `/apps/property-management`
- [ ] Verify Guest Dashboard loads correctly
- [ ] Verify stats cards display:
  - [ ] Total Invoices count
  - [ ] Total Paid amount
  - [ ] Pending Payment amount
  - [ ] Upcoming Trips count

#### Invoice Management
**List Invoices**
- [ ] Navigate to `/apps/property-management/invoices`
- [ ] Verify only rental invoices issued to guest display
- [ ] Verify operational invoices do NOT display
- [ ] Verify invoices for other users do NOT display
- [ ] Test filtering by status

**View Invoice Details**
- [ ] Click on rental invoice
- [ ] Verify invoice details display correctly
- [ ] Verify line items display correctly
- [ ] Verify payment history displays
- [ ] Verify download receipt button works

**Make Payment**
- [ ] Navigate to unpaid invoice
- [ ] Click "Make Payment" button
- [ ] Enter payment details
- [ ] Submit payment
- [ ] Verify payment processed
- [ ] Verify invoice status updates
- [ ] Verify payment appears in history

#### Payment History
- [ ] Navigate to `/apps/property-management/payments`
- [ ] Verify all payments made by guest display
- [ ] Verify payment details display correctly
- [ ] Verify receipt download works
- [ ] Test filtering by date (if implemented)

### Phase 4: Admin Testing

#### Dashboard Access
- [ ] Login as admin
- [ ] Navigate to `/admin/apps/property-management`
- [ ] Verify admin PMS dashboard loads
- [ ] Verify system-wide statistics display
- [ ] Verify all properties visible
- [ ] Verify all invoices visible
- [ ] Verify all expenses visible

#### System-Wide Access
- [ ] Verify can view any property
- [ ] Verify can view any invoice
- [ ] Verify can view any expense
- [ ] Verify can view any payment
- [ ] Verify can perform bulk operations (if implemented)

### Phase 5: Data Isolation Testing

#### Owner Isolation
- [ ] Login as Property Owner A
- [ ] Verify cannot see Property Owner B's properties
- [ ] Verify cannot see Property Owner B's invoices
- [ ] Verify cannot see Property Owner B's expenses
- [ ] Verify cannot edit Property Owner B's data

#### Host Isolation
- [ ] Login as Host A
- [ ] Verify cannot see Host B's invoices
- [ ] Verify cannot see Host B's expenses
- [ ] Verify can only see assigned properties
- [ ] Verify cannot see unassigned properties

#### Guest Isolation
- [ ] Login as Guest A
- [ ] Verify cannot see Guest B's invoices
- [ ] Verify cannot see Guest B's payments
- [ ] Verify cannot see operational invoices
- [ ] Verify can only see own rental invoices

### Phase 6: Permission Testing

#### Unauthorized Access
- [ ] Login as regular user (no PMS role)
- [ ] Navigate to `/apps/property-management`
- [ ] Verify redirects to homepage
- [ ] Verify PMS link not in user menu

#### Role-Based Navigation
- [ ] Verify Property Owner sees Owner Dashboard
- [ ] Verify Host sees Host Dashboard
- [ ] Verify Co-Host sees Host Dashboard
- [ ] Verify Guest sees Guest Dashboard
- [ ] Verify Admin redirected to admin PMS

#### API Endpoint Security
- [ ] Test API endpoints without authentication
- [ ] Verify returns 401 Unauthorized
- [ ] Test API endpoints with wrong role
- [ ] Verify returns 403 Forbidden
- [ ] Test API endpoints with correct role
- [ ] Verify returns data correctly filtered

### Phase 7: Error Handling Testing

#### Form Validation
- [ ] Submit empty forms
- [ ] Verify validation errors display
- [ ] Submit invalid data
- [ ] Verify error messages helpful
- [ ] Submit valid data
- [ ] Verify success messages display

#### Network Errors
- [ ] Disconnect network
- [ ] Perform CRUD operations
- [ ] Verify error handling
- [ ] Verify user-friendly error messages
- [ ] Reconnect network
- [ ] Verify recovery works

#### Edge Cases
- [ ] Test with zero properties
- [ ] Test with zero invoices
- [ ] Test with zero expenses
- [ ] Test with very large amounts
- [ ] Test with special characters in inputs
- [ ] Test with very long descriptions

### Phase 8: Performance Testing

#### Page Load Times
- [ ] Measure dashboard load time (< 2s target)
- [ ] Measure properties list load time
- [ ] Measure invoices list load time
- [ ] Measure expenses list load time
- [ ] Measure property details load time

#### Query Performance
- [ ] Monitor API response times
- [ ] Check database query performance
- [ ] Verify no N+1 queries
- [ ] Verify proper indexing used

### Phase 9: Browser Testing

#### Cross-Browser
- [ ] Test in Chrome
- [ ] Test in Firefox
- [ ] Test in Safari
- [ ] Test in Edge
- [ ] Verify consistent behavior

#### Responsive Design
- [ ] Test on desktop (1920x1080)
- [ ] Test on tablet (768x1024)
- [ ] Test on mobile (375x667)
- [ ] Verify layouts adapt correctly
- [ ] Verify all features accessible

## Testing Execution

### Step 1: Start Dev Server
```bash
npm run dev
```

### Step 2: Login as Test User
Use one of the seeded test users:
- Property Owner: User with properties
- Host: User with host assignment
- Co-Host: User with co-host assignment
- Guest: User with reservations

### Step 3: Execute Test Cases
Follow the checklist above, checking off items as completed.

### Step 4: Document Results
- Note any bugs found
- Note any performance issues
- Note any UX improvements needed
- Document test results

### Step 5: Fix Issues
- Address critical bugs immediately
- Prioritize security issues
- Fix performance bottlenecks
- Improve error handling

## Success Criteria

### Functional
- ✅ All CRUD operations work correctly
- ✅ Data isolation enforced properly
- ✅ Role-based access control working
- ✅ No permission leakage
- ✅ Error handling robust

### Performance
- ✅ Page loads < 2 seconds
- ✅ API responses < 500ms
- ✅ No N+1 queries
- ✅ Database queries optimized

### Security
- ✅ RLS policies enforced
- ✅ API filtering working
- ✅ No unauthorized access
- ✅ Data properly isolated

### UX
- ✅ Intuitive navigation
- ✅ Clear error messages
- ✅ Loading states visible
- ✅ Responsive design
- ✅ Accessible interface

## Test Results Template

```
## Test Date: [DATE]
## Tester: [NAME]
## Role Tested: [ROLE]

### Dashboard
- [ ] Status: Pass/Fail
- [ ] Notes: [Any issues found]

### Properties
- [ ] List: Pass/Fail
- [ ] View: Pass/Fail
- [ ] Create: Pass/Fail
- [ ] Edit: Pass/Fail
- [ ] Delete: Pass/Fail
- [ ] Notes: [Any issues found]

### Invoices
- [ ] List: Pass/Fail
- [ ] View: Pass/Fail
- [ ] Create: Pass/Fail
- [ ] Edit: Pass/Fail
- [ ] Delete: Pass/Fail
- [ ] Notes: [Any issues found]

### Expenses
- [ ] List: Pass/Fail
- [ ] View: Pass/Fail
- [ ] Create: Pass/Fail
- [ ] Edit: Pass/Fail
- [ ] Delete: Pass/Fail
- [ ] Approve/Reject: Pass/Fail
- [ ] Notes: [Any issues found]

### Data Isolation
- [ ] Status: Pass/Fail
- [ ] Notes: [Any issues found]

### Performance
- [ ] Dashboard Load: [TIME]ms
- [ ] Properties List: [TIME]ms
- [ ] Invoices List: [TIME]ms
- [ ] Notes: [Any issues found]
```

## Next Steps After Testing

1. **Fix Critical Issues**: Address security and data integrity issues immediately
2. **Performance Optimization**: Optimize slow queries and pages
3. **UX Improvements**: Enhance user experience based on feedback
4. **Documentation**: Update user guides with any findings
5. **Production Deployment**: Deploy after all tests pass

