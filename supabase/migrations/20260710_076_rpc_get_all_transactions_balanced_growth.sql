CREATE OR REPLACE FUNCTION public.rpc_get_all_transactions(
  p_filter  text    DEFAULT 'all',
  p_days    integer DEFAULT NULL,
  p_limit   integer DEFAULT 50,
  p_offset  integer DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_where     text  := '';
  v_date_sql  text  := '';
  v_sql       text;
  v_count_sql text;
  v_result    jsonb;
  v_total     bigint;
BEGIN
  IF p_days IS NOT NULL AND p_days > 0 THEN
    v_date_sql := format(' AND sp.created_at >= now() - interval ''%s days''', p_days);
  END IF;

  CASE p_filter
    WHEN 'succeeded', 'completed', 'paid' THEN
      v_where := ' AND sp.status IN (''succeeded'',''paid'',''active'',''completed'')';
    WHEN 'pending' THEN
      v_where := ' AND sp.status IN (''pending'',''pending_payment'',''requires_payment_method'')';
    WHEN 'refunded', 'cancelled' THEN
      v_where := ' AND sp.status IN (''refunded'',''cancelled'',''canceled'')';
    WHEN 'payment' THEN
      v_where := ' AND sp.payment_type = ''werk_purchase''';
    WHEN 'talent_booking' THEN
      v_where := ' AND sp.payment_type = ''talent_booking''';
    ELSE
      v_where := '';
  END CASE;

  v_count_sql := format(
    'SELECT count(*) FROM stripe_payments sp WHERE true%s%s',
    v_where, v_date_sql
  );
  EXECUTE v_count_sql INTO v_total;

  v_sql := format(
    'SELECT
       sp.id                          AS row_id,
       sp.status,
       sp.user_id,
       sp.amount                      AS amount,
       sp.currency,
       sp.payment_type                AS category,
       sp.created_at,
       sp.description,
       sp.stripe_charge_id,
       sp.stripe_payment_id           AS stripe_payment_intent_id,
       sp.ambassador_id,
       sp.impact_pool_share           AS impact_share,
       sp.ambassador_share            AS commission_amount,
       sp.metadata,
       -- Balanced Growth Felder aus stripe_impact_pool (bereits in EUR)
       CASE WHEN sip.total_inflow IS NOT NULL
         THEN (sip.total_inflow / 100.0) ELSE NULL END AS total_inflow,
       sip.hui_company_eur            AS hui_company_eur,
       sip.impact_pool_eur            AS impact_pool_eur,
       sip.innovation_fund_eur        AS innovation_fund_eur,
       sip.impact_projects_eur        AS impact_projects_eur,
       sip.impact_flex_pool_eur       AS impact_flex_pool_eur,
       -- Talent-Anteil (80%% des Brutto, total_inflow in Cent)
       CASE WHEN sip.total_inflow IS NOT NULL
         THEN round((sip.total_inflow / 100.0 * 0.80)::numeric, 2) ELSE NULL END AS talent_share_eur,
       sip.finance_model,
       sip.company_phase,
       CASE sp.payment_type
         WHEN ''werk_purchase''   THEN ''payment''
         WHEN ''talent_booking''  THEN ''booking''
         WHEN ''membership''      THEN ''membership''
         ELSE ''payment''
       END                            AS record_type,
       NULL::text AS user_name,
       NULL::text AS user_email,
       NULL::text AS user_username,
       NULL::text AS ambassador_name,
       NULL::text AS ambassador_username,
       NULL::uuid AS work_id,
       NULL::uuid AS project_id,
       NULL::uuid AS talent_id,
       NULL::text AS work_title,
       NULL::text AS project_title
     FROM stripe_payments sp
     LEFT JOIN stripe_impact_pool sip ON sip.order_id = (sp.metadata->>''order_id'')::uuid
     WHERE true%s%s
     ORDER BY sp.created_at DESC
     LIMIT %s OFFSET %s',
    v_where, v_date_sql, p_limit, p_offset
  );

  EXECUTE format(
    'SELECT jsonb_build_object(
       ''ok'', true,
       ''total'', %L::bigint,
       ''limit'', %s,
       ''offset'', %s,
       ''transactions'', coalesce((SELECT jsonb_agg(t.*) FROM (%s) t), ''[]''::jsonb)
     )',
    v_total, p_limit, p_offset, v_sql
  ) INTO v_result;

  RETURN v_result;
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('ok', false, 'error', SQLERRM);
END;
$$;
