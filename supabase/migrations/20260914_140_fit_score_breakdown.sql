-- 20260914_140_fit_score_breakdown.sql
-- HUI-FIT-SCORE-V2 (2026-09-14): Score + Breakdown des Bewerbungsassistenten
-- mit in impact_applications speichern, damit SADB-Admins nachvollziehen
-- koennen, WARUM ein Projekt akzeptiert/manuell geprueft wurde.
-- Additiv, NULL-able, kein Default — alte Projekte bleiben unberuehrt.
ALTER TABLE public.impact_applications
  ADD COLUMN IF NOT EXISTS fit_score integer,
  ADD COLUMN IF NOT EXISTS score_breakdown jsonb;
