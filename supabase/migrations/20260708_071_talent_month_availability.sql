-- 20260708_071_talent_month_availability.sql
-- STANDORT-KALENDER-037: Kalenderansicht mit echten Verfuegbarkeits-Slots
-- fuer Talent-Buchungen. Additiv, keine bestehende Funktion/Tabelle geaendert
-- ausser rpc_create_talent_booking (echter Korrektheits-Fix, siehe unten).

-- 1) NEU: Monats-Batch-Verfuegbarkeit (fuer Kalenderansicht, statt N Einzel-
--    Abfragen pro sichtbarem Monat). Oeffentlich lesbar (keine Kundendaten,
--    nur Zahlen) -- gleiche Sichtbarkeitslogik wie rpc_get_talent_availability.
CREATE OR REPLACE FUNCTION public.rpc_get_talent_month_availability(p_talent_id uuid, p_month text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_talent record;
  v_start date;
  v_end date;
  v_result jsonb := '{}'::jsonb;
  v_the_date date;
  v_slot jsonb;
  v_slots_arr jsonb;
  v_booked integer;
  v_remaining integer;
  v_is_full boolean;
  v_slot_results jsonb;
BEGIN
  SELECT max_participants, booking_type, available_dates, available_time_slots, status
  INTO v_talent
  FROM public.talents WHERE id = p_talent_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'talent_not_found');
  END IF;

  v_start := (p_month || '-01')::date;
  v_end := (v_start + interval '1 month')::date;
  v_slots_arr := COALESCE(v_talent.available_time_slots, '[]'::jsonb);

  FOR v_the_date IN
    SELECT DISTINCT d::date
    FROM jsonb_array_elements_text(COALESCE(v_talent.available_dates, '[]'::jsonb)) AS d
    WHERE d::date >= v_start AND d::date < v_end
    ORDER BY 1
  LOOP
    IF jsonb_array_length(v_slots_arr) > 0 THEN
      -- Pro Zeitfenster einzeln auswerten (jedes Zeitfenster hat eigene Kapazitaet)
      v_slot_results := '[]'::jsonb;
      FOR v_slot IN SELECT * FROM jsonb_array_elements(v_slots_arr)
      LOOP
        IF v_talent.booking_type = 'gruppe' AND v_talent.max_participants IS NOT NULL THEN
          SELECT COALESCE(SUM(participants), 0) INTO v_booked
          FROM public.talent_bookings
          WHERE talent_id = p_talent_id AND selected_date = v_the_date
            AND selected_time_slot = v_slot
            AND status IN ('pending_payment','confirmed');
          v_remaining := GREATEST(v_talent.max_participants - v_booked, 0);
          v_is_full := v_remaining <= 0;
        ELSE
          SELECT COUNT(*) INTO v_booked
          FROM public.talent_bookings
          WHERE talent_id = p_talent_id AND selected_date = v_the_date
            AND selected_time_slot = v_slot
            AND status IN ('pending_payment','confirmed');
          v_remaining := GREATEST(1 - v_booked, 0);
          v_is_full := v_booked > 0;
        END IF;

        v_slot_results := v_slot_results || jsonb_build_object(
          'start', v_slot->>'start', 'end', v_slot->>'end',
          'remaining', v_remaining, 'is_full', v_is_full
        );
      END LOOP;

      v_result := v_result || jsonb_build_object(
        v_the_date::text, jsonb_build_object(
          'has_slots', true,
          'slots', v_slot_results,
          'is_full', NOT EXISTS (SELECT 1 FROM jsonb_array_elements(v_slot_results) s WHERE (s->>'is_full')::boolean = false)
        )
      );
    ELSE
      -- Keine Zeitfenster konfiguriert: Kapazitaet gilt fuer den ganzen Tag
      IF v_talent.booking_type = 'gruppe' AND v_talent.max_participants IS NOT NULL THEN
        SELECT COALESCE(SUM(participants), 0) INTO v_booked
        FROM public.talent_bookings
        WHERE talent_id = p_talent_id AND selected_date = v_the_date
          AND status IN ('pending_payment','confirmed');
        v_remaining := GREATEST(v_talent.max_participants - v_booked, 0);
        v_is_full := v_remaining <= 0;
      ELSE
        SELECT COUNT(*) INTO v_booked
        FROM public.talent_bookings
        WHERE talent_id = p_talent_id AND selected_date = v_the_date
          AND status IN ('pending_payment','confirmed');
        v_remaining := GREATEST(1 - v_booked, 0);
        v_is_full := v_booked > 0;
      END IF;

      v_result := v_result || jsonb_build_object(
        v_the_date::text, jsonb_build_object(
          'has_slots', false,
          'remaining', v_remaining, 'is_full', v_is_full
        )
      );
    END IF;
  END LOOP;

  RETURN jsonb_build_object('ok', true, 'dates', v_result);
END;
$function$;

-- 2) FIX: rpc_create_talent_booking pruefte Kapazitaet bisher NUR fuer
--    booking_type='gruppe'. Bei 'einzel' (1:1-Termine) konnten dadurch
--    mehrere Kunden denselben Termin (Datum, ODER Datum+Zeitfenster falls
--    konfiguriert) doppelt buchen -- echter Korrektheits-Bug, keine neue
--    Geschaeftsregel (Einzelbuchung impliziert eindeutig max. 1 Buchung pro
--    Termin). Zusaetzlich: Kapazitaetspruefung bei 'gruppe' + konfigurierten
--    Zeitfenstern jetzt korrekt PRO ZEITFENSTER statt ueber den ganzen Tag
--    gepoolt (identische Logik wie Punkt 1 oben).
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
    -- Kapazitaet pro (Datum [+ Zeitfenster falls angegeben])
    IF p_time_slot IS NOT NULL THEN
      SELECT COALESCE(SUM(participants), 0) INTO v_booked
      FROM public.talent_bookings
      WHERE talent_id = p_talent_id AND selected_date = p_selected_date
        AND selected_time_slot = p_time_slot
        AND status IN ('pending_payment', 'confirmed');
    ELSE
      SELECT COALESCE(SUM(participants), 0) INTO v_booked
      FROM public.talent_bookings
      WHERE talent_id = p_talent_id AND selected_date = p_selected_date
        AND status IN ('pending_payment', 'confirmed');
    END IF;

    IF v_booked + p_participants > v_talent.max_participants THEN
      RETURN jsonb_build_object(
        'ok', false, 'error', 'no_seats_available',
        'remaining', GREATEST(v_talent.max_participants - v_booked, 0)
      );
    END IF;
  ELSIF v_talent.booking_type = 'einzel' THEN
    -- FIX: bisher keinerlei Doppelbuchungsschutz fuer Einzelbuchungen.
    IF p_time_slot IS NOT NULL THEN
      SELECT COUNT(*) INTO v_booked
      FROM public.talent_bookings
      WHERE talent_id = p_talent_id AND selected_date = p_selected_date
        AND selected_time_slot = p_time_slot
        AND status IN ('pending_payment', 'confirmed');
    ELSE
      SELECT COUNT(*) INTO v_booked
      FROM public.talent_bookings
      WHERE talent_id = p_talent_id AND selected_date = p_selected_date
        AND status IN ('pending_payment', 'confirmed');
    END IF;

    IF v_booked > 0 THEN
      RETURN jsonb_build_object('ok', false, 'error', 'no_seats_available', 'remaining', 0);
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
