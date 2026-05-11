-- HUI 011: Stories RLS Fix
-- Problem: auth.uid()::text = user_id::text schlägt fehl
-- Fix: direkte UUID-Vergleiche

ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

-- Alle alten Policies droppen
DROP POLICY IF EXISTS stories_select  ON public.stories;
DROP POLICY IF EXISTS stories_insert  ON public.stories;
DROP POLICY IF EXISTS stories_update  ON public.stories;
DROP POLICY IF EXISTS stories_delete  ON public.stories;

-- SELECT: öffentliche + eigene Stories
CREATE POLICY stories_select ON public.stories
  FOR SELECT USING (
    status = 'published'
    AND (visibility = 'public' OR user_id = auth.uid())
    AND (expires_at IS NULL OR expires_at > NOW() OR is_highlight = true)
  );

-- INSERT: jeder eingeloggte User darf für sich selbst
CREATE POLICY stories_insert ON public.stories
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND user_id = auth.uid()
  );

-- UPDATE: nur eigene
CREATE POLICY stories_update ON public.stories
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- DELETE: nur eigene
CREATE POLICY stories_delete ON public.stories
  FOR DELETE USING (user_id = auth.uid());

-- story_views fix
DROP POLICY IF EXISTS story_views_all ON public.story_views;
CREATE POLICY story_views_all ON public.story_views
  FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (viewer_id = auth.uid());

-- Grants sicherstellen
GRANT ALL   ON public.stories     TO authenticated;
GRANT ALL   ON public.story_views TO authenticated;
GRANT SELECT ON public.stories    TO anon;

-- Test: zeige aktuelle Policies
SELECT policyname, cmd, qual FROM pg_policies 
WHERE tablename = 'stories';
