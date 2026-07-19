-- 20260719_081_profiles_location_coords.sql
-- ═══════════════════════════════════════════════════════════════════
-- PROFIL-STANDORT-KOORDINATEN (2026-07-19)
-- Ergänzt profiles-Tabelle um location_lat / location_lng
-- damit der Primärstandort des Nutzers (aus ProfilBearbeitenModal)
-- direkt mit Geokoordinaten gespeichert wird.
-- ADDITIV — keine bestehenden Spalten werden verändert.
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS location_lat  double precision,
  ADD COLUMN IF NOT EXISTS location_lng  double precision;

COMMENT ON COLUMN public.profiles.location_lat IS 'Primärstandort-Koordinate (Latitude), gesetzt via Nominatim-Geocoding oder GPS beim Profilspeichern.';
COMMENT ON COLUMN public.profiles.location_lng IS 'Primärstandort-Koordinate (Longitude), gesetzt via Nominatim-Geocoding oder GPS beim Profilspeichern.';

-- Index für spätere Umkreissuche über Nutzer
CREATE INDEX IF NOT EXISTS idx_profiles_geo
  ON public.profiles (location_lat, location_lng)
  WHERE location_lat IS NOT NULL AND location_lng IS NOT NULL;
