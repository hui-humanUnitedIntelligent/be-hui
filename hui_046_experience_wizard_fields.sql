-- ═══════════════════════════════════════════════════════════════════════
-- HUI Migration 046 — experiences: Felder für 4-Schritte-Wizard
-- Datum: 2026-05-30
-- IDEMPOTENT
--
-- NEU: time_start, time_end, currency, price_per, registration_required
-- ═══════════════════════════════════════════════════════════════════════

-- Beginn-Uhrzeit als TEXT ('18:00') — getrennt von date (TIMESTAMPTZ)
ALTER TABLE public.experiences
  ADD COLUMN IF NOT EXISTS time_start  TEXT;

-- Ende-Uhrzeit als TEXT ('20:30') — optional
ALTER TABLE public.experiences
  ADD COLUMN IF NOT EXISTS time_end    TEXT;

-- Währung ('EUR', 'CHF', 'USD') — default EUR
ALTER TABLE public.experiences
  ADD COLUMN IF NOT EXISTS currency    TEXT NOT NULL DEFAULT 'EUR';

-- Preisbezug: Teilnehmer | Ticket | Stunde | Tag | Kurs | Gruppe | Monat
ALTER TABLE public.experiences
  ADD COLUMN IF NOT EXISTS price_per   TEXT;

-- Anmeldung erforderlich?
ALTER TABLE public.experiences
  ADD COLUMN IF NOT EXISTS registration_required BOOLEAN NOT NULL DEFAULT false;

-- caption-Spalte sicherstellen (war in 038 nicht explizit)
ALTER TABLE public.experiences
  ADD COLUMN IF NOT EXISTS caption     TEXT;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_exp_time_start  ON public.experiences(time_start);
CREATE INDEX IF NOT EXISTS idx_exp_price_per   ON public.experiences(price_per);
CREATE INDEX IF NOT EXISTS idx_exp_reg_req      ON public.experiences(registration_required);

-- Kommentare
COMMENT ON COLUMN public.experiences.time_start  IS 'Beginn-Uhrzeit als TEXT z.B. "18:00"';
COMMENT ON COLUMN public.experiences.time_end    IS 'Ende-Uhrzeit als TEXT z.B. "20:30", optional';
COMMENT ON COLUMN public.experiences.currency    IS 'Währung: EUR | CHF | USD';
COMMENT ON COLUMN public.experiences.price_per   IS 'Preisbezug: Teilnehmer|Ticket|Stunde|Tag|Kurs|Gruppe|Monat';
COMMENT ON COLUMN public.experiences.registration_required IS 'true = Anmeldung vor Teilnahme erforderlich';

-- Validation Query (nach Ausführung):
-- SELECT column_name, data_type, column_default
-- FROM information_schema.columns
-- WHERE table_schema = 'public' AND table_name = 'experiences'
--   AND column_name IN ('time_start','time_end','currency','price_per','registration_required')
-- ORDER BY ordinal_position;

COMMENT ON TABLE public.experiences IS
  'HUI Erlebnisse v046 — 4-Schritte-Wizard: time_start/end, currency, price_per, registration_required ergänzt';
