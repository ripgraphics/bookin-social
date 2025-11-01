-- Migration: Remove Recursive Admin Policies from App Tables
-- The admin policies cause infinite recursion when checking user_roles
-- Admin access should be handled at the application level, not RLS level

-- Drop all admin policies from app tables
DO $$
DECLARE
  table_name text;
  tables text[] := ARRAY[
    'notes', 'conversations', 'messages', 'emails', 'calendar_events',
    'kanban_boards', 'kanban_columns', 'invoices', 'invoice_items',
    'contacts', 'blog_posts', 'tickets', 'products', 'orders'
  ];
BEGIN
  FOREACH table_name IN ARRAY tables
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Admins can view all %I" ON public.%I', table_name, table_name);
    EXECUTE format('DROP POLICY IF EXISTS "Admins can update all %I" ON public.%I', table_name, table_name);
    EXECUTE format('DROP POLICY IF EXISTS "Admins can delete all %I" ON public.%I', table_name, table_name);
  END LOOP;
END $$;

