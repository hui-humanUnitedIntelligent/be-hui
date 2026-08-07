CREATE OR REPLACE FUNCTION public.rpc_discover_people(
  p_search text DEFAULT NULL,
  p_sort text DEFAULT 'popular',
  p_limit int DEFAULT 20,
  p_offset int DEFAULT 0
)
RETURNS TABLE(
  id uuid,
  display_name text,
  username text,
  avatar_url text,
  bio text,
  location_label text,
  impact_eur numeric,
  followers_count int,
  total_likes bigint
) AS $$
  WITH base AS (
    SELECT p.id, p.display_name, p.username, p.avatar_url, p.bio, p.location_label,
           p.impact_eur, COALESCE(p.followers_count,0) AS followers_count, p.created_at
    FROM public.profiles p
    WHERE (p.has_talent_profile = true OR p.is_member = true OR p.role = 'talent' OR p.role = 'wirker')
      AND (
        p_search IS NULL OR p_search = '' OR
        p.display_name ILIKE '%' || p_search || '%' OR
        p.username ILIKE '%' || p_search || '%' OR
        p.bio ILIKE '%' || p_search || '%'
      )
  ),
  scored AS (
    SELECT
      b.*,
      COALESCE((SELECT SUM(w.likes_count) FROM public.works w WHERE w.user_id = b.id), 0)
      + COALESCE((SELECT SUM(e.likes_count) FROM public.experiences e WHERE e.user_id = b.id), 0)
      + COALESCE((SELECT COUNT(*) FROM public.post_reactions pr JOIN public.beitraege bt ON pr.post_id = bt.id WHERE bt.user_id = b.id AND pr.post_type = 'post'), 0)
      AS total_likes
    FROM base b
  )
  SELECT s.id, s.display_name, s.username, s.avatar_url, s.bio, s.location_label,
         s.impact_eur, s.followers_count, s.total_likes
  FROM scored s
  ORDER BY
    CASE WHEN p_sort = 'followers' THEN s.followers_count END DESC NULLS LAST,
    CASE WHEN p_sort = 'likes' THEN s.total_likes END DESC NULLS LAST,
    CASE WHEN p_sort = 'alpha' THEN LOWER(COALESCE(s.display_name, s.username, '')) END ASC NULLS LAST,
    CASE WHEN p_sort = 'popular' OR p_sort IS NULL THEN (s.followers_count + s.total_likes) END DESC NULLS LAST,
    s.created_at DESC,
    s.id ASC
  LIMIT p_limit OFFSET p_offset;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

GRANT EXECUTE ON FUNCTION public.rpc_discover_people(text, text, int, int) TO anon, authenticated;

-- Cleanup: rpc_get_profile_likes (20260807_rpc_get_profile_likes.sql) wird durch
-- rpc_discover_people ersetzt, das Likes bereits inline mitliefert (keine
-- doppelte Logik / SSOT-Prinzip). Alte Funktion bleibt in DB (harmless), aber
-- Migration hier dokumentiert für Nachvollziehbarkeit.

