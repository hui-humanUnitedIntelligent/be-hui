-- ═══════════════════════════════════════════════════════════════
-- HUI Migration 043 — Storage Policies für media Bucket
-- ═══════════════════════════════════════════════════════════════
-- PROBLEM:
--   Moments-Upload schlägt fehl weil keine INSERT-Policy für
--   Pfad "moments/{uid}/..." im "media"-Bucket existiert.
--   Dasselbe gilt für "avatars/{uid}/..." und "covers/{uid}/...".
--
-- BEWEIS:
--   Einzige existierende INSERT-Policy für media:
--     "beitraege_upload": (foldername)[1] = 'beitraege'
--   Upload-Fehler → catch() fängt Error →
--   onChange() nie aufgerufen → dna_tags bleibt [] in DB
--
-- LÖSUNG:
--   Separate, sichere Policy pro Pfad-Typ:
--     moments/{auth.uid()}/...  → nur eigener Ordner
--     avatars/{auth.uid()}/...  → nur eigener Ordner
--     covers/{auth.uid()}/...   → nur eigener Ordner
--
-- SICHERHEIT:
--   - Nur TO authenticated (kein anonymer Upload)
--   - (storage.foldername(name))[2] = auth.uid()::text
--     → Tier-1: media/moments/  Tier-2: userId  Tier-3: file
--     → User kann NUR in eigenen Unterordner schreiben
--   - Bestehende "beitraege_upload" Policy bleibt unverändert
--   - Keine DROP auf bestehende Policies
--   - Kein öffentliches Schreiben
--
-- IDEMPOTENT: DROP IF EXISTS + CREATE
-- ═══════════════════════════════════════════════════════════════

-- ── 1. moments/{uid}/... ──────────────────────────────────────
DROP POLICY IF EXISTS "media_moments_upload_own" ON storage.objects;
CREATE POLICY "media_moments_upload_own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'media'
    AND (storage.foldername(name))[1] = 'moments'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

-- ── 2. avatars/{uid}/... ──────────────────────────────────────
DROP POLICY IF EXISTS "media_avatars_upload_own" ON storage.objects;
CREATE POLICY "media_avatars_upload_own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'media'
    AND (storage.foldername(name))[1] = 'avatars'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

-- ── 3. covers/{uid}/... ───────────────────────────────────────
DROP POLICY IF EXISTS "media_covers_upload_own" ON storage.objects;
CREATE POLICY "media_covers_upload_own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'media'
    AND (storage.foldername(name))[1] = 'covers'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

-- ── 4. UPSERT-Support (gleiche Paths, FOR UPDATE) ────────────
--   uploadProfileImage verwendet upsert:true → braucht auch UPDATE-Recht
DROP POLICY IF EXISTS "media_profile_update_own" ON storage.objects;
CREATE POLICY "media_profile_update_own" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'media'
    AND (storage.foldername(name))[1] IN ('moments', 'avatars', 'covers')
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

-- ── 5. Schema-Cache invalidieren ─────────────────────────────
NOTIFY pgrst, 'reload schema';

-- ═══════════════════════════════════════════════════════════════
-- VERIFY nach Ausführung:
--   SELECT policyname, cmd, qual
--   FROM pg_policies
--   WHERE tablename = 'objects'
--   AND schemaname = 'storage'
--   AND policyname LIKE 'media_%'
--   ORDER BY policyname;
--
-- Erwartetes Ergebnis (5 Policies):
--   media_avatars_upload_own  — INSERT
--   media_covers_upload_own   — INSERT
--   media_moments_upload_own  — INSERT
--   media_profile_update_own  — UPDATE
--   beitraege_upload          — INSERT (unverändert, bleibt)
--   beitraege_media_read      — SELECT (unverändert, bleibt)
-- ═══════════════════════════════════════════════════════════════
