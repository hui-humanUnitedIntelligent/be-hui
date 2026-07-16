-- ═══════════════════════════════════════════════════════════════════════
-- HUI — Migration 060: Aktivierung des Resonanz-/Reaktions-Systems
--
-- BEFUND (per Live-Schema-Introspektion via Supabase REST bewiesen, nicht
-- vermutet -- 2026-07-08):
--   post_reactions, saved_posts und die RPC reaction_counts() sind zwar
--   seit Migration 038 (sql/038_feature_activation.sql) im Frontend fest
--   verdrahtet (useReactions.jsx, BaseFeedCard.jsx), existieren aber NICHT
--   in der produktiven Datenbank -- Migration 038 wurde nie ausgefuehrt.
--   Alle Reaktionen (Resonanz/Austauschen/Merken) im Feed schlagen daher
--   aktuell still fehl (try/catch verschluckt den Fehler).
--
--   Reale, tatsaechlich vorhandene Legacy-Daten: work_likes (3 Zeilen),
--   work_saves (3 Zeilen) -- fuer Werk-Resonanz auf der Detailseite.
--   Der Schreibpfad dort ist zusaetzlich durch einen separaten Bug kaputt
--   (toggleLikeWork/toggleSaveWork existieren nicht in AppStateContext).
--
-- FIX: 1) post_reactions/saved_posts/reaction_counts() nachtraeglich
--         anlegen (identisch zu 038, rein additiv, idempotent).
--      2) Legacy-Daten aus work_likes/work_saves nach post_reactions
--         uebernehmen (type=inspire bzw. save, post_type=work) --
--         keine Daten verlieren, ein einziges System danach.
--      3) Realtime fuer post_reactions aktivieren (Publication).
-- ═══════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. post_reactions ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.post_reactions (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id     uuid        NOT NULL,
  post_type   text        NOT NULL DEFAULT 'post',
  user_id     uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type        text        NOT NULL DEFAULT 'like',
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT  unique_post_reaction UNIQUE (post_id, user_id, type)
);
CREATE INDEX IF NOT EXISTS idx_post_reactions_post ON public.post_reactions (post_id, type);
CREATE INDEX IF NOT EXISTS idx_post_reactions_user ON public.post_reactions (user_id, created_at DESC);
ALTER TABLE public.post_reactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS pr_read  ON public.post_reactions;
DROP POLICY IF EXISTS pr_write ON public.post_reactions;
CREATE POLICY pr_read  ON public.post_reactions FOR SELECT USING (true);
CREATE POLICY pr_write ON public.post_reactions FOR ALL    USING (auth.uid() = user_id);

-- ── 2. saved_posts ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.saved_posts (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  post_id     uuid        NOT NULL,
  post_type   text        NOT NULL DEFAULT 'post',
  post_data   jsonb       NOT NULL DEFAULT '{}',
  saved_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT  unique_saved UNIQUE (user_id, post_id)
);
CREATE INDEX IF NOT EXISTS idx_saved_user ON public.saved_posts (user_id, saved_at DESC);
CREATE INDEX IF NOT EXISTS idx_saved_post ON public.saved_posts (post_id);
ALTER TABLE public.saved_posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS sp_read  ON public.saved_posts;
DROP POLICY IF EXISTS sp_write ON public.saved_posts;
CREATE POLICY sp_read  ON public.saved_posts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY sp_write ON public.saved_posts FOR ALL    USING (auth.uid() = user_id);

-- ── 3. notifications — Ergaenzungsspalten (falls noch fehlend) ───────
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS sender_id   uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS entity_id   uuid,
  ADD COLUMN IF NOT EXISTS entity_type text,
  ADD COLUMN IF NOT EXISTS action_url  text,
  ADD COLUMN IF NOT EXISTS icon        text;

CREATE INDEX IF NOT EXISTS idx_notif_unread
  ON public.notifications (user_id, created_at DESC) WHERE read = false;

-- ── 4. reaction_counts() ──────────────────────────────────────
CREATE OR REPLACE FUNCTION public.reaction_counts(p_post_id uuid)
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT jsonb_build_object(
    'like',    COUNT(*) FILTER (WHERE type = 'like'),
    'inspire', COUNT(*) FILTER (WHERE type = 'inspire'),
    'save',    COUNT(*) FILTER (WHERE type = 'save'),
    'total',   COUNT(*)
  )
  FROM public.post_reactions WHERE post_id = p_post_id;
$$;
GRANT EXECUTE ON FUNCTION public.reaction_counts(uuid) TO authenticated, anon;

-- ── 5. get_unread_notif_count() ───────────────────────────────
CREATE OR REPLACE FUNCTION public.get_unread_notif_count(p_user_id uuid)
RETURNS int
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT COUNT(*)::int FROM public.notifications
  WHERE user_id = p_user_id AND read = false;
$$;
GRANT EXECUTE ON FUNCTION public.get_unread_notif_count(uuid) TO authenticated;

-- ── 6. Legacy-Daten uebernehmen: work_likes -> post_reactions(inspire) ──
INSERT INTO public.post_reactions (post_id, post_type, user_id, type, created_at)
SELECT wl.work_id, 'work', wl.user_id, 'inspire', wl.created_at
FROM public.work_likes wl
WHERE wl.work_id IS NOT NULL AND wl.user_id IS NOT NULL
ON CONFLICT (post_id, user_id, type) DO NOTHING;

-- ── 7. Legacy-Daten uebernehmen: work_saves -> post_reactions(save) ─────
INSERT INTO public.post_reactions (post_id, post_type, user_id, type, created_at)
SELECT ws.work_id, 'work', ws.user_id, 'save', ws.created_at
FROM public.work_saves ws
WHERE ws.work_id IS NOT NULL AND ws.user_id IS NOT NULL
ON CONFLICT (post_id, user_id, type) DO NOTHING;

-- ── 8. Realtime aktivieren (innerhalb der Transaktion -- der Trigger-
--    Workflow schneidet alles nach der ersten COMMIT;-Zeile ab) ─────────
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.post_reactions;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

COMMIT;
