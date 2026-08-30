-- ════════════════════════════════════════════════════════════════
-- Migration 137: Org-Profile können vollständig als sich selbst posten
-- Datum: 2026-08-30
--
-- ZWECK (Michael, 2026-08-30 23:02):
-- "wenn der Verein oder das Unternehmen etwas postet, dann soll es im
-- Namen vom Verein oder Unternehmen sein — vom Account wo gepostet wurde."
--
-- FAKTEN-CHECK vor dem Bau (Arbeitsregeln §2/§4):
--
-- BLOCKER 1 (harter DB-Crash): works.creator_id hatte FOREIGN KEY auf
-- auth.users(id). Ein Org-Profil hat KEINE auth.users-Zeile (nur eine
-- profiles-Zeile mit eigener UUID). WerkWizard.jsx setzt creator_id
-- IMMER identisch zu user_id -> das Erstellen eines Werks als Org-Profil
-- hätte mit "insert or update on table works violates foreign key
-- constraint works_creator_id_fkey" fehlgeschlagen (23503).
-- Orphan-Check VORHER: 0 Zeilen mit creator_id ohne passende profiles-Zeile
-- -> Aenderung ist verlustfrei sicher (jeder echte auth.users-Eintrag hat
-- durch handle_new_user() 1:1 eine profiles-Zeile mit identischer id).
-- FIX: FK zeigt jetzt auf profiles(id) statt auth.users(id) — exakt das
-- Muster, das talents.user_id bereits nutzt.
--
-- BLOCKER 2 (harter DB-Crash): experiences.user_id hatte FOREIGN KEY auf
-- auth.users(id) — dieselbe Falle wie oben, diesmal auf der einzigen
-- Identitätsspalte der Tabelle. JEDES Erlebnis als Org-Profil wäre sofort
-- an der FK gescheitert. Orphan-Check VORHER: 0 Zeilen betroffen.
-- FIX: FK zeigt jetzt auf profiles(id).
--
-- BLOCKER 3 (stille Blockade, kein Fehler, aber unbenutzbar): Migration 132
-- hatte NUR INSERT-Policies um Org-Profile ("_insert_org") ergänzt. UPDATE/
-- DELETE/SELECT-own blieben bei "auth.uid() = user_id" — das ist für
-- Org-Content IMMER falsch (user_id = Org-UUID ≠ auth.uid() des
-- Eigentümers). Damit hätte Michael ein für "Testverein" erstelltes Werk/
-- Talent/Erlebnis NIE WIEDER bearbeiten, löschen oder als eigenen Entwurf
-- sehen können — komplett unerreichbar nach der Erstellung.
-- FIX: Alle UPDATE/DELETE/SELECT-own Policies für works, talents,
-- experiences um denselben Org-Check erweitert, den migration 132 für
-- INSERT eingeführt hat:
--   EXISTS (SELECT 1 FROM profiles p WHERE p.id = <tabelle>.user_id
--           AND p.owner_user_id = auth.uid())
--
-- BLOCKER 4: beitraege (Momente) hatte GAR KEINE Org-Policy — nicht mal
-- für INSERT. "auth.uid() = user_id" strikt, ohne Ausnahme. Ein Moment
-- mit user_id = Org-UUID wäre von RLS komplett verweigert worden (0 rows
-- affected / RLS-Fehler), unabhängig vom App-Code.
-- FIX: beitraege_insert/_update_own/_delete um denselben Org-Check erweitert.
-- (beitraege_select/_select_all sind bereits qual=true -> öffentlich lesbar,
-- keine Änderung nötig.)
--
-- SICHERHEIT: Der Org-Check verlangt IMMER p.owner_user_id = auth.uid() —
-- nur der tatsächliche Eigentümer des Org-Profils darf in dessen Namen
-- posten/bearbeiten/löschen. Kein Fremdzugriff möglich.
-- ════════════════════════════════════════════════════════════════

-- ═══ 1. FK-Fixes: erlauben Org-UUIDs als creator_id / user_id ═══

ALTER TABLE public.works DROP CONSTRAINT IF EXISTS works_creator_id_fkey;
ALTER TABLE public.works ADD CONSTRAINT works_creator_id_fkey
  FOREIGN KEY (creator_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.experiences DROP CONSTRAINT IF EXISTS experiences_user_id_fkey;
ALTER TABLE public.experiences ADD CONSTRAINT experiences_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- ═══ 2. WORKS: Update/Delete/Select-own für Org-Profile ═══

DROP POLICY IF EXISTS works_update_own ON public.works;
CREATE POLICY works_update_own ON public.works
  FOR UPDATE
  USING (
    auth.uid() = user_id OR auth.uid() = creator_id
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = works.user_id AND p.owner_user_id = auth.uid())
  );

DROP POLICY IF EXISTS works_delete_own ON public.works;
CREATE POLICY works_delete_own ON public.works
  FOR DELETE
  USING (
    auth.uid() = user_id OR auth.uid() = creator_id
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = works.user_id AND p.owner_user_id = auth.uid())
  );

DROP POLICY IF EXISTS works_select_published ON public.works;
CREATE POLICY works_select_published ON public.works
  FOR SELECT
  USING (
    (status = 'published' AND (visibility IS NULL OR visibility = 'public'))
    OR auth.uid() = user_id OR auth.uid() = creator_id
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = works.user_id AND p.owner_user_id = auth.uid())
  );

-- ═══ 3. TALENTS: Update/Delete/Select-own für Org-Profile ═══

DROP POLICY IF EXISTS talents_update_own_not_approved ON public.talents;
CREATE POLICY talents_update_own_not_approved ON public.talents
  FOR UPDATE
  USING (
    (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = talents.user_id AND p.owner_user_id = auth.uid()))
    AND status <> 'approved'
  )
  WITH CHECK (
    auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = talents.user_id AND p.owner_user_id = auth.uid())
  );

DROP POLICY IF EXISTS talents_delete_own ON public.talents;
CREATE POLICY talents_delete_own ON public.talents
  FOR DELETE
  USING (
    auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = talents.user_id AND p.owner_user_id = auth.uid())
  );

DROP POLICY IF EXISTS talents_visible_approved_or_own ON public.talents;
CREATE POLICY talents_visible_approved_or_own ON public.talents
  FOR SELECT
  USING (
    status = 'approved'
    OR auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = talents.user_id AND p.owner_user_id = auth.uid())
  );

-- ═══ 4. EXPERIENCES: Update/Delete/Select-own für Org-Profile ═══

DROP POLICY IF EXISTS exp_update ON public.experiences;
CREATE POLICY exp_update ON public.experiences
  FOR UPDATE
  USING (
    auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = experiences.user_id AND p.owner_user_id = auth.uid())
  );

DROP POLICY IF EXISTS exp_delete ON public.experiences;
CREATE POLICY exp_delete ON public.experiences
  FOR DELETE
  USING (
    auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = experiences.user_id AND p.owner_user_id = auth.uid())
  );

DROP POLICY IF EXISTS experiences_own_read ON public.experiences;
CREATE POLICY experiences_own_read ON public.experiences
  FOR SELECT
  USING (
    auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = experiences.user_id AND p.owner_user_id = auth.uid())
  );

DROP POLICY IF EXISTS exp_select ON public.experiences;
CREATE POLICY exp_select ON public.experiences
  FOR SELECT
  USING (
    status = 'published'
    OR auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = experiences.user_id AND p.owner_user_id = auth.uid())
  );

-- Legacy ALL-Command-Policies (überlappend, aber weiterhin aktiv) — für
-- Konsistenz ebenfalls um den Org-Check erweitert:
DROP POLICY IF EXISTS experiences_own_all ON public.experiences;
CREATE POLICY experiences_own_all ON public.experiences
  FOR ALL
  USING (
    auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = experiences.user_id AND p.owner_user_id = auth.uid())
  );

DROP POLICY IF EXISTS experiences_own_write ON public.experiences;
CREATE POLICY experiences_own_write ON public.experiences
  FOR ALL
  USING (
    auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = experiences.user_id AND p.owner_user_id = auth.uid())
  );

-- ═══ 5. BEITRAEGE (Momente): Insert/Update/Delete für Org-Profile ═══
-- (Select ist bereits öffentlich/qual=true, keine Änderung nötig)

DROP POLICY IF EXISTS beitraege_insert ON public.beitraege;
CREATE POLICY beitraege_insert ON public.beitraege
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = beitraege.user_id AND p.owner_user_id = auth.uid())
  );

DROP POLICY IF EXISTS beitraege_update_own ON public.beitraege;
CREATE POLICY beitraege_update_own ON public.beitraege
  FOR UPDATE
  USING (
    auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = beitraege.user_id AND p.owner_user_id = auth.uid())
  );

DROP POLICY IF EXISTS beitraege_delete ON public.beitraege;
CREATE POLICY beitraege_delete ON public.beitraege
  FOR DELETE
  USING (
    auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = beitraege.user_id AND p.owner_user_id = auth.uid())
  );
