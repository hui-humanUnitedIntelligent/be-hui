-- ═══════════════════════════════════════════════════════════════
-- MESSAGES.CHAT_ID TYPE FIX (2026-08-21)
-- Fix: TEXT → UUID für messages.chat_id (kompatibel mit chats.id)
-- ═══════════════════════════════════════════════════════════════

-- Schritt 1: Prüfen ob invalide chat_id Werte existieren
SELECT 'Invalid chat_id values:' as check_name,
  COUNT(*) as invalid_count
FROM messages
WHERE chat_id IS NOT NULL
  AND chat_id::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- Schritt 2: Falls 0 invalide → Type ändern
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM messages
    WHERE chat_id IS NOT NULL
      AND chat_id::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  ) THEN
    ALTER TABLE messages ALTER COLUMN chat_id TYPE UUID USING chat_id::uuid;
    RAISE NOTICE '✅ messages.chat_id erfolgreich zu UUID geändert';
  ELSE
    RAISE NOTICE '⚠️ Invalide chat_id Werte gefunden — Type nicht geändert. Erst Daten bereinigen.';
  END IF;
END $$;

-- Schritt 3: Foreign Key Constraint hinzufügen (nur wenn Type UUID ist)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'chat_id' AND data_type = 'uuid'
  ) THEN
    BEGIN
      ALTER TABLE messages
        ADD CONSTRAINT fk_messages_chat FOREIGN KEY (chat_id)
        REFERENCES chats(id) ON DELETE CASCADE;
      RAISE NOTICE '✅ FK Constraint messages.chat_id → chats.id hinzugefügt';
    EXCEPTION WHEN duplicate_object THEN
      RAISE NOTICE 'FK Constraint existiert bereits';
    END;
  ELSE
    RAISE NOTICE '⚠️ chat_id ist nicht UUID — FK übersprungen';
  END IF;
END $$;

-- Schritt 4: Index nach Type-Änderung neu erstellen (UUID-Index ist effizienter)
DROP INDEX IF EXISTS idx_messages_chat_id;
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);

-- ═══════════════════════════════════════════════════════════════
-- WICHTIG: Diese Migration muss von Michael via hui_admin_role-Cookie
-- im Supabase SQL-Editor ausgeführt werden.
-- Sie ist sicher — prüft zuerst auf invalide Werte vor ALTER.
-- ═══════════════════════════════════════════════════════════════
