-- HUI Migration: Talent Profile System
-- Ersetzt is_wirker + role durch has_talent_profile + profile_modules

-- 1. Neue Spalten zu profiles hinzufügen
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS has_talent_profile  BOOLEAN   DEFAULT false,
  ADD COLUMN IF NOT EXISTS talent_title         TEXT,
  ADD COLUMN IF NOT EXISTS talent_description   TEXT,
  ADD COLUMN IF NOT EXISTS talent_categories    TEXT[]    DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS talent_location      TEXT,
  ADD COLUMN IF NOT EXISTS talent_tags          TEXT[]    DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS profile_modules      JSONB     DEFAULT '{"works":false,"services":false,"experiences":false,"workshops":false,"coaching":false,"events":false,"shop":false,"impact":false}'::jsonb,
  ADD COLUMN IF NOT EXISTS talent_offer_types   TEXT[]    DEFAULT '{}';

-- 2. Bestehende is_wirker=true User migrieren
UPDATE public.profiles
SET
  has_talent_profile = true,
  profile_modules = '{"works":true,"services":true,"experiences":false,"workshops":false,"coaching":false,"events":false,"shop":false,"impact":true}'::jsonb
WHERE is_wirker = true;

-- 3. Index für schnelle Abfragen
CREATE INDEX IF NOT EXISTS idx_profiles_has_talent ON public.profiles(has_talent_profile);

-- 4. RLS Policy für profile_modules (eigenes Profil updaten)
DROP POLICY IF EXISTS "Users can update own profile modules" ON public.profiles;
CREATE POLICY "Users can update own profile modules"
  ON public.profiles FOR UPDATE
  USING (auth.uid()::text = id::text);

-- Verify
SELECT id, username, has_talent_profile, profile_modules
FROM public.profiles
LIMIT 5;
