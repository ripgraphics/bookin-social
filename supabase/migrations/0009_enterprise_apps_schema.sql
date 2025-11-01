-- =====================================================
-- ENTERPRISE APPLICATIONS DATABASE SCHEMA
-- =====================================================
-- This migration creates tables for all 11 enterprise applications:
-- 1. Chat
-- 2. Email
-- 3. Calendar
-- 4. Notes
-- 5. Kanban
-- 6. Invoice
-- 7. Contacts
-- 8. Tickets
-- 9. Blog
-- 10. eCommerce
-- 11. User Profile
-- =====================================================

-- =====================================================
-- 1. CHAT APPLICATION
-- =====================================================

-- Conversations table
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  type TEXT NOT NULL DEFAULT 'direct', -- 'direct' or 'group'
  created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Conversation participants
CREATE TABLE IF NOT EXISTS public.conversation_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  left_at TIMESTAMP WITH TIME ZONE,
  last_read_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(conversation_id, user_id)
);

-- Messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text', -- 'text', 'image', 'file', 'system'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Message attachments
CREATE TABLE IF NOT EXISTS public.message_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT,
  file_size BIGINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- =====================================================
-- 2. EMAIL APPLICATION
-- =====================================================

-- Emails table
CREATE TABLE IF NOT EXISTS public.emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  from_email TEXT NOT NULL,
  sender_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  folder TEXT DEFAULT 'inbox', -- 'inbox', 'sent', 'drafts', 'trash'
  is_read BOOLEAN DEFAULT FALSE,
  is_starred BOOLEAN DEFAULT FALSE,
  is_important BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Email recipients
CREATE TABLE IF NOT EXISTS public.email_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_id UUID NOT NULL REFERENCES public.emails(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  recipient_type TEXT NOT NULL, -- 'to', 'cc', 'bcc'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Email attachments
CREATE TABLE IF NOT EXISTS public.email_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_id UUID NOT NULL REFERENCES public.emails(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT,
  file_size BIGINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Email labels
CREATE TABLE IF NOT EXISTS public.email_labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(user_id, name)
);

-- Email label relationships
CREATE TABLE IF NOT EXISTS public.email_label_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_id UUID NOT NULL REFERENCES public.emails(id) ON DELETE CASCADE,
  label_id UUID NOT NULL REFERENCES public.email_labels(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(email_id, label_id)
);

-- =====================================================
-- 3. CALENDAR APPLICATION
-- =====================================================

-- Calendar events
CREATE TABLE IF NOT EXISTS public.calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  is_all_day BOOLEAN DEFAULT FALSE,
  location TEXT,
  color TEXT,
  category TEXT,
  recurrence_rule TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Event attendees
CREATE TABLE IF NOT EXISTS public.event_attendees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.calendar_events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending', -- 'pending', 'accepted', 'declined'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(event_id, user_id)
);

-- Event reminders
CREATE TABLE IF NOT EXISTS public.event_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.calendar_events(id) ON DELETE CASCADE,
  reminder_time TIMESTAMP WITH TIME ZONE NOT NULL,
  reminder_type TEXT DEFAULT 'notification', -- 'notification', 'email'
  is_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- =====================================================
-- 4. NOTES APPLICATION
-- =====================================================

-- Notes
CREATE TABLE IF NOT EXISTS public.notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  folder_id UUID REFERENCES public.note_folders(id) ON DELETE SET NULL,
  is_pinned BOOLEAN DEFAULT FALSE,
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Note folders
CREATE TABLE IF NOT EXISTS public.note_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  parent_id UUID REFERENCES public.note_folders(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(user_id, parent_id, name)
);

-- Note tags
CREATE TABLE IF NOT EXISTS public.note_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(user_id, name)
);

-- Note tag relationships
CREATE TABLE IF NOT EXISTS public.note_tag_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.note_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(note_id, tag_id)
);

-- Note shares
CREATE TABLE IF NOT EXISTS public.note_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
  shared_with_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  permission TEXT DEFAULT 'view', -- 'view', 'edit'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(note_id, shared_with_user_id)
);

-- =====================================================
-- 5. KANBAN APPLICATION
-- =====================================================

-- Kanban boards
CREATE TABLE IF NOT EXISTS public.kanban_boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  background_color TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Kanban columns
CREATE TABLE IF NOT EXISTS public.kanban_columns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES public.kanban_boards(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  position INTEGER NOT NULL,
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Kanban cards
CREATE TABLE IF NOT EXISTS public.kanban_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  column_id UUID NOT NULL REFERENCES public.kanban_columns(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  position INTEGER NOT NULL,
  due_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Card labels
CREATE TABLE IF NOT EXISTS public.kanban_card_labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES public.kanban_boards(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(board_id, name)
);

-- Card label assignments
CREATE TABLE IF NOT EXISTS public.kanban_card_label_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID NOT NULL REFERENCES public.kanban_cards(id) ON DELETE CASCADE,
  label_id UUID NOT NULL REFERENCES public.kanban_card_labels(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(card_id, label_id)
);

-- Card assignees
CREATE TABLE IF NOT EXISTS public.kanban_card_assignees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID NOT NULL REFERENCES public.kanban_cards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(card_id, user_id)
);

-- Card comments
CREATE TABLE IF NOT EXISTS public.kanban_card_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID NOT NULL REFERENCES public.kanban_cards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Card attachments
CREATE TABLE IF NOT EXISTS public.kanban_card_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID NOT NULL REFERENCES public.kanban_cards(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT,
  file_size BIGINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- =====================================================
-- 6. INVOICE APPLICATION
-- =====================================================

-- Customers
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state_province TEXT,
  postal_code TEXT,
  country TEXT,
  tax_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Invoices
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  invoice_number TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'draft', -- 'draft', 'sent', 'paid', 'overdue', 'cancelled'
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  tax_rate DECIMAL(5, 2) DEFAULT 0,
  tax_amount DECIMAL(10, 2) DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Invoice items
CREATE TABLE IF NOT EXISTS public.invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  total DECIMAL(10, 2) NOT NULL,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Invoice payments
CREATE TABLE IF NOT EXISTS public.invoice_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  payment_date DATE NOT NULL,
  payment_method TEXT NOT NULL,
  reference_number TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- =====================================================
-- 7. CONTACTS APPLICATION
-- =====================================================

-- Contacts
CREATE TABLE IF NOT EXISTS public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  mobile TEXT,
  company TEXT,
  job_title TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state_province TEXT,
  postal_code TEXT,
  country TEXT,
  website TEXT,
  notes TEXT,
  avatar_url TEXT,
  tags TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Contact groups
CREATE TABLE IF NOT EXISTS public.contact_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(user_id, name)
);

-- Contact group members
CREATE TABLE IF NOT EXISTS public.contact_group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.contact_groups(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(group_id, contact_id)
);

-- =====================================================
-- 8. TICKETS/SUPPORT APPLICATION
-- =====================================================

-- Ticket categories
CREATE TABLE IF NOT EXISTS public.ticket_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Tickets
CREATE TABLE IF NOT EXISTS public.tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.ticket_categories(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT DEFAULT 'open', -- 'open', 'in_progress', 'resolved', 'closed'
  priority TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
  sla_deadline TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Ticket comments
CREATE TABLE IF NOT EXISTS public.ticket_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW')
);

-- Ticket attachments
CREATE TABLE IF NOT EXISTS public.ticket_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES public.ticket_comments(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT,
  file_size BIGINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- =====================================================
-- 9. BLOG APPLICATION
-- =====================================================

-- Blog categories
CREATE TABLE IF NOT EXISTS public.blog_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Blog tags
CREATE TABLE IF NOT EXISTS public.blog_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Blog posts
CREATE TABLE IF NOT EXISTS public.blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.blog_categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT NOT NULL,
  featured_image_url TEXT,
  meta_title TEXT,
  meta_description TEXT,
  status TEXT DEFAULT 'draft', -- 'draft', 'published', 'archived'
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Post tags relationship
CREATE TABLE IF NOT EXISTS public.blog_post_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.blog_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(post_id, tag_id)
);

-- Blog comments
CREATE TABLE IF NOT EXISTS public.blog_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  author_name TEXT,
  author_email TEXT,
  content TEXT NOT NULL,
  is_approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- =====================================================
-- 10. ECOMMERCE APPLICATION
-- =====================================================

-- Product categories
CREATE TABLE IF NOT EXISTS public.product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  parent_id UUID REFERENCES public.product_categories(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Products
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.product_categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  sku TEXT UNIQUE,
  price DECIMAL(10, 2) NOT NULL,
  compare_price DECIMAL(10, 2),
  cost_price DECIMAL(10, 2),
  track_inventory BOOLEAN DEFAULT TRUE,
  inventory_quantity INTEGER DEFAULT 0,
  status TEXT DEFAULT 'draft', -- 'draft', 'active', 'inactive'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Product images
CREATE TABLE IF NOT EXISTS public.product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  alt_text TEXT,
  is_primary BOOLEAN DEFAULT FALSE,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Product variants
CREATE TABLE IF NOT EXISTS public.product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- e.g., 'Red', 'Large'
  sku TEXT UNIQUE,
  price DECIMAL(10, 2),
  inventory_quantity INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Orders
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  order_number TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'shipped', 'delivered', 'cancelled'
  payment_status TEXT DEFAULT 'unpaid', -- 'unpaid', 'paid', 'refunded'
  subtotal DECIMAL(10, 2) NOT NULL,
  tax_amount DECIMAL(10, 2) DEFAULT 0,
  shipping_amount DECIMAL(10, 2) DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL,
  shipping_address TEXT,
  billing_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Order items
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  total DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- =====================================================
-- 11. USER PROFILE & SETTINGS
-- =====================================================

-- User settings
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  theme TEXT DEFAULT 'light', -- 'light', 'dark', 'auto'
  language TEXT DEFAULT 'en',
  timezone TEXT DEFAULT 'UTC',
  email_notifications BOOLEAN DEFAULT TRUE,
  push_notifications BOOLEAN DEFAULT TRUE,
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- User activity log
CREATE TABLE IF NOT EXISTS public.user_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Note: Apply indexes after tables exist

-- Chat indexes
-- CREATE INDEX IF NOT EXISTS idx_conversations_type ON public.conversations(type);
-- CREATE INDEX IF NOT EXISTS idx_conversation_participants_user ON public.conversation_participants(user_id);
-- CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id);
-- CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);

-- Email indexes
-- CREATE INDEX IF NOT EXISTS idx_emails_folder ON public.emails(folder);
-- CREATE INDEX IF NOT EXISTS idx_emails_sender ON public.emails(sender_id);
-- CREATE INDEX IF NOT EXISTS idx_email_recipients_email ON public.email_recipients(email_id);

-- Calendar indexes
-- CREATE INDEX IF NOT EXISTS idx_calendar_events_user ON public.calendar_events(user_id);
-- CREATE INDEX IF NOT EXISTS idx_calendar_events_start ON public.calendar_events(start_time);

-- Notes indexes
-- CREATE INDEX IF NOT EXISTS idx_notes_user ON public.notes(user_id);
-- CREATE INDEX IF NOT EXISTS idx_notes_folder ON public.notes(folder_id);

-- Kanban indexes
-- CREATE INDEX IF NOT EXISTS idx_kanban_cards_column ON public.kanban_cards(column_id);

-- Invoice indexes
-- CREATE INDEX IF NOT EXISTS idx_invoices_user ON public.invoices(user_id);
-- CREATE INDEX IF NOT EXISTS idx_invoices_customer ON public.invoices(customer_id);
-- CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);

-- Contacts indexes
-- CREATE INDEX IF NOT EXISTS idx_contacts_user ON public.contacts(user_id);

-- Tickets indexes
-- CREATE INDEX IF NOT EXISTS idx_tickets_user ON public.tickets(user_id);
-- CREATE INDEX IF NOT EXISTS idx_tickets_status ON public.tickets(status);
-- CREATE INDEX IF NOT EXISTS idx_tickets_priority ON public.tickets(priority);

-- Blog indexes
-- CREATE INDEX IF NOT EXISTS idx_blog_posts_user ON public.blog_posts(user_id);
-- CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON public.blog_posts(status);

-- Products indexes
-- CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
-- CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);

-- Orders indexes
-- CREATE INDEX IF NOT EXISTS idx_orders_customer ON public.orders(customer_id);
-- CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);

-- =====================================================
-- ENABLE RLS ON ALL TABLES
-- =====================================================

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_label_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.note_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.note_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.note_tag_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.note_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kanban_boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kanban_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kanban_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kanban_card_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kanban_card_label_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kanban_card_assignees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kanban_card_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kanban_card_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_post_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity_log ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- BASIC RLS POLICIES (Users can only access their own data)
-- =====================================================

-- Conversations: Users can access conversations they're part of
CREATE POLICY "Users can view conversations they participate in" ON public.conversations
FOR SELECT USING (
  id IN (SELECT conversation_id FROM public.conversation_participants WHERE user_id = auth.uid())
);

-- Messages: Users can view messages in conversations they're part of
CREATE POLICY "Users can view messages in their conversations" ON public.messages
FOR SELECT USING (
  conversation_id IN (
    SELECT conversation_id FROM public.conversation_participants WHERE user_id = auth.uid()
  )
);

-- Calendar events: Users can access their own events
CREATE POLICY "Users can manage their own calendar events" ON public.calendar_events
FOR ALL USING (user_id = auth.uid());

-- Notes: Users can access their own notes
CREATE POLICY "Users can manage their own notes" ON public.notes
FOR ALL USING (user_id = auth.uid());

-- Kanban: Users can access their own boards
CREATE POLICY "Users can manage their own kanban boards" ON public.kanban_boards
FOR ALL USING (user_id = auth.uid());

-- Contacts: Users can access their own contacts
CREATE POLICY "Users can manage their own contacts" ON public.contacts
FOR ALL USING (user_id = auth.uid());

-- Tickets: Users can access their own tickets
CREATE POLICY "Users can manage their own tickets" ON public.tickets
FOR ALL USING (user_id = auth.uid());

-- Blog posts: Users can access their own posts, everyone can view published posts
CREATE POLICY "Users can manage their own blog posts" ON public.blog_posts
FOR ALL USING (user_id = auth.uid() OR status = 'published');

-- Products: Everyone can view active products
CREATE POLICY "Everyone can view active products" ON public.products
FOR SELECT USING (status = 'active');

-- Orders: Users can access their own orders (if customer_id links to users)
-- Note: This requires customers table to have user_id field

-- Add similar policies for other tables following the same pattern...
-- Note: This is a simplified RLS setup. In production, you'd want more granular policies.

