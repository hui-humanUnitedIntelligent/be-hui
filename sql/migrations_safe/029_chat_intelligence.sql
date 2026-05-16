-- ════════════════════════════════════════════════════════════════
-- HUI Phase 3B: Chat Intelligence System
-- Migration: 029_chat_intelligence
-- Safe additive — no drops, no destructive changes
-- ════════════════════════════════════════════════════════════════

-- 1. chats Tabelle erweitern
ALTER TABLE chats
  ADD COLUMN IF NOT EXISTS chat_type       text DEFAULT 'direct'
    CHECK (chat_type IN ('direct','booking','collaboration','project','support')),
  ADD COLUMN IF NOT EXISTS participant_ids uuid[],          -- Array-Format (neu)
  ADD COLUMN IF NOT EXISTS booking_id      uuid,            -- Verknüpfte Buchung
  ADD COLUMN IF NOT EXISTS context_type    text,            -- 'work'|'experience'|'booking'
  ADD COLUMN IF NOT EXISTS context_id      uuid,            -- ID des Kontexts
  ADD COLUMN IF NOT EXISTS context_title   text,            -- Titel für Header
  ADD COLUMN IF NOT EXISTS state           text DEFAULT 'open'
    CHECK (state IN ('open','archived','muted','blocked')),
  ADD COLUMN IF NOT EXISTS unread_a        int DEFAULT 0,   -- ungelesen für participant_a
  ADD COLUMN IF NOT EXISTS unread_b        int DEFAULT 0,   -- ungelesen für participant_b
  ADD COLUMN IF NOT EXISTS last_message_type text DEFAULT 'text',
  ADD COLUMN IF NOT EXISTS is_pinned       boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS opened_at       timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at      timestamptz DEFAULT now();

-- 2. messages Tabelle erweitern
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS msg_type        text DEFAULT 'text'
    CHECK (msg_type IN (
      'text','image','voice','file',
      'booking_update','availability_update',
      'shared_work','shared_experience',
      'recommendation','system_message'
    )),
  ADD COLUMN IF NOT EXISTS media_url       text,           -- Bild/Voice URL
  ADD COLUMN IF NOT EXISTS media_type      text,           -- 'image/jpeg', 'audio/ogg'
  ADD COLUMN IF NOT EXISTS media_meta      jsonb,          -- { width, height, duration, size }
  ADD COLUMN IF NOT EXISTS context_ref     jsonb,          -- { type, id, title, thumbnail }
  ADD COLUMN IF NOT EXISTS is_deleted      boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS reactions       jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS reply_to        uuid,           -- reply threading
  ADD COLUMN IF NOT EXISTS updated_at      timestamptz DEFAULT now();

-- Indizes
CREATE INDEX IF NOT EXISTS idx_chats_participant_a   ON chats(participant_a);
CREATE INDEX IF NOT EXISTS idx_chats_participant_b   ON chats(participant_b);
CREATE INDEX IF NOT EXISTS idx_chats_booking_id      ON chats(booking_id);
CREATE INDEX IF NOT EXISTS idx_chats_updated_at      ON chats(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_chat_id      ON messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_msg_type     ON messages(msg_type);
CREATE INDEX IF NOT EXISTS idx_messages_created_at   ON messages(created_at);

-- 3. Trigger: chats.updated_at auto-update
CREATE OR REPLACE FUNCTION update_chat_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS chat_updated_at ON chats;
CREATE TRIGGER chat_updated_at
  BEFORE UPDATE ON chats
  FOR EACH ROW EXECUTE FUNCTION update_chat_timestamp();

-- 4. Trigger: nach neuem Message → chat.last_message_at + unread counter
CREATE OR REPLACE FUNCTION after_message_insert()
RETURNS TRIGGER AS $$
DECLARE
  v_chat RECORD;
BEGIN
  SELECT participant_a, participant_b INTO v_chat
  FROM chats WHERE id = NEW.chat_id;

  UPDATE chats SET
    last_message     = LEFT(NEW.text, 80),
    last_message_at  = NEW.created_at,
    last_message_type = COALESCE(NEW.msg_type, 'text'),
    -- Unread-Counter für den jeweils anderen Teilnehmer hochzählen
    unread_a = CASE
      WHEN v_chat.participant_a != NEW.sender_id
      THEN COALESCE(unread_a, 0) + 1
      ELSE unread_a END,
    unread_b = CASE
      WHEN v_chat.participant_b != NEW.sender_id
      THEN COALESCE(unread_b, 0) + 1
      ELSE unread_b END
  WHERE id = NEW.chat_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS message_after_insert ON messages;
CREATE TRIGGER message_after_insert
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION after_message_insert();

-- 5. RLS — chats (participant_a OR participant_b sehen ihren Chat)
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS chats_read ON chats;
CREATE POLICY chats_read ON chats FOR SELECT
  USING (
    auth.uid() = participant_a OR
    auth.uid() = participant_b OR
    auth.uid() = ANY(participant_ids)
  );

DROP POLICY IF EXISTS chats_insert ON chats;
CREATE POLICY chats_insert ON chats FOR INSERT
  WITH CHECK (
    auth.uid() = participant_a OR
    auth.uid() = ANY(participant_ids)
  );

DROP POLICY IF EXISTS chats_update ON chats;
CREATE POLICY chats_update ON chats FOR UPDATE
  USING (
    auth.uid() = participant_a OR
    auth.uid() = participant_b
  );

-- 6. RLS — messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS messages_read ON messages;
CREATE POLICY messages_read ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chats c WHERE c.id = messages.chat_id
      AND (c.participant_a = auth.uid() OR c.participant_b = auth.uid())
    )
  );

DROP POLICY IF EXISTS messages_insert ON messages;
CREATE POLICY messages_insert ON messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM chats c WHERE c.id = messages.chat_id
      AND (c.participant_a = auth.uid() OR c.participant_b = auth.uid())
    )
  );

-- Soft delete: nur eigene Nachrichten
DROP POLICY IF EXISTS messages_update ON messages;
CREATE POLICY messages_update ON messages FOR UPDATE
  USING (auth.uid() = sender_id);

-- 7. last_seen in profiles (für Presence)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS last_seen timestamptz;

-- 8. Storage Bucket für Chat-Medien (falls nicht vorhanden)
-- Hinweis: wird via Supabase Dashboard angelegt, nicht via SQL
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('chat-media', 'chat-media', true) ON CONFLICT DO NOTHING;

NOTIFY pgrst, 'reload schema';
