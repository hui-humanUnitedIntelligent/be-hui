-- ═══════════════════════════════════════════════════════════════════
-- Migration: 20260820_122_talents_recurring_frei.sql
-- FREIE-BUCHUNG-001 Nachtrag (2026-08-20, Michael-Screenshot):
-- Beim Speichern eines Talent-Angebots mit recurring="frei" (Option
-- "Freie Buchung", siehe TalentAngebotWizard.jsx / useTalents.js
-- TALENT_RECURRING_OPTIONS) schlug der INSERT/UPDATE mit
-- "new row for relation talents violates check constraint
-- talents_recurring_check" fehl (400 Bad Request via PostgREST).
--
-- Root Cause: talents_recurring_check erlaubte nur ARRAY['weekly',
-- 'monthly'] -- der Wert 'frei' wurde bei Einfuehrung der Option im
-- Frontend nicht in die DB-Constraint uebernommen. 'Einmalig' (Wert ""
-- im Frontend) wird bereits vorher zu NULL normalisiert
-- (recurring: recurring || null) und war daher nie betroffen.
--
-- Additiv (PRINZIP 5 Datenmigrations-Regel) -- erweitert nur die
-- erlaubten Werte der bestehenden Spalte, keine Struktur-Aenderung.
-- Verifiziert 2026-08-20 gegen die live talents-Tabelle:
-- pg_get_constraintdef vor dieser Migration = 
-- "CHECK ((recurring = ANY (ARRAY['weekly'::text, 'monthly'::text])))"
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE public.talents
  DROP CONSTRAINT IF EXISTS talents_recurring_check;

ALTER TABLE public.talents
  ADD CONSTRAINT talents_recurring_check
  CHECK (recurring = ANY (ARRAY['weekly'::text, 'monthly'::text, 'frei'::text]));

COMMENT ON CONSTRAINT talents_recurring_check ON public.talents IS
  'Erlaubte Werte fuer wiederkehrende Buchungsart: weekly, monthly, frei (Kunde waehlt Wunschdatum selbst). NULL = einmalig/kein Wiederholungsmuster.';
