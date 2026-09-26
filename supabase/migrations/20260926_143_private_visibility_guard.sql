-- ═══════════════════════════════════════════════════════════════════════
-- Migration 143: PRIVATE-VISIBILITY-GUARD
-- Michael-Entscheidung (2026-09-26): Private Accounts (Privatmodus,
-- profiles.focus_type='private') duerfen mit ihren Werken, Talenten und
-- Lebensmomenten (beitraege) NICHT sichtbar und NICHT buchbar sein.
-- Nur oeffentliche Profile werden angezeigt und buchbar.
--
-- Backups: backups/20260926_private_visibility_guard/
--   (Policies, View-Definition, rpc_create_talent_booking, Tabellenzaehler)
--
-- Umsetzung (rein serverseitig, 3 Ebenen):
--   1. RLS SELECT-Policies auf works/talents/experiences/beitraege:
--      Oeffentlich-Zweig bekommt NOT EXISTS(private-Ersteller).
--      Owner-Zweige unveraendert (Privatmodus sieht eigene Inhalte).
--   2. commerce_price_authority View: schliesst Items privater Ersteller
--      aus (Buchungs-Autoritaet fuer create-payment-intent Edge Function —
--      Service Role umgeht RLS, deshalb MUSS die View selbst filtern).
--   3. rpc_create_talent_booking: Gate von 'nur focus_type=public buchbar'
--      auf 'nur private gesperrt' korrigiert (COMMERCE-VIEW-FIX-Analogon,
--      Bug 6 vom 24.09.: hybrid-Anbieter wurden faelschlich geblockt).
--
-- Bewusst NICHT geaendert (Michael-Entscheidung ausstehend, Tier-2):
--   SECURITY DEFINER RPCs rpc_discover_places / rpc_discover_place_detail /
--   rpc_discover_places_bbox / rpc_get_home_dashboard / rpc_get_live_ticker_feed
--   umgehen RLS und koennten Inhalte privater Ersteller weiterhin liefern.
-- ═══════════════════════════════════════════════════════════════════════

-- ── 1a. works: publizierter Zweig ohne private Ersteller ────────────
ALTER POLICY works_select_published ON public.works USING (
  (
    (status = 'published')
    AND (visibility IS NULL OR visibility = 'public')
    AND NOT EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = works.user_id AND p.focus_type = 'private'
    )
  )
  OR (auth.uid() = user_id)
  OR (auth.uid() = creator_id)
  OR (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = works.user_id AND p.owner_user_id = auth.uid()
    )
  )
);

-- ── 1b. talents: approved-Zweig ohne private Ersteller ───────────────
ALTER POLICY talents_visible_approved_or_own ON public.talents USING (
  (
    (status = 'approved')
    AND NOT EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = talents.user_id AND p.focus_type = 'private'
    )
  )
  OR (auth.uid() = user_id)
  OR (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = talents.user_id AND p.owner_user_id = auth.uid()
    )
  )
);

-- ── 1c. experiences: published-Zweige ohne private Ersteller ────────
ALTER POLICY exp_select ON public.experiences USING (
  (
    (status = 'published')
    AND NOT EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = experiences.user_id AND p.focus_type = 'private'
    )
  )
  OR (auth.uid() = user_id)
  OR (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = experiences.user_id AND p.owner_user_id = auth.uid()
    )
  )
);

ALTER POLICY experiences_public_read ON public.experiences USING (
  (
    (status = 'published')
    AND (visibility = 'public')
    AND NOT EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = experiences.user_id AND p.focus_type = 'private'
    )
  )
);

-- ── 1d. beitraege (Lebensmomente): private Autoren unsichtbar ────────
-- Beide Legacy-Policies (qual=true) erhalten dieselbe neue Bedingung;
-- keine der beiden wird gedroppt (Verbindungs-Schutz-Regel).
ALTER POLICY beitraege_select ON public.beitraege USING (
  (auth.uid() = beitraege.user_id)
  OR NOT EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = beitraege.user_id AND p.focus_type = 'private'
  )
);

ALTER POLICY beitraege_select_all ON public.beitraege USING (
  (auth.uid() = beitraege.user_id)
  OR NOT EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = beitraege.user_id AND p.focus_type = 'private'
  )
);

-- ── 2. commerce_price_authority: private Ersteller nicht buchbar ─────
CREATE OR REPLACE VIEW public.commerce_price_authority AS
 SELECT 'work'::text AS item_type,
    w.id AS item_id,
    COALESCE(w.creator_id, w.user_id) AS creator_id,
    COALESCE(w.price, 0::numeric) AS price_eur,
    COALESCE(w.shipping_cost, 0::numeric) AS shipping_eur,
    w.title,
    w.cover_url,
    w.status,
    w.stock_available,
    w.stock_total,
    w.is_unique
   FROM works w
  WHERE (
    (w.status = ANY (ARRAY['published'::text, 'approved'::text]))
    AND (w.for_sale IS NULL OR w.for_sale = true)
    AND NOT EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = COALESCE(w.creator_id, w.user_id) AND p.focus_type = 'private'
    )
  )
UNION ALL
 SELECT 'experience'::text AS item_type,
    e.id AS item_id,
    e.user_id AS creator_id,
    COALESCE(e.price, 0::numeric) AS price_eur,
    0 AS shipping_eur,
    e.title,
    e.cover_url,
    e.status,
    NULL::bigint AS stock_available,
    NULL::bigint AS stock_total,
    true AS is_unique
   FROM experiences e
  WHERE (
    e.status = ANY (ARRAY['published'::text, 'approved'::text, 'active'::text])
    AND NOT EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = e.user_id AND p.focus_type = 'private'
    )
  );

-- ── 3. rpc_create_talent_booking: Gate nur noch gegen 'private' ──────
CREATE OR REPLACE FUNCTION public.rpc_create_talent_booking(p_talent_id uuid, p_selected_date date, p_time_slot jsonb DEFAULT NULL::jsonb, p_participants integer DEFAULT 1, p_customer_note text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_talent record;
  v_seller_focus text;
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

  -- Sichtbarkeit-Gate (PRIVATE-VISIBILITY-GUARD, 2026-09-26, Michael-Entscheidung):
  -- Nur Anbieter im Privatmodus (focus_type='private') sind vom Buchen gesperrt.
  -- hybrid und Legacy-Werte sind oeffentliche Profile (siehe COMMERCE-VIEW-FIX
  -- 2026-08-16 im WerkKaufFlow: das alte 'nur public'-Gate blockierte legitime
  -- Verkaeufer mit hybrid — derselbe Fehler durfte hier nicht bestehen bleiben).
  -- Fehlercode 'seller_not_public' bleibt unveraendert (Client-Kompatibilitaet).
  SELECT COALESCE(focus_type, 'public') INTO v_seller_focus
  FROM public.profiles WHERE id = v_talent.user_id;

  IF v_seller_focus = 'private' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'seller_not_public');
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

-- ── 3b. 8-Parameter-Überladung (aktive Version mit Adress-Parametern) ─

CREATE OR REPLACE FUNCTION public.rpc_create_talent_booking(p_talent_id uuid, p_selected_date date, p_time_slot jsonb DEFAULT NULL::jsonb, p_participants integer DEFAULT 1, p_customer_note text DEFAULT NULL::text, p_customer_address text DEFAULT NULL::text, p_customer_lat double precision DEFAULT NULL::double precision, p_customer_lng double precision DEFAULT NULL::double precision)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_talent record;
  v_seller_focus text;
  v_booked integer;
  v_amount numeric;
  v_booking_id uuid;
  v_distance_km double precision;
  v_shipping_address jsonb;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;
  IF p_participants IS NULL OR p_participants < 1 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_participants');
  END IF;

  -- Row-Lock: serialisiert konkurrierende Buchungsversuche fuer dasselbe Angebot
  SELECT id, user_id, max_participants, booking_type, status,
         price_per_session, price_per_hour, duration_minutes,
         offers_home_visits, home_visit_radius_km, lat, lng
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

  -- Sichtbarkeit-Gate (PRIVATE-VISIBILITY-GUARD, 2026-09-26, Michael-Entscheidung):
  -- Nur Anbieter im Privatmodus (focus_type='private') sind vom Buchen gesperrt.
  -- hybrid und Legacy-Werte sind oeffentliche Profile (siehe COMMERCE-VIEW-FIX
  -- 2026-08-16 im WerkKaufFlow: das alte 'nur public'-Gate blockierte legitime
  -- Verkaeufer mit hybrid — derselbe Fehler durfte hier nicht bestehen bleiben).
  -- Fehlercode 'seller_not_public' bleibt unveraendert (Client-Kompatibilitaet).
  SELECT COALESCE(focus_type, 'public') INTO v_seller_focus
  FROM public.profiles WHERE id = v_talent.user_id;

  IF v_seller_focus = 'private' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'seller_not_public');
  END IF;

  -- AKTIONSRADIUS-ENFORCE-001: bei Hausbesuchs-Angeboten ist die
  -- Kunden-Adresse PFLICHT und der Aktionsradius wird hart durchgesetzt --
  -- keine Buchung ausserhalb des vom Anbieter gesetzten Radius, unabhaengig
  -- davon, was der Client an Pruefung schon vorher gemacht hat (Client kann
  -- umgangen werden, diese RPC ist die einzige Quelle der Wahrheit).
  IF v_talent.offers_home_visits IS TRUE THEN
    IF p_customer_lat IS NULL OR p_customer_lng IS NULL THEN
      RETURN jsonb_build_object('ok', false, 'error', 'address_required');
    END IF;
    IF v_talent.lat IS NULL OR v_talent.lng IS NULL THEN
      RETURN jsonb_build_object('ok', false, 'error', 'seller_location_missing');
    END IF;
    IF v_talent.home_visit_radius_km IS NULL THEN
      RETURN jsonb_build_object('ok', false, 'error', 'radius_not_configured');
    END IF;

    v_distance_km := public.haversine_km(v_talent.lat, v_talent.lng, p_customer_lat, p_customer_lng);

    IF v_distance_km > v_talent.home_visit_radius_km THEN
      RETURN jsonb_build_object(
        'ok', false, 'error', 'outside_radius',
        'radius_km', v_talent.home_visit_radius_km,
        'distance_km', ROUND(v_distance_km::numeric, 1)
      );
    END IF;

    v_shipping_address := jsonb_build_object(
      'address', p_customer_address,
      'lat', p_customer_lat,
      'lng', p_customer_lng,
      'distance_km', ROUND(v_distance_km::numeric, 1)
    );
  ELSE
    v_shipping_address := NULL;
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
    participants, status, amount_eur, currency, customer_note, shipping_address
  ) VALUES (
    p_talent_id, auth.uid(), v_talent.user_id, p_selected_date, p_time_slot,
    p_participants, 'pending_payment', v_amount, 'EUR', p_customer_note, v_shipping_address
  ) RETURNING id INTO v_booking_id;

  RETURN jsonb_build_object('ok', true, 'booking_id', v_booking_id, 'amount_eur', v_amount, 'seller_id', v_talent.user_id);
END;
$function$;
