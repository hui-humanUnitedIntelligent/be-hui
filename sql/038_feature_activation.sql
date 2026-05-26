-- ═══════════════════════════════════════════════════════════════
-- HUI — Migration 038: Feature Activation & Completion
-- Phase 4B — All idempotent
-- ═══════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. post_reactions ────────────────────────────────────────
-- Unified reactions for all feed items (posts, works, experiences, invitations)
CREATE TABLE IF NOT EXISTS public.post_reactions (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id     uuid        NOT NULL,   -- feed item id
  post_type   text        NOT NULL DEFAULT 'post',  -- post|work|experience|invitation
  user_id     uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type        text        NOT NULL DEFAULT 'like',  -- like|inspire|save
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
  post_data   jsonb       NOT NULL DEFAULT '{}',  -- snapshot for offline display
  saved_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT  unique_saved UNIQUE (user_id, post_id)
);
CREATE INDEX IF NOT EXISTS idx_saved_user   ON public.saved_posts (user_id, saved_at DESC);
CREATE INDEX IF NOT EXISTS idx_saved_post   ON public.saved_posts (post_id);
ALTER TABLE public.saved_posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS sp_read  ON public.saved_posts;
DROP POLICY IF EXISTS sp_write ON public.saved_posts;
CREATE POLICY sp_read  ON public.saved_posts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY sp_write ON public.saved_posts FOR ALL    USING (auth.uid() = user_id);

-- ── 3. notifications — upgrade existing table ────────────────
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS sender_id   uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS entity_id   uuid,
  ADD COLUMN IF NOT EXISTS entity_type text,
  ADD COLUMN IF NOT EXISTS action_url  text,
  ADD COLUMN IF NOT EXISTS icon        text;

CREATE INDEX IF NOT EXISTS idx_notif_unread
  ON public.notifications (user_id, created_at DESC)
  WHERE read = false;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS notif_read  ON public.notifications;
DROP POLICY IF EXISTS notif_write ON public.notifications;
CREATE POLICY notif_read  ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY notif_write ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
-- insert allowed via service role (createNotification uses service key)
DROP POLICY IF EXISTS notif_insert ON public.notifications;
CREATE POLICY notif_insert ON public.notifications FOR INSERT WITH CHECK (true);

-- ── 4. reaction_counts() — fast aggregate ────────────────────
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

-- ── 5. get_unread_count() — for badge ────────────────────────
CREATE OR REPLACE FUNCTION public.get_unread_notif_count(p_user_id uuid)
RETURNS int
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT COUNT(*)::int FROM public.notifications
  WHERE user_id = p_user_id AND read = false;
$$;
GRANT EXECUTE ON FUNCTION public.get_unread_notif_count(uuid) TO authenticated;

COMMIT;
