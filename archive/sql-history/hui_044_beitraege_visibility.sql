-- ═══════════════════════════════════════════════════════════════
-- HUI Migration 044 — beitraege: visibility_scope Spalte
-- Erstellt: 2026-05-31
--
-- ZWECK:
--   Basis-User erstellen Momente die nur für Verbindungen sichtbar sind.
--   Talent-User erstellen Momente die öffentlich im Feed erscheinen.
--
-- NEUE SPALTE:
--   visibility_scope TEXT DEFAULT 'public'
--     'public'            → Feed + Entdecken + Talent-Netzwerk
--     'connections_only'  → Nur Verbindungen + Eigentümer
--
-- KEINE DATEN GEHEN VERLOREN.
-- Bestehende Einträge erhalten DEFAULT 'public'.
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE public.beitraege
  ADD COLUMN IF NOT EXISTS visibility_scope TEXT
    NOT NULL DEFAULT 'public'
    CHECK (visibility_scope IN ('public', 'connections_only'));

-- Index für performante Scope-Filter
CREATE INDEX IF NOT EXISTS idx_beitraege_scope
  ON public.beitraege (visibility_scope);

-- Schema reload
NOTIFY pgrst, 'reload schema';

-- VERIFY:
-- SELECT column_name, data_type, column_default
--   FROM information_schema.columns
--   WHERE table_name = 'beitraege' AND column_name = 'visibility_scope';
