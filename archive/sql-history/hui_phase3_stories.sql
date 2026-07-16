-- ═══════════════════════════════════════════════════════════════
-- HUI Phase 3: Real Story System
-- Stories table + storage bucket + RLS policies
-- ═══════════════════════════════════════════════════════════════

-- 1. Create stories table
CREATE TABLE IF NOT EXISTS public.stories (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  media_url      text,
  media_type     text DEFAULT 'image'  CHECK (media_type IN ('image','video')),
  text           text,
  visibility     text DEFAULT 'public' CHECK (visibility IN ('public','followers','private')),
  viewers_count  integer DEFAULT 0,
  is_active      boolean DEFAULT true,
  created_at     timestamptz DEFAULT now(),
  expires_at     timestamptz DEFAULT now() + interval '24 hours'
);

-- 2. Index for fast fetch (active + not expired)
CREATE INDEX IF NOT EXISTS stories_active_idx
  ON public.stories (user_id, expires_at)
  WHERE is_active = true;

-- 3. Index for bar query (all users, sorted)
CREATE INDEX IF NOT EXISTS stories_feed_idx
  ON public.stories (expires_at DESC, created_at DESC)
  WHERE is_active = true;

-- 4. RLS
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

-- Anyone can read public stories that aren't expired
CREATE POLICY "stories_read_public" ON public.stories
  FOR SELECT USING (
    is_active = true
    AND expires_at > now()
    AND visibility = 'public'
  );

-- Users can read their own stories (including expired)
CREATE POLICY "stories_read_own" ON public.stories
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own stories
CREATE POLICY "stories_insert_own" ON public.stories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own stories (e.g. deactivate)
CREATE POLICY "stories_update_own" ON public.stories
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own stories
CREATE POLICY "stories_delete_own" ON public.stories
  FOR DELETE USING (auth.uid() = user_id);

-- 5. story_views table (for tracking who viewed)
CREATE TABLE IF NOT EXISTS public.story_views (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id   uuid NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  viewer_id  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  viewed_at  timestamptz DEFAULT now(),
  UNIQUE (story_id, viewer_id)
);

ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "story_views_insert" ON public.story_views
  FOR INSERT WITH CHECK (auth.uid() = viewer_id);

CREATE POLICY "story_views_read_own" ON public.story_views
  FOR SELECT USING (
    auth.uid() = viewer_id
    OR auth.uid() = (SELECT user_id FROM public.stories WHERE id = story_id)
  );

