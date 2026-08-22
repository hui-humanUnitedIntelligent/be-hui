-- ════════════════════════════════════════════════════════════════
-- CHAT-LOGIK v2: Universelle Chat-Regeln nach Kauf/Verkauf
-- Erstellt: 2026-08-22
-- Additiv — löscht keine bestehenden Felder/Functions
-- ════════════════════════════════════════════════════════════════

-- 1. Neue Spalten an chats-Tabelle (alle optional, default NULL/pending)
ALTER TABLE chats ADD COLUMN IF NOT EXISTS delivery_status    TEXT DEFAULT 'pending';
ALTER TABLE chats ADD COLUMN IF NOT EXISTS seller_shipped_at  TIMESTAMPTZ;
ALTER TABLE chats ADD COLUMN IF NOT EXISTS buyer_received_at  TIMESTAMPTZ;
ALTER TABLE chats ADD COLUMN IF NOT EXISTS buyer_rated_at     TIMESTAMPTZ;
ALTER TABLE chats ADD COLUMN IF NOT EXISTS buyer_rating       TEXT;
ALTER TABLE chats ADD COLUMN IF NOT EXISTS booking_type       TEXT;
ALTER TABLE chats ADD COLUMN IF NOT EXISTS transaction_id     TEXT;
ALTER TABLE chats ADD COLUMN IF NOT EXISTS transaction_status TEXT DEFAULT 'active';

-- delivery_status Werte: 'pending' → 'shipped' → 'delivered' → 'rated' → 'closed'
-- transaction_status Werte: 'active' → 'completed' → 'reopened'

-- 2. Chat-Events Tabelle für SADB-Verknüpfung
CREATE TABLE IF NOT EXISTS chat_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id     UUID REFERENCES chats(id) ON DELETE CASCADE,
  event_type  TEXT NOT NULL,
  user_id     UUID,
  data        JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_events_chat ON chat_events (chat_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_events_type ON chat_events (event_type, created_at DESC);

-- 3. RLS für chat_events
ALTER TABLE chat_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "chat_events_read_own" ON chat_events;
CREATE POLICY "chat_events_read_own" ON chat_events
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM chats c
      WHERE c.id = chat_id
      AND c.participant_ids @> ARRAY[auth.uid()::uuid]
    )
  );

DROP POLICY IF EXISTS "chat_events_insert_own" ON chat_events;
CREATE POLICY "chat_events_insert_own" ON chat_events
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM chats c
      WHERE c.id = chat_id
      AND c.participant_ids @> ARRAY[auth.uid()::uuid]
    )
  );

DROP POLICY IF EXISTS "chat_events_admin" ON chat_events;
CREATE POLICY "chat_events_admin" ON chat_events
  FOR ALL USING (auth.role() = 'service_role');

-- 4. RPC: chat_auto_create_or_reopen
-- Wird nach erfolgreicher Zahlung aufgerufen.
-- Wenn bereits ein Chat zwischen denselben Usern existiert (egal ob offen/geschlossen):
--   → geschlossen? → wieder öffnen + alten Verlauf behalten
--   → offen? → einfach zurückgeben
-- Sonst: neuen Chat mit booking_id erstellen.
CREATE OR REPLACE FUNCTION rpc_chat_auto_create_or_reopen(
  p_user_id        UUID,
  p_other_user_id  UUID,
  p_booking_id     TEXT DEFAULT NULL,
  p_booking_type   TEXT DEFAULT NULL,
  p_booking_title  TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_existing RECORD;
  v_chat_id  UUID;
BEGIN
  -- Bestehenden Chat zwischen diesen zwei Usern suchen (egal welcher state)
  SELECT id, state, delivery_status, transaction_status
  INTO v_existing
  FROM chats
  WHERE participant_ids @> ARRAY[p_user_id, p_other_user_id]
    AND participant_ids @> ARRAY[p_other_user_id, p_user_id]
    AND state IN ('opened', 'closed', 'archived')
  ORDER BY last_message_at DESC NULLS LAST
  LIMIT 1;

  IF v_existing.id IS NOT NULL THEN
    -- Bestehender Chat gefunden → ggf. wieder öffnen
    IF v_existing.state IN ('closed', 'archived') THEN
      UPDATE chats SET
        state              = 'opened',
        closed_at          = NULL,
        transaction_status = 'reopened',
        delivery_status    = 'pending',
        seller_shipped_at  = NULL,
        buyer_received_at  = NULL,
        buyer_rated_at     = NULL,
        buyer_rating       = NULL,
        booking_id         = COALESCE(p_booking_id::uuid, booking_id),
        booking_type       = COALESCE(p_booking_type, booking_type),
        booking_title      = COALESCE(p_booking_title, booking_title)
      WHERE id = v_existing.id;

      INSERT INTO chat_events (chat_id, event_type, user_id, data)
      VALUES (v_existing.id, 'chat_reopened', p_user_id,
        jsonb_build_object('booking_id', p_booking_id, 'booking_type', p_booking_type));

      v_chat_id := v_existing.id;
    ELSE
      -- Chat ist schon offen → nur booking_id aktualisieren falls neu
      IF p_booking_id IS NOT NULL THEN
        UPDATE chats SET
          booking_id    = COALESCE(p_booking_id::uuid, booking_id),
          booking_type  = COALESCE(p_booking_type, booking_type),
          booking_title = COALESCE(p_booking_title, booking_title)
        WHERE id = v_existing.id
          AND booking_id IS NULL;
      END IF;
      v_chat_id := v_existing.id;
    END IF;

    INSERT INTO chat_events (chat_id, event_type, user_id, data)
    VALUES (v_chat_id, 'chat_opened', p_user_id,
      jsonb_build_object('booking_id', p_booking_id, 'booking_type', p_booking_type));

    RETURN jsonb_build_object('ok', true, 'chat_id', v_chat_id, 'reopened', v_existing.state IN ('closed','archived'));
  END IF;

  -- Kein bestehender Chat → neuen erstellen
  INSERT INTO chats (
    participant_ids, state, booking_id, booking_type, booking_title,
    delivery_status, transaction_status, opened_at, last_message_at
  ) VALUES (
    ARRAY[p_user_id, p_other_user_id], 'opened',
    p_booking_id::uuid, p_booking_type, p_booking_title,
    'pending', 'active',
    now(), now()
  )
  RETURNING id INTO v_chat_id;

  INSERT INTO chat_events (chat_id, event_type, user_id, data)
  VALUES (v_chat_id, 'chat_created', p_user_id,
    jsonb_build_object('booking_id', p_booking_id, 'booking_type', p_booking_type));

  INSERT INTO chat_events (chat_id, event_type, user_id, data)
  VALUES (v_chat_id, 'chat_opened', p_user_id,
    jsonb_build_object('booking_id', p_booking_id, 'booking_type', p_booking_type));

  RETURN jsonb_build_object('ok', true, 'chat_id', v_chat_id, 'reopened', false);
END;
$$;

-- 5. RPC: rpc_chat_mark_shipped
CREATE OR REPLACE FUNCTION rpc_chat_mark_shipped(
  p_chat_id  UUID,
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_chat RECORD;
BEGIN
  SELECT id, participant_ids, delivery_status INTO v_chat
  FROM chats WHERE id = p_chat_id;

  IF v_chat.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Chat nicht gefunden');
  END IF;

  IF NOT v_chat.participant_ids @> ARRAY[p_user_id] THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Nicht berechtigt');
  END IF;

  UPDATE chats SET
    delivery_status   = 'shipped',
    seller_shipped_at = now()
  WHERE id = p_chat_id;

  INSERT INTO chat_events (chat_id, event_type, user_id, data)
  VALUES (p_chat_id, 'chat_message_sent', p_user_id,
    jsonb_build_object('system_message', 'Verkäufer hat als versendet markiert'));

  RETURN jsonb_build_object('ok', true, 'delivery_status', 'shipped');
END;
$$;

-- 6. RPC: rpc_chat_mark_received
CREATE OR REPLACE FUNCTION rpc_chat_mark_received(
  p_chat_id  UUID,
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_chat RECORD;
BEGIN
  SELECT id, participant_ids, delivery_status INTO v_chat
  FROM chats WHERE id = p_chat_id;

  IF v_chat.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Chat nicht gefunden');
  END IF;

  IF NOT v_chat.participant_ids @> ARRAY[p_user_id] THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Nicht berechtigt');
  END IF;

  UPDATE chats SET
    delivery_status   = 'delivered',
    buyer_received_at = now()
  WHERE id = p_chat_id;

  INSERT INTO chat_events (chat_id, event_type, user_id, data)
  VALUES (p_chat_id, 'chat_message_sent', p_user_id,
    jsonb_build_object('system_message', 'Käufer hat Ware erhalten bestätigt'));

  RETURN jsonb_build_object('ok', true, 'delivery_status', 'delivered');
END;
$$;

-- 7. RPC: rpc_chat_submit_rating
-- Bei "recommend": Chat wird geschlossen (delivery_status='closed', state='closed')
-- Bei "not_recommend": Chat bleibt OFFEN — Bewertung wird gespeichert, aber Schreibsperre NICHT aktiviert
CREATE OR REPLACE FUNCTION rpc_chat_submit_rating(
  p_chat_id  UUID,
  p_user_id  UUID,
  p_rating   TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_chat RECORD;
BEGIN
  SELECT id, participant_ids, delivery_status INTO v_chat
  FROM chats WHERE id = p_chat_id;

  IF v_chat.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Chat nicht gefunden');
  END IF;

  IF NOT v_chat.participant_ids @> ARRAY[p_user_id] THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Nicht berechtigt');
  END IF;

  IF p_rating NOT IN ('recommend', 'not_recommend') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Ungültige Bewertung');
  END IF;

  -- Bewertung immer speichern
  UPDATE chats SET
    buyer_rated_at = now(),
    buyer_rating   = p_rating
  WHERE id = p_chat_id;

  -- Event: Bewertung abgegeben
  INSERT INTO chat_events (chat_id, event_type, user_id, data)
  VALUES (p_chat_id, 'chat_message_sent', p_user_id,
    jsonb_build_object('system_message',
      CASE WHEN p_rating = 'recommend' THEN 'Käufer empfiehlt den Verkäufer' ELSE 'Käufer empfiehlt den Verkäufer nicht' END));

  IF p_rating = 'recommend' THEN
    -- POSITIVE Empfehlung -> Chat schliessen
    UPDATE chats SET
      delivery_status    = 'closed',
      state              = 'closed',
      closed_at          = now(),
      transaction_status = 'completed'
    WHERE id = p_chat_id;

    INSERT INTO chat_events (chat_id, event_type, user_id, data)
    VALUES (p_chat_id, 'chat_write_locked', p_user_id,
      jsonb_build_object('reason', 'delivery_complete'));

    INSERT INTO chat_events (chat_id, event_type, user_id, data)
    VALUES (p_chat_id, 'chat_closed', p_user_id,
      jsonb_build_object('rating', p_rating));

    INSERT INTO chat_events (chat_id, event_type, user_id, data)
    VALUES (p_chat_id, 'chat_archived', p_user_id,
      jsonb_build_object('archived_at', now()::text));

    RETURN jsonb_build_object('ok', true, 'delivery_status', 'closed', 'state', 'closed');
  ELSE
    -- NEGATIVE Empfehlung -> Chat bleibt OFFEN
    INSERT INTO chat_events (chat_id, event_type, user_id, data)
    VALUES (p_chat_id, 'chat_message_sent', p_user_id,
      jsonb_build_object('system_message', 'Chat bleibt offen bis Einigung erzielt wurde'));

    RETURN jsonb_build_object('ok', true, 'delivery_status', 'delivered', 'state', 'opened', 'chat_stays_open', true);
  END IF;
END;
$$;

-- 8. updated_at Trigger für chat_events
DROP TRIGGER IF EXISTS trg_chat_events_updated_at ON chat_events;
CREATE TRIGGER trg_chat_events_updated_at BEFORE UPDATE ON chat_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- FERTIG — Alle Änderungen sind additiv. Keine bestehenden Felder/Functions gelöscht.
-- Auszuführen im Supabase Dashboard SQL Editor.
