-- Migration 110 (2026-08-13): Broadcast-Feed-Post-Duplikat-Bug behoben
--
-- PROBLEM: Ein Admin-Broadcast aus dem SADB (frontend/src/app/api/broadcast/route.ts)
-- legt für JEDEN Empfänger eine eigene Zeile in `notifications` an (type='broadcast'),
-- damit jeder Nutzer sein eigenes, individuelles Resonanzzentrum-Badge bekommt.
-- Das ist korrekt und bleibt unverändert.
--
-- ABER: `trg_broadcast_to_beitrag` war ein FOR EACH ROW Trigger — er feuerte
-- also einmal PRO EMPFÄNGER und postete dadurch bei 198 Empfängern 198x
-- denselben Beitrag ("myHUI teilt einen persönlichen Moment") im Feed.
--
-- FIX: Trigger von ROW-Level auf STATEMENT-Level (mit Transition-Table
-- REFERENCING NEW TABLE) umgestellt. Postet jetzt GENAU EINMAL pro Broadcast:
--   1. Innerhalb eines einzelnen INSERT-Batches (bis zu 500 Empfänger, siehe
--      CHUNK=500 in der SADB-Route) wird nach (title, body) dedupliziert.
--   2. Zusätzlich eine 5-Minuten-Dedupe-Sperre gegen bereits existierende
--      Posts mit identischem Titel+Inhalt — deckt auch Broadcasts an >500
--      Empfänger ab (mehrere Chunks/INSERT-Statements).
--
-- Betrifft NUR type IN ('broadcast','admin_broadcast'). Alle anderen
-- notifications-Inserts (Kauf, Buchung, Follow, etc.) sind unverändert —
-- kein neues Verhalten, da die Filterbedingung dieselbe bleibt.
--
-- Verifiziert (2026-08-13): Test-Insert von 5 notifications-Zeilen in EINEM
-- Statement → genau 1 Beitrag erzeugt (vorher: 5). 197 vorhandene Duplikate
-- aus dem echten "Test Nachricht"-Broadcast wurden bereinigt (1 Post bleibt).
--
-- Push-Notifications: trg_queue_push_notification bleibt unverändert (FOR EACH
-- ROW) — das ist KORREKT, da jeder Empfänger seinen eigenen Outbox-Eintrag
-- für seinen eigenen Push braucht. Kein Bug hier.

CREATE OR REPLACE FUNCTION public.trg_broadcast_to_beitrag()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO beitraege (user_id, type, caption, content, moment_source, visibility_scope)
  SELECT '152619c1-9adc-40bf-9078-eb67f5024ed2', 'gedanke',
         COALESCE(nr.title, 'Systemnachricht'), COALESCE(nr.body, ''),
         'system_broadcast', 'public'
  FROM (
    SELECT DISTINCT title, body
    FROM new_rows
    WHERE type IN ('broadcast', 'admin_broadcast')
  ) nr
  WHERE NOT EXISTS (
    SELECT 1 FROM beitraege b
    WHERE b.moment_source = 'system_broadcast'
      AND b.caption = COALESCE(nr.title, 'Systemnachricht')
      AND b.content = COALESCE(nr.body, '')
      AND b.created_at > now() - interval '5 minutes'
  );
  RETURN NULL;
END;
$function$;

DROP TRIGGER IF EXISTS trg_broadcast_to_beitrag ON public.notifications;

CREATE TRIGGER trg_broadcast_to_beitrag
AFTER INSERT ON public.notifications
REFERENCING NEW TABLE AS new_rows
FOR EACH STATEMENT
EXECUTE FUNCTION trg_broadcast_to_beitrag();

-- Cleanup der 197 bereits entstandenen Duplikate (einmalig, nicht Teil der
-- eigentlichen Fix-Logik — nur zur Bereinigung des aktuellen Datenbestands):
-- WITH dupes AS (
--   SELECT id, ROW_NUMBER() OVER (PARTITION BY caption, content ORDER BY created_at ASC, id ASC) AS rn
--   FROM beitraege WHERE moment_source = 'system_broadcast'
-- )
-- DELETE FROM beitraege WHERE id IN (SELECT id FROM dupes WHERE rn > 1);
