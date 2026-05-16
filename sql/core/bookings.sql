-- ════════════════════════════════════════════════
-- HUI CORE: bookings
-- Additive-only: nur ADD COLUMN IF NOT EXISTS
-- ════════════════════════════════════════════════

-- Fehlende Spalten ergänzen (Tabelle existiert bereits)
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS notes         text,
  ADD COLUMN IF NOT EXISTS escrow_status text          DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS impact_fee    numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS work_id       uuid REFERENCES public.works(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS experience_id uuid REFERENCES public.experiences(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_book_user_id   ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_book_wirker_id ON public.bookings(wirker_id);
CREATE INDEX IF NOT EXISTS idx_book_status    ON public.bookings(status);

NOTIFY pgrst, 'reload schema';
