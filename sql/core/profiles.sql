-- ════════════════════════════════════════════════
-- HUI CORE: profiles
-- Zweck: Basis-Nutzerprofile (AUTO-angelegt via Trigger)
-- Additive-only: nur ADD COLUMN IF NOT EXISTS
-- ════════════════════════════════════════════════

-- Fehlende Spalten ergänzen (idempotent)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS display_name       text    DEFAULT '',
  ADD COLUMN IF NOT EXISTS username           text,
  ADD COLUMN IF NOT EXISTS avatar_url         text,
  ADD COLUMN IF NOT EXISTS header_img         text,
  ADD COLUMN IF NOT EXISTS bio                text,
  ADD COLUMN IF NOT EXISTS role               text    DEFAULT 'basisuser',
  ADD COLUMN IF NOT EXISTS membership_type    text    DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS is_wirker          boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_talent_profile boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS talent             text,
  ADD COLUMN IF NOT EXISTS location           text,
  ADD COLUMN IF NOT EXISTS focus_type         text,
  ADD COLUMN IF NOT EXISTS is_available       boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS impact_eur         numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS followers_count    integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS dna_tags           text[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS profile_modules    jsonb   DEFAULT '{}';

-- Auto-Profil bei neuem Auth-User
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'username',
             split_part(COALESCE(NEW.email,'user'),'@',1))
  ) ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

NOTIFY pgrst, 'reload schema';
