-- ══════════════════════════════════════════════════════════════════════════════
-- Migration 20260824_124 — Home Dashboard RPC (13 Queries → 1 Call)
-- 
-- Ersetzt 13 separate Supabase-Queries beim Home-Load durch eine
-- einzige RPC: rpc_get_home_dashboard
-- 
-- Liefert: works, experiences, impact_projects, stats, user (optional)
-- ══════════════════════════════════════════════════════════════════════════════

DROP FUNCTION IF EXISTS rpc_get_home_dashboard(UUID);
CREATE OR REPLACE FUNCTION rpc_get_home_dashboard(p_user_id UUID DEFAULT NULL)
RETURNS JSONB AS $$
DECLARE
  result JSONB := '{}'::jsonb;
  works_arr JSONB;
  exp_arr JSONB;
  impact_arr JSONB;
  stats_obj JSONB;
  user_obj JSONB := '{}'::jsonb;
  conn_count INTEGER;
  vote_count INTEGER;
BEGIN
  -- Works (letzte 5, nicht gelöscht)
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', w.id, 'title', w.title, 'creator_id', w.creator_id,
    'price', w.price, 'cover_url', w.cover_url
  ) ORDER BY w.created_at DESC), '[]'::jsonb)
  INTO works_arr
  FROM public.works w
  WHERE w.status IS DISTINCT FROM 'deleted'
  LIMIT 5;

  -- Experiences (letzte 5)
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', e.id, 'title', e.title, 'creator_id', e.user_id,
    'price', e.price, 'cover_url', e.cover_url
  ) ORDER BY e.created_at DESC), '[]'::jsonb)
  INTO exp_arr
  FROM public.experiences e
  WHERE e.status IS DISTINCT FROM 'deleted'
  LIMIT 5;

  -- Impact Projects (letzte 3 approved)
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', ip.id, 'name', ip.project_name, 'short_desc', ip.short_desc,
    'cover_url', ip.cover_url, 'rank', ip.rank
  ) ORDER BY ip.created_at DESC), '[]'::jsonb)
  INTO impact_arr
  FROM public.impact_applications ip
  WHERE ip.status = 'approved'
  LIMIT 3;

  -- Stats (Counts)
  SELECT jsonb_build_object(
    'works', (SELECT count(*) FROM public.works WHERE status IS DISTINCT FROM 'deleted'),
    'talents', (SELECT count(*) FROM public.talents WHERE status = 'approved'),
    'experiences', (SELECT count(*) FROM public.experiences WHERE status IS DISTINCT FROM 'deleted'),
    'profiles', (SELECT count(*) FROM public.profiles)
  ) INTO stats_obj;

  result := result || jsonb_build_object(
    'works', works_arr,
    'experiences', exp_arr,
    'impact_projects', impact_arr,
    'stats', stats_obj
  );

  -- User-spezifische Daten (nur wenn p_user_id gesetzt)
  IF p_user_id IS NOT NULL THEN
    SELECT count(*) INTO conn_count
    FROM public.connections
    WHERE requester_id = p_user_id OR recipient_id = p_user_id;

    SELECT count(*) INTO vote_count
    FROM public.impact_votes
    WHERE voter_id = p_user_id;

    user_obj := jsonb_build_object('connections', conn_count, 'votes', vote_count);
    result := result || jsonb_build_object('user', user_obj);
  END IF;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
