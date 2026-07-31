-- ═══════════════════════════════════════════════════════════════
-- HUI SCHEMA SYNC — Migration 032 v2
-- Postgres / Supabase produktionskompatibel
--
-- FIX v2:
--   "CREATE POLICY IF NOT EXISTS" wird von Postgres < 15 NICHT
--   unterstützt → ersetzt durch:
--     DROP POLICY IF EXISTS ... ON ...;  (sicher, kein Datenverlust)
--     CREATE POLICY ...;
--
-- ALLE Operationen sind idempotent und datensicher:
--   ✅ IF NOT EXISTS bei CREATE TABLE / ALTER TABLE
--   ✅ DROP POLICY IF EXISTS vor CREATE POLICY
--   ✅ kein DROP TABLE, kein TRUNCATE, kein Datenverlust
-- ═══════════════════════════════════════════════════════════════

-- ┌─────────────────────────────────────────────────────────────┐
-- │ 1. WORKS — fehlende Spalten                                 │
-- └─────────────────────────────────────────────────────────────┘

ALTER TABLE public.works
  ADD COLUMN IF NOT EXISTS condition          TEXT,
  ADD COLUMN IF NOT EXISTS file_format        TEXT,
  ADD COLUMN IF NOT EXISTS for_sale           BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS materials          TEXT,
  ADD COLUMN IF NOT EXISTS sale_mode          TEXT,
  ADD COLUMN IF NOT EXISTS shipping           BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS shipping_cost      NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS shipping_countries TEXT,
  ADD COLUMN IF NOT EXISTS shipping_time      TEXT,
  ADD COLUMN IF NOT EXISTS size               TEXT,
  ADD COLUMN IF NOT EXISTS user_id            UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_works_for_sale  ON public.works(for_sale);
CREATE INDEX IF NOT EXISTS idx_works_shipping  ON public.works(shipping);
CREATE INDEX IF NOT EXISTS idx_works_condition ON public.works(condition);

-- ┌─────────────────────────────────────────────────────────────┐
-- │ 2. EXPERIENCES — komplette Tabelle                          │
-- └─────────────────────────────────────────────────────────────┘

CREATE TABLE IF NOT EXISTS public.experiences (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title            TEXT NOT NULL,
  description      TEXT,
  category         TEXT,
  mood             TEXT,
  price            NUMERIC(10,2),
  sale_mode        TEXT DEFAULT 'fixed',
  price_type       TEXT,
  format           TEXT,
  location_text    TEXT,
  language         TEXT DEFAULT 'Deutsch',
  duration         TEXT,
  max_participants INTEGER,
  avail_days       TEXT[],
  avail_times      TEXT[],
  available_days   TEXT[],
  booking_mode     TEXT DEFAULT 'request',
  cover_url        TEXT,
  media_url        TEXT,
  images           JSONB DEFAULT '[]'::jsonb,
  visibility       TEXT NOT NULL DEFAULT 'public',
  status           TEXT NOT NULL DEFAULT 'draft',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_experiences_user     ON public.experiences(user_id);
CREATE INDEX IF NOT EXISTS idx_experiences_status   ON public.experiences(status);
CREATE INDEX IF NOT EXISTS idx_experiences_category ON public.experiences(category);
CREATE INDEX IF NOT EXISTS idx_experiences_created  ON public.experiences(created_at DESC);

ALTER TABLE public.experiences ENABLE ROW LEVEL SECURITY;

-- RLS: experiences
-- DROP IF EXISTS → CREATE (Postgres-kompatibel ab v9.4)
DROP POLICY IF EXISTS "experiences_public_read" ON public.experiences;
CREATE POLICY "experiences_public_read" ON public.experiences
  FOR SELECT USING (status = 'published' AND visibility = 'public');

DROP POLICY IF EXISTS "experiences_own_all" ON public.experiences;
CREATE POLICY "experiences_own_all" ON public.experiences
  FOR ALL USING (auth.uid() = user_id);

-- ┌─────────────────────────────────────────────────────────────┐
-- │ 3. IMPACT_APPLICATIONS — komplette Tabelle                  │
-- └─────────────────────────────────────────────────────────────┘

CREATE TABLE IF NOT EXISTS public.impact_applications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_name    TEXT NOT NULL,
  short_desc      TEXT,
  problem         TEXT,
  vision          TEXT,
  why_support     TEXT,
  funding_goal    NUMERIC(12,2),
  funding_use     TEXT,
  contact_name    TEXT,
  contact_email   TEXT,
  contact_phone   TEXT,
  location        TEXT,
  website         TEXT,
  instagram       TEXT,
  linkedin        TEXT,
  youtube         TEXT,
  other_links     TEXT,
  media_urls      TEXT[] DEFAULT '{}'::text[],
  cover_url       TEXT,
  status          TEXT NOT NULL DEFAULT 'pending',
  submitted_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_impact_apps_user    ON public.impact_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_impact_apps_status  ON public.impact_applications(status);
CREATE INDEX IF NOT EXISTS idx_impact_apps_created ON public.impact_applications(created_at DESC);

ALTER TABLE public.impact_applications ENABLE ROW LEVEL SECURITY;

-- RLS: impact_applications
DROP POLICY IF EXISTS "impact_apps_own_read" ON public.impact_applications;
CREATE POLICY "impact_apps_own_read" ON public.impact_applications
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "impact_apps_own_insert" ON public.impact_applications;
CREATE POLICY "impact_apps_own_insert" ON public.impact_applications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "impact_apps_own_update" ON public.impact_applications;
CREATE POLICY "impact_apps_own_update" ON public.impact_applications
  FOR UPDATE USING (auth.uid() = user_id AND status = 'pending');

-- ┌─────────────────────────────────────────────────────────────┐
-- │ 4. STORIES + STORY_VIEWS                                    │
-- └─────────────────────────────────────────────────────────────┘

CREATE TABLE IF NOT EXISTS public.stories (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  media_url      TEXT,
  media_type     TEXT NOT NULL DEFAULT 'text',
  caption        TEXT,
  text_overlay   TEXT,
  mood           TEXT,
  location       TEXT,
  is_highlight   BOOLEAN NOT NULL DEFAULT false,
  expires_at     TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stories_user    ON public.stories(user_id);
CREATE INDEX IF NOT EXISTS idx_stories_expires ON public.stories(expires_at);
CREATE INDEX IF NOT EXISTS idx_stories_created ON public.stories(created_at DESC);

ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

-- RLS: stories
DROP POLICY IF EXISTS "stories_public_read" ON public.stories;
CREATE POLICY "stories_public_read" ON public.stories
  FOR SELECT USING (expires_at IS NULL OR expires_at > now());

DROP POLICY IF EXISTS "stories_own_insert" ON public.stories;
CREATE POLICY "stories_own_insert" ON public.stories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "stories_own_delete" ON public.stories;
CREATE POLICY "stories_own_delete" ON public.stories
  FOR DELETE USING (auth.uid() = user_id);

-- story_views
CREATE TABLE IF NOT EXISTS public.story_views (
  story_id   UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  viewer_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  viewed_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (story_id, viewer_id)
);

CREATE INDEX IF NOT EXISTS idx_story_views_story ON public.story_views(story_id);

ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "story_views_own" ON public.story_views;
CREATE POLICY "story_views_own" ON public.story_views
  FOR ALL USING (auth.uid() = viewer_id);

-- ┌─────────────────────────────────────────────────────────────┐
-- │ 5. PROFILES — Sicherheitsnetz                               │
-- └─────────────────────────────────────────────────────────────┘

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_member          BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS member_since       TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS trust_score        INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS role               TEXT NOT NULL DEFAULT 'basis_user',
  ADD COLUMN IF NOT EXISTS is_guardian        BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_seen          TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS display_name       TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url         TEXT,
  ADD COLUMN IF NOT EXISTS header_img         TEXT,
  ADD COLUMN IF NOT EXISTS bio                TEXT,
  ADD COLUMN IF NOT EXISTS dna_tags           TEXT[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS location_label     TEXT,
  ADD COLUMN IF NOT EXISTS is_available       BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS has_talent_profile BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS focus_type         TEXT DEFAULT 'hybrid',
  ADD COLUMN IF NOT EXISTS is_wirker          BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS updated_at         TIMESTAMPTZ DEFAULT now();

UPDATE public.profiles
  SET role = 'basis_user'
  WHERE role IN ('basisuser', '') OR role IS NULL;

-- ┌─────────────────────────────────────────────────────────────┐
-- │ 6. SCHEMA CACHE REFRESH                                     │
-- └─────────────────────────────────────────────────────────────┘

COMMENT ON TABLE public.works IS
  'HUI Werke v3 (032): condition, shipping, materials, size, file_format ergänzt';
COMMENT ON TABLE public.experiences IS
  'HUI Erlebnisse v1 (032): produktionsreife Tabelle';
COMMENT ON TABLE public.impact_applications IS
  'HUI Impact-Einreichungen v1 (032): produktionsreife Tabelle';

-- PostgREST Schema Cache sofort neu laden:
SELECT pg_notify('pgrst', 'reload schema');

-- ═══════════════════════════════════════════════════════════════
-- FERTIG.
-- Danach optional: Supabase Dashboard → Settings → API
--                  → "Reload Schema Cache" klicken.
-- ═══════════════════════════════════════════════════════════════
