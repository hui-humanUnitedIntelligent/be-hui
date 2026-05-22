-- 034_membership_type_fix.sql
-- Phase 15.2: Membership persistence single source of truth
-- Idempotent — safe to run multiple times

-- Ensure membership_type column exists with correct default
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS membership_type text DEFAULT 'free';

-- Ensure is_member column exists
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_member boolean DEFAULT false;

-- Ensure member_since column exists
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS member_since timestamptz;

-- Backfill: sync is_member → membership_type for existing members
-- (covers any users who went through old flow that didn't set membership_type)
UPDATE public.profiles
SET membership_type = 'member'
WHERE is_member = true
  AND (membership_type IS NULL OR membership_type = 'free');

-- Backfill: sync membership_type → is_member (reverse direction)
UPDATE public.profiles
SET is_member = true
WHERE membership_type IN ('member', 'creator', 'guide')
  AND is_member = false;

-- Optional: ensure role is synced for members
UPDATE public.profiles
SET role = 'member'
WHERE is_member = true
  AND (role IS NULL OR role IN ('basisuser', 'basis_user', 'free'));

NOTIFY pgrst, 'reload schema';
