-- Migration: 20260815_111_registration_upgrade.sql
-- REGISTRATION-UPGRADE-001 (Michael-Auftrag 2026-08-15)
-- Additiv, keine bestehenden Spalten/Policies/RPCs werden veraendert oder entfernt.
--
-- Inhalt:
--   1. profiles += anrede (TEXT, CHECK Herr/Frau/Divers), geburtsdatum (DATE)
--      -> BEWUSST NICHT in die anon/authenticated Column-Level-GRANTs (Migration 104)
--         aufgenommen: sensible personenbezogene Daten, fuer niemanden ausser
--         den Nutzer selbst (per SECURITY DEFINER RPC) und service_role sichtbar.
--   2. Server-seitige Alters-Pruefung (Defense-in-Depth, ergaenzt Client-Check):
--      Trigger verhindert INSERT/UPDATE mit geburtsdatum < 16 Jahre.
--   3. RPC rpc_get_my_sensitive_profile_fields(): Nutzer kann NUR seine eigenen
--      anrede/geburtsdatum lesen (SECURITY DEFINER, auth.uid()=id-Check innen).

-- ─────────────────────────────────────────────────────────────────
-- 1. Neue Spalten (additiv)
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS anrede TEXT,
  ADD COLUMN IF NOT EXISTS geburtsdatum DATE;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_anrede_check'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_anrede_check
      CHECK (anrede IS NULL OR anrede IN ('Herr', 'Frau', 'Divers'));
  END IF;
END $$;

COMMENT ON COLUMN public.profiles.anrede IS 'Anrede bei Registrierung (Herr/Frau/Divers). Sensibel — nicht in anon/authenticated Column-Grants (siehe Migration 104-Pattern).';
COMMENT ON COLUMN public.profiles.geburtsdatum IS 'Geburtsdatum bei Registrierung. Pflichtfeld ab REGISTRATION-UPGRADE-001. Mindestalter 16 (siehe trg_enforce_min_age). Sensibel — nicht oeffentlich lesbar.';

-- ─────────────────────────────────────────────────────────────────
-- 2. Server-seitige Mindestalter-Pruefung (Defense-in-Depth)
--    Der Client blockt bereits <16 vor dem Absenden — dieser Trigger
--    verhindert zusaetzlich jede direkte DB/API-Umgehung.
-- ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.fn_enforce_min_age()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $func$
BEGIN
  IF NEW.geburtsdatum IS NOT NULL THEN
    IF date_part('year', age(NEW.geburtsdatum)) < 16 THEN
      RAISE EXCEPTION 'MIN_AGE_16: Nutzer muss mindestens 16 Jahre alt sein.';
    END IF;
  END IF;
  RETURN NEW;
END;
$func$;

DROP TRIGGER IF EXISTS trg_enforce_min_age ON public.profiles;
CREATE TRIGGER trg_enforce_min_age
  BEFORE INSERT OR UPDATE OF geburtsdatum ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_enforce_min_age();

-- ─────────────────────────────────────────────────────────────────
-- 3. RPC: Nutzer liest NUR seine eigenen sensiblen Felder
-- ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.rpc_get_my_sensitive_profile_fields()
RETURNS TABLE(anrede TEXT, geburtsdatum DATE)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
BEGIN
  RETURN QUERY
    SELECT p.anrede, p.geburtsdatum
    FROM public.profiles p
    WHERE p.id = auth.uid();
END;
$func$;

GRANT EXECUTE ON FUNCTION public.rpc_get_my_sensitive_profile_fields() TO authenticated;

-- ─────────────────────────────────────────────────────────────────
-- Ende Migration 111
-- ─────────────────────────────────────────────────────────────────
