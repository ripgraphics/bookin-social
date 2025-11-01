-- =====================================================
-- CREATE ALL APPLICATION TABLES
-- =====================================================
-- Creates tables for: Chat, Email, Calendar, Notes, Kanban, 
-- Invoice, Contacts, Tickets, Blog, eCommerce, Profile
-- =====================================================

-- =====================================================
-- CHAT APPLICATION
-- =====================================================

CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text DEFAULT 'direct',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.conversation_participants (
  conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  joined_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (conversation_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  message_type text DEFAULT 'text',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- =====================================================
-- EMAIL APPLICATION
-- =====================================================

CREATE TABLE IF NOT EXISTS public.emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  from_email text NOT NULL,
  subject text NOT NULL,
  content text NOT NULL,
  folder text DEFAULT 'drafts',
  is_read boolean DEFAULT false,
  is_starred boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.email_recipients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email_id uuid REFERENCES public.emails(id) ON DELETE CASCADE,
  email text NOT NULL,
  recipient_type text DEFAULT 'to',
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.email_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email_id uuid REFERENCES public.emails(id) ON DELETE CASCADE,
  file_url text NOT NULL,
  file_name text NOT NULL,
  file_type text,
  file_size bigint,
  created_at timestamp with time zone DEFAULT now()
);

-- =====================================================
-- CALENDAR APPLICATION
-- =====================================================

CREATE TABLE IF NOT EXISTS public.calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  start_time timestamp with time zone NOT NULL,
  end_time timestamp with time zone NOT NULL,
  is_all_day boolean DEFAULT false,
  location text,
  color text DEFAULT '#5D87FF',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.event_attendees (
  event_id uuid REFERENCES public.calendar_events(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  status text DEFAULT 'pending',
  created_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (event_id, user_id)
);

-- =====================================================
-- NOTES APPLICATION
-- =====================================================

CREATE TABLE IF NOT EXISTS public.notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  is_pinned boolean DEFAULT false,
  folder text DEFAULT 'general',
  tags text[],
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- =====================================================
-- KANBAN APPLICATION
-- =====================================================

CREATE TABLE IF NOT EXISTS public.kanban_boards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.kanban_columns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id uuid REFERENCES public.kanban_boards(id) ON DELETE CASCADE,
  name text NOT NULL,
  position integer NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.kanban_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  column_id uuid REFERENCES public.kanban_columns(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  position integer NOT NULL,
  due_date timestamp with time zone,
  labels text[],
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- =====================================================
-- INVOICE APPLICATION
-- =====================================================

CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  invoice_number text NOT NULL UNIQUE,
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  issue_date timestamp with time zone DEFAULT now(),
  due_date timestamp with time zone NOT NULL,
  line_items text NOT NULL,
  total_amount decimal(10, 2) NOT NULL,
  tax_amount decimal(10, 2) NOT NULL,
  status text DEFAULT 'pending',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- =====================================================
-- CONTACTS APPLICATION
-- =====================================================

CREATE TABLE IF NOT EXISTS public.contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  phone text,
  company text,
  address text,
  notes text,
  group_name text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- =====================================================
-- TICKETS APPLICATION
-- =====================================================

CREATE TABLE IF NOT EXISTS public.tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  status text DEFAULT 'open',
  priority text DEFAULT 'medium',
  category text DEFAULT 'general',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- =====================================================
-- BLOG APPLICATION
-- =====================================================

CREATE TABLE IF NOT EXISTS public.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  content text NOT NULL,
  featured_image text,
  status text DEFAULT 'draft',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- =====================================================
-- ECOMMERCE APPLICATION
-- =====================================================

CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  price decimal(10, 2) NOT NULL,
  stock integer DEFAULT 0,
  category text,
  images text[],
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  order_number text NOT NULL UNIQUE,
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  total_amount decimal(10, 2) NOT NULL,
  status text DEFAULT 'pending',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- =====================================================
-- ENABLE RLS
-- =====================================================

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kanban_boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kanban_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kanban_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Conversation Participants
CREATE POLICY "Users can view conversation participants" ON public.conversation_participants
FOR SELECT USING (
  user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()) OR
  conversation_id IN (
    SELECT conversation_id FROM public.conversation_participants 
    WHERE user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
  )
);

CREATE POLICY "Users can add participants" ON public.conversation_participants
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Conversations: Users can access conversations they're a participant in
CREATE POLICY "Users can view their conversations" ON public.conversations
FOR SELECT USING (
  id IN (
    SELECT conversation_id FROM public.conversation_participants 
    WHERE user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
  )
);

CREATE POLICY "Users can create conversations" ON public.conversations
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Messages: Users can view messages in conversations they're part of
CREATE POLICY "Users can view messages in their conversations" ON public.messages
FOR SELECT USING (
  conversation_id IN (
    SELECT conversation_id FROM public.conversation_participants 
    WHERE user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
  )
);

CREATE POLICY "Users can send messages" ON public.messages
FOR INSERT WITH CHECK (
  sender_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()) AND
  conversation_id IN (
    SELECT conversation_id FROM public.conversation_participants 
    WHERE user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
  )
);

-- Notes
CREATE POLICY "Users can CRUD their own notes" ON public.notes
FOR ALL USING (user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));

-- Kanban
CREATE POLICY "Users can CRUD their own boards" ON public.kanban_boards
FOR ALL USING (user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can CRUD columns in their boards" ON public.kanban_columns
FOR ALL USING (
  board_id IN (
    SELECT id FROM public.kanban_boards 
    WHERE user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
  )
);

CREATE POLICY "Users can CRUD cards in their boards" ON public.kanban_cards
FOR ALL USING (
  column_id IN (
    SELECT id FROM public.kanban_columns WHERE board_id IN (
      SELECT id FROM public.kanban_boards 
      WHERE user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
    )
  )
);

-- Other tables: Users own their data
CREATE POLICY "Users can CRUD their own emails" ON public.emails
FOR ALL USING (sender_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can CRUD their own calendar events" ON public.calendar_events
FOR ALL USING (user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can CRUD their own invoices" ON public.invoices
FOR ALL USING (user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can CRUD their own contacts" ON public.contacts
FOR ALL USING (user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can CRUD their own tickets" ON public.tickets
FOR ALL USING (user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can CRUD their own blog posts" ON public.blog_posts
FOR ALL USING (user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can CRUD their own products" ON public.products
FOR ALL USING (user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can CRUD their own orders" ON public.orders
FOR ALL USING (user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON public.conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_emails_sender_id ON public.emails(sender_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_id ON public.calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_time ON public.calendar_events(start_time);
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON public.notes(user_id);
CREATE INDEX IF NOT EXISTS idx_kanban_boards_user_id ON public.kanban_boards(user_id);
CREATE INDEX IF NOT EXISTS idx_kanban_columns_board_id ON public.kanban_columns(board_id);
CREATE INDEX IF NOT EXISTS idx_kanban_cards_column_id ON public.kanban_cards(column_id);
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON public.invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON public.contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON public.tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_user_id ON public.blog_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON public.blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_products_user_id ON public.products(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);

