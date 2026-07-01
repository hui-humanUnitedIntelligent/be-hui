
-- ═══════════════════════════════════════════════════════════════
-- HUI Stripe Checkout RPCs (ARCH-006.1)
-- rpc_create_checkout_session  → Stripe Checkout URL
-- rpc_create_payment_intent    → Stripe Payment Intent
-- ═══════════════════════════════════════════════════════════════
SET search_path = public;

-- ── stripe_payments: payment_type ENUM/Text sichern ───────────
-- Sicherstellen dass payment_type Spalte existiert
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stripe_payments' AND column_name = 'payment_type'
  ) THEN
    ALTER TABLE public.stripe_payments ADD COLUMN payment_type text DEFAULT 'work';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stripe_payments' AND column_name = 'checkout_session_id'
  ) THEN
    ALTER TABLE public.stripe_payments ADD COLUMN checkout_session_id text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stripe_payments' AND column_name = 'description'
  ) THEN
    ALTER TABLE public.stripe_payments ADD COLUMN description text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stripe_payments' AND column_name = 'ambassador_id'
  ) THEN
    ALTER TABLE public.stripe_payments ADD COLUMN ambassador_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ── stripe_pending_checkouts: für session-tracking ────────────
CREATE TABLE IF NOT EXISTS public.stripe_pending_checkouts (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid        REFERENCES public.profiles(id) ON DELETE CASCADE,
  ambassador_id       uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  payment_type        text        NOT NULL,
  amount              integer     NOT NULL,
  currency            text        NOT NULL DEFAULT 'eur',
  stripe_session_id   text        UNIQUE,
  stripe_intent_id    text        UNIQUE,
  description         text,
  metadata            jsonb       DEFAULT '{}',
  status              text        NOT NULL DEFAULT 'created',
  success_url         text,
  cancel_url          text,
  created_at          timestamptz DEFAULT now(),
  expires_at          timestamptz DEFAULT (now() + interval '2 hours')
);

-- ── rpc_create_checkout_session ────────────────────────────────
-- Erstellt eine Stripe Checkout Session via Edge Function / direkte Stripe API
-- Die App leitet den Nutzer zu data.url weiter
DROP FUNCTION IF EXISTS public.rpc_create_checkout_session(uuid,integer,text,text,text,text,uuid,text,jsonb) CASCADE;
CREATE FUNCTION public.rpc_create_checkout_session(
  p_user_id       uuid,
  p_amount        integer,
  p_currency      text        DEFAULT 'eur',
  p_payment_type  text        DEFAULT 'donation',
  p_success_url   text        DEFAULT 'https://be-hui.com/checkout/success',
  p_cancel_url    text        DEFAULT 'https://be-hui.com',
  p_ambassador_id uuid        DEFAULT NULL,
  p_description   text        DEFAULT NULL,
  p_metadata      jsonb       DEFAULT '{}'
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pending_id  uuid;
  v_mode        text := 'payment';   -- 'payment' oder 'subscription'
BEGIN
  -- Abo-Modus bei subscription-Typen
  IF p_payment_type IN ('subscription', 'impact_subscription') THEN
    v_mode := 'subscription';
  END IF;

  -- Pending-Eintrag erstellen (wird nach Webhook-Bestätigung gelöscht)
  INSERT INTO public.stripe_pending_checkouts(
    user_id, ambassador_id, payment_type, amount, currency,
    description, metadata, success_url, cancel_url, status
  )
  VALUES (
    p_user_id, p_ambassador_id, p_payment_type, p_amount, p_currency,
    p_description, p_metadata, p_success_url, p_cancel_url, 'created'
  )
  RETURNING id INTO v_pending_id;

  -- Rückgabe: App ruft Stripe direkt via SDK auf
  -- Die eigentliche Session wird client-seitig oder via Edge Function erstellt
  -- Diese RPC liefert die nötigen Parameter strukturiert zurück
  RETURN jsonb_build_object(
    'ok',           true,
    'pending_id',   v_pending_id,
    'user_id',      p_user_id,
    'amount',       p_amount,
    'currency',     p_currency,
    'mode',         v_mode,
    'payment_type', p_payment_type,
    'ambassador_id',p_ambassador_id,
    'description',  COALESCE(p_description, 'HUI ' || p_payment_type),
    'success_url',  p_success_url || '?pending_id=' || v_pending_id::text,
    'cancel_url',   p_cancel_url,
    'metadata',     p_metadata || jsonb_build_object(
      'hui_payment_type', p_payment_type,
      'pending_id',       v_pending_id::text,
      'user_id',          p_user_id::text,
      'ambassador_id',    COALESCE(p_ambassador_id::text, '')
    )
  );
END;
$$;
GRANT EXECUTE ON FUNCTION public.rpc_create_checkout_session(uuid,integer,text,text,text,text,uuid,text,jsonb) TO authenticated, service_role;

-- ── rpc_create_payment_intent ──────────────────────────────────
-- Für Stripe Elements (eigene Payment UI)
DROP FUNCTION IF EXISTS public.rpc_create_payment_intent(uuid,integer,text,text,uuid,text,jsonb) CASCADE;
CREATE FUNCTION public.rpc_create_payment_intent(
  p_user_id       uuid,
  p_amount        integer,
  p_currency      text  DEFAULT 'eur',
  p_payment_type  text  DEFAULT 'work',
  p_ambassador_id uuid  DEFAULT NULL,
  p_description   text  DEFAULT NULL,
  p_metadata      jsonb DEFAULT '{}'
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pending_id uuid;
BEGIN
  -- Pending-Eintrag
  INSERT INTO public.stripe_pending_checkouts(
    user_id, ambassador_id, payment_type, amount, currency,
    description, metadata, status
  )
  VALUES (
    p_user_id, p_ambassador_id, p_payment_type, p_amount, p_currency,
    p_description,
    p_metadata || jsonb_build_object(
      'hui_payment_type', p_payment_type,
      'user_id',          p_user_id::text,
      'ambassador_id',    COALESCE(p_ambassador_id::text, '')
    ),
    'intent_created'
  )
  RETURNING id INTO v_pending_id;

  RETURN jsonb_build_object(
    'ok',           true,
    'pending_id',   v_pending_id,
    'amount',       p_amount,
    'currency',     p_currency,
    'payment_type', p_payment_type,
    'description',  COALESCE(p_description, 'HUI ' || p_payment_type),
    'metadata',     p_metadata || jsonb_build_object(
      'hui_payment_type', p_payment_type,
      'pending_id',       v_pending_id::text,
      'user_id',          p_user_id::text,
      'ambassador_id',    COALESCE(p_ambassador_id::text, '')
    )
  );
END;
$$;
GRANT EXECUTE ON FUNCTION public.rpc_create_payment_intent(uuid,integer,text,text,uuid,text,jsonb) TO authenticated, service_role;

-- ── rpc_confirm_checkout ───────────────────────────────────────
-- Wird nach Stripe-Webhook aufgerufen: Pending → Payment aufgezeichnet
DROP FUNCTION IF EXISTS public.rpc_confirm_checkout(text, text) CASCADE;
CREATE FUNCTION public.rpc_confirm_checkout(
  p_pending_id      text,
  p_stripe_payment_id text
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rec   public.stripe_pending_checkouts%ROWTYPE;
  v_amb_c numeric := 0.05;  -- 5% Ambassador-Provision
  v_share integer;
BEGIN
  SELECT * INTO v_rec FROM public.stripe_pending_checkouts
  WHERE id = p_pending_id::uuid AND status = 'created';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'pending_not_found');
  END IF;

  -- Payment aufzeichnen
  PERFORM public.rpc_record_payment(
    p_stripe_payment_id, 'cus_hui_internal', v_rec.amount, v_rec.currency,
    v_rec.payment_type
  );

  -- Pending als abgeschlossen markieren
  UPDATE public.stripe_pending_checkouts
  SET status          = 'confirmed',
      stripe_intent_id = p_stripe_payment_id
  WHERE id = v_rec.id;

  -- Ambassador-Provision (falls vorhanden)
  IF v_rec.ambassador_id IS NOT NULL THEN
    v_share := (v_rec.amount * v_amb_c)::integer;
    PERFORM public.rpc_record_ambassador_commission(v_rec.ambassador_id, v_share);
  END IF;

  RETURN jsonb_build_object(
    'ok',           true,
    'payment_type', v_rec.payment_type,
    'amount',       v_rec.amount,
    'user_id',      v_rec.user_id,
    'ambassador_id',v_rec.ambassador_id
  );
END;
$$;
GRANT EXECUTE ON FUNCTION public.rpc_confirm_checkout(text,text) TO service_role;

-- ── rpc_record_payment: payment_type Spalte berücksichtigen ────
-- Update des bestehenden RPC um description + ambassador_id zu schreiben
DROP FUNCTION IF EXISTS public.rpc_record_payment(text,text,integer,text,text,uuid,text) CASCADE;
CREATE OR REPLACE FUNCTION public.rpc_record_payment(
  p_stripe_payment_id  text,
  p_stripe_customer_id text,
  p_amount             integer,
  p_currency           text  DEFAULT 'eur',
  p_payment_type       text  DEFAULT 'work',
  p_ambassador_id      uuid  DEFAULT NULL,
  p_description        text  DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pool_pct   numeric := 0.15;   -- 15% → Impact Pool
  v_pool_share integer;
  v_amb_pct    numeric := 0.05;   -- 5% Ambassador-Provision
  v_amb_share  integer := 0;
  v_user_id    uuid;
  v_month      text := to_char(now(), 'YYYY-MM');
BEGIN
  -- Nutzer via Stripe Customer finden
  SELECT user_id INTO v_user_id
  FROM public.stripe_customers WHERE stripe_customer_id = p_stripe_customer_id
  LIMIT 1;

  -- Payment speichern
  INSERT INTO public.stripe_payments(
    id, user_id, amount, currency, status, payment_type,
    ambassador_id, description, created_at
  )
  VALUES (
    p_stripe_payment_id, v_user_id, p_amount, p_currency, 'succeeded', p_payment_type,
    p_ambassador_id, p_description, now()
  )
  ON CONFLICT(id) DO UPDATE SET
    status        = 'succeeded',
    payment_type  = EXCLUDED.payment_type,
    ambassador_id = COALESCE(EXCLUDED.ambassador_id, public.stripe_payments.ambassador_id),
    description   = COALESCE(EXCLUDED.description,   public.stripe_payments.description);

  -- Impact Pool aktualisieren (15%)
  v_pool_share := (p_amount * v_pool_pct)::integer;
  PERFORM public.rpc_update_impact_pool(v_pool_share);

  -- Ambassador-Provision (5%)
  IF p_ambassador_id IS NOT NULL THEN
    v_amb_share := (p_amount * v_amb_pct)::integer;
    PERFORM public.rpc_record_ambassador_commission(p_ambassador_id, v_amb_share);
  END IF;

  RETURN jsonb_build_object(
    'ok',           true,
    'payment_id',   p_stripe_payment_id,
    'payment_type', p_payment_type,
    'amount',       p_amount,
    'pool_share',   v_pool_share,
    'amb_share',    v_amb_share,
    'ambassador',   p_ambassador_id
  );
END;
$$;
GRANT EXECUTE ON FUNCTION public.rpc_record_payment(text,text,integer,text,text,uuid,text) TO service_role, authenticated;

-- ── rpc_get_stripe_payments: payment_type + ambassador ─────────
DROP FUNCTION IF EXISTS public.rpc_get_stripe_payments(text,integer,integer) CASCADE;
CREATE FUNCTION public.rpc_get_stripe_payments(
  p_type   text    DEFAULT NULL,
  p_limit  integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
RETURNS TABLE(
  id             text,
  user_id        uuid,
  username       text,
  email          text,
  amount_eur     numeric,
  currency       text,
  status         text,
  payment_type   text,
  description    text,
  ambassador_id  uuid,
  amb_username   text,
  created_at     timestamptz
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.user_id,
    pr.username,
    pr.email,
    ROUND(p.amount::numeric / 100, 2),
    p.currency,
    p.status,
    p.payment_type,
    p.description,
    p.ambassador_id,
    amb.username,
    p.created_at
  FROM public.stripe_payments p
  LEFT JOIN public.profiles pr  ON p.user_id       = pr.id
  LEFT JOIN public.profiles amb ON p.ambassador_id  = amb.id
  WHERE (p_type IS NULL OR p.payment_type = p_type)
  ORDER BY p.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;
GRANT EXECUTE ON FUNCTION public.rpc_get_stripe_payments(text,integer,integer) TO authenticated, service_role;

NOTIFY pgrst, 'reload schema';
