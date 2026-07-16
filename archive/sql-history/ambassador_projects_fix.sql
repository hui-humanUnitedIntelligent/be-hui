
SET search_path = public;

DROP FUNCTION IF EXISTS public.rpc_get_ambassador_projects(uuid) CASCADE;
CREATE FUNCTION public.rpc_get_ambassador_projects(p_ambassador_id uuid)
RETURNS TABLE (
  id           uuid,
  project_name text,
  status       text,
  created_at   timestamptz,
  funding_goal numeric
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ia.id,
    ia.project_name,
    ia.status,
    ia.created_at,
    ia.funding_goal
  FROM public.impact_applications ia
  WHERE ia.user_id = p_ambassador_id
  ORDER BY ia.created_at DESC;
END;
$$;
GRANT EXECUTE ON FUNCTION public.rpc_get_ambassador_projects(uuid) TO anon, authenticated, service_role;

NOTIFY pgrst, 'reload schema';
