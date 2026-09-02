-- ═════════════════════════════════════════════════════════════════
-- HUI Startphase — Bewerbungen (Migration 134)
-- 2026-09-02
-- ═════════════════════════════════════════════════════════════════

-- 1. Haupttabelle: startphase_applications
CREATE TABLE IF NOT EXISTS startphase_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Persönliche Angaben
  first_name    TEXT NOT NULL,
  last_name     TEXT NOT NULL,
  email         TEXT NOT NULL,
  country_region TEXT,
  current_role  TEXT,
  about_you     TEXT,

  -- Was möchtest du zu HUI mitbringen? (Mehrfachauswahl als JSON-Array)
  contributions JSONB DEFAULT '[]'::jsonb,

  -- Was kannst du besonders gut?
  skills        TEXT,

  -- Was möchtest du mit HUI möglich machen? (Projekt-Informationen)
  project_name       TEXT,
  project_offering   TEXT,
  project_audience   TEXT,
  project_impact     TEXT,
  project_needs      TEXT,
  project_missing    TEXT,

  -- Pionier-Interesse
  pioneer_reason       TEXT,
  pioneer_wishes       JSONB DEFAULT '[]'::jsonb,
  pioneer_first_action TEXT,

  -- Abschlussfragen
  why_hui         TEXT,
  what_contribute TEXT,

  -- Consent
  consent_accepted BOOLEAN NOT NULL DEFAULT false,

  -- Status
  status TEXT NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'reviewing', 'query', 'accepted', 'not_selected', 'completed')),

  -- Admin-Felder
  admin_notes     TEXT,
  reviewed_by     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at     TIMESTAMPTZ,

  -- Timestamps
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Kommunikationshistorie: startphase_communications
CREATE TABLE IF NOT EXISTS startphase_communications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID NOT NULL REFERENCES startphase_applications(id) ON DELETE CASCADE,
  admin_id       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  admin_name     TEXT,
  direction      TEXT NOT NULL DEFAULT 'outbound'
    CHECK (direction IN ('outbound', 'inbound', 'note')),
  subject        TEXT,
  message_body   TEXT NOT NULL,
  sent_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Indizes
CREATE INDEX IF NOT EXISTS idx_startphase_applications_status ON startphase_applications(status);
CREATE INDEX IF NOT EXISTS idx_startphase_applications_email ON startphase_applications(email);
CREATE INDEX IF NOT EXISTS idx_startphase_applications_created ON startphase_applications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_startphase_communications_app ON startphase_communications(application_id, sent_at DESC);

-- 4. Row Level Security
ALTER TABLE startphase_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE startphase_communications ENABLE ROW LEVEL SECURITY;

-- 4a. Public INSERT (Bewerbung abgeben)
DROP POLICY IF EXISTS "Public can submit startphase applications" ON startphase_applications;
CREATE POLICY "Public can submit startphase applications"
  ON startphase_applications FOR INSERT WITH CHECK (true);

-- 4b. Admin SELECT
DROP POLICY IF EXISTS "Admins can read startphase applications" ON startphase_applications;
CREATE POLICY "Admins can read startphase applications"
  ON startphase_applications FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'superadmin', 'super_admin', 'employee')));

-- 4c. Admin UPDATE
DROP POLICY IF EXISTS "Admins can update startphase applications" ON startphase_applications;
CREATE POLICY "Admins can update startphase applications"
  ON startphase_applications FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'superadmin', 'super_admin', 'employee')));

-- 4d. Admin DELETE
DROP POLICY IF EXISTS "Admins can delete startphase applications" ON startphase_applications;
CREATE POLICY "Admins can delete startphase applications"
  ON startphase_applications FOR DELETE
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'superadmin', 'super_admin', 'employee')));

-- 4e. Communications: Admin SELECT
DROP POLICY IF EXISTS "Admins can read startphase communications" ON startphase_communications;
CREATE POLICY "Admins can read startphase communications"
  ON startphase_communications FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'superadmin', 'super_admin', 'employee')));

-- 4f. Communications: Admin INSERT
DROP POLICY IF EXISTS "Admins can insert startphase communications" ON startphase_communications;
CREATE POLICY "Admins can insert startphase communications"
  ON startphase_communications FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'superadmin', 'super_admin', 'employee')));

-- 5. updated_at Trigger
CREATE OR REPLACE FUNCTION update_startphase_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_startphase_applications_updated ON startphase_applications;
CREATE TRIGGER trg_startphase_applications_updated
  BEFORE UPDATE ON startphase_applications
  FOR EACH ROW EXECUTE FUNCTION update_startphase_updated_at();
