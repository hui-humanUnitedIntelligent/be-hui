-- 073_liveticker_p0.sql
-- Liveticker 2.0 — Phase P0: RLS + Realtime-Publication
--
-- 1. impact_applications: öffentliches Lesen nur für freigegebene Projekte
-- 2. impact_votes (+ impact_applications) für Supabase Realtime freischalten
-- 3. Fehlende Liveticker-Quellen (works, experiences, invitations) idempotent ergänzen

-- ── 1. RLS: approved impact_applications öffentlich lesbar ─────────────────
DROP POLICY IF EXISTS "impact_apps_public_approved_read" ON public.impact_applications;
CREATE POLICY "impact_apps_public_approved_read" ON public.impact_applications
  FOR SELECT
  USING (status = 'approved');

-- ── 2. Realtime-Publication (idempotent, keine Duplikate) ─────────────────
DO $$
DECLARE
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'impact_votes',
    'impact_applications',
    'works',
    'experiences',
    'invitations'
  ]
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = tbl
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', tbl);
    END IF;
  END LOOP;
END $$;

COMMENT ON POLICY "impact_apps_public_approved_read" ON public.impact_applications IS
  'Liveticker P0: Nur freigegebene Projekte sind öffentlich lesbar.';
