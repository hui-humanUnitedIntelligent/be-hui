
-- ═══════════════════════════════════════════════════════════════════
-- HUI STRIPE INTEGRATION — Tabellen + RPCs
-- ARCH-006.1 konform: Stripe als einzige Payment-Wahrheit
-- ═══════════════════════════════════════════════════════════════════

SET search_path = public;

-- ── stripe_customers ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.stripe_customers (
  id                uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id           uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  stripe_customer_id text        NOT NULL UNIQUE,
  email             text,
  name              text,
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now(),
  UNIQUE(user_id)
);
ALTER TABLE public.stripe_customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON public.stripe_customers FOR ALL TO service_role USING (true);
CREATE POLICY "own_customer"     ON public.stripe_customers FOR SELECT TO authenticated USING (user_id = auth.uid());

-- ── stripe_payments ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.stripe_payments (
  id                  uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id             uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  stripe_payment_id   text        NOT NULL UNIQUE,
  stripe_customer_id  text,
  amount              integer     NOT NULL, -- in Cent
  currency            text        DEFAULT 'eur',
  status              text        NOT NULL DEFAULT 'pending',
  payment_type        text        DEFAULT 'one_time', -- one_time|subscription|donation|impact_pool|work|talent
  description         text,
  metadata            jsonb       DEFAULT '{}',
  ambassador_id       uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  impact_pool_share   integer     DEFAULT 0, -- Cent für Impact Pool
  ambassador_share    integer     DEFAULT 0, -- Cent für Ambassador-Provision
  stripe_event_id     text,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);
ALTER TABLE public.stripe_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON public.stripe_payments FOR ALL TO service_role USING (true);
CREATE POLICY "own_payments" ON public.stripe_payments FOR SELECT TO authenticated USING (user_id = auth.uid());

-- ── stripe_subscriptions ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.stripe_subscriptions (
  id                      uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id                 uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  stripe_subscription_id  text        NOT NULL UNIQUE,
  stripe_customer_id      text,
  stripe_price_id         text,
  plan_name               text,
  status                  text        NOT NULL DEFAULT 'active',
  current_period_start    timestamptz,
  current_period_end      timestamptz,
  amount                  integer     DEFAULT 0,
  currency                text        DEFAULT 'eur',
  cancel_at_period_end    boolean     DEFAULT false,
  metadata                jsonb       DEFAULT '{}',
  created_at              timestamptz DEFAULT now(),
  updated_at              timestamptz DEFAULT now()
);
ALTER TABLE public.stripe_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON public.stripe_subscriptions FOR ALL TO service_role USING (true);
CREATE POLICY "own_subscriptions" ON public.stripe_subscriptions FOR SELECT TO authenticated USING (user_id = auth.uid());

-- ── stripe_webhooks (Audit-Log) ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.stripe_webhooks (
  id              uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  stripe_event_id text        NOT NULL UNIQUE,
  event_type      text        NOT NULL,
  payload         jsonb       DEFAULT '{}',
  status          text        DEFAULT 'received', -- received|processed|failed
  error_message   text,
  processed_at    timestamptz,
  created_at      timestamptz DEFAULT now()
);
ALTER TABLE public.stripe_webhooks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON public.stripe_webhooks FOR ALL TO service_role USING (true);
CREATE POLICY "admin_read" ON public.stripe_webhooks FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('superadmin','admin','employee'))
);

-- ── stripe_payouts ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.stripe_payouts (
  id                uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id           uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  stripe_payout_id  text        NOT NULL UNIQUE,
  amount            integer     NOT NULL,
  currency          text        DEFAULT 'eur',
  status            text        DEFAULT 'pending',
  payout_type       text        DEFAULT 'ambassador', -- ambassador|talent|work|platform
  arrival_date      timestamptz,
  description       text,
  metadata          jsonb       DEFAULT '{}',
  created_at        timestamptz DEFAULT now()
);
ALTER TABLE public.stripe_payouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON public.stripe_payouts FOR ALL TO service_role USING (true);
CREATE POLICY "own_payouts" ON public.stripe_payouts FOR SELECT TO authenticated USING (user_id = auth.uid());

-- ── stripe_ambassador_commissions ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.stripe_ambassador_commissions (
  id                  uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  ambassador_id       uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referred_user_id    uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  stripe_payment_id   text,
  amount              integer     NOT NULL, -- Cent
  currency            text        DEFAULT 'eur',
  rate                numeric(5,4) DEFAULT 0.05, -- 5%
  status              text        DEFAULT 'pending', -- pending|paid|failed
  payout_id           uuid        REFERENCES public.stripe_payouts(id),
  created_at          timestamptz DEFAULT now()
);
ALTER TABLE public.stripe_ambassador_commissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON public.stripe_ambassador_commissions FOR ALL TO service_role USING (true);
CREATE POLICY "own_commissions" ON public.stripe_ambassador_commissions FOR SELECT TO authenticated
  USING (ambassador_id = auth.uid());

-- ── stripe_impact_pool ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.stripe_impact_pool (
  id                uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  month             text        NOT NULL, -- '2026-07'
  total_inflow      integer     DEFAULT 0, -- Cent
  project_share     integer     DEFAULT 0, -- 15% von total_inflow
  company_share     integer     DEFAULT 0, -- 85% von total_inflow
  distributed       boolean     DEFAULT false,
  distributed_at    timestamptz,
  stripe_transfer_ids jsonb     DEFAULT '[]',
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now(),
  UNIQUE(month)
);
ALTER TABLE public.stripe_impact_pool ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON public.stripe_impact_pool FOR ALL TO service_role USING (true);
CREATE POLICY "authenticated_read" ON public.stripe_impact_pool FOR SELECT TO authenticated USING (true);

-- ═══════════════════════════════════════════════════════════════════
-- RPCs
-- ═══════════════════════════════════════════════════════════════════

-- rpc_create_stripe_customer: legt Datensatz an (Stripe-Aufruf im Backend)
DROP FUNCTION IF EXISTS public.rpc_create_stripe_customer(uuid) CASCADE;
CREATE FUNCTION public.rpc_create_stripe_customer(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing text;
  v_profile  record;
BEGIN
  SELECT stripe_customer_id INTO v_existing FROM public.stripe_customers WHERE user_id = p_user_id;
  IF v_existing IS NOT NULL THEN
    RETURN jsonb_build_object('ok', true, 'customer_id', v_existing, 'created', false);
  END IF;
  SELECT id, email, display_name FROM public.profiles WHERE id = p_user_id INTO v_profile;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'user_not_found');
  END IF;
  RETURN jsonb_build_object(
    'ok', true, 'needs_stripe_create', true,
    'user_id', p_user_id,
    'email', v_profile.email,
    'name', v_profile.display_name
  );
END;
$$;
GRANT EXECUTE ON FUNCTION public.rpc_create_stripe_customer(uuid) TO authenticated, service_role;

-- rpc_save_stripe_customer: speichert Stripe Customer ID
DROP FUNCTION IF EXISTS public.rpc_save_stripe_customer(uuid, text) CASCADE;
CREATE FUNCTION public.rpc_save_stripe_customer(p_user_id uuid, p_stripe_customer_id text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.stripe_customers(user_id, stripe_customer_id)
  VALUES (p_user_id, p_stripe_customer_id)
  ON CONFLICT(user_id) DO UPDATE SET stripe_customer_id = EXCLUDED.stripe_customer_id, updated_at = now();
  RETURN jsonb_build_object('ok', true, 'customer_id', p_stripe_customer_id);
END;
$$;
GRANT EXECUTE ON FUNCTION public.rpc_save_stripe_customer(uuid, text) TO service_role;

-- rpc_record_payment: Webhook-Handler speichert Zahlung
DROP FUNCTION IF EXISTS public.rpc_record_payment(text, text, integer, text, text, uuid, jsonb) CASCADE;
CREATE FUNCTION public.rpc_record_payment(
  p_stripe_payment_id   text,
  p_stripe_customer_id  text,
  p_amount              integer,
  p_currency            text,
  p_payment_type        text,
  p_user_id             uuid     DEFAULT NULL,
  p_metadata            jsonb    DEFAULT '{}'
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
  -- User aus Customer-Tabelle ermitteln falls nicht übergeben
  IF v_user_id IS NULL THEN
    SELECT user_id INTO v_user_id FROM public.stripe_customers WHERE stripe_customer_id = p_stripe_customer_id;
  END IF;

  -- Ambassador: wer hat diesen User geworben?
  IF v_user_id IS NOT NULL THEN
    SELECT referred_by::uuid INTO v_ambassador_id FROM public.profiles WHERE id = v_user_id;
  END IF;

  -- Anteile berechnen: 15% → Impact Pool, 5% → Ambassador
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

  -- Ambassador-Provision buchen
  IF v_ambassador_id IS NOT NULL AND v_amb_share > 0 THEN
    INSERT INTO public.stripe_ambassador_commissions(
      ambassador_id, referred_user_id, stripe_payment_id, amount, currency
    )
    VALUES (v_ambassador_id, v_user_id, p_stripe_payment_id, v_amb_share, p_currency)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Impact Pool aktualisieren
  INSERT INTO public.stripe_impact_pool(month, total_inflow, project_share, company_share)
  VALUES (v_pool_month, p_amount, v_pool_share, p_amount - v_pool_share)
  ON CONFLICT(month) DO UPDATE SET
    total_inflow  = public.stripe_impact_pool.total_inflow  + EXCLUDED.total_inflow,
    project_share = public.stripe_impact_pool.project_share + EXCLUDED.project_share,
    company_share = public.stripe_impact_pool.company_share + EXCLUDED.company_share,
    updated_at    = now();

  -- profiles.first_transaction_at setzen (Ambassador-Aktivierung)
  IF v_user_id IS NOT NULL THEN
    UPDATE public.profiles SET first_transaction_at = now()
    WHERE id = v_user_id AND first_transaction_at IS NULL;
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'payment_id', p_stripe_payment_id,
    'pool_share', v_pool_share,
    'amb_share',  v_amb_share,
    'ambassador', v_ambassador_id
  );
END;
$$;
GRANT EXECUTE ON FUNCTION public.rpc_record_payment(text, text, integer, text, text, uuid, jsonb) TO service_role;

-- rpc_record_webhook: Webhook-Log
DROP FUNCTION IF EXISTS public.rpc_record_webhook(text, text, jsonb) CASCADE;
CREATE FUNCTION public.rpc_record_webhook(p_event_id text, p_event_type text, p_payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.stripe_webhooks(stripe_event_id, event_type, payload, status, processed_at)
  VALUES (p_event_id, p_event_type, p_payload, 'processed', now())
  ON CONFLICT(stripe_event_id) DO NOTHING;
  RETURN jsonb_build_object('ok', true);
END;
$$;
GRANT EXECUTE ON FUNCTION public.rpc_record_webhook(text, text, jsonb) TO service_role;

-- rpc_update_impact_pool: manuell / admin
DROP FUNCTION IF EXISTS public.rpc_update_impact_pool(integer, text) CASCADE;
CREATE FUNCTION public.rpc_update_impact_pool(p_amount integer, p_month text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_month text := COALESCE(p_month, to_char(now(), 'YYYY-MM'));
  v_pool  integer := (p_amount * 15) / 100;
BEGIN
  INSERT INTO public.stripe_impact_pool(month, total_inflow, project_share, company_share)
  VALUES (v_month, p_amount, v_pool, p_amount - v_pool)
  ON CONFLICT(month) DO UPDATE SET
    total_inflow  = public.stripe_impact_pool.total_inflow  + EXCLUDED.total_inflow,
    project_share = public.stripe_impact_pool.project_share + EXCLUDED.project_share,
    company_share = public.stripe_impact_pool.company_share + EXCLUDED.company_share,
    updated_at    = now();
  RETURN jsonb_build_object('ok', true, 'month', v_month, 'pool_share', v_pool);
END;
$$;
GRANT EXECUTE ON FUNCTION public.rpc_update_impact_pool(integer, text) TO service_role, authenticated;

-- rpc_record_ambassador_commission
DROP FUNCTION IF EXISTS public.rpc_record_ambassador_commission(uuid, integer, text, text) CASCADE;
CREATE FUNCTION public.rpc_record_ambassador_commission(
  p_ambassador_id uuid, p_amount integer,
  p_stripe_payment_id text DEFAULT NULL, p_currency text DEFAULT 'eur'
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.stripe_ambassador_commissions(ambassador_id, stripe_payment_id, amount, currency)
  VALUES (p_ambassador_id, p_stripe_payment_id, p_amount, p_currency);
  RETURN jsonb_build_object('ok', true, 'amount', p_amount);
END;
$$;
GRANT EXECUTE ON FUNCTION public.rpc_record_ambassador_commission(uuid, integer, text, text) TO service_role;

-- rpc_get_stripe_overview (SADB/EDB)
DROP FUNCTION IF EXISTS public.rpc_get_stripe_overview() CASCADE;
CREATE FUNCTION public.rpc_get_stripe_overview()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_month text := to_char(now(), 'YYYY-MM');
  v_total_payments integer;
  v_total_volume   integer;
  v_total_subs     integer;
  v_total_payouts  integer;
  v_pool_month     record;
  v_amb_pending    integer;
BEGIN
  SELECT COUNT(*)::integer, COALESCE(SUM(amount),0)::integer
    INTO v_total_payments, v_total_volume
    FROM public.stripe_payments WHERE status = 'succeeded';
  SELECT COUNT(*)::integer INTO v_total_subs FROM public.stripe_subscriptions WHERE status = 'active';
  SELECT COUNT(*)::integer INTO v_total_payouts FROM public.stripe_payouts WHERE status = 'paid';
  SELECT * INTO v_pool_month FROM public.stripe_impact_pool WHERE month = v_month;
  SELECT COALESCE(SUM(amount),0)::integer INTO v_amb_pending
    FROM public.stripe_ambassador_commissions WHERE status = 'pending';

  RETURN jsonb_build_object(
    'total_payments',    v_total_payments,
    'total_volume_eur',  ROUND(v_total_volume::numeric / 100, 2),
    'active_subs',       v_total_subs,
    'paid_payouts',      v_total_payouts,
    'impact_pool_month', v_pool_month.month,
    'impact_pool_eur',   ROUND(COALESCE(v_pool_month.total_inflow,0)::numeric / 100, 2),
    'project_share_eur', ROUND(COALESCE(v_pool_month.project_share,0)::numeric / 100, 2),
    'amb_pending_eur',   ROUND(v_amb_pending::numeric / 100, 2)
  );
END;
$$;
GRANT EXECUTE ON FUNCTION public.rpc_get_stripe_overview() TO authenticated, service_role;

-- rpc_get_stripe_payments (SADB)
DROP FUNCTION IF EXISTS public.rpc_get_stripe_payments(integer, integer) CASCADE;
CREATE FUNCTION public.rpc_get_stripe_payments(p_limit integer DEFAULT 50, p_offset integer DEFAULT 0)
RETURNS TABLE(
  id text, user_id uuid, amount_eur numeric, currency text,
  status text, payment_type text, description text,
  ambassador_id uuid, pool_share_eur numeric, amb_share_eur numeric,
  created_at timestamptz, username text, email text
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.stripe_payment_id::text,
    p.user_id,
    ROUND(p.amount::numeric/100, 2),
    p.currency,
    p.status,
    p.payment_type,
    p.description,
    p.ambassador_id,
    ROUND(p.impact_pool_share::numeric/100, 2),
    ROUND(p.ambassador_share::numeric/100, 2),
    p.created_at,
    pr.username,
    pr.email
  FROM public.stripe_payments p
  LEFT JOIN public.profiles pr ON p.user_id = pr.id
  ORDER BY p.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;
GRANT EXECUTE ON FUNCTION public.rpc_get_stripe_payments(integer, integer) TO authenticated, service_role;

-- rpc_get_ambassador_earnings (EDB)
DROP FUNCTION IF EXISTS public.rpc_get_ambassador_earnings(uuid) CASCADE;
CREATE FUNCTION public.rpc_get_ambassador_earnings(p_ambassador_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_pending integer;
  v_total_paid    integer;
  v_count         integer;
BEGIN
  SELECT
    COALESCE(SUM(CASE WHEN status='pending' THEN amount ELSE 0 END),0)::integer,
    COALESCE(SUM(CASE WHEN status='paid'    THEN amount ELSE 0 END),0)::integer,
    COUNT(*)::integer
  INTO v_total_pending, v_total_paid, v_count
  FROM public.stripe_ambassador_commissions
  WHERE ambassador_id = p_ambassador_id;

  RETURN jsonb_build_object(
    'pending_eur', ROUND(v_total_pending::numeric/100, 2),
    'paid_eur',    ROUND(v_total_paid::numeric/100, 2),
    'total_count', v_count
  );
END;
$$;
GRANT EXECUTE ON FUNCTION public.rpc_get_ambassador_earnings(uuid) TO authenticated, service_role;

NOTIFY pgrst, 'reload schema';
