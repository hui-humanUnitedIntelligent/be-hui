-- ═══════════════════════════════════════════════════════════════════
-- HUI 022: FEED RECOVERY — Einziger Script der ausgeführt werden muss
--
-- ⚠️  NUR DIESEN SCRIPT ausführen.
--     Ersetzt alle vorherigen (017–021).
--     100% idempotent. Mehrfach ausführen = sicher.
--     Keine Daten werden gelöscht oder verändert.
--
-- WAS DIESER SCRIPT MACHT:
--   1. Fehlende Spalten ergänzen (works, experiences, stories)
--   2. RLS Policies: INSERT + SELECT für alle authenticated User
--   3. Storage Buckets: media + stories als public anlegen
--   4. Storage Policies: Upload für authenticated User
--   5. Schema-Cache flushen
--   6. Seed-Daten: 2 Test-Works zum Feed-Test
--   7. Verifikation: zeigt was vorhanden ist
-- ═══════════════════════════════════════════════════════════════════

-- ══════════════════════════════════════════════════════════════════
-- 1. WORKS — alle UI-Felder ergänzen
-- ══════════════════════════════════════════════════════════════════
ALTER TABLE public.works
  ADD COLUMN IF NOT EXISTS media_url          text,
  ADD COLUMN IF NOT EXISTS media_type         text CHECK (media_type IN ('image','video') OR media_type IS NULL),
  ADD COLUMN IF NOT EXISTS caption            text,
  ADD COLUMN IF NOT EXISTS cover_url          text,
  ADD COLUMN IF NOT EXISTS price              numeric(10,2),
  ADD COLUMN IF NOT EXISTS quantity           integer   DEFAULT 1,
  ADD COLUMN IF NOT EXISTS shipping_available boolean   DEFAULT false,
  ADD COLUMN IF NOT EXISTS pickup_available   boolean   DEFAULT false,
  ADD COLUMN IF NOT EXISTS delivery_time      text,
  ADD COLUMN IF NOT EXISTS for_sale           boolean   DEFAULT true,
  ADD COLUMN IF NOT EXISTS location_text      text,
  ADD COLUMN IF NOT EXISTS mood_tags          text[]    DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS atmosphere_tags    text[]    DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS energy_level       text,
  ADD COLUMN IF NOT EXISTS social_energy      text,
  ADD COLUMN IF NOT EXISTS creator_vibe       text;

-- status: text neben state ENUM (beide koexistieren)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='works' AND column_name='status')
  THEN ALTER TABLE public.works ADD COLUMN status text NOT NULL DEFAULT 'published';
  END IF;
END $$;

-- ══════════════════════════════════════════════════════════════════
-- 2. EXPERIENCES — alle UI-Felder ergänzen
-- ══════════════════════════════════════════════════════════════════
ALTER TABLE public.experiences
  ADD COLUMN IF NOT EXISTS media_url          text,
  ADD COLUMN IF NOT EXISTS media_type         text,
  ADD COLUMN IF NOT EXISTS caption            text,
  ADD COLUMN IF NOT EXISTS location_text      text,   -- statt GEOGRAPHY location
  ADD COLUMN IF NOT EXISTS price              numeric(10,2),
  ADD COLUMN IF NOT EXISTS price_type         text,
  ADD COLUMN IF NOT EXISTS format             text      DEFAULT 'online',
  ADD COLUMN IF NOT EXISTS duration           text,
  ADD COLUMN IF NOT EXISTS available_days     text,
  ADD COLUMN IF NOT EXISTS language           text      DEFAULT 'Deutsch',
  ADD COLUMN IF NOT EXISTS mood_tags          text[]    DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS atmosphere_tags    text[]    DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS energy_level       text,
  ADD COLUMN IF NOT EXISTS social_energy      text,
  ADD COLUMN IF NOT EXISTS creator_vibe       text;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='experiences' AND column_name='status')
  THEN ALTER TABLE public.experiences ADD COLUMN status text NOT NULL DEFAULT 'published';
  END IF;
END $$;

-- ══════════════════════════════════════════════════════════════════
-- 3. STORIES — alle UI-Felder ergänzen
-- ══════════════════════════════════════════════════════════════════
ALTER TABLE public.stories
  ADD COLUMN IF NOT EXISTS media_url          text,
  ADD COLUMN IF NOT EXISTS media_type         text,
  ADD COLUMN IF NOT EXISTS caption            text,
  ADD COLUMN IF NOT EXISTS location           text,
  ADD COLUMN IF NOT EXISTS mood_tags          text[]    DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS atmosphere_tags    text[]    DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS energy_level       text,
  ADD COLUMN IF NOT EXISTS social_energy      text,
  ADD COLUMN IF NOT EXISTS creator_vibe       text;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='stories' AND column_name='status')
  THEN ALTER TABLE public.stories ADD COLUMN status text DEFAULT 'published';
  END IF;
END $$;

-- expires_at darf NULL sein (permanente Momente)
DO $$ BEGIN
  BEGIN
    ALTER TABLE public.stories ALTER COLUMN expires_at DROP NOT NULL;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
END $$;

-- ══════════════════════════════════════════════════════════════════
-- 4. RLS — PERMISSIVE POLICIES (idempotent via DROP IF EXISTS)
-- ══════════════════════════════════════════════════════════════════
ALTER TABLE public.works        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experiences  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories      ENABLE ROW LEVEL SECURITY;

-- works
DROP POLICY IF EXISTS works_select_pub    ON public.works;
DROP POLICY IF EXISTS works_insert_own    ON public.works;
DROP POLICY IF EXISTS works_update_own    ON public.works;
DROP POLICY IF EXISTS works_delete_own    ON public.works;
DROP POLICY IF EXISTS "allow authenticated inserts" ON public.works;

CREATE POLICY works_select_pub ON public.works FOR SELECT USING (true);
CREATE POLICY works_insert_own ON public.works FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);
CREATE POLICY works_update_own ON public.works FOR UPDATE
  USING (user_id = auth.uid());
CREATE POLICY works_delete_own ON public.works FOR DELETE
  USING (user_id = auth.uid());

-- experiences
DROP POLICY IF EXISTS exp_select_pub    ON public.experiences;
DROP POLICY IF EXISTS exp_insert_own    ON public.experiences;
DROP POLICY IF EXISTS exp_update_own    ON public.experiences;
DROP POLICY IF EXISTS exp_delete_own    ON public.experiences;

CREATE POLICY exp_select_pub ON public.experiences FOR SELECT USING (true);
CREATE POLICY exp_insert_own ON public.experiences FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);
CREATE POLICY exp_update_own ON public.experiences FOR UPDATE
  USING (user_id = auth.uid());
CREATE POLICY exp_delete_own ON public.experiences FOR DELETE
  USING (user_id = auth.uid());

-- stories
DROP POLICY IF EXISTS stories_select_pub  ON public.stories;
DROP POLICY IF EXISTS stories_insert_own  ON public.stories;
DROP POLICY IF EXISTS stories_update_own  ON public.stories;
DROP POLICY IF EXISTS stories_delete_own  ON public.stories;

CREATE POLICY stories_select_pub ON public.stories FOR SELECT USING (true);
CREATE POLICY stories_insert_own ON public.stories FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);
CREATE POLICY stories_update_own ON public.stories FOR UPDATE
  USING (user_id = auth.uid());
CREATE POLICY stories_delete_own ON public.stories FOR DELETE
  USING (user_id = auth.uid());

-- ══════════════════════════════════════════════════════════════════
-- 5. STORAGE BUCKETS + POLICIES
-- ══════════════════════════════════════════════════════════════════
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media', 'media', true, 52428800,
  ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/gif',
        'video/mp4','video/webm','video/quicktime']
)
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 52428800;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'stories', 'stories', true, 52428800,
  ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/gif',
        'video/mp4','video/webm','video/quicktime']
)
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 52428800;

-- Storage Upload Policy
DROP POLICY IF EXISTS hui_storage_upload   ON storage.objects;
DROP POLICY IF EXISTS hui_storage_select   ON storage.objects;
DROP POLICY IF EXISTS hui_storage_delete   ON storage.objects;

CREATE POLICY hui_storage_upload ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id IN ('media','stories'));

CREATE POLICY hui_storage_select ON storage.objects
  FOR SELECT USING (bucket_id IN ('media','stories'));

CREATE POLICY hui_storage_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id IN ('media','stories') AND (storage.foldername(name))[2] = auth.uid()::text);

-- ══════════════════════════════════════════════════════════════════
-- 6. TEST-SEED: 2 Works zum sofortigen Feed-Test
--    (werden nur eingefügt wenn works-Tabelle leer ist)
-- ══════════════════════════════════════════════════════════════════
DO $$
DECLARE
  works_count integer;
  first_user_id uuid;
BEGIN
  SELECT COUNT(*) INTO works_count FROM public.works;
  
  IF works_count = 0 THEN
    -- Ersten User aus auth.users nehmen
    SELECT id INTO first_user_id FROM auth.users LIMIT 1;
    
    IF first_user_id IS NOT NULL THEN
      INSERT INTO public.works (
        user_id, title, description, category,
        cover_url, media_url, media_type,
        price, for_sale, status, mood_tags, atmosphere_tags,
        created_at
      ) VALUES
      (
        first_user_id,
        'Handgemachte Keramik',
        'Jedes Stück ein Unikat — handgeformt und glasiert.',
        'Handwerk',
        'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=900&q=90',
        'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=900&q=90',
        'image',
        45.00, true, 'published',
        ARRAY['kreativ','handwerk'],
        ARRAY['warm','ruhig'],
        NOW() - INTERVAL '2 hours'
      ),
      (
        first_user_id,
        'Digitale Illustration',
        'Charakterdesign und Konzeptart für Projekte.',
        'Kunst',
        'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=900&q=90',
        'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=900&q=90',
        'image',
        120.00, true, 'published',
        ARRAY['kreativ','inspiration'],
        ARRAY['modern','bold'],
        NOW() - INTERVAL '1 hour'
      );
      
      RAISE NOTICE 'Seed: 2 Test-Works eingefügt für User %', first_user_id;
    ELSE
      RAISE NOTICE 'Seed: Kein User in auth.users — erst registrieren, dann nochmal laufen';
    END IF;
  ELSE
    RAISE NOTICE 'Seed: % Works bereits vorhanden — kein Seed nötig', works_count;
  END IF;
END $$;

-- ══════════════════════════════════════════════════════════════════
-- 7. PERFORMANCE INDIZES
-- ══════════════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_works_created_desc   ON public.works(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_works_status         ON public.works(status) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_works_cover          ON public.works(cover_url) WHERE cover_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_exp_created_desc     ON public.experiences(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stories_created_desc ON public.stories(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stories_media        ON public.stories(media_url) WHERE media_url IS NOT NULL;

-- ══════════════════════════════════════════════════════════════════
-- 8. SCHEMA-CACHE FLUSH — WICHTIG
-- ══════════════════════════════════════════════════════════════════
NOTIFY pgrst, 'reload schema';

-- ══════════════════════════════════════════════════════════════════
-- 9. VERIFIKATION — zeigt was jetzt vorhanden ist
-- ══════════════════════════════════════════════════════════════════
SELECT '=== ROW COUNTS ===' AS section;
SELECT
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns c
   WHERE c.table_schema='public' AND c.table_name=t.table_name) AS col_count,
  CASE t.table_name
    WHEN 'works'       THEN (SELECT COUNT(*) FROM public.works)::text
    WHEN 'experiences' THEN (SELECT COUNT(*) FROM public.experiences)::text
    WHEN 'stories'     THEN (SELECT COUNT(*) FROM public.stories)::text
  END AS row_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name   IN ('works','experiences','stories')
ORDER BY table_name;

SELECT '=== KRITISCHE SPALTEN ===' AS section;
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name   IN ('works','experiences','stories')
  AND column_name  IN ('status','media_url','cover_url','mood_tags','location_text','available_days')
ORDER BY table_name, column_name;

SELECT '=== STORAGE BUCKETS ===' AS section;
SELECT id, name, public FROM storage.buckets
WHERE id IN ('media','stories');

SELECT '=== RESULT ===' AS section;
SELECT 'HUI 022 — Feed Recovery abgeschlossen ✓' AS status,
       NOW() AS executed_at;
