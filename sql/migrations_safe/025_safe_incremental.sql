-- ═══════════════════════════════════════════════════════════════════
-- HUI 025 — SAFE INCREMENTAL MIGRATION
-- Datum: 2026-05-16
--
-- NUR ADDITIVE ÄNDERUNGEN:
--   • Keine DROP TABLE
--   • Keine RLS-Rewrites
--   • Keine Massenänderungen
--   • Nur ADD COLUMN IF NOT EXISTS
-- ═══════════════════════════════════════════════════════════════════

-- FIX 1: works.location_text fehlt (Frontend fragt diese Spalte ab)
ALTER TABLE public.works
  ADD COLUMN IF NOT EXISTS location_text text;

-- FIX 2: experiences.location_text fehlt (DiscoveryFeed query)
ALTER TABLE public.experiences
  ADD COLUMN IF NOT EXISTS location_text text;

-- Schema-Cache aktualisieren
NOTIFY pgrst, 'reload schema';

-- Verifikation
SELECT
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema='public' AND table_name='works'
     AND column_name='location_text') AS works_location_text_exists,
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema='public' AND table_name='experiences'
     AND column_name='location_text') AS exp_location_text_exists;
-- Erwartung: beide = 1
