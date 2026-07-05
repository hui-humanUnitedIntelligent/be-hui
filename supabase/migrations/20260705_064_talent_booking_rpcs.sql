-- 1) Live-Verfuegbarkeit pro Datum (oeffentlich lesbar, keine Kundendaten, nur Zahlen)
CREATE OR REPLACE FUNCTION public.rpc_get_talent_availability(p_talent_id uuid, p_date date)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_talent record;
  v_booked integer;
  v_remaining integer;
BEGIN
  SELECT max_participants, booking_type, status INTO v_talent
  FROM public.talents WHERE id = p_talent_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'talent_not_found');
  END IF;

  IF v_talent.booking_type <> 'gruppe' OR v_talent.max_participants IS NULL THEN
    RETURN jsonb_build_object('ok', true, 'unlimited', true, 'is_full', false);
  END IF;

  SELECT COALESCE(SUM(participants), 0) INTO v_booked
  FROM public.talent_bookings
  WHERE talent_id = p_talent_id AND selected_date = p_date
    AND status IN ('pending_payment', 'confirmed');

  v_remaining := GREATEST(v_talent.max_participants - v_booked, 0);

  RETURN jsonb_build_object(
    'ok', true, 'unlimited', false,
    'max_participants', v_talent.max_participants,
    'booked', v_booked, 'remaining', v_remaining,
    'is_full', v_remaining <= 0
  );
END;
$function$;

-- 2) Buchung anlegen (atomar, Row-Lock verhindert Race Condition bei letztem Platz)
CREATE OR REPLACE FUNCTION public.rpc_create_talent_booking(
  p_talent_id uuid, p_selected_date date, p_time_slot jsonb DEFAULT NULL, p_participants integer DEFAULT 1,
  p_customer_note text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_talent record;
  v_booked integer;
  v_amount numeric;
  v_booking_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;
  IF p_participants IS NULL OR p_participants < 1 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_participants');
  END IF;

  -- Row-Lock: serialisiert konkurrierende Buchungsversuche fuer dasselbe Angebot
  SELECT id, user_id, max_participants, booking_type, status,
         price_per_session, price_per_hour, duration_minutes
  INTO v_talent
  FROM public.talents WHERE id = p_talent_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'talent_not_found');
  END IF;
  IF v_talent.status <> 'approved' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'talent_not_approved');
  END IF;
  IF v_talent.user_id = auth.uid() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'cannot_book_own_offer');
  END IF;

  IF v_talent.price_per_session IS NOT NULL THEN
    v_amount := v_talent.price_per_session * p_participants;
  ELSIF v_talent.price_per_hour IS NOT NULL AND v_talent.duration_minutes IS NOT NULL THEN
    v_amount := ROUND(v_talent.price_per_hour * (v_talent.duration_minutes / 60.0) * p_participants, 2);
  ELSE
    RETURN jsonb_build_object('ok', false, 'error', 'no_price_configured');
  END IF;

  IF v_talent.booking_type = 'gruppe' AND v_talent.max_participants IS NOT NULL THEN
    SELECT COALESCE(SUM(participants), 0) INTO v_booked
    FROM public.talent_bookings
    WHERE talent_id = p_talent_id AND selected_date = p_selected_date
      AND status IN ('pending_payment', 'confirmed');

    IF v_booked + p_participants > v_talent.max_participants THEN
      RETURN jsonb_build_object(
        'ok', false, 'error', 'no_seats_available',
        'remaining', GREATEST(v_talent.max_participants - v_booked, 0)
      );
    END IF;
  END IF;

  INSERT INTO public.talent_bookings(
    talent_id, customer_id, seller_id, selected_date, selected_time_slot,
    participants, status, amount_eur, currency, customer_note
  ) VALUES (
    p_talent_id, auth.uid(), v_talent.user_id, p_selected_date, p_time_slot,
    p_participants, 'pending_payment', v_amount, 'EUR', p_customer_note
  ) RETURNING id INTO v_booking_id;

  RETURN jsonb_build_object('ok', true, 'booking_id', v_booking_id, 'amount_eur', v_amount, 'seller_id', v_talent.user_id);
END;
$function$;

-- 3) Buchung stornieren (Kunde ODER Anbieter) -- Platz wird automatisch frei, da Kapazitaet
--    live ueber COUNT(status IN pending_payment/confirmed) berechnet wird, kein Zaehler-Feld.
CREATE OR REPLACE FUNCTION public.rpc_cancel_talent_booking(p_booking_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_booking record;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;

  SELECT id, customer_id, seller_id, status INTO v_booking
  FROM public.talent_bookings WHERE id = p_booking_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'booking_not_found');
  END IF;
  IF v_booking.customer_id <> auth.uid() AND v_booking.seller_id <> auth.uid() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authorized');
  END IF;
  IF v_booking.status = 'cancelled' THEN
    RETURN jsonb_build_object('ok', true, 'already_cancelled', true);
  END IF;
  IF v_booking.status = 'completed' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'already_completed');
  END IF;

  UPDATE public.talent_bookings
  SET status = 'cancelled', cancelled_at = now()
  WHERE id = p_booking_id;

  RETURN jsonb_build_object('ok', true);
END;
$function$;

-- 4) Nach erfolgreicher Stripe-Zahlung: Gebuehren/Ambassador-Provision verbuchen
--    (spiegelt rpc_process_order_fees 1:1, gleiche 15/85-Formel + Referral-Logik,
--    schreibt ins gleiche SSOT stripe_payments/stripe_impact_pool/stripe_ambassador_commissions)
CREATE OR REPLACE FUNCTION public.rpc_process_talent_booking_fees(p_booking_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_booking      record;
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
BEGIN
  SELECT count(*) INTO v_existing FROM public.stripe_impact_pool WHERE order_id = p_booking_id;
  IF v_existing > 0 THEN
    RETURN jsonb_build_object('ok', true, 'already_processed', true);
  END IF;

  SELECT id, customer_id, amount_eur, stripe_payment_intent INTO v_booking
  FROM public.talent_bookings WHERE id = p_booking_id AND status = 'confirmed';
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'booking_not_found_or_not_confirmed');
  END IF;

  v_amount_cents := ROUND(v_booking.amount_eur * 100);
  v_fee_cents     := ROUND(v_amount_cents * 0.15);
  v_impact_cents  := ROUND(v_fee_cents * 0.15);
  v_company_cents := v_fee_cents - v_impact_cents;

  SELECT id, referred_by, created_at INTO v_buyer FROM public.profiles WHERE id = v_booking.customer_id;

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
        v_buyer.referred_by::uuid, v_buyer.id, p_booking_id, v_booking.stripe_payment_intent,
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
    'talent_booking', p_booking_id,
    CASE WHEN v_referral_valid THEN v_buyer.referred_by::uuid ELSE NULL END,
    ROUND(v_projekte_cents/100.0, 2), ROUND(v_hui_cents/100.0, 2),
    ROUND(v_ideen_cents/100.0, 2), ROUND(v_qualitaet_cents/100.0, 2)
  );

  IF v_booking.stripe_payment_intent IS NOT NULL THEN
    INSERT INTO public.stripe_payments(
      id, user_id, stripe_payment_id, amount, currency, status,
      payment_type, ambassador_id, description, metadata,
      impact_pool_share, ambassador_share, created_at
    ) VALUES (
      v_booking.stripe_payment_intent, v_booking.customer_id, v_booking.stripe_payment_intent,
      v_amount_cents, 'eur', 'succeeded',
      'talent_booking', CASE WHEN v_referral_valid THEN v_buyer.referred_by::uuid ELSE NULL END,
      'Talent-Buchung ' || p_booking_id::text,
      jsonb_build_object('booking_id', p_booking_id),
      v_impact_cents, v_commission_cents, now()
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;

  UPDATE public.profiles
  SET first_transaction_at = now()
  WHERE id = v_booking.customer_id AND first_transaction_at IS NULL;

  UPDATE public.talent_bookings SET
    company_share_eur = ROUND(v_company_cents/100.0, 2),
    ambassador_id = CASE WHEN v_referral_valid THEN v_buyer.referred_by::uuid ELSE NULL END,
    ambassador_commission_eur = CASE WHEN v_referral_valid THEN ROUND(v_commission_cents/100.0, 2) ELSE NULL END,
    ambassador_commission_applicable = v_referral_valid
  WHERE id = p_booking_id;

  RETURN jsonb_build_object(
    'ok', true,
    'fee_eur', ROUND(v_fee_cents/100.0,2),
    'impact_eur', ROUND(v_impact_cents/100.0,2),
    'company_eur', ROUND(v_company_cents/100.0,2),
    'ambassador_commission_applicable', v_referral_valid,
    'ambassador_commission_eur', ROUND(v_commission_cents/100.0,2)
  );
END;
$function$;
