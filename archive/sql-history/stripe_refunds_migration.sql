-- ═══════════════════════════════════════════════════════════════════
-- HUI STRIPE REFUNDS — Korrektur gegen echtes Live-Schema (ARCH-006.1)
-- Fund: stripe_payments.id (nicht .stripe_payment_id) ist der echte
-- Payment-Key im Live-System. rpc_record_payment verknüpfte Ambassador-
-- Provisionen zudem nie mit der Payment-ID. Beides wird hier korrigiert,
-- ohne bestehendes Verhalten für Zahlungen/Pool zu verändern.
-- ═══════════════════════════════════════════════════════════════════
SET search_path = public;

-- ── FK korrigieren: stripe_refunds → stripe_payments(id), nicht die tote Spalte
ALTER TABLE public.stripe_refunds DROP CONSTRAINT IF EXISTS stripe_refunds_stripe_payment_id_fkey;
ALTER TABLE public.stripe_refunds
  ADD CONSTRAINT stripe_refunds_stripe_payment_id_fkey
  FOREIGN KEY (stripe_payment_id) REFERENCES public.stripe_payments(id) ON DELETE CASCADE;

-- ── rpc_record_payment: Ambassador-Provision jetzt MIT Payment-ID verknüpfen,
--    damit Refunds die richtige Provision zurücksetzen können. Sonst identisch.
DROP FUNCTION IF EXISTS public.rpc_record_payment(text, text, integer, text, text, uuid, text) CASCADE;
CREATE FUNCTION public.rpc_record_payment(
  p_stripe_payment_id   text,
  p_stripe_customer_id  text,
  p_amount              integer,
  p_currency            text DEFAULT 'eur',
  p_payment_type        text DEFAULT 'work',
  p_ambassador_id       uuid DEFAULT NULL,
  p_description         text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_pool_share integer;
  v_amb_share  integer := 0;
  v_user_id    uuid;
BEGIN
  SELECT user_id INTO v_user_id
  FROM public.stripe_customers
  WHERE stripe_customer_id = p_stripe_customer_id
  LIMIT 1;

  INSERT INTO public.stripe_payments(
    id, user_id, amount, currency, status,
    payment_type, ambassador_id, description, created_at
  )
  VALUES (
    p_stripe_payment_id, v_user_id, p_amount, p_currency, 'succeeded',
    p_payment_type, p_ambassador_id, p_description, now()
  )
  ON CONFLICT(id) DO UPDATE SET
    status        = 'succeeded',
    payment_type  = EXCLUDED.payment_type,
    ambassador_id = COALESCE(EXCLUDED.ambassador_id,  public.stripe_payments.ambassador_id),
    description   = COALESCE(EXCLUDED.description,    public.stripe_payments.description),
    user_id       = COALESCE(EXCLUDED.user_id,        public.stripe_payments.user_id);

  v_pool_share := GREATEST((p_amount * 0.15)::integer, 1);
  PERFORM public.rpc_update_impact_pool(v_pool_share);

  IF p_ambassador_id IS NOT NULL THEN
    v_amb_share := GREATEST((p_amount * 0.05)::integer, 1);
    -- FIX: Payment-ID jetzt mitgeben, damit Refund-Reversal die Provision findet
    PERFORM public.rpc_record_ambassador_commission(p_ambassador_id, v_amb_share, p_stripe_payment_id);
  END IF;

  RETURN jsonb_build_object(
    'ok',           true,
    'payment_id',   p_stripe_payment_id,
    'payment_type', p_payment_type,
    'amount',       p_amount,
    'pool_share',   v_pool_share,
    'amb_share',    v_amb_share
  );
END;
$$;
GRANT EXECUTE ON FUNCTION public.rpc_record_payment(text, text, integer, text, text, uuid, text) TO service_role, authenticated;

-- ── rpc_record_refund: komplett gegen das ECHTE Live-Schema neu gebaut ──
-- Sucht über stripe_payments.id (nicht die tote stripe_payment_id-Spalte).
-- Bucht Pool-Rückbuchung über dieselbe Formel wie beim Zufluss (15%, negativ),
-- da impact_pool_share auf der payments-Zeile nie befüllt wird.
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
  v_payment     record;
  v_amount      integer;
  v_pool_adj    integer;
  v_month       text;
  v_refund_id   text := COALESCE(p_stripe_refund_id, 're_' || p_stripe_payment_id);
  v_comm_amount integer := 0;
BEGIN
  SELECT * INTO v_payment FROM public.stripe_payments WHERE id = p_stripe_payment_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'payment_not_found');
  END IF;

  v_amount := LEAST(COALESCE(p_refund_amount, v_payment.amount), v_payment.amount);

  UPDATE public.stripe_payments
  SET status     = CASE WHEN v_amount >= v_payment.amount THEN 'refunded' ELSE 'partially_refunded' END,
      updated_at = now()
  WHERE id = p_stripe_payment_id;

  -- Impact Pool zurückbuchen — exakt dieselbe Formel wie beim Zufluss, negativ
  v_month    := to_char(v_payment.created_at, 'YYYY-MM');
  v_pool_adj := GREATEST((v_amount * 0.15)::integer, 1);
  PERFORM public.rpc_update_impact_pool(-v_pool_adj, v_month);

  -- Ambassador-Provision zu GENAU dieser Zahlung zurücksetzen (jetzt korrekt verknüpft)
  SELECT amount INTO v_comm_amount
  FROM public.stripe_ambassador_commissions
  WHERE stripe_payment_id = p_stripe_payment_id AND status = 'pending'
  LIMIT 1;

  UPDATE public.stripe_ambassador_commissions
  SET status = 'refunded'
  WHERE stripe_payment_id = p_stripe_payment_id AND status = 'pending';

  -- Refund protokollieren — Single Source of Truth für Rückerstattungs-Historie
  INSERT INTO public.stripe_refunds(
    stripe_refund_id, stripe_payment_id, user_id, amount, currency,
    reason, status, pool_adjustment, ambassador_adjustment
  )
  VALUES (
    v_refund_id, p_stripe_payment_id, v_payment.user_id, v_amount, v_payment.currency,
    p_reason, 'succeeded', v_pool_adj, COALESCE(v_comm_amount, 0)
  )
  ON CONFLICT(stripe_refund_id) DO NOTHING;

  RETURN jsonb_build_object(
    'ok', true, 'payment_id', p_stripe_payment_id, 'refund_id', v_refund_id,
    'amount', v_amount, 'pool_adj', v_pool_adj, 'amb_adj', COALESCE(v_comm_amount,0), 'month', v_month
  );
END;
$$;
GRANT EXECUTE ON FUNCTION public.rpc_record_refund(text, integer, text, text) TO service_role;

-- rpc_handle_refund bleibt dünner Alias (Rückwärtskompatibilität)
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

NOTIFY pgrst, 'reload schema';
