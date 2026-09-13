-- 20260913_138_moment_multi_media.sql
-- MOMENT-MULTI-UPLOAD-001 (2026-09-13, Michael-Vorgabe: "mehrere Bilder
-- oder Videos hochladen, nicht nur eins").
--
-- ADDITIV, keine Breaking Changes:
--   - beitraege.src/type/thumbnail_url bleiben UNVERAENDERT die Quelle fuer
--     Einzel-Item-Momente (99% der Bestandsdaten + weiterhin der Normalfall
--     bei genau 1 Foto/Video) -- ALLE bestehenden Konsumenten (MomentsSection,
--     MeinMomenteDrawerContent, discover/MomenteSection, PostFullscreenView,
--     unifiedNormalizer-Single-Candidate-Loop) lesen weiterhin .src direkt,
--     OHNE Codeaenderung, OHNE Regression.
--   - media_urls (text[], NULL fuer Alt-Daten UND fuer neue Einzel-Item-
--     Momente) wird NUR gesetzt, wenn ein Moment TATSAECHLICH mehrere
--     Medien enthaelt (>=2). Der Client schreibt in diesem Fall ZUSAETZLICH
--     src = erstes Item (Rueckwaerts-Kompatibilitaet fuer Grid-Kacheln, die
--     nur .src lesen) UND media_urls = alle Items (fuer den Feed-Slider ---
--     system/feed/unifiedNormalizer.js liest media_urls bereits seit
--     VIDEO-POSTER-DROP-FIX/media_urls-Branch, der Kommentar dort nannte
--     "momente" bereits explizit als kuenftigen Nutzer dieser Spalte).
--
-- Naming konsistent mit impact_applications.media_urls (bereits bestehende
-- Supabase-Array-Spalte gleichen Zwecks, gleicher Typ text[]).
ALTER TABLE beitraege ADD COLUMN IF NOT EXISTS media_urls text[] NULL;

COMMENT ON COLUMN beitraege.media_urls IS
  'MOMENT-MULTI-UPLOAD-001: Nur gesetzt bei Momenten mit >=2 Medien-Items (alle URLs, Reihenfolge = Anzeige-Reihenfolge im Feed-Slider). NULL = Einzel-Item-Moment, src/type/thumbnail_url bleiben die einzige Quelle.';
