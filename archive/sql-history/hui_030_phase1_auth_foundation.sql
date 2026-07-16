-- ═══════════════════════════════════════════════════════════════
-- HUI PHASE 1 — AUTH & USER FOUNDATION
-- Migration: 030_phase1_auth_foundation.sql
--
-- Ergänzungen:
--   profiles: fehlende Spalten (username, member_since, trust_score, role)
--   RLS:      sichere Policies für profiles
--   Trigger:  auto-profile bei neuem Auth-User
--   Funktion: activate_membership() — atomare Rollen-Promotion
-- ═══════════════════════════════════════════════════════════════

-- ── profiles: alle Phase-1 Spalten sicherstellen ─────────────
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username       TEXT UNIQUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio            TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS interests      TEXT[] DEFAULT '{}'::text[];
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS skills         TEXT[] DEFAULT '{}'::text[];
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role           TEXT NOT NULL DEFAULT 'basis_user';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_member      BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS member_since   TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS trust_score    INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS reduced_reach_until TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_moderator   BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_impact_team BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_guardian    BOOLEAN NOT NULL DEFAULT false;

-- ── Bestehende 'basisuser' Rollen normalisieren ────────────────
UPDATE public.profiles
  SET role = 'basis_user'
  WHERE role = 'basisuser' OR role = '' OR role IS NULL;

-- ── RLS auf profiles sicherstellen ───────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- User sieht eigenes Profil (full access)
CREATE POLICY IF NOT EXISTS "profiles_own_all" ON public.profiles
  FOR ALL USING (auth.uid() = id);

-- Öffentliche Profile sind lesbar (für Discovery)
CREATE POLICY IF NOT EXISTS "profiles_public_read" ON public.profiles
  FOR SELECT USING (true);

-- Nur eigene Updates (RLS schützt fremde Profile)
CREATE POLICY IF NOT EXISTS "profiles_own_update" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- ── Auto-Profile Trigger: bei neuem Auth-User ─────────────────
-- Erstellt automatisch ein leeres Profil wenn sich jemand registriert
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, email, role, created_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    'basis_user',
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;  -- Sicher: kein Doppel-Insert
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: feuert nach jedem neuen Auth-User
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── activate_membership() Funktion (atomare DB-Operation) ─────
-- Wird von activateMembership() im Frontend aufgerufen (optional als RPC)
CREATE OR REPLACE FUNCTION public.activate_membership(user_id UUID)
RETURNS public.profiles AS $$
DECLARE
  updated_profile public.profiles;
BEGIN
  -- Sicherheit: Nur eigene Membership aktivieren
  IF auth.uid() != user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  UPDATE public.profiles
    SET
      is_member    = true,
      role         = 'member',
      member_since = NOW(),
      updated_at   = NOW()
    WHERE id = user_id
    RETURNING * INTO updated_profile;

  RETURN updated_profile;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── promote_to_talent() Funktion ──────────────────────────────
CREATE OR REPLACE FUNCTION public.promote_to_talent(user_id UUID)
RETURNS public.profiles AS $$
DECLARE
  updated_profile public.profiles;
BEGIN
  IF auth.uid() != user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  UPDATE public.profiles
    SET
      has_talent_profile = true,
      is_wirker          = true,
      role               = 'talent',
      updated_at         = NOW()
    WHERE id = user_id
    RETURNING * INTO updated_profile;

  RETURN updated_profile;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Kommentar ─────────────────────────────────────────────────
-- Diese Migration ist idempotent (IF NOT EXISTS, ON CONFLICT DO NOTHING).
-- Sicher auf bestehender DB auszuführen.
-- ═══════════════════════════════════════════════════════════════
