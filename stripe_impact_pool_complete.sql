
-- ═══════════════════════════════════════════════════════════════
-- HUI Impact Pool — Fehlende Felder + RPCs (ARCH-006.1)
-- ═══════════════════════════════════════════════════════════════
SET search_path = public;

-- ── Fehlende Felder in stripe_impact_pool ergänzen ─────────────
ALTER TABLE public.stripe_impact_pool
  ADD COLUMN IF NOT EXISTS amount_total      numeric(14,2) GENERATED ALWAYS AS (ROUND(total_inflow::numeric/100,2)) STORED,
  ADD COLUMN IF NOT EXISTS source            text          DEFAULT 'payment',
  ADD COLUMN IF NOT EXISTS stripe_payment_id text,
  ADD COLUMN IF NOT EXISTS user_id           uuid          REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS ambassador_id     uuid          REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS metadata          jsonb         DEFAULT '{}';

-- ── stripe_impact_pool_events: Detaillierter Einzel-Log ─────────
-- (Jeder Zufluss/Abfluss als separater Eintrag — pool bleibt Monatssummary)
CREATE TABLE IF NOT EXISTS public.stripe_impact_pool_events (
  id                uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  month             text        NOT NULL,
  event_type        text        NOT NULL,  -- payment|refund|subscription|donation|adjustment
  direction         text        NOT NULL,  -- in|out
  amount_cent       integer     NOT NULL,
  pool_share_cent   integer     NOT NULL,
  stripe_payment_id text,
  stripe_event_id   text,
  user_id           uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  ambassador_id     uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  description       text,
  metadata          jsonb       DEFAULT '{}',
  created_at        timestamptz DEFAULT now()
);
ALTER TABLE public.stripe_impact_pool_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON public.stripe_impact_pool_events FOR ALL TO service_role USING (true);
CREATE POLICY "admin_read"       ON public.stripe_impact_pool_events FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('superadmin','admin','employee'))
);
CREATE INDEX IF NOT EXISTS idx_pool_events_month ON public.stripe_impact_pool_events(month);

-- ── rpc_get_impact_pool_current ─────────────────────────────────
DROP FUNCTION IF EXISTS public.rpc_get_impact_pool_current() CASCADE;
CREATE FUNCTION public.rpc_get_impact_pool_current()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_month       text := to_char(now(), 'YYYY-MM');
  v_pool        record;
  v_events_in   integer;
  v_events_out  integer;
  v_amb_pending numeric;
  v_amb_paid    numeric;
BEGIN
  SELECT * INTO v_pool FROM public.stripe_impact_pool WHERE month = v_month;
  SELECT COALESCE(SUM(amount_cent),0)::integer INTO v_events_in
    FROM public.stripe_impact_pool_events WHERE month = v_month AND direction = 'in';
  SELECT COALESCE(SUM(amount_cent),0)::integer INTO v_events_out
    FROM public.stripe_impact_pool_events WHERE month = v_month AND direction = 'out';
  SELECT
    ROUND(COALESCE(SUM(CASE WHEN status='pending' THEN amount ELSE 0 END),0)::numeric/100,2),
    ROUND(COALESCE(SUM(CASE WHEN status='paid'    THEN amount ELSE 0 END),0)::numeric/100,2)
  INTO v_amb_pending, v_amb_paid
  FROM public.stripe_ambassador_commissions;

  RETURN jsonb_build_object(
    'month',              v_month,
    'total_inflow_eur',   ROUND(COALESCE(v_pool.total_inflow,0)::numeric/100,2),
    'project_share_eur',  ROUND(COALESCE(v_pool.project_share,0)::numeric/100,2),
    'company_share_eur',  ROUND(COALESCE(v_pool.company_share,0)::numeric/100,2),
    'project_pct',        15,
    'company_pct',        85,
    'distributed',        COALESCE(v_pool.distributed, false),
    'distributed_at',     v_pool.distributed_at,
    'inflow_count',       v_events_in,
    'outflow_count',      v_events_out,
    'amb_pending_eur',    v_amb_pending,
    'amb_paid_eur',       v_amb_paid,
    'last_updated',       v_pool.updated_at
  );
END;
$$;
GRANT EXECUTE ON FUNCTION public.rpc_get_impact_pool_current() TO authenticated, service_role;

-- ── rpc_get_impact_pool_history ─────────────────────────────────
DROP FUNCTION IF EXISTS public.rpc_get_impact_pool_history(integer) CASCADE;
CREATE FUNCTION public.rpc_get_impact_pool_history(p_limit integer DEFAULT 12)
RETURNS TABLE(
  month              text,
  total_inflow_eur   numeric,
  project_share_eur  numeric,
  company_share_eur  numeric,
  distributed        boolean,
  event_count        bigint,
  updated_at         timestamptz
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.month,
    ROUND(p.total_inflow::numeric/100,2),
    ROUND(p.project_share::numeric/100,2),
    ROUND(p.company_share::numeric/100,2),
    p.distributed,
    COUNT(e.id),
    p.updated_at
  FROM public.stripe_impact_pool p
  LEFT JOIN public.stripe_impact_pool_events e ON e.month = p.month
  GROUP BY p.month, p.total_inflow, p.project_share, p.company_share, p.distributed, p.updated_at
  ORDER BY p.month DESC
  LIMIT p_limit;
END;
$$;
GRANT EXECUTE ON FUNCTION public.rpc_get_impact_pool_history(integer) TO authenticated, service_role;

-- ── rpc_get_impact_pool_events (Einzel-Log) ─────────────────────
DROP FUNCTION IF EXISTS public.rpc_get_impact_pool_events(text, integer, integer) CASCADE;
CREATE FUNCTION public.rpc_get_impact_pool_events(
  p_month  text    DEFAULT NULL,
  p_limit  integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
RETURNS TABLE(
  id                uuid,
  month             text,
  event_type        text,
  direction         text,
  amount_eur        numeric,
  pool_share_eur    numeric,
  stripe_payment_id text,
  description       text,
  created_at        timestamptz,
  username          text
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.month,
    e.event_type,
    e.direction,
    ROUND(e.amount_cent::numeric/100,2),
    ROUND(e.pool_share_cent::numeric/100,2),
    e.stripe_payment_id,
    e.description,
    e.created_at,
    pr.username
  FROM public.stripe_impact_pool_events e
  LEFT JOIN public.profiles pr ON e.user_id = pr.id
  WHERE (p_month IS NULL OR e.month = p_month)
  ORDER BY e.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;
GRANT EXECUTE ON FUNCTION public.rpc_get_impact_pool_events(text,integer,integer) TO authenticated, service_role;

-- ── rpc_record_payment erweitern: Pool-Event loggen ─────────────
-- (Override der bestehenden Funktion mit Event-Log)
DROP FUNCTION IF EXISTS public.rpc_record_payment(text,text,integer,text,text,uuid,jsonb) CASCADE;
CREATE FUNCTION public.rpc_record_payment(
  p_stripe_payment_id   text,
  p_stripe_customer_id  text,
  p_amount              integer,
  p_currency            text,
  p_payment_type        text,
  p_user_id             uuid    DEFAULT NULL,
  p_metadata            jsonb   DEFAULT '{}'
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id       uuid := p_user_id;
  v_ambassador_id uuid;
  v_amb_share     integer;
  v_pool_share    integer;
  v_pool_month    text := to_char(now(), 'YYYY-MM');
BEGIN
  -- User via Customer ermitteln
  IF v_user_id IS NULL THEN
    SELECT user_id INTO v_user_id FROM public.stripe_customers WHERE stripe_customer_id = p_stripe_customer_id;
  END IF;
  -- Ambassador ermitteln
  IF v_user_id IS NOT NULL THEN
    SELECT referred_by::uuid INTO v_ambassador_id FROM public.profiles WHERE id = v_user_id;
  END IF;
  -- Anteile
  v_pool_share := (p_amount * 15) / 100;
  v_amb_share  := CASE WHEN v_ambassador_id IS NOT NULL THEN (p_amount * 5) / 100 ELSE 0 END;

  -- Zahlung speichern
  INSERT INTO public.stripe_payments(
    user_id, stripe_payment_id, stripe_customer_id,
    amount, currency, status, payment_type,
    ambassador_id, impact_pool_share, ambassador_share, metadata
  )
  VALUES (
    v_user_id, p_stripe_payment_id, p_stripe_customer_id,
    p_amount, p_currency, 'succeeded', p_payment_type,
    v_ambassador_id, v_pool_share, v_amb_share, p_metadata
  )
  ON CONFLICT(stripe_payment_id) DO NOTHING;

  -- Ambassador-Provision
  IF v_ambassador_id IS NOT NULL AND v_amb_share > 0 THEN
    INSERT INTO public.stripe_ambassador_commissions(
      ambassador_id, referred_user_id, stripe_payment_id, amount, currency
    )
    VALUES (v_ambassador_id, v_user_id, p_stripe_payment_id, v_amb_share, p_currency)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Impact Pool Monatssummary
  INSERT INTO public.stripe_impact_pool(month, total_inflow, project_share, company_share)
  VALUES (v_pool_month, p_amount, v_pool_share, p_amount - v_pool_share)
  ON CONFLICT(month) DO UPDATE SET
    total_inflow  = public.stripe_impact_pool.total_inflow  + EXCLUDED.total_inflow,
    project_share = public.stripe_impact_pool.project_share + EXCLUDED.project_share,
    company_share = public.stripe_impact_pool.company_share + EXCLUDED.company_share,
    updated_at    = now();

  -- Pool-Event-Log (Einzeleintrag)
  INSERT INTO public.stripe_impact_pool_events(
    month, event_type, direction, amount_cent, pool_share_cent,
    stripe_payment_id, user_id, ambassador_id, description
  )
  VALUES (
    v_pool_month, p_payment_type, 'in', p_amount, v_pool_share,
    p_stripe_payment_id, v_user_id, v_ambassador_id,
    p_payment_type || ' via Stripe'
  )
  ON CONFLICT DO NOTHING;

  -- first_transaction_at
  IF v_user_id IS NOT NULL THEN
    UPDATE public.profiles SET first_transaction_at = now()
    WHERE id = v_user_id AND first_transaction_at IS NULL;
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'payment_id',  p_stripe_payment_id,
    'pool_share',  v_pool_share,
    'amb_share',   v_amb_share,
    'ambassador',  v_ambassador_id
  );
END;
$$;
GRANT EXECUTE ON FUNCTION public.rpc_record_payment(text,text,integer,text,text,uuid,jsonb) TO service_role, authenticated;

-- ── rpc_handle_refund: Pool-Event loggen ────────────────────────
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
  v_payment  record;
  v_pool_adj integer;
  v_month    text;
BEGIN
  SELECT * INTO v_payment FROM public.stripe_payments WHERE stripe_payment_id = p_stripe_payment_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'payment_not_found');
  END IF;

  UPDATE public.stripe_payments SET status='refunded', updated_at=now()
    WHERE stripe_payment_id = p_stripe_payment_id;

  v_pool_adj := COALESCE(v_payment.impact_pool_share, 0);
  v_month    := to_char(v_payment.created_at, 'YYYY-MM');

  UPDATE public.stripe_impact_pool SET
    total_inflow  = GREATEST(0, total_inflow  - v_payment.amount),
    project_share = GREATEST(0, project_share - v_pool_adj),
    company_share = GREATEST(0, company_share - (v_payment.amount - v_pool_adj)),
    updated_at    = now()
  WHERE month = v_month;

  -- Refund-Event loggen
  INSERT INTO public.stripe_impact_pool_events(
    month, event_type, direction, amount_cent, pool_share_cent,
    stripe_payment_id, user_id, description
  )
  VALUES (
    v_month, 'refund', 'out', v_payment.amount, v_pool_adj,
    p_stripe_payment_id, v_payment.user_id, 'Rückerstattung'
  )
  ON CONFLICT DO NOTHING;

  -- Ambassador-Provision zurücksetzen
  IF v_payment.ambassador_id IS NOT NULL THEN
    UPDATE public.stripe_ambassador_commissions SET status='refunded'
    WHERE stripe_payment_id = p_stripe_payment_id AND status='pending';
  END IF;

  RETURN jsonb_build_object('ok', true, 'payment_id', p_stripe_payment_id,
    'pool_adj', v_pool_adj, 'month', v_month);
END;
$$;
GRANT EXECUTE ON FUNCTION public.rpc_handle_refund(text,integer) TO service_role;

-- ── rpc_record_subscription: Pool-Event loggen ──────────────────
DROP FUNCTION IF EXISTS public.rpc_record_subscription(text,text,text,text,integer,text,timestamptz,timestamptz,boolean,jsonb) CASCADE;
CREATE FUNCTION public.rpc_record_subscription(
  p_stripe_subscription_id text,
  p_stripe_customer_id     text,
  p_status                 text,
  p_stripe_price_id        text        DEFAULT NULL,
  p_amount                 integer     DEFAULT 0,
  p_currency               text        DEFAULT 'eur',
  p_period_start           timestamptz DEFAULT NULL,
  p_period_end             timestamptz DEFAULT NULL,
  p_cancel_at_period_end   boolean     DEFAULT false,
  p_metadata               jsonb       DEFAULT '{}'
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id   uuid;
  v_month     text := to_char(now(), 'YYYY-MM');
  v_pool_share integer;
BEGIN
  SELECT user_id INTO v_user_id FROM public.stripe_customers
    WHERE stripe_customer_id = p_stripe_customer_id;

  INSERT INTO public.stripe_subscriptions(
    stripe_subscription_id, stripe_customer_id, user_id,
    stripe_price_id, status, amount, currency,
    current_period_start, current_period_end, cancel_at_period_end, metadata
  )
  VALUES (
    p_stripe_subscription_id, p_stripe_customer_id, v_user_id,
    p_stripe_price_id, p_status, p_amount, p_currency,
    p_period_start, p_period_end, p_cancel_at_period_end, p_metadata
  )
  ON CONFLICT(stripe_subscription_id) DO UPDATE SET
    status               = EXCLUDED.status,
    amount               = EXCLUDED.amount,
    current_period_start = COALESCE(EXCLUDED.current_period_start, public.stripe_subscriptions.current_period_start),
    current_period_end   = COALESCE(EXCLUDED.current_period_end,   public.stripe_subscriptions.current_period_end),
    cancel_at_period_end = EXCLUDED.cancel_at_period_end,
    metadata             = EXCLUDED.metadata,
    updated_at           = now();

  -- Pool-Event für aktive Abos
  IF p_status IN ('active','trialing') AND p_amount > 0 THEN
    v_pool_share := (p_amount * 15) / 100;
    INSERT INTO public.stripe_impact_pool(month, total_inflow, project_share, company_share)
    VALUES (v_month, p_amount, v_pool_share, p_amount - v_pool_share)
    ON CONFLICT(month) DO UPDATE SET
      total_inflow  = public.stripe_impact_pool.total_inflow  + EXCLUDED.total_inflow,
      project_share = public.stripe_impact_pool.project_share + EXCLUDED.project_share,
      company_share = public.stripe_impact_pool.company_share + EXCLUDED.company_share,
      updated_at    = now();

    INSERT INTO public.stripe_impact_pool_events(
      month, event_type, direction, amount_cent, pool_share_cent,
      stripe_payment_id, user_id, description
    )
    VALUES (v_month, 'subscription', 'in', p_amount, v_pool_share,
      p_stripe_subscription_id, v_user_id, 'Abo ' || p_status)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Cancelled: Pool-Eintrag loggen (kein Abzug vom Summary — war Einzelzahlung)
  IF p_status = 'canceled' THEN
    INSERT INTO public.stripe_impact_pool_events(
      month, event_type, direction, amount_cent, pool_share_cent,
      stripe_payment_id, user_id, description
    )
    VALUES (v_month, 'subscription', 'out', 0, 0,
      p_stripe_subscription_id, v_user_id, 'Abo gekündigt')
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN jsonb_build_object('ok', true, 'subscription_id', p_stripe_subscription_id,
    'status', p_status, 'user_id', v_user_id);
END;
$$;
GRANT EXECUTE ON FUNCTION public.rpc_record_subscription(text,text,text,text,integer,text,timestamptz,timestamptz,boolean,jsonb) TO service_role, authenticated;

NOTIFY pgrst, 'reload schema';
