-- Migration: Fix RLS Policies to Use public.users.id Instead of auth.uid()
-- The app tables reference public.users.id, not auth.users.id directly

-- Drop all existing policies first (both old and new names)
DROP POLICY IF EXISTS "Users can view own notes" ON public.notes;
DROP POLICY IF EXISTS "Users can create own notes" ON public.notes;
DROP POLICY IF EXISTS "Users can update own notes" ON public.notes;
DROP POLICY IF EXISTS "Users can delete own notes" ON public.notes;
DROP POLICY IF EXISTS "Admins can view all notes" ON public.notes;
DROP POLICY IF EXISTS "Admins can update all notes" ON public.notes;
DROP POLICY IF EXISTS "Admins can delete all notes" ON public.notes;

-- Drop policies for messages (special names)
DROP POLICY IF EXISTS "Users can view messages in own conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can create messages in own conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can update own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can delete own messages" ON public.messages;
DROP POLICY IF EXISTS "Admins can view all messages" ON public.messages;
DROP POLICY IF EXISTS "Admins can update all messages" ON public.messages;
DROP POLICY IF EXISTS "Admins can delete all messages" ON public.messages;

-- Drop policies for kanban_columns (special names)
DROP POLICY IF EXISTS "Users can view columns in own boards" ON public.kanban_columns;
DROP POLICY IF EXISTS "Users can create columns in own boards" ON public.kanban_columns;
DROP POLICY IF EXISTS "Users can update columns in own boards" ON public.kanban_columns;
DROP POLICY IF EXISTS "Users can delete columns in own boards" ON public.kanban_columns;
DROP POLICY IF EXISTS "Admins can view all kanban_columns" ON public.kanban_columns;
DROP POLICY IF EXISTS "Admins can update all kanban_columns" ON public.kanban_columns;
DROP POLICY IF EXISTS "Admins can delete all kanban_columns" ON public.kanban_columns;

-- Drop policies for invoice_items (special names)
DROP POLICY IF EXISTS "Users can view items in own invoices" ON public.invoice_items;
DROP POLICY IF EXISTS "Users can create items in own invoices" ON public.invoice_items;
DROP POLICY IF EXISTS "Users can update items in own invoices" ON public.invoice_items;
DROP POLICY IF EXISTS "Users can delete items in own invoices" ON public.invoice_items;
DROP POLICY IF EXISTS "Admins can view all invoice_items" ON public.invoice_items;
DROP POLICY IF EXISTS "Admins can update all invoice_items" ON public.invoice_items;
DROP POLICY IF EXISTS "Admins can delete all invoice_items" ON public.invoice_items;

-- Drop policies for products (special names)
DROP POLICY IF EXISTS "Anyone can view products" ON public.products;
DROP POLICY IF EXISTS "Users can create own products" ON public.products;
DROP POLICY IF EXISTS "Users can update own products" ON public.products;
DROP POLICY IF EXISTS "Users can delete own products" ON public.products;
DROP POLICY IF EXISTS "Admins can view all products" ON public.products;
DROP POLICY IF EXISTS "Admins can update all products" ON public.products;
DROP POLICY IF EXISTS "Admins can delete all products" ON public.products;

-- Create corrected policies for notes that properly map auth.uid() to public.users.id
CREATE POLICY "Users can view own notes"
ON public.notes FOR SELECT
USING (
  user_id IN (
    SELECT id FROM public.users WHERE auth_user_id = auth.uid()
  )
);

CREATE POLICY "Users can create own notes"
ON public.notes FOR INSERT
WITH CHECK (
  user_id IN (
    SELECT id FROM public.users WHERE auth_user_id = auth.uid()
  )
);

CREATE POLICY "Users can update own notes"
ON public.notes FOR UPDATE
USING (
  user_id IN (
    SELECT id FROM public.users WHERE auth_user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete own notes"
ON public.notes FOR DELETE
USING (
  user_id IN (
    SELECT id FROM public.users WHERE auth_user_id = auth.uid()
  )
);

-- Admin policies remain the same
CREATE POLICY "Admins can view all notes"
ON public.notes FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    JOIN public.users u ON ur.user_id = u.id
    WHERE u.auth_user_id = auth.uid()
    AND r.name IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Admins can update all notes"
ON public.notes FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    JOIN public.users u ON ur.user_id = u.id
    WHERE u.auth_user_id = auth.uid()
    AND r.name IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Admins can delete all notes"
ON public.notes FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    JOIN public.users u ON ur.user_id = u.id
    WHERE u.auth_user_id = auth.uid()
    AND r.name IN ('admin', 'super_admin')
  )
);

-- Apply the same fix to all other app tables
DO $$
DECLARE
  table_name text;
  tables text[] := ARRAY[
    'conversations', 'messages', 'emails', 'calendar_events',
    'kanban_boards', 'kanban_columns', 'invoices', 'invoice_items',
    'contacts', 'blog_posts', 'tickets', 'products', 'orders'
  ];
  user_col text;
BEGIN
  FOREACH table_name IN ARRAY tables
  LOOP
    -- Determine the user column name (most use user_id, conversations uses created_by)
    IF table_name = 'conversations' THEN
      user_col := 'created_by';
    ELSE
      user_col := 'user_id';
    END IF;
    
    -- Drop existing policies
    EXECUTE format('DROP POLICY IF EXISTS "Users can view own %I" ON public.%I', table_name, table_name);
    EXECUTE format('DROP POLICY IF EXISTS "Users can create own %I" ON public.%I', table_name, table_name);
    EXECUTE format('DROP POLICY IF EXISTS "Users can update own %I" ON public.%I', table_name, table_name);
    EXECUTE format('DROP POLICY IF EXISTS "Users can delete own %I" ON public.%I', table_name, table_name);
    EXECUTE format('DROP POLICY IF EXISTS "Admins can view all %I" ON public.%I', table_name, table_name);
    EXECUTE format('DROP POLICY IF EXISTS "Admins can update all %I" ON public.%I', table_name, table_name);
    EXECUTE format('DROP POLICY IF EXISTS "Admins can delete all %I" ON public.%I', table_name, table_name);
    
    -- Special handling for messages and kanban_columns (they reference parent tables)
    IF table_name = 'messages' THEN
      -- Messages: check through conversations
      EXECUTE 'CREATE POLICY "Users can view messages in own conversations"
        ON public.messages FOR SELECT
        USING (
          EXISTS (
            SELECT 1 FROM public.conversations c
            JOIN public.users u ON c.created_by = u.id
            WHERE c.id = messages.conversation_id
            AND u.auth_user_id = auth.uid()
          )
        )';
        
      EXECUTE 'CREATE POLICY "Users can create messages in own conversations"
        ON public.messages FOR INSERT
        WITH CHECK (
          EXISTS (
            SELECT 1 FROM public.conversations c
            JOIN public.users u ON c.created_by = u.id
            WHERE c.id = conversation_id
            AND u.auth_user_id = auth.uid()
          )
          AND user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
        )';
        
      EXECUTE 'CREATE POLICY "Users can update own messages"
        ON public.messages FOR UPDATE
        USING (user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()))';
        
      EXECUTE 'CREATE POLICY "Users can delete own messages"
        ON public.messages FOR DELETE
        USING (user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()))';
        
    ELSIF table_name = 'kanban_columns' THEN
      -- Kanban columns: check through kanban_boards
      EXECUTE 'CREATE POLICY "Users can view columns in own boards"
        ON public.kanban_columns FOR SELECT
        USING (
          EXISTS (
            SELECT 1 FROM public.kanban_boards kb
            JOIN public.users u ON kb.user_id = u.id
            WHERE kb.id = kanban_columns.board_id
            AND u.auth_user_id = auth.uid()
          )
        )';
        
      EXECUTE 'CREATE POLICY "Users can create columns in own boards"
        ON public.kanban_columns FOR INSERT
        WITH CHECK (
          EXISTS (
            SELECT 1 FROM public.kanban_boards kb
            JOIN public.users u ON kb.user_id = u.id
            WHERE kb.id = board_id
            AND u.auth_user_id = auth.uid()
          )
        )';
        
      EXECUTE 'CREATE POLICY "Users can update columns in own boards"
        ON public.kanban_columns FOR UPDATE
        USING (
          EXISTS (
            SELECT 1 FROM public.kanban_boards kb
            JOIN public.users u ON kb.user_id = u.id
            WHERE kb.id = kanban_columns.board_id
            AND u.auth_user_id = auth.uid()
          )
        )';
        
      EXECUTE 'CREATE POLICY "Users can delete columns in own boards"
        ON public.kanban_columns FOR DELETE
        USING (
          EXISTS (
            SELECT 1 FROM public.kanban_boards kb
            JOIN public.users u ON kb.user_id = u.id
            WHERE kb.id = kanban_columns.board_id
            AND u.auth_user_id = auth.uid()
          )
        )';
        
    ELSIF table_name = 'invoice_items' THEN
      -- Invoice items: check through invoices
      EXECUTE 'CREATE POLICY "Users can view items in own invoices"
        ON public.invoice_items FOR SELECT
        USING (
          EXISTS (
            SELECT 1 FROM public.invoices inv
            JOIN public.users u ON inv.user_id = u.id
            WHERE inv.id = invoice_items.invoice_id
            AND u.auth_user_id = auth.uid()
          )
        )';
        
      EXECUTE 'CREATE POLICY "Users can create items in own invoices"
        ON public.invoice_items FOR INSERT
        WITH CHECK (
          EXISTS (
            SELECT 1 FROM public.invoices inv
            JOIN public.users u ON inv.user_id = u.id
            WHERE inv.id = invoice_id
            AND u.auth_user_id = auth.uid()
          )
        )';
        
      EXECUTE 'CREATE POLICY "Users can update items in own invoices"
        ON public.invoice_items FOR UPDATE
        USING (
          EXISTS (
            SELECT 1 FROM public.invoices inv
            JOIN public.users u ON inv.user_id = u.id
            WHERE inv.id = invoice_items.invoice_id
            AND u.auth_user_id = auth.uid()
          )
        )';
        
      EXECUTE 'CREATE POLICY "Users can delete items in own invoices"
        ON public.invoice_items FOR DELETE
        USING (
          EXISTS (
            SELECT 1 FROM public.invoices inv
            JOIN public.users u ON inv.user_id = u.id
            WHERE inv.id = invoice_items.invoice_id
            AND u.auth_user_id = auth.uid()
          )
        )';
        
    ELSIF table_name = 'products' THEN
      -- Products: public read, owner write
      EXECUTE 'CREATE POLICY "Anyone can view products"
        ON public.products FOR SELECT
        USING (true)';
        
      EXECUTE format('CREATE POLICY "Users can create own %I"
        ON public.%I FOR INSERT
        WITH CHECK (%I IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()))',
        table_name, table_name, user_col);
        
      EXECUTE format('CREATE POLICY "Users can update own %I"
        ON public.%I FOR UPDATE
        USING (%I IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()))',
        table_name, table_name, user_col);
        
      EXECUTE format('CREATE POLICY "Users can delete own %I"
        ON public.%I FOR DELETE
        USING (%I IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()))',
        table_name, table_name, user_col);
        
    ELSE
      -- Standard tables: user_id or created_by
      EXECUTE format('CREATE POLICY "Users can view own %I"
        ON public.%I FOR SELECT
        USING (%I IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()))',
        table_name, table_name, user_col);
        
      EXECUTE format('CREATE POLICY "Users can create own %I"
        ON public.%I FOR INSERT
        WITH CHECK (%I IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()))',
        table_name, table_name, user_col);
        
      EXECUTE format('CREATE POLICY "Users can update own %I"
        ON public.%I FOR UPDATE
        USING (%I IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()))',
        table_name, table_name, user_col);
        
      EXECUTE format('CREATE POLICY "Users can delete own %I"
        ON public.%I FOR DELETE
        USING (%I IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()))',
        table_name, table_name, user_col);
    END IF;
    
    -- Admin policies (same for all tables)
    EXECUTE format('CREATE POLICY "Admins can view all %I"
      ON public.%I FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.user_roles ur
          JOIN public.roles r ON ur.role_id = r.id
          JOIN public.users u ON ur.user_id = u.id
          WHERE u.auth_user_id = auth.uid()
          AND r.name IN (''admin'', ''super_admin'')
        )
      )', table_name, table_name);
      
    EXECUTE format('CREATE POLICY "Admins can update all %I"
      ON public.%I FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM public.user_roles ur
          JOIN public.roles r ON ur.role_id = r.id
          JOIN public.users u ON ur.user_id = u.id
          WHERE u.auth_user_id = auth.uid()
          AND r.name IN (''admin'', ''super_admin'')
        )
      )', table_name, table_name);
      
    EXECUTE format('CREATE POLICY "Admins can delete all %I"
      ON public.%I FOR DELETE
      USING (
        EXISTS (
          SELECT 1 FROM public.user_roles ur
          JOIN public.roles r ON ur.role_id = r.id
          JOIN public.users u ON ur.user_id = u.id
          WHERE u.auth_user_id = auth.uid()
          AND r.name IN (''admin'', ''super_admin'')
        )
      )', table_name, table_name);
  END LOOP;
END $$;

