
-- ═══════════════════════════════════════════════════════
-- HUI Stripe Webhook RPCs — fehlende Funktionen
-- ARCH-006.1 — alle Webhook-Events vollständig abgedeckt
-- ═══════════════════════════════════════════════════════
SET search_path = public;

-- ── rpc_record_subscription ────────────────────────────
DROP FUNCTION IF EXISTS public.rpc_record_subscription(text,text,text,text,integer,text,timestamptz,timestamptz,boolean,jsonb) CASCADE;
CREATE FUNCTION public.rpc_record_subscription(
  p_stripe_subscription_id text,
  p_stripe_customer_id     text,
  p_status                 text,
  p_stripe_price_id        text    DEFAULT NULL,
  p_amount                 integer DEFAULT 0,
  p_currency               text    DEFAULT 'eur',
  p_period_start           timestamptz DEFAULT NULL,
  p_period_end             timestamptz DEFAULT NULL,
  p_cancel_at_period_end   boolean DEFAULT false,
  p_metadata               jsonb   DEFAULT '{}'
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- User via Customer ermitteln
  SELECT user_id INTO v_user_id
  FROM public.stripe_customers
  WHERE stripe_customer_id = p_stripe_customer_id;

  INSERT INTO public.stripe_subscriptions(
    stripe_subscription_id, stripe_customer_id, user_id,
    stripe_price_id, status, amount, currency,
    current_period_start, current_period_end,
    cancel_at_period_end, metadata
  )
  VALUES (
    p_stripe_subscription_id, p_stripe_customer_id, v_user_id,
    p_stripe_price_id, p_status, p_amount, p_currency,
    p_period_start, p_period_end,
    p_cancel_at_period_end, p_metadata
  )
  ON CONFLICT(stripe_subscription_id) DO UPDATE SET
    status               = EXCLUDED.status,
    amount               = EXCLUDED.amount,
    current_period_start = COALESCE(EXCLUDED.current_period_start, public.stripe_subscriptions.current_period_start),
    current_period_end   = COALESCE(EXCLUDED.current_period_end,   public.stripe_subscriptions.current_period_end),
    cancel_at_period_end = EXCLUDED.cancel_at_period_end,
    metadata             = EXCLUDED.metadata,
    updated_at           = now();

  RETURN jsonb_build_object(
    'ok',              true,
    'subscription_id', p_stripe_subscription_id,
    'status',          p_status,
    'user_id',         v_user_id
  );
END;
$$;
GRANT EXECUTE ON FUNCTION public.rpc_record_subscription(text,text,text,text,integer,text,timestamptz,timestamptz,boolean,jsonb)
  TO service_role, authenticated;

-- ── rpc_record_payout ──────────────────────────────────
DROP FUNCTION IF EXISTS public.rpc_record_payout(text,integer,text,text,text,timestamptz) CASCADE;
CREATE FUNCTION public.rpc_record_payout(
  p_stripe_payout_id text,
  p_amount           integer,
  p_currency         text        DEFAULT 'eur',
  p_status           text        DEFAULT 'pending',
  p_payout_type      text        DEFAULT 'platform',
  p_arrival_date     timestamptz DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.stripe_payouts(
    stripe_payout_id, amount, currency, status, payout_type, arrival_date
  )
  VALUES (
    p_stripe_payout_id, p_amount, p_currency, p_status, p_payout_type, p_arrival_date
  )
  ON CONFLICT(stripe_payout_id) DO UPDATE SET
    status       = EXCLUDED.status,
    arrival_date = COALESCE(EXCLUDED.arrival_date, public.stripe_payouts.arrival_date);

  -- Bei Auszahlung: Ambassador-Commissions auf 'paid' setzen (wenn Betrag passt)
  IF p_status = 'paid' AND p_payout_type = 'ambassador' THEN
    UPDATE public.stripe_ambassador_commissions
    SET status = 'paid'
    WHERE status = 'pending'
      AND amount <= p_amount;
  END IF;

  RETURN jsonb_build_object(
    'ok',        true,
    'payout_id', p_stripe_payout_id,
    'status',    p_status,
    'amount',    p_amount
  );
END;
$$;
GRANT EXECUTE ON FUNCTION public.rpc_record_payout(text,integer,text,text,text,timestamptz)
  TO service_role, authenticated;

-- ── rpc_handle_refund: charge.refunded ─────────────────
-- Zahlung auf refunded + Pool + Provision korrigieren
DROP FUNCTION IF EXISTS public.rpc_handle_refund(text,integer) CASCADE;
CREATE FUNCTION public.rpc_handle_refund(
  p_stripe_payment_id text,
  p_refund_amount     integer DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payment   record;
  v_pool_adj  integer;
  v_amb_adj   integer;
  v_month     text;
BEGIN
  -- Zahlung laden
  SELECT * INTO v_payment
  FROM public.stripe_payments
  WHERE stripe_payment_id = p_stripe_payment_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'payment_not_found');
  END IF;

  -- Status auf refunded setzen
  UPDATE public.stripe_payments
  SET status     = 'refunded',
      updated_at = now()
  WHERE stripe_payment_id = p_stripe_payment_id;

  -- Impact Pool korrigieren
  v_pool_adj := COALESCE(v_payment.impact_pool_share, 0);
  v_month    := to_char(v_payment.created_at, 'YYYY-MM');
  UPDATE public.stripe_impact_pool SET
    total_inflow  = GREATEST(0, total_inflow  - v_payment.amount),
    project_share = GREATEST(0, project_share - v_pool_adj),
    company_share = GREATEST(0, company_share - (v_payment.amount - v_pool_adj)),
    updated_at    = now()
  WHERE month = v_month;

  -- Ambassador-Provision zurücksetzen
  IF v_payment.ambassador_id IS NOT NULL THEN
    UPDATE public.stripe_ambassador_commissions
    SET status = 'refunded'
    WHERE stripe_payment_id = p_stripe_payment_id
      AND status = 'pending';
  END IF;

  RETURN jsonb_build_object(
    'ok',         true,
    'payment_id', p_stripe_payment_id,
    'pool_adj',   v_pool_adj,
    'month',      v_month
  );
END;
$$;
GRANT EXECUTE ON FUNCTION public.rpc_handle_refund(text,integer) TO service_role;

NOTIFY pgrst, 'reload schema';
