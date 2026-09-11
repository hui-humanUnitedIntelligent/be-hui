-- Migration 136 (2026-09-11): VIDEO-BROADCAST — Trailer + YouTube-Link
--
-- KONTEXT (Michael-Prompt 15:28): Admins posten im SADB Broadcast 3 Komponenten:
--   1. Trailer-Video (Datei-Upload, beliebig lang, max 500MB)
--   2. YouTube-Link (vollstaendiger Film)
--   3. Text (Description)
-- Der HUI-Bot (myHUI-Systemprofil, der Fuchs) postet daraufhin einen Feed-Moment
-- mit Trailer-Video + Text + klickbarem YouTube-Link.
--
-- ARCHITEKTUR-ENTSCHEIDUNG (ARCHITEKTUR-CHARTA: "Evolution statt Rewrite",
-- "Keine konkurrierenden Zustaendigkeiten"): Es existiert bereits eine
-- Broadcast->Feed-Pipeline: trg_broadcast_to_beitrag (Statement-Trigger auf
-- notifications, Migration 110, 2026-08-13) postet JEDE SADB-Broadcast-Nachricht
-- als beitraege-Row (myHUI-Systemprofil, moment_source='system_broadcast') in
-- den Feed — synchron und transaktional. Der Prompt sieht alternativ eine
-- scheduled Edge Function mit posted_by_bot-Flag + Retry vor ("laeuft scheduled
-- ODER wird direkt nach Broadcast-POST getriggert") — die bestehende Trigger-
-- Loesung IST die "direkt getriggerte" Variante und ist strikt besser:
-- kein Cron, kein Retry, keine Duplikat-Flag-Verwaltung, transaktional mit dem
-- notifications-Insert. Wir ERWEITERN den bestehenden Trigger statt eine zweite
-- parallele Pipeline zu bauen.
--
-- ERGEBNIS: Der Bot-Post ist ein VIDEO-Moment (beitraege.type='video', src=
-- Trailer-Storage-URL) statt eines reinen Gedankens — unifiedNormalizer.js
-- (moment_type=raw.type) rendert daraus automatisch <video> im Feed
-- (VIDEO-MOMENT-POSTER-FIX-Pfad, src + thumbnail_url). Der YouTube-Link wird
-- an den Broadcast-Text angehaengt ("🎬 Ganzer Film: <url>") — die Feed-Karte
-- (MomentContent.jsx) rendert URLs in System-Broadcast-Posts als klickbare
-- Links (BROADCAST-LINKIFY-001, gleicher Commit).
--
-- Bot-Identitaet: myHUI-Systemprofil 152619c1-9adc-40bf-9078-eb67f5024ed2
-- (Fuchs-Avatar, "das System-Konto von HUI") — bestaendig seit Migration 110.
-- KEIN zweites Bot-Profil (der Prompt schlaegt eine Fix-ID vor; ein zweites
-- System-Konto waere eine konkurrierende Identitaet fuer dieselbe Funktion).

-- == 1) STORAGE-BUCKET 'broadcasts' ==========================================
--   Public-Read (Feed muss Trailer ohne Auth laden), Write nur Service-Role
--   (SADB-Route nutzt Service-Key — bypassed Policies). 500MB Limit,
--   nur video/* MIME (Verdoppelung der Server-Validierung in der SADB-Route).
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('broadcasts', 'broadcasts', true, 524288000, ARRAY['video/*']::text[])
ON CONFLICT (id) DO UPDATE
  SET public = true,
      file_size_limit = 524288000,
      allowed_mime_types = ARRAY['video/*']::text[];

-- Public-Read-Policy fuer den Bucket (analog zum 'media'-Bucket-Pattern)
DROP POLICY IF EXISTS "broadcasts public read" ON storage.objects;
CREATE POLICY "broadcasts public read" ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'broadcasts');

-- == 2) TRIGGER-ERWEITERUNG: Video-Trailer + YouTube-Link ===================
CREATE OR REPLACE FUNCTION public.trg_broadcast_to_beitrag()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- VIDEO-BROADCAST-001 (2026-09-11): Erweiterung der bestehenden Pipeline
  -- (Migration 110). Die SADB-Route schreibt jetzt trailer_url + youtube_url
  -- ins notifications.data-JSONB. Der Trigger liest beide und:
  --   * mit trailer_url  -> beitraege.type='video', src=trailer_url
  --     (unifiedNormalizer rendert <video> im Feed)
  --   * ohne trailer_url -> unveraendertes Verhalten: type='gedanke', src=NULL
  --   * mit youtube_url   -> content = body + E'\n\n' + '🎬 Ganzer Film: <url>'
  --   * ohne youtube_url  -> content = body (unveraendert)
  -- Backward-Kompatibel: alte/ohne-Media-Broadcasts (data=NULL oder leer)
  -- laufen exakt wie vorher durch denselben Code-Pfad.
  INSERT INTO beitraege (user_id, type, caption, content, src, moment_source, visibility_scope)
  SELECT '152619c1-9adc-40bf-9078-eb67f5024ed2',
         CASE WHEN nr.trailer_url <> '' THEN 'video' ELSE 'gedanke' END,
         COALESCE(nr.title, 'Systemnachricht'),
         CASE WHEN nr.youtube_url <> ''
              THEN COALESCE(nr.body, '') || E'\n\n🎬 Ganzer Film: ' || nr.youtube_url
              ELSE COALESCE(nr.body, '')
         END,
         NULLIF(nr.trailer_url, ''),
         'system_broadcast', 'public'
  FROM (
    SELECT DISTINCT title, body, trailer_url, youtube_url
    FROM (
      SELECT title, body,
             COALESCE(data ->> 'trailer_url', '') AS trailer_url,
             COALESCE(data ->> 'youtube_url', '')  AS youtube_url
      FROM new_rows
      WHERE type IN ('broadcast', 'admin_broadcast')
    ) tagged
  ) nr
  WHERE NOT EXISTS (
    SELECT 1 FROM beitraege b
    WHERE b.moment_source = 'system_broadcast'
      AND b.caption = COALESCE(nr.title, 'Systemnachricht')
      AND b.content = CASE WHEN nr.youtube_url <> ''
                           THEN COALESCE(nr.body, '') || E'\n\n🎬 Ganzer Film: ' || nr.youtube_url
                           ELSE COALESCE(nr.body, '')
                      END
      AND b.created_at > now() - interval '5 minutes'
  );
  RETURN NULL;
END;
$function$;

-- Trigger-Definition bleibt unveraendert (Migration 110): Statement-Level,
-- Transition-Table new_rows, AFTER INSERT ON notifications.
-- (CREATE OR REPLACE FUNCTION genuegt — der bestehende Trigger zeigt weiter
--  auf die neue Funktions-Definition.)

-- == 3) CLEANUP-POLICY: Trailer nach 30 Tagen loeschen ======================
--   (Prompt-Constraint "alte Trailer nach 30 Tagen loeschen")
--   Taeglich 03:17 Uhr via pg_cron (Extension verfuegbar, verifiziert 2026-09-11).
--   Direkter INSERT INTO cron.job scheitert an Berechtigungen (permission denied
--   for table job, 2026-09-11 live getestet) — cron.schedule() ist der kanonische
--   Weg. Idempotent via Existenz-Guard.
DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'cleanup-broadcast-trailers') THEN
    PERFORM cron.schedule(
      'cleanup-broadcast-trailers', '17 3 * * *',
      $$DELETE FROM storage.objects WHERE bucket_id = 'broadcasts' AND created_at < now() - interval '30 days'$$
    );
  END IF;
END
$do$;
