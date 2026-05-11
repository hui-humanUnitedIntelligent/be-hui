-- HUI 016: Phase 5 Creator Tools
-- Ausführen in: Supabase → SQL Editor

-- bookings: Spalten für wirker-seitige Abfragen
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS wirker_id    UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS client_name  TEXT,
  ADD COLUMN IF NOT EXISTS service_title TEXT,
  ADD COLUMN IF NOT EXISTS work_title   TEXT,
  ADD COLUMN IF NOT EXISTS amount       NUMERIC,
  ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ;

-- works: view counter
ALTER TABLE public.works
  ADD COLUMN IF NOT EXISTS views INT DEFAULT 0;

-- profiles: availability slots (JSONB)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS availability_slots JSONB DEFAULT '{}';

-- RLS für bookings (wirker kann eigene sehen)
DROP POLICY IF EXISTS bookings_wirker_select ON public.bookings;
CREATE POLICY bookings_wirker_select ON public.bookings
  FOR SELECT USING (
    user_id = auth.uid() OR wirker_id = auth.uid()
  );

DROP POLICY IF EXISTS bookings_wirker_update ON public.bookings;
CREATE POLICY bookings_wirker_update ON public.bookings
  FOR UPDATE USING (wirker_id = auth.uid());

NOTIFY pgrst, 'reload schema';
SELECT 'Phase 5 ready ✓' AS status;
