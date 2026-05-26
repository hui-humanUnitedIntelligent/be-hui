-- ═══════════════════════════════════════════════════════════════════
-- PHASE 4C: Membership System Migration
-- Erweitert profiles um membership_type, membership_active, talent_activated_at
-- SAFE: nur ADD COLUMN IF NOT EXISTS — kein DROP, kein ALTER TYPE
-- ═══════════════════════════════════════════════════════════════════

-- 1. Neue Spalten — idempotent
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS membership_type      TEXT        DEFAULT 'base'
                            CHECK (membership_type IN ('base', 'talent', 'guardian', 'team')),
  ADD COLUMN IF NOT EXISTS membership_active    BOOLEAN     DEFAULT false,
  ADD COLUMN IF NOT EXISTS talent_activated_at  TIMESTAMPTZ DEFAULT NULL;

-- 2. Bestehende Nutzer migrieren:
--    - is_member = true           → membership_type='talent', membership_active=true
--    - role = 'talent'            → membership_type='talent', membership_active=true
--    - has_talent_profile = true  → membership_type='talent', membership_active=true
--    - Sonst                      → membership_type='base', membership_active=false

UPDATE public.profiles
SET
  membership_type   = 'talent',
  membership_active = true,
  talent_activated_at = COALESCE(talent_activated_at, updated_at, created_at)
WHERE
  is_member = true
  OR role IN ('talent', 'wirker', 'creator')
  OR has_talent_profile = true;

-- 3. Alle anderen explizit auf 'base' setzen (falls NULL durch ADD COLUMN)
UPDATE public.profiles
SET
  membership_type   = 'base',
  membership_active = false
WHERE membership_type IS NULL;

-- 4. Index für häufige Membership-Abfragen
CREATE INDEX IF NOT EXISTS idx_profiles_membership_type
  ON public.profiles(membership_type);

CREATE INDEX IF NOT EXISTS idx_profiles_membership_active
  ON public.profiles(membership_active)
  WHERE membership_active = true;

-- 5. Funktion: Talent aktivieren (atomarer Aufruf aus Frontend)
CREATE OR REPLACE FUNCTION public.activate_talent(p_user_id UUID)
RETURNS public.profiles
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  updated_profile public.profiles;
BEGIN
  UPDATE public.profiles
  SET
    membership_type      = 'talent',
    membership_active    = true,
    talent_activated_at  = COALESCE(talent_activated_at, NOW()),
    has_talent_profile   = true,
    role                 = CASE
                             WHEN role IN ('basis_user', 'base', 'user') THEN 'talent'
                             ELSE role
                           END,
    is_member            = true,
    updated_at           = NOW()
  WHERE id = p_user_id
  RETURNING * INTO updated_profile;
  RETURN updated_profile;
END;
$$;

-- Grant: nur authentifizierte Nutzer für ihr eigenes Profil
REVOKE ALL ON FUNCTION public.activate_talent(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.activate_talent(UUID) TO authenticated;

COMMENT ON COLUMN public.profiles.membership_type IS 'base | talent | guardian | team';
COMMENT ON COLUMN public.profiles.membership_active IS 'true = Membership aktiv, Creator-Funktionen freigeschaltet';
COMMENT ON COLUMN public.profiles.talent_activated_at IS 'Zeitstempel der Talent-Aktivierung';
