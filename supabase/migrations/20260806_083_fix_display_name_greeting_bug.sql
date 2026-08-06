-- 20260806_083_fix_display_name_greeting_bug.sql
--
-- BUG: In LoginPage.jsx (handleRegister) wurde `display_name` beim Signup
-- fälschlich auf den Username gesetzt statt auf den echten Vornamen.
-- Folge: Die Begrüßung im Feed-Header ("Guten Tag, X") zeigte den Nickname
-- statt des Vornamens, weil FeedWelcomeHeader zuerst display_name.split(" ")[0]
-- verwendet — und display_name war identisch mit username (kein Leerzeichen).
--
-- `full_name` (Vorname + Nachname) wurde beim Signup KORREKT gesetzt und
-- enthält daher weiterhin den echten Namen (z.B. "Linda Mathis").
--
-- Fix hier: Backfill aller betroffenen Bestandsprofile — display_name wird
-- auf das erste Wort von full_name gesetzt (= Vorname), analog zur Logik
-- im Registrierungs-Code-Fix (LoginPage.jsx).
--
-- Betrifft nur Profile bei denen display_name == username UND full_name
-- einen abweichenden, echten Namen enthält (19 betroffene Profile, Stand
-- 2026-08-06, siehe Backup backup_2026-08-06_profiles_display_name_bug.json).

BEGIN;

UPDATE public.profiles
SET
  display_name = split_part(trim(full_name), ' ', 1),
  updated_at   = NOW()
WHERE
  display_name = username
  AND full_name IS NOT NULL
  AND trim(full_name) <> ''
  AND full_name <> username
  AND split_part(trim(full_name), ' ', 1) <> ''
  AND split_part(trim(full_name), ' ', 1) <> display_name;

COMMIT;

NOTIFY pgrst, 'reload schema';
