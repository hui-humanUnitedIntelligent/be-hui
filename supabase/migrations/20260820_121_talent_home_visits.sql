-- ═══════════════════════════════════════════════════════════════════
-- Migration: 20260820_121_talent_home_visits.sql
-- HAUSBESUCHE + AKTIONSRADIUS für Talent-Angebote (Michael-Feedback
-- 2026-08-20): "wenn das Talent zu jemanden geht, dann soll die Funktion
-- 'Hausbesuche' erscheinen und ein Radius wie weit er sein Talent
-- anbietet, z.B. ein Sänger."
--
-- Additiv (PRINZIP 5 Datenmigrations-Regel) -- keine bestehende Spalte
-- wird veraendert/entfernt. Verifiziert 2026-08-20 gegen die live
-- talents-Tabelle: offers_home_visits + home_visit_radius_km existierten
-- noch nicht (information_schema-Check vor dieser Migration).
--
-- offers_home_visits: Talent bietet an, zum Kunden zu kommen (z.B.
--   Sänger tritt bei Feiern vor Ort auf, statt dass der Kunde zu einem
--   festen Studio/einer festen Adresse kommt).
-- home_visit_radius_km: wie viele Kilometer das Talent von seinem
--   Standort (talents.lat/lng bzw. location_address) aus bereit ist zu
--   reisen. NULL = kein Limit angegeben.
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE public.talents
  ADD COLUMN IF NOT EXISTS offers_home_visits BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS home_visit_radius_km NUMERIC;

COMMENT ON COLUMN public.talents.offers_home_visits IS
  'Talent bietet Hausbesuche an (kommt zum Kunden statt fester Adresse).';
COMMENT ON COLUMN public.talents.home_visit_radius_km IS
  'Aktionsradius in km, in dem das Talent Hausbesuche anbietet (NULL = kein Limit angegeben).';
