-- ═══════════════════════════════════════════════════════════════════════
-- Migration 144: PRIVATE-VISIBILITY-GUARD Tier-2 — SECURITY DEFINER RPCs
-- Michael-Entscheidung (2026-09-26): Auch Orte-Suche, Home-Dashboard und
-- Live-Ticker duerfen Profile im Privatmodus (focus_type='private') und
-- deren Werke/Talente/Erlebnisse nicht ausliefern. Diese RPCs laufen als
-- SECURITY DEFINER und umgehen die RLS-Policies aus Migration 143.
--
-- Backups: backups/20260926_private_visibility_guard/backup_20260926_<rpc>.json
--
-- Gefiltert (Personen + Inhalte privater Ersteller):
--   rpc_discover_places, rpc_discover_place_detail, rpc_discover_places_bbox
--   (Personen-Zweig + works/experiences/talents-Zweig)
--   rpc_get_home_dashboard (works_arr + exp_arr; Stats-Zahlen bewusst
--     unveraendert — Aggregate ohne Profilbezug)
--   rpc_get_live_ticker_feed (works + experiences + talents + new_users;
--     reine ID-Aktivitaetseintraege (Verbindungen, Reaktionen, Sales) bewusst
--     unveraendert — sie zeigen keine Profil-Identitaet)
-- ═══════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.rpc_discover_places(p_search text DEFAULT NULL::text, p_sort text DEFAULT 'active'::text, p_limit integer DEFAULT 20, p_offset integer DEFAULT 0)
 RETURNS TABLE(place_key text, people_count integer, works_count integer, experiences_count integer, talents_count integer, total_count integer)
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  WITH raw AS (
    SELECT trim(regexp_replace(split_part(trim(p.location_label), ',', 1), '.*\s(\S+)$', '\1')) AS place_key, 'person' AS src
    FROM public.profiles p
    WHERE p.location_label IS NOT NULL AND btrim(p.location_label) <> ''
      AND (p.has_talent_profile = true OR p.is_member = true OR p.role = 'talent' OR p.role = 'wirker' OR p.role = 'admin' OR p.role = 'superadmin')
    -- PRIVATE-VISIBILITY-GUARD: private Profile nicht sichtbar
    AND COALESCE(p.focus_type, 'public') <> 'private'
    UNION ALL
    SELECT trim(regexp_replace(split_part(trim(w.location_text), ',', 1), '.*\s(\S+)$', '\1')), 'work'
    FROM public.works w
    WHERE w.location_text IS NOT NULL AND btrim(w.location_text) <> ''
      AND w.status = 'published' AND w.approval_status = 'approved' AND w.visibility = 'public'
    -- PRIVATE-VISIBILITY-GUARD: Werke privater Ersteller nicht sichtbar
    AND NOT EXISTS (SELECT 1 FROM public.profiles pp WHERE pp.id = w.user_id AND pp.focus_type = 'private')
    UNION ALL
    SELECT trim(regexp_replace(split_part(trim(e.location_text), ',', 1), '.*\s(\S+)$', '\1')), 'experience'
    FROM public.experiences e
    WHERE e.location_text IS NOT NULL AND btrim(e.location_text) <> ''
      AND e.status = 'published' AND e.approval_status = 'approved'
    -- PRIVATE-VISIBILITY-GUARD
    AND NOT EXISTS (SELECT 1 FROM public.profiles pp WHERE pp.id = e.user_id AND pp.focus_type = 'private')
    UNION ALL
    SELECT trim(regexp_replace(split_part(trim(t.location_address), ',', 1), '.*\s(\S+)$', '\1')), 'talent'
    FROM public.talents t
    WHERE t.location_address IS NOT NULL AND btrim(t.location_address) <> ''
      AND t.location_type IN ('vor_ort', 'hybrid')
      AND t.status = 'approved'
      -- PRIVATE-VISIBILITY-GUARD
      AND NOT EXISTS (SELECT 1 FROM public.profiles pp WHERE pp.id = t.user_id AND pp.focus_type = 'private')
  ),
  cleaned AS (
    SELECT place_key, lower(place_key) AS place_key_norm, src
    FROM raw
    WHERE place_key <> '' AND length(place_key) >= 2
  ),
  grouped AS (
    SELECT
      place_key_norm,
      (array_agg(place_key ORDER BY char_length(place_key) DESC))[1] AS place_label,
      COUNT(*) FILTER (WHERE src = 'person')     AS people_count,
      COUNT(*) FILTER (WHERE src = 'work')       AS works_count,
      COUNT(*) FILTER (WHERE src = 'experience') AS experiences_count,
      COUNT(*) FILTER (WHERE src = 'talent')     AS talents_count,
      COUNT(*)                                   AS total_count
    FROM cleaned
    GROUP BY place_key_norm
  )
  SELECT place_label, people_count::integer, works_count::integer, experiences_count::integer, talents_count::integer, total_count::integer
  FROM grouped
  WHERE p_search IS NULL OR p_search = '' OR place_label ILIKE '%' || p_search || '%'
  ORDER BY
    CASE WHEN p_sort = 'alpha' THEN place_label END ASC NULLS LAST,
    CASE WHEN p_sort = 'active' OR p_sort IS NULL THEN total_count END DESC NULLS LAST,
    place_label ASC
  LIMIT p_limit OFFSET p_offset;
$function$;

CREATE OR REPLACE FUNCTION public.rpc_discover_place_detail(p_place text, p_limit integer DEFAULT 30)
 RETURNS TABLE(item_type text, id uuid, title text, subtitle text, cover_url text, location text, price numeric)
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  (
    SELECT 'person'::text, p.id, COALESCE(p.display_name, p.username, 'HUI Mitglied'), p.bio, p.avatar_url, p.location_label, NULL::numeric
    FROM public.profiles p
    WHERE p.location_label ILIKE '%' || p_place || '%'
      AND (p.has_talent_profile = true OR p.is_member = true OR p.role = 'talent' OR p.role = 'wirker' OR p.role = 'admin' OR p.role = 'superadmin')
      -- PRIVATE-VISIBILITY-GUARD: private Profile nicht sichtbar
      AND COALESCE(p.focus_type, 'public') <> 'private'
    LIMIT p_limit
  )
  UNION ALL
  (
    SELECT 'work'::text, w.id, w.title, w.category, w.cover_url, w.location_text, w.price
    FROM public.works w
    WHERE w.location_text ILIKE '%' || p_place || '%'
      AND w.status = 'published' AND w.approval_status = 'approved' AND w.visibility = 'public'
      -- PRIVATE-VISIBILITY-GUARD
      AND NOT EXISTS (SELECT 1 FROM public.profiles pp WHERE pp.id = w.user_id AND pp.focus_type = 'private')
    LIMIT p_limit
  )
  UNION ALL
  (
    SELECT 'experience'::text, e.id, e.title, COALESCE(e.experience_type, e.category), e.cover_url, e.location_text, NULL::numeric
    FROM public.experiences e
    WHERE e.location_text ILIKE '%' || p_place || '%'
      AND e.status = 'published' AND e.approval_status = 'approved'
      -- PRIVATE-VISIBILITY-GUARD
      AND NOT EXISTS (SELECT 1 FROM public.profiles pp WHERE pp.id = e.user_id AND pp.focus_type = 'private')
    LIMIT p_limit
  )
  UNION ALL
  (
    SELECT 'talent'::text, t.id, t.title, t.category,
      COALESCE(t.thumbnail_url, (t.images->0->>'url')), t.location_address,
      COALESCE(t.price_per_session, t.price_per_hour)
    FROM public.talents t
    WHERE t.location_address ILIKE '%' || p_place || '%'
      AND t.location_type IN ('vor_ort', 'hybrid')
      AND t.status = 'approved'
      -- PRIVATE-VISIBILITY-GUARD
      AND NOT EXISTS (SELECT 1 FROM public.profiles pp WHERE pp.id = t.user_id AND pp.focus_type = 'private')
    LIMIT p_limit
  )
$function$;

CREATE OR REPLACE FUNCTION public.rpc_discover_places_bbox(p_lat_min double precision, p_lat_max double precision, p_lng_min double precision, p_lng_max double precision, p_sort text DEFAULT 'active'::text, p_limit integer DEFAULT 50, p_offset integer DEFAULT 0)
 RETURNS TABLE(place_key text, people_count integer, works_count integer, experiences_count integer, talents_count integer, total_count integer)
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  WITH raw AS (
    SELECT trim(regexp_replace(split_part(trim(p.location_label), ',', 1), '.*\s(\S+)$', '\1')) AS place_key, 'person' AS src
    FROM public.profiles p
    WHERE p.location_label IS NOT NULL AND btrim(p.location_label) <> ''
      AND p.location_lat IS NOT NULL AND p.location_lng IS NOT NULL
      AND p.location_lat BETWEEN p_lat_min AND p_lat_max
      AND p.location_lng BETWEEN p_lng_min AND p_lng_max
      AND (p.has_talent_profile = true OR p.is_member = true OR p.role = 'talent' OR p.role = 'wirker' OR p.role = 'admin' OR p.role = 'superadmin')
    -- PRIVATE-VISIBILITY-GUARD: private Profile nicht sichtbar
    AND COALESCE(p.focus_type, 'public') <> 'private'
    UNION ALL
    SELECT trim(regexp_replace(split_part(trim(w.location_text), ',', 1), '.*\s(\S+)$', '\1')), 'work'
    FROM public.works w
    WHERE w.location_text IS NOT NULL AND btrim(w.location_text) <> ''
      AND w.lat IS NOT NULL AND w.lng IS NOT NULL
      AND w.lat BETWEEN p_lat_min AND p_lat_max
      AND w.lng BETWEEN p_lng_min AND p_lng_max
      AND w.status = 'published' AND w.approval_status = 'approved' AND w.visibility = 'public'
    -- PRIVATE-VISIBILITY-GUARD
    AND NOT EXISTS (SELECT 1 FROM public.profiles pp WHERE pp.id = w.user_id AND pp.focus_type = 'private')
    UNION ALL
    SELECT trim(regexp_replace(split_part(trim(e.location_text), ',', 1), '.*\s(\S+)$', '\1')), 'experience'
    FROM public.experiences e
    WHERE e.location_text IS NOT NULL AND btrim(e.location_text) <> ''
      AND e.lat IS NOT NULL AND e.lng IS NOT NULL
      AND e.lat BETWEEN p_lat_min AND p_lat_max
      AND e.lng BETWEEN p_lng_min AND p_lng_max
      AND e.status = 'published' AND e.approval_status = 'approved'
    -- PRIVATE-VISIBILITY-GUARD
    AND NOT EXISTS (SELECT 1 FROM public.profiles pp WHERE pp.id = e.user_id AND pp.focus_type = 'private')
    UNION ALL
    SELECT trim(regexp_replace(split_part(trim(t.location_address), ',', 1), '.*\s(\S+)$', '\1')), 'talent'
    FROM public.talents t
    WHERE t.location_address IS NOT NULL AND btrim(t.location_address) <> ''
      AND t.lat IS NOT NULL AND t.lng IS NOT NULL
      AND t.lat BETWEEN p_lat_min AND p_lat_max
      AND t.lng BETWEEN p_lng_min AND p_lng_max
      AND t.location_type IN ('vor_ort', 'hybrid')
      AND t.status = 'approved'
      -- PRIVATE-VISIBILITY-GUARD
      AND NOT EXISTS (SELECT 1 FROM public.profiles pp WHERE pp.id = t.user_id AND pp.focus_type = 'private')
  ),
  cleaned AS (
    SELECT place_key, lower(place_key) AS place_key_norm, src
    FROM raw
    WHERE place_key <> '' AND length(place_key) >= 2
  ),
  grouped AS (
    SELECT
      place_key_norm,
      (array_agg(place_key ORDER BY char_length(place_key) DESC))[1] AS place_label,
      COUNT(*) FILTER (WHERE src = 'person')     AS people_count,
      COUNT(*) FILTER (WHERE src = 'work')       AS works_count,
      COUNT(*) FILTER (WHERE src = 'experience') AS experiences_count,
      COUNT(*) FILTER (WHERE src = 'talent')     AS talents_count,
      COUNT(*)                                   AS total_count
    FROM cleaned
    GROUP BY place_key_norm
  )
  SELECT place_label, people_count::integer, works_count::integer, experiences_count::integer, talents_count::integer, total_count::integer
  FROM grouped
  ORDER BY
    CASE WHEN p_sort = 'alpha' THEN place_label END ASC NULLS LAST,
    CASE WHEN p_sort = 'active' OR p_sort IS NULL THEN total_count END DESC NULLS LAST,
    place_label ASC
  LIMIT p_limit OFFSET p_offset;
$function$;

CREATE OR REPLACE FUNCTION public.rpc_get_home_dashboard(p_user_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$ DECLARE result JSONB := '{}'::jsonb; works_arr JSONB; exp_arr JSONB; impact_arr JSONB; stats_obj JSONB; user_obj JSONB := '{}'::jsonb; conn_count INTEGER; vote_count INTEGER; BEGIN SELECT COALESCE(jsonb_agg(jsonb_build_object('id', w.id, 'title', w.title, 'creator_id', w.creator_id, 'price', w.price, 'cover_url', w.cover_url) ORDER BY w.created_at DESC), '[]'::jsonb) INTO works_arr FROM public.works w WHERE w.status IS DISTINCT FROM 'deleted' AND NOT EXISTS (SELECT 1 FROM public.profiles pp WHERE pp.id = COALESCE(w.creator_id, w.user_id) AND pp.focus_type = 'private') LIMIT 5; SELECT COALESCE(jsonb_agg(jsonb_build_object('id', e.id, 'title', e.title, 'creator_id', e.user_id, 'price', e.price, 'cover_url', e.cover_url) ORDER BY e.created_at DESC), '[]'::jsonb) INTO exp_arr FROM public.experiences e WHERE e.status IS DISTINCT FROM 'deleted' AND NOT EXISTS (SELECT 1 FROM public.profiles pp WHERE pp.id = e.user_id AND pp.focus_type = 'private') LIMIT 5; SELECT COALESCE(jsonb_agg(jsonb_build_object('id', ip.id, 'name', ip.project_name, 'short_desc', ip.short_desc, 'cover_url', ip.cover_url, 'rank', ip.rank) ORDER BY ip.created_at DESC), '[]'::jsonb) INTO impact_arr FROM public.impact_applications ip WHERE ip.status = 'approved' LIMIT 3; SELECT jsonb_build_object('works', (SELECT count(*) FROM public.works WHERE status IS DISTINCT FROM 'deleted'), 'talents', (SELECT count(*) FROM public.talents WHERE status = 'approved'), 'experiences', (SELECT count(*) FROM public.experiences WHERE status IS DISTINCT FROM 'deleted'), 'profiles', (SELECT count(*) FROM public.profiles p JOIN auth.users au ON p.id = au.id WHERE au.email_confirmed_at IS NOT NULL)) INTO stats_obj; result := result || jsonb_build_object('works', works_arr, 'experiences', exp_arr, 'impact_projects', impact_arr, 'stats', stats_obj); IF p_user_id IS NOT NULL THEN SELECT count(*) INTO conn_count FROM public.connections WHERE requester_id = p_user_id OR recipient_id = p_user_id; SELECT count(*) INTO vote_count FROM public.impact_votes WHERE voter_id = p_user_id; user_obj := jsonb_build_object('connections', conn_count, 'votes', vote_count); result := result || jsonb_build_object('user', user_obj); END IF; RETURN result; END; $function$;

CREATE OR REPLACE FUNCTION public.rpc_get_live_ticker_feed(p_limit integer DEFAULT 5)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$ DECLARE v_works JSONB; v_experiences JSONB; v_connections JSONB; v_recommendations JSONB; v_post_reactions JSONB; v_project_support JSONB; v_work_sales JSONB; v_talent_bookings JSONB; v_impact_votes JSONB; v_talents JSONB; v_new_users JSONB; v_impact_pool JSONB; BEGIN SELECT COALESCE(jsonb_agg(jsonb_build_object('id', w.id, 'created_at', w.created_at, 'title', w.title) ORDER BY w.created_at DESC), '[]'::jsonb) INTO v_works FROM (SELECT * FROM public.works WHERE status = 'published' AND approval_status = 'approved' AND NOT EXISTS (SELECT 1 FROM public.profiles pp WHERE pp.id = works.user_id AND pp.focus_type = 'private') ORDER BY created_at DESC LIMIT p_limit) w; SELECT COALESCE(jsonb_agg(jsonb_build_object('id', e.id, 'created_at', e.created_at, 'title', e.title) ORDER BY e.created_at DESC), '[]'::jsonb) INTO v_experiences FROM (SELECT * FROM public.experiences WHERE status IS DISTINCT FROM 'deleted' AND NOT EXISTS (SELECT 1 FROM public.profiles pp WHERE pp.id = experiences.user_id AND pp.focus_type = 'private') ORDER BY created_at DESC LIMIT p_limit) e; SELECT COALESCE(jsonb_agg(jsonb_build_object('id', c.id, 'created_at', c.created_at) ORDER BY c.created_at DESC), '[]'::jsonb) INTO v_connections FROM (SELECT * FROM public.connections ORDER BY created_at DESC LIMIT p_limit) c; SELECT COALESCE(jsonb_agg(jsonb_build_object('id', r.id, 'created_at', r.created_at, 'text', r.text) ORDER BY r.created_at DESC), '[]'::jsonb) INTO v_recommendations FROM (SELECT * FROM public.recommendations WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT p_limit) r; SELECT COALESCE(jsonb_agg(jsonb_build_object('id', pr.id, 'created_at', pr.created_at, 'type', pr.type, 'post_id', pr.post_id, 'user_id', pr.user_id) ORDER BY pr.created_at DESC), '[]'::jsonb) INTO v_post_reactions FROM (SELECT * FROM public.post_reactions ORDER BY created_at DESC LIMIT p_limit) pr; SELECT COALESCE(jsonb_agg(jsonb_build_object('id', ps.id, 'created_at', ps.created_at, 'project_id', ps.project_id, 'amount_eur', ps.amount_eur) ORDER BY ps.created_at DESC), '[]'::jsonb) INTO v_project_support FROM (SELECT * FROM public.project_support ORDER BY created_at DESC LIMIT p_limit) ps; SELECT COALESCE(jsonb_agg(jsonb_build_object('id', ws.id, 'created_at', ws.created_at, 'work_id', ws.work_id, 'amount', ws.amount) ORDER BY ws.created_at DESC), '[]'::jsonb) INTO v_work_sales FROM (SELECT * FROM public.work_sales ORDER BY created_at DESC LIMIT p_limit) ws; SELECT COALESCE(jsonb_agg(jsonb_build_object('id', tb.id, 'created_at', tb.created_at, 'talent_id', tb.talent_id) ORDER BY tb.created_at DESC), '[]'::jsonb) INTO v_talent_bookings FROM (SELECT * FROM public.talent_bookings ORDER BY created_at DESC LIMIT p_limit) tb; SELECT COALESCE(jsonb_agg(jsonb_build_object('id', iv.id, 'created_at', iv.created_at, 'project_id', iv.project_id) ORDER BY iv.created_at DESC), '[]'::jsonb) INTO v_impact_votes FROM (SELECT * FROM public.impact_votes ORDER BY created_at DESC LIMIT p_limit) iv; SELECT COALESCE(jsonb_agg(jsonb_build_object('id', t.id, 'created_at', t.created_at, 'title', t.title) ORDER BY t.created_at DESC), '[]'::jsonb) INTO v_talents FROM (SELECT * FROM public.talents WHERE status = 'approved' AND NOT EXISTS (SELECT 1 FROM public.profiles pp WHERE pp.id = talents.user_id AND pp.focus_type = 'private') ORDER BY created_at DESC LIMIT p_limit) t; SELECT COALESCE(jsonb_agg(jsonb_build_object('id', p.id, 'created_at', p.created_at, 'username', p.username) ORDER BY p.created_at DESC), '[]'::jsonb) INTO v_new_users FROM (SELECT p.id, p.created_at, p.username FROM public.profiles p JOIN auth.users au ON p.id = au.id WHERE au.email_confirmed_at IS NOT NULL AND p.id != '152619c1-9adc-40bf-9078-eb67f5024ed2' AND COALESCE(p.focus_type, 'public') <> 'private' ORDER BY p.created_at DESC LIMIT p_limit) p; SELECT COALESCE(jsonb_agg(jsonb_build_object('id', sip.id, 'created_at', sip.created_at, 'amount_eur', sip.amount_total) ORDER BY sip.created_at DESC), '[]'::jsonb) INTO v_impact_pool FROM (SELECT * FROM public.stripe_impact_pool ORDER BY created_at DESC LIMIT p_limit) sip; RETURN jsonb_build_object('works', v_works, 'experiences', v_experiences, 'connections', v_connections, 'recommendations', v_recommendations, 'post_reactions', v_post_reactions, 'project_support', v_project_support, 'work_sales', v_work_sales, 'talent_bookings', v_talent_bookings, 'impact_votes', v_impact_votes, 'talents', v_talents, 'new_users', v_new_users, 'impact_pool', v_impact_pool); END; $function$;
