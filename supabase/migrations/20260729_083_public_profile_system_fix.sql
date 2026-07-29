-- ═══════════════════════════════════════════════════════════════════════
-- Migration 083: Öffentliches Profil-System — vollständige Reparatur
-- Datum: 2026-07-29
-- Zweck: Sichert "Profil ansehen" für alle Nutzer, alle Content-Typen
-- ═══════════════════════════════════════════════════════════════════════

-- ─── 1. handle_new_user TRIGGER (Profile-Auto-Generierung) ─────────────
-- Stellt sicher: Jeder neue auth.users Eintrag bekommt automatisch ein
-- profiles-Eintrag. ON CONFLICT für Idempotenz.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, role, membership_type, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    'basisuser',
    'basisuser',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Trigger erstellen (idempotent)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── 2. BACKFILL: Nutzer ohne Profile-Eintrag ──────────────────────────
-- Fügt profiles-Einträge für auth.users hinzu, die keinen haben.
-- Nutzt Security Definer um auth.users lesen zu dürfen.
-- WICHTIG: Einmalig ausführen. Entfernt nach Ausführung.

CREATE OR REPLACE FUNCTION public.backfill_missing_profiles()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  missing_count INTEGER;
BEGIN
  INSERT INTO public.profiles (id, display_name, role, membership_type, created_at, updated_at)
  SELECT
    au.id,
    COALESCE(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1)),
    'basisuser',
    'basisuser',
    au.created_at,
    NOW()
  FROM auth.users au
  WHERE au.id NOT IN (SELECT id FROM public.profiles)
  ON CONFLICT (id) DO NOTHING;

  GET DIAGNOSTICS missing_count = ROW_COUNT;
  RAISE NOTICE 'Backfill: % Profile erstellt', missing_count;
END;
$$;

SELECT public.backfill_missing_profiles();
DROP FUNCTION public.backfill_missing_profiles;

-- ─── 3. RLS: profiles SELECT für authenticated + anon ─────────────────
-- Migration 080 setzte nur authenticated. Für Entdecken-Tab ohne Login
-- wird auch anon benötigt.

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Authenticated: alle Profile lesbar
DROP POLICY IF EXISTS "profiles_select_all_authenticated" ON public.profiles;
CREATE POLICY "profiles_select_all_authenticated"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- Anon: alle Profile lesbar (für öffentlichen Entdecken-Tab)
DROP POLICY IF EXISTS "profiles_select_all_anon" ON public.profiles;
CREATE POLICY "profiles_select_all_anon"
  ON public.profiles FOR SELECT
  TO anon
  USING (true);

-- ─── 4. RLS: beitraege SELECT ─────────────────────────────────────────
-- Falls noch keine SELECT-Policy existiert: sicherstellen
ALTER TABLE public.beitraege ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "beitraege_select_all" ON public.beitraege;
CREATE POLICY "beitraege_select_all"
  ON public.beitraege FOR SELECT
  USING (true);

-- ─── 5. FK-Constraint: beitraege.user_id → profiles.id ────────────────
-- Vorsichtig: erst prüfen ob verwaiste Einträge existieren (sollten 0 sein)
-- dann FK hinzufügen
DO $$
BEGIN
  -- Prüfe ob der FK bereits existiert
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_beitraege_profile'
      AND table_name = 'beitraege'
  ) THEN
    -- Lösche verwaiste beitraege-Einträge (sollten 0 sein, Sicherheit)
    DELETE FROM public.beitraege
    WHERE user_id NOT IN (SELECT id FROM public.profiles)
      AND user_id IS NOT NULL;

    ALTER TABLE public.beitraege
      ADD CONSTRAINT fk_beitraege_profile
      FOREIGN KEY (user_id)
      REFERENCES public.profiles(id)
      ON DELETE CASCADE;
    RAISE NOTICE 'FK fk_beitraege_profile hinzugefügt';
  ELSE
    RAISE NOTICE 'FK fk_beitraege_profile existiert bereits';
  END IF;
END;
$$;

-- ─── 6. FK-Constraint: impact_applications.user_id → profiles.id ─────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_impact_applications_profile'
      AND table_name = 'impact_applications'
  ) THEN
    DELETE FROM public.impact_applications
    WHERE user_id NOT IN (SELECT id FROM public.profiles)
      AND user_id IS NOT NULL;

    ALTER TABLE public.impact_applications
      ADD CONSTRAINT fk_impact_applications_profile
      FOREIGN KEY (user_id)
      REFERENCES public.profiles(id)
      ON DELETE CASCADE;
    RAISE NOTICE 'FK fk_impact_applications_profile hinzugefügt';
  END IF;
END;
$$;
