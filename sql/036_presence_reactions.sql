-- ═══════════════════════════════════════════════════════════════
-- HUI — Migration 036: Presence + Story Reactions
-- Phase 3D — Identity & Presence Layer
-- ═══════════════════════════════════════════════════════════════

BEGIN;

-- ── user_presence ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_presence (
  user_id       uuid        PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  status        text        NOT NULL DEFAULT 'offline'
                              CHECK (status IN ('online','away','offline')),
  last_seen_at  timestamptz NOT NULL DEFAULT now(),
  current_page  text,
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_presence_status
  ON public.user_presence (status, last_seen_at DESC);

-- RLS
ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS presence_read   ON public.user_presence;
DROP POLICY IF EXISTS presence_write  ON public.user_presence;

CREATE POLICY presence_read ON public.user_presence
  FOR SELECT USING (true);  -- anyone can read presence

CREATE POLICY presence_write ON public.user_presence
  FOR ALL USING (auth.uid() = user_id);

-- ── story_reactions ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.story_reactions (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id    uuid        NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  user_id     uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  emoji       text        NOT NULL CHECK (emoji IN ('❤️','🔥','🙌','✨','🫶')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT  unique_story_reaction UNIQUE (story_id, user_id, emoji)
);

CREATE INDEX IF NOT EXISTS idx_story_reactions_story
  ON public.story_reactions (story_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_story_reactions_user
  ON public.story_reactions (user_id, created_at DESC);

ALTER TABLE public.story_reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS story_rxn_read   ON public.story_reactions;
DROP POLICY IF EXISTS story_rxn_write  ON public.story_reactions;

CREATE POLICY story_rxn_read ON public.story_reactions
  FOR SELECT USING (true);

CREATE POLICY story_rxn_write ON public.story_reactions
  FOR ALL USING (auth.uid() = user_id);

COMMIT;
