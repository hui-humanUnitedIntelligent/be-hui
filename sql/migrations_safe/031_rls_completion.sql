-- ═══════════════════════════════════════════════════════════════
-- HUI Migration 031 — RLS Completion
-- Phase 4C.1 — Security & State Integrity
-- ═══════════════════════════════════════════════════════════════
-- 
-- Behebt: Tabellen die CREATE TABLE haben aber kein RLS enabled
-- Betroffen: audit_logs, impact_transactions, reports, webhook_events
--
-- AUSFÜHREN: Supabase Dashboard → SQL Editor → Run
-- ═══════════════════════════════════════════════════════════════

-- ── 1. audit_logs — nur Service-Role schreibt, admins lesen ─────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'audit_logs') THEN

    ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS audit_logs_admin_select ON public.audit_logs;
    CREATE POLICY audit_logs_admin_select ON public.audit_logs
      FOR SELECT USING (
        -- Nur Admins können Audit-Logs lesen (via app_metadata)
        (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
      );
    -- Insert: nur via Service-Role (kein auth.uid() check nötig — anon kann nicht schreiben)
    DROP POLICY IF EXISTS audit_logs_service_insert ON public.audit_logs;
    -- Kein INSERT policy = nur Service-Role kann schreiben (RLS enabled = anon blocked)

    RAISE NOTICE '✅ audit_logs: RLS enabled';
  ELSE
    RAISE NOTICE '⚠ audit_logs: Tabelle existiert nicht — übersprungen';
  END IF;
END $$;

-- ── 2. impact_transactions — User sieht eigene Transactions ─────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'impact_transactions') THEN

    ALTER TABLE public.impact_transactions ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS impact_tx_read ON public.impact_transactions;
    CREATE POLICY impact_tx_read ON public.impact_transactions
      FOR SELECT USING (
        auth.uid() = user_id OR
        (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
      );

    DROP POLICY IF EXISTS impact_tx_insert ON public.impact_transactions;
    CREATE POLICY impact_tx_insert ON public.impact_transactions
      FOR INSERT WITH CHECK (auth.uid() = user_id);

    RAISE NOTICE '✅ impact_transactions: RLS enabled';
  ELSE
    RAISE NOTICE '⚠ impact_transactions: Tabelle existiert nicht — übersprungen';
  END IF;
END $$;

-- ── 3. reports — User sieht eigene Reports, Admin alle ──────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'reports') THEN

    ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS reports_read ON public.reports;
    CREATE POLICY reports_read ON public.reports
      FOR SELECT USING (
        auth.uid() = reporter_id OR
        (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
      );

    DROP POLICY IF EXISTS reports_insert ON public.reports;
    CREATE POLICY reports_insert ON public.reports
      FOR INSERT WITH CHECK (
        auth.uid() = reporter_id AND
        auth.uid() IS NOT NULL
      );

    -- Update/Delete: nur Admin
    DROP POLICY IF EXISTS reports_admin_update ON public.reports;
    CREATE POLICY reports_admin_update ON public.reports
      FOR ALL USING (
        (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
      );

    RAISE NOTICE '✅ reports: RLS enabled';
  ELSE
    RAISE NOTICE '⚠ reports: Tabelle existiert nicht — übersprungen';
  END IF;
END $$;

-- ── 4. webhook_events — nur Service-Role (keine User-Access) ────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'webhook_events') THEN

    ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

    -- Kein User darf webhook_events lesen oder schreiben (nur Service-Role)
    -- RLS enabled ohne Policies = alles geblockt für auth users
    DROP POLICY IF EXISTS webhook_events_admin ON public.webhook_events;
    CREATE POLICY webhook_events_admin ON public.webhook_events
      FOR ALL USING (
        (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
      );

    RAISE NOTICE '✅ webhook_events: RLS enabled (admin-only)';
  ELSE
    RAISE NOTICE '⚠ webhook_events: Tabelle existiert nicht — übersprungen';
  END IF;
END $$;

-- ── 5. Verifikation ──────────────────────────────────────────────
SELECT
  schemaname,
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('audit_logs', 'impact_transactions', 'reports', 'webhook_events')
ORDER BY tablename;
