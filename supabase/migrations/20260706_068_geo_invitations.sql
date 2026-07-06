-- 20260706_068_geo_invitations.sql
-- ═══════════════════════════════════════════════════════════════════
-- UMKREISSUCHE — Erweiterung auf "Veranstaltungen" (invitations)
-- (2026-07-06, Lars-Ticket "Radius-Buttons vollstaendig implementieren")
--
-- BESTANDSANALYSE (Governance-Pflicht):
--   - invitations hatte bereits `location` + `city` (Freitext), aber KEINE
--     lat/lng -- exakt derselbe Ausgangszustand wie works/experiences vor
--     Migration 067.
--   - Kein neues Geo-System: wiederverwendet dieselbe haversine_km()-Funktion
--     aus Migration 067 (CREATE OR REPLACE ist idempotent, kein Duplikat).
--   - Gleiches RPC-Muster (Bounding-Box-Vorfilter + Haversine + Sortierung)
--     wie nearby_works()/nearby_experiences().
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE public.invitations ADD COLUMN IF NOT EXISTS lat double precision;
ALTER TABLE public.invitations ADD COLUMN IF NOT EXISTS lng double precision;

COMMENT ON COLUMN public.invitations.lat IS 'Umkreissuche 2026-07-06 (068): aus location/city geocodet ueber src/lib/geocoding.js beim Erstellen, nullable.';

CREATE INDEX IF NOT EXISTS idx_invitations_geo ON public.invitations (lat, lng) WHERE lat IS NOT NULL AND lng IS NOT NULL;

CREATE OR REPLACE FUNCTION public.nearby_invitations(
  p_lat double precision, p_lng double precision,
  p_radius_km double precision, p_limit int DEFAULT 60
) RETURNS TABLE(id uuid, distance_km double precision)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT i.id, public.haversine_km(p_lat, p_lng, i.lat, i.lng) AS distance_km
  FROM invitations i
  WHERE i.status = 'active' AND i.visibility = 'public'
    AND i.expires_at > now()
    AND i.lat IS NOT NULL AND i.lng IS NOT NULL
    AND i.lat BETWEEN p_lat - (p_radius_km / 111.32) AND p_lat + (p_radius_km / 111.32)
    AND i.lng BETWEEN p_lng - (p_radius_km / (111.32 * cos(radians(p_lat)))) AND p_lng + (p_radius_km / (111.32 * cos(radians(p_lat))))
  ORDER BY public.haversine_km(p_lat, p_lng, i.lat, i.lng) ASC
  LIMIT p_limit;
$$;

GRANT EXECUTE ON FUNCTION public.nearby_invitations(double precision,double precision,double precision,int) TO anon, authenticated, service_role;
