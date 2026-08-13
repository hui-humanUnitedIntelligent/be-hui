-- ORB-GROWTH-STAGE-CUMULATIVE-FIX (2026-08-13)
-- Additiv, keine Aenderung bestehender Tabellen (No-Regression-Protection).
--
-- BUG (gemeldet von Michael, 2026-08-13): Fake-Account hat Talentprofil
-- aktiviert (Meilenstein A) und einen ersten Kauf getaetigt (Meilenstein C),
-- aber NIE Content gepostet (Meilenstein B fehlt). Die alte Logik
-- (Migration 107/108) behandelte die 5 Meilensteine als EXKLUSIVE
-- Prioritaets-Stufen (ELSIF-Kette, nur die hoechste erfuellte Bedingung
-- zaehlt) statt als KUMULATIVE Fortschritts-Stufen. Ergebnis: Fake sprang
-- direkt von Stufe 2 (Talent) auf Stufe 4 (Aktivitaet) -- Stufe 3
-- (Content) wurde komplett uebersprungen, weil has_content=false den
-- IF-Zweig fuer Stufe 3 nie erreichte (die Aktivitaets-Bedingung stand
-- in der ELSIF-Kette VOR der Content-Bedingung).
--
-- FIX: Jeder der 5 Meilensteine zaehlt jetzt unabhaengig +1 zur Stufe,
-- unabhaengig von der Reihenfolge, in der sie erreicht wurden:
--   Basis:            Stufe 1
--   + is_talent:       +1
--   + has_content:     +1
--   + activity > 0:    +1
--   + activity > 5:    +1
--   + activity > 10:   +1
-- Maximal 1+5 = Stufe 6. Fake (Talent=true, Content=false, Aktivitaet=1)
-- ergibt jetzt korrekt: 1 + 1(Talent) + 0(Content) + 1(Aktivitaet>0) = 3.
--
-- Aktivitaets-Zaehlung bleibt unveraendert aus Migration 108 (nur
-- state='paid' bzw. status='confirmed' zaehlt als abgeschlossen).

CREATE OR REPLACE FUNCTION rpc_get_orb_growth_stage(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_talent      boolean := false;
  v_has_content    boolean := false;
  v_total_activity integer := 0;
  v_stage          integer := 1;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN 1;
  END IF;

  SELECT COALESCE(is_talent, false) INTO v_is_talent
  FROM profiles WHERE id = p_user_id;

  IF NOT v_is_talent THEN
    SELECT EXISTS(SELECT 1 FROM talents WHERE user_id = p_user_id) INTO v_is_talent;
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM works       WHERE user_id = p_user_id
    UNION ALL
    SELECT 1 FROM moments     WHERE user_id = p_user_id
    UNION ALL
    SELECT 1 FROM experiences WHERE user_id = p_user_id
    UNION ALL
    SELECT 1 FROM talents     WHERE user_id = p_user_id
  ) INTO v_has_content;

  -- Aktivitaets-Zaehlung: NUR abgeschlossene/bezahlte Aktionen zaehlen
  -- (Migration 108: orders.state='paid', talent_bookings.status='confirmed')
  SELECT
    (SELECT COUNT(*) FROM follows WHERE follower_id = p_user_id)
    + (SELECT COUNT(*) FROM order_items oi
         JOIN orders o ON o.id = oi.order_id
         WHERE o.customer_id = p_user_id AND o.state = 'paid')
    + (SELECT COUNT(*) FROM order_items oi
         JOIN orders o ON o.id = oi.order_id
         WHERE oi.seller_id = p_user_id AND o.state = 'paid')
    + (SELECT COUNT(*) FROM talent_bookings
         WHERE customer_id = p_user_id AND status = 'confirmed')
    + (SELECT COUNT(*) FROM talent_bookings
         WHERE seller_id = p_user_id AND status = 'confirmed')
  INTO v_total_activity;

  -- KUMULATIV: jeder erreichte Meilenstein zaehlt unabhaengig +1,
  -- unabhaengig von der Reihenfolge, in der er erreicht wurde.
  v_stage := 1
    + (CASE WHEN v_is_talent THEN 1 ELSE 0 END)
    + (CASE WHEN v_has_content THEN 1 ELSE 0 END)
    + (CASE WHEN v_total_activity > 0  THEN 1 ELSE 0 END)
    + (CASE WHEN v_total_activity > 5  THEN 1 ELSE 0 END)
    + (CASE WHEN v_total_activity > 10 THEN 1 ELSE 0 END);

  RETURN LEAST(6, v_stage);
END;
$$;

GRANT EXECUTE ON FUNCTION rpc_get_orb_growth_stage(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION rpc_get_orb_growth_stage(uuid) TO anon;
