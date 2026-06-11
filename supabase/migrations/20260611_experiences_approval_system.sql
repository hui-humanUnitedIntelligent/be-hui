-- Migration: experiences + projects approval system
-- Identisch zu works (20260609_works_approval_system.sql) aber für experiences + projects
-- Run in Supabase SQL Editor

-- ══════════════════════════════════════════════════════════════════════
-- EXPERIENCES TABELLE
-- ══════════════════════════════════════════════════════════════════════

-- 1. approval_status
ALTER TABLE experiences
  ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending'
    CHECK (approval_status IN ('pending','approved','rejected'));

-- 2. rejection_reason
ALTER TABLE experiences
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- 3. last_submitted_at
ALTER TABLE experiences
  ADD COLUMN IF NOT EXISTS last_submitted_at TIMESTAMPTZ;

-- 4. is_update (erneute Einreichung nach Ablehnung)
ALTER TABLE experiences
  ADD COLUMN IF NOT EXISTS is_update BOOLEAN NOT NULL DEFAULT false;

-- 5. Bestehende Daten normalisieren
UPDATE experiences SET approval_status = 'approved'  WHERE status = 'published'     AND approval_status IS NULL;
UPDATE experiences SET approval_status = 'pending'   WHERE status = 'pending_review' AND approval_status IS NULL;
UPDATE experiences SET approval_status = 'rejected'  WHERE status = 'rejected'       AND approval_status IS NULL;
UPDATE experiences SET approval_status = 'pending'   WHERE approval_status IS NULL;

-- 6. Indizes
CREATE INDEX IF NOT EXISTS idx_experiences_approval_status ON experiences(approval_status);
CREATE INDEX IF NOT EXISTS idx_experiences_status_approval ON experiences(status, approval_status);

-- ══════════════════════════════════════════════════════════════════════
-- PROJECTS TABELLE
-- ══════════════════════════════════════════════════════════════════════

-- 1. approval_status
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending'
    CHECK (approval_status IN ('pending','approved','rejected'));

-- 2. rejection_reason
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- 3. last_submitted_at
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS last_submitted_at TIMESTAMPTZ;

-- 4. is_update
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS is_update BOOLEAN NOT NULL DEFAULT false;

-- 5. Bestehende Daten normalisieren
UPDATE projects SET approval_status = 'approved'  WHERE status = 'published'     AND approval_status IS NULL;
UPDATE projects SET approval_status = 'pending'   WHERE status = 'pending_review' AND approval_status IS NULL;
UPDATE projects SET approval_status = 'rejected'  WHERE status = 'rejected'       AND approval_status IS NULL;
UPDATE projects SET approval_status = 'pending'   WHERE approval_status IS NULL;

-- 6. Indizes
CREATE INDEX IF NOT EXISTS idx_projects_approval_status ON projects(approval_status);
CREATE INDEX IF NOT EXISTS idx_projects_status_approval ON projects(status, approval_status);

-- ══════════════════════════════════════════════════════════════════════
-- VERIFY
-- ══════════════════════════════════════════════════════════════════════
-- SELECT column_name FROM information_schema.columns 
-- WHERE table_name IN ('experiences','projects') 
-- AND column_name IN ('approval_status','rejection_reason','is_update','last_submitted_at');
