-- Migration: 20260710_076_rpc_evaluate_phase_transition.sql
-- KPI-gesteuerter Phasenwechsel für Balanced Growth v1

CREATE OR REPLACE FUNCTION public.rpc_evaluate_phase_transition()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
DECLARE
  v_current_phase text;
  v_tx_count integer;
  v_revenue numeric;
  v_next_phase record;
  v_new_phase text;
BEGIN
  SELECT phase INTO v_current_phase FROM public.hui_finance_phases WHERE is_active = true LIMIT 1;

  -- Transaktionen letzter 30 Tage
  SELECT COUNT(*)::integer INTO v_tx_count
  FROM public.orders WHERE state = 'paid' AND created_at >= now() - interval '30 days';

  -- Umsatz letzter 30 Tage
  SELECT COALESCE(SUM(total_eur), 0) INTO v_revenue
  FROM public.orders WHERE state = 'paid' AND created_at >= now() - interval '30 days';

  -- Phase 1 -> Phase 2?
  IF v_current_phase = 'phase1' AND v_tx_count >= 1000 AND v_revenue >= 100000 THEN
    UPDATE public.hui_finance_phases SET is_active = false WHERE is_active = true;
    UPDATE public.hui_finance_phases SET is_active = true, activated_at = now() WHERE phase = 'phase2';
    v_new_phase := 'phase2';
  -- Phase 2 -> Phase 3?
  ELSIF v_current_phase = 'phase2' AND v_tx_count >= 5000 AND v_revenue >= 500000 THEN
    UPDATE public.hui_finance_phases SET is_active = false WHERE is_active = true;
    UPDATE public.hui_finance_phases SET is_active = true, activated_at = now() WHERE phase = 'phase3';
    v_new_phase := 'phase3';
  ELSE
    v_new_phase := v_current_phase;
  END IF;

  RETURN jsonb_build_object(
    'evaluated_at', now(),
    'current_phase', v_current_phase,
    'new_phase', v_new_phase,
    'phase_changed', (v_new_phase != v_current_phase),
    'monthly_tx_count', v_tx_count,
    'monthly_revenue_eur', v_revenue,
    'model', 'balanced_growth_v1'
  );
END;
$func$;
