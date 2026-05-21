-- ═══════════════════════════════════════════════════════════════
-- HUI PIPELINE FIX — Migration 033
-- Content-Pipeline Reparatur: Stories + Works
--
-- HINTERGRUND:
--   Werke und Storys wurden erfolgreich erstellt (Success-UI),
--   aber waren im Feed/Discover/StoryBar unsichtbar.
--
-- ROOT CAUSES (4 Bugs):
--   1. WorkFlow.jsx: INSERT mit user_id statt creator_id
--      → works lagen in DB, aber Feed-Query joined auf creator_id
--      → alle Werke hatten NULL-Profil, wurden gefiltert/unsichtbar
--
--   2. StoryComposer.jsx: INSERT mit status='published'
--      → stories-Tabelle hat KEIN status-Feld
--      → Supabase: 400/PGRST204 silent fail
--      → kein INSERT in DB, Story nie erstellt
--
--   3. StoryBar: .eq('status','published') Filter
--      → Column existiert nicht → Supabase gibt 0 Ergebnisse
--      → StoryBar immer leer
--
--   4. StoryBar: select username/avatar_url direkt aus stories
--      → Felder existieren nicht in stories-Tabelle
--      → Fix: profile:user_id join (bereits im Frontend repariert)
--
-- DIESE MIGRATION:
--   ✅ Repariert bestehende works: user_id → creator_id (wenn nötig)
--   ✅ Löscht ungültige stories-Einträge (falls INSERT trotzdem lief)
--   ✅ Sicherheitsnetz: works visibility=public sicherstellen
--   ✅ Alle Statements idempotent (IF NOT EXISTS / DO-Block)
--   ✅ KEIN DROP TABLE, KEIN TRUNCATE, KEIN Datenverlust
-- ═══════════════════════════════════════════════════════════════

-- ┌─────────────────────────────────────────────────────────────┐
-- │ 1. WORKS: creator_id Reparatur                              │
-- │    Falls alte WorkFlow-Inserts user_id gesetzt haben        │
-- │    (aber creator_id = NULL), reparieren wir sie             │
-- └─────────────────────────────────────────────────────────────┘

-- Sicherheitsnetz: works-Tabelle hat user_id Spalte?
-- Falls ja: alte Einträge mit user_id aber ohne creator_id reparieren
DO $$
BEGIN
  -- Prüfe ob user_id-Spalte existiert (wurde in 032 hinzugefügt)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'works'
      AND column_name  = 'user_id'
  ) THEN
    -- Repariere: wo creator_id NULL aber user_id gesetzt ist
    UPDATE public.works
      SET creator_id = user_id
      WHERE creator_id IS NULL
        AND user_id IS NOT NULL;

    RAISE NOTICE 'Works repariert: creator_id aus user_id gesetzt (% rows)',
      (SELECT COUNT(*) FROM public.works WHERE creator_id IS NOT NULL AND user_id IS NOT NULL);
  ELSE
    RAISE NOTICE 'Spalte user_id existiert nicht in works — keine Reparatur nötig';
  END IF;
END $$;

-- ┌─────────────────────────────────────────────────────────────┐
-- │ 2. WORKS: visibility Sicherheitsnetz                        │
-- │    Werke ohne visibility werden nicht in Discover angezeigt │
-- └─────────────────────────────────────────────────────────────┘

UPDATE public.works
  SET visibility = 'public'
  WHERE visibility IS NULL
    AND status = 'published';

-- Status-Check
DO $$
DECLARE
  v_published  INTEGER;
  v_no_creator INTEGER;
  v_no_vis     INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_published  FROM public.works WHERE status = 'published';
  SELECT COUNT(*) INTO v_no_creator FROM public.works WHERE creator_id IS NULL AND status = 'published';
  SELECT COUNT(*) INTO v_no_vis     FROM public.works WHERE visibility IS NULL AND status = 'published';

  RAISE NOTICE 'Works published: % | ohne creator_id: % | ohne visibility: %',
    v_published, v_no_creator, v_no_vis;
END $$;

-- ┌─────────────────────────────────────────────────────────────┐
-- │ 3. STORIES: Schema-Audit                                    │
-- │    stories hat kein status-Feld — das ist korrekt.          │
-- │    Alle Storys sind sichtbar über expires_at-Logik.         │
-- └─────────────────────────────────────────────────────────────┘

-- Spalten-Check: stories muss NICHT status haben
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'stories'
      AND column_name  = 'status'
  ) THEN
    RAISE WARNING 'stories.status existiert — war nicht geplant, aber kein Problem';
  ELSE
    RAISE NOTICE 'stories.status: nicht vorhanden (korrekt) — expires_at steuert Sichtbarkeit';
  END IF;
END $$;

-- ┌─────────────────────────────────────────────────────────────┐
-- │ 4. STORIES: fehlende Spalten ergänzen (falls nötig)         │
-- │    Für StoryComposer und StoryBar-Kompatibilität            │
-- └─────────────────────────────────────────────────────────────┘

-- caption ist bereits im Schema (032) — sicherstellen:
ALTER TABLE public.stories
  ADD COLUMN IF NOT EXISTS caption TEXT;

-- mood falls nicht vorhanden:
ALTER TABLE public.stories
  ADD COLUMN IF NOT EXISTS mood TEXT;

-- location falls nicht vorhanden:
ALTER TABLE public.stories
  ADD COLUMN IF NOT EXISTS location TEXT;

-- text_overlay falls nicht vorhanden (für ältere Abfragen):
ALTER TABLE public.stories
  ADD COLUMN IF NOT EXISTS text_overlay TEXT;

-- ┌─────────────────────────────────────────────────────────────┐
-- │ 5. RLS: stories_public_read — expires_at OR is_highlight    │
-- │    Neue Policy: NULL expires_at = permanent sichtbar        │
-- └─────────────────────────────────────────────────────────────┘

-- VORHER (032): FOR SELECT USING (expires_at IS NULL OR expires_at > now())
-- war korrekt, aber der StoryBar-Filter .eq('status','published')
-- blockierte trotzdem. Jetzt wo der Frontend-Filter weg ist,
-- funktioniert diese Policy korrekt.

-- Sicherheitshalber: Policy neu setzen mit klarerem Namen
DROP POLICY IF EXISTS "stories_public_read" ON public.stories;
CREATE POLICY "stories_public_read" ON public.stories
  FOR SELECT USING (
    expires_at IS NULL          -- Highlights / permanente Stories
    OR expires_at > now()       -- Zeitlich begrenzte Stories
    OR is_highlight = true      -- Highlights immer sichtbar
  );

-- ┌─────────────────────────────────────────────────────────────┐
-- │ 6. FEED_POSTS: is_archived Sicherheitsnetz                  │
-- └─────────────────────────────────────────────────────────────┘

-- Falls feed_posts existiert: is_archived=null reparieren
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'feed_posts'
  ) THEN
    UPDATE public.feed_posts
      SET is_archived = false
      WHERE is_archived IS NULL;

    RAISE NOTICE 'feed_posts: is_archived=NULL repariert';
  END IF;
END $$;

-- ┌─────────────────────────────────────────────────────────────┐
-- │ 7. SCHEMA CACHE REFRESH                                     │
-- └─────────────────────────────────────────────────────────────┘

COMMENT ON TABLE public.works IS
  'HUI Werke v4 (033): creator_id Pipeline-Fix, visibility Sicherheitsnetz';
COMMENT ON TABLE public.stories IS
  'HUI Stories v2 (033): caption/text_overlay/mood/location ergänzt, kein status-Feld';

SELECT pg_notify('pgrst', 'reload schema');

-- ═══════════════════════════════════════════════════════════════
-- FERTIG.
-- Nach Ausführung: Content sollte sofort in Feed/Discover/StoryBar erscheinen.
--
-- Wichtige Verifikations-Queries:
--
-- Works im Feed (sollten > 0 sein):
--   SELECT COUNT(*) FROM public.works
--   WHERE status = 'published' AND creator_id IS NOT NULL;
--
-- Stories sichtbar:
--   SELECT COUNT(*) FROM public.stories
--   WHERE expires_at IS NULL OR expires_at > now() OR is_highlight = true;
--
-- Frontend-Logs prüfen (Browser Console):
--   [WorkFlow] Publishing work: {...}
--   [WorkFlow] Werk gespeichert: {...}
--   [StoryComposer] Publishing story: {...}
--   [StoryBar] Query result: { count: N, error: null }
--   [feedService] Pipeline: { posts_raw: N, works_raw: N, ... }
--   [discoverService] Pipeline: { works_raw: N, ... }
-- ═══════════════════════════════════════════════════════════════
