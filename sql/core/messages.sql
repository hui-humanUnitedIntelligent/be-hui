-- ════════════════════════════════════════════════
-- HUI CORE: messages
-- WICHTIG: chat_id muss uuid sein (nicht text)
-- ════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.messages (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id    uuid REFERENCES public.chats(id) ON DELETE CASCADE,
  sender_id  uuid REFERENCES auth.users(id)   ON DELETE CASCADE,
  text       text,
  read       boolean     DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS receiver_id  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS image_url    text,
  ADD COLUMN IF NOT EXISTS message_type text DEFAULT 'text';

CREATE INDEX IF NOT EXISTS idx_msg_chat_id   ON public.messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_msg_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_msg_created   ON public.messages(created_at DESC);

NOTIFY pgrst, 'reload schema';
