-- BACKUP vor Fix (2026-08-13 15:30) — trg_broadcast_to_beitrag
-- Root Cause: FOR EACH ROW Trigger feuerte pro notifications-INSERT-Zeile.
-- Broadcast aus SADB legt 1 notifications-Zeile PRO EMPFÄNGER an (korrekt, für
-- individuelle Resonanzzentrum-Badges) → bei 198 Empfängern = 198x Beitrag/Post.

-- ALTE FUNKTION (Wiederherstellung falls nötig):
CREATE OR REPLACE FUNCTION public.trg_broadcast_to_beitrag()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$ BEGIN IF NEW.type IN ('broadcast', 'admin_broadcast') THEN INSERT INTO beitraege (user_id, type, caption, content, moment_source, visibility_scope) VALUES ('152619c1-9adc-40bf-9078-eb67f5024ed2', 'gedanke', COALESCE(NEW.title, 'Systemnachricht'), COALESCE(NEW.body, ''), 'system_broadcast', 'public'); END IF; RETURN NEW; END; $function$;

-- ALTER TRIGGER (Wiederherstellung falls nötig):
DROP TRIGGER IF EXISTS trg_broadcast_to_beitrag ON public.notifications;
CREATE TRIGGER trg_broadcast_to_beitrag AFTER INSERT ON public.notifications FOR EACH ROW EXECUTE FUNCTION trg_broadcast_to_beitrag();
