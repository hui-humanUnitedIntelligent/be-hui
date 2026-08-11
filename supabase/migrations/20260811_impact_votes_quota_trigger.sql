-- ════════════════════════════════════════════════════════════════
-- IMPACT-VOTES-QUOTA-TRIGGER (2026-08-11)
-- ════════════════════════════════════════════════════════════════
-- Hintergrund (Michael, 2026-08-11):
-- Basis-User "Hans" hatte 1 Stimme (Basis = 1/Monat) bereits vergeben,
-- ist dann zum Talent geworden (Talent = 2/Monat). Sorge: könnte er
-- dadurch versehentlich 1 (alt) + 2 (neu) = 3 Stimmen abgeben?
--
-- Befund nach Prüfung:
-- - Alle Frontend-Stellen (ImpactPage.jsx, ImpactStimmenModal.jsx,
--   src/services/db.js castVote()) zählen usedVotes IMMER live aus
--   der Tabelle impact_votes (COUNT/SUM WHERE voter_id+pool_month) —
--   nie aus einem gecachten/stale Zähler. maxVotes wird IMMER aus dem
--   AKTUELLEN Rollen-Status (isProfileTalent) berechnet. D.h. die
--   bereits abgegebene Stimme zählt korrekt gegen das NEUE Kontingent
--   (2), es bleibt nur noch 1 Stimme übrig — nicht 3. Kein Datenverlust,
--   keine Überschreibung: kein Trigger/Prozess löscht/ändert bestehende
--   impact_votes-Zeilen bei einem Talent-Upgrade (geprüft: trg_sync_
--   talent_flags auf profiles rührt impact_votes nicht an).
--
-- ABER: Diese Begrenzung war bisher NUR client-seitig (JS-Check vor
-- dem INSERT). Es gab KEINEN Server-seitigen Schutz — ein manipulierter
-- Client oder direkter API-Call hätte die Quote umgehen können.
-- Dieser Trigger schließt genau diese Lücke als zusätzliches
-- Sicherheitsnetz (rein additiv, ändert nichts am normalen Verhalten
-- korrekt funktionierender Clients — siehe NO-REGRESSION-PROTECTION).
-- ════════════════════════════════════════════════════════════════

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

  v_max_votes := CASE WHEN v_is_talent THEN 2 ELSE 1 END;

  -- Bereits verbrauchte Stimmen DIESEN Monat (live, inkl. Stimmen aus
  -- der Zeit vor einem etwaigen Rollen-Upgrade — die zählen weiter!)
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

DROP TRIGGER IF EXISTS trg_enforce_impact_vote_quota ON public.impact_votes;
CREATE TRIGGER trg_enforce_impact_vote_quota
  BEFORE INSERT ON public.impact_votes
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_enforce_impact_vote_quota();

COMMENT ON FUNCTION public.fn_enforce_impact_vote_quota() IS
  'Server-seitige Absicherung der monatlichen Impact-Stimmen-Quote (1 Basis / 2 Talent). '
  'Zusätzliches Sicherheitsnetz zur bereits bestehenden Client-Prüfung — verhindert, '
  'dass mehr Stimmen als das aktuelle Kontingent erlaubt eingefügt werden, unabhängig '
  'davon wie der INSERT ausgelöst wird. Bereits abgegebene Stimmen bleiben unverändert '
  'gültig und zählen weiter gegen das Kontingent, auch nach einem Rollen-Upgrade.';
