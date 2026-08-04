-- Migration: Fehlende Foreign Keys auf impact_votes nachgezogen
-- Root Cause für F12 400-Fehler in MeineResonanz.jsx:
-- impact_votes.voter_id und impact_votes.project_id hatten KEINE FK-Constraints.
-- PostgREST kann ohne erkennbare FK-Beziehung keinen Embed-Join
-- (impact_applications(...)) auflösen -> 400 Bad Request.
--
-- Verifiziert vor Migration: 0 orphaned voter_id, 0 orphaned project_id
-- (Stand 2026-08-04, 2 Zeilen in impact_votes, Backup: backup_20260804_impact_votes)

ALTER TABLE public.impact_votes
  ADD CONSTRAINT impact_votes_voter_id_fkey
  FOREIGN KEY (voter_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.impact_votes
  ADD CONSTRAINT impact_votes_project_id_fkey
  FOREIGN KEY (project_id) REFERENCES public.impact_applications(id) ON DELETE CASCADE;
