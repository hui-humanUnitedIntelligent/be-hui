-- HUI 012: Stories Storage Bucket + Schema Fix
-- Bucket "stories" anlegen (falls nicht vorhanden)

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'stories',
  'stories', 
  true,
  52428800,  -- 50MB
  ARRAY['image/jpeg','image/jpg','image/png','image/gif','image/webp','video/mp4','video/quicktime','video/webm']
) ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800;

-- Storage RLS für "stories" bucket
DROP POLICY IF EXISTS stories_storage_select ON storage.objects;
DROP POLICY IF EXISTS stories_storage_insert ON storage.objects;
DROP POLICY IF EXISTS stories_storage_delete ON storage.objects;

CREATE POLICY stories_storage_select ON storage.objects
  FOR SELECT USING (bucket_id = 'stories');

CREATE POLICY stories_storage_insert ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'stories' 
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY stories_storage_delete ON storage.objects
  FOR DELETE USING (
    bucket_id = 'stories'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

