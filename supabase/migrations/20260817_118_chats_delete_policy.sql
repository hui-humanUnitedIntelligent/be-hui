-- Migration 118: chats DELETE policy — allows users to delete their own chats
-- Date: 2026-08-17
-- Purpose: Enable irreversible chat deletion (user request: "Löschen" instead of "Schließen")
-- 
-- The chats table already has SELECT, INSERT, UPDATE policies (chats_select_own,
-- chats_insert_own, chats_update_own) using auth.uid() = ANY(participant_ids).
-- This adds the missing DELETE policy with the same ownership check.
--
-- CASCADE: messages.chat_id and chat_participants.chat_id both have
-- ON DELETE CASCADE FK constraints (migration 103), so deleting a chat
-- automatically removes all messages and participant records.

DROP POLICY IF EXISTS chats_delete_own ON public.chats;

CREATE POLICY chats_delete_own ON public.chats
  FOR DELETE TO authenticated
  USING (auth.uid() = ANY(participant_ids));
