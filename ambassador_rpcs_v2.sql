BEGIN;

-- ============================================================
-- ADR-AMBASSADOR-SYSTEM RPCs v2
-- ARCH-006.1 konform | 2026-07-01
-- Bestehende Tabellen: profiles, comments, chats, notification_events
-- comments-Schema: id, work_id, user_id, text, created_at
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- P1.1 — rpc_validate_ambassador_name
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION rpc_validate_ambassador_name(name text)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_id   uuid;
  v_name text;
BEGIN
  v_name := lower(trim(name));
  -- URL-Extraktion: be-hui.com/username → username
  IF v_name LIKE '%be-hui.com/%' THEN
    v_name := regexp_replace(v_name, '^.*be-hui\.com/([a-z0-9._-]+).*$', '\1');
  END IF;

  SELECT id INTO v_id
  FROM profiles
  WHERE username = v_name
    AND (role = 'ambassador' OR is_ambassador = true)
  LIMIT 1;

  RETURN v_id;
END;
$$;

-- ────────────────────────────────────────────────────────────
-- P1.2 — rpc_get_ambassador_ref_link
-- Autoritative Quelle: profiles.username
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION rpc_get_ambassador_ref_link(ambassador_id uuid)
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_username text;
BEGIN
  SELECT username INTO v_username FROM profiles WHERE id = ambassador_id;
  IF v_username IS NULL THEN RETURN NULL; END IF;
  RETURN 'https://be-hui.com/' || v_username;
END;
$$;

-- ────────────────────────────────────────────────────────────
-- P1.3 — rpc_get_ambassador_referrals (mit phone)
-- ────────────────────────────────────────────────────────────
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
    COALESCE(p.display_name, p.username, p.email, '—'),
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

-- ────────────────────────────────────────────────────────────
-- P2.1 — rpc_ambassador_comment_work
-- comments-Schema: work_id, user_id, text
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION rpc_ambassador_comment_work(
  p_work_id       uuid,
  p_ambassador_id uuid,
  p_text          text
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_is_ambassador boolean;
  v_comment_id    uuid;
BEGIN
  SELECT (role = 'ambassador' OR is_ambassador = true)
  INTO v_is_ambassador
  FROM profiles WHERE id = p_ambassador_id;

  IF NOT COALESCE(v_is_ambassador, false) THEN
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

-- ────────────────────────────────────────────────────────────
-- P2.2 — rpc_ambassador_comment_project
-- Projekte haben keine eigene comments-Tabelle → notification_events als Log
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION rpc_ambassador_comment_project(
  p_project_id    uuid,
  p_ambassador_id uuid,
  p_text          text
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_is_ambassador boolean;
BEGIN
  SELECT (role = 'ambassador' OR is_ambassador = true)
  INTO v_is_ambassador
  FROM profiles WHERE id = p_ambassador_id;

  IF NOT COALESCE(v_is_ambassador, false) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_ambassador');
  END IF;
  IF trim(p_text) = '' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'empty_text');
  END IF;

  INSERT INTO notification_events (user_id, event_type, table_name, record_id, metadata, created_at)
  VALUES (
    p_ambassador_id, 'ambassador_project_comment', 'impact_applications', p_project_id,
    jsonb_build_object('text', trim(p_text), 'ambassador_id', p_ambassador_id),
    now()
  );

  RETURN jsonb_build_object('ok', true);
EXCEPTION WHEN others THEN
  RETURN jsonb_build_object('ok', false, 'error', SQLERRM);
END;
$$;

-- ────────────────────────────────────────────────────────────
-- P2.3 — rpc_ambassador_send_message
-- Nutzt bestehende chats-Tabelle
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION rpc_ambassador_send_message(
  p_user_id       uuid,
  p_ambassador_id uuid,
  p_text          text
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_is_ambassador boolean;
  v_chat_id       uuid;
  v_participants  uuid[];
BEGIN
  SELECT (role = 'ambassador' OR is_ambassador = true)
  INTO v_is_ambassador
  FROM profiles WHERE id = p_ambassador_id;

  IF NOT COALESCE(v_is_ambassador, false) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_ambassador');
  END IF;
  IF trim(p_text) = '' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'empty_text');
  END IF;

  v_participants := ARRAY[p_ambassador_id, p_user_id];

  -- Bestehenden Chat finden
  SELECT id INTO v_chat_id
  FROM chats
  WHERE participant_ids @> v_participants
    AND participant_ids <@ v_participants
  LIMIT 1;

  IF v_chat_id IS NULL THEN
    INSERT INTO chats (participant_ids, last_message, last_message_at, state, created_at)
    VALUES (v_participants, trim(p_text), now(), 'active', now())
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

-- ────────────────────────────────────────────────────────────
-- P2.4 — rpc_ambassador_resonance
-- Nutzt notification_events als Resonanz-Log (keine eigene Tabelle nötig)
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION rpc_ambassador_resonance(
  p_work_id       uuid,
  p_ambassador_id uuid,
  p_value         integer DEFAULT 1
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_is_ambassador boolean;
BEGIN
  SELECT (role = 'ambassador' OR is_ambassador = true)
  INTO v_is_ambassador
  FROM profiles WHERE id = p_ambassador_id;

  IF NOT COALESCE(v_is_ambassador, false) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_ambassador');
  END IF;

  INSERT INTO notification_events (user_id, event_type, table_name, record_id, metadata, created_at)
  VALUES (
    p_ambassador_id, 'ambassador_resonance', 'works', p_work_id,
    jsonb_build_object('value', p_value, 'ambassador_id', p_ambassador_id),
    now()
  );

  RETURN jsonb_build_object('ok', true);
EXCEPTION WHEN others THEN
  RETURN jsonb_build_object('ok', false, 'error', SQLERRM);
END;
$$;

-- ────────────────────────────────────────────────────────────
-- Grants
-- ────────────────────────────────────────────────────────────
GRANT EXECUTE ON FUNCTION rpc_validate_ambassador_name(text)              TO anon, authenticated;
GRANT EXECUTE ON FUNCTION rpc_get_ambassador_ref_link(uuid)               TO anon, authenticated;
GRANT EXECUTE ON FUNCTION rpc_get_ambassador_referrals(uuid)              TO authenticated;
GRANT EXECUTE ON FUNCTION rpc_ambassador_comment_work(uuid,uuid,text)     TO authenticated;
GRANT EXECUTE ON FUNCTION rpc_ambassador_comment_project(uuid,uuid,text)  TO authenticated;
GRANT EXECUTE ON FUNCTION rpc_ambassador_send_message(uuid,uuid,text)     TO authenticated;
GRANT EXECUTE ON FUNCTION rpc_ambassador_resonance(uuid,uuid,integer)     TO authenticated;



COMMIT;
