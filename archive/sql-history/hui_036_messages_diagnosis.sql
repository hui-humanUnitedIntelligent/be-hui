-- ════════════════════════════════════════════════════════════════
-- HUI Migration 036 — Messages Pipeline Diagnose + Repair
-- SICHER: nur ADD COLUMN IF NOT EXISTS, keine DROPs
-- ZWECK: sicherstellen dass alle Insert-Felder existieren
-- ════════════════════════════════════════════════════════════════

-- ── 1. messages-Tabelle: alle benötigten Spalten sichern ─────────
-- Frontend INSERT verwendet: chat_id, sender_id, text, msg_type,
-- media_url, media_type, media_meta, context_ref, created_at, read

ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS text         text,
  ADD COLUMN IF NOT EXISTS msg_type     text DEFAULT 'text',
  ADD COLUMN IF NOT EXISTS media_url    text,
  ADD COLUMN IF NOT EXISTS media_type   text,
  ADD COLUMN IF NOT EXISTS media_meta   jsonb,
  ADD COLUMN IF NOT EXISTS context_ref  jsonb,
  ADD COLUMN IF NOT EXISTS read         boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_deleted   boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS reply_to     uuid,
  ADD COLUMN IF NOT EXISTS reactions    jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS updated_at   timestamptz DEFAULT now();

-- ── 2. chats: last_message_at + unread updaten nach INSERT ───────
-- Trigger: chats.last_message + unread_a/b auto-update
CREATE OR REPLACE FUNCTION public.after_message_insert()
RETURNS TRIGGER AS $$
DECLARE
  v_chat        record;
  v_is_a        boolean;
BEGIN
  -- Chat laden
  SELECT participant_a, participant_b
    INTO v_chat
    FROM public.chats
    WHERE id = NEW.chat_id;

  IF NOT FOUND THEN RETURN NEW; END IF;

  v_is_a := (v_chat.participant_a = NEW.sender_id);

  -- last_message + last_message_at aktualisieren
  UPDATE public.chats SET
    last_message     = left(NEW.text, 100),
    last_message_at  = NEW.created_at,
    last_message_type = NEW.msg_type,
    -- unread für Empfänger erhöhen
    unread_a = CASE WHEN NOT v_is_a THEN COALESCE(unread_a, 0) + 1 ELSE unread_a END,
    unread_b = CASE WHEN     v_is_a THEN COALESCE(unread_b, 0) + 1 ELSE unread_b END,
    updated_at = now()
  WHERE id = NEW.chat_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger droppen + neu anlegen (idempotent)
DROP TRIGGER IF EXISTS message_after_insert ON public.messages;
CREATE TRIGGER message_after_insert
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.after_message_insert();

-- ── 3. RLS sicherstellen ──────────────────────────────────────────
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- READ: nur eigene Chats
DROP POLICY IF EXISTS messages_read ON public.messages;
CREATE POLICY messages_read ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.chats c
      WHERE c.id = messages.chat_id
        AND (c.participant_a = auth.uid() OR c.participant_b = auth.uid())
    )
  );

-- INSERT: nur eigene Nachrichten in eigenen Chats
DROP POLICY IF EXISTS messages_insert ON public.messages;
CREATE POLICY messages_insert ON public.messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.chats c
      WHERE c.id = messages.chat_id
        AND (c.participant_a = auth.uid() OR c.participant_b = auth.uid())
    )
  );

-- UPDATE: nur eigene Nachrichten (read-status)
DROP POLICY IF EXISTS messages_update ON public.messages;
CREATE POLICY messages_update ON public.messages FOR UPDATE
  USING (auth.uid() = sender_id)
  WITH CHECK (auth.uid() = sender_id);

-- ── 4. Indizes ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_messages_chat_id
  ON public.messages (chat_id, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id
  ON public.messages (sender_id);

-- ── 5. Diagnose: aktuelle Spalten anzeigen ───────────────────────
DO $$
DECLARE
  r record;
BEGIN
  RAISE NOTICE '── messages Tabelle Spalten ──';
  FOR r IN
    SELECT column_name, data_type, column_default, is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'messages'
    ORDER BY ordinal_position
  LOOP
    RAISE NOTICE '  % | % | default: % | nullable: %',
      r.column_name, r.data_type, r.column_default, r.is_nullable;
  END LOOP;
END $$;

NOTIFY pgrst, 'reload schema';
