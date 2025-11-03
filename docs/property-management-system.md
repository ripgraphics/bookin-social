# Enterprise-Grade Property Management System (PMS)

## Overview

The Property Management System (PMS) is a comprehensive solution for managing rental properties, automating invoicing, tracking expenses, and generating financial reports. It integrates seamlessly with the existing booking/rental platform.

## Key Features

### 1. Multi-Property Portfolio Management
- Manage multiple properties from a single dashboard
- Assign owners, hosts, and co-hosts to properties
- Configure financial settings per property
- Track property performance and analytics

### 2. Automated Rental Invoicing
- Auto-generate invoices when guests book properties
- Calculate: Nightly rate × nights + cleaning fee + service fee + taxes
- Send invoices to guests automatically
- Track payment status in real-time

### 3. Operational Invoicing
- Hosts/Co-hosts can invoice property owners for services
- Support for repairs, cleaning, maintenance, and other expenses
- Attach receipts and documentation
- Approval workflow for expense management

### 4. Payment Processing
- Stripe integration for online payments
- Multiple payment methods supported
- Partial payment tracking
- Automatic invoice status updates

### 5. Financial Reporting
- Owner statements (monthly/quarterly)
- Property P&L statements
- Tax reports
- Aging reports for overdue invoices

### 6. Expense Management
- Track property-specific expenses
- Categorize expenses (repairs, cleaning, utilities, etc.)
- Upload receipts to Cloudinary
- Approval/rejection workflow

### 7. Commission Calculations
- Automatic host/co-host commission tracking
- Platform fee calculations
- Payout management

## Database Schema

### Core Tables

#### 1. `property_management`
Extends listings with property management configuration.

**Key Fields:**
- `listing_id` - Links to existing listings
- `owner_id` - Property owner
- `management_type` - self_managed, host_managed, co_hosted
- `commission_rate` - Host commission percentage
- `cleaning_fee` - Default cleaning fee
- `tax_rate` - Tax rate for the property
- `auto_invoice` - Enable/disable automatic invoice generation

#### 2. `property_assignments`
Manages host and co-host assignments to properties.

**Key Fields:**
- `property_id` - Property reference
- `user_id` - Host or co-host user
- `role` - 'host' or 'co_host'
- `commission_rate` - Individual commission rate
- `permissions` - Granular permissions (JSONB)
- `status` - active, inactive, suspended

#### 3. `invoices_v2`
Enhanced invoicing system supporting multiple invoice types.

**Invoice Types:**
- `rental` - Guest booking invoices (auto-generated)
- `operational` - Host → Owner invoices for services
- `custom` - Custom invoices for any purpose

**Key Fields:**
- `invoice_number` - Unique invoice number (auto-generated)
- `invoice_type` - rental, operational, custom
- `property_id` - Associated property
- `reservation_id` - Link to booking (for rental invoices)
- `issued_by` - Who created the invoice
- `issued_to` - Invoice recipient
- `subtotal`, `tax_amount`, `total_amount` - Financial details
- `status` - draft, sent, viewed, partial, paid, overdue, cancelled, refunded
- `payment_status` - unpaid, partial, paid, refunded

#### 4. `invoice_line_items`
Detailed line items for invoices.

**Item Types:**
- `rental` - Nightly rental charges
- `cleaning` - Cleaning fees
- `repair` - Repair costs
- `maintenance` - Maintenance services
- `service` - Other services
- `custom` - Custom items

#### 5. `payments`
Payment tracking and reconciliation.

**Payment Methods:**
- Stripe
- PayPal
- Bank Transfer
- Cash
- Check
- Other

**Key Fields:**
- `invoice_id` - Associated invoice
- `payment_gateway_id` - Stripe charge ID, etc.
- `amount` - Payment amount
- `status` - pending, processing, completed, failed, refunded

#### 6. `property_expenses`
Property-specific expense tracking.

**Expense Types:**
- repair
- cleaning
- maintenance
- utilities
- supplies
- insurance
- taxes
- other

**Workflow:**
1. Host/Co-host creates expense
2. Uploads receipt
3. Submits for approval
4. Owner approves/rejects
5. If approved, can be invoiced to owner

#### 7. `financial_transactions`
Complete financial ledger for audit trail.

**Transaction Types:**
- income - Revenue from bookings
- expense - Property expenses
- payout - Payments to hosts/owners
- commission - Commission charges
- refund - Refunds to guests
- transfer - Internal transfers

#### 8. `owner_statements`
Monthly/quarterly financial statements for property owners.

**Includes:**
- Total revenue
- Total expenses
- Total commissions
- Net income
- PDF generation
- Email delivery

## User Roles & Permissions

### Property Owner
**Can:**
- View all their properties
- Assign hosts/co-hosts
- Configure financial settings
- View all invoices (rental & operational)
- Approve/reject expenses
- View financial reports
- Download owner statements

**Cannot:**
- Manage other owners' properties
- View other owners' financial data

### Host
**Can:**
- Manage assigned properties
- Create operational invoices for owners
- Submit expenses for approval
- View rental invoices for their properties
- Track commission earnings
- View property performance

**Cannot:**
- Change property ownership
- Approve their own expenses
- View other properties' data

### Co-Host
**Can:**
- Assist with property management (based on permissions)
- Create expenses
- View property information

**Permissions are configurable per assignment**

### Guest (Renter)
**Can:**
- View their rental invoices
- Make payments online
- Download receipts
- View payment history

**Cannot:**
- View operational invoices
- Access property management features

## Workflows

### Rental Invoice Workflow

```
1. Guest books property
   ↓
2. System auto-generates rental invoice
   - Calculates: (nightly_rate × nights) + cleaning_fee + service_fee
   - Applies tax rate
   - Creates invoice with status: 'sent'
   ↓
3. Email sent to guest with invoice
   ↓
4. Guest views invoice in dashboard
   ↓
5. Guest pays online (Stripe)
   ↓
6. Payment recorded
   ↓
7. Invoice status updated to 'paid'
   ↓
8. Receipt emailed to guest
   ↓
9. Financial transaction recorded
```

### Operational Invoice Workflow

```
1. Host incurs expense (repair, cleaning, etc.)
   ↓
2. Host creates expense record
   - Uploads receipt
   - Adds description and amount
   - Submits for approval
   ↓
3. Owner receives notification
   ↓
4. Owner reviews expense
   ↓
5a. Owner approves
    ↓
    Host creates operational invoice
    ↓
    Invoice sent to owner
    ↓
    Owner pays
    ↓
    Host receives payout

5b. Owner rejects
    ↓
    Expense marked as rejected
    ↓
    Notification sent to host
```

### Owner Statement Workflow

```
1. End of month/quarter
   ↓
2. System generates owner statement
   - Calculates total revenue
   - Calculates total expenses
   - Calculates commissions
   - Calculates net income
   ↓
3. PDF generated
   ↓
4. Statement emailed to owner
   ↓
5. Owner views in dashboard
   ↓
6. Owner downloads PDF for records
```

## API Endpoints

### Property Management

```
GET    /api/properties/management
       List all properties with management data

POST   /api/properties/management
       Create property management configuration

PUT    /api/properties/management/:id
       Update property management settings

GET    /api/properties/:id/assignments
       Get host/co-host assignments for a property

POST   /api/properties/:id/assignments
       Assign host/co-host to property

DELETE /api/properties/:id/assignments/:assignmentId
       Remove assignment
```

### Invoices

```
GET    /api/invoices/v2
       List invoices (filtered by user role)

POST   /api/invoices/v2
       Create new invoice

GET    /api/invoices/v2/:id
       Get invoice details

PUT    /api/invoices/v2/:id
       Update invoice

DELETE /api/invoices/v2/:id
       Delete invoice (draft only)

POST   /api/invoices/v2/:id/send
       Send invoice to recipient

POST   /api/invoices/v2/:id/mark-paid
       Mark invoice as paid

GET    /api/invoices/v2/:id/pdf
       Download invoice PDF
```

### Payments

```
POST   /api/payments
       Create payment for invoice

GET    /api/payments/:invoiceId
       Get payments for invoice

POST   /api/payments/:id/refund
       Refund a payment
```

### Expenses

```
GET    /api/expenses
       List expenses (filtered by property/user)

POST   /api/expenses
       Create expense

PUT    /api/expenses/:id
       Update expense

POST   /api/expenses/:id/approve
       Approve expense (owner only)

POST   /api/expenses/:id/reject
       Reject expense (owner only)

DELETE /api/expenses/:id
       Delete expense
```

### Financial Reports

```
GET    /api/reports/owner-statement
       Generate owner statement
       Query params: owner_id, property_id, start_date, end_date

GET    /api/reports/property-pl
       Property P&L statement
       Query params: property_id, start_date, end_date

GET    /api/reports/tax-report
       Tax report for property
       Query params: property_id, year

GET    /api/reports/aging
       Aging report for overdue invoices
```

### Automation

```
POST   /api/automation/generate-rental-invoice
       Manually trigger rental invoice generation
       Body: { reservation_id }

POST   /api/automation/generate-owner-statement
       Generate owner statement
       Body: { owner_id, property_id, period_start, period_end }

POST   /api/automation/send-reminders
       Send payment reminders for overdue invoices
```

## Implementation Phases

### Phase 1: Foundation (Weeks 1-2) ✅ CURRENT
- [x] Database schema creation
- [ ] Property management setup UI
- [ ] User role extensions
- [ ] Basic invoice creation

### Phase 2: Automated Rental Invoicing (Weeks 3-4)
- [ ] Reservation → Invoice automation
- [ ] Guest invoice portal
- [ ] Stripe integration
- [ ] Email notifications

### Phase 3: Operational Invoicing (Weeks 5-6)
- [ ] Host → Owner invoicing
- [ ] Expense management
- [ ] Approval workflow
- [ ] Receipt upload

### Phase 4: Financial Management (Weeks 7-8)
- [ ] Payment processing
- [ ] Commission calculations
- [ ] Financial ledger
- [ ] Payout management

### Phase 5: Reporting & Analytics (Weeks 9-10)
- [ ] Owner statements
- [ ] Financial reports
- [ ] Analytics dashboard
- [ ] Tax reports

### Phase 6: Advanced Features (Weeks 11-12)
- [ ] Multi-currency support
- [ ] Recurring invoices
- [ ] Email automation
- [ ] Document management

## Configuration

### Environment Variables

```env
# Stripe (for payment processing)
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email (for notifications)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=noreply@bookin.social
SMTP_PASSWORD=...

# Cloudinary (for receipt storage)
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# Invoice Settings
DEFAULT_INVOICE_DUE_DAYS=30
DEFAULT_TAX_RATE=10.00
DEFAULT_SERVICE_FEE_RATE=5.00
```

### Property Management Settings

Each property can be configured with:
- Commission rate (%)
- Cleaning fee ($)
- Service fee rate (%)
- Tax rate (%)
- Payment terms (days)
- Auto-invoice enabled/disabled
- Currency (USD, EUR, GBP, etc.)

## Security

### Row Level Security (RLS)

All tables have RLS enabled with policies ensuring:
- Users can only view their own data
- Property owners can view all data for their properties
- Hosts can view data for properties they manage
- Guests can only view their rental invoices
- Financial data is strictly controlled

### Audit Trail

All financial transactions are logged in the `financial_transactions` table with:
- Transaction type
- Amount
- From/To users
- Source reference
- Timestamp
- Status

## Testing

### Database Migration

```bash
# Run the migration
supabase db push

# Or if using the migration script
psql -U postgres -d bookin -f supabase/migrations/0030_property_management_system.sql
```

### Test Data

Create test data for:
1. Property management configuration
2. Host/co-host assignments
3. Rental invoices
4. Operational invoices
5. Expenses
6. Payments

## Next Steps

1. **Run Database Migration**
   ```bash
   cd supabase
   supabase db push
   ```

2. **Create API Routes** (Phase 1)
   - `/api/properties/management`
   - `/api/invoices/v2`
   - `/api/expenses`

3. **Build UI Components** (Phase 1)
   - Property management dashboard
   - Invoice creation form
   - Expense submission form

4. **Implement Automation** (Phase 2)
   - Reservation → Invoice trigger
   - Email notifications
   - Payment webhooks

## Support

For questions or issues, refer to:
- Main plan: `migrate-to-supabase-auth.plan.md`
- Database schema: `supabase/migrations/0030_property_management_system.sql`
- API documentation: This file

## Version History

- **v1.0.0** - Initial implementation (Phase 1)
  - Database schema
  - Core tables and relationships
  - RLS policies
  - Helper functions

