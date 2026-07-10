-- ──────────────────────────────────────────────────────────────────────────────
-- Migration 074: Impact-Meilenstein-System
-- Tabellen: impact_milestones, impact_milestone_updates
-- RLS, Indexes, Trigger (update_updated_at_column), Realtime
-- ──────────────────────────────────────────────────────────────────────────────

-- ── 1. impact_milestones ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.impact_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.impact_applications(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  media_urls TEXT[] DEFAULT '{}',
  planned_date DATE,
  sort_order INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned','in_progress','completed')),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── 2. impact_milestone_updates ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.impact_milestone_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  milestone_id UUID NOT NULL REFERENCES public.impact_milestones(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.impact_applications(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT,
  media_urls TEXT[] DEFAULT '{}',
  status_update TEXT CHECK (status_update IN ('planned','in_progress','completed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── 3. RLS: impact_milestones ─────────────────────────────────────────────────
ALTER TABLE public.impact_milestones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "impact_milestones_select_all" ON public.impact_milestones;
CREATE POLICY "impact_milestones_select_all"
  ON public.impact_milestones FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "impact_milestones_insert_initiator" ON public.impact_milestones;
CREATE POLICY "impact_milestones_insert_initiator"
  ON public.impact_milestones FOR INSERT
  WITH CHECK (project_id IN (SELECT id FROM public.impact_applications WHERE applicant_id = auth.uid()));

DROP POLICY IF EXISTS "impact_milestones_update_initiator" ON public.impact_milestones;
CREATE POLICY "impact_milestones_update_initiator"
  ON public.impact_milestones FOR UPDATE
  USING (project_id IN (SELECT id FROM public.impact_applications WHERE applicant_id = auth.uid()))
  WITH CHECK (project_id IN (SELECT id FROM public.impact_applications WHERE applicant_id = auth.uid()));

DROP POLICY IF EXISTS "impact_milestones_delete_initiator" ON public.impact_milestones;
CREATE POLICY "impact_milestones_delete_initiator"
  ON public.impact_milestones FOR DELETE
  USING (project_id IN (SELECT id FROM public.impact_applications WHERE applicant_id = auth.uid()));

-- ── 4. RLS: impact_milestone_updates ──────────────────────────────────────────
ALTER TABLE public.impact_milestone_updates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "impact_milestone_updates_select_all" ON public.impact_milestone_updates;
CREATE POLICY "impact_milestone_updates_select_all"
  ON public.impact_milestone_updates FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "impact_milestone_updates_insert_author" ON public.impact_milestone_updates;
CREATE POLICY "impact_milestone_updates_insert_author"
  ON public.impact_milestone_updates FOR INSERT
  WITH CHECK (author_id = auth.uid());

-- ── 5. Indexes ────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_impact_milestones_project_id
  ON public.impact_milestones(project_id);

CREATE INDEX IF NOT EXISTS idx_impact_milestone_updates_milestone_id
  ON public.impact_milestone_updates(milestone_id);

CREATE INDEX IF NOT EXISTS idx_impact_milestone_updates_project_id
  ON public.impact_milestone_updates(project_id);

-- ── 6. Trigger: update_updated_at_column ──────────────────────────────────────
-- Kanonische Funktion existiert bereits (siehe Migration 060)

DROP TRIGGER IF EXISTS trg_impact_milestones_updated_at ON public.impact_milestones;
CREATE TRIGGER trg_impact_milestones_updated_at
  BEFORE UPDATE ON public.impact_milestones
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_impact_milestone_updates_updated_at ON public.impact_milestone_updates;
CREATE TRIGGER trg_impact_milestone_updates_updated_at
  BEFORE UPDATE ON public.impact_milestone_updates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ── 7. Realtime ───────────────────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE public.impact_milestones;
ALTER PUBLICATION supabase_realtime ADD TABLE public.impact_milestone_updates;
