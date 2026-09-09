-- supabase/migrations/20260909_orte_country_bbox.sql
-- ORTE-COUNTRY-BBOX-001 (2026-09-09)
-- Land-aware Orte-Suche: "Spanien" soll alle registrierten Orte in Spanien
-- zeigen (Tortosa etc.), nicht nur exakte Text-Treffer auf "Spanien"
-- selbst. Die Land-Erkennung (Bounding-Box je Land) passiert im Frontend
-- (src/lib/countryBounds.js, statischer Katalog + Nominatim-Fallback) --
-- diese Migration ergaenzt nur die DB-Seite: eine neue bbox-basierte
-- Variante von rpc_discover_places (Anforderung 2+3) + den fehlenden
-- Geo-Index auf talents (Anforderung 5 -- profiles/works/experiences
-- hatten ihn bereits aus STANDORT-036 / REGIONFILTER-BBOX-001).

-- 1) Fehlenden Geo-Index auf talents ergaenzen (Anforderung 5, Performance)
CREATE INDEX IF NOT EXISTS idx_talents_geo
  ON public.talents USING btree (lat, lng)
  WHERE (lat IS NOT NULL AND lng IS NOT NULL);

-- 2) rpc_discover_places_bbox: identische Gruppierungs-/Ranking-Logik wie
-- rpc_discover_places (Erweitern statt duplizieren -- gleiche place_key-
-- Extraktion, gleiche Sortierung), aber Filter ueber lat/lng-Bounding-Box
-- statt ILIKE-Textsuche.
CREATE OR REPLACE FUNCTION public.rpc_discover_places_bbox(
  p_lat_min double precision,
  p_lat_max double precision,
  p_lng_min double precision,
  p_lng_max double precision,
  p_sort text DEFAULT 'active',
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
RETURNS TABLE(
  place_key text,
  people_count integer,
  works_count integer,
  experiences_count integer,
  talents_count integer,
  total_count integer
)
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
    UNION ALL
    SELECT trim(regexp_replace(split_part(trim(w.location_text), ',', 1), '.*\s(\S+)$', '\1')), 'work'
    FROM public.works w
    WHERE w.location_text IS NOT NULL AND btrim(w.location_text) <> ''
      AND w.lat IS NOT NULL AND w.lng IS NOT NULL
      AND w.lat BETWEEN p_lat_min AND p_lat_max
      AND w.lng BETWEEN p_lng_min AND p_lng_max
      AND w.status = 'published' AND w.approval_status = 'approved' AND w.visibility = 'public'
    UNION ALL
    SELECT trim(regexp_replace(split_part(trim(e.location_text), ',', 1), '.*\s(\S+)$', '\1')), 'experience'
    FROM public.experiences e
    WHERE e.location_text IS NOT NULL AND btrim(e.location_text) <> ''
      AND e.lat IS NOT NULL AND e.lng IS NOT NULL
      AND e.lat BETWEEN p_lat_min AND p_lat_max
      AND e.lng BETWEEN p_lng_min AND p_lng_max
      AND e.status = 'published' AND e.approval_status = 'approved'
    UNION ALL
    SELECT trim(regexp_replace(split_part(trim(t.location_address), ',', 1), '.*\s(\S+)$', '\1')), 'talent'
    FROM public.talents t
    WHERE t.location_address IS NOT NULL AND btrim(t.location_address) <> ''
      AND t.lat IS NOT NULL AND t.lng IS NOT NULL
      AND t.lat BETWEEN p_lat_min AND p_lat_max
      AND t.lng BETWEEN p_lng_min AND p_lng_max
      AND t.location_type IN ('vor_ort', 'hybrid')
      AND t.status = 'approved'
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

GRANT EXECUTE ON FUNCTION public.rpc_discover_places_bbox(double precision, double precision, double precision, double precision, text, integer, integer) TO anon, authenticated;
