-- ══════════════════════════════════════════════════════════════════════════════
-- IMPACT VOTING v2 — Migration 20260824_122
-- NUR Talente können abstimmen, 1 Stimme pro Talent pro Monat.
-- Basis-User (ohne Talent-Status) können NICHT abstimmen.
--
-- Ändert: fn_enforce_impact_vote_quota() — 
--   v1: Basis=1, Talent=2 (alle dürfen)
--   v2: Basis=0 (reject), Talent=1 (nur Talente)
--
-- NO-REGRESSION: Bestehende impact_votes bleiben unverändert.
-- Lediglich der Trigger wird restriktiver — keine Datenlöschung.
-- ══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.fn_enforce_impact_vote_quota()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_membership_active     boolean;
  v_membership_type       text;
  v_role                  text;
  v_is_talent_flag        boolean;
  v_has_talent_profile    boolean;
  v_is_talent             boolean := false;
  v_max_votes             int;
  v_used_weight           numeric;
BEGIN
  -- Aktuellen Rollen-Status des Voters laden (SSOT: profiles)
  SELECT membership_active, membership_type, role, is_talent, has_talent_profile
    INTO v_membership_active, v_membership_type, v_role, v_is_talent_flag, v_has_talent_profile
    FROM public.profiles
   WHERE id = NEW.voter_id;

  -- Wahrheits-Hierarchie 1:1 wie isProfileTalent() in profileUtils.js
  IF v_membership_active IS TRUE
     AND v_membership_type IN ('talent', 'guardian', 'team') THEN
    v_is_talent := true;
  ELSIF v_role IN ('talent', 'wirker') THEN
    v_is_talent := true;
  ELSIF v_is_talent_flag IS TRUE THEN
    v_is_talent := true;
  ELSIF v_has_talent_profile IS TRUE THEN
    v_is_talent := true;
  END IF;

  -- v2: NUR Talente dürfen abstimmen. Basis-User werden abgelehnt.
  IF NOT v_is_talent THEN
    RAISE EXCEPTION 'Nur Talente können beim Impact-Voting abstimmen. Basis-User haben keine Stimmberechtigung.';
  END IF;

  -- v2: Max 1 Stimme pro Talent pro Monat (war 2 in v1)
  v_max_votes := 1;

  -- Bereits verbrauchte Stimmen DIESEN Monat (live)
  SELECT COALESCE(SUM(weight), 0) INTO v_used_weight
    FROM public.impact_votes
   WHERE voter_id = NEW.voter_id
     AND pool_month = NEW.pool_month;

  IF v_used_weight + COALESCE(NEW.weight, 1) > v_max_votes THEN
    RAISE EXCEPTION 'Maximale Stimmen für diesen Monat erreicht (%)', v_max_votes;
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.fn_enforce_impact_vote_quota() IS
  'v2: Server-seitige Absicherung der Impact-Voting-Regeln. NUR Talente dürfen abstimmen, '
  'max 1 Stimme pro Talent pro Monat. Basis-User ohne Talent-Status werden abgelehnt. '
  'Ersetzt v1 (Basis=1, Talent=2) gemäß VOTING-REGELN v2 (2026-08-22, Michael).';
