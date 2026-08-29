-- ════════════════════════════════════════════════════════════════════════════
-- Migration 131: sync_role_flags — Trigger syncs role ↔ is_talent ↔ flags
-- Datum: 2026-08-29
-- ════════════════════════════════════════════════════════════════════════════
--
-- PROBLEM:
--   profiles-Tabelle hat role (TEXT) + 5 Boolean Flags (is_talent, is_member,
--   is_wirker, is_guardian, has_talent_profile) OHNE Sync-Constraint.
--   TalentOnboarding.jsx setzt alle 4 gleichzeitig, aber manuelle DB-Änderungen
--   oder teilweise Updates können Inkonsistenzen verursachen.
--
-- LÖSUNG:
--   BEFORE UPDATE Trigger der role und is_talent (sowie die abhängigen Flags
--   has_talent_profile, is_wirker) immer synchron hält.
--
-- LOGIK:
--   1. is_talent: false→true  → role='talent', has_talent_profile=true, is_wirker=true
--   2. role: ≠'talent'→'talent' → is_talent=true, has_talent_profile=true, is_wirker=true
--   3. is_talent: true→false UND role='talent' → role='basisuser', flags zurückgesetzt
--
-- GRENZEN (bewusst):
--   - Nur UPDATE, nicht INSERT (handle_new_user setzt 'basisuser' + NULL-Flags)
--   - admin/superadmin role wird nicht angefasst (keine Bedingung greift)
--   - is_guardian und is_member bleiben unberührt (beide ungenutzt im Code)
--   - is_wirker wird nur als abhängiger Flag mitgesetzt, nicht unabhängig getriggert
-- ════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.sync_role_flags()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- 1. is_talent: false/NULL → true
  --    → role='talent', has_talent_profile=true, is_wirker=true
  IF NEW.is_talent = true AND OLD.is_talent IS DISTINCT FROM true THEN
    NEW.role := 'talent';
    NEW.has_talent_profile := true;
    NEW.is_wirker := true;
  END IF;

  -- 2. role: ≠'talent' → 'talent'
  --    → is_talent=true, has_talent_profile=true, is_wirker=true
  IF NEW.role = 'talent' AND OLD.role IS DISTINCT FROM 'talent' THEN
    NEW.is_talent := true;
    NEW.has_talent_profile := true;
    NEW.is_wirker := true;
  END IF;

  -- 3. is_talent: true → false UND role ist noch 'talent'
  --    → role='basisuser', has_talent_profile=false, is_wirker=false
  IF NEW.is_talent = false AND OLD.is_talent IS DISTINCT FROM false
     AND NEW.role = 'talent' THEN
    NEW.role := 'basisuser';
    NEW.has_talent_profile := false;
    NEW.is_wirker := false;
  END IF;

  RETURN NEW;
END;
$function$;

-- Trigger anlegen (OR REPLACE für Idempotenz)
CREATE OR REPLACE TRIGGER trigger_sync_role_flags
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_role_flags();

-- Sicherheit: Nur service_role darf die Funktion direkt aufrufen
REVOKE EXECUTE ON FUNCTION public.sync_role_flags() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.sync_role_flags() FROM anon;
GRANT EXECUTE ON FUNCTION public.sync_role_flags() TO service_role;

COMMENT ON FUNCTION public.sync_role_flags() IS 'Sync-Trigger: hält role und is_talent + abhängige Flags (has_talent_profile, is_wirker) konsistent. BEFORE UPDATE auf profiles. Migration 131, 2026-08-29.';
