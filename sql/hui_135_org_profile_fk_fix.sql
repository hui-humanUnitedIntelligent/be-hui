-- ════════════════════════════════════════════════════════════════
-- Migration 135: Fix — profiles_id_fkey blockiert Org-Profil-Erstellung
-- Datum: 2026-08-30
--
-- ROOT CAUSE:
-- profiles.id hatte einen harten FK "profiles_id_fkey":
--   FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
-- Das erzwingt: JEDE profiles-Zeile MUSS einem echten auth.users-Eintrag
-- entsprechen (1:1 Login-Modell). Das Org-Profil-Feature (Migration 132,
-- "Ansatz A") sieht aber explizit vor, dass ein Org-Profil eine EIGENE,
-- zufällig generierte UUID bekommt und AUSDRÜCKLICH KEINEN separaten
-- Login/auth.users-Eintrag hat (steht so im Kommentar von Migration 132).
-- Widerspruch → jeder INSERT eines Org-Profils schlägt zwingend fehl:
-- "insert or update on table 'profiles' violates foreign key constraint
-- 'profiles_id_fkey'" (409 Conflict).
--
-- WARUM NICHT EINFACH HART DROPPEN:
-- Der FK garantiert bisher zusätzlich: wird ein auth.users-Eintrag
-- gelöscht, verschwindet automatisch (CASCADE) das zugehörige profiles-
-- Profil. Fakten-Check (rpc_delete_own_account, Migration 115):
--   Schritt 6 der RPC löscht "DELETE FROM public.profiles WHERE id = target"
--   BEREITS MANUELL, bevor auth.admin.deleteUser() überhaupt aufgerufen
--   wird (delete-account Edge Function, Schritt 2). D.h. im produktiven
--   Löschpfad war der FK-CASCADE für profiles.id bereits redundant.
-- Trotzdem: als Sicherheitsnetz für jede andere Löschung von auth.users
-- (z.B. direkt im Supabase-Dashboard, ohne die RPC zu durchlaufen) wird
-- das exakt gleiche Cascade-Verhalten per Trigger nachgebaut — NUR für
-- persönliche Profile (Org-Profile werden weiterhin korrekt über den
-- bereits bestehenden "profiles_owner_user_id_fkey ON DELETE CASCADE"
-- aus Migration 132 automatisch mitgelöscht, unverändert).
--
-- FIX:
-- 1. FK profiles_id_fkey entfernen.
-- 2. BEFORE INSERT/UPDATE Trigger: erzwingt weiterhin "id muss in
--    auth.users existieren" — aber NUR für account_type != 'organization'.
--    Org-Profile (account_type = 'organization') sind ausgenommen.
-- 3. AFTER DELETE Trigger auf auth.users: löscht das zugehörige
--    PERSÖNLICHE profiles (id = OLD.id) als Ersatz für den entfernten
--    FK-Cascade — Sicherheitsnetz, falls ein User je ohne die RPC
--    gelöscht wird.
-- ════════════════════════════════════════════════════════════════

-- ── 1. Alten, zu strikten FK entfernen ────────────────────────────
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- ── 2. Ersatz-Validierung: nur persönliche Profile müssen auf einen
--       echten auth.users-Eintrag zeigen ─────────────────────────
CREATE OR REPLACE FUNCTION public.fn_validate_profile_personal_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (NEW.account_type IS NULL OR NEW.account_type <> 'organization') THEN
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = NEW.id) THEN
      RAISE EXCEPTION
        'profiles.id % muss fuer persoenliche Profile (account_type != organization) auf einen existierenden auth.users-Eintrag verweisen',
        NEW.id
        USING ERRCODE = '23503';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_profile_personal_id ON public.profiles;
CREATE TRIGGER trg_validate_profile_personal_id
  BEFORE INSERT OR UPDATE OF id, account_type ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_validate_profile_personal_id();

-- ── 3. Ersatz-Cascade: persoenliches Profil mitloeschen, wenn der
--       zugehoerige auth.users-Eintrag geloescht wird (Sicherheitsnetz,
--       der produktive Loeschpfad ueber rpc_delete_own_account loescht
--       das Profil bereits selbst manuell — siehe Kommentar oben) ────
CREATE OR REPLACE FUNCTION public.fn_cascade_delete_personal_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.profiles
  WHERE id = OLD.id
    AND (account_type IS NULL OR account_type <> 'organization');
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_cascade_delete_personal_profile ON auth.users;
CREATE TRIGGER trg_cascade_delete_personal_profile
  AFTER DELETE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_cascade_delete_personal_profile();
