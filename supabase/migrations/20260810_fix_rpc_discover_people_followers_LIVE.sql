CREATE OR REPLACE FUNCTION public.rpc_discover_people(
  p_search text DEFAULT NULL::text,
  p_sort text DEFAULT 'popular'::text,
  p_limit integer DEFAULT 20,
  p_offset integer DEFAULT 0
)
RETURNS TABLE(
  id uuid, full_name text, display_name text, username text, avatar_url text, bio text,
  location_label text, impact_eur numeric, followers_count integer, total_likes bigint
)
LANGUAGE sql
STABLE SECURITY DEFINER
AS $function$
  WITH base AS (
    SELECT p.id, p.full_name, p.display_name, p.username, p.avatar_url, p.bio, p.location_label,
           p.impact_eur,
           COALESCE((SELECT COUNT(*)::integer FROM public.follows f WHERE f.followed_id = p.id), 0) AS followers_count,
           p.created_at
    FROM public.profiles p
    WHERE (p.has_talent_profile = true OR p.is_member = true OR p.role = 'talent' OR p.role = 'wirker')
      AND COALESCE(p.focus_type, 'public') <> 'private'
      AND (
        p_search IS NULL OR p_search = '' OR
        p.full_name ILIKE '%' || p_search || '%' OR
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
  SELECT s.id, s.full_name, s.display_name, s.username, s.avatar_url, s.bio, s.location_label,
         s.impact_eur, s.followers_count, s.total_likes
  FROM scored s
  ORDER BY
    CASE WHEN p_sort = 'followers' THEN s.followers_count END DESC NULLS LAST,
    CASE WHEN p_sort = 'likes' THEN s.total_likes END DESC NULLS LAST,
    CASE WHEN p_sort = 'alpha' THEN LOWER(COALESCE(s.full_name, s.display_name, s.username, '')) END ASC NULLS LAST,
    CASE WHEN p_sort = 'popular' OR p_sort IS NULL THEN (s.followers_count + s.total_likes) END DESC NULLS LAST,
    s.created_at DESC,
    s.id ASC
  LIMIT p_limit OFFSET p_offset;
$function$;

-- KONTEXT (2026-08-10): Die Migration 20260807_fix_rpc_discover_people_followers.sql
-- existierte bereits im Repo, wurde aber NIE gegen die Produktions-DB ausgeführt
-- (verifiziert per Supabase Management API: pg_get_functiondef zeigte die alte,
-- kaputte Version mit COALESCE(p.followers_count,0) -- der toten Spalte).
-- Nutzer-Report (Screenshot 2026-08-10): Follower zeigten 0 bei ALLEN Personen in
-- "Inspirierende Menschen" + MenschenAllModal, obwohl echte follows-Einträge
-- existieren (verifiziert: Michael Mathis hatte 3 echte Follower in der
-- follows-Tabelle, aber profiles.followers_count stand auf 0).
-- Diese Datei spiegelt die Funktion, die am 2026-08-10 direkt live gegen die
-- Produktions-DB angewendet wurde (Supabase Management API, SUPABASE_ACCESS_TOKEN_2).
-- WICHTIG: Basis ist NICHT die alte 20260807-Migrationsdatei, sondern die
-- tatsächliche LIVE-Funktionsdefinition (inkl. full_name-Feld und
-- focus_type<>'private'-Privacy-Filter, die zwischenzeitlich zusätzlich in
-- Produktion ergänzt wurden, aber in keiner Repo-Migration dokumentiert waren)
-- -- nur die followers_count-Berechnung wurde von der toten Spalte auf ein
-- live COUNT(*) aus der follows-Tabelle umgestellt (exakt wie get_follow_counts()).
-- Backup der vorherigen Live-Definition: backup_20260810_rpc_discover_people_LIVE.sql
