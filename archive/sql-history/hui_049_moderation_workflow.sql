-- ═══════════════════════════════════════════════════════════════
-- HUI Migration 049 — Moderations-Workflow: Felder + Notifications
-- Datum: 2026-06-09
-- IDEMPOTENT — alle Statements IF NOT EXISTS
--
-- WIEDERVERWENDUNG (keine neuen Tabellen!):
--   works.status        bereits vorhanden (pending_review, published, draft)
--   experiences.status  bereits vorhanden (pending_review, published, draft)
--   notifications       bereits vorhanden (user_id, type, title, body, ...)
--
-- NEU (nur fehlende Felder):
--   works.admin_comment        — Admin-Kommentar sichtbar für Talent
--   works.rejection_reason     — Ablehnungsgrund sichtbar für Talent
--   works.reviewed_at          — Zeitstempel der Prüfung
--   works.reviewed_by          — Admin-ID
--   experiences.admin_comment
--   experiences.rejection_reason
--   experiences.reviewed_at
--   experiences.reviewed_by
--
-- notifications: neue Typen via INSERT (keine Schema-Änderung nötig)
-- ═══════════════════════════════════════════════════════════════

-- ── 1. works: Moderations-Felder ──────────────────────────────
ALTER TABLE public.works
  ADD COLUMN IF NOT EXISTS admin_comment     TEXT,
  ADD COLUMN IF NOT EXISTS rejection_reason  TEXT,
  ADD COLUMN IF NOT EXISTS reviewed_at       TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reviewed_by       UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- works.status sicherstellen (DEFAULT pending_review für neue Einreichungen)
-- KEIN ALTER DEFAULT — bricht bestehende Werke nicht

-- ── 2. experiences: Moderations-Felder ────────────────────────
ALTER TABLE public.experiences
  ADD COLUMN IF NOT EXISTS admin_comment     TEXT,
  ADD COLUMN IF NOT EXISTS rejection_reason  TEXT,
  ADD COLUMN IF NOT EXISTS reviewed_at       TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reviewed_by       UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- ── 3. works RLS: Owner sieht eigene Einträge unabhängig von Status ──
-- Bestehende Policy works_public_read bleibt (nur published+public für alle)
-- Neue Policy: Eigentümer sieht immer alle eigenen Werke
DROP POLICY IF EXISTS "works_owner_read"    ON public.works;
CREATE POLICY "works_owner_read" ON public.works
  FOR SELECT USING (
    auth.uid() = user_id
    OR auth.uid() = creator_id
  );

-- ── 4. experiences RLS: Owner sieht eigene ────────────────────
DROP POLICY IF EXISTS "experiences_owner_read" ON public.experiences;
CREATE POLICY "experiences_owner_read" ON public.experiences
  FOR SELECT USING (auth.uid() = user_id);

-- ── 5. Bestehende pending_review Werke: published+visible=false sicherstellen ──
UPDATE public.works
  SET published = false, visible = false
  WHERE status = 'pending_review'
    AND (published = true OR visible = true);

UPDATE public.experiences
  SET status = 'pending_review'
  WHERE status = 'pending_review'; -- no-op, sicherstellen dass Spalte les-/schreibbar

-- ── 6. Index für schnelle Admin-Queries ───────────────────────
CREATE INDEX IF NOT EXISTS idx_works_status_review
  ON public.works(status) WHERE status = 'pending_review';

CREATE INDEX IF NOT EXISTS idx_exp_status_review
  ON public.experiences(status) WHERE status = 'pending_review';

-- ── 7. notifications: Felder sicherstellen ────────────────────
-- notifications Tabelle existiert bereits — nur Felder prüfen
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS metadata  JSONB DEFAULT '{}'::jsonb;

-- ── Status-Check ──────────────────────────────────────────────
DO $$
DECLARE
  v_works_pending  INTEGER;
  v_exp_pending    INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_works_pending  FROM public.works       WHERE status = 'pending_review';
  SELECT COUNT(*) INTO v_exp_pending    FROM public.experiences  WHERE status = 'pending_review';
  RAISE NOTICE 'Migration 049 OK | works pending: % | experiences pending: %',
    v_works_pending, v_exp_pending;
END $$;

COMMENT ON COLUMN public.works.admin_comment    IS 'Kommentar des Admins — sichtbar für Talent';
COMMENT ON COLUMN public.works.rejection_reason IS 'Ablehnungsgrund — sichtbar für Talent';
COMMENT ON COLUMN public.works.reviewed_at      IS 'Zeitstempel der Admin-Prüfung';
COMMENT ON COLUMN public.experiences.admin_comment    IS 'Kommentar des Admins — sichtbar für Talent';
COMMENT ON COLUMN public.experiences.rejection_reason IS 'Ablehnungsgrund — sichtbar für Talent';
COMMENT ON COLUMN public.experiences.reviewed_at      IS 'Zeitstempel der Admin-Prüfung';
