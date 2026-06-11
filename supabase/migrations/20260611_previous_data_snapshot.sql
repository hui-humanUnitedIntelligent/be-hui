-- Migration: 20260611_previous_data_snapshot.sql
-- Zweck: Snapshot der genehmigten Felder vor einem Nutzer-Update
-- Regel: ERWEITERUNG - kein bestehendes Feld wird geändert

-- works: previous_data JSONB
ALTER TABLE public.works
  ADD COLUMN IF NOT EXISTS previous_data JSONB DEFAULT NULL;

COMMENT ON COLUMN public.works.previous_data IS
  'Snapshot der Felder (title, description, category, price, images, tags, location_text) '
  'aus der zuletzt genehmigten Version — wird beim Update-Submit gesetzt, '
  'für Admin-Diff-Anzeige verwendet, nur lesend im Dashboard genutzt.';

-- experiences: previous_data JSONB
ALTER TABLE public.experiences
  ADD COLUMN IF NOT EXISTS previous_data JSONB DEFAULT NULL;

COMMENT ON COLUMN public.experiences.previous_data IS
  'Snapshot der Felder (title, description, category, price, images, location_text, date) '
  'aus der zuletzt genehmigten Version — wird beim Update-Submit gesetzt, '
  'für Admin-Diff-Anzeige verwendet, nur lesend im Dashboard genutzt.';

-- projects: previous_data JSONB (falls Tabelle existiert)
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS previous_data JSONB DEFAULT NULL;

COMMENT ON COLUMN public.projects.previous_data IS
  'Snapshot der Felder aus der zuletzt genehmigten Version — für Admin-Diff-Anzeige.';
