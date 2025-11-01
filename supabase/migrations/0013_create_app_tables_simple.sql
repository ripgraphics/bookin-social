-- =====================================================
-- CREATE TABLES ONLY (NO RLS FOR NOW)
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

-- DISABLE RLS FOR NOW (will add policies later)
ALTER TABLE public.conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.emails DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_recipients DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_attachments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_attendees DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.kanban_boards DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.kanban_columns DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.kanban_cards DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;

-- INDEXES
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
