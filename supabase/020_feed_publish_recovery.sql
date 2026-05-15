-- ═══════════════════════════════════════════════════════════════════
-- HUI 020: Kritischer System-Fix — Feed + Publish Pipeline Recovery
-- 
-- ZWECK:
--   Setzt ALLE fehlenden Spalten in experiences, works und stories.
--   Diese Migration ist der einzige Script der ausgeführt werden muss.
--   017, 018, 019 sind durch IF NOT EXISTS ebenfalls sicher.
--
-- SICHER:
--   - 100% idempotent (ADD COLUMN IF NOT EXISTS überall)
--   - Keine bestehenden Daten werden gelöscht oder verändert
--   - Kann beliebig oft ausgeführt werden
--   - NOTIFY pgrst flusht PostgREST Schema-Cache sofort
--
-- NACH AUSFÜHRUNG:
--   Feed und Publish-Pipeline funktionieren wieder vollständig.
-- Datum: 2026-05-15
-- ═══════════════════════════════════════════════════════════════════

BEGIN;

-- ══════════════════════════════════════════════════════════════════
-- 1. EXPERIENCES — alle UI-Felder
-- ══════════════════════════════════════════════════════════════════

-- Medien (aus base-Objekt in handlePublish)
ALTER TABLE public.experiences
  ADD COLUMN IF NOT EXISTS media_url      text,
  ADD COLUMN IF NOT EXISTS media_type     text,
  ADD COLUMN IF NOT EXISTS caption        text;

-- Ort: location_text (statt GEOGRAPHY-Spalte location)
ALTER TABLE public.experiences
  ADD COLUMN IF NOT EXISTS location_text  text;

-- Fachliche Felder
ALTER TABLE public.experiences
  ADD COLUMN IF NOT EXISTS price          numeric(10,2),
  ADD COLUMN IF NOT EXISTS price_type     text,
  ADD COLUMN IF NOT EXISTS format         text DEFAULT 'online',
  ADD COLUMN IF NOT EXISTS duration       text,
  ADD COLUMN IF NOT EXISTS available_days text,
  ADD COLUMN IF NOT EXISTS language       text DEFAULT 'Deutsch';

-- Mood/Atmosphere (emotionales System)
ALTER TABLE public.experiences
  ADD COLUMN IF NOT EXISTS mood_tags      text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS atmosphere_tags text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS energy_level   text,
  ADD COLUMN IF NOT EXISTS social_energy  text,
  ADD COLUMN IF NOT EXISTS creator_vibe   text;

-- Status (text, neben 'state' ENUM)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='experiences' AND column_name='status')
  THEN ALTER TABLE public.experiences ADD COLUMN status text NOT NULL DEFAULT 'published';
  END IF;
END $$;

-- Timestamps
ALTER TABLE public.experiences
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT NOW();

-- ══════════════════════════════════════════════════════════════════
-- 2. WORKS — alle UI-Felder
-- ══════════════════════════════════════════════════════════════════

ALTER TABLE public.works
  ADD COLUMN IF NOT EXISTS media_url         text,
  ADD COLUMN IF NOT EXISTS media_type        text,
  ADD COLUMN IF NOT EXISTS caption           text,
  ADD COLUMN IF NOT EXISTS cover_url         text,
  ADD COLUMN IF NOT EXISTS price             numeric(10,2),
  ADD COLUMN IF NOT EXISTS quantity          integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS shipping_available boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS pickup_available  boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS delivery_time     text,
  ADD COLUMN IF NOT EXISTS for_sale          boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS location_text     text,
  ADD COLUMN IF NOT EXISTS mood_tags         text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS atmosphere_tags   text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS energy_level      text,
  ADD COLUMN IF NOT EXISTS social_energy     text,
  ADD COLUMN IF NOT EXISTS creator_vibe      text;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='works' AND column_name='status')
  THEN ALTER TABLE public.works ADD COLUMN status text NOT NULL DEFAULT 'published';
  END IF;
END $$;

-- ══════════════════════════════════════════════════════════════════
-- 3. STORIES — alle UI-Felder
-- ══════════════════════════════════════════════════════════════════

ALTER TABLE public.stories
  ADD COLUMN IF NOT EXISTS media_url       text,
  ADD COLUMN IF NOT EXISTS media_type      text,
  ADD COLUMN IF NOT EXISTS caption         text,
  ADD COLUMN IF NOT EXISTS location        text,
  ADD COLUMN IF NOT EXISTS mood_tags       text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS atmosphere_tags text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS energy_level    text,
  ADD COLUMN IF NOT EXISTS social_energy   text,
  ADD COLUMN IF NOT EXISTS creator_vibe    text;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='stories' AND column_name='status')
  THEN ALTER TABLE public.stories ADD COLUMN status text DEFAULT 'published';
  END IF;
END $$;

-- ══════════════════════════════════════════════════════════════════
-- 4. RLS POLICIES (idempotent durch DROP IF EXISTS)
-- ══════════════════════════════════════════════════════════════════

ALTER TABLE public.experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.works       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories     ENABLE ROW LEVEL SECURITY;

-- experiences
DROP POLICY IF EXISTS exp_select_pub   ON public.experiences;
DROP POLICY IF EXISTS exp_insert_own   ON public.experiences;
DROP POLICY IF EXISTS exp_update_own   ON public.experiences;
DROP POLICY IF EXISTS exp_delete_own   ON public.experiences;
CREATE POLICY exp_select_pub  ON public.experiences FOR SELECT USING (true);
CREATE POLICY exp_insert_own  ON public.experiences FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY exp_update_own  ON public.experiences FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY exp_delete_own  ON public.experiences FOR DELETE USING (user_id = auth.uid());

-- works
DROP POLICY IF EXISTS works_select_pub  ON public.works;
DROP POLICY IF EXISTS works_insert_own  ON public.works;
DROP POLICY IF EXISTS works_update_own  ON public.works;
DROP POLICY IF EXISTS works_delete_own  ON public.works;
CREATE POLICY works_select_pub ON public.works FOR SELECT USING (true);
CREATE POLICY works_insert_own ON public.works FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY works_update_own ON public.works FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY works_delete_own ON public.works FOR DELETE USING (user_id = auth.uid());

-- stories
DROP POLICY IF EXISTS stories_select_pub ON public.stories;
DROP POLICY IF EXISTS stories_insert_own ON public.stories;
DROP POLICY IF EXISTS stories_update_own ON public.stories;
DROP POLICY IF EXISTS stories_delete_own ON public.stories;
CREATE POLICY stories_select_pub ON public.stories FOR SELECT USING (true);
CREATE POLICY stories_insert_own ON public.stories FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY stories_update_own ON public.stories FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY stories_delete_own ON public.stories FOR DELETE USING (user_id = auth.uid());

-- ══════════════════════════════════════════════════════════════════
-- 5. INDIZES für Performance
-- ══════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_exp_created_at     ON public.experiences(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_exp_mood_tags      ON public.experiences USING gin(mood_tags);
CREATE INDEX IF NOT EXISTS idx_works_created_at   ON public.works(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_works_cover_url    ON public.works(cover_url) WHERE cover_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_works_mood_tags    ON public.works USING gin(mood_tags);
CREATE INDEX IF NOT EXISTS idx_stories_media_url  ON public.stories(media_url) WHERE media_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_stories_created_at ON public.stories(created_at DESC);

-- ══════════════════════════════════════════════════════════════════
-- 6. Storage Buckets sicherstellen (falls nicht vorhanden)
-- ══════════════════════════════════════════════════════════════════
-- Hinweis: Buckets müssen ggf. manuell in Supabase Storage angelegt werden:
--   - "media" (public) — für works, experiences
--   - "stories" (public) — für story-uploads

-- ══════════════════════════════════════════════════════════════════
-- 7. Schema-Cache flush
-- ══════════════════════════════════════════════════════════════════
COMMIT;

NOTIFY pgrst, 'reload schema';

-- ══════════════════════════════════════════════════════════════════
-- 8. Verifikation
-- ══════════════════════════════════════════════════════════════════
SELECT
  t.table_name,
  COUNT(c.column_name) as col_count,
  string_agg(c.column_name, ', ' ORDER BY c.ordinal_position) FILTER (
    WHERE c.column_name IN (
      'media_url','status','mood_tags','atmosphere_tags',
      'energy_level','social_energy','creator_vibe',
      'available_days','location_text','cover_url','for_sale'
    )
  ) as key_columns_present
FROM information_schema.tables t
JOIN information_schema.columns c
  ON c.table_schema = t.table_schema AND c.table_name = t.table_name
WHERE t.table_schema = 'public'
  AND t.table_name IN ('experiences','works','stories')
GROUP BY t.table_name
ORDER BY t.table_name;

SELECT 'HUI 020 — Feed + Publish Recovery ✓' AS status;
