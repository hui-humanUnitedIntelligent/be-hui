-- ══════════════════════════════════════════════════════════════════════════════
-- V7.5 Migration 085: Wallet-Trigger erweitern (is_talent + membership_type)
--
-- Grund: activateMembership() setzt ab V7.5 NUR membership_active = true,
-- nicht mehr is_talent oder membership_type. Der Wallet-Trigger muss
-- daher auf is_talent prüfen, damit künftige Talent-Freischaltungen
-- (die is_talent = true setzen) die Wallet korrekt erstellen.
--
-- ══════════════════════════════════════════════════════════════════════════════
-- LEGACY COMPATIBILITY LAYER
-- ══════════════════════════════════════════════════════════════════════════════
-- membership_type = 'talent' wird ausschließlich zur Legacy-Kompatibilität
-- berücksichtigt. Nutzer, die durch phase4c_membership.sql migriert wurden
-- (z.B. Nutzer mit is_member=true oder role='wirker'), haben möglicherweise
-- membership_type = 'talent' ohne dass is_talent explizit gesetzt wurde.
--
-- is_talent ist die zukünftige fachliche Wahrheit für Talent-Verantwortung.
-- Die membership_type-Bedingung ist nach Einführung der V8-Responsibility-
-- Architektur (responsibilities-Tabelle) zu entfernen.
--
-- Siehe: ADR-005 (No responsibilities table in V7.5)
-- Siehe: V7.5 Architecture Specification, Part III §3 (profile_modules)
-- ══════════════════════════════════════════════════════════════════════════════

-- 1. Function ersetzen: prüft is_talent (V7.5) ODER membership_type (Legacy)
CREATE OR REPLACE FUNCTION public.auto_create_creator_wallet()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- V7.5: is_talent ist die primäre fachliche Wahrheit
  IF NEW.is_talent = true AND NEW.membership_active = true THEN
    INSERT INTO public.creator_wallets (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
  -- LEGACY: membership_type = 'talent' für migrierte Nutzer ohne is_talent
  ELSIF NEW.membership_type = 'talent' AND NEW.membership_active = true THEN
    INSERT INTO public.creator_wallets (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- 2. Trigger ersetzen: feuert bei is_talent, membership_type und membership_active Änderungen
DROP TRIGGER IF EXISTS trg_auto_wallet ON public.profiles;
CREATE TRIGGER trg_auto_wallet
  AFTER INSERT OR UPDATE OF is_talent, membership_type, membership_active ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.auto_create_creator_wallet();
