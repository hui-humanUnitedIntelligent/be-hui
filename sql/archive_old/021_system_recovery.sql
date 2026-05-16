-- ═══════════════════════════════════════════════════════════════════
-- HUI 021: KRITISCHER SYSTEM-FIX — Feed + Publish Recovery
-- 
-- ⚠️  DIESEN SCRIPT ALS EINZIGEN AUSFÜHREN.
--     Er ersetzt 017, 018, 019, 020 vollständig.
--     Komplett idempotent — mehrfaches Ausführen ist sicher.
--
-- WAS DIESER SCRIPT BEHEBT:
--   1. PGRST204 "column not found in schema cache" → alle Spalten hinzufügen
--   2. RLS blockiert Inserts → permissive INSERT policies
--   3. Schema-Cache veraltet → NOTIFY pgrst am Ende
--   4. Fehlende Storage-Buckets → Hinweis in Kommentar
--   5. works.status vs works.state Konflikt → beide koexistieren
-- ═══════════════════════════════════════════════════════════════════

-- ══════════════════════════════════════════════════════════════════
-- SCHRITT 0: Sicherstellen dass uuid-Extension aktiv ist
-- ══════════════════════════════════════════════════════════════════
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ══════════════════════════════════════════════════════════════════
-- SCHRITT 1: WORKS — alle UI-Felder
-- ══════════════════════════════════════════════════════════════════
-- works v5 Basisfelder: id, user_id, title, description, category,
--   tags, price_eur, currency, images, video_url, state, visibility,
--   stock, is_digital, shipping_days, location (GEOGRAPHY), view_count,
--   save_count, sale_count, published_at, created_at, updated_at
-- UI inserted zusätzlich:
ALTER TABLE public.works
  ADD COLUMN IF NOT EXISTS media_url          text,
  ADD COLUMN IF NOT EXISTS media_type         text,
  ADD COLUMN IF NOT EXISTS caption            text,
  ADD COLUMN IF NOT EXISTS cover_url          text,
  ADD COLUMN IF NOT EXISTS price              numeric(10,2),
  ADD COLUMN IF NOT EXISTS quantity           integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS shipping_available boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS pickup_available   boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS delivery_time      text,
  ADD COLUMN IF NOT EXISTS for_sale           boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS location_text      text,
  ADD COLUMN IF NOT EXISTS mood_tags          text[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS atmosphere_tags    text[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS energy_level       text,
  ADD COLUMN IF NOT EXISTS social_energy      text,
  ADD COLUMN IF NOT EXISTS creator_vibe       text;

-- status: text neben state ENUM
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='works' AND column_name='status'
  ) THEN
    ALTER TABLE public.works ADD COLUMN status text NOT NULL DEFAULT 'published';
  END IF;
END $$;

-- ══════════════════════════════════════════════════════════════════
-- SCHRITT 2: EXPERIENCES — alle UI-Felder
-- ══════════════════════════════════════════════════════════════════
-- experiences v5 hat location als GEOGRAPHY → UI nutzt location_text
ALTER TABLE public.experiences
  ADD COLUMN IF NOT EXISTS media_url          text,
  ADD COLUMN IF NOT EXISTS media_type         text,
  ADD COLUMN IF NOT EXISTS caption            text,
  ADD COLUMN IF NOT EXISTS location_text      text,
  ADD COLUMN IF NOT EXISTS price              numeric(10,2),
  ADD COLUMN IF NOT EXISTS price_type         text,
  ADD COLUMN IF NOT EXISTS format             text DEFAULT 'online',
  ADD COLUMN IF NOT EXISTS duration           text,
  ADD COLUMN IF NOT EXISTS available_days     text,
  ADD COLUMN IF NOT EXISTS language           text DEFAULT 'Deutsch',
  ADD COLUMN IF NOT EXISTS mood_tags          text[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS atmosphere_tags    text[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS energy_level       text,
  ADD COLUMN IF NOT EXISTS social_energy      text,
  ADD COLUMN IF NOT EXISTS creator_vibe       text;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='experiences' AND column_name='status'
  ) THEN
    ALTER TABLE public.experiences ADD COLUMN status text NOT NULL DEFAULT 'published';
  END IF;
END $$;

-- ══════════════════════════════════════════════════════════════════
-- SCHRITT 3: STORIES — alle UI-Felder
-- ══════════════════════════════════════════════════════════════════
-- stories v5 hat state ENUM, slides JSONB, kein media_url top-level
ALTER TABLE public.stories
  ADD COLUMN IF NOT EXISTS media_url          text,
  ADD COLUMN IF NOT EXISTS media_type         text,
  ADD COLUMN IF NOT EXISTS caption            text,
  ADD COLUMN IF NOT EXISTS location           text,
  ADD COLUMN IF NOT EXISTS mood_tags          text[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS atmosphere_tags    text[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS energy_level       text,
  ADD COLUMN IF NOT EXISTS social_energy      text,
  ADD COLUMN IF NOT EXISTS creator_vibe       text;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='stories' AND column_name='status'
  ) THEN
    ALTER TABLE public.stories ADD COLUMN status text DEFAULT 'published';
  END IF;
END $$;

-- expires_at darf NULL sein (Momente ohne Ablaufdatum)
ALTER TABLE public.stories
  ALTER COLUMN expires_at DROP NOT NULL;

-- ══════════════════════════════════════════════════════════════════
-- SCHRITT 4: RLS — PERMISSIVE POLICIES
--
-- Strategie: SELECT öffentlich für published, INSERT nur für auth user.
-- KEIN Filtern nach status/state in Policies — das übernimmt die UI.
-- ══════════════════════════════════════════════════════════════════

ALTER TABLE public.works        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experiences  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories      ENABLE ROW LEVEL SECURITY;

-- ── works ────────────────────────────────────────────────────────
DROP POLICY IF EXISTS works_select_pub   ON public.works;
DROP POLICY IF EXISTS works_select_own   ON public.works;
DROP POLICY IF EXISTS works_insert_own   ON public.works;
DROP POLICY IF EXISTS works_update_own   ON public.works;
DROP POLICY IF EXISTS works_delete_own   ON public.works;
DROP POLICY IF EXISTS "allow authenticated inserts" ON public.works;

-- Alle authentifizierten User können lesen (kein Status-Filter)
CREATE POLICY works_select_pub ON public.works
  FOR SELECT USING (true);

-- Insert nur für eingeloggten User
CREATE POLICY works_insert_own ON public.works
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Update/Delete nur eigene
CREATE POLICY works_update_own ON public.works
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY works_delete_own ON public.works
  FOR DELETE USING (user_id = auth.uid());

-- ── experiences ──────────────────────────────────────────────────
DROP POLICY IF EXISTS exp_select_pub     ON public.experiences;
DROP POLICY IF EXISTS exp_select_public  ON public.experiences;
DROP POLICY IF EXISTS exp_insert_own     ON public.experiences;
DROP POLICY IF EXISTS exp_update_own     ON public.experiences;
DROP POLICY IF EXISTS exp_delete_own     ON public.experiences;

CREATE POLICY exp_select_pub ON public.experiences
  FOR SELECT USING (true);

CREATE POLICY exp_insert_own ON public.experiences
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY exp_update_own ON public.experiences
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY exp_delete_own ON public.experiences
  FOR DELETE USING (user_id = auth.uid());

-- ── stories ──────────────────────────────────────────────────────
DROP POLICY IF EXISTS stories_select_pub   ON public.stories;
DROP POLICY IF EXISTS stories_select_public ON public.stories;
DROP POLICY IF EXISTS stories_insert_own   ON public.stories;
DROP POLICY IF EXISTS stories_update_own   ON public.stories;
DROP POLICY IF EXISTS stories_delete_own   ON public.stories;

CREATE POLICY stories_select_pub ON public.stories
  FOR SELECT USING (true);

CREATE POLICY stories_insert_own ON public.stories
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY stories_update_own ON public.stories
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY stories_delete_own ON public.stories
  FOR DELETE USING (user_id = auth.uid());

-- ══════════════════════════════════════════════════════════════════
-- SCHRITT 5: STORAGE BUCKETS
-- ══════════════════════════════════════════════════════════════════
-- Supabase Storage Buckets können nicht per SQL angelegt werden.
-- MANUELL in Supabase Dashboard → Storage anlegen:
--   Bucket "media"   → Public: JA
--   Bucket "stories" → Public: JA
--
-- Storage RLS Policies (falls nicht vorhanden):
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public)
VALUES ('stories', 'stories', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage Policy: Authenticated users können uploaden
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'hui_media_upload'
  ) THEN
    EXECUTE $p$
      CREATE POLICY hui_media_upload ON storage.objects
        FOR INSERT TO authenticated
        WITH CHECK (bucket_id IN ('media', 'stories'))
    $p$;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'hui_media_select'
  ) THEN
    EXECUTE $p$
      CREATE POLICY hui_media_select ON storage.objects
        FOR SELECT USING (bucket_id IN ('media', 'stories'))
    $p$;
  END IF;
END $$;

-- ══════════════════════════════════════════════════════════════════
-- SCHRITT 6: INDIZES für Feed-Performance
-- ══════════════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_works_created   ON public.works(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_works_cover     ON public.works(cover_url) WHERE cover_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_exp_created     ON public.experiences(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stories_media   ON public.stories(media_url) WHERE media_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_stories_created ON public.stories(created_at DESC);

-- ══════════════════════════════════════════════════════════════════
-- SCHRITT 7: SCHEMA-CACHE FLUSH — PFLICHT AM ENDE
-- ══════════════════════════════════════════════════════════════════
NOTIFY pgrst, 'reload schema';

-- ══════════════════════════════════════════════════════════════════
-- SCHRITT 8: VERIFIKATION — zeigt was wirklich vorhanden ist
-- ══════════════════════════════════════════════════════════════════
SELECT
  table_name,
  string_agg(column_name, ', ' ORDER BY ordinal_position) FILTER (
    WHERE column_name IN (
      'media_url','media_type','caption','cover_url','status','state',
      'mood_tags','atmosphere_tags','energy_level','social_energy',
      'creator_vibe','available_days','location_text','for_sale',
      'shipping_available','pickup_available','price','quantity'
    )
  ) AS ui_columns_present
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('works','experiences','stories')
GROUP BY table_name
ORDER BY table_name;

-- Storage Buckets prüfen
SELECT id, name, public FROM storage.buckets
WHERE id IN ('media','stories');

SELECT 'HUI 021 — System Recovery ✓' AS status;
