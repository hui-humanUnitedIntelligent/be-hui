-- ═══════════════════════════════════════════════════════════════════════
-- HUI Migration 040 — Feed Reality Fix (Phase 4F)
-- Datum: 2026-05-24
-- PROBLEM: experiences mit NULL status erscheinen nicht im Feed
-- FIX: status default + update bestehender NULLs
-- IDEMPOTENT
-- ═══════════════════════════════════════════════════════════════════════

-- 1. Status-Default sicherstellen
ALTER TABLE public.experiences
  ALTER COLUMN status SET DEFAULT 'published';

ALTER TABLE public.experiences
  ALTER COLUMN visibility SET DEFAULT 'public';

-- 2. Bestehende Rows ohne status → published setzen
UPDATE public.experiences
SET status = 'published'
WHERE status IS NULL OR status = '';

-- 3. Bestehende Rows ohne visibility → public
UPDATE public.experiences
SET visibility = 'public'
WHERE visibility IS NULL OR visibility = '';

-- 4. RLS: sicherstellen dass published experiences für alle lesbar sind
-- (auch wenn profile join durch RLS blockiert werden könnte)
DROP POLICY IF EXISTS exp_select ON public.experiences;
CREATE POLICY exp_select ON public.experiences
  FOR SELECT USING (
    status = 'published'
    OR auth.uid() = user_id
  );

-- 5. Index auf created_at für neuen ORDER BY
CREATE INDEX IF NOT EXISTS idx_experiences_created_at
  ON public.experiences(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_experiences_status_created
  ON public.experiences(status, created_at DESC);

-- 6. Validation: Wie viele published experiences?
SELECT
  status,
  visibility,
  COUNT(*) as count,
  MAX(created_at) as latest
FROM public.experiences
GROUP BY status, visibility
ORDER BY count DESC;
