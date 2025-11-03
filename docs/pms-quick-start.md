# Property Management System - Quick Start Guide

## 🚀 Getting Started with PMS

This guide will help you get the Property Management System up and running quickly.

---

## Step 1: Run the Database Migration

### Option A: Using Supabase CLI
```bash
cd supabase
supabase db push
```

### Option B: Using psql directly
```bash
psql -U postgres -d bookin -f supabase/migrations/0030_property_management_system.sql
```

### Verify Migration
```sql
-- Check if tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'property_management',
  'property_assignments',
  'invoices_v2',
  'invoice_line_items',
  'payments',
  'property_expenses',
  'financial_transactions',
  'owner_statements'
);
```

---

## Step 2: Test the API Endpoints

### Prerequisites
- Development server running: `npm run dev`
- User authenticated (use existing auth system)
- Postman, Insomnia, or curl for testing

### Test Sequence

#### 1. Create Property Management Configuration

**Endpoint:** `POST /api/properties/management`

**Request Body:**
```json
{
  "listing_id": "your-existing-listing-id",
  "management_type": "host_managed",
  "commission_rate": 15.00,
  "cleaning_fee": 50.00,
  "service_fee_rate": 5.00,
  "tax_rate": 10.00,
  "currency": "USD",
  "payment_terms": 30,
  "auto_invoice": true
}
```

**Expected Response:**
```json
{
  "id": "uuid",
  "listing_id": "uuid",
  "owner_id": "uuid",
  "management_type": "host_managed",
  "commission_rate": "15.00",
  "cleaning_fee": "50.00",
  "service_fee_rate": "5.00",
  "tax_rate": "10.00",
  "currency": "USD",
  "payment_terms": 30,
  "auto_invoice": true,
  "created_at": "2025-11-02T...",
  "updated_at": "2025-11-02T...",
  "listings": {
    "id": "uuid",
    "title": "Property Title",
    ...
  }
}
```

#### 2. Assign a Host to the Property

**Endpoint:** `POST /api/properties/:property_id/assignments`

**Request Body:**
```json
{
  "user_id": "host-user-id",
  "role": "host",
  "commission_rate": 15.00,
  "permissions": {
    "can_create_invoices": true,
    "can_submit_expenses": true,
    "can_view_financials": true
  },
  "start_date": "2025-11-02",
  "notes": "Primary host for this property"
}
```

#### 3. Create an Invoice

**Endpoint:** `POST /api/invoices/v2`

**Request Body:**
```json
{
  "invoice_type": "operational",
  "property_id": "property-management-id",
  "issued_to": "owner-user-id",
  "customer_type": "owner",
  "customer_name": "John Doe",
  "customer_email": "john@example.com",
  "customer_address": {
    "line1": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zip": "10001"
  },
  "currency": "USD",
  "tax_rate": 10.00,
  "discount_amount": 0,
  "due_date": "2025-12-02",
  "notes": "Monthly property maintenance invoice",
  "terms": "Payment due within 30 days",
  "line_items": [
    {
      "item_type": "cleaning",
      "description": "Deep cleaning service",
      "quantity": 1,
      "unit_price": 150.00
    },
    {
      "item_type": "repair",
      "description": "Plumbing repair - kitchen sink",
      "quantity": 2,
      "unit_price": 75.00
    }
  ]
}
```

**Expected Response:**
```json
{
  "id": "uuid",
  "invoice_number": "OPS-2025-000001",
  "invoice_type": "operational",
  "status": "draft",
  "payment_status": "unpaid",
  "subtotal": "300.00",
  "tax_amount": "30.00",
  "total_amount": "330.00",
  "amount_due": "330.00",
  "invoice_line_items": [
    {
      "id": "uuid",
      "description": "Deep cleaning service",
      "quantity": "1.00",
      "unit_price": "150.00",
      "total_amount": "150.00"
    },
    {
      "id": "uuid",
      "description": "Plumbing repair - kitchen sink",
      "quantity": "2.00",
      "unit_price": "75.00",
      "total_amount": "150.00"
    }
  ],
  ...
}
```

#### 4. Send the Invoice

**Endpoint:** `POST /api/invoices/v2/:invoice_id/send`

**Request Body:** (empty)

**Expected Response:**
```json
{
  "success": true,
  "invoice": {
    "id": "uuid",
    "status": "sent",
    "sent_date": "2025-11-02T..."
  },
  "message": "Invoice sent successfully"
}
```

#### 5. Create an Expense

**Endpoint:** `POST /api/expenses`

**Request Body:**
```json
{
  "property_id": "property-management-id",
  "expense_type": "repair",
  "category": "plumbing",
  "vendor_name": "ABC Plumbing",
  "description": "Fixed leaking kitchen sink",
  "amount": 150.00,
  "currency": "USD",
  "expense_date": "2025-11-02",
  "payment_method": "cash",
  "receipt_url": "https://cloudinary.com/receipt.jpg",
  "notes": "Emergency repair"
}
```

**Expected Response:**
```json
{
  "id": "uuid",
  "property_id": "uuid",
  "expense_type": "repair",
  "status": "pending",
  "amount": "150.00",
  "created_by": "uuid",
  ...
}
```

#### 6. Approve the Expense (as Property Owner)

**Endpoint:** `POST /api/expenses/:expense_id/approve`

**Request Body:**
```json
{
  "notes": "Approved - necessary repair"
}
```

**Expected Response:**
```json
{
  "success": true,
  "expense": {
    "id": "uuid",
    "status": "approved",
    "approved_by": "uuid",
    "approved_at": "2025-11-02T..."
  },
  "message": "Expense approved successfully"
}
```

#### 7. Make a Payment

**Endpoint:** `POST /api/payments`

**Request Body:**
```json
{
  "invoice_id": "invoice-uuid",
  "payment_method": "bank_transfer",
  "amount": 330.00,
  "currency": "USD",
  "payment_date": "2025-11-02",
  "notes": "Payment for invoice OPS-2025-000001"
}
```

**Expected Response:**
```json
{
  "success": true,
  "payment": {
    "id": "uuid",
    "invoice_id": "uuid",
    "amount": "330.00",
    "status": "completed",
    "payment_date": "2025-11-02T..."
  },
  "message": "Payment recorded successfully"
}
```

---

## Step 3: Verify Data

### Check Property Management
```sql
SELECT * FROM property_management;
```

### Check Invoices
```sql
SELECT 
  i.invoice_number,
  i.invoice_type,
  i.status,
  i.total_amount,
  COUNT(il.id) as line_item_count
FROM invoices_v2 i
LEFT JOIN invoice_line_items il ON i.id = il.invoice_id
GROUP BY i.id;
```

### Check Financial Transactions
```sql
SELECT 
  transaction_type,
  amount,
  description,
  transaction_date
FROM financial_transactions
ORDER BY transaction_date DESC;
```

### Check Expenses
```sql
SELECT 
  expense_type,
  description,
  amount,
  status
FROM property_expenses
ORDER BY created_at DESC;
```

---

## Step 4: Test RLS Policies

### Test as Property Owner
1. Login as property owner
2. Try to view all properties: `GET /api/properties/management`
3. Should see only owned properties

### Test as Host
1. Login as host user
2. Try to view properties: `GET /api/properties/management`
3. Should see only assigned properties

### Test as Guest
1. Login as guest user
2. Try to view invoices: `GET /api/invoices/v2`
3. Should see only invoices issued to them

---

## Common Issues & Solutions

### Issue: Migration fails with "table already exists"
**Solution:** Drop existing tables first or use `CREATE TABLE IF NOT EXISTS`

### Issue: RLS policies blocking all access
**Solution:** Verify user is authenticated and has correct role

### Issue: Invoice number generation fails
**Solution:** Ensure the `generate_invoice_number` function was created

### Issue: Cannot create property management (listing not found)
**Solution:** Ensure the listing exists and belongs to the current user

---

## Testing Checklist

- [ ] Database migration completed successfully
- [ ] All 8 tables created
- [ ] All indexes created
- [ ] RLS policies active
- [ ] Can create property management configuration
- [ ] Can assign host to property
- [ ] Can create invoice with line items
- [ ] Invoice totals calculate correctly
- [ ] Can send invoice
- [ ] Can create expense
- [ ] Can approve expense (as owner)
- [ ] Can reject expense (as owner)
- [ ] Can make payment
- [ ] Invoice status updates after payment
- [ ] Can refund payment
- [ ] Financial transactions are created automatically
- [ ] RLS policies work correctly for each role

---

## Next Steps

1. ✅ Complete all tests above
2. ✅ Verify RLS policies work correctly
3. ✅ Create seed data for demo
4. 🔲 Build frontend UI components
5. 🔲 Implement Phase 2 (Automated Rental Invoicing)

---

## Support

For issues or questions:
1. Check `docs/property-management-system.md` for detailed documentation
2. Review `docs/pms-implementation-status.md` for known issues
3. Check database logs for errors
4. Review API response error messages

---

*Last Updated: 2025-11-02*

