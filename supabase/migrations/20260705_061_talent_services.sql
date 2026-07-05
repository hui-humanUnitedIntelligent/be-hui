-- Migration: Talente mit Dienstleistungen (HUI-Norm) — additive Erweiterung von public.talents
-- Master-Prompt 2026-07-05: Preis/Ort/Zeit/Kapazitaet-Felder fuer echte Dienstleistungsangebote
-- (Yoga, Toepfern, Coaching etc.). KEINE bestehende Spalte/Policy/Trigger wird veraendert oder
-- geloescht — reine ADD COLUMN-Migration. Bestehende Zeilen (title/category/description/images/
-- status-Workflow) bleiben unangetastet und funktionsfaehig wie zuvor.
--
-- WICHTIG (bereits durch bestehende RLS aus 20260704_060 abgedeckt, keine Aenderung noetig):
-- "Preis wird erst nach Admin-Freigabe oeffentlich sichtbar" — die Policy "talents_visible_
-- approved_or_own" zeigt die GESAMTE Zeile (also auch alle neuen Felder wie price_per_hour)
-- nur wenn status='approved' ODER es die eigene Zeile ist. Kein Sonderfall fuer einzelne
-- Spalten noetig, das gilt automatisch fuer alle neuen Felder mit.

ALTER TABLE public.talents
  ADD COLUMN IF NOT EXISTS price_per_hour     numeric(10,2),
  ADD COLUMN IF NOT EXISTS price_per_session  numeric(10,2),
  ADD COLUMN IF NOT EXISTS currency           text NOT NULL DEFAULT 'EUR',
  ADD COLUMN IF NOT EXISTS location_type      text CHECK (location_type IN ('online','vor_ort','hybrid')),
  ADD COLUMN IF NOT EXISTS location_address   text,
  ADD COLUMN IF NOT EXISTS location_notes     text,
  ADD COLUMN IF NOT EXISTS map_link           text,
  ADD COLUMN IF NOT EXISTS available_dates      jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS available_time_slots jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS recurring             text CHECK (recurring IN ('weekly','monthly')),
  ADD COLUMN IF NOT EXISTS duration_minutes       integer,
  ADD COLUMN IF NOT EXISTS max_participants     integer,
  ADD COLUMN IF NOT EXISTS min_participants     integer,
  ADD COLUMN IF NOT EXISTS booking_type         text NOT NULL DEFAULT 'einzel',
  ADD COLUMN IF NOT EXISTS booking_window_start date,
  ADD COLUMN IF NOT EXISTS booking_window_end   date;

ALTER TABLE public.talents
  DROP CONSTRAINT IF EXISTS talents_booking_type_check,
  ADD CONSTRAINT talents_booking_type_check CHECK (booking_type IN ('einzel','gruppe'));

ALTER TABLE public.talents
  DROP CONSTRAINT IF EXISTS talents_price_nonneg,
  ADD CONSTRAINT talents_price_nonneg
    CHECK (
      (price_per_hour IS NULL OR price_per_hour >= 0) AND
      (price_per_session IS NULL OR price_per_session >= 0)
    );

ALTER TABLE public.talents
  DROP CONSTRAINT IF EXISTS talents_participants_nonneg,
  ADD CONSTRAINT talents_participants_nonneg
    CHECK (
      (max_participants IS NULL OR max_participants >= 1) AND
      (min_participants IS NULL OR min_participants >= 1) AND
      (max_participants IS NULL OR min_participants IS NULL OR min_participants <= max_participants)
    );

ALTER TABLE public.talents
  DROP CONSTRAINT IF EXISTS talents_booking_window_valid,
  ADD CONSTRAINT talents_booking_window_valid
    CHECK (
      booking_window_start IS NULL OR booking_window_end IS NULL OR booking_window_start <= booking_window_end
    );

COMMENT ON COLUMN public.talents.price_per_hour IS 'Dienstleistungs-Stundensatz. Oeffentlich erst sichtbar wenn status=approved (via bestehende RLS-Policy).';
COMMENT ON COLUMN public.talents.booking_type IS 'einzel = Einzelbuchung, gruppe = Gruppenbuchung (max_participants greift dann).';
