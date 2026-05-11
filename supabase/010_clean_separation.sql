-- ============================================================
-- HUI — 010: Clean Table Separation
-- works = Produkte/Werke
-- stories = Stories (eigene Tabelle, eigene Felder)
-- Run in Supabase SQL Editor
-- ============================================================

-- ── WORKS: fehlende Spalten ergänzen (falls nicht vorhanden) ──
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name='works' AND column_name='cover_url') THEN
    ALTER TABLE public.works ADD COLUMN cover_url TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name='works' AND column_name='images') THEN
    ALTER TABLE public.works ADD COLUMN images TEXT[];
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name='works' AND column_name='category') THEN
    ALTER TABLE public.works ADD COLUMN category TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name='works' AND column_name='tags') THEN
    ALTER TABLE public.works ADD COLUMN tags TEXT[];
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name='works' AND column_name='sale_mode') THEN
    ALTER TABLE public.works ADD COLUMN sale_mode TEXT DEFAULT 'fixed';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name='works' AND column_name='price') THEN
    ALTER TABLE public.works ADD COLUMN price NUMERIC(10,2);
  END IF;
END $$;

-- WORKS: Story-Felder ENTFERNEN falls vorhanden (saubere Trennung)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name='works' AND column_name='allow_comments') THEN
    ALTER TABLE public.works DROP COLUMN allow_comments;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name='works' AND column_name='allow_reactions') THEN
    ALTER TABLE public.works DROP COLUMN allow_reactions;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name='works' AND column_name='allow_sharing') THEN
    ALTER TABLE public.works DROP COLUMN allow_sharing;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name='works' AND column_name='allow_likes') THEN
    ALTER TABLE public.works DROP COLUMN allow_likes;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name='works' AND column_name='allow_share') THEN
    ALTER TABLE public.works DROP COLUMN allow_share;
  END IF;
END $$;

-- ── STORIES: eigene saubere Tabelle ──
DROP TABLE IF EXISTS public.story_views CASCADE;
DROP TABLE IF EXISTS public.stories CASCADE;

CREATE TABLE public.stories (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username        TEXT,
  avatar_url      TEXT,
  media_url       TEXT,
  media_type      TEXT DEFAULT 'text',
  caption         TEXT,
  mood_tags       TEXT[],
  visibility      TEXT DEFAULT 'public',
  allow_comments  BOOLEAN DEFAULT true,
  allow_reactions BOOLEAN DEFAULT true,
  allow_sharing   BOOLEAN DEFAULT true,
  is_highlight    BOOLEAN DEFAULT false,
  highlight_title TEXT,
  status          TEXT DEFAULT 'published',
  expires_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.story_views (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id   UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  viewer_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  viewed_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(story_id, viewer_id)
);

-- Indexes
CREATE INDEX idx_stories_user_id    ON public.stories(user_id);
CREATE INDEX idx_stories_status     ON public.stories(status);
CREATE INDEX idx_stories_created_at ON public.stories(created_at DESC);
CREATE INDEX idx_stories_expires_at ON public.stories(expires_at);

-- Auto expires_at (24h) + updated_at
CREATE OR REPLACE FUNCTION public.set_story_expires()
RETURNS TRIGGER LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public AS $$
BEGIN
  NEW.updated_at = NOW();
  IF NEW.expires_at IS NULL AND NEW.is_highlight = false THEN
    NEW.expires_at = NOW() + INTERVAL '24 hours';
  END IF;
  IF NEW.is_highlight = true THEN
    NEW.expires_at = NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_story_expires ON public.stories;
CREATE TRIGGER trg_story_expires
  BEFORE INSERT OR UPDATE ON public.stories
  FOR EACH ROW EXECUTE FUNCTION public.set_story_expires();

-- Auto-fill username/avatar from profiles
CREATE OR REPLACE FUNCTION public.enrich_story_meta()
RETURNS TRIGGER LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public AS $$
DECLARE p RECORD;
BEGIN
  SELECT display_name, username, avatar_url INTO p
  FROM public.profiles WHERE id = NEW.user_id LIMIT 1;
  IF FOUND THEN
    NEW.username   = COALESCE(NEW.username,   p.username, p.display_name, 'HUI User');
    NEW.avatar_url = COALESCE(NEW.avatar_url, p.avatar_url);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_story_meta ON public.stories;
CREATE TRIGGER trg_story_meta
  BEFORE INSERT ON public.stories
  FOR EACH ROW EXECUTE FUNCTION public.enrich_story_meta();

-- RLS
ALTER TABLE public.stories     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS stories_select  ON public.stories;
DROP POLICY IF EXISTS stories_insert  ON public.stories;
DROP POLICY IF EXISTS stories_update  ON public.stories;
DROP POLICY IF EXISTS stories_delete  ON public.stories;
DROP POLICY IF EXISTS story_views_all ON public.story_views;

CREATE POLICY stories_select ON public.stories FOR SELECT USING (
  status = 'published'
  AND (visibility = 'public' OR auth.uid() = user_id)
  AND (expires_at IS NULL OR expires_at > NOW() OR is_highlight = true)
);
CREATE POLICY stories_insert ON public.stories FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid()::text = user_id::text);
CREATE POLICY stories_update ON public.stories FOR UPDATE
  USING (auth.uid()::text = user_id::text)
  WITH CHECK (auth.uid()::text = user_id::text);
CREATE POLICY stories_delete ON public.stories FOR DELETE
  USING (auth.uid()::text = user_id::text);
CREATE POLICY story_views_all ON public.story_views FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid()::text = viewer_id::text);

GRANT ALL ON public.stories     TO authenticated;
GRANT ALL ON public.story_views TO authenticated;
GRANT SELECT ON public.stories  TO anon;

SELECT 'Clean separation complete ✓' AS status;
