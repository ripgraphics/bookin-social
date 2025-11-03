-- =====================================================
-- PROPERTY MANAGEMENT SYSTEM - PHASE 1: FOUNDATION
-- Migration: 0030_property_management_system.sql
-- Description: Enterprise-grade property management system
-- =====================================================

-- =====================================================
-- 1. PROPERTY MANAGEMENT EXTENSION
-- =====================================================

-- Properties Management Extension
CREATE TABLE IF NOT EXISTS public.property_management (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  management_type TEXT DEFAULT 'self_managed', -- 'self_managed', 'host_managed', 'co_hosted'
  commission_rate DECIMAL(5,2) DEFAULT 0.00, -- Host commission %
  cleaning_fee DECIMAL(10,2) DEFAULT 0.00,
  service_fee_rate DECIMAL(5,2) DEFAULT 0.00,
  tax_rate DECIMAL(5,2) DEFAULT 0.00,
  currency TEXT DEFAULT 'USD',
  payment_terms INTEGER DEFAULT 30, -- Days
  auto_invoice BOOLEAN DEFAULT true,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(listing_id)
);

-- Property Assignments (Host/Co-Host)
CREATE TABLE IF NOT EXISTS public.property_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.property_management(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL, -- 'host', 'co_host'
  commission_rate DECIMAL(5,2) DEFAULT 0.00,
  permissions JSONB DEFAULT '{}'::jsonb, -- Granular permissions
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  status TEXT DEFAULT 'active', -- 'active', 'inactive', 'suspended'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_role CHECK (role IN ('host', 'co_host')),
  CONSTRAINT valid_status CHECK (status IN ('active', 'inactive', 'suspended'))
);

-- =====================================================
-- 2. ENHANCED INVOICES SYSTEM
-- =====================================================

-- Enhanced Invoices Table (v2)
CREATE TABLE IF NOT EXISTS public.invoices_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT UNIQUE NOT NULL,
  invoice_type TEXT NOT NULL, -- 'rental', 'operational', 'custom'
  
  -- Relationships
  property_id UUID REFERENCES public.property_management(id) ON DELETE SET NULL,
  reservation_id UUID REFERENCES public.reservations(id) ON DELETE SET NULL, -- For rental invoices
  issued_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE, -- Host/Co-host/System
  issued_to UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE, -- Guest or Owner
  
  -- Customer/Recipient Details
  customer_type TEXT NOT NULL, -- 'guest', 'owner', 'vendor', 'other'
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_address JSONB DEFAULT '{}'::jsonb,
  
  -- Financial Details
  currency TEXT DEFAULT 'USD',
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  tax_rate DECIMAL(5,2) DEFAULT 0.00,
  tax_amount DECIMAL(10,2) DEFAULT 0.00,
  discount_amount DECIMAL(10,2) DEFAULT 0.00,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  amount_paid DECIMAL(10,2) DEFAULT 0.00,
  amount_due DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  
  -- Dates
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  paid_date DATE,
  sent_date TIMESTAMPTZ,
  viewed_date TIMESTAMPTZ,
  
  -- Status
  status TEXT DEFAULT 'draft', -- draft, sent, viewed, partial, paid, overdue, cancelled, refunded
  payment_status TEXT DEFAULT 'unpaid', -- unpaid, partial, paid, refunded
  
  -- Metadata
  notes TEXT,
  terms TEXT,
  attachments JSONB DEFAULT '[]'::jsonb, -- Receipt URLs, documents
  metadata JSONB DEFAULT '{}'::jsonb, -- Custom fields
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES public.users(id),
  updated_by UUID REFERENCES public.users(id),
  
  CONSTRAINT valid_invoice_type CHECK (invoice_type IN ('rental', 'operational', 'custom')),
  CONSTRAINT valid_customer_type CHECK (customer_type IN ('guest', 'owner', 'vendor', 'other')),
  CONSTRAINT valid_status CHECK (status IN ('draft', 'sent', 'viewed', 'partial', 'paid', 'overdue', 'cancelled', 'refunded')),
  CONSTRAINT valid_payment_status CHECK (payment_status IN ('unpaid', 'partial', 'paid', 'refunded')),
  CONSTRAINT positive_amounts CHECK (subtotal >= 0 AND total_amount >= 0 AND amount_paid >= 0 AND amount_due >= 0)
);

-- Invoice Line Items
CREATE TABLE IF NOT EXISTS public.invoice_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices_v2(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL, -- 'rental', 'cleaning', 'repair', 'maintenance', 'service', 'custom'
  description TEXT NOT NULL,
  quantity DECIMAL(10,2) DEFAULT 1.00,
  unit_price DECIMAL(10,2) NOT NULL,
  tax_rate DECIMAL(5,2) DEFAULT 0.00,
  tax_amount DECIMAL(10,2) DEFAULT 0.00,
  discount_amount DECIMAL(10,2) DEFAULT 0.00,
  total_amount DECIMAL(10,2) NOT NULL,
  position INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_item_type CHECK (item_type IN ('rental', 'cleaning', 'repair', 'maintenance', 'service', 'custom')),
  CONSTRAINT positive_line_amounts CHECK (quantity > 0 AND unit_price >= 0 AND total_amount >= 0)
);

-- =====================================================
-- 3. PAYMENTS SYSTEM
-- =====================================================

-- Payments
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices_v2(id) ON DELETE CASCADE,
  payment_method TEXT NOT NULL, -- 'stripe', 'paypal', 'bank_transfer', 'cash', 'check', 'other'
  payment_gateway_id TEXT, -- Stripe charge ID, PayPal transaction ID, etc.
  
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  
  payment_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_date TIMESTAMPTZ,
  
  status TEXT DEFAULT 'pending', -- pending, processing, completed, failed, refunded
  
  payer_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  payer_name TEXT,
  payer_email TEXT,
  
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES public.users(id),
  
  CONSTRAINT valid_payment_method CHECK (payment_method IN ('stripe', 'paypal', 'bank_transfer', 'cash', 'check', 'other')),
  CONSTRAINT valid_payment_status CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
  CONSTRAINT positive_payment_amount CHECK (amount > 0)
);

-- =====================================================
-- 4. PROPERTY EXPENSES
-- =====================================================

-- Property Expenses
CREATE TABLE IF NOT EXISTS public.property_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.property_management(id) ON DELETE CASCADE,
  expense_type TEXT NOT NULL, -- 'repair', 'cleaning', 'maintenance', 'utilities', 'supplies', 'insurance', 'taxes', 'other'
  category TEXT,
  
  vendor_name TEXT,
  vendor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT,
  
  receipt_url TEXT,
  attachments JSONB DEFAULT '[]'::jsonb,
  
  status TEXT DEFAULT 'pending', -- pending, approved, rejected, paid, reimbursed
  approved_by UUID REFERENCES public.users(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  invoice_id UUID REFERENCES public.invoices_v2(id) ON DELETE SET NULL, -- Link to operational invoice
  
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES public.users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_expense_type CHECK (expense_type IN ('repair', 'cleaning', 'maintenance', 'utilities', 'supplies', 'insurance', 'taxes', 'other')),
  CONSTRAINT valid_expense_status CHECK (status IN ('pending', 'approved', 'rejected', 'paid', 'reimbursed')),
  CONSTRAINT positive_expense_amount CHECK (amount > 0)
);

-- =====================================================
-- 5. FINANCIAL TRANSACTIONS (LEDGER)
-- =====================================================

-- Financial Transactions (Ledger)
CREATE TABLE IF NOT EXISTS public.financial_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES public.property_management(id) ON DELETE SET NULL,
  transaction_type TEXT NOT NULL, -- 'income', 'expense', 'payout', 'commission', 'refund', 'transfer'
  
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  
  source_type TEXT, -- 'reservation', 'invoice', 'expense', 'payment'
  source_id UUID,
  
  from_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  to_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  
  description TEXT NOT NULL,
  transaction_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  status TEXT DEFAULT 'completed', -- pending, completed, failed, reversed
  
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_transaction_type CHECK (transaction_type IN ('income', 'expense', 'payout', 'commission', 'refund', 'transfer')),
  CONSTRAINT valid_transaction_status CHECK (status IN ('pending', 'completed', 'failed', 'reversed')),
  CONSTRAINT positive_transaction_amount CHECK (amount > 0)
);

-- =====================================================
-- 6. OWNER STATEMENTS
-- =====================================================

-- Owner Statements
CREATE TABLE IF NOT EXISTS public.owner_statements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  property_id UUID REFERENCES public.property_management(id) ON DELETE CASCADE,
  
  statement_number TEXT UNIQUE NOT NULL,
  statement_period_start DATE NOT NULL,
  statement_period_end DATE NOT NULL,
  
  total_revenue DECIMAL(10,2) DEFAULT 0.00,
  total_expenses DECIMAL(10,2) DEFAULT 0.00,
  total_commissions DECIMAL(10,2) DEFAULT 0.00,
  net_income DECIMAL(10,2) DEFAULT 0.00,
  
  status TEXT DEFAULT 'draft', -- draft, sent, viewed, paid
  
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  
  pdf_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES public.users(id),
  
  CONSTRAINT valid_statement_status CHECK (status IN ('draft', 'sent', 'viewed', 'paid')),
  CONSTRAINT valid_statement_period CHECK (statement_period_end >= statement_period_start)
);

-- =====================================================
-- 7. INDEXES FOR PERFORMANCE
-- =====================================================

-- Property Management Indexes
CREATE INDEX IF NOT EXISTS idx_property_management_listing_id ON public.property_management(listing_id);
CREATE INDEX IF NOT EXISTS idx_property_management_owner_id ON public.property_management(owner_id);
CREATE INDEX IF NOT EXISTS idx_property_management_management_type ON public.property_management(management_type);

-- Property Assignments Indexes
CREATE INDEX IF NOT EXISTS idx_property_assignments_property_id ON public.property_assignments(property_id);
CREATE INDEX IF NOT EXISTS idx_property_assignments_user_id ON public.property_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_property_assignments_role ON public.property_assignments(role);
CREATE INDEX IF NOT EXISTS idx_property_assignments_status ON public.property_assignments(status);

-- Invoices v2 Indexes
CREATE INDEX IF NOT EXISTS idx_invoices_v2_invoice_number ON public.invoices_v2(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_v2_invoice_type ON public.invoices_v2(invoice_type);
CREATE INDEX IF NOT EXISTS idx_invoices_v2_property_id ON public.invoices_v2(property_id);
CREATE INDEX IF NOT EXISTS idx_invoices_v2_reservation_id ON public.invoices_v2(reservation_id);
CREATE INDEX IF NOT EXISTS idx_invoices_v2_issued_by ON public.invoices_v2(issued_by);
CREATE INDEX IF NOT EXISTS idx_invoices_v2_issued_to ON public.invoices_v2(issued_to);
CREATE INDEX IF NOT EXISTS idx_invoices_v2_status ON public.invoices_v2(status);
CREATE INDEX IF NOT EXISTS idx_invoices_v2_payment_status ON public.invoices_v2(payment_status);
CREATE INDEX IF NOT EXISTS idx_invoices_v2_due_date ON public.invoices_v2(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_v2_created_at ON public.invoices_v2(created_at DESC);

-- Invoice Line Items Indexes
CREATE INDEX IF NOT EXISTS idx_invoice_line_items_invoice_id ON public.invoice_line_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_line_items_item_type ON public.invoice_line_items(item_type);

-- Payments Indexes
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON public.payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_payer_id ON public.payments(payer_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON public.payments(payment_date DESC);
CREATE INDEX IF NOT EXISTS idx_payments_payment_gateway_id ON public.payments(payment_gateway_id);

-- Property Expenses Indexes
CREATE INDEX IF NOT EXISTS idx_property_expenses_property_id ON public.property_expenses(property_id);
CREATE INDEX IF NOT EXISTS idx_property_expenses_expense_type ON public.property_expenses(expense_type);
CREATE INDEX IF NOT EXISTS idx_property_expenses_status ON public.property_expenses(status);
CREATE INDEX IF NOT EXISTS idx_property_expenses_created_by ON public.property_expenses(created_by);
CREATE INDEX IF NOT EXISTS idx_property_expenses_expense_date ON public.property_expenses(expense_date DESC);
CREATE INDEX IF NOT EXISTS idx_property_expenses_invoice_id ON public.property_expenses(invoice_id);

-- Financial Transactions Indexes
CREATE INDEX IF NOT EXISTS idx_financial_transactions_property_id ON public.financial_transactions(property_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_transaction_type ON public.financial_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_from_user_id ON public.financial_transactions(from_user_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_to_user_id ON public.financial_transactions(to_user_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_transaction_date ON public.financial_transactions(transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_source_type_id ON public.financial_transactions(source_type, source_id);

-- Owner Statements Indexes
CREATE INDEX IF NOT EXISTS idx_owner_statements_owner_id ON public.owner_statements(owner_id);
CREATE INDEX IF NOT EXISTS idx_owner_statements_property_id ON public.owner_statements(property_id);
CREATE INDEX IF NOT EXISTS idx_owner_statements_status ON public.owner_statements(status);
CREATE INDEX IF NOT EXISTS idx_owner_statements_period ON public.owner_statements(statement_period_start, statement_period_end);

-- =====================================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.property_management ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.owner_statements ENABLE ROW LEVEL SECURITY;

-- Property Management Policies
CREATE POLICY "Users can view their own properties as owners"
  ON public.property_management FOR SELECT
  USING (owner_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can view properties they manage"
  ON public.property_management FOR SELECT
  USING (
    id IN (
      SELECT property_id FROM public.property_assignments 
      WHERE user_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
      AND status = 'active'
    )
  );

CREATE POLICY "Property owners can update their properties"
  ON public.property_management FOR UPDATE
  USING (owner_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Property owners can insert their properties"
  ON public.property_management FOR INSERT
  WITH CHECK (owner_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));

-- Property Assignments Policies
CREATE POLICY "Users can view their own assignments"
  ON public.property_assignments FOR SELECT
  USING (
    user_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
    OR property_id IN (
      SELECT id FROM public.property_management 
      WHERE owner_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
    )
  );

CREATE POLICY "Property owners can manage assignments"
  ON public.property_assignments FOR ALL
  USING (
    property_id IN (
      SELECT id FROM public.property_management 
      WHERE owner_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
    )
  );

-- Invoices v2 Policies
CREATE POLICY "Users can view invoices issued to them"
  ON public.invoices_v2 FOR SELECT
  USING (issued_to = (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can view invoices they issued"
  ON public.invoices_v2 FOR SELECT
  USING (issued_by = (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can create invoices"
  ON public.invoices_v2 FOR INSERT
  WITH CHECK (issued_by = (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can update their own invoices"
  ON public.invoices_v2 FOR UPDATE
  USING (issued_by = (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));

-- Invoice Line Items Policies
CREATE POLICY "Users can view line items for their invoices"
  ON public.invoice_line_items FOR SELECT
  USING (
    invoice_id IN (
      SELECT id FROM public.invoices_v2 
      WHERE issued_by = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
      OR issued_to = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
    )
  );

CREATE POLICY "Users can manage line items for their invoices"
  ON public.invoice_line_items FOR ALL
  USING (
    invoice_id IN (
      SELECT id FROM public.invoices_v2 
      WHERE issued_by = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
    )
  );

-- Payments Policies
CREATE POLICY "Users can view payments for their invoices"
  ON public.payments FOR SELECT
  USING (
    invoice_id IN (
      SELECT id FROM public.invoices_v2 
      WHERE issued_by = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
      OR issued_to = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
    )
  );

CREATE POLICY "Users can create payments"
  ON public.payments FOR INSERT
  WITH CHECK (
    invoice_id IN (
      SELECT id FROM public.invoices_v2 
      WHERE issued_to = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
    )
  );

-- Property Expenses Policies
CREATE POLICY "Users can view expenses for their properties"
  ON public.property_expenses FOR SELECT
  USING (
    property_id IN (
      SELECT id FROM public.property_management 
      WHERE owner_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
    )
    OR created_by = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Users can create expenses for properties they manage"
  ON public.property_expenses FOR INSERT
  WITH CHECK (
    property_id IN (
      SELECT property_id FROM public.property_assignments 
      WHERE user_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
      AND status = 'active'
    )
  );

CREATE POLICY "Property owners can approve/reject expenses"
  ON public.property_expenses FOR UPDATE
  USING (
    property_id IN (
      SELECT id FROM public.property_management 
      WHERE owner_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
    )
  );

-- Financial Transactions Policies
CREATE POLICY "Users can view their own transactions"
  ON public.financial_transactions FOR SELECT
  USING (
    from_user_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
    OR to_user_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
    OR property_id IN (
      SELECT id FROM public.property_management 
      WHERE owner_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
    )
  );

-- Owner Statements Policies
CREATE POLICY "Owners can view their own statements"
  ON public.owner_statements FOR SELECT
  USING (owner_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Property managers can view statements for their properties"
  ON public.owner_statements FOR SELECT
  USING (
    property_id IN (
      SELECT property_id FROM public.property_assignments 
      WHERE user_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
      AND status = 'active'
    )
  );

-- =====================================================
-- 9. HELPER FUNCTIONS
-- =====================================================

-- Function to generate invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number(invoice_type TEXT)
RETURNS TEXT AS $$
DECLARE
  prefix TEXT;
  next_number INTEGER;
  invoice_number TEXT;
BEGIN
  -- Set prefix based on invoice type
  prefix := CASE invoice_type
    WHEN 'rental' THEN 'RNT'
    WHEN 'operational' THEN 'OPS'
    WHEN 'custom' THEN 'CST'
    ELSE 'INV'
  END;
  
  -- Get next number for this type
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM '[0-9]+$') AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.invoices_v2
  WHERE invoice_number LIKE prefix || '-%';
  
  -- Generate invoice number
  invoice_number := prefix || '-' || TO_CHAR(EXTRACT(YEAR FROM CURRENT_DATE), 'FM0000') || '-' || LPAD(next_number::TEXT, 6, '0');
  
  RETURN invoice_number;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate invoice totals
CREATE OR REPLACE FUNCTION calculate_invoice_totals()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate subtotal from line items
  SELECT COALESCE(SUM(total_amount), 0)
  INTO NEW.subtotal
  FROM public.invoice_line_items
  WHERE invoice_id = NEW.id;
  
  -- Calculate tax amount
  NEW.tax_amount := (NEW.subtotal * NEW.tax_rate / 100);
  
  -- Calculate total
  NEW.total_amount := NEW.subtotal + NEW.tax_amount - NEW.discount_amount;
  
  -- Calculate amount due
  NEW.amount_due := NEW.total_amount - NEW.amount_paid;
  
  -- Update payment status
  IF NEW.amount_paid >= NEW.total_amount THEN
    NEW.payment_status := 'paid';
    NEW.status := 'paid';
    NEW.paid_date := CURRENT_DATE;
  ELSIF NEW.amount_paid > 0 THEN
    NEW.payment_status := 'partial';
  ELSE
    NEW.payment_status := 'unpaid';
  END IF;
  
  -- Check for overdue
  IF NEW.due_date < CURRENT_DATE AND NEW.payment_status != 'paid' THEN
    NEW.status := 'overdue';
  END IF;
  
  NEW.updated_at := NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-calculate invoice totals
CREATE TRIGGER trigger_calculate_invoice_totals
  BEFORE UPDATE ON public.invoices_v2
  FOR EACH ROW
  EXECUTE FUNCTION calculate_invoice_totals();

-- Function to update invoice on payment
CREATE OR REPLACE FUNCTION update_invoice_on_payment()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' THEN
    -- Update invoice amount_paid
    UPDATE public.invoices_v2
    SET amount_paid = amount_paid + NEW.amount
    WHERE id = NEW.invoice_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update invoice when payment is made
CREATE TRIGGER trigger_update_invoice_on_payment
  AFTER INSERT OR UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION update_invoice_on_payment();

-- =====================================================
-- 10. COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE public.property_management IS 'Property management configuration and settings';
COMMENT ON TABLE public.property_assignments IS 'Host and co-host assignments to properties';
COMMENT ON TABLE public.invoices_v2 IS 'Enhanced invoicing system supporting rental, operational, and custom invoices';
COMMENT ON TABLE public.invoice_line_items IS 'Line items for invoices with detailed pricing';
COMMENT ON TABLE public.payments IS 'Payment tracking for invoices';
COMMENT ON TABLE public.property_expenses IS 'Property-specific expenses with approval workflow';
COMMENT ON TABLE public.financial_transactions IS 'Financial ledger for all transactions';
COMMENT ON TABLE public.owner_statements IS 'Monthly/quarterly statements for property owners';

-- Migration completed successfully

