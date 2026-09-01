-- hui_143_video_thumbnail_columns.sql
-- ══════════════════════════════════════════════════════════════════════
-- VIDEO-THUMBNAIL-FEATURE (2026-08-31, Michael-Vorgabe)
-- "Video-Thumbnail-Auswahl bei ALLEN Upload-Flows mit Video"
--
-- works.thumbnail_url existiert bereits (ungenutzte Altspalte, wird ab
-- jetzt erstmals bespielt). beitraege/experiences/talents brauchen die
-- Spalte neu. Rein additiv, keine bestehenden Spalten/Constraints berührt.
-- Ausgeführt via Supabase Management API (SUPABASE_ACCESS_TOKEN_2) analog
-- zu Migration 142 -- Michael führt Admin-Migrationen sonst selbst via
-- hui_admin_role-Cookie im SQL-Editor aus, dieser Weg ist das Agent-
-- Äquivalent mit Service-Role-Rechten.
-- ══════════════════════════════════════════════════════════════════════

ALTER TABLE public.beitraege   ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
ALTER TABLE public.experiences ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
ALTER TABLE public.talents     ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

COMMENT ON COLUMN public.beitraege.thumbnail_url   IS 'Extrahiertes Video-Frame als statisches Titelbild (Momente). NULL = kein Video oder Foto/Gedanke.';
COMMENT ON COLUMN public.experiences.thumbnail_url IS 'Extrahiertes Video-Frame als statisches Titelbild, wenn cover_url/media_url ein Video ist.';
COMMENT ON COLUMN public.talents.thumbnail_url     IS 'Extrahiertes Video-Frame als statisches Titelbild, wenn images[0] ein Video ist.';
