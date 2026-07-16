
-- ═══════════════════════════════════════════════════════════════
-- HUI Stripe: Finale RPC-Bereinigung (ARCH-006.1)
-- Löst: PGRST203 multiple-overloads + type mismatch
-- ═══════════════════════════════════════════════════════════════
SET search_path = public;

-- ── 1. ALLE Overloads radikal entfernen ────────────────────────
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT p.oid, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.proname IN ('rpc_record_payment','rpc_get_stripe_payments','rpc_get_stripe_overview')
  LOOP
    EXECUTE format('DROP FUNCTION IF EXISTS public.%I(%s) CASCADE',
      (SELECT proname FROM pg_proc WHERE oid = r.oid), r.args);
  END LOOP;
END $$;

-- ── 2. stripe_payments id-Typ sicherstellen ────────────────────
-- id Spalte muss TEXT sein (Stripe IDs sind Strings wie pi_xxx)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='stripe_payments' AND column_name='id' AND data_type='uuid'
  ) THEN
    -- UUID → TEXT Migration (Stripe IDs sind Strings)
    ALTER TABLE public.stripe_payments ALTER COLUMN id TYPE text USING id::text;
  END IF;
  -- Fehlende Spalten ergänzen
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stripe_payments' AND column_name='payment_type')    THEN ALTER TABLE public.stripe_payments ADD COLUMN payment_type   text DEFAULT 'work'; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stripe_payments' AND column_name='ambassador_id')   THEN ALTER TABLE public.stripe_payments ADD COLUMN ambassador_id  uuid REFERENCES public.profiles(id) ON DELETE SET NULL; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stripe_payments' AND column_name='description')     THEN ALTER TABLE public.stripe_payments ADD COLUMN description     text; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stripe_payments' AND column_name='user_id')         THEN ALTER TABLE public.stripe_payments ADD COLUMN user_id         uuid REFERENCES public.profiles(id) ON DELETE SET NULL; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stripe_payments' AND column_name='amount')          THEN ALTER TABLE public.stripe_payments ADD COLUMN amount          integer NOT NULL DEFAULT 0; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stripe_payments' AND column_name='currency')        THEN ALTER TABLE public.stripe_payments ADD COLUMN currency        text DEFAULT 'eur'; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stripe_payments' AND column_name='status')          THEN ALTER TABLE public.stripe_payments ADD COLUMN status          text DEFAULT 'pending'; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stripe_payments' AND column_name='created_at')      THEN ALTER TABLE public.stripe_payments ADD COLUMN created_at      timestamptz DEFAULT now(); END IF;
END $$;

-- ── 3. rpc_record_payment (final, einzig) ─────────────────────
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
  -- Nutzer via Customer finden
  SELECT user_id INTO v_user_id
  FROM public.stripe_customers
  WHERE stripe_customer_id = p_stripe_customer_id
  LIMIT 1;

  -- Zahlung einfügen / aktualisieren
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

  -- 15% → Impact Pool
  v_pool_share := GREATEST((p_amount * 0.15)::integer, 1);
  PERFORM public.rpc_update_impact_pool(v_pool_share);

  -- 5% → Ambassador-Provision (falls vorhanden)
  IF p_ambassador_id IS NOT NULL THEN
    v_amb_share := GREATEST((p_amount * 0.05)::integer, 1);
    PERFORM public.rpc_record_ambassador_commission(p_ambassador_id, v_amb_share);
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
GRANT EXECUTE ON FUNCTION public.rpc_record_payment(text,text,integer,text,text,uuid,text)
  TO service_role, authenticated;

-- ── 4. rpc_get_stripe_payments (final, einzig) ────────────────
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
  FROM   public.stripe_payments p
  LEFT JOIN public.profiles pr  ON p.user_id       = pr.id
  LEFT JOIN public.profiles amb ON p.ambassador_id  = amb.id
  WHERE  (p_type IS NULL OR COALESCE(p.payment_type,'work') = p_type)
  ORDER  BY p.created_at DESC
  LIMIT  p_limit
  OFFSET p_offset;
END;
$$;
GRANT EXECUTE ON FUNCTION public.rpc_get_stripe_payments(text,integer,integer)
  TO authenticated, service_role;

-- ── 5. rpc_get_stripe_overview (mit payment_type breakdown) ──
CREATE FUNCTION public.rpc_get_stripe_overview()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payments bigint; v_volume numeric; v_subs bigint;
  v_payouts  bigint; v_amb_pending numeric; v_by_type jsonb;
BEGIN
  SELECT COUNT(*), ROUND(COALESCE(SUM(amount),0)::numeric/100,2)
  INTO   v_payments, v_volume
  FROM   public.stripe_payments WHERE status='succeeded';

  SELECT COUNT(*) INTO v_subs   FROM public.stripe_subscriptions WHERE status='active';
  SELECT COUNT(*) INTO v_payouts FROM public.stripe_payouts       WHERE status='paid';
  SELECT ROUND(COALESCE(SUM(amount),0)::numeric/100,2) INTO v_amb_pending
  FROM   public.stripe_ambassador_commissions WHERE status='pending';

  SELECT jsonb_object_agg(
    COALESCE(payment_type,'work'),
    jsonb_build_object('count',cnt,'total_eur',ROUND(tot::numeric/100,2))
  ) INTO v_by_type
  FROM (
    SELECT COALESCE(payment_type,'work') AS payment_type,
           COUNT(*) cnt, COALESCE(SUM(amount),0) tot
    FROM   public.stripe_payments WHERE status='succeeded'
    GROUP  BY payment_type
  ) t;

  RETURN jsonb_build_object(
    'total_payments',   v_payments,
    'total_volume_eur', v_volume,
    'active_subs',      v_subs,
    'paid_payouts',     v_payouts,
    'amb_pending_eur',  v_amb_pending,
    'by_type',          COALESCE(v_by_type,'{}')
  );
END;
$$;
GRANT EXECUTE ON FUNCTION public.rpc_get_stripe_overview() TO authenticated, service_role;

NOTIFY pgrst, 'reload schema';
