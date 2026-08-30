-- ════════════════════════════════════════════════════════════════
-- Migration 136: rpc_delete_org_profile() — Org-Profil löschen
-- Datum: 2026-08-30
--
-- ZWECK:
-- Michael möchte im Account-Switcher ein Org-Profil (Verein/Unternehmen)
-- wieder löschen können — NIEMALS den persönlichen Hauptaccount.
--
-- FAKTEN-CHECK vor dem Bau (Arbeitsregeln §2/§4):
-- - profiles(id) hat bereits ON DELETE CASCADE von: talents.user_id,
--   profile_locations.profile_id, beitraege.user_id, notifications.*,
--   stripe_customers.user_id, u.v.m. -> werden beim DELETE automatisch
--   mitgelöscht.
-- - works.user_id HAT KEINEN FK auf profiles (nur works.creator_id ->
--   auth.users). Ohne explizite Bereinigung blieben Werke mit einem
--   toten user_id-Verweis zurück (verwaiste Zeilen, kein DB-Fehler,
--   aber Dateninkonsistenz) -> wird unten explizit geloescht.
-- - work_sales.work_id -> works(id) ON DELETE RESTRICT: Falls ein Werk
--   des Org-Profils bereits verkauft wurde, schlaegt DELETE FROM works
--   bewusst fehl (Transaktionshistorie darf nicht verloren gehen) ->
--   die Funktion gibt dann einen klaren Fehler zurueck statt stillschweigend
--   Daten zu verlieren.
-- - experiences.user_id referenziert auth.users(id) (nicht profiles) ->
--   ein Org-Profil (keine auth.users-Zeile) kann dort technisch nie als
--   user_id stehen; Zeile unten ist ein reines Sicherheitsnetz (No-Op im
--   Normalfall).
--
-- SICHERHEIT:
-- - Nur der/die tatsaechliche Eigentuemer:in (owner_user_id = auth.uid())
--   darf loeschen.
-- - account_type MUSS 'organization' sein -> der persoenliche Hauptaccount
--   kann ueber diese Funktion NIE geloescht werden (harte DB-Garantie,
--   nicht nur UI-Beschraenkung).
-- ════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.rpc_delete_org_profile(p_org_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner uuid;
  v_type  text;
BEGIN
  SELECT owner_user_id, account_type INTO v_owner, v_type
  FROM public.profiles
  WHERE id = p_org_id;

  -- FIX (Test 2026-08-30): "IF v_owner IS NULL" allein wuerde auch bei
  -- einem GEFUNDENEN persoenlichen Profil zuschlagen (owner_user_id ist
  -- dort immer NULL) und faelschlich "ORG_NOT_FOUND" statt "NOT_AN_ORG_
  -- PROFILE" melden. "IF NOT FOUND" prueft korrekt, ob ueberhaupt eine
  -- Zeile per SELECT INTO getroffen wurde -- unabhaengig vom Inhalt der
  -- Spalten.
  IF NOT FOUND THEN
    RAISE EXCEPTION 'ORG_NOT_FOUND: Kein Profil mit dieser ID gefunden.';
  END IF;

  -- Haerteste Garantie: persoenliche Accounts sind NIE loeschbar ueber
  -- diese Funktion, unabhaengig davon wer aufruft.
  IF v_type IS DISTINCT FROM 'organization' THEN
    RAISE EXCEPTION 'NOT_AN_ORG_PROFILE: Nur Organisations-Profile (Verein/Unternehmen) koennen hierueber geloescht werden.';
  END IF;

  IF v_owner IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'NOT_AUTHORIZED: Du bist nicht Eigentuemer:in dieses Organisations-Profils.';
  END IF;

  -- Werke des Org-Profils: kein FK-Cascade vorhanden -> explizit loeschen.
  -- Falls bereits verkauft (work_sales ON DELETE RESTRICT) -> Exception,
  -- die Funktion bricht bewusst ab statt Transaktionsdaten zu riskieren.
  DELETE FROM public.works WHERE user_id = p_org_id;

  -- Sicherheitsnetz (siehe Kommentar oben, im Normalfall No-Op):
  DELETE FROM public.experiences WHERE user_id = p_org_id;

  -- Finale Loeschung: talents/profile_locations/etc. cascaden automatisch.
  DELETE FROM public.profiles WHERE id = p_org_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.rpc_delete_org_profile(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_delete_org_profile(uuid) TO authenticated;

COMMENT ON FUNCTION public.rpc_delete_org_profile(uuid) IS
  'Loescht ein Organisations-Profil (Verein/Unternehmen) inkl. seiner Werke. Nur durch den echten Eigentuemer (owner_user_id) aufrufbar, blockt strukturell jede Loeschung persoenlicher Accounts. Migration 136, 2026-08-30.';
