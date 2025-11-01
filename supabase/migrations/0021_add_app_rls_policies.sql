-- Migration: Add RLS Policies for All Application Tables
-- This migration adds Row Level Security policies to allow users to access their own data

-- ============================================================================
-- NOTES APP
-- ============================================================================

-- Enable RLS on notes table
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- Users can view their own notes
CREATE POLICY "Users can view own notes"
ON public.notes FOR SELECT
USING (user_id = auth.uid());

-- Users can create their own notes
CREATE POLICY "Users can create own notes"
ON public.notes FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Users can update their own notes
CREATE POLICY "Users can update own notes"
ON public.notes FOR UPDATE
USING (user_id = auth.uid());

-- Users can delete their own notes
CREATE POLICY "Users can delete own notes"
ON public.notes FOR DELETE
USING (user_id = auth.uid());

-- ============================================================================
-- CHAT APP
-- ============================================================================

-- Enable RLS on conversations table
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Users can view conversations they created
CREATE POLICY "Users can view own conversations"
ON public.conversations FOR SELECT
USING (created_by = auth.uid());

-- Users can create conversations
CREATE POLICY "Users can create conversations"
ON public.conversations FOR INSERT
WITH CHECK (created_by = auth.uid());

-- Users can update their own conversations
CREATE POLICY "Users can update own conversations"
ON public.conversations FOR UPDATE
USING (created_by = auth.uid());

-- Users can delete their own conversations
CREATE POLICY "Users can delete own conversations"
ON public.conversations FOR DELETE
USING (created_by = auth.uid());

-- Enable RLS on messages table
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Users can view messages in conversations they created
CREATE POLICY "Users can view messages in own conversations"
ON public.messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.conversations
    WHERE conversations.id = messages.conversation_id
    AND conversations.created_by = auth.uid()
  )
);

-- Users can create messages in their own conversations
CREATE POLICY "Users can create messages in own conversations"
ON public.messages FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.conversations
    WHERE conversations.id = conversation_id
    AND conversations.created_by = auth.uid()
  )
  AND user_id = auth.uid()
);

-- Users can update their own messages
CREATE POLICY "Users can update own messages"
ON public.messages FOR UPDATE
USING (user_id = auth.uid());

-- Users can delete their own messages
CREATE POLICY "Users can delete own messages"
ON public.messages FOR DELETE
USING (user_id = auth.uid());

-- ============================================================================
-- EMAIL APP
-- ============================================================================

-- Enable RLS on emails table
ALTER TABLE public.emails ENABLE ROW LEVEL SECURITY;

-- Users can view their own emails
CREATE POLICY "Users can view own emails"
ON public.emails FOR SELECT
USING (user_id = auth.uid());

-- Users can create their own emails
CREATE POLICY "Users can create own emails"
ON public.emails FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Users can update their own emails
CREATE POLICY "Users can update own emails"
ON public.emails FOR UPDATE
USING (user_id = auth.uid());

-- Users can delete their own emails
CREATE POLICY "Users can delete own emails"
ON public.emails FOR DELETE
USING (user_id = auth.uid());

-- ============================================================================
-- CALENDAR APP
-- ============================================================================

-- Enable RLS on calendar_events table
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

-- Users can view their own calendar events
CREATE POLICY "Users can view own calendar events"
ON public.calendar_events FOR SELECT
USING (user_id = auth.uid());

-- Users can create their own calendar events
CREATE POLICY "Users can create own calendar events"
ON public.calendar_events FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Users can update their own calendar events
CREATE POLICY "Users can update own calendar events"
ON public.calendar_events FOR UPDATE
USING (user_id = auth.uid());

-- Users can delete their own calendar events
CREATE POLICY "Users can delete own calendar events"
ON public.calendar_events FOR DELETE
USING (user_id = auth.uid());

-- ============================================================================
-- KANBAN APP
-- ============================================================================

-- Enable RLS on kanban_boards table
ALTER TABLE public.kanban_boards ENABLE ROW LEVEL SECURITY;

-- Users can view their own kanban boards
CREATE POLICY "Users can view own kanban boards"
ON public.kanban_boards FOR SELECT
USING (user_id = auth.uid());

-- Users can create their own kanban boards
CREATE POLICY "Users can create own kanban boards"
ON public.kanban_boards FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Users can update their own kanban boards
CREATE POLICY "Users can update own kanban boards"
ON public.kanban_boards FOR UPDATE
USING (user_id = auth.uid());

-- Users can delete their own kanban boards
CREATE POLICY "Users can delete own kanban boards"
ON public.kanban_boards FOR DELETE
USING (user_id = auth.uid());

-- Enable RLS on kanban_columns table
ALTER TABLE public.kanban_columns ENABLE ROW LEVEL SECURITY;

-- Users can view columns in their own boards
CREATE POLICY "Users can view columns in own boards"
ON public.kanban_columns FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.kanban_boards
    WHERE kanban_boards.id = kanban_columns.board_id
    AND kanban_boards.user_id = auth.uid()
  )
);

-- Users can create columns in their own boards
CREATE POLICY "Users can create columns in own boards"
ON public.kanban_columns FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.kanban_boards
    WHERE kanban_boards.id = board_id
    AND kanban_boards.user_id = auth.uid()
  )
);

-- Users can update columns in their own boards
CREATE POLICY "Users can update columns in own boards"
ON public.kanban_columns FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.kanban_boards
    WHERE kanban_boards.id = kanban_columns.board_id
    AND kanban_boards.user_id = auth.uid()
  )
);

-- Users can delete columns in their own boards
CREATE POLICY "Users can delete columns in own boards"
ON public.kanban_columns FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.kanban_boards
    WHERE kanban_boards.id = kanban_columns.board_id
    AND kanban_boards.user_id = auth.uid()
  )
);

-- ============================================================================
-- INVOICE APP
-- ============================================================================

-- Enable RLS on invoices table
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Users can view their own invoices
CREATE POLICY "Users can view own invoices"
ON public.invoices FOR SELECT
USING (user_id = auth.uid());

-- Users can create their own invoices
CREATE POLICY "Users can create own invoices"
ON public.invoices FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Users can update their own invoices
CREATE POLICY "Users can update own invoices"
ON public.invoices FOR UPDATE
USING (user_id = auth.uid());

-- Users can delete their own invoices
CREATE POLICY "Users can delete own invoices"
ON public.invoices FOR DELETE
USING (user_id = auth.uid());

-- Enable RLS on invoice_items table
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

-- Users can view items in their own invoices
CREATE POLICY "Users can view items in own invoices"
ON public.invoice_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.invoices
    WHERE invoices.id = invoice_items.invoice_id
    AND invoices.user_id = auth.uid()
  )
);

-- Users can create items in their own invoices
CREATE POLICY "Users can create items in own invoices"
ON public.invoice_items FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.invoices
    WHERE invoices.id = invoice_id
    AND invoices.user_id = auth.uid()
  )
);

-- Users can update items in their own invoices
CREATE POLICY "Users can update items in own invoices"
ON public.invoice_items FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.invoices
    WHERE invoices.id = invoice_items.invoice_id
    AND invoices.user_id = auth.uid()
  )
);

-- Users can delete items in their own invoices
CREATE POLICY "Users can delete items in own invoices"
ON public.invoice_items FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.invoices
    WHERE invoices.id = invoice_items.invoice_id
    AND invoices.user_id = auth.uid()
  )
);

-- ============================================================================
-- CONTACTS APP
-- ============================================================================

-- Enable RLS on contacts table
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- Users can view their own contacts
CREATE POLICY "Users can view own contacts"
ON public.contacts FOR SELECT
USING (user_id = auth.uid());

-- Users can create their own contacts
CREATE POLICY "Users can create own contacts"
ON public.contacts FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Users can update their own contacts
CREATE POLICY "Users can update own contacts"
ON public.contacts FOR UPDATE
USING (user_id = auth.uid());

-- Users can delete their own contacts
CREATE POLICY "Users can delete own contacts"
ON public.contacts FOR DELETE
USING (user_id = auth.uid());

-- ============================================================================
-- BLOG APP
-- ============================================================================

-- Enable RLS on blog_posts table
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- Users can view their own blog posts
CREATE POLICY "Users can view own blog posts"
ON public.blog_posts FOR SELECT
USING (user_id = auth.uid());

-- Users can create their own blog posts
CREATE POLICY "Users can create own blog posts"
ON public.blog_posts FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Users can update their own blog posts
CREATE POLICY "Users can update own blog posts"
ON public.blog_posts FOR UPDATE
USING (user_id = auth.uid());

-- Users can delete their own blog posts
CREATE POLICY "Users can delete own blog posts"
ON public.blog_posts FOR DELETE
USING (user_id = auth.uid());

-- ============================================================================
-- TICKETS APP
-- ============================================================================

-- Enable RLS on tickets table
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- Users can view their own tickets
CREATE POLICY "Users can view own tickets"
ON public.tickets FOR SELECT
USING (user_id = auth.uid());

-- Users can create their own tickets
CREATE POLICY "Users can create own tickets"
ON public.tickets FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Users can update their own tickets
CREATE POLICY "Users can update own tickets"
ON public.tickets FOR UPDATE
USING (user_id = auth.uid());

-- Users can delete their own tickets
CREATE POLICY "Users can delete own tickets"
ON public.tickets FOR DELETE
USING (user_id = auth.uid());

-- ============================================================================
-- ECOMMERCE APP
-- ============================================================================

-- Enable RLS on products table
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Users can view all products (public read)
CREATE POLICY "Anyone can view products"
ON public.products FOR SELECT
USING (true);

-- Only product owners can create products
CREATE POLICY "Users can create own products"
ON public.products FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Only product owners can update their products
CREATE POLICY "Users can update own products"
ON public.products FOR UPDATE
USING (user_id = auth.uid());

-- Only product owners can delete their products
CREATE POLICY "Users can delete own products"
ON public.products FOR DELETE
USING (user_id = auth.uid());

-- Enable RLS on orders table
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Users can view their own orders
CREATE POLICY "Users can view own orders"
ON public.orders FOR SELECT
USING (user_id = auth.uid());

-- Users can create their own orders
CREATE POLICY "Users can create own orders"
ON public.orders FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Users can update their own orders
CREATE POLICY "Users can update own orders"
ON public.orders FOR UPDATE
USING (user_id = auth.uid());

-- Users can delete their own orders
CREATE POLICY "Users can delete own orders"
ON public.orders FOR DELETE
USING (user_id = auth.uid());

-- ============================================================================
-- ADMIN OVERRIDES
-- ============================================================================

-- Admins can view all data in all tables
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
    EXECUTE format('
      CREATE POLICY "Admins can view all %I"
      ON public.%I FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.user_roles ur
          JOIN public.roles r ON ur.role_id = r.id
          WHERE ur.user_id = auth.uid()
          AND r.name IN (''admin'', ''super_admin'')
        )
      )', table_name, table_name);
      
    EXECUTE format('
      CREATE POLICY "Admins can update all %I"
      ON public.%I FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM public.user_roles ur
          JOIN public.roles r ON ur.role_id = r.id
          WHERE ur.user_id = auth.uid()
          AND r.name IN (''admin'', ''super_admin'')
        )
      )', table_name, table_name);
      
    EXECUTE format('
      CREATE POLICY "Admins can delete all %I"
      ON public.%I FOR DELETE
      USING (
        EXISTS (
          SELECT 1 FROM public.user_roles ur
          JOIN public.roles r ON ur.role_id = r.id
          WHERE ur.user_id = auth.uid()
          AND r.name IN (''admin'', ''super_admin'')
        )
      )', table_name, table_name);
  END LOOP;
END $$;

