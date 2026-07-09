-- IMPACT-VOTING-ENGINE-001 Phase 2 (2026-07-09)
-- rpc_process_order_fees: Distribution-Block additiv ergänzt
-- Kein Rewrite — identisch zur Vorgängerversion, nur RETURN-Block erweitert
-- um Aufruf von rpc_distribute_impact_to_projects(v_projekte_eur, p_order_id)

CREATE OR REPLACE FUNCTION public.rpc_process_order_fees(p_order_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_order        record;
  v_buyer        record;
  v_amount_cents integer;
  v_fee_cents    integer;
  v_impact_cents integer;
  v_company_cents integer;
  v_referral_valid boolean := false;
  v_referral_count integer;
  v_level        text;
  v_rate         numeric;
  v_commission_cents integer := 0;
  v_company_after_commission_cents integer;
  v_projekte_cents integer;
  v_hui_cents    integer;
  v_ideen_cents  integer;
  v_qualitaet_cents integer;
  v_valid_until  timestamptz;
  v_existing     integer;
  v_dist_result  jsonb;       -- NEU Phase 2: Distribution-Ergebnis
BEGIN
  SELECT count(*) INTO v_existing FROM public.stripe_impact_pool WHERE order_id = p_order_id;
  IF v_existing > 0 THEN
    RETURN jsonb_build_object('ok', true, 'already_processed', true);
  END IF;

  SELECT id, customer_id, total_eur, ambassador_id, stripe_payment_intent INTO v_order
  FROM public.orders WHERE id = p_order_id AND state = 'paid';
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'order_not_found_or_not_paid');
  END IF;

  v_amount_cents := ROUND(v_order.total_eur * 100);
  v_fee_cents     := ROUND(v_amount_cents * 0.15);
  v_impact_cents  := ROUND(v_fee_cents * 0.15);
  v_company_cents := v_fee_cents - v_impact_cents;

  SELECT id, referred_by, created_at INTO v_buyer FROM public.profiles WHERE id = v_order.customer_id;

  IF v_buyer.referred_by IS NOT NULL AND v_buyer.referred_by != '' THEN
    v_valid_until := v_buyer.created_at + interval '365 days';
    v_referral_valid := (now() <= v_valid_until);

    IF v_referral_valid THEN
      SELECT COUNT(*)::integer INTO v_referral_count
      FROM public.profiles WHERE referred_by = v_buyer.referred_by;

      v_level := CASE
        WHEN v_referral_count >= 201 THEN 'gold'
        WHEN v_referral_count >= 51  THEN 'silber'
        WHEN v_referral_count >= 11  THEN 'bronze'
        ELSE 'starter'
      END;

      v_rate := CASE v_level
        WHEN 'gold'    THEN 0.20
        WHEN 'silber'  THEN 0.15
        WHEN 'bronze'  THEN 0.10
        ELSE 0.05
      END;

      v_commission_cents := ROUND(v_company_cents * v_rate);

      INSERT INTO public.stripe_ambassador_commissions(
        ambassador_id, referred_user_id, order_id, stripe_payment_id,
        amount, currency, rate, status, tier,
        commission_valid_until, commission_active,
        base_purchase_amount_cents, company_share_cents
      ) VALUES (
        v_buyer.referred_by::uuid, v_buyer.id, p_order_id, v_order.stripe_payment_intent,
        v_commission_cents, 'eur', v_rate, 'pending', v_level,
        v_valid_until, true,
        v_amount_cents, v_company_cents
      );
    END IF;
  END IF;

  v_company_after_commission_cents := v_company_cents - v_commission_cents;

  v_projekte_cents  := ROUND(v_company_after_commission_cents * 0.40);
  v_hui_cents       := ROUND(v_company_after_commission_cents * 0.30);
  v_ideen_cents     := ROUND(v_company_after_commission_cents * 0.20);
  v_qualitaet_cents := v_company_after_commission_cents - v_projekte_cents - v_hui_cents - v_ideen_cents;

  INSERT INTO public.stripe_impact_pool(
    month, total_inflow, project_share, company_share,
    source, order_id, ambassador_id,
    projekte_foerdern_eur, hui_weiterentwickeln_eur, neue_ideen_eur, qualitaet_sichern_eur
  ) VALUES (
    to_char(now(), 'YYYY-MM'), v_fee_cents, v_impact_cents, v_company_after_commission_cents,
    'payment', p_order_id,
    CASE WHEN v_referral_valid THEN v_buyer.referred_by::uuid ELSE NULL END,
    ROUND(v_projekte_cents/100.0, 2), ROUND(v_hui_cents/100.0, 2),
    ROUND(v_ideen_cents/100.0, 2), ROUND(v_qualitaet_cents/100.0, 2)
  );

  IF v_order.stripe_payment_intent IS NOT NULL THEN
    INSERT INTO public.stripe_payments(
      id, user_id, stripe_payment_id, amount, currency, status,
      payment_type, ambassador_id, description, metadata,
      impact_pool_share, ambassador_share, created_at
    ) VALUES (
      v_order.stripe_payment_intent, v_order.customer_id, v_order.stripe_payment_intent,
      v_amount_cents, 'eur', 'succeeded',
      'work', CASE WHEN v_referral_valid THEN v_buyer.referred_by::uuid ELSE NULL END,
      'Order ' || p_order_id::text,
      jsonb_build_object('order_id', p_order_id),
      v_impact_cents, v_commission_cents, now()
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;

  UPDATE public.profiles
  SET first_transaction_at = now()
  WHERE id = v_order.customer_id
    AND first_transaction_at IS NULL;

  UPDATE public.orders SET
    company_share_eur = ROUND(v_company_cents/100.0, 2),
    ambassador_id = CASE WHEN v_referral_valid THEN v_buyer.referred_by::uuid ELSE NULL END,
    ambassador_commission_eur = CASE WHEN v_referral_valid THEN ROUND(v_commission_cents/100.0, 2) ELSE NULL END,
    ambassador_commission_applicable = v_referral_valid
  WHERE id = p_order_id;

  -- ── NEU Phase 2: Impact-Pool 50/30/20 an Top-3 Projekte verteilen ───────────
  -- v_projekte_cents = 40% des Unternehmensanteils (nach Ambassador-Provision)
  -- rpc_distribute_impact_to_projects: schreibt impact_distributions,
  --   updated current_amount_eur auf impact_applications, prüft is_completed
  SELECT public.rpc_distribute_impact_to_projects(
    ROUND(v_projekte_cents / 100.0, 2),
    p_order_id
  ) INTO v_dist_result;
  -- ────────────────────────────────────────────────────────────────────────────

  RETURN jsonb_build_object(
    'ok', true,
    'fee_eur', ROUND(v_fee_cents/100.0,2),
    'impact_eur', ROUND(v_impact_cents/100.0,2),
    'company_eur', ROUND(v_company_cents/100.0,2),
    'ambassador_commission_applicable', v_referral_valid,
    'ambassador_commission_eur', ROUND(v_commission_cents/100.0,2),
    'level', v_level,
    'rate', v_rate,
    'impact_distribution', v_dist_result
  );
END;
$$;
