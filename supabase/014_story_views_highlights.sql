-- HUI 014: Story Views + Highlights Support
-- Ausführen in: Supabase → SQL Editor

-- story_views table (falls noch nicht vorhanden)
CREATE TABLE IF NOT EXISTS public.story_views (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id    UUID REFERENCES public.stories(id) ON DELETE CASCADE,
  viewer_id   UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  viewed_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(story_id, viewer_id)
);

ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS story_views_all ON public.story_views;
CREATE POLICY story_views_all ON public.story_views
  FOR ALL USING (auth.uid() IS NOT NULL)
  WITH CHECK (viewer_id = auth.uid());

GRANT ALL ON public.story_views TO authenticated;
GRANT SELECT ON public.story_views TO anon;

-- Stellt sicher dass stories.is_highlight korrekt funktioniert
ALTER TABLE public.stories
  ADD COLUMN IF NOT EXISTS is_highlight BOOLEAN DEFAULT false;

NOTIFY pgrst, 'reload schema';

SELECT 'story_views table ready' AS status;
