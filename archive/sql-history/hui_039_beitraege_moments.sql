-- ═══════════════════════════════════════════════════════════════
-- HUI Migration 039 — beitraege VIEW + Moments Storage
-- Zweck: HUI-Momente erscheinen im Feed
-- PROBLEM: useFeedStream liest aus 'beitraege' — existiert nicht.
--          feed_posts existiert bereits. Lösung: VIEW + Storage.
-- ═══════════════════════════════════════════════════════════════

-- 1. beitraege VIEW (Spalten-Mapping für useFeedStream)
DROP VIEW IF EXISTS public.beitraege;
CREATE VIEW public.beitraege AS
  SELECT
    id,
    user_id,
    media_url  AS src,
    media_type AS type,
    caption,
    created_at
  FROM public.feed_posts
  WHERE is_archived = false
  ORDER BY created_at DESC;

GRANT SELECT ON public.beitraege TO anon;
GRANT SELECT ON public.beitraege TO authenticated;

-- 2. feed_posts RLS
ALTER TABLE public.feed_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "feed_posts_public_read" ON public.feed_posts;
CREATE POLICY "feed_posts_public_read" ON public.feed_posts
  FOR SELECT USING (is_archived = false);

DROP POLICY IF EXISTS "feed_posts_own_insert" ON public.feed_posts;
CREATE POLICY "feed_posts_own_insert" ON public.feed_posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "feed_posts_own_update" ON public.feed_posts;
CREATE POLICY "feed_posts_own_update" ON public.feed_posts
  FOR UPDATE USING (auth.uid() = user_id);

-- 3. Storage bucket hui-moments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'hui-moments', 'hui-moments', true, 52428800,
  ARRAY['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/quicktime','video/webm']
)
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 52428800;

DROP POLICY IF EXISTS "moments_upload_own" ON storage.objects;
CREATE POLICY "moments_upload_own" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'hui-moments'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "moments_public_read" ON storage.objects;
CREATE POLICY "moments_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'hui-moments');

-- 4. Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.feed_posts;

NOTIFY pgrst, 'reload schema';
