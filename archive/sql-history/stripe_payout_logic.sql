
-- ═══════════════════════════════════════════════════════════════
-- HUI Stripe Auszahlungs-Logik (ARCH-006.1)
-- Fehlende Felder + 3 neue RPCs + Konsistenz-Garantien
-- ═══════════════════════════════════════════════════════════════
SET search_path = public;

-- ── 1. stripe_payouts fehlende Felder ergänzen ─────────────────
ALTER TABLE public.stripe_payouts
  ADD COLUMN IF NOT EXISTS ambassador_id uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS requested_at  timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS processed_at  timestamptz,
  ADD COLUMN IF NOT EXISTS failed_reason text;

-- Unique-Constraint sicherstellen (keine Doppel-Payouts)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'stripe_payouts_stripe_payout_id_key'
  ) THEN
    ALTER TABLE public.stripe_payouts ADD CONSTRAINT stripe_payouts_stripe_payout_id_key UNIQUE (stripe_payout_id);
  END IF;
END $$;

-- ── 2. stripe_ambassador_commissions: payout_id constraint ─────
-- Sicherstellung: payout_id verweist auf stripe_payouts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='stripe_ambassador_commissions' AND column_name='payout_id'
  ) THEN
    ALTER TABLE public.stripe_ambassador_commissions ADD COLUMN payout_id uuid;
  END IF;
END $$;

-- ── 3. rpc_request_payout ──────────────────────────────────────
-- Auszahlungsanfrage eines Ambassadors: summiert offene Provisionen
DROP FUNCTION IF EXISTS public.rpc_request_payout(uuid) CASCADE;
CREATE FUNCTION public.rpc_request_payout(p_ambassador_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_cent   integer;
  v_count        integer;
  v_payout_id    uuid;
  v_min_cent     integer := 2000;  -- 20 EUR Mindestbetrag
BEGIN
  -- Prüfen ob Ambassador existiert und confirmed ist
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = p_ambassador_id
      AND role = 'ambassador'
      AND ambassador_status = 'confirmed'
  ) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_an_ambassador');
  END IF;

  -- Offene Provisionen summieren (nur pending, keine bereits angeforderten)
  SELECT
    COALESCE(SUM(amount), 0)::integer,
    COUNT(*)::integer
  INTO v_total_cent, v_count
  FROM public.stripe_ambassador_commissions
  WHERE ambassador_id = p_ambassador_id
    AND status = 'pending'
    AND payout_id IS NULL;  -- noch keiner Auszahlung zugeordnet

  -- Mindestbetrag prüfen
  IF v_total_cent < v_min_cent THEN
    RETURN jsonb_build_object(
      'ok',           false,
      'error',        'below_minimum',
      'total_cent',   v_total_cent,
      'minimum_cent', v_min_cent,
      'total_eur',    ROUND(v_total_cent::numeric/100, 2),
      'minimum_eur',  ROUND(v_min_cent::numeric/100, 2)
    );
  END IF;

  -- Ausstehende Auszahlung prüfen (keine Doppel-Anfragen)
  IF EXISTS (
    SELECT 1 FROM public.stripe_payouts
    WHERE ambassador_id = p_ambassador_id
      AND status IN ('requested', 'pending')
  ) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'payout_already_pending');
  END IF;

  -- Auszahlungs-Eintrag erstellen
  INSERT INTO public.stripe_payouts(
    ambassador_id, amount, currency, status, payout_type, requested_at, metadata
  )
  VALUES (
    p_ambassador_id, v_total_cent, 'eur', 'requested', 'ambassador', now(),
    jsonb_build_object('commission_count', v_count)
  )
  RETURNING id INTO v_payout_id;

  -- Provisionen als "angefordert" markieren und payout_id setzen
  UPDATE public.stripe_ambassador_commissions
  SET status    = 'requested',
      payout_id = v_payout_id
  WHERE ambassador_id = p_ambassador_id
    AND status = 'pending'
    AND payout_id IS NULL;

  RETURN jsonb_build_object(
    'ok',            true,
    'payout_id',     v_payout_id,
    'amount_cent',   v_total_cent,
    'amount_eur',    ROUND(v_total_cent::numeric/100, 2),
    'commissions',   v_count,
    'status',        'requested'
  );
END;
$$;
GRANT EXECUTE ON FUNCTION public.rpc_request_payout(uuid) TO authenticated, service_role;

-- ── 4. rpc_get_payout_requests ─────────────────────────────────
-- SADB/EDB: alle Auszahlungsanfragen mit Ambassador-Details
DROP FUNCTION IF EXISTS public.rpc_get_payout_requests(text, integer, integer) CASCADE;
CREATE FUNCTION public.rpc_get_payout_requests(
  p_status text    DEFAULT NULL,   -- requested|pending|paid|failed|NULL=alle
  p_limit  integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
RETURNS TABLE(
  id              uuid,
  ambassador_id   uuid,
  username        text,
  display_name    text,
  email           text,
  amount_eur      numeric,
  currency        text,
  status          text,
  stripe_payout_id text,
  requested_at    timestamptz,
  processed_at    timestamptz,
  failed_reason   text,
  commission_count bigint
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.ambassador_id,
    pr.username,
    pr.display_name,
    pr.email,
    ROUND(p.amount::numeric/100, 2),
    p.currency,
    p.status,
    p.stripe_payout_id,
    p.requested_at,
    p.processed_at,
    p.failed_reason,
    COUNT(c.id)
  FROM public.stripe_payouts p
  LEFT JOIN public.profiles pr ON p.ambassador_id = pr.id
  LEFT JOIN public.stripe_ambassador_commissions c ON c.payout_id = p.id
  WHERE (p_status IS NULL OR p.status = p_status)
    AND p.payout_type = 'ambassador'
  GROUP BY p.id, pr.username, pr.display_name, pr.email
  ORDER BY p.requested_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;
GRANT EXECUTE ON FUNCTION public.rpc_get_payout_requests(text,integer,integer) TO authenticated, service_role;

-- ── 5. rpc_mark_commissions_paid ───────────────────────────────
-- Nach erfolgreichem Stripe-Payout: Provisionen als 'paid' markieren
DROP FUNCTION IF EXISTS public.rpc_mark_commissions_paid(uuid) CASCADE;
CREATE FUNCTION public.rpc_mark_commissions_paid(p_payout_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  UPDATE public.stripe_ambassador_commissions
  SET status = 'paid'
  WHERE payout_id = p_payout_id
    AND status IN ('pending', 'requested');

  GET DIAGNOSTICS v_count = ROW_COUNT;

  -- Payout auf paid setzen
  UPDATE public.stripe_payouts
  SET status       = 'paid',
      processed_at = now()
  WHERE id = p_payout_id;

  RETURN jsonb_build_object('ok', true, 'commissions_paid', v_count, 'payout_id', p_payout_id);
END;
$$;
GRANT EXECUTE ON FUNCTION public.rpc_mark_commissions_paid(uuid) TO service_role;

-- ── 6. rpc_fail_payout ─────────────────────────────────────────
-- Fehlgeschlagene Auszahlung: Provisionen zurück auf 'pending'
DROP FUNCTION IF EXISTS public.rpc_fail_payout(uuid, text) CASCADE;
CREATE FUNCTION public.rpc_fail_payout(p_payout_id uuid, p_reason text DEFAULT 'unknown')
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_count integer;
BEGIN
  UPDATE public.stripe_payouts
  SET status        = 'failed',
      failed_reason = p_reason,
      processed_at  = now()
  WHERE id = p_payout_id;

  -- Provisionen zurück auf pending setzen (erneuter Versuch möglich)
  UPDATE public.stripe_ambassador_commissions
  SET status    = 'pending',
      payout_id = NULL
  WHERE payout_id = p_payout_id
    AND status = 'requested';

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN jsonb_build_object('ok', true, 'commissions_reset', v_count, 'reason', p_reason);
END;
$$;
GRANT EXECUTE ON FUNCTION public.rpc_fail_payout(uuid, text) TO service_role;

-- ── 7. rpc_record_payout erweitern (failed_reason + processed_at) ─
DROP FUNCTION IF EXISTS public.rpc_record_payout(text,integer,text,text,text,timestamptz) CASCADE;
CREATE FUNCTION public.rpc_record_payout(
  p_stripe_payout_id text,
  p_amount           integer,
  p_currency         text        DEFAULT 'eur',
  p_status           text        DEFAULT 'pending',
  p_payout_type      text        DEFAULT 'platform',
  p_arrival_date     timestamptz DEFAULT NULL,
  p_failed_reason    text        DEFAULT NULL,
  p_ambassador_id    uuid        DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_internal_id uuid;
BEGIN
  -- Suche existierenden Eintrag via stripe_payout_id
  SELECT id INTO v_internal_id
  FROM public.stripe_payouts WHERE stripe_payout_id = p_stripe_payout_id;

  IF v_internal_id IS NOT NULL THEN
    -- Update
    UPDATE public.stripe_payouts SET
      status        = p_status,
      processed_at  = CASE WHEN p_status IN ('paid','failed') THEN now() ELSE processed_at END,
      failed_reason = COALESCE(p_failed_reason, failed_reason),
      arrival_date  = COALESCE(p_arrival_date, arrival_date)
    WHERE id = v_internal_id;

    -- Bei paid: Provisionen markieren
    IF p_status = 'paid' THEN
      PERFORM public.rpc_mark_commissions_paid(v_internal_id);
    END IF;
    -- Bei failed: Provisionen zurücksetzen
    IF p_status = 'failed' THEN
      PERFORM public.rpc_fail_payout(v_internal_id, COALESCE(p_failed_reason, 'stripe_failed'));
    END IF;

  ELSE
    -- Neu einfügen (z.B. Platform-Payout der nicht über request läuft)
    INSERT INTO public.stripe_payouts(
      stripe_payout_id, amount, currency, status, payout_type,
      arrival_date, ambassador_id, failed_reason,
      processed_at, requested_at
    )
    VALUES (
      p_stripe_payout_id, p_amount, p_currency, p_status, p_payout_type,
      p_arrival_date, p_ambassador_id, p_failed_reason,
      CASE WHEN p_status IN ('paid','failed') THEN now() ELSE NULL END,
      now()
    )
    ON CONFLICT(stripe_payout_id) DO UPDATE SET
      status        = EXCLUDED.status,
      processed_at  = CASE WHEN EXCLUDED.status IN ('paid','failed') THEN now() ELSE public.stripe_payouts.processed_at END,
      failed_reason = COALESCE(EXCLUDED.failed_reason, public.stripe_payouts.failed_reason),
      arrival_date  = COALESCE(EXCLUDED.arrival_date, public.stripe_payouts.arrival_date);
  END IF;

  -- Bei Ambassador-Payout: Provisionen als paid markieren
  IF p_status = 'paid' AND p_ambassador_id IS NOT NULL AND v_internal_id IS NULL THEN
    UPDATE public.stripe_ambassador_commissions
    SET status = 'paid'
    WHERE ambassador_id = p_ambassador_id
      AND status IN ('pending', 'requested')
      AND amount <= p_amount;
  END IF;

  RETURN jsonb_build_object(
    'ok',        true,
    'payout_id', p_stripe_payout_id,
    'status',    p_status,
    'amount',    p_amount
  );
END;
$$;
GRANT EXECUTE ON FUNCTION public.rpc_record_payout(text,integer,text,text,text,timestamptz,text,uuid) TO service_role, authenticated;

-- ── 8. rpc_get_ambassador_payout_summary ───────────────────────
-- Für App/Studio: komplette Übersicht eines Ambassadors
DROP FUNCTION IF EXISTS public.rpc_get_ambassador_payout_summary(uuid) CASCADE;
CREATE FUNCTION public.rpc_get_ambassador_payout_summary(p_ambassador_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pending_cent   integer;
  v_paid_cent      integer;
  v_requested_cent integer;
  v_failed_cnt     integer;
  v_payouts        jsonb;
BEGIN
  -- Provisions-Summen
  SELECT
    COALESCE(SUM(CASE WHEN status='pending'   THEN amount ELSE 0 END), 0)::integer,
    COALESCE(SUM(CASE WHEN status='paid'      THEN amount ELSE 0 END), 0)::integer,
    COALESCE(SUM(CASE WHEN status='requested' THEN amount ELSE 0 END), 0)::integer
  INTO v_pending_cent, v_paid_cent, v_requested_cent
  FROM public.stripe_ambassador_commissions
  WHERE ambassador_id = p_ambassador_id;

  -- Letzte Auszahlungen
  SELECT jsonb_agg(
    jsonb_build_object(
      'id',              p.id,
      'amount_eur',      ROUND(p.amount::numeric/100, 2),
      'status',          p.status,
      'stripe_payout_id',p.stripe_payout_id,
      'requested_at',    p.requested_at,
      'processed_at',    p.processed_at,
      'failed_reason',   p.failed_reason
    ) ORDER BY p.requested_at DESC
  ) INTO v_payouts
  FROM public.stripe_payouts p
  WHERE p.ambassador_id = p_ambassador_id AND p.payout_type = 'ambassador';

  RETURN jsonb_build_object(
    'ambassador_id',    p_ambassador_id,
    'available_eur',    ROUND(v_pending_cent::numeric/100, 2),
    'requested_eur',    ROUND(v_requested_cent::numeric/100, 2),
    'paid_eur',         ROUND(v_paid_cent::numeric/100, 2),
    'minimum_eur',      20.00,
    'can_request',      v_pending_cent >= 2000 AND NOT EXISTS(
      SELECT 1 FROM public.stripe_payouts
      WHERE ambassador_id = p_ambassador_id AND status IN ('requested','pending')
    ),
    'payouts',          COALESCE(v_payouts, '[]'::jsonb)
  );
END;
$$;
GRANT EXECUTE ON FUNCTION public.rpc_get_ambassador_payout_summary(uuid) TO authenticated, service_role;

NOTIFY pgrst, 'reload schema';
