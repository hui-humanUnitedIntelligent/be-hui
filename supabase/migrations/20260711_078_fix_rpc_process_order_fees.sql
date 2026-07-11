CREATE OR REPLACE FUNCTION public.rpc_process_order_fees(p_order_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order          RECORD;
  v_buyer          RECORD;
  v_amount_cents   BIGINT;
  v_hui_cents      BIGINT;
  v_talent_cents   BIGINT;
  v_impact_cents   BIGINT;
  v_company_cents  BIGINT;
  v_innov_cents    BIGINT;
  v_proj_cents     BIGINT;
  v_flex_cents     BIGINT;
  v_commission_cents BIGINT;
  v_referral_valid BOOLEAN := FALSE;
  v_existing       RECORD;
  v_phase          RECORD;
  v_dist_result    JSONB;
  v_month          TEXT;
BEGIN
  -- Idempotenz-Check: bereits verarbeitet?
  SELECT id INTO v_existing FROM public.stripe_impact_pool WHERE order_id = p_order_id LIMIT 1;
  IF FOUND THEN
    RETURN jsonb_build_object('ok', true, 'skipped', true, 'reason', 'already_processed');
  END IF;

  -- Order laden
  SELECT o.*, o.total_eur AS amount_eur INTO v_order
  FROM public.orders o WHERE o.id = p_order_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'order_not_found');
  END IF;

  -- Käufer laden
  SELECT p.referred_by, p.created_at INTO v_buyer
  FROM public.profiles p WHERE p.id = v_order.customer_id;

  -- Berechnung (Balanced Growth v1: 80/20)
  v_amount_cents  := ROUND(v_order.amount_eur::numeric * 100);
  v_hui_cents     := ROUND(v_amount_cents * 0.20);
  v_talent_cents  := v_amount_cents - v_hui_cents;
  v_company_cents := ROUND(v_hui_cents * 0.50);
  v_impact_cents  := ROUND(v_hui_cents * 0.30);
  v_innov_cents   := v_hui_cents - v_company_cents - v_impact_cents;
  v_proj_cents    := ROUND(v_impact_cents * 0.70);
  v_flex_cents    := v_impact_cents - v_proj_cents;
  v_commission_cents := v_hui_cents;

  -- Referral-Check (365 Tage)
  IF v_buyer.referred_by IS NOT NULL THEN
    v_referral_valid := (NOW() - v_buyer.created_at) < INTERVAL '365 days';
  END IF;

  -- Aktive Phase holen
  SELECT * INTO v_phase FROM public.hui_finance_phases WHERE is_active = TRUE LIMIT 1;

  -- Monat bestimmen
  v_month := TO_CHAR(COALESCE(v_order.created_at, NOW()), 'YYYY-MM');

  -- stripe_impact_pool INSERT — nur tatsächlich existierende Spalten
  INSERT INTO public.stripe_impact_pool(
    order_id,
    month,
    total_inflow,
    source,
    hui_company_eur,
    impact_pool_eur,
    innovation_fund_eur,
    impact_projects_eur,
    impact_flex_pool_eur,
    finance_model,
    company_phase
  ) VALUES (
    p_order_id,
    v_month,
    v_amount_cents::integer,
    'order',
    ROUND(v_company_cents::numeric / 100, 2),
    ROUND(v_impact_cents::numeric  / 100, 2),
    ROUND(v_innov_cents::numeric   / 100, 2),
    ROUND(v_proj_cents::numeric    / 100, 2),
    ROUND(v_flex_cents::numeric    / 100, 2),
    'balanced_growth_v1',
    COALESCE(v_phase.phase, 'aufbau')
  );

  -- stripe_payments INSERT/UPDATE (status='succeeded')
  IF v_order.stripe_payment_intent IS NOT NULL THEN
    INSERT INTO public.stripe_payments(
      stripe_payment_id,
      amount,
      impact_pool_share,
      ambassador_share,
      payment_type,
      currency,
      status,
      metadata
    ) VALUES (
      v_order.stripe_payment_intent,
      ROUND(v_amount_cents::numeric / 100, 2),
      ROUND(v_impact_cents::numeric  / 100, 2),
      ROUND(v_commission_cents::numeric / 100, 2),
      'work',
      'eur',
      'succeeded',
      jsonb_build_object(
        'order_id',     p_order_id::text,
        'finance_model','balanced_growth_v1'
      )
    )
    ON CONFLICT (stripe_payment_id) DO UPDATE
      SET status            = 'succeeded',
          amount            = EXCLUDED.amount,
          impact_pool_share = EXCLUDED.impact_pool_share;
  END IF;

  -- Impact-Verteilung auf Projekte
  BEGIN
    SELECT rpc_distribute_impact_to_projects(
      ROUND(v_proj_cents::numeric / 100, 2),
      p_order_id
    ) INTO v_dist_result;
  EXCEPTION WHEN OTHERS THEN
    v_dist_result := jsonb_build_object('error', SQLERRM);
  END;

  RETURN jsonb_build_object(
    'ok',               true,
    'order_id',         p_order_id,
    'amount_eur',       ROUND(v_amount_cents::numeric  / 100, 2),
    'talent_eur',       ROUND(v_talent_cents::numeric  / 100, 2),
    'hui_eur',          ROUND(v_hui_cents::numeric     / 100, 2),
    'company_eur',      ROUND(v_company_cents::numeric / 100, 2),
    'impact_eur',       ROUND(v_impact_cents::numeric  / 100, 2),
    'innovation_eur',   ROUND(v_innov_cents::numeric   / 100, 2),
    'proj_eur',         ROUND(v_proj_cents::numeric    / 100, 2),
    'flex_eur',         ROUND(v_flex_cents::numeric    / 100, 2),
    'referral_valid',   v_referral_valid,
    'impact_distribution', v_dist_result
  );
END;
$$;
