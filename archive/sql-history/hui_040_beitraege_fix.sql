-- ═══════════════════════════════════════════════════════════════
-- HUI Migration 040 — beitraege.src nullable + media Bucket Policies
-- Erstellt: 2026-05-29
-- 
-- ANALYSE:
--   beitraege ist eine echte Tabelle (nicht View, nicht materialized view)
--   Schema: id(uuid PK), user_id(uuid), src(text NOT NULL), type, caption, created_at
--   RLS: SELECT public, INSERT own (auth.uid() = user_id)
--   Storage: 'media' bucket existiert (public, kein Limit)
--
-- PROBLEM:
--   src ist NOT NULL — aber Gedanken haben kein Medium → Insert schlägt fehl
--   Storage bucket 'beitraege'/'hui-moments' existieren nicht
--   → Upload scheitert → src bleibt null → NOT NULL verletzt → kein Insert
--
-- LÖSUNG:
--   1. src nullable machen (Gedanken haben kein Bild — das ist valide)
--   2. INSERT Policy stärken (authenticated statt public)
--   3. Storage-Policy auf 'media' bucket für beitraege-Uploads
-- 
-- SICHERHEIT:
--   KEINE Tabelle wird gelöscht oder neu erstellt
--   KEINE Daten gehen verloren
--   Nur ALTER COLUMN + Policy-Updates
-- ═══════════════════════════════════════════════════════════════

-- 1. src nullable machen (Gedanken haben kein Bild)
ALTER TABLE public.beitraege
  ALTER COLUMN src DROP NOT NULL;

-- 2. RLS Policies aktualisieren (cleaner naming)
ALTER TABLE public.beitraege ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read beitraege"      ON public.beitraege;
DROP POLICY IF EXISTS "Users can insert own beitraege" ON public.beitraege;
DROP POLICY IF EXISTS beit_select_all                  ON public.beitraege;
DROP POLICY IF EXISTS beit_insert_own                  ON public.beitraege;
DROP POLICY IF EXISTS beitraege_public_read            ON public.beitraege;

CREATE POLICY beitraege_select ON public.beitraege
  FOR SELECT USING (true);

CREATE POLICY beitraege_insert ON public.beitraege
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 3. Storage-Policy: 'media' bucket für Beiträge-Uploads
--    Pfad: beitraege/{user_id}/{timestamp}.{ext}
DROP POLICY IF EXISTS "beitraege_upload" ON storage.objects;
CREATE POLICY "beitraege_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'media'
    AND (storage.foldername(name))[1] = 'beitraege'
  );

DROP POLICY IF EXISTS "beitraege_media_read" ON storage.objects;
CREATE POLICY "beitraege_media_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'media');

-- 4. Realtime für beitraege aktivieren
ALTER PUBLICATION supabase_realtime ADD TABLE public.beitraege;

-- 5. Schema reload
NOTIFY pgrst, 'reload schema';

-- VERIFY:
-- SELECT column_name, is_nullable FROM information_schema.columns
--   WHERE table_name = 'beitraege';
-- SELECT COUNT(*) FROM beitraege;
-- SELECT policyname FROM pg_policies WHERE tablename = 'beitraege';
