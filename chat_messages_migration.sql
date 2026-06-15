-- ============================================================
-- BorlaWura: Chat Messages Table Migration
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Create the chat_messages table
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id     uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  sender_id    uuid NOT NULL,           -- auth.users.id (user or rider)
  sender_type  text NOT NULL CHECK (sender_type IN ('user', 'rider')),
  message      text NOT NULL,
  is_read      boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- 2. Indexes for fast per-order queries
CREATE INDEX IF NOT EXISTS chat_messages_order_id_idx  ON public.chat_messages(order_id);
CREATE INDEX IF NOT EXISTS chat_messages_created_at_idx ON public.chat_messages(created_at ASC);

-- 3. Enable Row Level Security
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
-- Users can read messages for orders they own
DROP POLICY IF EXISTS "Users can read their order chat" ON public.chat_messages;
CREATE POLICY "Users can read their order chat"
  ON public.chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = chat_messages.order_id
        AND orders.user_id = auth.uid()
    )
  );

-- Users can insert their own messages
DROP POLICY IF EXISTS "Users can send messages" ON public.chat_messages;
CREATE POLICY "Users can send messages"
  ON public.chat_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND sender_type = 'user'
    AND EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = chat_messages.order_id
        AND orders.user_id = auth.uid()
    )
  );

-- 5. Enable real-time replication for the table
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
