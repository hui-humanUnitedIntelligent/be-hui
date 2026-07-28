-- =============================================================================
-- AUDIT FIX 006 — Migrations 042–056 Schema-Verifikation + Fixes
-- Datum: 2026-07-28
-- Basis: SQL Migrations Audit 042–056
-- =============================================================================

-- ═══════════════════════════════════════════════════════════════════════
-- VERIFIZIERTE FAKTEN (kein Fix nötig):
-- ═══════════════════════════════════════════════════════════════════════

-- ✅ KRITISCH 1 (orders buyer_id/customer_id): Migration 056 ist deployed.
--    orders.customer_id (NOT NULL), orders.state (TEXT) — buyer_id/status entfernt.
--    Kein Fix nötig.

-- ✅ KRITISCH 2 (orders status ENUM): status-Spalte existiert nicht mehr.
--    Kein Fix nötig.

-- ✅ HOCH 2 (works published/visible): Spalten existieren nicht in DB.
--    Nur status + approval_status + visibility — kein 3-Status-Problem.

-- ✅ HOCH 3 (connections): Tabelle existiert, kein aktiver Frontend-Pfad.
--    Kein Fix nötig (technische Schuld, kein Bug).

-- ✅ MITTEL 3 (update_updated_at): Beide Funktionen existieren.
--    update_updated_at() als Alias auf NOW() vereinheitlicht (live).

-- ═══════════════════════════════════════════════════════════════════════
-- FIX 1: profile_watchlist — USING(true) Policy entfernt
-- Befund: watchlist_count_public WITH USING(true) → alle Watcher-IDs lesbar
-- Lösung: Policy auf eigene Einträge beschränkt; Count via RPC (service_role)
-- ═══════════════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS watchlist_count_public ON public.profile_watchlist;

CREATE POLICY watchlist_count_public ON public.profile_watchlist
  FOR SELECT
  USING (auth.uid() = watcher_id OR false);

-- Öffentliche Watch-Counts: via RPC mit service_role (anonyme Zählabfrage)
CREATE OR REPLACE FUNCTION public.rpc_get_profile_watch_count(p_profile_id uuid)
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::integer FROM public.profile_watchlist WHERE profile_id = p_profile_id;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_get_profile_watch_count(uuid) TO anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.rpc_get_profile_watch_count(uuid) FROM public;

-- ═══════════════════════════════════════════════════════════════════════
-- FIX 2: works — approval_status + status Konsistenz-Constraint
-- Befund: works können status='published' ohne approval='approved' haben
-- Lösung: CHECK-Constraint verhindert inkonsistente Zustände
-- ═══════════════════════════════════════════════════════════════════════
ALTER TABLE public.works DROP CONSTRAINT IF EXISTS works_status_approval_sync;

ALTER TABLE public.works
  ADD CONSTRAINT works_status_approval_sync
  CHECK (
    NOT (status = 'published' AND approval_status NOT IN ('approved', 'auto_approved'))
  );

-- ═══════════════════════════════════════════════════════════════════════
-- FIX 3: chat_participants — Orphan-Bereinigung + FK auf auth.users
-- Befund: 3 Einträge mit user_id '23301b16...' (gelöschter Test-User)
-- Kein FK vorhanden → READ-Tracking produziert stale Daten
-- ═══════════════════════════════════════════════════════════════════════
DELETE FROM public.chat_participants cp
WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = cp.user_id);

ALTER TABLE public.chat_participants
  DROP CONSTRAINT IF EXISTS chat_participants_user_id_fkey;

ALTER TABLE public.chat_participants
  ADD CONSTRAINT chat_participants_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- ═══════════════════════════════════════════════════════════════════════
-- FIX 4: update_updated_at() harmonisieren
-- Befund: zwei Varianten mit identischem Verhalten → vereinheitlicht
-- ═══════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ═══════════════════════════════════════════════════════════════════════
-- VERIFIKATION
-- ═══════════════════════════════════════════════════════════════════════
SELECT
  'profile_watchlist_no_public_access' AS check_name,
  (NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'profile_watchlist'
      AND qual::text = 'true'
  ))::text AS result
UNION ALL
SELECT 'works_status_constraint_exists',
  COUNT(*)::text
FROM pg_constraint
WHERE conrelid = 'public.works'::regclass
  AND conname = 'works_status_approval_sync'
UNION ALL
SELECT 'chat_participants_fk_exists',
  COUNT(*)::text
FROM pg_constraint
WHERE conrelid = 'public.chat_participants'::regclass
  AND contype = 'f'
UNION ALL
SELECT 'chat_participants_orphans',
  COUNT(*)::text
FROM public.chat_participants cp
WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = cp.user_id);
