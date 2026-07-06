-- 20260706_067_geo_radius_search.sql
-- ═══════════════════════════════════════════════════════════════════
-- UMKREISSUCHE (2026-07-06, Lars) — Geo-Radius-Infrastruktur fuer die
-- GLOBALE Suche (Werke, Erlebnisse, Menschen/Wirker).
--
-- BESTANDSANALYSE (Governance-Pflicht):
-- Live gegen die Produktions-DB per PostgREST verifiziert (nicht vermutet):
--   - profiles/works/experiences hatten KEINE lat/lng-Spalten.
--   - Eine PARALLELE Session hat zwischenzeitlich (Commit 2916bf00,
--     "STANDORT-036") bereits echte Geo-Infrastruktur fuer Menschen/Talente
--     gebaut: neue Tabelle `profile_locations` (mehrere Standorte pro Profil,
--     bereits mit echten geocodeten Koordinaten befuellt), `talents.lat/lng`
--     (Talent-Angebote), src/lib/geocoding.js (Nominatim + Haversine).
--   -> Diese Migration DUPLIZIERT DAS NICHT. Sie ergaenzt gezielt nur, was
--      noch fehlt: lat/lng auf works/experiences (fuer die globale Suche
--      nach Werken/Erlebnissen in der Naehe) + eine nearby_wirker()-RPC,
--      die die BEREITS VORHANDENE profile_locations-Tabelle wiederverwendet
--      (kein zweites Standort-Datenmodell fuer Menschen).
--
-- ENTSCHEIDUNG: Haversine statt PostGIS (Verfuegbarkeit der Extension nicht
-- nachgewiesen -- kein Risiko einer ungeprueften Extension in Prod).
-- Serverseitig, indexiert, Distanz in km, sortiert.
-- ═══════════════════════════════════════════════════════════════════

-- ── 1) Haversine-Distanzfunktion (km) -- additiv, falls durch eine andere
--    Session noch nicht angelegt (CREATE OR REPLACE ist idempotent). ────
CREATE OR REPLACE FUNCTION public.haversine_km(
  lat1 double precision, lng1 double precision,
  lat2 double precision, lng2 double precision
) RETURNS double precision
LANGUAGE sql IMMUTABLE PARALLEL SAFE
AS $$
  SELECT 6371 * 2 * asin(sqrt(
    sin(radians(lat2 - lat1) / 2) ^ 2 +
    cos(radians(lat1)) * cos(radians(lat2)) * sin(radians(lng2 - lng1) / 2) ^ 2
  ));
$$;

-- ── 2) Lat/Lng fuer Werke + Erlebnisse -- additiv, nullable ─────────
-- (profiles/Menschen brauchen das NICHT -- dafuer existiert bereits
--  profile_locations aus STANDORT-036, siehe oben.)
ALTER TABLE public.works       ADD COLUMN IF NOT EXISTS lat double precision;
ALTER TABLE public.works       ADD COLUMN IF NOT EXISTS lng double precision;
ALTER TABLE public.experiences ADD COLUMN IF NOT EXISTS lat double precision;
ALTER TABLE public.experiences ADD COLUMN IF NOT EXISTS lng double precision;

COMMENT ON COLUMN public.works.lat       IS 'Umkreissuche 2026-07-06: Standort des Werks. Fehlt eine eigene Adresse, wird beim Speichern der Primaer-Standort des Erstellers (profile_locations) uebernommen.';
COMMENT ON COLUMN public.experiences.lat IS 'Umkreissuche 2026-07-06: Standort des Erlebnisses (aus location_text geocodet ueber src/lib/geocoding.js), nullable -- online-Erlebnisse bleiben ohne Koordinate.';

-- ── 3) Indexe fuer Bounding-Box-Vorfilter ────────────────────────────
CREATE INDEX IF NOT EXISTS idx_works_geo            ON public.works            (lat, lng) WHERE lat IS NOT NULL AND lng IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_experiences_geo       ON public.experiences      (lat, lng) WHERE lat IS NOT NULL AND lng IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profile_locations_geo ON public.profile_locations(lat, lng) WHERE lat IS NOT NULL AND lng IS NOT NULL;

-- ── 4) RPCs -- Bounding-Box-Vorfilter (nutzt Index) + exakte Haversine
--    + Sortierung nach Distanz + Limit. Werden vom Frontend NUR aufgerufen,
--    wenn ein konkreter Radius UND bekannte Nutzer-Koordinaten vorliegen --
--    "Weltweit" ruft diese RPCs gar nicht auf (bestehende unfilterte
--    Abfrage bleibt aktiv). ─────────────────────────────────────────────

-- Menschen/Wirker: wiederverwendet profile_locations (STANDORT-036) --
-- ein Profil "matched", wenn IRGENDEINER seiner Standorte im Radius liegt
-- (naechstgelegener wird als distance_km zurueckgegeben).
CREATE OR REPLACE FUNCTION public.nearby_wirker(
  p_lat double precision, p_lng double precision,
  p_radius_km double precision, p_limit int DEFAULT 60
) RETURNS TABLE(id uuid, distance_km double precision)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT p.id, MIN(public.haversine_km(p_lat, p_lng, pl.lat, pl.lng)) AS distance_km
  FROM profiles p
  JOIN profile_locations pl ON pl.profile_id = p.id
  WHERE p.has_talent_profile = true
    AND pl.lat IS NOT NULL AND pl.lng IS NOT NULL
    AND pl.lat BETWEEN p_lat - (p_radius_km / 111.32) AND p_lat + (p_radius_km / 111.32)
    AND pl.lng BETWEEN p_lng - (p_radius_km / (111.32 * cos(radians(p_lat)))) AND p_lng + (p_radius_km / (111.32 * cos(radians(p_lat))))
  GROUP BY p.id
  ORDER BY distance_km ASC
  LIMIT p_limit;
$$;

CREATE OR REPLACE FUNCTION public.nearby_works(
  p_lat double precision, p_lng double precision,
  p_radius_km double precision, p_limit int DEFAULT 60
) RETURNS TABLE(id uuid, distance_km double precision)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT w.id, public.haversine_km(p_lat, p_lng, w.lat, w.lng) AS distance_km
  FROM works w
  WHERE w.status = 'published' AND w.approval_status = 'approved'
    AND w.lat IS NOT NULL AND w.lng IS NOT NULL
    AND w.lat BETWEEN p_lat - (p_radius_km / 111.32) AND p_lat + (p_radius_km / 111.32)
    AND w.lng BETWEEN p_lng - (p_radius_km / (111.32 * cos(radians(p_lat)))) AND p_lng + (p_radius_km / (111.32 * cos(radians(p_lat))))
  ORDER BY public.haversine_km(p_lat, p_lng, w.lat, w.lng) ASC
  LIMIT p_limit;
$$;

CREATE OR REPLACE FUNCTION public.nearby_experiences(
  p_lat double precision, p_lng double precision,
  p_radius_km double precision, p_limit int DEFAULT 60
) RETURNS TABLE(id uuid, distance_km double precision)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT e.id, public.haversine_km(p_lat, p_lng, e.lat, e.lng) AS distance_km
  FROM experiences e
  WHERE e.status = 'published' AND e.approval_status = 'approved'
    AND e.lat IS NOT NULL AND e.lng IS NOT NULL
    AND e.lat BETWEEN p_lat - (p_radius_km / 111.32) AND p_lat + (p_radius_km / 111.32)
    AND e.lng BETWEEN p_lng - (p_radius_km / (111.32 * cos(radians(p_lat)))) AND p_lng + (p_radius_km / (111.32 * cos(radians(p_lat))))
  ORDER BY public.haversine_km(p_lat, p_lng, e.lat, e.lng) ASC
  LIMIT p_limit;
$$;

GRANT EXECUTE ON FUNCTION public.haversine_km(double precision,double precision,double precision,double precision) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.nearby_wirker(double precision,double precision,double precision,int)        TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.nearby_works(double precision,double precision,double precision,int)         TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.nearby_experiences(double precision,double precision,double precision,int)   TO anon, authenticated, service_role;
