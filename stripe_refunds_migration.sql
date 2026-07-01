-- ═══════════════════════════════════════════════════════════════════
-- HUI STRIPE REFUNDS — fehlende Tabelle + RPC (ARCH-006.1 Direktive)
-- stripe_refunds ist die einzige Quelle für Rückerstattungs-Historie.
-- rpc_record_refund ersetzt rpc_handle_refund als kanonischen Namen,
-- übernimmt dessen komplette Logik (Pool + Provision korrigieren)
-- und protokolliert zusätzlich in stripe_refunds.
-- ═══════════════════════════════════════════════════════════════════
SET search_path = public;

-- ── stripe_refunds ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.stripe_refunds (
  id                  uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  stripe_refund_id    text        UNIQUE,
  stripe_payment_id   text        NOT NULL REFERENCES public.stripe_payments(stripe_payment_id) ON DELETE CASCADE,
  user_id             uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  amount              integer     NOT NULL, -- Cent
  currency            text        DEFAULT 'eur',
  reason              text,
  status              text        DEFAULT 'succeeded', -- succeeded|pending|failed
  pool_adjustment     integer     DEFAULT 0, -- Cent, zurückgebuchter Impact-Pool-Anteil
  ambassador_adjustment integer   DEFAULT 0, -- Cent, zurückgebuchte Ambassador-Provision
  created_at          timestamptz DEFAULT now()
);
ALTER TABLE public.stripe_refunds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON public.stripe_refunds FOR ALL TO service_role USING (true);
CREATE POLICY "own_refunds"      ON public.stripe_refunds FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "admin_read_refunds" ON public.stripe_refunds FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('superadmin','admin','employee'))
);

-- ── rpc_record_refund: charge.refunded — kanonischer Name lt. Direktive ──
DROP FUNCTION IF EXISTS public.rpc_record_refund(text, integer, text, text) CASCADE;
CREATE FUNCTION public.rpc_record_refund(
  p_stripe_payment_id text,
  p_refund_amount     integer DEFAULT NULL,
  p_stripe_refund_id  text    DEFAULT NULL,
  p_reason            text    DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payment    record;
  v_amount     integer;
  v_pool_adj   integer;
  v_amb_adj    integer;
  v_month      text;
  v_refund_id  text := COALESCE(p_stripe_refund_id, 're_' || p_stripe_payment_id);
BEGIN
  SELECT * INTO v_payment
  FROM public.stripe_payments
  WHERE stripe_payment_id = p_stripe_payment_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'payment_not_found');
  END IF;

  v_amount := COALESCE(p_refund_amount, v_payment.amount);

  -- Status auf refunded setzen (voll oder teilweise)
  UPDATE public.stripe_payments
  SET status     = CASE WHEN v_amount >= v_payment.amount THEN 'refunded' ELSE 'partially_refunded' END,
      updated_at = now()
  WHERE stripe_payment_id = p_stripe_payment_id;

  -- Anteilig: Pool + Ambassador-Provision zurückbuchen (proportional zum Rückerstattungsbetrag)
  v_pool_adj := CASE WHEN v_payment.amount > 0
    THEN ROUND(COALESCE(v_payment.impact_pool_share,0)::numeric * v_amount / v_payment.amount)::integer
    ELSE 0 END;
  v_amb_adj  := CASE WHEN v_payment.amount > 0
    THEN ROUND(COALESCE(v_payment.ambassador_share,0)::numeric * v_amount / v_payment.amount)::integer
    ELSE 0 END;

  v_month := to_char(v_payment.created_at, 'YYYY-MM');
  UPDATE public.stripe_impact_pool SET
    total_inflow  = GREATEST(0, total_inflow  - v_amount),
    project_share = GREATEST(0, project_share - v_pool_adj),
    company_share = GREATEST(0, company_share - (v_amount - v_pool_adj)),
    updated_at    = now()
  WHERE month = v_month;

  IF v_payment.ambassador_id IS NOT NULL AND v_amb_adj > 0 THEN
    UPDATE public.stripe_ambassador_commissions
    SET status = 'refunded'
    WHERE stripe_payment_id = p_stripe_payment_id
      AND status = 'pending';
  END IF;

  -- Refund protokollieren — Single Source of Truth für Rückerstattungs-Historie
  INSERT INTO public.stripe_refunds(
    stripe_refund_id, stripe_payment_id, user_id, amount, currency,
    reason, status, pool_adjustment, ambassador_adjustment
  )
  VALUES (
    v_refund_id, p_stripe_payment_id, v_payment.user_id, v_amount, v_payment.currency,
    p_reason, 'succeeded', v_pool_adj, v_amb_adj
  )
  ON CONFLICT(stripe_refund_id) DO NOTHING;

  RETURN jsonb_build_object(
    'ok', true, 'payment_id', p_stripe_payment_id, 'refund_id', v_refund_id,
    'amount', v_amount, 'pool_adj', v_pool_adj, 'amb_adj', v_amb_adj, 'month', v_month
  );
END;
$$;
GRANT EXECUTE ON FUNCTION public.rpc_record_refund(text, integer, text, text) TO service_role;

-- rpc_handle_refund als dünner Alias beibehalten (Rückwärtskompatibilität, keine Duplikat-Logik)
DROP FUNCTION IF EXISTS public.rpc_handle_refund(text, integer) CASCADE;
CREATE FUNCTION public.rpc_handle_refund(p_stripe_payment_id text, p_refund_amount integer DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN public.rpc_record_refund(p_stripe_payment_id, p_refund_amount, NULL, NULL);
END;
$$;
GRANT EXECUTE ON FUNCTION public.rpc_handle_refund(text, integer) TO service_role;

-- ── rpc_record_payout: Signatur um p_failed_reason + p_ambassador_id erweitern ──
-- (Webhook sendet diese Felder bereits, alte Signatur kannte sie nicht)
DROP FUNCTION IF EXISTS public.rpc_record_payout(text,integer,text,text,text,timestamptz) CASCADE;
DROP FUNCTION IF EXISTS public.rpc_record_payout(text,integer,text,text,text,timestamptz,text,uuid) CASCADE;
CREATE FUNCTION public.rpc_record_payout(
  p_stripe_payout_id text,
  p_amount           integer,
  p_currency         text        DEFAULT 'eur',
  p_status           text        DEFAULT 'pending',
  p_payout_type      text        DEFAULT 'platform',
  p_arrival_date     timestamptz DEFAULT NULL,
  p_failed_reason    text        DEFAULT NULL,
  p_ambassador_id    uuid        DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.stripe_payouts(
    stripe_payout_id, amount, currency, status, payout_type, arrival_date,
    description, user_id
  )
  VALUES (
    p_stripe_payout_id, p_amount, p_currency, p_status, p_payout_type, p_arrival_date,
    p_failed_reason, p_ambassador_id
  )
  ON CONFLICT(stripe_payout_id) DO UPDATE SET
    status       = EXCLUDED.status,
    arrival_date = COALESCE(EXCLUDED.arrival_date, public.stripe_payouts.arrival_date),
    description  = COALESCE(EXCLUDED.description, public.stripe_payouts.description);

  IF p_status = 'paid' AND p_payout_type = 'ambassador' THEN
    UPDATE public.stripe_ambassador_commissions
    SET status = 'paid'
    WHERE status = 'pending'
      AND (p_ambassador_id IS NULL OR ambassador_id = p_ambassador_id)
      AND amount <= p_amount;
  END IF;

  RETURN jsonb_build_object('ok', true, 'payout_id', p_stripe_payout_id, 'status', p_status, 'amount', p_amount);
END;
$$;
GRANT EXECUTE ON FUNCTION public.rpc_record_payout(text,integer,text,text,text,timestamptz,text,uuid) TO service_role, authenticated;

NOTIFY pgrst, 'reload schema';
