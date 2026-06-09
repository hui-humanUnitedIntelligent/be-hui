-- ═══════════════════════════════════════════════════════════════
-- HUI Migration 050 — Moderations-Felder für works, experiences,
--                     impact_applications
-- Datum: 2026-06-09
-- IDEMPOTENT — alle Statements IF NOT EXISTS
--
-- GRUNDSATZ:
--   Keine neuen Tabellen.
--   Keine bestehenden Statuswerte ändern.
--   Nur fehlende Felder ergänzen.
--
-- BESTAND (aus Analyse):
--   works:               status ✅  published ✅  visible ✅
--                        admin_comment ❌  rejection_reason ❌
--                        reviewed_at ❌  reviewed_by ❌
--
--   experiences:         status ✅
--                        admin_comment ❌  rejection_reason ❌
--                        reviewed_at ❌  reviewed_by ❌
--
--   impact_applications: status ✅  reviewed_at ✅
--                        admin_comment ❌  rejection_reason ❌
--                        reviewed_by ❌
--
--   notifications:       metadata ✅ (aus 049)
-- ═══════════════════════════════════════════════════════════════

-- ── 1. works — fehlende Moderationsfelder ─────────────────────
ALTER TABLE public.works
  ADD COLUMN IF NOT EXISTS admin_comment    TEXT,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS reviewed_at      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reviewed_by      UUID
    REFERENCES auth.users(id) ON DELETE SET NULL;

-- ── 2. experiences — fehlende Moderationsfelder ───────────────
ALTER TABLE public.experiences
  ADD COLUMN IF NOT EXISTS admin_comment    TEXT,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS reviewed_at      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reviewed_by      UUID
    REFERENCES auth.users(id) ON DELETE SET NULL;

-- ── 3. impact_applications — fehlende Moderationsfelder ───────
-- reviewed_at existiert bereits — NICHT neu anlegen
ALTER TABLE public.impact_applications
  ADD COLUMN IF NOT EXISTS admin_comment    TEXT,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS reviewed_by      UUID
    REFERENCES auth.users(id) ON DELETE SET NULL;

-- ── 4. notifications — metadata sicherstellen (idempotent) ────
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- ── 5. Indexes für Admin-Queries ──────────────────────────────
-- works: pending_review
CREATE INDEX IF NOT EXISTS idx_works_pending
  ON public.works(status)
  WHERE status = 'pending_review';

-- experiences: pending_review
CREATE INDEX IF NOT EXISTS idx_exp_pending
  ON public.experiences(status)
  WHERE status = 'pending_review';

-- impact_applications: pending (bestehender Statuswert bleibt)
CREATE INDEX IF NOT EXISTS idx_impact_apps_pending
  ON public.impact_applications(status)
  WHERE status = 'pending';

-- ── 6. RLS: Owner sieht eigene Werke unabhängig vom Status ────
-- (öffentliche Policy bleibt unverändert)
DROP POLICY IF EXISTS "works_owner_all" ON public.works;
CREATE POLICY "works_owner_all" ON public.works
  FOR ALL USING (
    auth.uid() = user_id
    OR auth.uid() = creator_id
  );

-- experiences: Owner sieht eigene
DROP POLICY IF EXISTS "experiences_owner_all" ON public.experiences;
CREATE POLICY "experiences_owner_all" ON public.experiences
  FOR ALL USING (auth.uid() = user_id);

-- ── 7. Status-Check ───────────────────────────────────────────
DO $$
DECLARE
  v_works_p  INTEGER;
  v_exp_p    INTEGER;
  v_proj_p   INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_works_p FROM public.works
    WHERE status = 'pending_review';
  SELECT COUNT(*) INTO v_exp_p   FROM public.experiences
    WHERE status = 'pending_review';
  SELECT COUNT(*) INTO v_proj_p  FROM public.impact_applications
    WHERE status = 'pending';
  RAISE NOTICE
    'Migration 050 OK | works pending_review: % | exp pending_review: % | projects pending: %',
    v_works_p, v_exp_p, v_proj_p;
END $$;

-- ── Kommentare ────────────────────────────────────────────────
COMMENT ON COLUMN public.works.admin_comment
  IS 'Freitext-Kommentar des Admins — sichtbar für Talent';
COMMENT ON COLUMN public.works.rejection_reason
  IS 'Ablehnungsgrund — sichtbar für Talent';
COMMENT ON COLUMN public.works.reviewed_at
  IS 'Zeitstempel der Admin-Entscheidung';
COMMENT ON COLUMN public.works.reviewed_by
  IS 'UUID des Admin-Users der geprüft hat';

COMMENT ON COLUMN public.experiences.admin_comment
  IS 'Freitext-Kommentar des Admins — sichtbar für Talent';
COMMENT ON COLUMN public.experiences.rejection_reason
  IS 'Ablehnungsgrund — sichtbar für Talent';
COMMENT ON COLUMN public.experiences.reviewed_at
  IS 'Zeitstempel der Admin-Entscheidung';
COMMENT ON COLUMN public.experiences.reviewed_by
  IS 'UUID des Admin-Users der geprüft hat';

COMMENT ON COLUMN public.impact_applications.admin_comment
  IS 'Freitext-Kommentar des Admins — sichtbar für Einreicher';
COMMENT ON COLUMN public.impact_applications.rejection_reason
  IS 'Ablehnungsgrund — sichtbar für Einreicher';
COMMENT ON COLUMN public.impact_applications.reviewed_by
  IS 'UUID des Admin-Users der geprüft hat';

NOTIFY pgrst, 'reload schema';
