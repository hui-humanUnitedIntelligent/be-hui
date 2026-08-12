-- Migration 103: Chat FK Constraints + Verification
-- Date: 2026-08-12
-- Purpose: Ensure referential integrity across chat tables
--
-- Finding: messages.chat_id was already UUID (fixed in earlier migration)
--          chat_participants.chat_id had NO FK constraint to chats.id
--          → Added FK with ON DELETE CASCADE
--
-- Verification (2026-08-12 09:22 UTC):
--   messages.chat_id        → uuid ✅ (nullable=YES)
--   chat_participants.chat_id → uuid ✅ (nullable=NO)
--   chats.id                → uuid ✅ (nullable=NO)
--   messages.chat_id → chats.id FK ✅ (messages_chat_id_fkey)
--   chat_participants.chat_id → chats.id FK ✅ (chat_participants_chat_id_fkey) ← NEW
--   chats.booking_id → bookings.id FK ✅ (chats_booking_id_fkey)
--
-- RLS Status:
--   chats: SELECT/INSERT/UPDATE — auth.uid() = ANY(participant_ids)
--   messages: SELECT/INSERT — EXISTS(chats WHERE auth.uid() = ANY(participant_ids))
--   chat_participants: SELECT/INSERT/UPDATE — user_id = auth.uid()
--
-- Data: 12 chats, 69 messages, 18 chat_participants (0 orphans)

-- Add FK constraint from chat_participants.chat_id → chats.id
-- Safe: verified 0 orphaned rows before adding
ALTER TABLE chat_participants
  ADD CONSTRAINT chat_participants_chat_id_fkey
  FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE;

-- Note: messages.chat_id → chats.id FK already existed (messages_chat_id_fkey)
-- No further action needed for type alignment — both are uuid
