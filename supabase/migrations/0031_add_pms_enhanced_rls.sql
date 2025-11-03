-- =====================================================
-- ENHANCED RLS POLICIES FOR PROPERTY MANAGEMENT SYSTEM
-- =====================================================
-- This migration adds additional RLS policies to complete
-- the data isolation for the dual-access PMS architecture
-- =====================================================

-- =====================================================
-- 1. PROPERTY MANAGEMENT ENHANCEMENTS
-- =====================================================

-- Delete policy for property owners
CREATE POLICY "Property owners can delete their properties"
  ON public.property_management FOR DELETE
  USING (owner_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));

-- =====================================================
-- 2. INVOICES V2 ENHANCEMENTS
-- =====================================================

-- Property owners can view all invoices for their properties
CREATE POLICY "Property owners can view invoices for their properties"
  ON public.invoices_v2 FOR SELECT
  USING (
    property_id IN (
      SELECT id FROM public.property_management 
      WHERE owner_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
    )
  );

-- Delete policy for users who created the invoice
CREATE POLICY "Users can delete invoices they issued"
  ON public.invoices_v2 FOR DELETE
  USING (issued_by = (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));

-- =====================================================
-- 3. PAYMENTS ENHANCEMENTS
-- =====================================================

-- Users can view all payments they made (not just for invoices they're involved in)
-- This is for the payments history page
CREATE POLICY "Users can view their own payments"
  ON public.payments FOR SELECT
  USING (payer_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));

-- =====================================================
-- 4. PROPERTY EXPENSES ENHANCEMENTS
-- =====================================================

-- Delete policy for users who created the expense (if not approved/paid)
CREATE POLICY "Users can delete their own expenses"
  ON public.property_expenses FOR DELETE
  USING (
    created_by = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
    AND status IN ('pending', 'rejected')
  );

-- =====================================================
-- 5. VERIFICATION
-- =====================================================

-- Verify policies were created
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
  AND tablename IN ('property_management', 'invoices_v2', 'payments', 'property_expenses');
  
  RAISE NOTICE 'Total PMS RLS policies: %', policy_count;
END $$;

