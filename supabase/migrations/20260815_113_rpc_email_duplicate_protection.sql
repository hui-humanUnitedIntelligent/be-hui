-- ══════════════════════════════════════════════════════════════════════════
-- Migration 113: rpc_check_email_exists + rpc_log_registration_blocked
-- ══════════════════════════════════════════════════════════════════════════
-- ZWECK:
--   Vollständiger Schutz vor E-Mail-Duplikaten bei der Registrierung.
--   1) rpc_check_email_exists: Prüft ob eine E-Mail bereits in auth.users
--      existiert (unabhängig vom Bestätigungsstatus). Wird VOR signUp()
--      aufgerufen, um Duplikate frühzeitig abzufangen.
--   2) rpc_log_registration_blocked: Loggt blockierte Registrierungsversuche
--      in eine separate Tabelle für Sicherheits-Audit.
--
-- SICHERHEIT:
--   Beide RPCs sind SECURITY DEFINER (Lesezugriff auf auth.users).
--   rpc_check_email_exists gibt NUR ein Boolean zurück — keine sensiblen Daten.
--   Die Logging-Tabelle hat keine RLS für anon (nur INSERT via RPC),
--   SELECT nur für service_role.
-- ══════════════════════════════════════════════════════════════════════════

-- ── 1. Logging-Tabelle ──
CREATE TABLE IF NOT EXISTS public.registration_blocked_log (
  id          BIGSERIAL PRIMARY KEY,
  email       TEXT NOT NULL,
  reason      TEXT NOT NULL DEFAULT 'existing_email',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Keine RLS → anon kann nicht direkt lesen/schreiben, nur via SECURITY DEFINER RPC
ALTER TABLE public.registration_blocked_log ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.registration_blocked_log FROM anon, authenticated;
GRANT SELECT ON public.registration_blocked_log TO service_role;

-- ── 2. rpc_check_email_exists ──
CREATE OR REPLACE FUNCTION public.rpc_check_email_exists(p_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_exists boolean;
BEGIN
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE email = p_email) INTO v_exists;
  RETURN v_exists;
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_check_email_exists(text) TO anon, authenticated;

COMMENT ON FUNCTION public.rpc_check_email_exists(text) IS
  'Prueft ob eine E-Mail bereits in auth.users existiert (unabhaengig vom Bestaetigungsstatus). Wird VOR signUp() aufgerufen, um E-Mail-Duplikate fruehzeitig abzufangen. SECURITY DEFINER fuer Lesezugriff auf auth.users. Migration 113, 2026-08-15.';

-- ── 3. rpc_log_registration_blocked ──
CREATE OR REPLACE FUNCTION public.rpc_log_registration_blocked(p_email text, p_reason text DEFAULT 'existing_email')
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.registration_blocked_log (email, reason)
  VALUES (p_email, COALESCE(p_reason, 'existing_email'));
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_log_registration_blocked(text, text) TO anon, authenticated;

COMMENT ON FUNCTION public.rpc_log_registration_blocked(text, text) IS
  'Loggt blockierte Registrierungsversuche (z.B. bereits existierende E-Mail) in registration_blocked_log. SECURITY DEFINER fuer INSERT. Migration 113, 2026-08-15.';
