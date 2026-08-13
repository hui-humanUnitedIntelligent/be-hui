-- Migration 110: profiles.locale — Nutzer-Spracheinstellung
-- Erlaubt jedem Nutzer seine eigene App-Sprache zu speichern

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS locale TEXT DEFAULT NULL;

-- Kommentar
COMMENT ON COLUMN profiles.locale IS 'App-Spracheinstellung des Nutzers (de, en, fr, es, it, el, tr). NULL = Systemsprache des Geräts verwenden.';

-- RLS: Nur der Nutzer selbst kann sein locale lesen/schreiben
-- (bestehende RLS-Policies decken das bereits ab, da locale ein normales Profil-Feld ist)
