-- ════════════════════════════════════════════════════════════════
-- HUI Ambassador RPCs — ARCH-006.1 — Final
-- Datum: 2026-07-01
-- Single Source of Truth:
--   profiles.username → https://be-hui.com/<username>
--   profiles.referred_by = ambassador_uuid
--   profiles.role = 'ambassador' OR profiles.is_ambassador = true
-- Keine neue Tabelle. Bestehende: profiles, works,
--   impact_applications, messages, chats, notification_events,
--   ambassador_ref_links
-- ════════════════════════════════════════════════════════════════

-- ── 1. rpc_validate_ambassador_name(name) ───────────────────────
-- Validiert ob ein Username zu einem aktiven Ambassador gehört
-- Gibt ambassador_id zurück (UUID) oder NULL (silent fail)
CREATE OR REPLACE FUNCTION rpc_validate_ambassador_name(p_name TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id UUID;
BEGIN
  -- Normalisierung: lowercase, trimmen
  p_name := lower(trim(p_name));
  IF p_name = '' THEN RETURN NULL; END IF;

  -- Schritt 1: ambassador_ref_links (schnell, cache)
  SELECT user_id INTO v_id
  FROM ambassador_ref_links
  WHERE lower(username) = p_name
  LIMIT 1;
  IF v_id IS NOT NULL THEN RETURN v_id; END IF;

  -- Schritt 2: profiles — role='ambassador' OR is_ambassador=true
  SELECT id INTO v_id
  FROM profiles
  WHERE lower(username) = p_name
    AND (role = 'ambassador' OR is_ambassador = true)
  LIMIT 1;

  RETURN v_id; -- NULL wenn nicht gefunden (silent fail)
END;
$$;

-- ── 2. rpc_register_with_ambassador(user_id, ambassador_id) ─────
-- Setzt referred_by in profiles beim Registrieren
CREATE OR REPLACE FUNCTION rpc_register_with_ambassador(
  p_user_id       UUID,
  p_ambassador_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Nur setzen wenn Ambassador existiert und aktiv ist
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = p_ambassador_id
      AND (role = 'ambassador' OR is_ambassador = true)
  ) THEN
    RETURN false; -- silent fail
  END IF;

  -- referred_by setzen (UUID des Ambassadors)
  UPDATE profiles
  SET referred_by = p_ambassador_id::text
  WHERE id = p_user_id
    AND referred_by IS NULL; -- nur wenn noch nicht gesetzt

  RETURN true;
END;
$$;

-- ── 3. rpc_get_ambassador_ref_link(ambassador_id) ────────────────
-- Gibt den korrekten Reflink zurück (authoritative: profiles.username)
CREATE OR REPLACE FUNCTION rpc_get_ambassador_ref_link(p_ambassador_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_username TEXT;
BEGIN
  SELECT username INTO v_username
  FROM profiles
  WHERE id = p_ambassador_id;

  IF v_username IS NULL OR v_username = '' THEN
    RETURN NULL;
  END IF;

  -- Einzige Quelle der Wahrheit
  RETURN 'https://be-hui.com/' || v_username;
END;
$$;

-- ── 4. rpc_get_ambassadors() ─────────────────────────────────────
-- Alle Ambassadors: role='ambassador' OR is_ambassador=true
CREATE OR REPLACE FUNCTION rpc_get_ambassadors()
RETURNS TABLE (
  id            UUID,
  display_name  TEXT,
  username      TEXT,
  avatar_url    TEXT,
  email         TEXT,
  role          TEXT,
  is_ambassador BOOLEAN,
  impact_eur    NUMERIC,
  ref_link      TEXT,
  created_at    TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    p.id,
    p.display_name,
    p.username,
    p.avatar_url,
    p.email,
    p.role,
    p.is_ambassador,
    p.impact_eur,
    -- Reflink IMMER aus username berechnen
    CASE WHEN p.username IS NOT NULL AND p.username != ''
      THEN 'https://be-hui.com/' || p.username
      ELSE NULL
    END AS ref_link,
    p.created_at
  FROM profiles p
  WHERE p.role = 'ambassador'
     OR p.is_ambassador = true
  ORDER BY p.created_at DESC;
$$;

-- ── 5. rpc_get_ambassador_referrals(ambassador_id) ───────────────
-- Alle Nutzer die über diesen Ambassador registriert wurden
-- Primärfeld: profiles.referred_by = ambassador_uuid
CREATE OR REPLACE FUNCTION rpc_get_ambassador_referrals(p_ambassador_id UUID)
RETURNS TABLE (
  id                   UUID,
  display_name         TEXT,
  username             TEXT,
  avatar_url           TEXT,
  email                TEXT,
  created_at           TIMESTAMPTZ,
  first_transaction_at TIMESTAMPTZ,
  is_active            BOOLEAN
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    p.id,
    p.display_name,
    p.username,
    p.avatar_url,
    p.email,
    p.created_at,
    p.first_transaction_at,
    (p.first_transaction_at IS NOT NULL) AS is_active
  FROM profiles p
  WHERE p.referred_by = p_ambassador_id::text
     OR p.referred_by_ambassador_id = p_ambassador_id -- Fallback
  ORDER BY p.created_at DESC;
$$;

-- ── 6. rpc_get_ambassador_works(ambassador_id) ──────────────────
CREATE OR REPLACE FUNCTION rpc_get_ambassador_works(p_ambassador_id UUID)
RETURNS TABLE (
  id               UUID,
  title            TEXT,
  status           TEXT,
  approval_status  TEXT,
  admin_comment    TEXT,
  rejection_reason TEXT,
  created_at       TIMESTAMPTZ,
  user_id          UUID
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    w.id, w.title, w.status, w.approval_status,
    w.admin_comment, w.rejection_reason, w.created_at, w.user_id
  FROM works w
  WHERE w.user_id = p_ambassador_id
  ORDER BY w.created_at DESC
  LIMIT 200;
$$;

-- ── 7. rpc_get_ambassador_projects(ambassador_id) ───────────────
CREATE OR REPLACE FUNCTION rpc_get_ambassador_projects(p_ambassador_id UUID)
RETURNS TABLE (
  id               UUID,
  project_name     TEXT,
  status           TEXT,
  funding_goal     NUMERIC,
  admin_comment    TEXT,
  rejection_reason TEXT,
  created_at       TIMESTAMPTZ,
  user_id          UUID
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    ia.id, ia.project_name, ia.status, ia.funding_goal,
    ia.admin_comment, ia.rejection_reason, ia.created_at, ia.user_id
  FROM impact_applications ia
  WHERE ia.user_id = p_ambassador_id
  ORDER BY ia.created_at DESC
  LIMIT 200;
$$;

-- ── 8. rpc_get_ambassador_messages(ambassador_id) ───────────────
CREATE OR REPLACE FUNCTION rpc_get_ambassador_messages(p_ambassador_id UUID)
RETURNS TABLE (
  chat_id         UUID,
  last_message    TEXT,
  last_message_at TIMESTAMPTZ,
  state           TEXT,
  created_at      TIMESTAMPTZ,
  participant_ids UUID[]
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    c.id AS chat_id, c.last_message, c.last_message_at,
    c.state, c.created_at, c.participant_ids
  FROM chats c
  WHERE c.participant_ids @> ARRAY[p_ambassador_id]
  ORDER BY c.last_message_at DESC NULLS LAST
  LIMIT 100;
$$;

-- ── 9. rpc_ambassador_send_message ──────────────────────────────
CREATE OR REPLACE FUNCTION rpc_ambassador_send_message(
  p_ambassador_id UUID,
  p_recipient_id  UUID,
  p_text          TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_chat_id UUID;
  v_msg_id  UUID;
BEGIN
  -- Existierenden 1:1 Chat suchen
  SELECT id INTO v_chat_id
  FROM chats
  WHERE participant_ids @> ARRAY[p_ambassador_id, p_recipient_id]
    AND array_length(participant_ids, 1) = 2
  LIMIT 1;

  IF v_chat_id IS NULL THEN
    INSERT INTO chats (participant_ids, state, created_at)
    VALUES (ARRAY[p_ambassador_id, p_recipient_id], 'active', NOW())
    RETURNING id INTO v_chat_id;
  END IF;

  INSERT INTO messages (chat_id, text, sender_id, message_type, is_read, created_at)
  VALUES (v_chat_id, p_text, p_ambassador_id, 'text', false, NOW())
  RETURNING id INTO v_msg_id;

  UPDATE chats SET last_message = p_text, last_message_at = NOW() WHERE id = v_chat_id;

  RETURN json_build_object('ok', true, 'chat_id', v_chat_id, 'message_id', v_msg_id);
END;
$$;

-- ── 10. rpc_ambassador_comment_work ─────────────────────────────
CREATE OR REPLACE FUNCTION rpc_ambassador_comment_work(
  p_work_id       UUID,
  p_ambassador_id UUID,
  p_text          TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO notification_events
    (type, table_name, record_id, user_id, reason, created_at)
  VALUES
    ('ambassador_work_comment', 'works', p_work_id, p_ambassador_id, p_text, NOW());
  RETURN json_build_object('ok', true);
END;
$$;

-- ── 11. rpc_ambassador_comment_project ──────────────────────────
CREATE OR REPLACE FUNCTION rpc_ambassador_comment_project(
  p_project_id    UUID,
  p_ambassador_id UUID,
  p_text          TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO notification_events
    (type, table_name, record_id, user_id, reason, created_at)
  VALUES
    ('ambassador_project_comment', 'impact_applications', p_project_id, p_ambassador_id, p_text, NOW());
  RETURN json_build_object('ok', true);
END;
$$;

-- ── 12. rpc_ambassador_resonance ────────────────────────────────
CREATE OR REPLACE FUNCTION rpc_ambassador_resonance(
  p_work_id       UUID,
  p_ambassador_id UUID,
  p_value         INTEGER DEFAULT 1
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  BEGIN
    INSERT INTO resonance (work_id, user_id, value, created_at)
    VALUES (p_work_id, p_ambassador_id, p_value, NOW())
    ON CONFLICT (work_id, user_id) DO UPDATE SET value = p_value;
  EXCEPTION WHEN undefined_table THEN
    INSERT INTO notification_events
      (type, table_name, record_id, user_id, reason, created_at)
    VALUES
      ('ambassador_resonance', 'works', p_work_id, p_ambassador_id, p_value::text, NOW());
  END;
  RETURN json_build_object('ok', true);
END;
$$;

-- ── Grants ───────────────────────────────────────────────────────
GRANT EXECUTE ON FUNCTION rpc_validate_ambassador_name(TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION rpc_register_with_ambassador(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION rpc_get_ambassador_ref_link(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION rpc_get_ambassadors() TO authenticated;
GRANT EXECUTE ON FUNCTION rpc_get_ambassador_referrals(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION rpc_get_ambassador_works(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION rpc_get_ambassador_projects(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION rpc_get_ambassador_messages(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION rpc_ambassador_send_message(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION rpc_ambassador_comment_work(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION rpc_ambassador_comment_project(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION rpc_ambassador_resonance(UUID, UUID, INTEGER) TO authenticated;
