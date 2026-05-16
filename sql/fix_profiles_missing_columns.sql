-- HUI: Fehlende Spalten in profiles ergänzen
-- Einmalig im Supabase SQL Editor ausführen

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS talent          text,
  ADD COLUMN IF NOT EXISTS location_label  text,
  ADD COLUMN IF NOT EXISTS impact_eur      numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS followers_count integer        DEFAULT 0,
  ADD COLUMN IF NOT EXISTS profile_modules jsonb;

-- Optional: location_label mit location synchronisieren
UPDATE profiles SET location_label = location WHERE location_label IS NULL AND location IS NOT NULL;

-- Schema-Cache neu laden
NOTIFY pgrst, 'reload schema';

SELECT 'profiles schema fix done' AS status;
