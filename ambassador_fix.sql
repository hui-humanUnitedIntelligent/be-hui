-- ADR Ambassador Fix — fehlende RPCs + Schema-Korrekturen
-- 2026-07-01

-- ─── 1. rpc_validate_ambassador_name ───
DROP FUNCTION IF EXISTS rpc_validate_ambassador_name(text);
CREATE OR REPLACE FUNCTION rpc_validate_ambassador_name(p_name text)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_id   uuid;
  v_name text;
BEGIN
  v_name := lower(trim(p_name));
  IF v_name LIKE '%be-hui.com/%' THEN
    v_name := regexp_replace(v_name, '^.*be-hui\.com/([a-z0-9._\-]+).*$', '\1');
  END IF;
  SELECT id INTO v_id
  FROM profiles
  WHERE lower(username) = v_name
    AND (role = 'ambassador' OR is_ambassador = true)
  LIMIT 1;
  RETURN v_id;
END;
$$;

-- ─── 2. rpc_get_ambassador_ref_link ───
DROP FUNCTION IF EXISTS rpc_get_ambassador_ref_link(uuid);
CREATE OR REPLACE FUNCTION rpc_get_ambassador_ref_link(p_ambassador_id uuid)
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_username text;
BEGIN
  SELECT username INTO v_username FROM profiles WHERE id = p_ambassador_id;
  IF v_username IS NULL THEN RETURN NULL; END IF;
  RETURN 'https://be-hui.com/' || v_username;
END;
$$;

-- ─── 3. rpc_get_ambassador_referrals (mit phone + role) ───
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

-- ─── 4. rpc_ambassador_send_message ───
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
    UPDATE chats SET last_message = trim(p_text), last_message_at = now()
    WHERE id = v_chat_id;
  END IF;
  RETURN jsonb_build_object('ok', true, 'chat_id', v_chat_id);
EXCEPTION WHEN others THEN
  RETURN jsonb_build_object('ok', false, 'error', SQLERRM);
END;
$$;

-- Grants
GRANT EXECUTE ON FUNCTION rpc_validate_ambassador_name(text)        TO anon, authenticated;
GRANT EXECUTE ON FUNCTION rpc_get_ambassador_ref_link(uuid)         TO anon, authenticated;
GRANT EXECUTE ON FUNCTION rpc_get_ambassador_referrals(uuid)        TO authenticated;
GRANT EXECUTE ON FUNCTION rpc_ambassador_send_message(uuid,uuid,text) TO authenticated;
