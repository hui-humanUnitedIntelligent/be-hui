-- ═══════════════════════════════════════════════════════════════
-- HUI Migration 045 — works Schema Sync für WerkWizard
-- ═══════════════════════════════════════════════════════════════
-- PROBLEM:
--   Supabase-Schema-Cache kennt 'medium' nicht → INSERT schlägt fehl
--   Ursache: hui_031 NOTIFY pgrst möglicherweise nicht durchgekommen
--   Oder: Schema-Cache nach späteren Migrations nicht refreshed
--
-- LÖSUNG:
--   1. Alle Editor-Felder sicher per IF NOT EXISTS hinzufügen
--   2. Felder die im Editor genutzt werden aber fehlten ergänzen
--   3. NOTIFY pgrst → forciert Schema-Cache-Reload
--
-- SICHER: Alle ADD COLUMN IF NOT EXISTS → idempotent
-- ═══════════════════════════════════════════════════════════════

-- ── SCHRITT 1: Sicherstellen dass alle Editor-Pflichtfelder existieren ──

ALTER TABLE public.works
  ADD COLUMN IF NOT EXISTS medium          TEXT,
  ADD COLUMN IF NOT EXISTS description     TEXT,
  ADD COLUMN IF NOT EXISTS caption         TEXT,
  ADD COLUMN IF NOT EXISTS cover_url       TEXT,
  ADD COLUMN IF NOT EXISTS media_url       TEXT,
  ADD COLUMN IF NOT EXISTS images          JSONB    DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS category        TEXT,
  ADD COLUMN IF NOT EXISTS tags            TEXT[]   DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS price           NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS for_sale        BOOLEAN  DEFAULT true,
  ADD COLUMN IF NOT EXISTS location_text   TEXT,
  ADD COLUMN IF NOT EXISTS visibility      TEXT     NOT NULL DEFAULT 'public',
  ADD COLUMN IF NOT EXISTS status          TEXT     DEFAULT 'published',
  ADD COLUMN IF NOT EXISTS updated_at      TIMESTAMPTZ DEFAULT now();

-- ── SCHRITT 2: Physikalische/Versand-Felder (aus hui_032 — sicherheitshalber) ──

ALTER TABLE public.works
  ADD COLUMN IF NOT EXISTS materials           TEXT,
  ADD COLUMN IF NOT EXISTS size                TEXT,
  ADD COLUMN IF NOT EXISTS condition           TEXT,
  ADD COLUMN IF NOT EXISTS file_format         TEXT,
  ADD COLUMN IF NOT EXISTS shipping            BOOLEAN  DEFAULT false,
  ADD COLUMN IF NOT EXISTS shipping_cost       NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS shipping_countries  TEXT,
  ADD COLUMN IF NOT EXISTS shipping_time       TEXT,
  ADD COLUMN IF NOT EXISTS sale_mode           TEXT     DEFAULT 'fixed';

-- ── SCHRITT 3: creator_id aus user_id befüllen ──────────────────
-- (hui_031 hat das schon, aber idempotent)

ALTER TABLE public.works
  ADD COLUMN IF NOT EXISTS creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

UPDATE public.works
SET creator_id = user_id
WHERE creator_id IS NULL AND user_id IS NOT NULL;

-- ── SCHRITT 4: RLS sicherstellen ───────────────────────────────

ALTER TABLE public.works ENABLE ROW LEVEL SECURITY;

-- Read: published + public für alle
DROP POLICY IF EXISTS "works_public_read" ON public.works;
CREATE POLICY "works_public_read" ON public.works
  FOR SELECT USING (status = 'published' AND visibility = 'public');

-- Own: voller Zugriff auf eigene Werke
DROP POLICY IF EXISTS "works_own_all" ON public.works;
CREATE POLICY "works_own_all" ON public.works
  FOR ALL USING (
    auth.uid() = user_id
    OR auth.uid() = creator_id
  );

-- ── SCHRITT 5: Indizes ──────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_works_user_id    ON public.works(user_id);
CREATE INDEX IF NOT EXISTS idx_works_creator    ON public.works(creator_id);
CREATE INDEX IF NOT EXISTS idx_works_status     ON public.works(status);
CREATE INDEX IF NOT EXISTS idx_works_visibility ON public.works(visibility);
CREATE INDEX IF NOT EXISTS idx_works_category   ON public.works(category);
CREATE INDEX IF NOT EXISTS idx_works_created    ON public.works(created_at DESC);

-- ── SCHRITT 6: Schema-Cache forciert neu laden ──────────────────
-- KRITISCH: Das ist der Fix für "column not found in schema cache"

NOTIFY pgrst, 'reload schema';

-- ═══════════════════════════════════════════════════════════════
-- VERIFY nach Ausführung:
--   SELECT column_name, data_type
--   FROM information_schema.columns
--   WHERE table_schema = 'public' AND table_name = 'works'
--   ORDER BY column_name;
-- ═══════════════════════════════════════════════════════════════
