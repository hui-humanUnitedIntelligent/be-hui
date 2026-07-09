-- ══════════════════════════════════════════════════════════════════
-- Migration 074 — DEEPLINK.1 (2026-07-09)
-- Stabile, sprechende Deep-Link-Adressen fuer Werke + Wirker-Profile.
--
-- Bestandsanalyse: `works` hatte bisher KEINE slug-Spalte (nur
-- `wirker_profiles.slug` existierte bereits). `profiles.username` wird
-- beim Signup aktuell fest auf NULL gesetzt (AuthContext.jsx) und nie
-- automatisch nachgezogen -- bestaetigte Luecke, kein Vermuten.
--
-- Diese Migration ist rein additiv:
--   • neue Spalte works.slug (nullable, wird per Trigger befuellt)
--   • Trigger fuer beide Tabellen: generiert Slug/Username automatisch
--     NUR wenn er fehlt -- bestehende, bereits gesetzte Werte werden
--     nie ueberschrieben.
--   • Backfill fuer alle bereits vorhandenen Zeilen ohne Slug/Username.
--   • Unique-Indizes zur Kollisionsvermeidung.
-- Keine bestehende Query/Spalte wird veraendert oder entfernt.
-- ══════════════════════════════════════════════════════════════════

-- ── Gemeinsame Slugify-Hilfsfunktion ────────────────────────────────
CREATE OR REPLACE FUNCTION hui_slugify(input text)
RETURNS text AS $$
  SELECT trim(both '-' from regexp_replace(lower(coalesce(input,'')), '[^a-z0-9]+', '-', 'g'));
$$ LANGUAGE sql IMMUTABLE;

-- ══════════════════════════════════════════════════════════════════
-- WERKE — works.slug
-- ══════════════════════════════════════════════════════════════════
ALTER TABLE works ADD COLUMN IF NOT EXISTS slug text;

CREATE OR REPLACE FUNCTION hui_works_set_slug()
RETURNS trigger AS $$
DECLARE
  base_slug text;
  candidate  text;
  suffix     int := 0;
BEGIN
  IF NEW.slug IS NOT NULL AND NEW.slug <> '' THEN
    RETURN NEW;
  END IF;
  base_slug := hui_slugify(NEW.title);
  IF base_slug = '' THEN base_slug := 'werk'; END IF;
  candidate := base_slug;
  WHILE EXISTS (SELECT 1 FROM works WHERE slug = candidate AND id <> NEW.id) LOOP
    suffix := suffix + 1;
    candidate := base_slug || '-' || suffix;
  END LOOP;
  NEW.slug := candidate;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_works_set_slug ON works;
CREATE TRIGGER trg_works_set_slug
  BEFORE INSERT OR UPDATE ON works
  FOR EACH ROW EXECUTE FUNCTION hui_works_set_slug();

-- Backfill bestehender Werke ohne Slug (Zeile fuer Zeile, dedup gegen
-- die gesamte Tabelle inkl. bereits in diesem Lauf vergebener Slugs).
DO $$
DECLARE
  r RECORD;
  base_slug text;
  candidate text;
  suffix int;
BEGIN
  FOR r IN SELECT id, title FROM works WHERE slug IS NULL OR slug = '' LOOP
    base_slug := hui_slugify(r.title);
    IF base_slug = '' THEN base_slug := 'werk'; END IF;
    candidate := base_slug;
    suffix := 0;
    WHILE EXISTS (SELECT 1 FROM works WHERE slug = candidate) LOOP
      suffix := suffix + 1;
      candidate := base_slug || '-' || suffix;
    END LOOP;
    UPDATE works SET slug = candidate WHERE id = r.id;
  END LOOP;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_works_slug_unique ON works(slug) WHERE slug IS NOT NULL;

-- ══════════════════════════════════════════════════════════════════
-- PROFILE — profiles.username (bestehende Spalte, bisher oft NULL)
-- ══════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION hui_profiles_set_username()
RETURNS trigger AS $$
DECLARE
  base_u text;
  candidate text;
  suffix int := 0;
BEGIN
  IF NEW.username IS NOT NULL AND NEW.username <> '' THEN
    RETURN NEW;
  END IF;
  base_u := hui_slugify(COALESCE(NEW.display_name, NEW.full_name, 'mitglied'));
  IF base_u = '' THEN base_u := 'mitglied'; END IF;
  candidate := base_u;
  WHILE EXISTS (SELECT 1 FROM profiles WHERE username = candidate AND id <> NEW.id) LOOP
    suffix := suffix + 1;
    candidate := base_u || suffix;
  END LOOP;
  NEW.username := candidate;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_profiles_set_username ON profiles;
CREATE TRIGGER trg_profiles_set_username
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION hui_profiles_set_username();

-- Backfill bestehender Profile ohne Username.
DO $$
DECLARE
  r RECORD;
  base_u text;
  candidate text;
  suffix int;
BEGIN
  FOR r IN SELECT id, display_name, full_name FROM profiles WHERE username IS NULL OR username = '' LOOP
    base_u := hui_slugify(COALESCE(r.display_name, r.full_name, 'mitglied'));
    IF base_u = '' THEN base_u := 'mitglied'; END IF;
    candidate := base_u;
    suffix := 0;
    WHILE EXISTS (SELECT 1 FROM profiles WHERE username = candidate) LOOP
      suffix := suffix + 1;
      candidate := base_u || suffix;
    END LOOP;
    UPDATE profiles SET username = candidate WHERE id = r.id;
  END LOOP;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username_unique ON profiles(username) WHERE username IS NOT NULL;
