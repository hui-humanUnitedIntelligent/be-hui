-- ════════════════════════════════════════════════
-- HUI CORE: payments
-- Additive-only
-- ════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.payments (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS payer_id          uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS recipient_id      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS user_id           uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS amount_eur        numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS impact_amount     numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS status            text          DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS stripe_session_id text,
  ADD COLUMN IF NOT EXISTS currency          text          DEFAULT 'eur';

CREATE INDEX IF NOT EXISTS idx_pay_payer_id   ON public.payments(payer_id);
CREATE INDEX IF NOT EXISTS idx_pay_booking_id ON public.payments(booking_id);

NOTIFY pgrst, 'reload schema';
