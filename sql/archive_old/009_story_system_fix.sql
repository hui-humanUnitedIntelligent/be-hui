-- ============================================================
-- HUI — Story System Fix (Complete)
-- Run in Supabase SQL Editor
-- ============================================================

-- 1. DROP old stories table if exists (clean slate)
DROP TABLE IF EXISTS public.story_views CASCADE;
DROP TABLE IF EXISTS public.stories CASCADE;

-- 2. CREATE stories table (flat schema, no joins needed)
CREATE TABLE public.stories (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username        TEXT,
  avatar_url      TEXT,
  media_url       TEXT,
  media_type      TEXT DEFAULT 'text',   -- 'image' | 'video' | 'text'
  text_overlay    TEXT,
  mood            TEXT,
  background      TEXT,                  -- gradient CSS for text-only stories
  visibility      TEXT DEFAULT 'public', -- 'public' | 'followers' | 'friends'
  allow_comments  BOOLEAN DEFAULT true,
  allow_reactions BOOLEAN DEFAULT true,
  is_highlight    BOOLEAN DEFAULT false,
  highlight_title TEXT,
  status          TEXT DEFAULT 'published',
  expires_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CREATE story_views table
CREATE TABLE public.story_views (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id   UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  viewer_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  viewed_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(story_id, viewer_id)
);

-- 4. INDEXES
CREATE INDEX idx_stories_user_id    ON public.stories(user_id);
CREATE INDEX idx_stories_expires_at ON public.stories(expires_at);
CREATE INDEX idx_stories_created_at ON public.stories(created_at DESC);
CREATE INDEX idx_stories_status     ON public.stories(status);

-- 5. Auto-set expires_at if not provided (24h from now)
CREATE OR REPLACE FUNCTION public.set_story_expires()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Set updated_at
  NEW.updated_at = NOW();
  -- Auto expires_at: 24h unless highlight
  IF NEW.expires_at IS NULL AND NEW.is_highlight = false THEN
    NEW.expires_at = NOW() + INTERVAL '24 hours';
  END IF;
  -- Highlights never expire
  IF NEW.is_highlight = true THEN
    NEW.expires_at = NULL;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_story_expires
  BEFORE INSERT OR UPDATE ON public.stories
  FOR EACH ROW EXECUTE FUNCTION public.set_story_expires();

-- 6. Auto-populate username + avatar_url from profiles
CREATE OR REPLACE FUNCTION public.enrich_story_meta()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  p RECORD;
BEGIN
  SELECT display_name, username, avatar_url
  INTO p FROM public.profiles
  WHERE id = NEW.user_id LIMIT 1;

  IF FOUND THEN
    NEW.username   = COALESCE(NEW.username,   p.username, p.display_name, 'HUI User');
    NEW.avatar_url = COALESCE(NEW.avatar_url, p.avatar_url);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_story_meta
  BEFORE INSERT ON public.stories
  FOR EACH ROW EXECUTE FUNCTION public.enrich_story_meta();

-- 7. RLS: Enable
ALTER TABLE public.stories     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;

-- 8. DROP any old policies
DROP POLICY IF EXISTS stories_select  ON public.stories;
DROP POLICY IF EXISTS stories_insert  ON public.stories;
DROP POLICY IF EXISTS stories_update  ON public.stories;
DROP POLICY IF EXISTS stories_delete  ON public.stories;
DROP POLICY IF EXISTS story_views_all ON public.story_views;

-- 9. RLS Policies — stories
-- SELECT: public stories visible to all; own stories always visible
CREATE POLICY stories_select ON public.stories
  FOR SELECT USING (
    status = 'published'
    AND (
      visibility = 'public'
      OR auth.uid() = user_id
    )
    AND (
      expires_at IS NULL
      OR expires_at > NOW()
      OR is_highlight = true
    )
  );

-- INSERT: authenticated users can create own stories only
CREATE POLICY stories_insert ON public.stories
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND auth.uid()::text = user_id::text
  );

-- UPDATE: own stories only
CREATE POLICY stories_update ON public.stories
  FOR UPDATE USING (auth.uid()::text = user_id::text)
  WITH CHECK  (auth.uid()::text = user_id::text);

-- DELETE: own stories only
CREATE POLICY stories_delete ON public.stories
  FOR DELETE USING (auth.uid()::text = user_id::text);

-- 10. RLS Policies — story_views
CREATE POLICY story_views_all ON public.story_views
  FOR ALL USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid()::text = viewer_id::text);

-- 11. Grant permissions
GRANT ALL ON public.stories     TO authenticated;
GRANT ALL ON public.story_views TO authenticated;
GRANT SELECT ON public.stories  TO anon;

-- Done
SELECT 'Story system ready ✓' AS status;
