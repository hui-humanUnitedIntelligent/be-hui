-- Migration: messages Tabelle erweitern für Media, Delete, Edit
-- media_url: URL für Bild/Video/Voice aus Supabase Storage
-- media_type: 'image' | 'video' | 'voice' | null
-- is_deleted: Soft-Delete (Nachricht bleibt, Text wird ersetzt)
-- edited_at: Zeitstempel der letzten Bearbeitung

ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS media_url   TEXT     DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS media_type  TEXT     DEFAULT NULL,  -- 'image'|'video'|'voice'
  ADD COLUMN IF NOT EXISTS is_deleted  BOOLEAN  DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS edited_at   TIMESTAMPTZ DEFAULT NULL;

-- Storage Bucket für Chat-Medien (falls nicht vorhanden)
-- Bucket: chat-media, public: false (nur Authenticated)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-media',
  'chat-media',
  false,
  52428800, -- 50MB
  ARRAY['image/jpeg','image/png','image/gif','image/webp','video/mp4','video/quicktime','audio/webm','audio/ogg','audio/mpeg','audio/mp4']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: Nur Authenticated darf hochladen
DROP POLICY IF EXISTS "chat_media_upload" ON storage.objects;
CREATE POLICY "chat_media_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'chat-media');

DROP POLICY IF EXISTS "chat_media_select" ON storage.objects;
CREATE POLICY "chat_media_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'chat-media');

DROP POLICY IF EXISTS "chat_media_delete" ON storage.objects;
CREATE POLICY "chat_media_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'chat-media');

-- RLS auf messages: UPDATE erlauben für eigene Nachrichten
-- (is_deleted=true setzen oder text bearbeiten)
DROP POLICY IF EXISTS "messages_update_own" ON public.messages;
CREATE POLICY "messages_update_own" ON public.messages
  FOR UPDATE TO authenticated
  USING (sender_id = auth.uid())
  WITH CHECK (sender_id = auth.uid());
