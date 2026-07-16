-- Ambassador Fix 2 — 2026-07-01
-- Korrigiert: column-Fehler in comment/resonance RPCs
-- Korrigiert: referrals RPC (phone+role)

-- referrals mit phone + role
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

-- comment_work: comments hat nur work_id, user_id, text
DROP FUNCTION IF EXISTS rpc_ambassador_comment_work(uuid,uuid,text);
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

-- comment_project: nutzt notification_events (wird im naechsten Step mit korrekten Spalten gefuellt)
-- resonance: nutzt notification_events
-- Beide werden nach Schema-Check in Fix3 korrigiert

GRANT EXECUTE ON FUNCTION rpc_get_ambassador_referrals(uuid)        TO authenticated;
GRANT EXECUTE ON FUNCTION rpc_ambassador_comment_work(uuid,uuid,text) TO authenticated;
