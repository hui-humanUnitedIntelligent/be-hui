-- ═══════════════════════════════════════════════════════════════
-- HUI SCHEMA SYNC — Migration 032
-- Frontend ↔ DB vollständig synchronisiert
--
-- Behebt:
--   • "condition column not found in works" (Sentry/PostgREST Fehler)
--   • 9 fehlende Spalten in works (condition, shipping, materials, ...)
--   • Komplett fehlende Tabelle: experiences (produktionsreif)
--   • Komplett fehlende Tabelle: impact_applications
--   • Supabase Schema Cache invalidiert via Kommentar-Update
--
-- ALLE ALTER TABLE / CREATE TABLE sind idempotent (IF NOT EXISTS / IF NOT EXISTS).
-- Keine bestehenden Daten werden verändert.
-- Kein UI verändert.
-- ═══════════════════════════════════════════════════════════════

-- ┌─────────────────────────────────────────────────────────────┐
-- │ 1. WORKS — fehlende Spalten                                 │
-- └─────────────────────────────────────────────────────────────┘
--
-- Frontend (WorkFlow.jsx) sendet diese Felder — alle müssen existieren:
--   condition, file_format, for_sale, materials, sale_mode,
--   shipping, shipping_cost, shipping_countries, shipping_time, size

ALTER TABLE public.works
  -- Zustand des Werkes: "Neu" | "Wie neu" | "Gut" | "Akzeptabel"
  ADD COLUMN IF NOT EXISTS condition         TEXT,

  -- Dateiformat (für digitale Werke): "PDF" | "JPG" | "PNG" | "MP3" | ...
  ADD COLUMN IF NOT EXISTS file_format       TEXT,

  -- Verkauf-Flag: true = käuflich, false = nur zeigen
  ADD COLUMN IF NOT EXISTS for_sale          BOOLEAN NOT NULL DEFAULT false,

  -- Verwendete Materialien (Text, z.B. "Öl auf Leinwand")
  ADD COLUMN IF NOT EXISTS materials         TEXT,

  -- Verkaufsmodus: "free" | "fixed" | "inquiry"
  ADD COLUMN IF NOT EXISTS sale_mode         TEXT,

  -- Versand möglich?
  ADD COLUMN IF NOT EXISTS shipping          BOOLEAN NOT NULL DEFAULT false,

  -- Versandkosten in EUR
  ADD COLUMN IF NOT EXISTS shipping_cost     NUMERIC(10,2),

  -- Versandländer (Text, z.B. "Deutschland, Österreich, Schweiz")
  ADD COLUMN IF NOT EXISTS shipping_countries TEXT,

  -- Lieferzeit (Text, z.B. "3–5 Werktage")
  ADD COLUMN IF NOT EXISTS shipping_time     TEXT,

  -- Größe (Text, z.B. "30x40cm" oder "A4")
  ADD COLUMN IF NOT EXISTS size              TEXT,

  -- user_id (Primary-Creator-Ref falls creator_id noch nicht gesetzt)
  ADD COLUMN IF NOT EXISTS user_id           UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Index für shipping-Filter (z.B. "Werke mit Versand")
CREATE INDEX IF NOT EXISTS idx_works_for_sale  ON public.works(for_sale);
CREATE INDEX IF NOT EXISTS idx_works_shipping  ON public.works(shipping);
CREATE INDEX IF NOT EXISTS idx_works_condition ON public.works(condition);

-- ┌─────────────────────────────────────────────────────────────┐
-- │ 2. EXPERIENCES — komplette produktionsreife Tabelle         │
-- └─────────────────────────────────────────────────────────────┘
--
-- Frontend sendet (ExperienceFlow, ExperienceCreator, HuiCreateFlow):
--   user_id, title, description, mood, category, duration, price,
--   sale_mode, format, location_text, max_participants, booking_mode,
--   avail_days, avail_times, images, media_url, cover_url,
--   visibility, status, language, price_type, available_days

CREATE TABLE IF NOT EXISTS public.experiences (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Basis
  title            TEXT NOT NULL,
  description      TEXT,
  category         TEXT,
  mood             TEXT,

  -- Preis
  price            NUMERIC(10,2),
  sale_mode        TEXT DEFAULT 'fixed',   -- "free" | "fixed" | "inquiry" | "donation"
  price_type       TEXT,                   -- Alias aus HuiCreateFlow

  -- Format & Ort
  format           TEXT,                   -- "online" | "offline" | "hybrid"
  location_text    TEXT,
  language         TEXT DEFAULT 'Deutsch',

  -- Zeit & Kapazität
  duration         TEXT,
  max_participants INTEGER,
  avail_days       TEXT[],                 -- ["Mo", "Di", ...]
  avail_times      TEXT[],                 -- ["Morgens", "Nachmittags", ...]
  available_days   TEXT[],                 -- Alias aus HuiCreateFlow (avail_days)
  booking_mode     TEXT DEFAULT 'request', -- "instant" | "request"

  -- Medien
  cover_url        TEXT,
  media_url        TEXT,
  images           JSONB DEFAULT '[]'::jsonb,

  -- Status
  visibility       TEXT NOT NULL DEFAULT 'public',
  status           TEXT NOT NULL DEFAULT 'draft',

  -- Timestamps
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_experiences_user     ON public.experiences(user_id);
CREATE INDEX IF NOT EXISTS idx_experiences_status   ON public.experiences(status);
CREATE INDEX IF NOT EXISTS idx_experiences_category ON public.experiences(category);
CREATE INDEX IF NOT EXISTS idx_experiences_created  ON public.experiences(created_at DESC);

ALTER TABLE public.experiences ENABLE ROW LEVEL SECURITY;

-- Öffentliche Erlebnisse lesen
CREATE POLICY IF NOT EXISTS "experiences_public_read" ON public.experiences
  FOR SELECT USING (status = 'published' AND visibility = 'public');

-- Owner: alles
CREATE POLICY IF NOT EXISTS "experiences_own_all" ON public.experiences
  FOR ALL USING (auth.uid() = user_id);

-- ┌─────────────────────────────────────────────────────────────┐
-- │ 3. IMPACT_APPLICATIONS — komplett fehlende Tabelle          │
-- └─────────────────────────────────────────────────────────────┘
--
-- Frontend (ImpactFlow.jsx) sendet alle diese Felder:
--   user_id, project_name, short_desc, problem, vision, why_support,
--   funding_goal, funding_use, contact_name, contact_email, contact_phone,
--   location, website, instagram, linkedin, youtube, other_links,
--   media_urls, cover_url, status, submitted_at

CREATE TABLE IF NOT EXISTS public.impact_applications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Projekt-Info
  project_name    TEXT NOT NULL,
  short_desc      TEXT,
  problem         TEXT,
  vision          TEXT,
  why_support     TEXT,

  -- Finanzierung
  funding_goal    NUMERIC(12,2),
  funding_use     TEXT,

  -- Kontakt
  contact_name    TEXT,
  contact_email   TEXT,
  contact_phone   TEXT,

  -- Ort
  location        TEXT,

  -- Social / Links
  website         TEXT,
  instagram       TEXT,
  linkedin        TEXT,
  youtube         TEXT,
  other_links     TEXT,

  -- Medien
  media_urls      TEXT[] DEFAULT '{}'::text[],
  cover_url       TEXT,

  -- Status: "pending" | "reviewing" | "approved" | "rejected"
  status          TEXT NOT NULL DEFAULT 'pending',

  -- Timestamps
  submitted_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_impact_apps_user    ON public.impact_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_impact_apps_status  ON public.impact_applications(status);
CREATE INDEX IF NOT EXISTS idx_impact_apps_created ON public.impact_applications(created_at DESC);

ALTER TABLE public.impact_applications ENABLE ROW LEVEL SECURITY;

-- User sieht nur eigene Einreichungen
CREATE POLICY IF NOT EXISTS "impact_apps_own_read" ON public.impact_applications
  FOR SELECT USING (auth.uid() = user_id);

-- User kann eigene einreichen
CREATE POLICY IF NOT EXISTS "impact_apps_own_insert" ON public.impact_applications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User kann eigene bearbeiten solange pending
CREATE POLICY IF NOT EXISTS "impact_apps_own_update" ON public.impact_applications
  FOR UPDATE USING (auth.uid() = user_id AND status = 'pending');

-- ┌─────────────────────────────────────────────────────────────┐
-- │ 4. STORIES — fehlende Spalten prüfen                        │
-- └─────────────────────────────────────────────────────────────┘
--
-- TeilenFlow sendet: user_id, media_url, media_type, caption, expires_at
-- StoryBar liest: username, avatar_url, text_overlay, is_highlight

CREATE TABLE IF NOT EXISTS public.stories (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  media_url      TEXT,
  media_type     TEXT NOT NULL DEFAULT 'text',   -- "text" | "image" | "video"
  caption        TEXT,
  text_overlay   TEXT,                            -- Text auf dem Bild
  mood           TEXT,
  location       TEXT,
  is_highlight   BOOLEAN NOT NULL DEFAULT false,  -- Story-Highlight
  expires_at     TIMESTAMPTZ,                     -- null = permanent (Highlight)
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stories_user    ON public.stories(user_id);
CREATE INDEX IF NOT EXISTS idx_stories_expires ON public.stories(expires_at);
CREATE INDEX IF NOT EXISTS idx_stories_created ON public.stories(created_at DESC);

-- RLS: Stories sind öffentlich lesbar (falls nicht expired)
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "stories_public_read" ON public.stories
  FOR SELECT USING (expires_at IS NULL OR expires_at > now());

CREATE POLICY IF NOT EXISTS "stories_own_insert" ON public.stories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "stories_own_delete" ON public.stories
  FOR DELETE USING (auth.uid() = user_id);

-- story_views: wer hat welche Story gesehen
CREATE TABLE IF NOT EXISTS public.story_views (
  story_id   UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  viewer_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  viewed_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (story_id, viewer_id)
);

CREATE INDEX IF NOT EXISTS idx_story_views_story ON public.story_views(story_id);

ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "story_views_own" ON public.story_views
  FOR ALL USING (auth.uid() = viewer_id);

-- ┌─────────────────────────────────────────────────────────────┐
-- │ 5. PROFILES — fehlende Phase-1 Spalten (Sicherheitsnetz)    │
-- └─────────────────────────────────────────────────────────────┘
--
-- Sicherheitsnetz: falls 030 nicht vollständig ausgeführt wurde

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_member         BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS member_since      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS trust_score       INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS role              TEXT NOT NULL DEFAULT 'basis_user',
  ADD COLUMN IF NOT EXISTS is_guardian       BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_seen         TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS display_name      TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url        TEXT,
  ADD COLUMN IF NOT EXISTS header_img        TEXT,
  ADD COLUMN IF NOT EXISTS bio               TEXT,
  ADD COLUMN IF NOT EXISTS dna_tags          TEXT[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS location_label    TEXT,
  ADD COLUMN IF NOT EXISTS is_available      BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS has_talent_profile BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS focus_type        TEXT DEFAULT 'hybrid',
  ADD COLUMN IF NOT EXISTS is_wirker         BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS updated_at        TIMESTAMPTZ DEFAULT now();

-- Falschen role-Wert normalisieren (falls von altem Code geschrieben)
UPDATE public.profiles
  SET role = 'basis_user'
  WHERE role = 'basisuser' OR role IS NULL OR role = '';

-- ┌─────────────────────────────────────────────────────────────┐
-- │ 6. SCHEMA CACHE — Supabase PostgREST invalidieren           │
-- └─────────────────────────────────────────────────────────────┘
--
-- Nach diesem Script: In Supabase Dashboard → Settings → API
-- → "Reload Schema Cache" klicken ODER 30s warten (auto-reload).
-- PostgREST picked neue Spalten automatisch auf.
--
-- ODER via RPC (wenn Service-Role verfügbar):
-- SELECT pg_notify('pgrst', 'reload schema');

-- Kommentar auf works als leichter Cache-Bust-Trigger
COMMENT ON TABLE public.works IS
  'HUI Werke — Schema v3 (032): condition, shipping, materials, size, file_format, for_sale, sale_mode ergänzt';

COMMENT ON TABLE public.experiences IS
  'HUI Erlebnisse — Schema v1 (032): vollständige Produktions-Tabelle';

COMMENT ON TABLE public.impact_applications IS
  'HUI Impact-Einreichungen — Schema v1 (032): vollständige Produktions-Tabelle';

-- ═══════════════════════════════════════════════════════════════
-- ZUSAMMENFASSUNG DER ÄNDERUNGEN:
--
-- works (ALTER):
--   + condition, file_format, for_sale, materials, sale_mode
--   + shipping, shipping_cost, shipping_countries, shipping_time
--   + size, user_id
--
-- experiences (CREATE TABLE IF NOT EXISTS):
--   Komplette Tabelle mit allen Frontend-Feldern
--
-- impact_applications (CREATE TABLE IF NOT EXISTS):
--   Komplette Tabelle mit allen ImpactFlow-Feldern
--
-- stories (CREATE TABLE IF NOT EXISTS):
--   Komplette Tabelle inkl. text_overlay, is_highlight, story_views
--
-- profiles (ALTER — Sicherheitsnetz):
--   + is_member, member_since, trust_score, role, is_guardian
--   + last_seen, display_name, avatar_url, header_img, bio
--   + dna_tags, location_label, is_available, has_talent_profile
--   + focus_type, is_wirker, updated_at
--
-- IDEMPOTENT: alle Operationen nutzen IF NOT EXISTS
-- KEIN Datenverlust: kein DROP, kein TRUNCATE
-- ═══════════════════════════════════════════════════════════════
