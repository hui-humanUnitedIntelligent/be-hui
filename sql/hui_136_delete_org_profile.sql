-- ════════════════════════════════════════════════════════════════
-- Migration 136: rpc_delete_org_profile() — Org-Profil löschen (v2)
-- Datum: 2026-08-30
--
-- ZWECK:
-- Michael möchte im Account-Switcher ein Org-Profil (Verein/Unternehmen)
-- wieder löschen können — NIEMALS den persönlichen Hauptaccount.
-- Alle Werke, Talente, Erlebnisse UND Momente des Org-Profils werden
-- HARD-DELETED — nicht nur Soft-Delete, sondern vollständige Entfernung
-- aus Feed und Supabase.
--
-- FAKTEN-CHECK vor dem Bau (Arbeitsregeln §2/§4):
-- - profiles(id) hat bereits ON DELETE CASCADE von: talents.user_id,
--   profile_locations.profile_id, beitraege.user_id (Momente/Posts!),
--   notifications.target_user_id, stripe_customers.user_id, u.v.m.
--   -> werden beim DELETE FROM profiles automatisch hard-gelöscht.
-- - works.user_id HAT KEINEN FK auf profiles (nur works.creator_id ->
--   auth.users). Ohne explizite Bereinigung blieben Werke mit einem
--   toten user_id-Verweis zurück -> wird unten explizit gelöscht.
-- - work_sales.work_id -> works(id) ON DELETE RESTRICT: Falls ein Werk
--   des Org-Profils bereits verkauft wurde, schlägt DELETE FROM works
--   bewusst fehl (Transaktionshistorie darf nicht verloren gehen) ->
--   die Funktion gibt dann einen klaren Fehler zurück.
-- - experiences.user_id referenziert auth.users(id) (nicht profiles) ->
--   ein Org-Profil (keine auth.users-Zeile) kann dort technisch nie als
--   user_id stehen; Zeile unten ist ein reines Sicherheitsnetz.
-- - moment_events.user_id -> profiles(id) ON DELETE SET NULL (nicht
--   CASCADE!) -> ohne explizites DELETE blieben die Event-Records mit
--   user_id=NULL zurück. Hard-Delete statt NULL-Setzung.
-- - post_comments.user_id -> profiles(id) ON DELETE SET NULL (nicht
--   CASCADE!) -> Kommentare des Org-Profils auf anderen Beiträgen
--   würden mit user_id=NULL erhalten bleiben. Hard-Delete.
-- - post_reactions.user_id -> profiles(id) ON DELETE CASCADE -> automatisch.
-- - comment_hearts.user_id -> profiles(id) ON DELETE CASCADE -> automatisch.
--
-- SICHERHEIT:
-- - Nur der/die tatsächliche Eigentümer:in (owner_user_id = auth.uid())
--   darf löschen.
-- - account_type MUSS 'organization' sein -> der persönliche Hauptaccount
--   kann über diese Funktion NIE gelöscht werden (harte DB-Garantie,
--   nicht nur UI-Beschränkung).
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

  -- ── HARD-DELETE: Alle Inhalte des Org-Profils ───────────────────

  -- 1. Werke: kein FK-Cascade auf profiles -> explizit hard-delete.
  --    Falls bereits verkauft (work_sales ON DELETE RESTRICT) -> Exception,
  --    die Funktion bricht bewusst ab statt Transaktionsdaten zu riskieren.
  DELETE FROM public.works WHERE user_id = p_org_id;

  -- 2. Erfahrungen/Erlebnisse: Sicherheitsnetz (FK auf auth.users, nicht
  --    profiles — im Normalfall No-Op für Org-Profile).
  DELETE FROM public.experiences WHERE user_id = p_org_id;

  -- 3. Moment-Events: FK ist SET NULL (nicht CASCADE) -> explizit hard-delete,
  --    sonst blieben Events mit user_id=NULL zurück.
  DELETE FROM public.moment_events WHERE user_id = p_org_id;

  -- 4. Kommentare des Org-Profils auf anderen Beiträgen: FK ist SET NULL
  --    (nicht CASCADE) -> explizit hard-delete.
  DELETE FROM public.post_comments WHERE user_id = p_org_id;

  -- 5. Finale Loeschung: beitraege (Momente!), talents, profile_locations,
  --    post_reactions, comment_hearts, saved_posts, story_reactions,
  --    impact_votes, notifications, user_presence, user_device_tokens,
  --    stripe_customers, ambassador_ref_links u.v.m. cascaden automatisch.
  DELETE FROM public.profiles WHERE id = p_org_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.rpc_delete_org_profile(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_delete_org_profile(uuid) TO authenticated;

COMMENT ON FUNCTION public.rpc_delete_org_profile(uuid) IS
  'Loescht ein Organisations-Profil (Verein/Unternehmen) inkl. ALLER Inhalte (Werke, Talente, Erlebnisse, Momente, Kommentare, Moment-Events). Hard-Delete, kein Soft-Delete. Nur durch den echten Eigentuemer (owner_user_id) aufrufbar, blockt strukturell jede Loeschung persoenlicher Accounts. Migration 136 v2, 2026-08-30.';
