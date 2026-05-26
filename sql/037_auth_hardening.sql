-- ═══════════════════════════════════════════════════════════════
-- HUI — Migration 037: Auth Hardening
-- Phase 4A — Auth & User Core Hardening
-- ═══════════════════════════════════════════════════════════════
-- Idempotent. Safe to run multiple times.
-- ═══════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. profiles: add missing columns ────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS interests         text[]      DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS profile_complete  boolean     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS username_lower    text        GENERATED ALWAYS AS (lower(username)) STORED;

-- Username uniqueness (case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username_lower
  ON public.profiles (username_lower)
  WHERE username_lower IS NOT NULL;

-- Presence: partial index for fast online queries
CREATE INDEX IF NOT EXISTS idx_presence_online
  ON public.user_presence (last_seen_at DESC)
  WHERE status = 'online';

-- ── 2. Reserved usernames table ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.reserved_usernames (
  username_lower  text  PRIMARY KEY
);

INSERT INTO public.reserved_usernames (username_lower) VALUES
  ('admin'), ('hui'), ('support'), ('official'), ('help'),
  ('team'), ('bot'), ('system'), ('moderator'), ('mod'),
  ('staff'), ('press'), ('media'), ('contact'), ('info'),
  ('security'), ('abuse'), ('root'), ('superuser'), ('ops')
ON CONFLICT DO NOTHING;

-- reserved_usernames: readable by all, no writes by users
ALTER TABLE public.reserved_usernames ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS reserved_read ON public.reserved_usernames;
CREATE POLICY reserved_read ON public.reserved_usernames FOR SELECT USING (true);

-- ── 3. username_available() — DB-level check ─────────────────────
CREATE OR REPLACE FUNCTION public.username_available(p_username text)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  _lower text := lower(trim(p_username));
BEGIN
  -- Length: 3-30 chars
  IF length(_lower) < 3 OR length(_lower) > 30 THEN RETURN false; END IF;
  -- Only a-z 0-9 _ .
  IF _lower !~ '^[a-z0-9_.]+$' THEN RETURN false; END IF;
  -- Reserved
  IF EXISTS (SELECT 1 FROM public.reserved_usernames WHERE username_lower = _lower) THEN
    RETURN false;
  END IF;
  -- Already taken (skip current user's own username)
  IF EXISTS (SELECT 1 FROM public.profiles WHERE username_lower = _lower
             AND id != COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'))
  THEN RETURN false; END IF;
  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.username_available(text) TO authenticated, anon;

-- ── 4. mark_profile_complete() — called after setup ──────────────
CREATE OR REPLACE FUNCTION public.mark_profile_complete(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE _p profiles%ROWTYPE;
BEGIN
  SELECT * INTO _p FROM public.profiles WHERE id = p_user_id;
  UPDATE public.profiles
    SET profile_complete = (
      COALESCE(length(_p.username), 0) >= 3 AND
      COALESCE(length(_p.bio), 0)      >= 10 AND
      _p.avatar_url IS NOT NULL
    ),
    updated_at = now()
  WHERE id = p_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_profile_complete(uuid) TO authenticated;

COMMIT;
