-- ═══════════════════════════════════════════════════════════════════
-- HUI 019: Finale Publish-Pipeline Bereinigung
-- Behebt alle verbleibenden Frontend↔DB Schema-Diskrepanzen.
-- IDEMPOTENT — sicher mehrfach ausführbar (IF NOT EXISTS überall).
-- 
-- Probleme die behoben werden:
--   1. experiences.location GEOGRAPHY-Konflikt → location_text hinzufügen,
--      experiences INSERT in der UI wird auf location_text gemappt
--   2. atmosphere_tags + creator_vibe für works/experiences/stories
--   3. Alle 3 Tabellen: vollständiges Feld-Set garantiert
--   4. NOTIFY pgrst am Ende → Schema-Cache flush
-- Datum: 2026-05-15
-- ═══════════════════════════════════════════════════════════════════

-- ══════════════════════════════════════════════════════
-- 1. EXPERIENCES — alle fehlenden Felder (019-Ergänzung)
-- ══════════════════════════════════════════════════════

-- location_text: Freitext-Ort (statt GEOGRAPHY 'location')
-- Die UI inserted 'location' als text → wir mappen das auf location_text
ALTER TABLE public.experiences
  ADD COLUMN IF NOT EXISTS location_text text;

-- atmosphere_tags: zusätzliche atmosphärische Stimmungstags
ALTER TABLE public.experiences
  ADD COLUMN IF NOT EXISTS atmosphere_tags text[] DEFAULT '{}';

-- creator_vibe: persönlicher Creator-Stil
ALTER TABLE public.experiences
  ADD COLUMN IF NOT EXISTS creator_vibe text;

-- Sicherheitshalber nochmal alle 017-Felder (idempotent durch IF NOT EXISTS)
ALTER TABLE public.experiences
  ADD COLUMN IF NOT EXISTS media_url      text,
  ADD COLUMN IF NOT EXISTS media_type     text,
  ADD COLUMN IF NOT EXISTS caption        text,
  ADD COLUMN IF NOT EXISTS price          numeric(10,2),
  ADD COLUMN IF NOT EXISTS price_type     text,
  ADD COLUMN IF NOT EXISTS format         text DEFAULT 'online',
  ADD COLUMN IF NOT EXISTS duration       text,
  ADD COLUMN IF NOT EXISTS available_days text,
  ADD COLUMN IF NOT EXISTS language       text DEFAULT 'Deutsch',
  ADD COLUMN IF NOT EXISTS mood_tags      text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS energy_level   text,
  ADD COLUMN IF NOT EXISTS social_energy  text;

-- status: Achtung — IF NOT EXISTS, kein Fehler wenn schon vorhanden
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='experiences' AND column_name='status'
  ) THEN
    ALTER TABLE public.experiences ADD COLUMN status text NOT NULL DEFAULT 'published';
  END IF;
END $$;

-- ══════════════════════════════════════════════════════
-- 2. WORKS — atmosphere_tags + creator_vibe ergänzen
-- ══════════════════════════════════════════════════════

ALTER TABLE public.works
  ADD COLUMN IF NOT EXISTS atmosphere_tags text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS creator_vibe    text;

-- Sicherheitshalber alle 018-Felder (idempotent)
ALTER TABLE public.works
  ADD COLUMN IF NOT EXISTS media_url         text,
  ADD COLUMN IF NOT EXISTS media_type        text,
  ADD COLUMN IF NOT EXISTS caption           text,
  ADD COLUMN IF NOT EXISTS cover_url         text,
  ADD COLUMN IF NOT EXISTS mood_tags         text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS energy_level      text,
  ADD COLUMN IF NOT EXISTS social_energy     text,
  ADD COLUMN IF NOT EXISTS price             numeric(10,2),
  ADD COLUMN IF NOT EXISTS quantity          integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS shipping_available boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS pickup_available  boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS delivery_time     text,
  ADD COLUMN IF NOT EXISTS for_sale          boolean DEFAULT true;

-- status für works
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='works' AND column_name='status'
  ) THEN
    ALTER TABLE public.works ADD COLUMN status text NOT NULL DEFAULT 'published';
  END IF;
END $$;

-- ══════════════════════════════════════════════════════
-- 3. STORIES — atmosphere_tags + creator_vibe + location
-- ══════════════════════════════════════════════════════

ALTER TABLE public.stories
  ADD COLUMN IF NOT EXISTS atmosphere_tags text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS creator_vibe    text,
  ADD COLUMN IF NOT EXISTS location        text,
  ADD COLUMN IF NOT EXISTS media_url       text,
  ADD COLUMN IF NOT EXISTS media_type      text,
  ADD COLUMN IF NOT EXISTS caption         text,
  ADD COLUMN IF NOT EXISTS mood_tags       text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS energy_level    text,
  ADD COLUMN IF NOT EXISTS social_energy   text;

-- status für stories
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='stories' AND column_name='status'
  ) THEN
    ALTER TABLE public.stories ADD COLUMN status text DEFAULT 'published';
  END IF;
END $$;

-- ══════════════════════════════════════════════════════
-- 4. INDIZES für neue Felder
-- ══════════════════════════════════════════════════════

-- experiences
CREATE INDEX IF NOT EXISTS idx_exp_atmosphere_tags
  ON public.experiences USING gin(atmosphere_tags);
CREATE INDEX IF NOT EXISTS idx_exp_location_text
  ON public.experiences(location_text) WHERE location_text IS NOT NULL;

-- works
CREATE INDEX IF NOT EXISTS idx_works_atmosphere_tags
  ON public.works USING gin(atmosphere_tags);
CREATE INDEX IF NOT EXISTS idx_works_creator_vibe
  ON public.works(creator_vibe) WHERE creator_vibe IS NOT NULL;

-- stories
CREATE INDEX IF NOT EXISTS idx_stories_location
  ON public.stories(location) WHERE location IS NOT NULL;

-- ══════════════════════════════════════════════════════
-- 5. RLS sichern (idempotent)
-- ══════════════════════════════════════════════════════

ALTER TABLE public.experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.works       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories     ENABLE ROW LEVEL SECURITY;

-- experiences
DROP POLICY IF EXISTS exp_select_public ON public.experiences;
CREATE POLICY exp_select_public ON public.experiences FOR SELECT
  USING (status = 'published' OR user_id = auth.uid());

DROP POLICY IF EXISTS exp_insert_own ON public.experiences;
CREATE POLICY exp_insert_own ON public.experiences FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- works
DROP POLICY IF EXISTS works_select_public ON public.works;
CREATE POLICY works_select_public ON public.works FOR SELECT
  USING (status = 'published' OR user_id = auth.uid());

DROP POLICY IF EXISTS works_insert_own ON public.works;
CREATE POLICY works_insert_own ON public.works FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- stories (erlaubt auch nicht-published für den Autor + unexpired)
DROP POLICY IF EXISTS stories_select_public ON public.stories;
CREATE POLICY stories_select_public ON public.stories FOR SELECT
  USING (
    status = 'published'
    OR user_id = auth.uid()
  );

DROP POLICY IF EXISTS stories_insert_own ON public.stories;
CREATE POLICY stories_insert_own ON public.stories FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- ══════════════════════════════════════════════════════
-- 6. PostgREST Schema-Cache flush
-- ══════════════════════════════════════════════════════
NOTIFY pgrst, 'reload schema';

-- ══════════════════════════════════════════════════════
-- 7. Verifikation — zeigt alle neuen Spalten
-- ══════════════════════════════════════════════════════
SELECT
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name   IN ('experiences','works','stories')
  AND column_name  IN (
    'media_url','media_type','caption','status','location','location_text',
    'price','price_type','format','duration','available_days','language',
    'mood_tags','atmosphere_tags','energy_level','social_energy','creator_vibe',
    'cover_url','for_sale','shipping_available','pickup_available','delivery_time','quantity'
  )
ORDER BY table_name, column_name;

SELECT 'HUI 019 — Publish Pipeline sync ✓' AS status;
