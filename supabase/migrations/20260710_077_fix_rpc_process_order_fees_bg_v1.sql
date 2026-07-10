CREATE OR REPLACE FUNCTION public.rpc_process_order_fees(p_order_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order record;
  v_buyer record;
  v_amount_cents integer;
  v_talent_cents integer;
  v_hui_cents integer;
  v_company_cents integer;
  v_impact_cents integer;
  v_innov_cents integer;
  v_proj_cents integer;
  v_flex_cents integer;
  v_referral_valid boolean := false;
  v_referral_count integer;
  v_level text;
  v_rate numeric;
  v_commission_cents integer := 0;
  v_valid_until timestamptz;
  v_existing integer;
  v_dist_result jsonb;
  v_active_phase text;
BEGIN
  SELECT count(*) INTO v_existing FROM public.stripe_impact_pool WHERE order_id = p_order_id;
  IF v_existing > 0 THEN
    RETURN jsonb_build_object('ok', true, 'already_processed', true);
  END IF;

  SELECT o.id, o.customer_id, o.total_eur, o.stripe_payment_intent, o.ambassador_id, o.state
  INTO v_order FROM public.orders o WHERE o.id = p_order_id AND o.state = 'paid';
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'order_not_found_or_not_paid');
  END IF;

  v_amount_cents  := ROUND(v_order.total_eur * 100);
  v_hui_cents     := ROUND(v_amount_cents * 0.20);
  v_talent_cents  := v_amount_cents - v_hui_cents;
  v_company_cents := ROUND(v_hui_cents * 0.50);
  v_impact_cents  := ROUND(v_hui_cents * 0.30);
  v_innov_cents   := v_hui_cents - v_company_cents - v_impact_cents;
  v_proj_cents    := ROUND(v_impact_cents * 0.70);
  v_flex_cents    := v_impact_cents - v_proj_cents;
  v_active_phase  := COALESCE(public.rpc_get_active_phase(), 'phase1');

  SELECT id, referred_by, created_at INTO v_buyer
  FROM public.profiles WHERE id = v_order.customer_id;

  IF v_buyer.referred_by IS NOT NULL AND v_buyer.referred_by != ''
     AND v_buyer.referred_by::text != v_order.customer_id::text THEN
    v_valid_until := v_buyer.created_at + interval '365 days';
    v_referral_valid := (now() <= v_valid_until);
    IF v_referral_valid THEN
      SELECT COUNT(*)::integer INTO v_referral_count
      FROM public.profiles WHERE referred_by = v_buyer.referred_by;
      v_level := CASE
        WHEN v_referral_count >= 201 THEN 'gold'
        WHEN v_referral_count >= 51  THEN 'silber'
        WHEN v_referral_count >= 11  THEN 'bronze'
        ELSE 'starter' END;
      v_rate := CASE v_level
        WHEN 'gold' THEN 0.20 WHEN 'silber' THEN 0.15
        WHEN 'bronze' THEN 0.10 ELSE 0.05 END;
      v_commission_cents := ROUND(v_company_cents * v_rate);
      INSERT INTO public.stripe_ambassador_commissions(
        ambassador_id, referred_user_id, order_id, stripe_payment_id,
        amount, currency, rate, status, tier,
        commission_valid_until, commission_active,
        base_purchase_amount_cents, company_share_cents
      ) VALUES (
        v_buyer.referred_by::uuid, v_buyer.id, p_order_id, v_order.stripe_payment_intent,
        v_commission_cents, 'eur', v_rate, 'pending', v_level,
        v_valid_until, true, v_amount_cents, v_company_cents
      ) ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  INSERT INTO public.stripe_impact_pool (
    order_id, month, total_inflow, project_share, company_share,
    hui_company_eur, impact_pool_eur, innovation_fund_eur,
    impact_projects_eur, impact_flex_pool_eur, finance_model, company_phase,
    projekte_foerdern_eur, hui_weiterentwickeln_eur, neue_ideen_eur, qualitaet_sichern_eur,
    ambassador_id, source
  ) VALUES (
    p_order_id, to_char(now(),'YYYY-MM'),
    v_amount_cents, v_impact_cents, v_company_cents,
    ROUND(v_company_cents::numeric/100,2), ROUND(v_impact_cents::numeric/100,2),
    ROUND(v_innov_cents::numeric/100,2), ROUND(v_proj_cents::numeric/100,2),
    ROUND(v_flex_cents::numeric/100,2), 'balanced_growth_v1', v_active_phase,
    ROUND(v_proj_cents::numeric/100,2), ROUND(v_company_cents::numeric/100,2),
    ROUND(v_innov_cents::numeric/100,2), 0,
    CASE WHEN v_referral_valid THEN v_buyer.referred_by::uuid ELSE NULL END,
    'werk'
  );

  IF v_order.stripe_payment_intent IS NOT NULL THEN
    INSERT INTO public.stripe_payments(
      stripe_payment_id, order_id, amount, impact_pool_share, ambassador_share, payment_type, currency
    ) VALUES (
      v_order.stripe_payment_intent, p_order_id,
      ROUND(v_amount_cents::numeric/100,2), ROUND(v_impact_cents::numeric/100,2),
      ROUND(v_commission_cents::numeric/100,2), 'work', 'eur'
    ) ON CONFLICT (stripe_payment_id) DO NOTHING;
  END IF;

  IF v_innov_cents > 0 THEN
    INSERT INTO public.hui_innovation_fund (order_id, amount_eur, source, pool_month)
    VALUES (p_order_id, ROUND(v_innov_cents::numeric/100,2), 'werk', to_char(now(),'YYYY-MM'))
    ON CONFLICT DO NOTHING;
  END IF;

  IF v_flex_cents > 0 THEN
    INSERT INTO public.hui_impact_flex_pool (order_id, amount_eur, source, purpose, pool_month)
    VALUES (p_order_id, ROUND(v_flex_cents::numeric/100,2), 'werk', 'reserve', to_char(now(),'YYYY-MM'))
    ON CONFLICT DO NOTHING;
  END IF;

  v_dist_result := public.rpc_distribute_impact_to_projects(
    ROUND(v_proj_cents::numeric/100,2), p_order_id
  );

  RETURN jsonb_build_object(
    'ok', true, 'model', 'balanced_growth_v1', 'phase', v_active_phase,
    'amount_eur', ROUND(v_amount_cents::numeric/100,2),
    'talent_eur', ROUND(v_talent_cents::numeric/100,2),
    'hui_total_eur', ROUND(v_hui_cents::numeric/100,2),
    'company_eur', ROUND(v_company_cents::numeric/100,2),
    'impact_eur', ROUND(v_impact_cents::numeric/100,2),
    'innovation_eur', ROUND(v_innov_cents::numeric/100,2),
    'impact_projects_eur', ROUND(v_proj_cents::numeric/100,2),
    'impact_flex_pool_eur', ROUND(v_flex_cents::numeric/100,2),
    'ambassador_commission_eur', ROUND(v_commission_cents::numeric/100,2),
    'impact_distribution', v_dist_result
  );
END;
$$;
