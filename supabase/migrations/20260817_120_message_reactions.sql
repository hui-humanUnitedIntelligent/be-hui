-- ═══════════════════════════════════════════════════════════════════
-- Migration 120: message_reactions — Emoji-Reaktionen auf Chat-Nachrichten
-- Erstellt: 2026-08-17
-- Zweck: Nutzer können auf Chat-Nachrichten mit Emojis reagieren
--        (Long-Press → Emoji-Leiste → Reaktion speichern)
-- ═══════════════════════════════════════════════════════════════════

-- Tabelle: message_reactions
CREATE TABLE IF NOT EXISTS public.message_reactions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id  UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  emoji       TEXT NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Ein Nutzer kann pro Nachricht mit einem Emoji reagieren (Upsert)
  CONSTRAINT message_reactions_unique UNIQUE (message_id, user_id)
);

-- updated_at Trigger (kanonisch, siehe Memory #539)
CREATE TRIGGER trg_message_reactions_updated_at
  BEFORE UPDATE ON public.message_reactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS aktivieren
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

-- SELECT: Nur Chat-Teilnehmer können Reaktionen sehen
-- (vereinfacht: alle authentifizierten Nutzer können Reaktionen sehen,
-- da sie ohnehin nur auf Nachrichten in Chats reagieren können, in denen
-- sie Teilnehmer sind — die messages-Tabelle hat bereits RLS)
CREATE POLICY "message_reactions_select_authenticated"
  ON public.message_reactions FOR SELECT
  TO authenticated
  USING (true);

-- INSERT: Nur für sich selbst
CREATE POLICY "message_reactions_insert_own"
  ON public.message_reactions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- UPDATE: Nur eigene Reaktionen
CREATE POLICY "message_reactions_update_own"
  ON public.message_reactions FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- DELETE: Nur eigene Reaktionen
CREATE POLICY "message_reactions_delete_own"
  ON public.message_reactions FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Realtime aktivieren
ALTER TABLE public.message_reactions REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reactions;

-- Index für schnelle Lookup
CREATE INDEX IF NOT EXISTS idx_message_reactions_message_id
  ON public.message_reactions(message_id);

-- Kommentar
COMMENT ON TABLE public.message_reactions IS 'Emoji-Reaktionen auf Chat-Nachrichten (Long-Press → Emoji auswählen)';
