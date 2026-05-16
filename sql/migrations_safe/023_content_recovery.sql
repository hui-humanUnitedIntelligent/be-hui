-- ═══════════════════════════════════════════════════════════════════
-- HUI 023: CONTENT RECOVERY — findet und repariert alle vorhandenen Inhalte
-- Idempotent. Mehrfach sicher. Keine Daten werden gelöscht.
-- ═══════════════════════════════════════════════════════════════════

-- ══════════════════════════════════════════════════════════════════
-- 1. FEHLENDE STORAGE BUCKETS anlegen
--    (älterer Code uploadete in "works", "experiences" Buckets)
-- ══════════════════════════════════════════════════════════════════
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('works',       'works',       true, 52428800, ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/gif','video/mp4','video/webm','video/quicktime']),
  ('experiences', 'experiences', true, 52428800, ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/gif','video/mp4','video/webm','video/quicktime']),
  ('media',       'media',       true, 52428800, ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/gif','video/mp4','video/webm','video/quicktime']),
  ('stories',     'stories',     true, 52428800, ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/gif','video/mp4','video/webm','video/quicktime'])
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 52428800;

-- Storage RLS — alle 4 Buckets
DO $$ 
DECLARE b text;
BEGIN
  FOREACH b IN ARRAY ARRAY['media','stories','works','experiences'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS hui_upload_%s ON storage.objects', b);
    EXECUTE format('DROP POLICY IF EXISTS hui_select_%s ON storage.objects', b);
    EXECUTE format(
      'CREATE POLICY hui_upload_%s ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = %L)',
      b, b);
    EXECUTE format(
      'CREATE POLICY hui_select_%s ON storage.objects FOR SELECT USING (bucket_id = %L)',
      b, b);
  END LOOP;
END $$;

-- ══════════════════════════════════════════════════════════════════
-- 2. WORKS — status NULL → published setzen
-- ══════════════════════════════════════════════════════════════════
UPDATE public.works
SET status = 'published'
WHERE status IS NULL OR status = '';

-- media_url aus cover_url recovern wenn media_url fehlt
UPDATE public.works
SET media_url = cover_url
WHERE media_url IS NULL AND cover_url IS NOT NULL;

-- media_url aus images[0] recovern
UPDATE public.works
SET media_url = images[1]
WHERE media_url IS NULL AND images IS NOT NULL AND array_length(images, 1) > 0;

SELECT 'works recovery:' AS step, COUNT(*) AS total_works,
       COUNT(*) FILTER (WHERE status='published') AS published,
       COUNT(*) FILTER (WHERE media_url IS NOT NULL) AS with_media
FROM public.works;

-- ══════════════════════════════════════════════════════════════════
-- 3. EXPERIENCES — location → location_text (alter Code)
-- ══════════════════════════════════════════════════════════════════
-- Falls 'location' Spalte existiert und location_text noch NULL:
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='experiences' AND column_name='location')
  AND EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='experiences' AND column_name='location_text')
  THEN
    UPDATE public.experiences
    SET location_text = location::text
    WHERE location_text IS NULL AND location IS NOT NULL;
    RAISE NOTICE 'experiences: location → location_text migriert';
  END IF;
END $$;

UPDATE public.experiences
SET status = 'published'
WHERE status IS NULL OR status = '';

UPDATE public.experiences
SET media_url = cover_url
WHERE media_url IS NULL AND cover_url IS NOT NULL;

SELECT 'experiences recovery:' AS step, COUNT(*) AS total,
       COUNT(*) FILTER (WHERE status='published') AS published
FROM public.experiences;

-- ══════════════════════════════════════════════════════════════════
-- 4. STORIES — media_url Recovery
-- ══════════════════════════════════════════════════════════════════
UPDATE public.stories
SET status = 'published'
WHERE status IS NULL OR status = '';

-- Wenn media_id vorhanden aber media_url fehlt: URL aus media-Tabelle recovern
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='stories' AND column_name='media_id')
  AND EXISTS (SELECT 1 FROM information_schema.tables
    WHERE table_schema='public' AND table_name='media')
  THEN
    UPDATE public.stories s
    SET media_url = m.storage_path
    FROM public.media m
    WHERE s.media_id = m.id
      AND s.media_url IS NULL
      AND m.storage_path IS NOT NULL;
    RAISE NOTICE 'stories: media_url aus media-Tabelle recovered';
  END IF;
END $$;

SELECT 'stories recovery:' AS step, COUNT(*) AS total,
       COUNT(*) FILTER (WHERE status='published') AS published,
       COUNT(*) FILTER (WHERE media_url IS NOT NULL) AS with_media,
       COUNT(*) FILTER (WHERE media_url IS NULL) AS text_only
FROM public.stories;

-- ══════════════════════════════════════════════════════════════════
-- 5. VOLLSTÄNDIGE DATEN-ÜBERSICHT — alle vorhandenen Inhalte
-- ══════════════════════════════════════════════════════════════════
SELECT '=== ALLE WORKS ===' AS info;
SELECT id, title, status, 
       CASE WHEN media_url IS NOT NULL THEN '✓ media' ELSE '✗ no media' END AS media_check,
       LEFT(media_url, 60) AS media_url_preview,
       created_at::date AS date,
       user_id
FROM public.works
ORDER BY created_at DESC
LIMIT 20;

SELECT '=== ALLE EXPERIENCES ===' AS info;
SELECT id, title, status, location_text,
       CASE WHEN media_url IS NOT NULL THEN '✓ media' ELSE '✗ no media' END AS media_check,
       created_at::date AS date
FROM public.experiences
ORDER BY created_at DESC
LIMIT 20;

SELECT '=== ALLE STORIES ===' AS info;
SELECT id, 
       COALESCE(text_overlay, caption, '(kein Text)') AS content,
       status,
       CASE WHEN media_url IS NOT NULL THEN '✓ ' || LEFT(media_url,40) ELSE '✗ no media' END AS media_check,
       created_at::date AS date
FROM public.stories
ORDER BY created_at DESC
LIMIT 20;

-- ══════════════════════════════════════════════════════════════════
-- 6. STORAGE FILES — was wirklich hochgeladen wurde
-- ══════════════════════════════════════════════════════════════════
SELECT '=== STORAGE FILES ===' AS info;
SELECT bucket_id, name, 
       right(name, 40) AS filename,
       (metadata->>'size')::bigint / 1024 AS size_kb,
       created_at::date AS date,
       'https://' || (SELECT url FROM storage.buckets WHERE id = bucket_id LIMIT 1) AS public_url_base
FROM storage.objects
WHERE bucket_id IN ('media','stories','works','experiences')
ORDER BY created_at DESC
LIMIT 30;

-- Einfachere Variante falls obiges nicht klappt:
SELECT bucket_id, COUNT(*) AS files, MAX(created_at) AS last_upload
FROM storage.objects
GROUP BY bucket_id
ORDER BY last_upload DESC;

-- ══════════════════════════════════════════════════════════════════
-- 7. SUPABASE URL für public URLs
-- ══════════════════════════════════════════════════════════════════
-- Public URL Format: https://{project-ref}.supabase.co/storage/v1/object/public/{bucket}/{path}
-- Den project-ref findest du in Supabase Dashboard → Settings → API → Project URL
SELECT 'Supabase URL für Storage-Dateien:' AS hinweis,
       'https://[DEIN-PROJECT-REF].supabase.co/storage/v1/object/public/media/[PFAD]' AS url_format;

-- ══════════════════════════════════════════════════════════════════
-- 8. SCHEMA CACHE FLUSH
-- ══════════════════════════════════════════════════════════════════
NOTIFY pgrst, 'reload schema';

SELECT 'HUI 023 abgeschlossen ✓' AS result, NOW() AS ts;
