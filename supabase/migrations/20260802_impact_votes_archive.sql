-- Migration: impact_votes_archive für Vormonat-Übersicht im SADB
-- Beim Reset werden Votes in diese Tabelle kopiert (nicht gelöscht)

CREATE TABLE IF NOT EXISTS public.impact_votes_archive (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_id   UUID NOT NULL,           -- ID aus impact_votes
  voter_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  project_id    UUID NOT NULL,           -- Ref auf impact_applications
  pool_month    TEXT NOT NULL,           -- 'YYYY-MM'
  weight        INTEGER NOT NULL DEFAULT 1,
  archived_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indizes für schnelle Abfragen nach Monat und Projekt
CREATE INDEX IF NOT EXISTS idx_votes_archive_month   ON public.impact_votes_archive(pool_month);
CREATE INDEX IF NOT EXISTS idx_votes_archive_project ON public.impact_votes_archive(project_id);

-- RLS
ALTER TABLE public.impact_votes_archive ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "votes_archive_admin_all"   ON public.impact_votes_archive;
DROP POLICY IF EXISTS "votes_archive_public_read" ON public.impact_votes_archive;

CREATE POLICY "votes_archive_admin_all" ON public.impact_votes_archive
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "votes_archive_public_read" ON public.impact_votes_archive
  FOR SELECT USING (true);

GRANT SELECT ON public.impact_votes_archive TO authenticated, anon;
GRANT ALL    ON public.impact_votes_archive TO service_role;

-- RPC: Monatliche Stimmen-Zusammenfassung aus Archiv (für SADB)
CREATE OR REPLACE FUNCTION public.rpc_get_votes_archive_summary(p_month TEXT DEFAULT NULL)
RETURNS TABLE (
  pool_month    TEXT,
  project_id    UUID,
  project_name  TEXT,
  vote_count    BIGINT,
  total_weight  BIGINT
)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT
    a.pool_month,
    a.project_id,
    COALESCE(ap.project_name, 'Unbekannt') AS project_name,
    COUNT(*)         AS vote_count,
    SUM(a.weight)    AS total_weight
  FROM public.impact_votes_archive a
  LEFT JOIN public.impact_applications ap ON ap.id = a.project_id
  WHERE (p_month IS NULL OR a.pool_month = p_month)
  GROUP BY a.pool_month, a.project_id, ap.project_name
  ORDER BY a.pool_month DESC, COUNT(*) DESC;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_get_votes_archive_summary TO authenticated, anon, service_role;
