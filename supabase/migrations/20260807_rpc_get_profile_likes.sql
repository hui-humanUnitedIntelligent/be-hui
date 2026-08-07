-- DEPRECATED (2026-08-07): Ersetzt durch rpc_discover_people (20260807_rpc_discover_people.sql).
-- Diese Funktion wurde in Produktion per DROP FUNCTION entfernt — keine Referenzen mehr im Code.
-- Datei bleibt nur zur historischen Nachvollziehbarkeit im Repo.

-- rpc_get_profile_likes: Batch-Abfrage der gesamten Likes eines Users
-- Summiert: works.likes_count + experiences.likes_count + post_reactions auf beitraege
-- Rückgabe: { user_id, total_likes } pro übergebenem User
-- 2026-08-07: live angewendet via Management API (Token 2)
CREATE OR REPLACE FUNCTION public.rpc_get_profile_likes(p_user_ids UUID[])
RETURNS TABLE(user_id UUID, total_likes BIGINT) AS $$
  WITH work_likes AS (
    SELECT user_id, COALESCE(SUM(likes_count), 0)::BIGINT as likes
    FROM works WHERE user_id = ANY(p_user_ids) AND likes_count > 0
    GROUP BY user_id
  ),
  exp_likes AS (
    SELECT user_id, COALESCE(SUM(likes_count), 0)::BIGINT as likes
    FROM experiences WHERE user_id = ANY(p_user_ids) AND likes_count > 0
    GROUP BY user_id
  ),
  moment_likes AS (
    SELECT b.user_id, COUNT(*)::BIGINT as likes
    FROM post_reactions pr
    JOIN beitraege b ON pr.post_id = b.id
    WHERE b.user_id = ANY(p_user_ids) AND pr.post_type = 'post'
    GROUP BY b.user_id
  )
  SELECT u.id as user_id,
         COALESCE(w.likes, 0) + COALESCE(e.likes, 0) + COALESCE(m.likes, 0) as total_likes
  FROM UNNEST(p_user_ids) AS u(id)
  LEFT JOIN work_likes w ON w.user_id = u.id
  LEFT JOIN exp_likes e ON e.user_id = u.id
  LEFT JOIN moment_likes m ON m.user_id = u.id;
$$ LANGUAGE sql SECURITY DEFINER;
GRANT EXECUTE ON public.rpc_get_profile_likes TO anon, authenticated;
