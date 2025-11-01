-- =====================================================
-- FIX ACTUAL PERFORMANCE BOTTLENECKS (EVIDENCE-BASED)
-- =====================================================
-- Based on database performance analysis showing:
-- 1. role_permissions: 879 seq scans, 89,352 rows read
-- 2. user_roles missing index on user_id
-- 3. High planning time (4-6ms)
-- 4. Dead rows accumulating
-- =====================================================

-- 1. Add missing index on role_permissions.role_id
-- This table has 879 sequential scans reading 89K rows!
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id 
ON public.role_permissions(role_id);

-- 2. Add missing index on user_roles.user_id
-- Currently doing sequential scans to find user's roles
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id 
ON public.user_roles(user_id);

-- 3. Add missing indexes on critical foreign keys
-- user_activity_log is queried frequently
CREATE INDEX IF NOT EXISTS idx_user_activity_log_user_id 
ON public.user_activity_log(user_id);

-- notes table for notes app
CREATE INDEX IF NOT EXISTS idx_notes_user_id 
ON public.notes(user_id);

CREATE INDEX IF NOT EXISTS idx_notes_folder_id 
ON public.notes(folder_id);

-- messages for chat app
CREATE INDEX IF NOT EXISTS idx_messages_sender_id 
ON public.messages(sender_id);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id 
ON public.messages(conversation_id);

CREATE INDEX IF NOT EXISTS idx_message_attachments_message_id 
ON public.message_attachments(message_id);

-- conversations
CREATE INDEX IF NOT EXISTS idx_conversations_created_by 
ON public.conversations(created_by);

-- contacts
CREATE INDEX IF NOT EXISTS idx_contacts_user_id 
ON public.contacts(user_id);

-- calendar events
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_id 
ON public.calendar_events(user_id);

CREATE INDEX IF NOT EXISTS idx_event_reminders_event_id 
ON public.event_reminders(event_id);

-- blog
CREATE INDEX IF NOT EXISTS idx_blog_posts_user_id 
ON public.blog_posts(user_id);

CREATE INDEX IF NOT EXISTS idx_blog_posts_category_id 
ON public.blog_posts(category_id);

CREATE INDEX IF NOT EXISTS idx_blog_comments_post_id 
ON public.blog_comments(post_id);

CREATE INDEX IF NOT EXISTS idx_blog_comments_user_id 
ON public.blog_comments(user_id);

-- ecommerce
CREATE INDEX IF NOT EXISTS idx_products_category_id 
ON public.products(category_id);

CREATE INDEX IF NOT EXISTS idx_product_variants_product_id 
ON public.product_variants(product_id);

CREATE INDEX IF NOT EXISTS idx_product_images_product_id 
ON public.product_images(product_id);

CREATE INDEX IF NOT EXISTS idx_orders_customer_id 
ON public.orders(customer_id);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id 
ON public.order_items(order_id);

CREATE INDEX IF NOT EXISTS idx_order_items_product_id 
ON public.order_items(product_id);

-- invoices
CREATE INDEX IF NOT EXISTS idx_invoices_user_id 
ON public.invoices(user_id);

CREATE INDEX IF NOT EXISTS idx_invoices_customer_id 
ON public.invoices(customer_id);

CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id 
ON public.invoice_items(invoice_id);

CREATE INDEX IF NOT EXISTS idx_invoice_payments_invoice_id 
ON public.invoice_payments(invoice_id);

-- tickets
CREATE INDEX IF NOT EXISTS idx_tickets_user_id 
ON public.tickets(user_id);

CREATE INDEX IF NOT EXISTS idx_tickets_assigned_to 
ON public.tickets(assigned_to);

CREATE INDEX IF NOT EXISTS idx_tickets_category_id 
ON public.tickets(category_id);

CREATE INDEX IF NOT EXISTS idx_ticket_comments_ticket_id 
ON public.ticket_comments(ticket_id);

CREATE INDEX IF NOT EXISTS idx_ticket_comments_user_id 
ON public.ticket_comments(user_id);

-- kanban
CREATE INDEX IF NOT EXISTS idx_kanban_boards_user_id 
ON public.kanban_boards(user_id);

CREATE INDEX IF NOT EXISTS idx_kanban_columns_board_id 
ON public.kanban_columns(board_id);

CREATE INDEX IF NOT EXISTS idx_kanban_cards_column_id 
ON public.kanban_cards(column_id);

CREATE INDEX IF NOT EXISTS idx_kanban_card_comments_card_id 
ON public.kanban_card_comments(card_id);

CREATE INDEX IF NOT EXISTS idx_kanban_card_comments_user_id 
ON public.kanban_card_comments(user_id);

-- emails
CREATE INDEX IF NOT EXISTS idx_emails_sender_id 
ON public.emails(sender_id);

CREATE INDEX IF NOT EXISTS idx_email_recipients_email_id 
ON public.email_recipients(email_id);

CREATE INDEX IF NOT EXISTS idx_email_recipients_user_id 
ON public.email_recipients(user_id);

CREATE INDEX IF NOT EXISTS idx_email_attachments_email_id 
ON public.email_attachments(email_id);

-- customers
CREATE INDEX IF NOT EXISTS idx_customers_user_id 
ON public.customers(user_id);

-- 4. Update statistics (ANALYZE only, VACUUM must be run separately)
-- This will reduce planning time significantly
ANALYZE public.profiles;
ANALYZE public.listings;
ANALYZE public.user_posts;
ANALYZE public.conversations;
ANALYZE public.messages;
ANALYZE public.user_roles;
ANALYZE public.role_permissions;

