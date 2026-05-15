-- ═══════════════════════════════════════════════════════════════════
-- HUI DIAGNOSE SQL — Im Supabase SQL Editor ausführen
-- Zeigt exakt warum der Feed leer ist.
-- Kein ALTER, kein DROP — nur SELECT/INSPECT.
-- ═══════════════════════════════════════════════════════════════════

-- ══════════════════════════════════════════════════════════════════
-- 1. TABELLEN EXISTIEREN?
-- ══════════════════════════════════════════════════════════════════
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('works','experiences','stories','profiles','wirker_profiles','feed_items')
ORDER BY table_name;

-- ══════════════════════════════════════════════════════════════════
-- 2. ROW COUNTS — ohne RLS (als Admin)
-- ══════════════════════════════════════════════════════════════════
SELECT 'works'         AS tbl, COUNT(*) AS rows FROM public.works
UNION ALL
SELECT 'experiences',           COUNT(*) FROM public.experiences
UNION ALL
SELECT 'stories',               COUNT(*) FROM public.stories
UNION ALL
SELECT 'profiles',              COUNT(*) FROM public.profiles
UNION ALL
SELECT 'wirker_profiles',       COUNT(*) FROM public.wirker_profiles
ORDER BY tbl;

-- ══════════════════════════════════════════════════════════════════
-- 3. KRITISCHE SPALTEN VORHANDEN?
-- ══════════════════════════════════════════════════════════════════
SELECT
  table_name,
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name   IN ('works','experiences','stories')
  AND column_name  IN (
    'id','title','user_id','status','state',
    'media_url','cover_url','mood_tags','atmosphere_tags',
    'energy_level','social_energy','creator_vibe',
    'available_days','location_text','for_sale',
    'shipping_available','pickup_available','price',
    'caption','location'
  )
ORDER BY table_name, column_name;

-- ══════════════════════════════════════════════════════════════════
-- 4. FEHLENDE SPALTEN — was noch nicht existiert
-- ══════════════════════════════════════════════════════════════════
WITH required AS (
  SELECT 'works'       AS tbl, 'status'           AS col UNION ALL
  SELECT 'works',              'media_url'               UNION ALL
  SELECT 'works',              'cover_url'               UNION ALL
  SELECT 'works',              'mood_tags'               UNION ALL
  SELECT 'works',              'atmosphere_tags'         UNION ALL
  SELECT 'works',              'for_sale'                UNION ALL
  SELECT 'experiences',        'status'                  UNION ALL
  SELECT 'experiences',        'available_days'          UNION ALL
  SELECT 'experiences',        'location_text'           UNION ALL
  SELECT 'experiences',        'mood_tags'               UNION ALL
  SELECT 'experiences',        'media_url'               UNION ALL
  SELECT 'stories',            'status'                  UNION ALL
  SELECT 'stories',            'media_url'               UNION ALL
  SELECT 'stories',            'mood_tags'               UNION ALL
  SELECT 'stories',            'location'
)
SELECT r.tbl, r.col, 'FEHLT ✗' AS status_check
FROM required r
WHERE NOT EXISTS (
  SELECT 1 FROM information_schema.columns c
  WHERE c.table_schema = 'public'
    AND c.table_name   = r.tbl
    AND c.column_name  = r.col
)
ORDER BY r.tbl, r.col;
-- Kein Output = alles vorhanden ✓

-- ══════════════════════════════════════════════════════════════════
-- 5. RLS POLICIES — welche existieren?
-- ══════════════════════════════════════════════════════════════════
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename  IN ('works','experiences','stories')
ORDER BY tablename, cmd;

-- ══════════════════════════════════════════════════════════════════
-- 6. RLS ENABLED? 
-- ══════════════════════════════════════════════════════════════════
SELECT
  relname AS table_name,
  relrowsecurity AS rls_enabled,
  relforcerowsecurity AS rls_forced
FROM pg_class
WHERE relname IN ('works','experiences','stories')
  AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname='public');

-- ══════════════════════════════════════════════════════════════════
-- 7. NEUESTE ROWS — sehen ob Daten da
-- ══════════════════════════════════════════════════════════════════
SELECT 'works' AS src, id, title, created_at,
       (SELECT column_name FROM information_schema.columns
        WHERE table_name='works' AND column_name='status' LIMIT 1) AS has_status_col
FROM public.works ORDER BY created_at DESC LIMIT 5;

SELECT 'experiences' AS src, id, title, created_at
FROM public.experiences ORDER BY created_at DESC LIMIT 5;

SELECT 'stories' AS src, id, media_url, created_at
FROM public.stories ORDER BY created_at DESC LIMIT 5;

-- ══════════════════════════════════════════════════════════════════
-- 8. STORAGE BUCKETS
-- ══════════════════════════════════════════════════════════════════
SELECT id, name, public, file_size_limit, created_at
FROM storage.buckets
WHERE id IN ('media','stories')
ORDER BY id;

-- Wenn leer: Buckets fehlen → Upload schlägt fehl

-- ══════════════════════════════════════════════════════════════════
-- 9. STORAGE POLICIES
-- ══════════════════════════════════════════════════════════════════
SELECT policyname, cmd, roles, qual
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename  = 'objects'
ORDER BY policyname;

-- ══════════════════════════════════════════════════════════════════
-- 10. ZUSAMMENFASSUNG — was muss als nächstes passieren
-- ══════════════════════════════════════════════════════════════════
SELECT
  CASE
    WHEN NOT EXISTS (SELECT 1 FROM public.works LIMIT 1)
     AND NOT EXISTS (SELECT 1 FROM public.experiences LIMIT 1)
     AND NOT EXISTS (SELECT 1 FROM public.stories LIMIT 1)
    THEN '❌ ALLE TABELLEN LEER — erst Daten publizieren, dann Feed prüfen'

    WHEN NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='works' AND column_name='status')
    THEN '❌ SPALTEN FEHLEN — Migration 021 ausführen: supabase/021_system_recovery.sql'

    WHEN NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE tablename='works' AND cmd='SELECT')
    THEN '❌ KEINE SELECT-POLICY — Migration 021 ausführen: supabase/021_system_recovery.sql'

    WHEN NOT EXISTS (
      SELECT 1 FROM storage.buckets WHERE id='media')
    THEN '❌ STORAGE BUCKET "media" FEHLT — Migration 021 ausführen'

    ELSE '✅ DB-Struktur OK — Feed-Problem liegt im Frontend (Logs prüfen)'
  END AS diagnose_ergebnis;
