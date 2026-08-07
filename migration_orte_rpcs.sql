-- 20260807_rpc_discover_places.sql
-- Echte Orte aus profiles/works/experiences statt Fake-Seed-Daten

CREATE OR REPLACE FUNCTION public.rpc_discover_places(
  p_search text DEFAULT NULL,
  p_sort text DEFAULT 'active',
  p_limit integer DEFAULT 20,
  p_offset integer DEFAULT 0
)
RETURNS TABLE(
  place_key text,
  people_count integer,
  works_count integer,
  experiences_count integer,
  total_count integer
)
LANGUAGE sql
STABLE SECURITY DEFINER
AS $function$
  WITH raw AS (
    SELECT trim(regexp_replace(split_part(trim(p.location_label), ',', 1), '.*\s(\S+)$', '\1')) AS place_key, 'person' AS src
    FROM public.profiles p
    WHERE p.location_label IS NOT NULL AND btrim(p.location_label) <> ''
      AND (p.has_talent_profile = true OR p.is_member = true OR p.role = 'talent' OR p.role = 'wirker' OR p.role = 'admin' OR p.role = 'superadmin')
    UNION ALL
    SELECT trim(regexp_replace(split_part(trim(w.location_text), ',', 1), '.*\s(\S+)$', '\1')), 'work'
    FROM public.works w
    WHERE w.location_text IS NOT NULL AND btrim(w.location_text) <> ''
      AND w.status = 'published' AND w.approval_status = 'approved' AND w.visibility = 'public'
    UNION ALL
    SELECT trim(regexp_replace(split_part(trim(e.location_text), ',', 1), '.*\s(\S+)$', '\1')), 'experience'
    FROM public.experiences e
    WHERE e.location_text IS NOT NULL AND btrim(e.location_text) <> ''
      AND e.status = 'published' AND e.approval_status = 'approved'
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
      COUNT(*)                                   AS total_count
    FROM cleaned
    GROUP BY place_key_norm
  )
  SELECT place_label, people_count::integer, works_count::integer, experiences_count::integer, total_count::integer
  FROM grouped
  WHERE p_search IS NULL OR p_search = '' OR place_label ILIKE '%' || p_search || '%'
  ORDER BY
    CASE WHEN p_sort = 'alpha' THEN place_label END ASC NULLS LAST,
    CASE WHEN p_sort = 'active' OR p_sort IS NULL THEN total_count END DESC NULLS LAST,
    place_label ASC
  LIMIT p_limit OFFSET p_offset;
$function$;

CREATE OR REPLACE FUNCTION public.rpc_discover_place_detail(
  p_place text,
  p_limit integer DEFAULT 30
)
RETURNS TABLE(
  item_type text,
  id uuid,
  title text,
  subtitle text,
  cover_url text,
  location text,
  price numeric
)
LANGUAGE sql
STABLE SECURITY DEFINER
AS $function$
  (
    SELECT 'person'::text, p.id, COALESCE(p.display_name, p.username, 'HUI Mitglied'), p.bio, p.avatar_url, p.location_label, NULL::numeric
    FROM public.profiles p
    WHERE p.location_label ILIKE '%' || p_place || '%'
      AND (p.has_talent_profile = true OR p.is_member = true OR p.role = 'talent' OR p.role = 'wirker' OR p.role = 'admin' OR p.role = 'superadmin')
    LIMIT p_limit
  )
  UNION ALL
  (
    SELECT 'work'::text, w.id, w.title, w.category, w.cover_url, w.location_text, w.price
    FROM public.works w
    WHERE w.location_text ILIKE '%' || p_place || '%'
      AND w.status = 'published' AND w.approval_status = 'approved' AND w.visibility = 'public'
    LIMIT p_limit
  )
  UNION ALL
  (
    SELECT 'experience'::text, e.id, e.title, COALESCE(e.experience_type, e.category), e.cover_url, e.location_text, NULL::numeric
    FROM public.experiences e
    WHERE e.location_text ILIKE '%' || p_place || '%'
      AND e.status = 'published' AND e.approval_status = 'approved'
    LIMIT p_limit
  )
$function$;
