-- Migration 137 (2026-09-11): BROADCAST-TARGET-GATE — Admin-Broadcasts nicht mehr oeffentlich im Feed
--
-- KONTEXT (Michael-Report 16:41, Screenshot): Ein SADB-Broadcast mit Zielgruppe
-- "Admins" ("Test Video Nachricht", Trailer + YouTube-Link) erschien FUER ALLE
-- Nutzer im Feed — "sollte nur an admins raus, nun ist es sichtbar fuer alle".
--
-- ROOT CAUSE: trg_broadcast_to_beitrag (Migration 110 + 136) postete JEDE
-- Broadcast-Zielgruppe als visibility_scope='public' in den Feed — die
-- Zielgruppe (target_group) wurde vom Trigger nie geprueft, weil sie bislang
-- GAR NICHT in den notifications-Zeilen stand (die SADB-Route schrieb nur
-- trailer_url + youtube_url ins data-JSONB).
--
-- FIX (2 Teile, derselbe Commit-Zyklus):
--   1. SADB-Route (frontend/src/app/api/broadcast/route.ts, Commit im SADB-Repo)
--      schreibt jetzt data.target_group in JEDE Broadcast-Notification.
--   2. Dieser Trigger hier postet NUR noch Broadcasts mit
--      COALESCE(data->>'target_group','all') = 'all' in den Feed.
--      Zielgruppen 'admins'/'wirker'/'members'/'basisuser' sind private
--      Nachrichten (Resonanzzentrum) — KEIN Feed-Post.
--      Legacy ohne target_group-Feld = 'all' (altes Verhalten bleibt).
--
-- ZUSAETZLICH gefixt (Michael-Report "SADB-Loeschen funktioniert nicht"):
-- Der SADB-DELETE-Handler loeschte nur notifications-Zeilen, NIEMALS die
-- beitraege-Zeile — der Feed-Post blieb nach dem SADB-Loeschen sichtbar.
-- SADB-Route erweitert: DELETE entfernt jetzt notifications + passende
-- beitraege-Zeile (moment_source='system_broadcast', Titel + Zeitfenster
-- +-60s) + Trailer-Objekt aus dem Storage-Bucket 'broadcasts'.
--
-- Bereinigung des Vorfalls (live, 2026-09-11 ~16:05, vor dieser Migration):
-- beitraege 5ba02a40 ("Test Video Nachricht") + Storage-Objekt
-- trailer-1789132731496.mp4 manuell geloescht (Backup:
-- .backups_local/broadcast_adminfix_20260911/).

-- == TRIGGER-GATE: nur 'all'-Broadcasts erzeugen einen Feed-Post ===========
CREATE OR REPLACE FUNCTION public.trg_broadcast_to_beitrag()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- BROADCAST-TARGET-GATE (2026-09-11, Migration 137): Feed-Post nur bei
  -- Zielgruppe 'alle'. Private Zielgruppen (admins/wirker/members/basisuser)
  -- erreichen ihre Empfaenger ausschliesslich ueber das Resonanzzentrum.
  -- Legacy-Zeilen ohne target_group-Feld verhalten sich wie 'all'.
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
        AND COALESCE(data ->> 'target_group', 'all') = 'all'
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

-- Trigger-Definition unveraendert (Migration 110): Statement-Level,
-- Transition-Table new_rows, AFTER INSERT ON notifications.
