-- Migration 126: Storage-Ownership-Policy-Bug fixen
-- Red-Team-Audit B.13: storage_update_own / storage_delete_own prüfen
-- auth.uid()::text = (storage.foldername(name))[1] — [1] liefert den
-- ersten Pfad-Teil (z.B. 'moments'), nicht die User-ID (die steht bei [2]).
-- Upload-Pfade im Code: moments/{user_id}/..., posts/{user_id}/...
-- Fix: [1] → [2], damit Eigentümer ihre eigenen Dateien updaten/löschen können.

-- Zuerst alte Policies droppen (falls sie existieren)
DROP POLICY IF EXISTS storage_update_own ON storage.objects;
DROP POLICY IF EXISTS storage_delete_own ON storage.objects;

-- Korrigierte Policies: foldername[2] = User-ID (Postgres-Arrays sind 1-indiziert)
-- Pfad-Format: moments/{user_id}/file.jpg → [1]='moments', [2]='{user_id}'
CREATE POLICY storage_update_own ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid()::text = (storage.foldername(name))[2]
  );

CREATE POLICY storage_delete_own ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    auth.uid()::text = (storage.foldername(name))[2]
  );

-- Dokumentation:
-- Diese Policies gelten für alle Buckets. Falls ein Bucket explizite
-- Ownership-Prüfungen benötigt, können Bucket-spezifische Policies
-- zusätzlich angelegt werden (mit USING bucket_id = 'bucket_name' AND ...).
