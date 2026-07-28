-- =============================================================================
-- AUDIT FIX 004 — Security Hardening: anon-Grants + Supabase Key Cleanup
-- Datum: 2026-07-28
-- Basis: Erweiterter Audit — Neue Dateien
-- =============================================================================

-- ═══════════════════════════════════════════════════════════════════════
-- TEIL 1: REVOKE anon von allen sensiblen Ambassador-RPCs
-- Befund: 19 RPCs waren anon=X/postgres → E-Mail/Telefon/Bank-Daten exposiert
-- ═══════════════════════════════════════════════════════════════════════

-- Sensible Lese-RPCs: kein anon-Zugriff
REVOKE ALL ON FUNCTION public.rpc_get_ambassador_bank_status(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.rpc_get_ambassador_earnings(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.rpc_get_ambassador_full_stats(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.rpc_get_ambassador_messages(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.rpc_get_ambassador_payout_stats() FROM anon;
REVOKE ALL ON FUNCTION public.rpc_get_ambassador_payout_summary(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.rpc_get_ambassador_projects(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.rpc_get_ambassador_ref_link(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.rpc_get_ambassador_works(uuid) FROM anon;

-- Write-RPCs: kein anon-Zugriff
REVOKE ALL ON FUNCTION public.rpc_ambassador_comment_project(uuid, uuid, text) FROM anon;
REVOKE ALL ON FUNCTION public.rpc_ambassador_comment_work(uuid, uuid, text) FROM anon;
REVOKE ALL ON FUNCTION public.rpc_ambassador_resonance(uuid, uuid, integer) FROM anon;
REVOKE ALL ON FUNCTION public.rpc_ambassador_send_message(uuid, uuid, text) FROM anon;
REVOKE ALL ON FUNCTION public.rpc_expire_stale_ambassador_commissions() FROM anon;
REVOKE ALL ON FUNCTION public.rpc_get_ambassador_bank_status(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.rpc_record_ambassador_commission(uuid, integer, text, text) FROM anon;
REVOKE ALL ON FUNCTION public.rpc_register_with_ambassador(uuid, uuid) FROM anon;
REVOKE ALL ON FUNCTION public.rpc_save_ambassador_bank_details(uuid, text, text, text, text) FROM anon;
REVOKE ALL ON FUNCTION public.increment_ambassador_referral_count() FROM anon;

-- rpc_validate_ambassador_name(text): anon BLEIBT (öffentlicher Name-Check bei Registrierung)
-- rpc_get_ambassador_referrals(uuid): anon war bereits revoked (Audit Fix 003)

-- ═══════════════════════════════════════════════════════════════════════
-- VERIFIKATION
-- ═══════════════════════════════════════════════════════════════════════
SELECT
  p.proname,
  CASE 
    WHEN EXISTS (SELECT 1 FROM unnest(p.proacl) a WHERE a::text LIKE 'anon=%X%')
    THEN '⚠️  anon hat Zugriff'
    ELSE '✅ kein anon'
  END AS anon_status
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.proname LIKE '%ambassador%'
ORDER BY p.proname;
