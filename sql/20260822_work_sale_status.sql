-- ═══════════════════════════════════════════════════════════════════
-- WORK-SALE-STATUS-001 (2026-08-22, Michael-Anforderung)
-- ═══════════════════════════════════════════════════════════════════
-- Ziel: Im öffentlichen Profil (WorksSection "Meine Werke") soll bei
-- einem verkauften/reservierten Werk ein Status-Text angezeigt werden:
--   - "Reserviert" → Käufer hat Checkout gestartet (Bestand auf 0,
--     for_sale=false), aber Zahlung ist noch NICHT bestätigt
--     (orders.state = 'pending')
--   - "Verkauft"   → Zahlung ist bestätigt (orders.state = 'paid')
--
-- FAKTENLAGE (verifiziert per Direkt-Query, 2026-08-22):
--   rpc_decrement_stock setzt works.for_sale=false SOFORT bei
--   PaymentIntent-Erstellung (create-payment-intent/index.ts, Zeile
--   ~420) — also bereits BEVOR die Zahlung abgeschlossen ist.
--   handle-payment-webhook setzt orders.state erst bei
--   'payment_intent.succeeded' auf 'paid' (vorher 'pending').
--   orders.state kennt nur: pending → paid | aborted | failed.
--   Verifiziert an echtem Datensatz: Werk "Seidenmalerei"
--   (7767b8ac-bead-4d51-8d94-ba4a4927da12), order state='paid'.
--
-- RISIKO GEFUNDEN (gemeldet, siehe Chat-Antwort): Für abgebrochene
-- Checkouts (orders.state='aborted'/'failed') gibt es AKTUELL KEINEN
-- Mechanismus, der works.stock_available/for_sale wieder zurücksetzt.
-- Ohne Gegenmaßnahme würde ein abgebrochener Checkout das Werk
-- PERMANENT auf "Reserviert" einfrieren — obwohl es wieder verfügbar
-- sein müsste. Diese Migration behebt das zusätzlich mit
-- rpc_release_stale_order_reservations (siehe Teil 2).
-- ═══════════════════════════════════════════════════════════════════

-- ── Teil 1: Sale-Status-Lookup für die öffentliche Profilseite ──────
-- Additiv, read-only (STABLE), keine bestehende Logik verändert.
CREATE OR REPLACE FUNCTION public.rpc_get_works_sale_status(p_work_ids uuid[])
RETURNS TABLE(work_id uuid, sale_status text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    wid AS work_id,
    (
      SELECT
        CASE
          WHEN bool_or(o.state = 'paid')    THEN 'verkauft'
          WHEN bool_or(o.state = 'pending') THEN 'reserviert'
          ELSE NULL
        END
      FROM public.order_items oi
      JOIN public.orders o ON o.id = oi.order_id
      WHERE oi.item_type = 'work'
        AND oi.item_id = wid
        AND o.state IN ('paid', 'pending')
    ) AS sale_status
  FROM unnest(p_work_ids) AS wid;
$$;

COMMENT ON FUNCTION public.rpc_get_works_sale_status(uuid[]) IS
  'WORK-SALE-STATUS-001: Liefert pro Werk-ID entweder ''reserviert'' (Checkout gestartet, Zahlung offen), ''verkauft'' (Zahlung bestätigt) oder NULL (kein aktiver/abgeschlossener Kauf). SECURITY DEFINER da order_items/orders RLS-geschützt sind und Besucher (auch nicht eingeloggt) den Status auf öffentlichen Profilen sehen dürfen — es werden ausschließlich Status-Strings zurückgegeben, keine Order-/Kundendaten.';

GRANT EXECUTE ON FUNCTION public.rpc_get_works_sale_status(uuid[]) TO authenticated, anon;

-- ── Teil 2: Stale-Reservation-Release (Sicherheitsnetz) ─────────────
-- Gibt Bestand wieder frei für Orders, die seit p_minutes Minuten in
-- 'pending' hängen (abgebrochener/nie abgeschlossener Checkout).
-- Nur für item_type='work' ohne Varianten (variant_id IS NULL) — exakt
-- der Pfad, den rpc_decrement_stock für Werke ohne Varianten nutzt.
CREATE OR REPLACE FUNCTION public.rpc_release_stale_order_reservations(p_minutes int DEFAULT 30)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order record;
  v_released_orders int := 0;
  v_restored_items int := 0;
BEGIN
  FOR v_order IN
    SELECT id FROM public.orders
    WHERE state = 'pending'
      AND created_at < now() - (p_minutes || ' minutes')::interval
  LOOP
    -- Bestand für jede betroffene Work-Position zurückgeben
    UPDATE public.works w
    SET stock_available = LEAST(w.stock_total, w.stock_available + oi.quantity),
        for_sale = TRUE
    FROM public.order_items oi
    WHERE oi.order_id = v_order.id
      AND oi.item_type = 'work'
      AND oi.variant_id IS NULL
      AND w.id = oi.item_id;

    GET DIAGNOSTICS v_restored_items = ROW_COUNT;

    UPDATE public.orders
    SET state = 'aborted', cancelled_at = now()
    WHERE id = v_order.id;

    v_released_orders := v_released_orders + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'released_orders', v_released_orders,
    'restored_work_items', v_restored_items,
    'threshold_minutes', p_minutes
  );
END;
$$;

COMMENT ON FUNCTION public.rpc_release_stale_order_reservations(int) IS
  'WORK-SALE-STATUS-001 Sicherheitsnetz: Setzt Werke aus abgebrochenen/nie abgeschlossenen Checkouts (orders.state=pending länger als p_minutes) zurück auf verfügbar (stock_available++, for_sale=true) und markiert die Order als aborted. Verhindert, dass ein Werk nach einem Abbruch permanent auf "Reserviert" einfriert. Wird per Scheduled-Automation alle 30 Minuten aufgerufen (analog zur früheren cleanup_stale_talent_bookings-Automation).';

GRANT EXECUTE ON FUNCTION public.rpc_release_stale_order_reservations(int) TO service_role;
