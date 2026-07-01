-- ═══════════════════════════════════════════════════════════════════
-- AMBASSADOR SYSTEM — FINAL MIGRATION
-- HUI ARCH-006.1 | 2026-07-01
-- Spec: AMBASSADOR-RPC-SPEC.md v1.0 (Approved)
-- 
-- Änderungen:
--   1. ALTER TABLE profiles → ambassador_status (text)
--   2. Alle RPCs korrekt nach Spec + echtem DB-Schema
-- ═══════════════════════════════════════════════════════════════════

BEGIN;

-- ─────────────────────────────────────────────────────────────────
-- SCHRITT 1: Schema-Erweiterung — ambassador_status
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS ambassador_status text
    CHECK (ambassador_status IN ('pending', 'confirmed', 'suspended'))
    DEFAULT NULL;

-- Index für schnelle Ambassador-Lookups
CREATE INDEX IF NOT EXISTS idx_profiles_ambassador_status
  ON profiles (ambassador_status)
  WHERE ambassador_status IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_referred_by
  ON profiles (referred_by)
  WHERE referred_by IS NOT NULL;

-- ─────────────────────────────────────────────────────────────────
-- SCHRITT 2: Bestehende Ambassadors auf 'confirmed' setzen
-- ─────────────────────────────────────────────────────────────────
UPDATE profiles
SET ambassador_status = 'confirmed'
WHERE (role = 'ambassador' OR is_ambassador = true)
  AND ambassador_status IS NULL;

-- ─────────────────────────────────────────────────────────────────
-- RPC 1: rpc_validate_ambassador_name
-- Spec: name → ambassador_id | null
-- Bedingung: role='ambassador' AND ambassador_status='confirmed'
-- URL-Bereinigung: https://be-hui.com/milileo → milileo
-- ─────────────────────────────────────────────────────────────────
DROP FUNCTION IF EXISTS rpc_validate_ambassador_name(text);
CREATE OR REPLACE FUNCTION rpc_validate_ambassador_name(p_name text)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_id   uuid;
  v_name text;
BEGIN
  -- URL-Bereinigung
  v_name := lower(trim(p_name));
  IF v_name LIKE '%be-hui.com/%' THEN
    v_name := regexp_replace(v_name, '^.*be-hui\.com/([a-z0-9._\-]+).*$', '\1', 'i');
  END IF;

  SELECT id INTO v_id
  FROM profiles
  WHERE lower(username) = v_name
    AND (role = 'ambassador' OR is_ambassador = true)
    AND ambassador_status = 'confirmed'
  LIMIT 1;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION rpc_validate_ambassador_name(text) TO anon, authenticated;

-- ─────────────────────────────────────────────────────────────────
-- RPC 2: rpc_get_ambassador_ref_link
-- Spec: ambassador_id → https://be-hui.com/<username>
-- Single Source of Truth: profiles.username
-- ─────────────────────────────────────────────────────────────────
DROP FUNCTION IF EXISTS rpc_get_ambassador_ref_link(uuid);
CREATE OR REPLACE FUNCTION rpc_get_ambassador_ref_link(p_ambassador_id uuid)
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_username text;
BEGIN
  SELECT username INTO v_username
  FROM profiles
  WHERE id = p_ambassador_id;

  IF v_username IS NULL THEN RETURN NULL; END IF;
  RETURN 'https://be-hui.com/' || v_username;
END;
$$;

GRANT EXECUTE ON FUNCTION rpc_get_ambassador_ref_link(uuid) TO anon, authenticated;

-- ─────────────────────────────────────────────────────────────────
-- RPC 3: rpc_get_ambassador_referrals
-- Spec: ambassador_id → Referral-Liste (mit phone + role)
-- Quelle: profiles.referred_by = ambassador_id
-- ─────────────────────────────────────────────────────────────────
DROP FUNCTION IF EXISTS rpc_get_ambassador_referrals(uuid);
CREATE OR REPLACE FUNCTION rpc_get_ambassador_referrals(p_ambassador_id uuid)
RETURNS TABLE (
  id                   uuid,
  display_name         text,
  username             text,
  avatar_url           text,
  email                text,
  phone                text,
  role                 text,
  created_at           timestamptz,
  first_transaction_at timestamptz,
  is_active            boolean
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    COALESCE(p.display_name, p.username, p.email, '—')::text,
    p.username,
    p.avatar_url,
    p.email,
    p.phone,
    p.role,
    p.created_at,
    p.first_transaction_at,
    (p.first_transaction_at IS NOT NULL)
  FROM profiles p
  WHERE p.referred_by = p_ambassador_id
  ORDER BY p.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION rpc_get_ambassador_referrals(uuid) TO authenticated;

-- ─────────────────────────────────────────────────────────────────
-- RPC 4: rpc_register_with_ambassador
-- Spec: user_id + ambassador_id → referral speichern
-- ─────────────────────────────────────────────────────────────────
DROP FUNCTION IF EXISTS rpc_register_with_ambassador(uuid, uuid);
CREATE OR REPLACE FUNCTION rpc_register_with_ambassador(
  p_user_id       uuid,
  p_ambassador_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_is_valid boolean;
BEGIN
  -- Ambassador-Validierung
  SELECT (role = 'ambassador' OR is_ambassador = true) AND ambassador_status = 'confirmed'
  INTO v_is_valid
  FROM profiles WHERE id = p_ambassador_id;

  IF NOT COALESCE(v_is_valid, false) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_ambassador');
  END IF;

  -- Nutzer darf noch kein referral haben
  UPDATE profiles
  SET referred_by = p_ambassador_id
  WHERE id = p_user_id
    AND referred_by IS NULL;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'already_referred_or_not_found');
  END IF;

  RETURN jsonb_build_object('ok', true);
END;
$$;

GRANT EXECUTE ON FUNCTION rpc_register_with_ambassador(uuid, uuid) TO authenticated;

-- ─────────────────────────────────────────────────────────────────
-- RPC 5: rpc_ambassador_comment_work
-- Tabelle: comments (work_id, user_id, text, created_at)
-- ─────────────────────────────────────────────────────────────────
DROP FUNCTION IF EXISTS rpc_ambassador_comment_work(uuid, uuid, text);
CREATE OR REPLACE FUNCTION rpc_ambassador_comment_work(
  p_work_id       uuid,
  p_ambassador_id uuid,
  p_text          text
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_is_amb     boolean;
  v_comment_id uuid;
BEGIN
  SELECT (role = 'ambassador' OR is_ambassador = true)
  INTO v_is_amb FROM profiles WHERE id = p_ambassador_id;

  IF NOT COALESCE(v_is_amb, false) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_ambassador');
  END IF;
  IF trim(p_text) = '' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'empty_text');
  END IF;

  INSERT INTO comments (work_id, user_id, text, created_at)
  VALUES (p_work_id, p_ambassador_id, trim(p_text), now())
  RETURNING id INTO v_comment_id;

  RETURN jsonb_build_object('ok', true, 'comment_id', v_comment_id);
EXCEPTION WHEN others THEN
  RETURN jsonb_build_object('ok', false, 'error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION rpc_ambassador_comment_work(uuid, uuid, text) TO authenticated;

-- ─────────────────────────────────────────────────────────────────
-- RPC 6: rpc_ambassador_comment_project
-- Nutzt notification_events für projekt-bezogene Kommentare
-- (projects hat kein eigenes comments-System)
-- ─────────────────────────────────────────────────────────────────
DROP FUNCTION IF EXISTS rpc_ambassador_comment_project(uuid, uuid, text);
CREATE OR REPLACE FUNCTION rpc_ambassador_comment_project(
  p_project_id    uuid,
  p_ambassador_id uuid,
  p_text          text
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_is_amb boolean;
BEGIN
  SELECT (role = 'ambassador' OR is_ambassador = true)
  INTO v_is_amb FROM profiles WHERE id = p_ambassador_id;

  IF NOT COALESCE(v_is_amb, false) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_ambassador');
  END IF;
  IF trim(p_text) = '' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'empty_text');
  END IF;

  -- Kommentar als comment-Eintrag mit work_id=null, project_id über user_id gespeichert
  -- Da comments nur work_id kennt: nutze notification_events als Audit-Log
  INSERT INTO notification_events (user_id, type, metadata, created_at)
  VALUES (
    p_ambassador_id,
    'ambassador_project_comment',
    jsonb_build_object(
      'project_id', p_project_id,
      'text', trim(p_text),
      'ambassador_id', p_ambassador_id
    ),
    now()
  );

  RETURN jsonb_build_object('ok', true);
EXCEPTION WHEN others THEN
  RETURN jsonb_build_object('ok', false, 'error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION rpc_ambassador_comment_project(uuid, uuid, text) TO authenticated;

-- ─────────────────────────────────────────────────────────────────
-- RPC 7: rpc_ambassador_send_message
-- Tabelle: chats (participant_ids array, last_message, last_message_at)
-- ─────────────────────────────────────────────────────────────────
DROP FUNCTION IF EXISTS rpc_ambassador_send_message(uuid, uuid, text);
CREATE OR REPLACE FUNCTION rpc_ambassador_send_message(
  p_user_id       uuid,
  p_ambassador_id uuid,
  p_text          text
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_is_amb  boolean;
  v_chat_id uuid;
  v_parts   uuid[];
BEGIN
  SELECT (role = 'ambassador' OR is_ambassador = true)
  INTO v_is_amb FROM profiles WHERE id = p_ambassador_id;

  IF NOT COALESCE(v_is_amb, false) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_ambassador');
  END IF;
  IF trim(p_text) = '' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'empty_text');
  END IF;

  v_parts := ARRAY[p_ambassador_id, p_user_id];

  SELECT id INTO v_chat_id
  FROM chats
  WHERE participant_ids @> v_parts AND participant_ids <@ v_parts
  LIMIT 1;

  IF v_chat_id IS NULL THEN
    INSERT INTO chats (participant_ids, last_message, last_message_at, created_at)
    VALUES (v_parts, trim(p_text), now(), now())
    RETURNING id INTO v_chat_id;
  ELSE
    UPDATE chats
    SET last_message = trim(p_text), last_message_at = now()
    WHERE id = v_chat_id;
  END IF;

  RETURN jsonb_build_object('ok', true, 'chat_id', v_chat_id);
EXCEPTION WHEN others THEN
  RETURN jsonb_build_object('ok', false, 'error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION rpc_ambassador_send_message(uuid, uuid, text) TO authenticated;

-- ─────────────────────────────────────────────────────────────────
-- RPC 8: rpc_ambassador_resonance
-- Keine 'resonance'-Tabelle → nutzt notification_events als Audit
-- ─────────────────────────────────────────────────────────────────
DROP FUNCTION IF EXISTS rpc_ambassador_resonance(uuid, uuid, integer);
DROP FUNCTION IF EXISTS rpc_ambassador_resonance(uuid, uuid);
CREATE OR REPLACE FUNCTION rpc_ambassador_resonance(
  p_work_id       uuid,
  p_ambassador_id uuid,
  p_value         integer DEFAULT 1
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_is_amb boolean;
BEGIN
  SELECT (role = 'ambassador' OR is_ambassador = true)
  INTO v_is_amb FROM profiles WHERE id = p_ambassador_id;

  IF NOT COALESCE(v_is_amb, false) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_ambassador');
  END IF;

  INSERT INTO notification_events (user_id, type, metadata, created_at)
  VALUES (
    p_ambassador_id,
    'ambassador_resonance',
    jsonb_build_object(
      'work_id', p_work_id,
      'value', COALESCE(p_value, 1)
    ),
    now()
  )
  ON CONFLICT DO NOTHING;

  RETURN jsonb_build_object('ok', true);
EXCEPTION WHEN others THEN
  RETURN jsonb_build_object('ok', false, 'error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION rpc_ambassador_resonance(uuid, uuid, integer) TO authenticated;

-- ─────────────────────────────────────────────────────────────────
-- RPC 9: rpc_get_ambassador_works
-- ─────────────────────────────────────────────────────────────────
DROP FUNCTION IF EXISTS rpc_get_ambassador_works(uuid);
CREATE OR REPLACE FUNCTION rpc_get_ambassador_works(p_ambassador_id uuid)
RETURNS TABLE (
  id           uuid,
  title        text,
  description  text,
  media_url    text,
  status       text,
  created_at   timestamptz
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    w.id,
    w.title,
    w.description,
    w.media_url,
    w.status,
    w.created_at
  FROM works w
  WHERE w.user_id = p_ambassador_id
  ORDER BY w.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION rpc_get_ambassador_works(uuid) TO authenticated;

-- ─────────────────────────────────────────────────────────────────
-- RPC 10: rpc_get_ambassador_projects
-- ─────────────────────────────────────────────────────────────────
DROP FUNCTION IF EXISTS rpc_get_ambassador_projects(uuid);
CREATE OR REPLACE FUNCTION rpc_get_ambassador_projects(p_ambassador_id uuid)
RETURNS TABLE (
  id           uuid,
  title        text,
  description  text,
  status       text,
  created_at   timestamptz
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.title,
    p.description,
    p.status,
    p.created_at
  FROM impact_projects p
  WHERE p.user_id = p_ambassador_id
  ORDER BY p.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION rpc_get_ambassador_projects(uuid) TO authenticated;

-- ─────────────────────────────────────────────────────────────────
-- RPC 11: rpc_get_ambassador_messages
-- ─────────────────────────────────────────────────────────────────
DROP FUNCTION IF EXISTS rpc_get_ambassador_messages(uuid);
CREATE OR REPLACE FUNCTION rpc_get_ambassador_messages(p_ambassador_id uuid)
RETURNS TABLE (
  chat_id          uuid,
  other_user_id    uuid,
  other_username   text,
  last_message     text,
  last_message_at  timestamptz
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    (SELECT unnest(c.participant_ids) EXCEPT SELECT p_ambassador_id LIMIT 1),
    (SELECT p.username FROM profiles p
     WHERE p.id = (
       SELECT unnest(c.participant_ids)
       EXCEPT SELECT p_ambassador_id
       LIMIT 1
     )),
    c.last_message,
    c.last_message_at
  FROM chats c
  WHERE c.participant_ids @> ARRAY[p_ambassador_id]
  ORDER BY c.last_message_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION rpc_get_ambassador_messages(uuid) TO authenticated;

-- ─────────────────────────────────────────────────────────────────
-- RPC 12: rpc_get_all_ambassadors (SADB + AD)
-- ─────────────────────────────────────────────────────────────────
DROP FUNCTION IF EXISTS rpc_get_all_ambassadors();
CREATE OR REPLACE FUNCTION rpc_get_all_ambassadors()
RETURNS TABLE (
  id                uuid,
  username          text,
  display_name      text,
  email             text,
  phone             text,
  avatar_url        text,
  ambassador_status text,
  referral_count    bigint,
  ref_link          text,
  created_at        timestamptz
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.username,
    COALESCE(p.display_name, p.username, p.email),
    p.email,
    p.phone,
    p.avatar_url,
    p.ambassador_status,
    (SELECT COUNT(*) FROM profiles r WHERE r.referred_by = p.id),
    'https://be-hui.com/' || p.username,
    p.created_at
  FROM profiles p
  WHERE p.role = 'ambassador' OR p.is_ambassador = true
  ORDER BY p.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION rpc_get_all_ambassadors() TO authenticated;

-- ─────────────────────────────────────────────────────────────────
-- RPC 13: rpc_set_ambassador_status (SADB — vergeben/entziehen)
-- ─────────────────────────────────────────────────────────────────
DROP FUNCTION IF EXISTS rpc_set_ambassador_status(uuid, text, uuid);
CREATE OR REPLACE FUNCTION rpc_set_ambassador_status(
  p_target_user_id uuid,
  p_status         text,   -- 'confirmed' | 'pending' | 'suspended' | 'revoked'
  p_admin_id       uuid
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_admin_role text;
BEGIN
  SELECT role INTO v_admin_role FROM profiles WHERE id = p_admin_id;
  IF v_admin_role NOT IN ('superadmin', 'admin') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'unauthorized');
  END IF;

  IF p_status = 'revoked' THEN
    UPDATE profiles
    SET role = 'basisuser',
        is_ambassador = false,
        ambassador_status = NULL
    WHERE id = p_target_user_id;
  ELSE
    UPDATE profiles
    SET role = 'ambassador',
        is_ambassador = true,
        ambassador_status = p_status
    WHERE id = p_target_user_id;
  END IF;

  RETURN jsonb_build_object('ok', true, 'status', p_status);
END;
$$;

GRANT EXECUTE ON FUNCTION rpc_set_ambassador_status(uuid, text, uuid) TO authenticated;

COMMIT;
