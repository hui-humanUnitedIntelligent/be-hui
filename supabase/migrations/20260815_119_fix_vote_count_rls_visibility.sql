-- ═══════════════════════════════════════════════════════════════════
-- Migration 119: Fix globale Stimmen-Anzeige (RLS-Regression aus Migration 104)
-- ═══════════════════════════════════════════════════════════════════
-- ROOT CAUSE (Michael-Report 2026-08-15, Screenshot "Linda's Doggy Daycare
-- 0 Stimmen" bei Peter Stock, aber korrekte Zahl bei Michael Mathis):
--
-- Migration 104 (2026-08-12, Security Hardening) droppte zu Recht die
-- gefaehrlichen TRUE-Policies auf impact_votes ("iv_read" +
-- "impact_votes_select_authenticated"), weil damit jeder Nutzer sehen
-- konnte WER fuer WAS gestimmt hat (voter_id + project_id offen lesbar).
-- Uebrig blieb nur "User kann eigene Stimmen lesen" (voter_id = auth.uid()).
--
-- ABER: Diese RLS-Policy gilt fuer ALLE SELECTs auf impact_votes -- auch
-- fuer die AGGREGIERTEN Stimmen-Zaehlungen pro Projekt (SELECT project_id
-- FROM impact_votes WHERE project_id IN (...)), die auf mehreren Seiten
-- als OEFFENTLICHE Zahl angezeigt werden (ImpactPage Ranking + "Weitere
-- Herzensprojekte", DiscoverPage Wirkungsraum, MeineProjekteModal,
-- WirkungPage "Stimmen fuer deine Projekte"). Seit Migration 104 liefert
-- jede dieser Abfragen nur noch die STIMMEN DES GERADE EINGELOGGTEN
-- NUTZERS zurueck -- die angezeigte Zahl variiert also je nach Betrachter,
-- statt eine echte globale Summe zu sein. Peter Stock sah "0", weil ER
-- selbst nicht fuer "Linda's Doggy Daycare" gestimmt hatte -- Michael
-- Mathis sah eine Zahl >0, weil ER dafuer gestimmt hatte.
--
-- FIX: Zwei SECURITY DEFINER RPCs, die AUSSCHLIESSLICH aggregierte Zahlen
-- zurueckgeben (project_id + Anzahl, oder Gesamtzahl/eindeutige Waehler) --
-- NIEMALS voter_id oder sonstige Identitaet einzelner Stimmen. Damit bleibt
-- die Privacy-Absicht von Migration 104 (niemand sieht WER abgestimmt hat)
-- vollstaendig erhalten, aber die oeffentliche, nicht-sensitive Kennzahl
-- "wie viele Stimmen hat Projekt X" ist wieder fuer ALLE Betrachter gleich
-- und korrekt.
--
-- Die bestehende RLS-Policy "User kann eigene Stimmen lesen" bleibt
-- UNVERAENDERT (Struktur-Schutz) -- Direkt-Queries auf impact_votes liefern
-- weiterhin nur eigene Stimmen. Nur diese beiden neuen Funktionen duerfen
-- (kontrolliert, nur aggregiert) die RLS umgehen.
-- ═══════════════════════════════════════════════════════════════════

-- 1. Stimmen pro Projekt (optional gefiltert auf einen pool_month) --
--    liefert NUR project_id + vote_count, KEINE voter_id.
CREATE OR REPLACE FUNCTION public.rpc_get_vote_counts(
  p_project_ids UUID[],
  p_pool_month  TEXT DEFAULT NULL
)
RETURNS TABLE(project_id UUID, vote_count BIGINT)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT iv.project_id, COUNT(*)::BIGINT AS vote_count
  FROM impact_votes iv
  WHERE iv.project_id = ANY(p_project_ids)
    AND (p_pool_month IS NULL OR iv.pool_month = p_pool_month)
  GROUP BY iv.project_id;
$$;

REVOKE ALL ON FUNCTION public.rpc_get_vote_counts(UUID[], TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_get_vote_counts(UUID[], TEXT) TO authenticated, anon;

-- 2. Globale Plattform-Statistik (Gesamt-Stimmen + eindeutige Waehler,
--    all-time, ueber ALLE Projekte) -- fuer "Impact auf einen Blick".
CREATE OR REPLACE FUNCTION public.rpc_get_global_vote_stats()
RETURNS TABLE(total_votes BIGINT, unique_voters BIGINT)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::BIGINT AS total_votes,
         COUNT(DISTINCT voter_id)::BIGINT AS unique_voters
  FROM impact_votes;
$$;

REVOKE ALL ON FUNCTION public.rpc_get_global_vote_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_get_global_vote_stats() TO authenticated, anon;

-- 3. Eindeutige Waehler fuer eine bestimmte Projekt-Menge (all-time) --
--    fuer WirkungPage "X Stimmen wurden fuer deine Projekte abgegeben".
CREATE OR REPLACE FUNCTION public.rpc_get_unique_voters_for_projects(
  p_project_ids UUID[]
)
RETURNS BIGINT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(DISTINCT voter_id)::BIGINT
  FROM impact_votes
  WHERE project_id = ANY(p_project_ids);
$$;

REVOKE ALL ON FUNCTION public.rpc_get_unique_voters_for_projects(UUID[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_get_unique_voters_for_projects(UUID[]) TO authenticated, anon;
