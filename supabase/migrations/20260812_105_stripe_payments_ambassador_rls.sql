-- ════════════════════════════════════════════════
-- Migration 105: stripe_payments RLS — Ambassador may read own received payments
-- Problem: FinanzübersichtModal queries .eq("ambassador_id", userId) but
-- RLS only allowed .eq("user_id", auth.uid()). Ambassadors couldn't see
-- their received support payments.
-- Fix: Add policy allowing users to also read rows where ambassador_id = auth.uid()
-- ════════════════════════════════════════════════

-- Drop old policy (will recreate with OR condition)
DROP POLICY IF EXISTS "own_payments" ON public.stripe_payments;

-- New policy: user can read where they are payer OR recipient
CREATE POLICY "own_payments" ON public.stripe_payments FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR ambassador_id = auth.uid());

NOTIFY pgrst, 'reload schema';
