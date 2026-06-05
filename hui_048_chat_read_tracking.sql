-- ═══════════════════════════════════════════════════════════════════
-- HUI Migration 048 — Chat Read Tracking
-- Minimale Ergänzung: chat_participants(chat_id, user_id, last_read_at)
-- Single Source of Truth für unread_count
-- ═══════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Tabelle ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.chat_participants (
  chat_id      uuid        NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  user_id      uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  last_read_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (chat_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_chat_participants_user
  ON public.chat_participants (user_id, last_read_at DESC);

CREATE INDEX IF NOT EXISTS idx_chat_participants_chat
  ON public.chat_participants (chat_id);

-- ── 2. RLS ────────────────────────────────────────────────────────
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;

-- Eigene Zeile lesen
DROP POLICY IF EXISTS "cp_select_own" ON public.chat_participants;
CREATE POLICY "cp_select_own" ON public.chat_participants
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Eigene Zeile schreiben (UPSERT beim Öffnen eines Chats)
DROP POLICY IF EXISTS "cp_insert_own" ON public.chat_participants;
CREATE POLICY "cp_insert_own" ON public.chat_participants
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "cp_update_own" ON public.chat_participants;
CREATE POLICY "cp_update_own" ON public.chat_participants
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- ── 3. RPC: unread_count pro Chat für den eingeloggten User ───────
-- Wird in useChatList genutzt: für jeden Chat unread zählen
CREATE OR REPLACE FUNCTION public.get_unread_count(p_chat_id uuid, p_user_id uuid)
RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT count(*)::integer
  FROM public.messages m
  WHERE m.chat_id   = p_chat_id
    AND m.sender_id != p_user_id
    AND m.created_at > COALESCE(
      (SELECT cp.last_read_at FROM public.chat_participants cp
       WHERE cp.chat_id = p_chat_id AND cp.user_id = p_user_id),
      '1970-01-01'::timestamptz
    );
$$;

-- ── 4. RPC: mark_chat_read — setzt last_read_at auf now() ─────────
CREATE OR REPLACE FUNCTION public.mark_chat_read(p_chat_id uuid, p_user_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER AS $$
  INSERT INTO public.chat_participants (chat_id, user_id, last_read_at)
  VALUES (p_chat_id, p_user_id, now())
  ON CONFLICT (chat_id, user_id) DO UPDATE
    SET last_read_at = now();
$$;

COMMIT;

-- ═══════════════════════════════════════════════════════════════════
-- VALIDIERUNG:
-- SELECT * FROM chat_participants LIMIT 5;
-- SELECT get_unread_count('472b0c99-caa9-4fa4-9122-cc7db1cc4b9f', '<user-id>');
-- SELECT mark_chat_read('472b0c99-caa9-4fa4-9122-cc7db1cc4b9f', '<user-id>');
-- ═══════════════════════════════════════════════════════════════════
