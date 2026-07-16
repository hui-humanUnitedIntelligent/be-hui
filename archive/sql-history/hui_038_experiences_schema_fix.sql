-- ═══════════════════════════════════════════════════════════════════════
-- HUI Migration 038 — experiences: Schema Reality Fix
-- Datum: 2026-05-24
-- 
-- PROBLEM: Frontend sendet booking_mode, mood, images, date an
--          experiences-Tabelle — Columns fehlen in Live-DB.
--
-- FIX:
--   1. experiences-Tabelle vollständig erstellen (falls nicht vorhanden)
--   2. Fehlende Columns idempotent ergänzen (ADD COLUMN IF NOT EXISTS)
--   3. Alle Frontend-Payloads 100% schema-valid
--
-- IDEMPOTENT: kann beliebig oft ausgeführt werden ohne Fehler
-- ═══════════════════════════════════════════════════════════════════════

-- ── 1. Tabelle erstellen (falls komplett fehlend) ───────────────────────
CREATE TABLE IF NOT EXISTS public.experiences (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title            TEXT        NOT NULL,
  description      TEXT,
  category         TEXT,
  mood             TEXT,
  price            NUMERIC(10,2),
  sale_mode        TEXT        DEFAULT 'fixed',
  price_type       TEXT,
  format           TEXT,
  location_text    TEXT,
  language         TEXT        DEFAULT 'Deutsch',
  duration         TEXT,
  date             TIMESTAMPTZ,
  max_participants INTEGER,
  avail_days       TEXT[],
  avail_times      TEXT[],
  available_days   TEXT[],
  booking_mode     TEXT        DEFAULT 'direct',
  cover_url        TEXT,
  media_url        TEXT,
  images           JSONB       DEFAULT '[]'::jsonb,
  visibility       TEXT        NOT NULL DEFAULT 'public',
  status           TEXT        NOT NULL DEFAULT 'draft',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 2. Fehlende Columns ergänzen (idempotent) ──────────────────────────
-- Jede Column einzeln — kein Fehler wenn bereits vorhanden

ALTER TABLE public.experiences
  ADD COLUMN IF NOT EXISTS mood             TEXT;

ALTER TABLE public.experiences
  ADD COLUMN IF NOT EXISTS sale_mode        TEXT DEFAULT 'fixed';

ALTER TABLE public.experiences
  ADD COLUMN IF NOT EXISTS price_type       TEXT;

ALTER TABLE public.experiences
  ADD COLUMN IF NOT EXISTS format           TEXT;

ALTER TABLE public.experiences
  ADD COLUMN IF NOT EXISTS location_text    TEXT;

ALTER TABLE public.experiences
  ADD COLUMN IF NOT EXISTS language         TEXT DEFAULT 'Deutsch';

ALTER TABLE public.experiences
  ADD COLUMN IF NOT EXISTS duration         TEXT;

ALTER TABLE public.experiences
  ADD COLUMN IF NOT EXISTS date             TIMESTAMPTZ;

ALTER TABLE public.experiences
  ADD COLUMN IF NOT EXISTS max_participants INTEGER;

ALTER TABLE public.experiences
  ADD COLUMN IF NOT EXISTS avail_days       TEXT[];

ALTER TABLE public.experiences
  ADD COLUMN IF NOT EXISTS avail_times      TEXT[];

ALTER TABLE public.experiences
  ADD COLUMN IF NOT EXISTS available_days   TEXT[];

ALTER TABLE public.experiences
  ADD COLUMN IF NOT EXISTS booking_mode     TEXT DEFAULT 'direct';

ALTER TABLE public.experiences
  ADD COLUMN IF NOT EXISTS cover_url        TEXT;

ALTER TABLE public.experiences
  ADD COLUMN IF NOT EXISTS media_url        TEXT;

ALTER TABLE public.experiences
  ADD COLUMN IF NOT EXISTS images           JSONB DEFAULT '[]'::jsonb;

ALTER TABLE public.experiences
  ADD COLUMN IF NOT EXISTS visibility       TEXT NOT NULL DEFAULT 'public';

ALTER TABLE public.experiences
  ADD COLUMN IF NOT EXISTS updated_at       TIMESTAMPTZ NOT NULL DEFAULT now();

-- ── 3. Status default auf 'published' für direkte Veröffentlichung ─────
ALTER TABLE public.experiences
  ALTER COLUMN status SET DEFAULT 'published';

-- Bestehende rows ohne gültigen Status reparieren
UPDATE public.experiences
  SET status = 'published'
  WHERE status IS NULL OR status NOT IN ('published', 'draft', 'paused', 'archived');

-- ── 4. Indexes (idempotent) ────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_experiences_user_id   ON public.experiences(user_id);
CREATE INDEX IF NOT EXISTS idx_experiences_status    ON public.experiences(status);
CREATE INDEX IF NOT EXISTS idx_experiences_category  ON public.experiences(category);
CREATE INDEX IF NOT EXISTS idx_experiences_created   ON public.experiences(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_experiences_booking   ON public.experiences(booking_mode);
CREATE INDEX IF NOT EXISTS idx_experiences_vis_stat  ON public.experiences(visibility, status);

-- ── 5. RLS ─────────────────────────────────────────────────────────────
ALTER TABLE public.experiences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "experiences_public_read"  ON public.experiences;
CREATE POLICY "experiences_public_read" ON public.experiences
  FOR SELECT USING (status = 'published' AND visibility = 'public');

DROP POLICY IF EXISTS "experiences_own_read"     ON public.experiences;
CREATE POLICY "experiences_own_read" ON public.experiences
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "experiences_own_write"    ON public.experiences;
CREATE POLICY "experiences_own_write" ON public.experiences
  FOR ALL USING (auth.uid() = user_id);

-- ── 6. updated_at Trigger ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_experiences_updated_at ON public.experiences;
CREATE TRIGGER trg_experiences_updated_at
  BEFORE UPDATE ON public.experiences
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── 7. Validation Query — nach Ausführung prüfen ───────────────────────
-- Zeigt alle Columns der experiences-Tabelle:
-- SELECT column_name, data_type, column_default, is_nullable
-- FROM information_schema.columns
-- WHERE table_schema = 'public' AND table_name = 'experiences'
-- ORDER BY ordinal_position;

COMMENT ON TABLE public.experiences IS
  'HUI Erlebnisse — kreative Angebote von Wirkern. booking_mode: direct|request. v038';
