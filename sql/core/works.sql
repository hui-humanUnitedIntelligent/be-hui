-- ════════════════════════════════════════════════
-- HUI CORE: works
-- Additive-only: nur ADD COLUMN IF NOT EXISTS
-- ════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.works (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title      text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.works
  ADD COLUMN IF NOT EXISTS description     text,
  ADD COLUMN IF NOT EXISTS media_url       text,
  ADD COLUMN IF NOT EXISTS media_type      text    DEFAULT 'image',
  ADD COLUMN IF NOT EXISTS caption         text,
  ADD COLUMN IF NOT EXISTS cover_url       text,
  ADD COLUMN IF NOT EXISTS price           numeric(10,2),
  ADD COLUMN IF NOT EXISTS for_sale        boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS location_text   text,
  ADD COLUMN IF NOT EXISTS category        text,
  ADD COLUMN IF NOT EXISTS tags            text[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS mood_tags       text[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS atmosphere_tags text[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS energy_level    text,
  ADD COLUMN IF NOT EXISTS creator_vibe    text,
  ADD COLUMN IF NOT EXISTS views_count     integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS likes_count     integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS status          text    DEFAULT 'published';

CREATE INDEX IF NOT EXISTS idx_works_user_id ON public.works(user_id);
CREATE INDEX IF NOT EXISTS idx_works_status  ON public.works(status);
CREATE INDEX IF NOT EXISTS idx_works_created ON public.works(created_at DESC);

NOTIFY pgrst, 'reload schema';
