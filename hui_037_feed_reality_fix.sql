-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Migration 037: Feed Reality Fix — Schema-Validierung
-- Datum: 2026-05-24
-- Sicher: idempotent, kein DROP TABLE, kein TRUNCATE
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- ── 1. works: user_id + creator_id — beide müssen gesetzt sein ──
-- Der WorkFlow.jsx hat bisher nur creator_id gesetzt.
-- RLS INSERT prüft user_id = auth.uid() → ohne user_id schlägt INSERT fehl.
-- Diese Migration repariert existierende Rows UND setzt korrekte Defaults.

ALTER TABLE public.works
  ALTER COLUMN status SET DEFAULT 'published';

-- Repariere works die creator_id aber keine user_id haben
UPDATE public.works
  SET user_id = creator_id
  WHERE user_id IS NULL AND creator_id IS NOT NULL;

-- Repariere works die user_id aber keine creator_id haben  
UPDATE public.works
  SET creator_id = user_id
  WHERE creator_id IS NULL AND user_id IS NOT NULL;

-- ── 2. works: Spalten sicherstellen ──────────────────────────────
ALTER TABLE public.works
  ADD COLUMN IF NOT EXISTS caption      text,
  ADD COLUMN IF NOT EXISTS for_sale     boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS location_label text;

-- ── 3. experiences: status default ───────────────────────────────
ALTER TABLE public.experiences
  ALTER COLUMN status SET DEFAULT 'published';

-- Repariere experiences ohne status
UPDATE public.experiences
  SET status = 'published'
  WHERE status IS NULL OR status NOT IN ('published', 'draft', 'paused', 'archived');

-- ── 4. profiles: location_label ──────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS location_label text;

UPDATE public.profiles
  SET location_label = location
  WHERE location_label IS NULL AND location IS NOT NULL;

-- ── 5. notifications: fehlende Spalten ───────────────────────────
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS entity_id   uuid,
  ADD COLUMN IF NOT EXISTS entity_type text,
  ADD COLUMN IF NOT EXISTS action_url  text,
  ADD COLUMN IF NOT EXISTS body        text;

-- ── 6. RLS: works öffentlich lesbar wenn published ────────────────
ALTER TABLE public.works ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS works_select_published ON public.works;
CREATE POLICY works_select_published ON public.works
  FOR SELECT USING (
    (status = 'published' AND (visibility IS NULL OR visibility = 'public'))
    OR auth.uid() = user_id
    OR auth.uid() = creator_id
  );

DROP POLICY IF EXISTS works_insert_auth ON public.works;
CREATE POLICY works_insert_auth ON public.works
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    OR auth.uid() = creator_id
  );

DROP POLICY IF EXISTS works_update_own ON public.works;
CREATE POLICY works_update_own ON public.works
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = creator_id);

DROP POLICY IF EXISTS works_delete_own ON public.works;
CREATE POLICY works_delete_own ON public.works
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = creator_id);

-- ── 7. RLS: experiences öffentlich wenn published ─────────────────
ALTER TABLE public.experiences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS exp_select ON public.experiences;
CREATE POLICY exp_select ON public.experiences
  FOR SELECT USING (
    status = 'published'
    OR auth.uid() = user_id
  );

DROP POLICY IF EXISTS exp_insert ON public.experiences;
CREATE POLICY exp_insert ON public.experiences
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS exp_update ON public.experiences;
CREATE POLICY exp_update ON public.experiences
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS exp_delete ON public.experiences;
CREATE POLICY exp_delete ON public.experiences
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ── 8. RLS: profiles öffentlich lesbar ───────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS profiles_select_all ON public.profiles;
CREATE POLICY profiles_select_all ON public.profiles
  FOR SELECT USING (true);

-- ── 9. RLS: beitraege öffentlich lesbar ──────────────────────────
ALTER TABLE public.beitraege ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS beitraege_public_read ON public.beitraege;
CREATE POLICY beitraege_public_read ON public.beitraege
  FOR SELECT USING (true);

-- ── 10. Indizes für Feed-Performance ─────────────────────────────
CREATE INDEX IF NOT EXISTS idx_works_status_created
  ON public.works(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_works_user_id
  ON public.works(user_id);

CREATE INDEX IF NOT EXISTS idx_works_creator_id
  ON public.works(creator_id);

CREATE INDEX IF NOT EXISTS idx_experiences_status_date
  ON public.experiences(status, date ASC);

CREATE INDEX IF NOT EXISTS idx_experiences_user_id
  ON public.experiences(user_id);

-- ── VERIFY QUERIES (nach Migration ausführen) ─────────────────────
-- SELECT COUNT(*) FROM works WHERE status = 'published';
-- SELECT COUNT(*) FROM experiences WHERE status = 'published';
-- SELECT COUNT(*) FROM beitraege;
-- SELECT COUNT(*) FROM profiles WHERE display_name IS NOT NULL;
--
-- Test ob JOIN funktioniert:
-- SELECT w.id, w.title, p.display_name
-- FROM works w LEFT JOIN profiles p ON p.id = w.user_id
-- WHERE w.status = 'published' LIMIT 5;

NOTIFY pgrst, 'reload schema';
