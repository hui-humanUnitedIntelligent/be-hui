-- ═════════════════════════════════════════════════════════════════
-- FIX (2026-08-24): rpc_buyer_confirm_receipt — buyer_id → customer_id
-- ═════════════════════════════════════════════════════════════════
-- ZWEITER BUG in der gleichen RPC: Die orders-Tabelle hat keine
-- Spalte 'buyer_id' — sie heißt 'customer_id'. Die RPC referenzierte
-- 'buyer_id' und crashte mit 'column "buyer_id" does not exist'.
-- Selbst nach dem success→ok Fix (Migration 120) war die RPC also
-- noch kaputt. Erst dieser Fix macht sie funktionsfähig.
-- talent_bookings nutzt bereits korrekt 'customer_id'.
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
    FROM orders WHERE id = p_order_id AND customer_id = v_user_id;

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
      AND customer_id = v_user_id
      AND escrow_status = 'holding'
      AND delivery_status IN ('shipped','delivered','pending');

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

GRANT EXECUTE ON FUNCTION public.rpc_buyer_confirm_receipt TO authenticated;

COMMENT ON FUNCTION public.rpc_buyer_confirm_receipt IS 'FIX 2026-08-24: Returns success/skipped. Uses customer_id (not buyer_id). Idempotent. delivery_status IN includes pending for orders.';
