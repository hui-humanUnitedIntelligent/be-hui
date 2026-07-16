-- ═══════════════════════════════════════════════════════════════
-- HUI Migration 044 — Storage Policy für works/ Pfad im media Bucket
-- ═══════════════════════════════════════════════════════════════
-- PROBLEM:
--   media/works/{uid}/... hat keine INSERT-Policy.
--   Upload schlägt still fehl → cover_url bleibt null.
--
-- LÖSUNG:
--   Analoge Policy wie moments/, avatars/, covers/.
--   Pfad: works/{auth.uid()}/filename
--
-- SICHERHEIT:
--   - TO authenticated (kein anonymer Upload)
--   - (storage.foldername(name))[2] = auth.uid()::text
--     → User kann NUR in eigenen Unterordner schreiben
-- IDEMPOTENT: DROP IF EXISTS + CREATE
-- ═══════════════════════════════════════════════════════════════

-- ── 1. works/{uid}/... INSERT ─────────────────────────────────
DROP POLICY IF EXISTS "media_works_upload_own" ON storage.objects;
CREATE POLICY "media_works_upload_own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'media'
    AND (storage.foldername(name))[1] = 'works'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

-- ── 2. UPDATE-Recht (für upsert:true) ────────────────────────
DROP POLICY IF EXISTS "media_works_update_own" ON storage.objects;
CREATE POLICY "media_works_update_own" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'media'
    AND (storage.foldername(name))[1] = 'works'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

-- ── 3. Public READ für works-Bilder ──────────────────────────
DROP POLICY IF EXISTS "media_works_public_read" ON storage.objects;
CREATE POLICY "media_works_public_read" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'media'
    AND (storage.foldername(name))[1] = 'works'
  );

-- ── 4. Schema-Cache invalidieren ─────────────────────────────
NOTIFY pgrst, 'reload schema';

-- ═══════════════════════════════════════════════════════════════
-- VERIFY:
--   SELECT policyname, cmd FROM pg_policies
--   WHERE tablename='objects' AND schemaname='storage'
--   AND policyname LIKE 'media_works%';
-- ═══════════════════════════════════════════════════════════════
