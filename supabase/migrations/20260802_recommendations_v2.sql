-- 20260802_recommendations_v2.sql
-- Empfehlungs-Feature: order_id + recommendation_reports Tabelle
-- Nur Nutzer die etwas gekauft/gebucht haben können empfehlen (App-Logik)
-- Nur der Empfänger (to_user_id) kann eine Empfehlung melden

-- 1. order_id zu recommendations hinzufügen (für Werk-Käufe)
ALTER TABLE recommendations ADD COLUMN IF NOT EXISTS order_id UUID;

-- 1b. deleted_at für Soft-Delete (SADB kann Empfehlung löschen)
ALTER TABLE recommendations ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- 2. recommendation_reports Tabelle
CREATE TABLE IF NOT EXISTS recommendation_reports (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recommendation_id   UUID NOT NULL REFERENCES recommendations(id) ON DELETE CASCADE,
  reporter_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  offender_id        UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  message             TEXT DEFAULT '',
  reason              TEXT DEFAULT '',
  status              TEXT DEFAULT 'new',
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);

-- updated_at Trigger (kanonisch)
CREATE OR REPLACE TRIGGER trg_recommendation_reports_updated_at
  BEFORE UPDATE ON recommendation_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 3. RLS
ALTER TABLE recommendation_reports ENABLE ROW LEVEL SECURITY;

-- INSERT: Nur der Empfänger der Empfehlung (to_user_id) darf melden
DROP POLICY IF EXISTS "rec_reports_insert_by_recipient" ON recommendation_reports;
CREATE POLICY "rec_reports_insert_by_recipient" ON recommendation_reports
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM recommendations r
      WHERE r.id = recommendation_id
      AND r.to_user_id = auth.uid()
    )
  );

-- SELECT: Nur service_role (SADB) — User dürfen nicht lesen
DROP POLICY IF EXISTS "rec_reports_read_admin" ON recommendation_reports;
CREATE POLICY "rec_reports_read_admin" ON recommendation_reports
  FOR SELECT USING (false);

-- UPDATE: Nur service_role (SADB)
DROP POLICY IF EXISTS "rec_reports_update_admin" ON recommendation_reports;
CREATE POLICY "rec_reports_update_admin" ON recommendation_reports
  FOR UPDATE USING (false);

-- 4. Index
CREATE INDEX IF NOT EXISTS idx_rec_reports_status ON recommendation_reports(status);
CREATE INDEX IF NOT EXISTS idx_rec_reports_recommendation_id ON recommendation_reports(recommendation_id);
