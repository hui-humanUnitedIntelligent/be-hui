-- PUNKT3-HERZENSPROJEKT-VOTERS (2026-09-08, Michael): "werden aktuell keine
-- Profilbilder angezeigt, nur drei kleine leere Platzhalter" — die 3 Kreise in
-- den Herzensprojekt-Karten waren reine Deko (HUIProfilIcon), nie echte Voter.
-- Diese SECURITY-DEFINER-RPC liefert pro Projekt die letzten N Voter-Avatare
-- (impact_votes ist per RLS nur fuer eigene Stimmen lesbar → direkter SELECT
-- wuerde je nach Betrachter leer sein, analog Migration 104/119 bei vote_counts).
-- Bewusst NUR avatar_url, KEINE Namen (Impact-Bereich: sonst anonym).
CREATE OR REPLACE FUNCTION public.rpc_get_project_voters(
  p_project_ids uuid[],
  p_pool_month text,
  p_limit integer DEFAULT 3
)
RETURNS TABLE(project_id uuid, avatar_url text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT pr AS project_id, vo.avatar_url
  FROM unnest(p_project_ids) AS pr
  CROSS JOIN LATERAL (
    SELECT p.avatar_url
    FROM public.impact_votes v
    JOIN public.profiles p ON p.id = v.voter_id
    WHERE v.project_id = pr
      AND v.pool_month = p_pool_month
    ORDER BY v.created_at DESC
    LIMIT GREATEST(1, LEAST(p_limit, 10))
  ) AS vo
$function$;

REVOKE EXECUTE ON FUNCTION public.rpc_get_project_voters(uuid[], text, integer) FROM anon;
GRANT EXECUTE ON FUNCTION public.rpc_get_project_voters(uuid[], text, integer) TO authenticated;
