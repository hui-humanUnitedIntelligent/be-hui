-- 20260807_fix_rpc_discover_people_followers.sql
-- ROOT CAUSE: profiles.followers_count wird von KEINEM Trigger gepflegt
-- (verifiziert: 0 von 5 Profilen mit echten follows-Einträgen hatten
-- einen followers_count > 0 in der profiles-Tabelle). rpc_discover_people
-- las bisher diese tote Spalte -> Follower-Anzeige fehlte komplett in
-- "Inspirierende Menschen" + MenschenAllModal.
-- FIX: followers_count live aus der follows-Tabelle berechnen, exakt wie
-- get_follow_counts() das bereits korrekt tut (COUNT(*) WHERE followed_id).
CREATE OR REPLACE FUNCTION public.rpc_discover_people(
  p_search text DEFAULT NULL::text,
  p_sort text DEFAULT 'popular'::text,
  p_limit integer DEFAULT 20,
  p_offset integer DEFAULT 0
)
RETURNS TABLE(
  id uuid, display_name text, username text, avatar_url text, bio text,
  location_label text, impact_eur numeric, followers_count integer, total_likes bigint
)
LANGUAGE sql
STABLE SECURITY DEFINER
AS $function$
  WITH base AS (
    SELECT p.id, p.display_name, p.username, p.avatar_url, p.bio, p.location_label,
           p.impact_eur,
           COALESCE((SELECT COUNT(*)::integer FROM public.follows f WHERE f.followed_id = p.id), 0) AS followers_count,
           p.created_at
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
$function$;
