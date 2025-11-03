-- ============================================================================
-- SEED PMS TEST DATA
-- ============================================================================
-- Creates sample data for Property Management System testing
-- Includes: properties, assignments, invoices, expenses, payments, reservations
-- ============================================================================

DO $$
DECLARE
  -- User IDs (will be populated)
  owner_user_id UUID;
  host_user_id UUID;
  cohost_user_id UUID;
  guest_user_id UUID;
  
  -- Property IDs
  property1_id UUID;
  property2_id UUID;
  property3_id UUID;
  
  -- Assignment IDs
  assignment1_id UUID;
  assignment2_id UUID;
  
  -- Invoice IDs
  rental_invoice_id UUID;
  operational_invoice_id UUID;
  
  -- Expense IDs
  expense1_id UUID;
  expense2_id UUID;
  expense3_id UUID;
  
  -- Payment IDs
  payment1_id UUID;
  payment2_id UUID;
  
  -- Reservation IDs
  reservation1_id UUID;
  reservation2_id UUID;
  
  -- Listing IDs (will find existing or use first available)
  listing1_id UUID;
  listing2_id UUID;
  listing3_id UUID;
  
  -- Store user emails for verification
  owner_email TEXT;
  host_email TEXT;
  cohost_email TEXT;
  guest_email TEXT;
BEGIN
  -- ============================================================================
  -- 1. GET OR CREATE TEST USERS
  -- ============================================================================
  
  -- Get or use existing users (we'll use existing users and just label them for testing)
  -- Try to find users with test emails first
  SELECT id INTO owner_user_id FROM public.users WHERE email = 'owner@bookin.social' LIMIT 1;
  SELECT id INTO host_user_id FROM public.users WHERE email = 'host@bookin.social' LIMIT 1;
  SELECT id INTO cohost_user_id FROM public.users WHERE email = 'cohost@bookin.social' LIMIT 1;
  SELECT id INTO guest_user_id FROM public.users WHERE email = 'guest@bookin.social' LIMIT 1;
  
  -- If not found, use existing users (get 4 different users)
  IF owner_user_id IS NULL THEN
    SELECT id INTO owner_user_id FROM public.users ORDER BY created_at LIMIT 1 OFFSET 0;
  END IF;
  
  IF host_user_id IS NULL THEN
    SELECT id INTO host_user_id FROM public.users ORDER BY created_at LIMIT 1 OFFSET 1;
    -- If we don't have a second user, use the first one
    IF host_user_id IS NULL THEN host_user_id := owner_user_id; END IF;
  END IF;
  
  IF cohost_user_id IS NULL THEN
    SELECT id INTO cohost_user_id FROM public.users ORDER BY created_at LIMIT 1 OFFSET 2;
    -- If we don't have a third user, use the second one or first one
    IF cohost_user_id IS NULL THEN 
      cohost_user_id := host_user_id;
      IF cohost_user_id IS NULL THEN cohost_user_id := owner_user_id; END IF;
    END IF;
  END IF;
  
  IF guest_user_id IS NULL THEN
    SELECT id INTO guest_user_id FROM public.users ORDER BY created_at LIMIT 1 OFFSET 3;
    -- If we don't have a fourth user, use the third, second, or first one
    IF guest_user_id IS NULL THEN 
      guest_user_id := cohost_user_id;
      IF guest_user_id IS NULL THEN 
        guest_user_id := host_user_id;
        IF guest_user_id IS NULL THEN guest_user_id := owner_user_id; END IF;
      END IF;
    END IF;
  END IF;
  
  -- Ensure we have at least one user
  IF owner_user_id IS NULL THEN
    RAISE EXCEPTION 'No users found. Please create at least one user first.';
  END IF;
  
  -- Note: We use existing users as-is to avoid auth issues
  -- In production, these would be actual separate users
  
  -- Get emails for verification
  SELECT email INTO owner_email FROM public.users WHERE id = owner_user_id;
  SELECT email INTO host_email FROM public.users WHERE id = host_user_id;
  SELECT email INTO cohost_email FROM public.users WHERE id = cohost_user_id;
  SELECT email INTO guest_email FROM public.users WHERE id = guest_user_id;
  
  RAISE NOTICE 'User IDs - Owner: % (%), Host: % (%), CoHost: % (%), Guest: % (%)', 
    owner_user_id, owner_email, 
    host_user_id, host_email,
    cohost_user_id, cohost_email,
    guest_user_id, guest_email;
  
  -- ============================================================================
  -- 2. GET EXISTING LISTINGS OR USE FIRST AVAILABLE
  -- ============================================================================
  
  SELECT id INTO listing1_id FROM public.listings ORDER BY created_at LIMIT 1 OFFSET 0;
  SELECT id INTO listing2_id FROM public.listings ORDER BY created_at LIMIT 1 OFFSET 1;
  SELECT id INTO listing3_id FROM public.listings ORDER BY created_at LIMIT 1 OFFSET 2;
  
  -- If we don't have enough listings, just use the first one multiple times
  IF listing1_id IS NULL THEN
    RAISE EXCEPTION 'No listings found. Please create at least one listing first.';
  END IF;
  IF listing2_id IS NULL THEN listing2_id := listing1_id; END IF;
  IF listing3_id IS NULL THEN listing3_id := listing1_id; END IF;
  
  RAISE NOTICE 'Using Listings - 1: %, 2: %, 3: %', listing1_id, listing2_id, listing3_id;
  
  -- ============================================================================
  -- 3. CREATE PROPERTY MANAGEMENT RECORDS
  -- ============================================================================
  
  -- Property 1: Self-managed
  INSERT INTO public.property_management (
    listing_id, owner_id, management_type, commission_rate,
    cleaning_fee, service_fee_rate, tax_rate, currency, payment_terms, auto_invoice
  ) VALUES (
    listing1_id, owner_user_id, 'self_managed', 0.00,
    50.00, 10.00, 8.50, 'USD', 30, true
  )
  ON CONFLICT (listing_id) DO UPDATE SET owner_id = EXCLUDED.owner_id
  RETURNING id INTO property1_id;
  
  -- Property 2: Host-managed
  INSERT INTO public.property_management (
    listing_id, owner_id, management_type, commission_rate,
    cleaning_fee, service_fee_rate, tax_rate, currency, payment_terms, auto_invoice
  ) VALUES (
    listing2_id, owner_user_id, 'host_managed', 15.00,
    75.00, 12.00, 8.50, 'USD', 30, true
  )
  ON CONFLICT (listing_id) DO UPDATE SET owner_id = EXCLUDED.owner_id
  RETURNING id INTO property2_id;
  
  -- Property 3: Co-hosted
  INSERT INTO public.property_management (
    listing_id, owner_id, management_type, commission_rate,
    cleaning_fee, service_fee_rate, tax_rate, currency, payment_terms, auto_invoice
  ) VALUES (
    listing3_id, owner_user_id, 'co_hosted', 10.00,
    60.00, 10.00, 8.50, 'USD', 30, true
  )
  ON CONFLICT (listing_id) DO UPDATE SET owner_id = EXCLUDED.owner_id
  RETURNING id INTO property3_id;
  
  RAISE NOTICE 'Properties created - 1: %, 2: %, 3: %', property1_id, property2_id, property3_id;
  
  -- ============================================================================
  -- 4. CREATE PROPERTY ASSIGNMENTS
  -- ============================================================================
  
  -- Host assignment for Property 2
  INSERT INTO public.property_assignments (
    property_id, user_id, role, commission_rate, start_date, status
  ) VALUES (
    property2_id, host_user_id, 'host', 15.00, CURRENT_DATE, 'active'
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO assignment1_id;
  
  -- Co-Host assignment for Property 3
  INSERT INTO public.property_assignments (
    property_id, user_id, role, commission_rate, start_date, status
  ) VALUES (
    property3_id, cohost_user_id, 'co_host', 10.00, CURRENT_DATE, 'active'
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO assignment2_id;
  
  RAISE NOTICE 'Assignments created - Host: %, CoHost: %', assignment1_id, assignment2_id;
  
  -- ============================================================================
  -- 5. CREATE RESERVATIONS (for rental invoices)
  -- ============================================================================
  
  -- Reservation 1: Active reservation (upcoming)
  -- Check if it already exists
  SELECT id INTO reservation1_id FROM public.reservations 
  WHERE user_id = guest_user_id AND listing_id = listing1_id 
  AND start_date = CURRENT_DATE + INTERVAL '7 days'
  LIMIT 1;
  
  IF reservation1_id IS NULL THEN
    INSERT INTO public.reservations (
      user_id, listing_id, start_date, end_date, total_price
    ) VALUES (
      guest_user_id, listing1_id, 
      CURRENT_DATE + INTERVAL '7 days', 
      CURRENT_DATE + INTERVAL '14 days',
      1200
    )
    RETURNING id INTO reservation1_id;
  END IF;
  
  -- Reservation 2: Past reservation
  SELECT id INTO reservation2_id FROM public.reservations 
  WHERE user_id = guest_user_id AND listing_id = listing2_id 
  AND start_date = CURRENT_DATE - INTERVAL '30 days'
  LIMIT 1;
  
  IF reservation2_id IS NULL THEN
    INSERT INTO public.reservations (
      user_id, listing_id, start_date, end_date, total_price
    ) VALUES (
      guest_user_id, listing2_id,
      CURRENT_DATE - INTERVAL '30 days',
      CURRENT_DATE - INTERVAL '23 days',
      900
    )
    RETURNING id INTO reservation2_id;
  END IF;
  
  RAISE NOTICE 'Reservations created - 1: %, 2: %', reservation1_id, reservation2_id;
  
  -- ============================================================================
  -- 6. CREATE INVOICES
  -- ============================================================================
  
  -- Rental Invoice: Guest's upcoming reservation
  IF reservation1_id IS NOT NULL THEN
    INSERT INTO public.invoices_v2 (
      invoice_number, invoice_type, property_id, reservation_id,
      issued_by, issued_to, customer_type, customer_name, customer_email,
      subtotal, tax_rate, tax_amount, total_amount, amount_due,
      issue_date, due_date, status, payment_status
    ) VALUES (
      'RNT-' || TO_CHAR(EXTRACT(YEAR FROM CURRENT_DATE), 'FM0000') || '-' || LPAD('000001', 6, '0'),
      'rental', property1_id, reservation1_id,
      owner_user_id, guest_user_id, 'guest', 
      (SELECT first_name || ' ' || last_name FROM public.users WHERE id = guest_user_id),
      (SELECT email FROM public.users WHERE id = guest_user_id),
      1100.00, 8.50, 93.50, 1193.50, 1193.50,
      CURRENT_DATE, CURRENT_DATE + INTERVAL '7 days', 'sent', 'unpaid'
    )
    ON CONFLICT (invoice_number) DO NOTHING
    RETURNING id INTO rental_invoice_id;
    
    -- Add line items for rental invoice
    IF rental_invoice_id IS NOT NULL THEN
      INSERT INTO public.invoice_line_items (
        invoice_id, item_type, description, quantity, unit_price, total_amount
      ) VALUES
      (rental_invoice_id, 'rental', 'Accommodation (7 nights)', 7, 157.14, 1100.00),
      (rental_invoice_id, 'service', 'Service Fee', 1, 110.00, 110.00),
      (rental_invoice_id, 'custom', 'Tax (8.5%)', 1, 93.50, 93.50)
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;
  
  -- Operational Invoice: Host created for property maintenance
  INSERT INTO public.invoices_v2 (
    invoice_number, invoice_type, property_id,
    issued_by, issued_to, customer_type, customer_name, customer_email,
    subtotal, tax_rate, tax_amount, total_amount, amount_due,
    issue_date, due_date, status, payment_status
  ) VALUES (
    'OPS-' || TO_CHAR(EXTRACT(YEAR FROM CURRENT_DATE), 'FM0000') || '-' || LPAD('000001', 6, '0'),
    'operational', property2_id,
    host_user_id, owner_user_id, 'owner',
    (SELECT first_name || ' ' || last_name FROM public.users WHERE id = owner_user_id),
    (SELECT email FROM public.users WHERE id = owner_user_id),
    500.00, 8.50, 42.50, 542.50, 542.50,
    CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', 'sent', 'unpaid'
  )
  ON CONFLICT (invoice_number) DO NOTHING
  RETURNING id INTO operational_invoice_id;
  
  -- Add line items for operational invoice
  IF operational_invoice_id IS NOT NULL THEN
      INSERT INTO public.invoice_line_items (
        invoice_id, item_type, description, quantity, unit_price, total_amount
      ) VALUES
      (operational_invoice_id, 'service', 'Property Deep Cleaning', 1, 300.00, 300.00),
      (operational_invoice_id, 'repair', 'HVAC Maintenance', 1, 200.00, 200.00),
      (operational_invoice_id, 'custom', 'Tax (8.5%)', 1, 42.50, 42.50)
      ON CONFLICT DO NOTHING;
  END IF;
  
  RAISE NOTICE 'Invoices created - Rental: %, Operational: %', rental_invoice_id, operational_invoice_id;
  
  -- ============================================================================
  -- 7. CREATE EXPENSES
  -- ============================================================================
  
  -- Expense 1: Host submitted - Pending
  INSERT INTO public.property_expenses (
    property_id, expense_type, description, amount, currency, expense_date,
    status, created_by
  ) VALUES (
    property2_id, 'cleaning', 'Weekly cleaning service for property', 150.00, 'USD', CURRENT_DATE - INTERVAL '3 days',
    'pending', host_user_id
  )
  RETURNING id INTO expense1_id;
  
  -- Expense 2: Host submitted - Approved
  INSERT INTO public.property_expenses (
    property_id, expense_type, description, amount, currency, expense_date,
    status, created_by, approved_by, approved_at
  ) VALUES (
    property2_id, 'repair', 'Fix broken window', 250.00, 'USD', CURRENT_DATE - INTERVAL '7 days',
    'approved', host_user_id, owner_user_id, CURRENT_DATE - INTERVAL '6 days'
  )
  RETURNING id INTO expense2_id;
  
  -- Expense 3: Co-Host submitted - Pending
  INSERT INTO public.property_expenses (
    property_id, expense_type, description, amount, currency, expense_date,
    status, created_by
  ) VALUES (
    property3_id, 'maintenance', 'Garden maintenance and landscaping', 180.00, 'USD', CURRENT_DATE - INTERVAL '2 days',
    'pending', cohost_user_id
  )
  RETURNING id INTO expense3_id;
  
  RAISE NOTICE 'Expenses created - 1: %, 2: %, 3: %', expense1_id, expense2_id, expense3_id;
  
  -- ============================================================================
  -- 8. CREATE PAYMENTS
  -- ============================================================================
  
  -- Payment 1: Partial payment on rental invoice
  IF rental_invoice_id IS NOT NULL THEN
    INSERT INTO public.payments (
      invoice_id, payer_id, payment_method, amount, currency, payment_date, status
    ) VALUES (
      rental_invoice_id, guest_user_id, 'stripe', 500.00, 'USD', CURRENT_DATE - INTERVAL '2 days', 'completed'
    )
    RETURNING id INTO payment1_id;
    
    -- Update invoice amount_paid
    UPDATE public.invoices_v2 
    SET amount_paid = 500.00, amount_due = total_amount - 500.00, payment_status = 'partial'
    WHERE id = rental_invoice_id;
  END IF;
  
  -- Payment 2: Full payment on operational invoice
  IF operational_invoice_id IS NOT NULL THEN
    INSERT INTO public.payments (
      invoice_id, payer_id, payment_method, amount, currency, payment_date, status
    ) VALUES (
      operational_invoice_id, owner_user_id, 'bank_transfer', 542.50, 'USD', CURRENT_DATE - INTERVAL '1 day', 'completed'
    )
    RETURNING id INTO payment2_id;
    
    -- Update invoice as paid
    UPDATE public.invoices_v2 
    SET amount_paid = 542.50, amount_due = 0.00, payment_status = 'paid', status = 'paid', paid_date = CURRENT_DATE - INTERVAL '1 day'
    WHERE id = operational_invoice_id;
  END IF;
  
  RAISE NOTICE 'Payments created - 1: %, 2: %', payment1_id, payment2_id;
  
  RAISE NOTICE '✅ PMS test data seeding completed successfully!';
  
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '❌ Error seeding PMS test data: %', SQLERRM;
  RAISE;
END $$;

-- Verify seeded data
DO $$
DECLARE
  prop_count INTEGER;
  assign_count INTEGER;
  invoice_count INTEGER;
  expense_count INTEGER;
  payment_count INTEGER;
  reservation_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO prop_count FROM public.property_management;
  SELECT COUNT(*) INTO assign_count FROM public.property_assignments;
  SELECT COUNT(*) INTO invoice_count FROM public.invoices_v2;
  SELECT COUNT(*) INTO expense_count FROM public.property_expenses;
  SELECT COUNT(*) INTO payment_count FROM public.payments;
  -- Count reservations created by seed (any reservations with test data pattern)
  SELECT COUNT(*) INTO reservation_count FROM public.reservations 
  WHERE total_price IN (1200, 900) OR start_date >= CURRENT_DATE - INTERVAL '40 days';
  
  RAISE NOTICE '';
  RAISE NOTICE '📊 Verification Summary:';
  RAISE NOTICE '   Properties: %', prop_count;
  RAISE NOTICE '   Assignments: %', assign_count;
  RAISE NOTICE '   Invoices: %', invoice_count;
  RAISE NOTICE '   Expenses: %', expense_count;
  RAISE NOTICE '   Payments: %', payment_count;
  RAISE NOTICE '   Reservations: %', reservation_count;
END $$;

