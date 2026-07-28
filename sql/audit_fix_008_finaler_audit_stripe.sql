-- =============================================================================
-- AUDIT FIX 008 — Finaler Audit: Stripe, package.json, QUERY_RULES
-- Datum: 2026-07-28
-- =============================================================================

-- ═══════════════════════════════════════════════════════════════════════
-- VERIFIZIERTE FAKTEN (kein Fix nötig):
-- ═══════════════════════════════════════════════════════════════════════

-- ✅ stripe_payments.id = TEXT (nicht UUID) — stripe_rpc_final.sql korrekt deployed
-- ✅ rpc_record_payment = eine aktive Signatur (8-arg) — kein Overload-Problem
-- ✅ ambassador_status CHECK-Constraint: ('pending','confirmed','suspended')
-- ✅ ambassador_status Wert 'confirmed' = korrekt (matches rpc_payout_logic)
-- ✅ rpc_confirm_checkout = nicht in DB (wurde nicht deployed)
-- ✅ package.json @capacitor-Packages: BEHALTEN — android/ Projekt aktiv
-- ✅ Capacitor-Scripts (sync/android): BEHALTEN — Android-Build-Flow

-- ═══════════════════════════════════════════════════════════════════════
-- FIX 1: Stripe Admin Policies — employee-Rolle entfernt
-- Befund: profiles.role kennt kein 'employee' → Policy immer false für employee
-- Betroffene Tabellen: stripe_payments, stripe_ambassador_commissions,
--   stripe_impact_pool_events, stripe_payouts, stripe_refunds,
--   stripe_subscriptions, stripe_webhooks
-- Lösung: employee aus ARRAY-Check entfernt (nur superadmin + admin)
-- ═══════════════════════════════════════════════════════════════════════
-- (Alle 7 Policies bereits live gefixt — hier zur Dokumentation)
-- Pattern:
-- DROP POLICY IF EXISTS admin_read ON public.<table>;
-- CREATE POLICY admin_read ON public.<table> FOR SELECT USING (
--   EXISTS (SELECT 1 FROM profiles
--           WHERE profiles.id = auth.uid()
--             AND profiles.role = ANY (ARRAY['superadmin','admin']))
-- );

-- ═══════════════════════════════════════════════════════════════════════
-- FIX 2: profiles.role Normalisierung
-- Befund: 2 Datensätze mit role='basis_user' (sollte 'basisuser' sein)
-- ═══════════════════════════════════════════════════════════════════════
UPDATE public.profiles SET role = 'basisuser' WHERE role = 'basis_user';

-- ═══════════════════════════════════════════════════════════════════════
-- FIX 3: profiles.role CHECK-Constraint (kanonische Werte festschreiben)
-- ═══════════════════════════════════════════════════════════════════════
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN (
    'basisuser', 'member', 'talent', 'ambassador',
    'admin', 'superadmin',
    'blocked', 'deleted'
  ));

-- ═══════════════════════════════════════════════════════════════════════
-- NICHT GEFIXT (Dokumentation):
-- ═══════════════════════════════════════════════════════════════════════
-- KRITISCH 1 (package.json name): package.name='base44-app' → 'hui' (Code-seitig gefixt)
-- KRITISCH 2 (rpc_record_payment 8 Versionen): Eine aktive Signatur in DB → kein Problem
-- MITTEL 1 (rpc_confirm_checkout hardcoded Customer): RPC nicht in DB → kein Problem
-- QUERY_RULES.md: Auf Realitätsstatus aktualisiert (Zielzustand vs. Ist-Stand)
-- README.md: HUI-spezifisch neu geschrieben (Code-seitig gefixt)
-- ═══════════════════════════════════════════════════════════════════════

-- VERIFIKATION
SELECT 'stripe_policies_without_employee' AS check_name,
  COUNT(*)::text AS result
FROM pg_policies
WHERE (qual LIKE '%employee%' OR with_check LIKE '%employee%')
  AND tablename LIKE 'stripe%'
UNION ALL
SELECT 'profiles_role_basis_user_remaining',
  COUNT(*)::text
FROM profiles WHERE role = 'basis_user'
UNION ALL
SELECT 'profiles_role_constraint_exists',
  COUNT(*)::text
FROM pg_constraint
WHERE conrelid = 'public.profiles'::regclass
  AND conname = 'profiles_role_check';
