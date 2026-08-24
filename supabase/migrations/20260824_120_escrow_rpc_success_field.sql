-- ═════════════════════════════════════════════════════════════════
-- FIX (2026-08-24): rpc_buyer_confirm_receipt — 'ok' → 'success'
-- ═════════════════════════════════════════════════════════════════
-- ROOT CAUSE: Migration 077 definierte die RPC mit 'ok' als
-- Response-Feld. Die Edge Function confirm-and-transfer wurde am
-- 2026-08-16 im Repo auf 'success' umgestellt (erwartet
-- confirmResult?.success), aber die Datenbank-RPC wurde NIEMALS
-- aktualisiert. Ergebnis: !confirmResult?.success war IMMER true →
-- die Edge Function brach mit 400 ab, BEVOR der Stripe-Transfer
-- ausgelöst wurde. Jeder Escrow-Release war blockiert.
-- Das €13-Test-Beispiel im Dashboard ist exakt dieser Bug.
--
-- FIX: RPC gibt jetzt 'success' statt 'ok' zurück. Idempotent
-- (Doppel-Confirm → skipped:true, kein zweiter Transfer).
-- Ownership-Check (buyer_id/customer_id = auth.uid()) bleibt erhalten.
-- ═════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.rpc_buyer_confirm_receipt(
  p_order_id uuid DEFAULT NULL,
  p_booking_id uuid DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_already boolean;
BEGIN
  IF p_order_id IS NOT NULL THEN
    SELECT (escrow_status = 'released') INTO v_already
    FROM orders WHERE id = p_order_id AND buyer_id = v_user_id;

    IF v_already IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'Order nicht gefunden');
    END IF;

    IF v_already THEN
      RETURN jsonb_build_object('success', true, 'skipped', true, 'type', 'order', 'id', p_order_id);
    END IF;

    UPDATE orders SET
      delivery_status = 'confirmed',
      escrow_status = 'released',
      buyer_confirmed_at = now(),
      escrow_released_at = now(),
      updated_at = now()
    WHERE id = p_order_id
      AND buyer_id = v_user_id
      AND escrow_status = 'holding'
      AND delivery_status IN ('shipped','delivered');

    IF NOT FOUND THEN
      RETURN jsonb_build_object('success', false, 'error', 'Order nicht gefunden oder nicht in korrektem Status');
    END IF;

    RETURN jsonb_build_object('success', true, 'skipped', false, 'type', 'order', 'id', p_order_id);
  END IF;

  IF p_booking_id IS NOT NULL THEN
    SELECT (escrow_status = 'released') INTO v_already
    FROM talent_bookings WHERE id = p_booking_id AND customer_id = v_user_id;

    IF v_already IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'Buchung nicht gefunden');
    END IF;

    IF v_already THEN
      RETURN jsonb_build_object('success', true, 'skipped', true, 'type', 'booking', 'id', p_booking_id);
    END IF;

    UPDATE talent_bookings SET
      delivery_status = 'confirmed',
      escrow_status = 'released',
      buyer_confirmed_at = now(),
      escrow_released_at = now(),
      updated_at = now()
    WHERE id = p_booking_id
      AND customer_id = v_user_id
      AND escrow_status = 'holding'
      AND delivery_status IN ('executed','pending');

    IF NOT FOUND THEN
      RETURN jsonb_build_object('success', false, 'error', 'Buchung nicht gefunden oder nicht in korrektem Status');
    END IF;

    RETURN jsonb_build_object('success', true, 'skipped', false, 'type', 'booking', 'id', p_booking_id);
  END IF;

  RETURN jsonb_build_object('success', false, 'error', 'order_id oder booking_id erforderlich');
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.rpc_buyer_confirm_receipt TO authenticated;

-- Kommentar zur Dokumentation
COMMENT ON FUNCTION public.rpc_buyer_confirm_receipt IS 'FIX 2026-08-24: Returns success/skipped instead of ok. Idempotent. See migration 20260824_120.';
