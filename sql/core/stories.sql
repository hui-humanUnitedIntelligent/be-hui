-- ════════════════════════════════════════════════
-- HUI CORE: stories
-- Additive-only: nur ADD COLUMN IF NOT EXISTS
-- ════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.stories (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.stories
  ADD COLUMN IF NOT EXISTS media_url       text,
  ADD COLUMN IF NOT EXISTS media_type      text      DEFAULT 'image',
  ADD COLUMN IF NOT EXISTS username        text,
  ADD COLUMN IF NOT EXISTS avatar_url      text,
  ADD COLUMN IF NOT EXISTS text_overlay    text,
  ADD COLUMN IF NOT EXISTS caption         text,
  ADD COLUMN IF NOT EXISTS mood            text,
  ADD COLUMN IF NOT EXISTS location        text,
  ADD COLUMN IF NOT EXISTS is_highlight    boolean   DEFAULT false,
  ADD COLUMN IF NOT EXISTS expires_at      timestamptz,
  ADD COLUMN IF NOT EXISTS mood_tags       text[]    DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS atmosphere_tags text[]    DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS energy_level    text,
  ADD COLUMN IF NOT EXISTS visibility      text      DEFAULT 'public',
  ADD COLUMN IF NOT EXISTS status          text      DEFAULT 'published',
  ADD COLUMN IF NOT EXISTS views_count     integer   DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_stories_user_id ON public.stories(user_id);
CREATE INDEX IF NOT EXISTS idx_stories_status  ON public.stories(status);
CREATE INDEX IF NOT EXISTS idx_stories_created ON public.stories(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stories_expires ON public.stories(expires_at);

NOTIFY pgrst, 'reload schema';
