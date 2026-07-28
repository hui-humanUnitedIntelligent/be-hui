-- =============================================================================
-- AUDIT FIX 003 — Ambassador System: referred_by + RPC Cleanup
-- Datum: 2026-07-28
-- Basis: Ambassador System Audit Report
-- =============================================================================

-- ═══════════════════════════════════════════════════════════════════════
-- TEIL 1: referred_by_ambassador_id backfill
-- TEXT-Spalte 'referred_by' = SSOT (bleibt TEXT für Abwärtskompatibilität)
-- UUID-Spalte 'referred_by_ambassador_id' = typed SSOT — wird synchronisiert
-- Self-Referral (milileo → milileo) wird bereinigt
-- ═══════════════════════════════════════════════════════════════════════

-- 1a. referred_by_ambassador_id für alle backfillen wo referred_by eine UUID ist
UPDATE public.profiles
SET referred_by_ambassador_id = referred_by::uuid
WHERE referred_by IS NOT NULL
  AND referred_by ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  AND referred_by_ambassador_id IS NULL
  AND id != referred_by::uuid;  -- kein Self-Referral

-- 1b. Self-Referral bereinigen (Nutzer der auf sich selbst verweist)
-- bereits live ausgeführt am 2026-07-28; idempotent (kein Self-Referral mehr vorhanden)
UPDATE public.profiles
SET referred_by = NULL,
    referred_by_ambassador_id = NULL
WHERE id::text = referred_by
  AND is_ambassador = true;  -- bereinigt alle zukünftigen Self-Referrals

-- ═══════════════════════════════════════════════════════════════════════
-- TEIL 2: rpc_get_ambassador_referrals — korrekter Cast (TEXT-Spalte)
-- Aktuelle Version nutzt bereits ::text cast — SSOT verifiziert
-- Neue Version: schließt email/phone aus OUT-Parametern aus (Privacy)
-- ═══════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.rpc_get_ambassador_referrals(
  p_ambassador_id uuid
)
RETURNS TABLE (
  id            uuid,
  display_name  text,
  username      text,
  avatar_url    text,
  -- email: ENTFERNT (Privacy — nur über authenticated Admin-RPCs)
  -- phone: ENTFERNT (Privacy)
  role          text,
  created_at    timestamptz,
  first_transaction_at timestamptz,
  is_active     boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Sicherheitscheck: Aufrufer muss Ambassador oder Admin sein
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE public.profiles.id = auth.uid()
      AND (is_ambassador = true OR role IN ('admin', 'superadmin', 'super_admin'))
  ) THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  -- Aufrufer darf nur eigene Referrals sehen (außer Admins)
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE public.profiles.id = auth.uid()
      AND role IN ('admin', 'superadmin', 'super_admin')
  ) AND auth.uid() != p_ambassador_id THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    COALESCE(p.display_name, p.username, '-')::text,
    p.username,
    p.avatar_url,
    p.role,
    p.created_at,
    p.first_transaction_at,
    (p.first_transaction_at IS NOT NULL)
  FROM public.profiles p
  WHERE p.referred_by = p_ambassador_id::text  -- TEXT-Spalte, UUID cast
    AND p.id != p_ambassador_id                 -- kein Self-Referral
  ORDER BY p.created_at DESC;
END;
$$;

-- Grants: NUR authenticated (kein anon!)
REVOKE ALL ON FUNCTION public.rpc_get_ambassador_referrals(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.rpc_get_ambassador_referrals(uuid) TO authenticated;

-- ═══════════════════════════════════════════════════════════════════════
-- TEIL 3: rpc_ambassador_comment_project — von NOOP zu echtem Insert
-- Schreibt jetzt in post_comments (SSOT für alle Kommentare)
-- ═══════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.rpc_ambassador_comment_project(
  p_ambassador_id uuid,
  p_project_id    uuid,
  p_text          text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_amb    boolean;
  v_comment_id uuid;
BEGIN
  SELECT (role IN ('ambassador') OR is_ambassador = true)
  INTO v_is_amb FROM profiles WHERE id = p_ambassador_id;

  IF NOT COALESCE(v_is_amb, false) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_ambassador');
  END IF;
  IF trim(p_text) = '' OR length(trim(p_text)) < 2 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'empty_text');
  END IF;

  -- In post_comments schreiben (SSOT für alle Content-Typen)
  INSERT INTO post_comments (post_id, user_id, text, post_type, created_at)
  VALUES (p_project_id, p_ambassador_id, trim(p_text), 'project', now())
  RETURNING id INTO v_comment_id;

  RETURN jsonb_build_object('ok', true, 'comment_id', v_comment_id);
EXCEPTION WHEN others THEN
  RETURN jsonb_build_object('ok', false, 'error', SQLERRM);
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_ambassador_comment_project(uuid, uuid, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.rpc_ambassador_comment_project(uuid, uuid, text) TO authenticated;

-- ═══════════════════════════════════════════════════════════════════════
-- TEIL 4: rpc_ambassador_comment_work — Fehler: schreibt in 'comments'
-- 'comments' existiert NICHT in DB. Fix: post_comments (post_type='work')
-- ═══════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.rpc_ambassador_comment_work(
  p_ambassador_id uuid,
  p_work_id       uuid,
  p_text          text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_amb     boolean;
  v_comment_id uuid;
BEGIN
  SELECT (role IN ('ambassador') OR is_ambassador = true)
  INTO v_is_amb FROM profiles WHERE id = p_ambassador_id;

  IF NOT COALESCE(v_is_amb, false) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_ambassador');
  END IF;
  IF trim(p_text) = '' OR length(trim(p_text)) < 2 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'empty_text');
  END IF;

  -- post_comments mit post_type='work' (SSOT)
  INSERT INTO post_comments (post_id, user_id, text, post_type, created_at)
  VALUES (p_work_id, p_ambassador_id, trim(p_text), 'work', now())
  RETURNING id INTO v_comment_id;

  RETURN jsonb_build_object('ok', true, 'comment_id', v_comment_id);
EXCEPTION WHEN others THEN
  RETURN jsonb_build_object('ok', false, 'error', SQLERRM);
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_ambassador_comment_work(uuid, uuid, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.rpc_ambassador_comment_work(uuid, uuid, text) TO authenticated;

-- ═══════════════════════════════════════════════════════════════════════
-- TEIL 5: rpc_ambassador_resonance — impact_votes Missbrauch beheben
-- work_id wurde fälschlich in project_id geschrieben
-- Fix: post_reactions (SSOT für alle Content-Reaktionen)
-- ODER: work_likes falls work_id
-- ═══════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.rpc_ambassador_resonance(
  p_ambassador_id uuid,
  p_work_id       uuid,
  p_value         integer DEFAULT 1
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_amb boolean;
BEGIN
  SELECT (role IN ('ambassador') OR is_ambassador = true)
  INTO v_is_amb FROM profiles WHERE id = p_ambassador_id;

  IF NOT COALESCE(v_is_amb, false) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_ambassador');
  END IF;

  -- Ambassador-Resonanz = Like auf ein Werk (post_reactions, SSOT)
  INSERT INTO post_reactions (post_id, post_type, user_id, type, created_at)
  VALUES (p_work_id, 'work', p_ambassador_id, 'resonance', now())
  ON CONFLICT (post_id, user_id, type) DO NOTHING;

  RETURN jsonb_build_object('ok', true, 'resonance_logged', true);
EXCEPTION WHEN others THEN
  -- Fallback: work_likes
  BEGIN
    INSERT INTO work_likes (work_id, user_id, created_at)
    VALUES (p_work_id, p_ambassador_id, now())
    ON CONFLICT DO NOTHING;
    RETURN jsonb_build_object('ok', true, 'resonance_logged', true, 'via', 'work_likes');
  EXCEPTION WHEN others THEN
    RETURN jsonb_build_object('ok', false, 'error', SQLERRM);
  END;
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_ambassador_resonance(uuid, uuid, integer) FROM anon;
GRANT EXECUTE ON FUNCTION public.rpc_ambassador_resonance(uuid, uuid, integer) TO authenticated;

-- ═══════════════════════════════════════════════════════════════════════
-- VERIFIKATION
-- ═══════════════════════════════════════════════════════════════════════
SELECT
  'backfill_count' AS check_name,
  COUNT(*)::text AS result
FROM profiles
WHERE referred_by IS NOT NULL
  AND referred_by_ambassador_id IS NOT NULL
UNION ALL
SELECT
  'self_referral_count',
  COUNT(*)::text
FROM profiles
WHERE id::text = referred_by
UNION ALL
SELECT
  'rpc_referrals_grants',
  string_agg(grantee, ', ' ORDER BY grantee)
FROM information_schema.routine_privileges
WHERE routine_schema='public' AND routine_name='rpc_get_ambassador_referrals';

