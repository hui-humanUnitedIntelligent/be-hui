-- ═══════════════════════════════════════════════════════════════════
-- ARCH-006.1 — Unified Transactions Layer
-- rpc_get_all_transactions + rpc_get_transaction_details
-- Single Source of Truth: stripe_payments, stripe_refunds, stripe_subscriptions,
-- stripe_ambassador_commissions, stripe_payouts. Keine Shadow States.
-- ═══════════════════════════════════════════════════════════════════
SET search_path = public;

-- ── 0) Additive Erweiterung rpc_record_payment: p_metadata (optional, Default '{}')
--       Rein additiv — bestehende Aufrufe ohne diesen Parameter funktionieren unverändert.
CREATE OR REPLACE FUNCTION public.rpc_record_payment(
  p_stripe_payment_id text,
  p_stripe_customer_id text,
  p_amount integer,
  p_currency text DEFAULT 'eur'::text,
  p_payment_type text DEFAULT 'work'::text,
  p_ambassador_id uuid DEFAULT NULL::uuid,
  p_description text DEFAULT NULL::text,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
    payment_type, ambassador_id, description, metadata, created_at
  )
  VALUES (
    p_stripe_payment_id, v_user_id, p_amount, p_currency, 'succeeded',
    p_payment_type, p_ambassador_id, p_description, COALESCE(p_metadata, '{}'::jsonb), now()
  )
  ON CONFLICT(id) DO UPDATE SET
    status        = 'succeeded',
    payment_type  = EXCLUDED.payment_type,
    ambassador_id = COALESCE(EXCLUDED.ambassador_id,  public.stripe_payments.ambassador_id),
    description   = COALESCE(EXCLUDED.description,    public.stripe_payments.description),
    user_id       = COALESCE(EXCLUDED.user_id,        public.stripe_payments.user_id),
    metadata      = CASE WHEN EXCLUDED.metadata = '{}'::jsonb THEN public.stripe_payments.metadata
                         ELSE public.stripe_payments.metadata || EXCLUDED.metadata END;

  v_pool_share := GREATEST((p_amount * 0.15)::integer, 1);
  PERFORM public.rpc_update_impact_pool(v_pool_share);

  IF p_ambassador_id IS NOT NULL THEN
    v_amb_share := GREATEST((p_amount * 0.05)::integer, 1);
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
$function$;

-- ── 1) rpc_get_all_transactions ─────────────────────────────────────────────
-- Vereinheitlichte Sicht über alle 5 Stripe-Tabellen. Beträge in EUR (aus Cent).
-- p_filter: all | completed | pending | failed | refund | subscription |
--           work | talent | project | donation | commission | payout
DROP FUNCTION IF EXISTS public.rpc_get_all_transactions(text, integer, integer, integer);
CREATE OR REPLACE FUNCTION public.rpc_get_all_transactions(
  p_filter text    DEFAULT 'all',
  p_days   integer DEFAULT NULL,
  p_limit  integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_since timestamptz;
  v_rows  jsonb;
  v_total integer;
BEGIN
  v_since := CASE WHEN p_days IS NOT NULL THEN now() - (p_days || ' days')::interval ELSE NULL END;

  WITH unified AS (
    -- Zahlungen (Werke, Talente, Projekte, Spenden, Abo-Erstzahlungen, Einmalzahlungen)
    SELECT
      p.id::text                                   AS row_id,
      'payment'                                     AS record_type,
      COALESCE(p.payment_type, 'one_time')          AS category,
      p.status                                      AS status,
      ROUND(p.amount / 100.0, 2)                    AS amount,
      p.currency                                    AS currency,
      p.user_id                                     AS user_id,
      p.ambassador_id                               AS ambassador_id,
      NULLIF(p.metadata->>'work_id','')::uuid       AS work_id,
      NULLIF(p.metadata->>'talent_id','')::uuid     AS talent_id,
      NULLIF(p.metadata->>'project_id','')::uuid    AS project_id,
      ROUND(COALESCE(p.impact_pool_share,0) / 100.0, 2) AS impact_share,
      ROUND(COALESCE(p.ambassador_share,0) / 100.0, 2)  AS commission_amount,
      p.id::text                                    AS stripe_payment_intent_id,
      p.stripe_charge_id                            AS stripe_charge_id,
      p.description                                 AS description,
      p.metadata                                    AS metadata,
      p.created_at                                  AS created_at
    FROM public.stripe_payments p

    UNION ALL

    -- Rückerstattungen
    SELECT
      r.id::text, 'refund', 'refund', COALESCE(r.status,'succeeded'),
      ROUND(r.amount / 100.0, 2), r.currency,
      r.user_id, NULL::uuid, NULL::uuid, NULL::uuid, NULL::uuid,
      ROUND(COALESCE(r.pool_adjustment,0) / -100.0, 2),
      ROUND(COALESCE(r.ambassador_adjustment,0) / -100.0, 2),
      r.stripe_payment_id, r.stripe_charge_id, r.reason,
      jsonb_build_object('original_payment_id', r.stripe_payment_id),
      r.created_at
    FROM public.stripe_refunds r

    UNION ALL

    -- Abonnements
    SELECT
      s.id::text, 'subscription', 'subscription', s.status,
      ROUND(COALESCE(s.amount,0) / 100.0, 2), s.currency,
      s.user_id, NULL::uuid, NULL::uuid, NULL::uuid, NULL::uuid,
      NULL::numeric, NULL::numeric,
      s.stripe_subscription_id, NULL::text, s.plan_name,
      s.metadata, s.created_at
    FROM public.stripe_subscriptions s

    UNION ALL

    -- Ambassador-Provisionen
    SELECT
      c.id::text, 'commission', 'commission', c.status,
      ROUND(c.amount / 100.0, 2), c.currency,
      c.referred_user_id, c.ambassador_id, NULL::uuid, NULL::uuid, NULL::uuid,
      NULL::numeric, ROUND(c.amount / 100.0, 2),
      c.stripe_payment_id, NULL::text, 'Ambassador-Provision (' || (c.rate*100)::text || '%)',
      jsonb_build_object('tier', c.tier, 'rate', c.rate),
      c.created_at
    FROM public.stripe_ambassador_commissions c

    UNION ALL

    -- Auszahlungen
    SELECT
      po.id::text, 'payout', 'payout', po.status,
      ROUND(po.amount / 100.0, 2), po.currency,
      po.user_id, po.ambassador_id, NULL::uuid, NULL::uuid, NULL::uuid,
      NULL::numeric, NULL::numeric,
      po.stripe_payout_id, NULL::text, po.description,
      po.metadata, po.created_at
    FROM public.stripe_payouts po
  ),
  filtered AS (
    SELECT * FROM unified u
    WHERE (v_since IS NULL OR u.created_at >= v_since)
      AND (
        p_filter = 'all'
        OR (p_filter = 'completed'   AND u.status IN ('succeeded','active','paid'))
        OR (p_filter = 'pending'     AND u.status IN ('pending','requested','incomplete'))
        OR (p_filter = 'failed'      AND u.status IN ('failed'))
        OR (p_filter = 'refund'      AND u.record_type = 'refund')
        OR (p_filter = 'subscription'AND u.record_type = 'subscription')
        OR (p_filter = 'commission'  AND u.record_type = 'commission')
        OR (p_filter = 'payout'      AND u.record_type = 'payout')
        OR (p_filter = 'work'        AND u.category = 'work')
        OR (p_filter = 'talent'      AND u.category = 'talent')
        OR (p_filter = 'project'     AND u.category = 'project')
        OR (p_filter = 'donation'    AND u.category = 'donation')
      )
  )
  SELECT count(*) INTO v_total FROM filtered;

  WITH unified AS (
    SELECT
      p.id::text                                   AS row_id,
      'payment'                                     AS record_type,
      COALESCE(p.payment_type, 'one_time')          AS category,
      p.status                                      AS status,
      ROUND(p.amount / 100.0, 2)                    AS amount,
      p.currency                                    AS currency,
      p.user_id                                     AS user_id,
      p.ambassador_id                               AS ambassador_id,
      NULLIF(p.metadata->>'work_id','')::uuid       AS work_id,
      NULLIF(p.metadata->>'talent_id','')::uuid     AS talent_id,
      NULLIF(p.metadata->>'project_id','')::uuid    AS project_id,
      ROUND(COALESCE(p.impact_pool_share,0) / 100.0, 2) AS impact_share,
      ROUND(COALESCE(p.ambassador_share,0) / 100.0, 2)  AS commission_amount,
      p.id::text                                    AS stripe_payment_intent_id,
      p.stripe_charge_id                            AS stripe_charge_id,
      p.description                                 AS description,
      p.metadata                                    AS metadata,
      p.created_at                                  AS created_at
    FROM public.stripe_payments p

    UNION ALL
    SELECT
      r.id::text, 'refund', 'refund', COALESCE(r.status,'succeeded'),
      ROUND(r.amount / 100.0, 2), r.currency,
      r.user_id, NULL::uuid, NULL::uuid, NULL::uuid, NULL::uuid,
      ROUND(COALESCE(r.pool_adjustment,0) / -100.0, 2),
      ROUND(COALESCE(r.ambassador_adjustment,0) / -100.0, 2),
      r.stripe_payment_id, r.stripe_charge_id, r.reason,
      jsonb_build_object('original_payment_id', r.stripe_payment_id),
      r.created_at
    FROM public.stripe_refunds r

    UNION ALL
    SELECT
      s.id::text, 'subscription', 'subscription', s.status,
      ROUND(COALESCE(s.amount,0) / 100.0, 2), s.currency,
      s.user_id, NULL::uuid, NULL::uuid, NULL::uuid, NULL::uuid,
      NULL::numeric, NULL::numeric,
      s.stripe_subscription_id, NULL::text, s.plan_name,
      s.metadata, s.created_at
    FROM public.stripe_subscriptions s

    UNION ALL
    SELECT
      c.id::text, 'commission', 'commission', c.status,
      ROUND(c.amount / 100.0, 2), c.currency,
      c.referred_user_id, c.ambassador_id, NULL::uuid, NULL::uuid, NULL::uuid,
      NULL::numeric, ROUND(c.amount / 100.0, 2),
      c.stripe_payment_id, NULL::text, 'Ambassador-Provision (' || (c.rate*100)::text || '%)',
      jsonb_build_object('tier', c.tier, 'rate', c.rate),
      c.created_at
    FROM public.stripe_ambassador_commissions c

    UNION ALL
    SELECT
      po.id::text, 'payout', 'payout', po.status,
      ROUND(po.amount / 100.0, 2), po.currency,
      po.user_id, po.ambassador_id, NULL::uuid, NULL::uuid, NULL::uuid,
      NULL::numeric, NULL::numeric,
      po.stripe_payout_id, NULL::text, po.description,
      po.metadata, po.created_at
    FROM public.stripe_payouts po
  ),
  filtered AS (
    SELECT * FROM unified u
    WHERE (v_since IS NULL OR u.created_at >= v_since)
      AND (
        p_filter = 'all'
        OR (p_filter = 'completed'   AND u.status IN ('succeeded','active','paid'))
        OR (p_filter = 'pending'     AND u.status IN ('pending','requested','incomplete'))
        OR (p_filter = 'failed'      AND u.status IN ('failed'))
        OR (p_filter = 'refund'      AND u.record_type = 'refund')
        OR (p_filter = 'subscription'AND u.record_type = 'subscription')
        OR (p_filter = 'commission'  AND u.record_type = 'commission')
        OR (p_filter = 'payout'      AND u.record_type = 'payout')
        OR (p_filter = 'work'        AND u.category = 'work')
        OR (p_filter = 'talent'      AND u.category = 'talent')
        OR (p_filter = 'project'     AND u.category = 'project')
        OR (p_filter = 'donation'    AND u.category = 'donation')
      )
  ),
  paged AS (
    SELECT * FROM filtered ORDER BY created_at DESC LIMIT p_limit OFFSET p_offset
  ),
  enriched AS (
    SELECT
      pg.*,
      up.display_name  AS user_name,
      up.username       AS user_username,
      up.email          AS user_email,
      ap.display_name  AS ambassador_name,
      ap.username       AS ambassador_username,
      w.title           AS work_title,
      pr.project_name   AS project_title
    FROM paged pg
    LEFT JOIN public.profiles up ON up.id = pg.user_id
    LEFT JOIN public.profiles ap ON ap.id = pg.ambassador_id
    LEFT JOIN public.works w ON w.id = pg.work_id
    LEFT JOIN public.impact_applications pr ON pr.id = pg.project_id
  )
  SELECT jsonb_agg(to_jsonb(e.*) ORDER BY e.created_at DESC) INTO v_rows FROM enriched e;

  RETURN jsonb_build_object(
    'ok', true,
    'total', v_total,
    'limit', p_limit,
    'offset', p_offset,
    'transactions', COALESCE(v_rows, '[]'::jsonb)
  );
END;
$function$;

-- ── 2) rpc_get_transaction_details ──────────────────────────────────────────
-- Volle Detailauflösung eines einzelnen Datensatzes (inkl. verknüpfter Refunds/Commissions)
DROP FUNCTION IF EXISTS public.rpc_get_transaction_details(text, text);
CREATE OR REPLACE FUNCTION public.rpc_get_transaction_details(
  p_row_id text,
  p_record_type text DEFAULT 'payment'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_result jsonb;
BEGIN
  IF p_record_type = 'payment' THEN
    SELECT to_jsonb(x.*) INTO v_result
    FROM (
      SELECT
        p.*,
        up.display_name AS user_name, up.username AS user_username, up.email AS user_email, up.phone AS user_phone,
        ap.display_name AS ambassador_name, ap.username AS ambassador_username,
        w.title AS work_title,
        pr.project_name AS project_title,
        (SELECT jsonb_agg(to_jsonb(r.*)) FROM public.stripe_refunds r WHERE r.stripe_payment_id = p.id) AS refunds,
        (SELECT jsonb_agg(to_jsonb(c.*)) FROM public.stripe_ambassador_commissions c WHERE c.stripe_payment_id = p.id) AS commissions
      FROM public.stripe_payments p
      LEFT JOIN public.profiles up ON up.id = p.user_id
      LEFT JOIN public.profiles ap ON ap.id = p.ambassador_id
      LEFT JOIN public.works w ON w.id = NULLIF(p.metadata->>'work_id','')::uuid
      LEFT JOIN public.impact_applications pr ON pr.id = NULLIF(p.metadata->>'project_id','')::uuid
      WHERE p.id = p_row_id
    ) x;
  ELSIF p_record_type = 'refund' THEN
    SELECT to_jsonb(x.*) INTO v_result
    FROM (
      SELECT r.*, up.display_name AS user_name, up.email AS user_email
      FROM public.stripe_refunds r
      LEFT JOIN public.profiles up ON up.id = r.user_id
      WHERE r.id::text = p_row_id
    ) x;
  ELSIF p_record_type = 'subscription' THEN
    SELECT to_jsonb(x.*) INTO v_result
    FROM (
      SELECT s.*, up.display_name AS user_name, up.email AS user_email
      FROM public.stripe_subscriptions s
      LEFT JOIN public.profiles up ON up.id = s.user_id
      WHERE s.id::text = p_row_id
    ) x;
  ELSIF p_record_type = 'commission' THEN
    SELECT to_jsonb(x.*) INTO v_result
    FROM (
      SELECT c.*, ap.display_name AS ambassador_name, ap.email AS ambassador_email
      FROM public.stripe_ambassador_commissions c
      LEFT JOIN public.profiles ap ON ap.id = c.ambassador_id
      WHERE c.id::text = p_row_id
    ) x;
  ELSIF p_record_type = 'payout' THEN
    SELECT to_jsonb(x.*) INTO v_result
    FROM (
      SELECT po.*, ap.display_name AS ambassador_name, ap.email AS ambassador_email
      FROM public.stripe_payouts po
      LEFT JOIN public.profiles ap ON ap.id = po.ambassador_id
      WHERE po.id::text = p_row_id
    ) x;
  END IF;

  IF v_result IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_found');
  END IF;

  RETURN jsonb_build_object('ok', true, 'data', v_result);
END;
$function$;

NOTIFY pgrst, 'reload schema';
