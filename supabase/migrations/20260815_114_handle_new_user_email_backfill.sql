-- Migration 114: handle_new_user() Trigger um email erweitert + Backfill
-- Datum: 2026-08-15
--
-- ROOT CAUSE (verifiziert gegen Live-DB): profiles.email war fuer 176 von 204
-- Nutzern NULL. handle_new_user() Trigger hat die Spalte beim Signup NIE
-- befuellt (nur display_name/avatar_url/username/role/membership_type wurden
-- gesetzt). Der EmailChangeBlock im SettingsModal validierte "Aktuelle E-Mail"
-- gegen dieses (NULL) Feld -> "Aktuelle E-Mail stimmt nicht ueberein" trotz
-- korrekter Eingabe. Kein Nutzerfehler, reiner Code-/Daten-Bug.
--
-- Bereits live angewendet via Supabase Management API am 2026-08-15 08:04 UTC.
-- Diese Datei dokumentiert die Aenderung nachtraeglich fuer die Migrations-Historie
-- (SSOT docs/governance) -- siehe HUI Engineering Constitution "Truth over Assumption".

-- 1) Backfill: alle bestehenden NULL-Zeilen aus auth.users.email nachziehen
UPDATE public.profiles p
SET email = u.email, updated_at = NOW()
FROM auth.users u
WHERE p.id = u.id AND p.email IS NULL AND u.email IS NOT NULL;

-- 2) Trigger-Fix: kuenftige Registrierungen bekommen email sofort gesetzt
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url, username, role, membership_type, email, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture'),
    NULL,
    'basisuser',
    'basisuser',
    NEW.email,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$function$;

COMMENT ON FUNCTION public.handle_new_user() IS 'Kanonische Methode zur Profilgenerierung (siehe Memory #803). Seit Migration 114: setzt email = NEW.email direkt beim Signup, damit profiles.email nie wieder NULL wird.';
