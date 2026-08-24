-- ══════════════════════════════════════════════════════════════════════════════
-- RLS SECURITY FIX — Migration 20260824_123
-- Schließt Lücken im RLS-Audit (2026-08-24):
--
-- 1. impact_milestones.ms_update (UPDATE qual=true) — jeder konnte
--    jeden Meilenstein ändern. Fix: nur Projekt-Owner.
-- 2. impact_milestones.ms_insert (INSERT with_check=true) — jeder konnte
--    Meilensteine für fremde Projekte anlegen. Fix: nur Projekt-Owner.
-- 3. i18n_translations.i18n_update_auth (UPDATE with_check=true) — jeder
--    konnte Übersetzungen ändern. Fix: nur admins.
--
-- NO-REGRESSION: Bestehende SELECT-Policies bleiben unverändert.
-- ══════════════════════════════════════════════════════════════════════════════

-- ── 1. impact_milestones: INSERT/UPDATE auf Projekt-Owner beschränken ────────

-- INSERT: nur wenn das zugehörige Projekt dem aktuellen Nutzer gehört
DROP POLICY IF EXISTS "ms_insert" ON public.impact_milestones;
CREATE POLICY "ms_insert"
  ON public.impact_milestones FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.impact_applications ia
      WHERE ia.id = project_id
        AND ia.user_id = auth.uid()
    )
  );

-- UPDATE: nur wenn das zugehörige Projekt dem aktuellen Nutzer gehört
DROP POLICY IF EXISTS "ms_update" ON public.impact_milestones;
CREATE POLICY "ms_update"
  ON public.impact_milestones FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.impact_applications ia
      WHERE ia.id = project_id
        AND ia.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.impact_applications ia
      WHERE ia.id = project_id
        AND ia.user_id = auth.uid()
    )
  );

-- ── 2. impact_milestone_updates: INSERT auf Projekt-Owner beschränken ────────
-- Aktuell: impact_events_insert hat with_check=true (jeder kann einfügen)
-- Das ist OK für Vote-Events (System fügt ein), aber milestone_updates
-- sollten nur vom Projekt-Owner kommen.
-- Prüfe: gibt es eine eigene Policy für milestone_updates?
-- → impact_milestone_updates_select_all (SELECT true) = OK (öffentlich lesbar)
-- → impact_events_insert ist auf impact_events, nicht milestone_updates
-- → milestone_updates hat KEINE insert-Policy → RLS blockt INSERT standardmäßig
-- → Aber: die App macht INSERT aus dem Client → das würde fehlschlagen
-- → Es muss eine INSERT-Policy geben die den Owner prüft

DROP POLICY IF EXISTS "impact_milestone_updates_insert_owner" ON public.impact_milestone_updates;
CREATE POLICY "impact_milestone_updates_insert_owner"
  ON public.impact_milestone_updates FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.impact_applications ia
      WHERE ia.id = project_id
        AND ia.user_id = auth.uid()
    )
  );

-- ── 3. i18n_translations: UPDATE auf admins beschränken ──────────────────────
DROP POLICY IF EXISTS "i18n_update_auth" ON public.i18n_translations;
CREATE POLICY "i18n_update_auth"
  ON public.i18n_translations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'superadmin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'superadmin', 'super_admin')
    )
  );

-- ── 4. i18n_translations: INSERT ebenfalls auf admins beschränken ───────────
DROP POLICY IF EXISTS "i18n_insert_auth" ON public.i18n_translations;
CREATE POLICY "i18n_insert_auth"
  ON public.i18n_translations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'superadmin', 'super_admin')
    )
  );
