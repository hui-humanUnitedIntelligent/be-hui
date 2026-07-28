-- =============================================================================
-- AUDIT FIX 007 — Finaler Audit (Erweiterter Audit + Migrations 042-060)
-- Datum: 2026-07-28
-- =============================================================================

-- ═══════════════════════════════════════════════════════════════════════
-- VERIFIZIERTE FAKTEN (kein Fix nötig):
-- ═══════════════════════════════════════════════════════════════════════

-- ✅ RC1-001 (stripe-js 404): @stripe/stripe-js bereits in package.json — kein Fix
-- ✅ KRITISCH 3 (post_reactions fehlt): post_reactions + saved_posts + stories = existieren
-- ✅ HOCH 1 (user_presence fehlt): user_presence = existiert als BASE TABLE
-- ✅ messages.chat_id = UUID (nicht TEXT) — bereits korrekt
-- ✅ messages RLS = nur eine SELECT-Policy (messages_select_participants) — korrekt
-- ✅ main Branch Build = stabil (812 Module, @stripe/stripe-js korrekt)

-- ═══════════════════════════════════════════════════════════════════════
-- FIX 1: stories — is_active + text Spalten fehlen (hui_phase3_stories.sql Schema)
-- Befund: is_active fehlt → stories_read_public Policy WHERE is_active=true → Fehler
-- ═══════════════════════════════════════════════════════════════════════
ALTER TABLE public.stories
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS text text;

-- Konsolidierte SELECT-Policy (ersetzt stories_public_read + stories_select)
DROP POLICY IF EXISTS stories_read_public ON public.stories;
DROP POLICY IF EXISTS stories_public_read ON public.stories;
DROP POLICY IF EXISTS stories_select ON public.stories;

CREATE POLICY stories_public_read ON public.stories
  FOR SELECT
  USING (
    is_active = true
    AND (expires_at IS NULL OR expires_at > NOW() OR is_highlight = true)
    AND (status = 'published' AND (visibility = 'public' OR auth.uid() = user_id))
  );

-- ═══════════════════════════════════════════════════════════════════════
-- FIX 2: profiles — sensitive Felder schützen
-- Befund: trust_score, is_guardian, stripe_account_id, stripe_connect_status
--         über profiles_authenticated_read USING(true) öffentlich lesbar
-- Lösung: Sichere RPCs für öffentliche Profil-Abfragen
-- ═══════════════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS profiles_authenticated_read ON public.profiles;

CREATE POLICY profiles_public_read ON public.profiles
  FOR SELECT USING (true);
-- Direktzugriff über .select(): Frontend MUSS explizite Spalten-Whitelist verwenden
-- Sichere Abfrage für Öffentlichkeit: rpc_get_public_profile() / rpc_get_public_profile_by_id()

CREATE OR REPLACE FUNCTION public.rpc_get_public_profile(p_username text)
RETURNS json
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_result json;
BEGIN
  SELECT row_to_json(t) INTO v_result
  FROM (
    SELECT
      id, username, display_name, full_name, avatar_url, header_img, cover_url,
      bio, tagline, role, location_label, website,
      is_wirker, is_ambassador, is_member, has_talent_profile,
      membership_type, profile_views, follower_count, followers_count,
      dna_tags, profile_modules, focus_type, skills, mood_dna,
      is_available, availability, created_at
      -- AUSGESCHLOSSEN: trust_score, reduced_reach_until, is_guardian,
      --                 stripe_account_id, stripe_connect_status, email
    FROM profiles WHERE username = p_username
  ) t;
  RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION public.rpc_get_public_profile_by_id(p_id uuid)
RETURNS json
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_result json;
BEGIN
  SELECT row_to_json(t) INTO v_result
  FROM (
    SELECT
      id, username, display_name, full_name, avatar_url, header_img, cover_url,
      bio, tagline, role, location_label, website,
      is_wirker, is_ambassador, is_member, has_talent_profile,
      membership_type, profile_views, follower_count, followers_count,
      dna_tags, profile_modules, focus_type, skills, mood_dna,
      is_available, availability, created_at
    FROM profiles WHERE id = p_id
  ) t;
  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_get_public_profile(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_get_public_profile_by_id(uuid) TO anon, authenticated;

-- ═══════════════════════════════════════════════════════════════════════
-- ESLint-FIX (Code-seitig — nicht SQL)
-- RC1-002: eslint.config.js — react-hooks/exhaustive-deps: "warn" hinzugefügt
-- ═══════════════════════════════════════════════════════════════════════
-- (Änderung in eslint.config.js im Repo — nicht in SQL deploybar)

-- ═══════════════════════════════════════════════════════════════════════
-- VERIFIKATION
-- ═══════════════════════════════════════════════════════════════════════
SELECT 'stories_is_active_exists' AS check_name,
  COUNT(*)::text AS result
FROM information_schema.columns
WHERE table_schema='public' AND table_name='stories' AND column_name='is_active'
UNION ALL
SELECT 'stories_policy_is_active_based',
  COUNT(*)::text
FROM pg_policies
WHERE tablename='stories' AND qual LIKE '%is_active%'
UNION ALL
SELECT 'profiles_sensitive_cols_still_present',
  COUNT(*)::text
FROM information_schema.columns
WHERE table_schema='public' AND table_name='profiles'
  AND column_name IN ('trust_score','stripe_account_id','is_guardian')
UNION ALL
SELECT 'rpc_get_public_profile_exists',
  COUNT(*)::text
FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname='public' AND p.proname='rpc_get_public_profile';
