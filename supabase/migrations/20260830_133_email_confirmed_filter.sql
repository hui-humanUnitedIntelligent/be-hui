-- Migration 133: new_users & profile-count nur noch mit email_confirmed_at
-- ══════════════════════════════════════════════════════════════════════════════
-- Problem (INC-001, 2026-08-30): Unbestätigte Nutzer (email_confirmed_at IS NULL)
-- tauchten sofort im Live-Ticker ("neuer Nutzer") und in den Dashboard-Stats
-- ("profiles" Count) auf — noch BEVOR sie ihre E-Mail bestätigt hatten.
-- Root Cause: Die RPCs fragten public.profiles ohne Join auf auth.users ab.
--
-- Fix: Beide RPCs (rpc_get_live_ticker_feed, rpc_get_home_dashboard) joinen
-- jetzt mit auth.users und filtern auf email_confirmed_at IS NOT NULL.
-- Zusätzlich wird der System-Bot (myHUI, 152619c1...) aus dem Ticker ausgeschlossen.
--
-- Zusätzlicher Fix (INC-001): Supabase Auth SMTP auf Resend umgestellt
-- (smtp.resend.com, be-hui.com, rate_limit 100/h) — siehe docs/INCIDENTS.md.
-- ══════════════════════════════════════════════════════════════════════════════

-- 1) rpc_get_live_ticker_feed — new_users nur mit email_confirmed_at
CREATE OR REPLACE FUNCTION public.rpc_get_live_ticker_feed(p_limit integer DEFAULT 5)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_works JSONB;
  v_experiences JSONB;
  v_connections JSONB;
  v_recommendations JSONB;
  v_post_reactions JSONB;
  v_project_support JSONB;
  v_work_sales JSONB;
  v_talent_bookings JSONB;
  v_impact_votes JSONB;
  v_talents JSONB;
  v_new_users JSONB;
  v_impact_pool JSONB;
BEGIN
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', w.id, 'created_at', w.created_at, 'title', w.title
  ) ORDER BY w.created_at DESC), '[]'::jsonb) INTO v_works
  FROM (SELECT * FROM public.works WHERE status = 'published' AND approval_status = 'approved' ORDER BY created_at DESC LIMIT p_limit) w;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', e.id, 'created_at', e.created_at, 'title', e.title
  ) ORDER BY e.created_at DESC), '[]'::jsonb) INTO v_experiences
  FROM (SELECT * FROM public.experiences WHERE status IS DISTINCT FROM 'deleted' ORDER BY created_at DESC LIMIT p_limit) e;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', c.id, 'created_at', c.created_at
  ) ORDER BY c.created_at DESC), '[]'::jsonb) INTO v_connections
  FROM (SELECT * FROM public.connections ORDER BY created_at DESC LIMIT p_limit) c;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', r.id, 'created_at', r.created_at, 'text', r.text
  ) ORDER BY r.created_at DESC), '[]'::jsonb) INTO v_recommendations
  FROM (SELECT * FROM public.recommendations WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT p_limit) r;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', pr.id, 'created_at', pr.created_at, 'type', pr.type,
    'post_id', pr.post_id, 'user_id', pr.user_id
  ) ORDER BY pr.created_at DESC), '[]'::jsonb) INTO v_post_reactions
  FROM (SELECT * FROM public.post_reactions ORDER BY created_at DESC LIMIT p_limit) pr;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', ps.id, 'created_at', ps.created_at, 'project_id', ps.project_id,
    'amount_eur', ps.amount_eur
  ) ORDER BY ps.created_at DESC), '[]'::jsonb) INTO v_project_support
  FROM (SELECT * FROM public.project_support ORDER BY created_at DESC LIMIT p_limit) ps;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', ws.id, 'created_at', ws.created_at, 'work_id', ws.work_id, 'amount', ws.amount
  ) ORDER BY ws.created_at DESC), '[]'::jsonb) INTO v_work_sales
  FROM (SELECT * FROM public.work_sales ORDER BY created_at DESC LIMIT p_limit) ws;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', tb.id, 'created_at', tb.created_at, 'talent_id', tb.talent_id
  ) ORDER BY tb.created_at DESC), '[]'::jsonb) INTO v_talent_bookings
  FROM (SELECT * FROM public.talent_bookings ORDER BY created_at DESC LIMIT p_limit) tb;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', iv.id, 'created_at', iv.created_at, 'project_id', iv.project_id
  ) ORDER BY iv.created_at DESC), '[]'::jsonb) INTO v_impact_votes
  FROM (SELECT * FROM public.impact_votes ORDER BY created_at DESC LIMIT p_limit) iv;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', t.id, 'created_at', t.created_at, 'title', t.title
  ) ORDER BY t.created_at DESC), '[]'::jsonb) INTO v_talents
  FROM (SELECT * FROM public.talents WHERE status = 'approved' ORDER BY created_at DESC LIMIT p_limit) t;

  -- FIX (Migration 133): Nur bestätigte Nutzer, System-Bot ausgeschlossen
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', p.id, 'created_at', p.created_at, 'username', p.username
  ) ORDER BY p.created_at DESC), '[]'::jsonb) INTO v_new_users
  FROM (SELECT p.id, p.created_at, p.username
        FROM public.profiles p
        JOIN auth.users au ON p.id = au.id
        WHERE au.email_confirmed_at IS NOT NULL
          AND p.id != '152619c1-9adc-40bf-9078-eb67f5024ed2' -- System-Bot myHUI
        ORDER BY p.created_at DESC LIMIT p_limit) p;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', sip.id, 'created_at', sip.created_at, 'amount_eur', sip.amount_total
  ) ORDER BY sip.created_at DESC), '[]'::jsonb) INTO v_impact_pool
  FROM (SELECT * FROM public.stripe_impact_pool ORDER BY created_at DESC LIMIT p_limit) sip;

  RETURN jsonb_build_object(
    'works', v_works,
    'experiences', v_experiences,
    'connections', v_connections,
    'recommendations', v_recommendations,
    'post_reactions', v_post_reactions,
    'project_support', v_project_support,
    'work_sales', v_work_sales,
    'talent_bookings', v_talent_bookings,
    'impact_votes', v_impact_votes,
    'talents', v_talents,
    'new_users', v_new_users,
    'impact_pool', v_impact_pool
  );
END;
$function$;

-- 2) rpc_get_home_dashboard — profiles count nur mit email_confirmed_at
CREATE OR REPLACE FUNCTION public.rpc_get_home_dashboard(p_user_id uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
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
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', w.id, 'title', w.title, 'creator_id', w.creator_id,
    'price', w.price, 'cover_url', w.cover_url
  ) ORDER BY w.created_at DESC), '[]'::jsonb)
  INTO works_arr
  FROM public.works w
  WHERE w.status IS DISTINCT FROM 'deleted'
  LIMIT 5;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', e.id, 'title', e.title, 'creator_id', e.user_id,
    'price', e.price, 'cover_url', e.cover_url
  ) ORDER BY e.created_at DESC), '[]'::jsonb)
  INTO exp_arr
  FROM public.experiences e
  WHERE e.status IS DISTINCT FROM 'deleted'
  LIMIT 5;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', ip.id, 'name', ip.project_name, 'short_desc', ip.short_desc,
    'cover_url', ip.cover_url, 'rank', ip.rank
  ) ORDER BY ip.created_at DESC), '[]'::jsonb)
  INTO impact_arr
  FROM public.impact_applications ip
  WHERE ip.status = 'approved'
  LIMIT 3;

  -- FIX (Migration 133): profiles count nur mit email_confirmed_at
  SELECT jsonb_build_object(
    'works', (SELECT count(*) FROM public.works WHERE status IS DISTINCT FROM 'deleted'),
    'talents', (SELECT count(*) FROM public.talents WHERE status = 'approved'),
    'experiences', (SELECT count(*) FROM public.experiences WHERE status IS DISTINCT FROM 'deleted'),
    'profiles', (SELECT count(*) FROM public.profiles p JOIN auth.users au ON p.id = au.id WHERE au.email_confirmed_at IS NOT NULL)
  ) INTO stats_obj;

  result := result || jsonb_build_object(
    'works', works_arr,
    'experiences', exp_arr,
    'impact_projects', impact_arr,
    'stats', stats_obj
  );

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
$function$;

-- Permissions (unverändert)
GRANT EXECUTE ON FUNCTION public.rpc_get_live_ticker_feed(integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_get_home_dashboard(uuid) TO anon, authenticated;
