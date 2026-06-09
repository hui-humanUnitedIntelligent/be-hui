-- Migration: works approval system
-- Run this in Supabase SQL Editor

-- 1. approval_status Spalte
ALTER TABLE works
  ADD COLUMN IF NOT EXISTS approval_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (approval_status IN ('pending','approved','rejected'));

-- 2. rejection_reason Spalte
ALTER TABLE works
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- 3. last_submitted_at bereits vorhanden per früherer Migration?
--    Sicherheitshalber nochmal:
ALTER TABLE works
  ADD COLUMN IF NOT EXISTS last_submitted_at TIMESTAMPTZ;

-- 4. is_update Spalte (NEU vs. AKTUALISIERT)
ALTER TABLE works
  ADD COLUMN IF NOT EXISTS is_update BOOLEAN NOT NULL DEFAULT false;

-- 5. Bestehende published Werke → approval_status = 'approved'
UPDATE works SET approval_status = 'approved' WHERE status = 'published';

-- 6. Bestehende pending_review Werke → approval_status = 'pending'
UPDATE works SET approval_status = 'pending' WHERE status = 'pending_review';

-- 7. Bestehende rejected Werke → approval_status = 'rejected'
UPDATE works SET approval_status = 'rejected' WHERE status = 'rejected';

-- 8. Index für schnelle Filterung
CREATE INDEX IF NOT EXISTS idx_works_approval_status ON works(approval_status);
CREATE INDEX IF NOT EXISTS idx_works_status_approval ON works(status, approval_status);

-- 9. RLS Policy: Nutzer sehen nur approved Werke (oder eigene)
-- Diese Policy NUR anlegen wenn noch nicht vorhanden:
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'works' AND policyname = 'works_visible_approved_or_own'
  ) THEN
    -- Bestehende "Alle sehen alle" Policy entfernen falls sie existiert:
    -- DROP POLICY IF EXISTS "works_public_read" ON works;
    
    CREATE POLICY "works_visible_approved_or_own"
    ON works FOR SELECT
    USING (
      approval_status = 'approved'
      OR auth.uid() = user_id
      OR auth.uid() = creator_id
    );
  END IF;
END $$;
