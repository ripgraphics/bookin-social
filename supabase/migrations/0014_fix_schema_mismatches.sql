-- =====================================================
-- FIX SCHEMA MISMATCHES
-- =====================================================
-- Adds missing user_id columns and other required columns
-- to match API expectations
-- =====================================================

-- 1. Add user_id to conversations (use created_by as source)
ALTER TABLE public.conversations 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.users(id) ON DELETE CASCADE;

-- Populate user_id from created_by if it exists
UPDATE public.conversations 
SET user_id = created_by 
WHERE user_id IS NULL AND created_by IS NOT NULL;

-- 2. Add created_at to conversation_participants (not critical, but for consistency)
ALTER TABLE public.conversation_participants 
ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now();

-- 3. Add user_id to messages (use sender_id as source)
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.users(id) ON DELETE CASCADE;

-- Populate user_id from sender_id
UPDATE public.messages 
SET user_id = sender_id 
WHERE user_id IS NULL AND sender_id IS NOT NULL;

-- 4. Add user_id to emails (use sender_id as source)
ALTER TABLE public.emails 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.users(id) ON DELETE CASCADE;

-- Populate user_id from sender_id
UPDATE public.emails 
SET user_id = sender_id 
WHERE user_id IS NULL AND sender_id IS NOT NULL;

-- 5. Add user_id to kanban_columns (derive from board)
ALTER TABLE public.kanban_columns 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.users(id) ON DELETE CASCADE;

-- Populate user_id from the board's user_id
UPDATE public.kanban_columns kc
SET user_id = kb.user_id
FROM public.kanban_boards kb
WHERE kc.board_id = kb.id AND kc.user_id IS NULL;

-- 6. Add updated_at to kanban_columns
ALTER TABLE public.kanban_columns 
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- 7. Add user_id to kanban_cards (derive from column's board)
ALTER TABLE public.kanban_cards 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.users(id) ON DELETE CASCADE;

-- Populate user_id from the column's board's user_id
UPDATE public.kanban_cards kcard
SET user_id = kb.user_id
FROM public.kanban_columns kc
JOIN public.kanban_boards kb ON kc.board_id = kb.id
WHERE kcard.column_id = kc.id AND kcard.user_id IS NULL;

-- 8. Add user_id to products
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.users(id) ON DELETE CASCADE;

-- For products, we need to decide: should all products belong to the first admin user?
-- Or should products be system-wide? For now, let's make them belong to admin
DO $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- Get the first admin user
  SELECT u.id INTO admin_user_id
  FROM public.users u
  JOIN public.user_roles ur ON u.id = ur.user_id
  JOIN public.roles r ON ur.role_id = r.id
  WHERE r.name IN ('admin', 'super_admin')
  LIMIT 1;

  -- Update products with admin user_id
  IF admin_user_id IS NOT NULL THEN
    UPDATE public.products SET user_id = admin_user_id WHERE user_id IS NULL;
  END IF;
END $$;

-- 9. Add user_id to orders
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.users(id) ON DELETE CASCADE;

-- For orders, use customer_id if it references users table
UPDATE public.orders 
SET user_id = customer_id 
WHERE user_id IS NULL AND customer_id IS NOT NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON public.messages(user_id);
CREATE INDEX IF NOT EXISTS idx_emails_user_id ON public.emails(user_id);
CREATE INDEX IF NOT EXISTS idx_kanban_columns_user_id ON public.kanban_columns(user_id);
CREATE INDEX IF NOT EXISTS idx_kanban_cards_user_id ON public.kanban_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_products_user_id ON public.products(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);

-- Update RLS policies to use new user_id columns where appropriate
-- (Keeping existing policies but they'll now work with user_id)

COMMENT ON COLUMN public.conversations.user_id IS 'Owner of the conversation';
COMMENT ON COLUMN public.messages.user_id IS 'Derived from sender_id for consistency';
COMMENT ON COLUMN public.emails.user_id IS 'Derived from sender_id for consistency';
COMMENT ON COLUMN public.kanban_columns.user_id IS 'Derived from board owner';
COMMENT ON COLUMN public.kanban_cards.user_id IS 'Derived from board owner';
COMMENT ON COLUMN public.products.user_id IS 'Product owner/creator';
COMMENT ON COLUMN public.orders.user_id IS 'Customer who placed the order';

