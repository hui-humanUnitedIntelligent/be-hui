
-- ═══════════════════════════════════════════════════════════════
-- HUI Stripe Checkout: RPC-Overload-Fix + Webhook-Ergänzungen
-- Löst: PGRST203 "multiple overloads" für rpc_record_payment
--        und rpc_get_stripe_payments Type-Fehler
-- ═══════════════════════════════════════════════════════════════
SET search_path = public;

-- ── 1. Alle Overloads von rpc_record_payment entfernen ─────────
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT p.oid, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'rpc_record_payment'
  LOOP
    EXECUTE format('DROP FUNCTION IF EXISTS public.rpc_record_payment(%s) CASCADE', r.args);
  END LOOP;
END $$;

-- ── 2. Saubere, einzige rpc_record_payment ─────────────────────
CREATE FUNCTION public.rpc_record_payment(
  p_stripe_payment_id  text,
  p_stripe_customer_id text,
  p_amount             integer,
  p_currency           text    DEFAULT 'eur',
  p_payment_type       text    DEFAULT 'work',
  p_ambassador_id      uuid    DEFAULT NULL,
  p_description        text    DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pool_share integer;
  v_amb_share  integer := 0;
  v_user_id    uuid;
BEGIN
  SELECT user_id INTO v_user_id
  FROM public.stripe_customers WHERE stripe_customer_id = p_stripe_customer_id LIMIT 1;

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
    description   = COALESCE(EXCLUDED.description,    public.stripe_payments.description);

  -- 15% → Impact Pool
  v_pool_share := (p_amount * 0.15)::integer;
  PERFORM public.rpc_update_impact_pool(v_pool_share);

  -- 5% → Ambassador
  IF p_ambassador_id IS NOT NULL THEN
    v_amb_share := (p_amount * 0.05)::integer;
    PERFORM public.rpc_record_ambassador_commission(p_ambassador_id, v_amb_share);
  END IF;

  RETURN jsonb_build_object(
    'ok',           true,
    'payment_id',   p_stripe_payment_id,
    'payment_type', p_payment_type,
    'pool_share',   v_pool_share,
    'amb_share',    v_amb_share
  );
END;
$$;
GRANT EXECUTE ON FUNCTION public.rpc_record_payment(text,text,integer,text,text,uuid,text) TO service_role, authenticated;

-- ── 3. rpc_get_stripe_payments Type-Fix ────────────────────────
DROP FUNCTION IF EXISTS public.rpc_get_stripe_payments() CASCADE;
DROP FUNCTION IF EXISTS public.rpc_get_stripe_payments(text) CASCADE;
DROP FUNCTION IF EXISTS public.rpc_get_stripe_payments(text,integer) CASCADE;
DROP FUNCTION IF EXISTS public.rpc_get_stripe_payments(text,integer,integer) CASCADE;

CREATE FUNCTION public.rpc_get_stripe_payments(
  p_type   text    DEFAULT NULL,
  p_limit  integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
RETURNS TABLE(
  id            text,
  user_id       uuid,
  username      text,
  email         text,
  amount_eur    numeric,
  currency      text,
  status        text,
  payment_type  text,
  description   text,
  ambassador_id uuid,
  amb_username  text,
  created_at    timestamptz
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id::text,
    p.user_id,
    pr.username,
    pr.email,
    ROUND(p.amount::numeric / 100, 2),
    p.currency,
    p.status,
    COALESCE(p.payment_type, 'work'),
    p.description,
    p.ambassador_id,
    amb.username,
    p.created_at
  FROM public.stripe_payments p
  LEFT JOIN public.profiles pr  ON p.user_id       = pr.id
  LEFT JOIN public.profiles amb ON p.ambassador_id  = amb.id
  WHERE (p_type IS NULL OR COALESCE(p.payment_type,'work') = p_type)
  ORDER BY p.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;
GRANT EXECUTE ON FUNCTION public.rpc_get_stripe_payments(text,integer,integer) TO authenticated, service_role;

-- ── 4. rpc_get_stripe_overview: payment_type-Summen ───────────
DROP FUNCTION IF EXISTS public.rpc_get_stripe_overview() CASCADE;
CREATE FUNCTION public.rpc_get_stripe_overview()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_payments  bigint;
  v_total_volume    numeric;
  v_active_subs     bigint;
  v_paid_payouts    bigint;
  v_amb_pending     numeric;
  v_by_type         jsonb;
BEGIN
  SELECT COUNT(*), ROUND(COALESCE(SUM(amount),0)::numeric/100,2)
  INTO v_total_payments, v_total_volume
  FROM public.stripe_payments WHERE status = 'succeeded';

  SELECT COUNT(*) INTO v_active_subs
  FROM public.stripe_subscriptions WHERE status = 'active';

  SELECT COUNT(*) INTO v_paid_payouts
  FROM public.stripe_payouts WHERE status = 'paid';

  SELECT ROUND(COALESCE(SUM(amount),0)::numeric/100,2) INTO v_amb_pending
  FROM public.stripe_ambassador_commissions WHERE status = 'pending';

  SELECT jsonb_object_agg(
    COALESCE(payment_type,'work'),
    jsonb_build_object(
      'count', cnt,
      'total_eur', ROUND(total_cent::numeric/100,2)
    )
  ) INTO v_by_type
  FROM (
    SELECT COALESCE(payment_type,'work') AS payment_type,
           COUNT(*) AS cnt,
           COALESCE(SUM(amount),0) AS total_cent
    FROM public.stripe_payments WHERE status='succeeded'
    GROUP BY payment_type
  ) t;

  RETURN jsonb_build_object(
    'total_payments',  v_total_payments,
    'total_volume_eur',v_total_volume,
    'active_subs',     v_active_subs,
    'paid_payouts',    v_paid_payouts,
    'amb_pending_eur', v_amb_pending,
    'by_type',         COALESCE(v_by_type, '{}'::jsonb)
  );
END;
$$;
GRANT EXECUTE ON FUNCTION public.rpc_get_stripe_overview() TO authenticated, service_role;

NOTIFY pgrst, 'reload schema';
