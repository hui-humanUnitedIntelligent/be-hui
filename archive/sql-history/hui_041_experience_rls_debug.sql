-- ═══════════════════════════════════════════════════════════════════════
-- HUI Debug 041 — Experience RLS + Profile JOIN Test
-- Laufe diese Queries im Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════

-- 1. Wie viele experiences existieren?
SELECT COUNT(*), status, visibility
FROM public.experiences
GROUP BY status, visibility;

-- 2. Direkte experience rows ohne JOIN
SELECT id, title, status, visibility, user_id, created_at
FROM public.experiences
WHERE status = 'published'
ORDER BY created_at DESC;

-- 3. Mit profile JOIN testen
SELECT
  e.id, e.title, e.status, e.user_id, e.created_at,
  p.display_name, p.avatar_url
FROM public.experiences e
LEFT JOIN public.profiles p ON p.id = e.user_id
WHERE e.status = 'published'
ORDER BY e.created_at DESC;

-- 4. RLS Policies auf experiences
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'experiences';

-- 5. Ist RLS überhaupt enabled?
SELECT relname, relrowsecurity
FROM pg_class
WHERE relname = 'experiences';
