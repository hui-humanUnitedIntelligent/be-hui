-- ESCROW SYSTEM v1 (2026-07-11)
-- Software-Escrow: Geld bei HUI, Transfer nach Käuferbestätigung
-- Additiv: bestehende Orders unberührt

-- 1. orders: neue Escrow-Spalten
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS escrow_status text DEFAULT 'none' 
    CHECK (escrow_status IN ('none','holding','released','disputed','refunded')),
  ADD COLUMN IF NOT EXISTS delivery_status text DEFAULT 'pending'
    CHECK (delivery_status IN ('pending','shipped','delivered','confirmed','disputed')),
  ADD COLUMN IF NOT EXISTS buyer_confirmed_at timestamptz,
  ADD COLUMN IF NOT EXISTS seller_transfer_id text,
  ADD COLUMN IF NOT EXISTS payout_requested_at timestamptz,
  ADD COLUMN IF NOT EXISTS payout_request_note text,
  ADD COLUMN IF NOT EXISTS escrow_released_at timestamptz,
  ADD COLUMN IF NOT EXISTS auto_confirm_at timestamptz; -- Auto-Confirm nach 14 Tagen

-- 2. talent_bookings: neue Escrow-Spalten
ALTER TABLE talent_bookings
  ADD COLUMN IF NOT EXISTS escrow_status text DEFAULT 'none'
    CHECK (escrow_status IN ('none','holding','released','disputed','refunded')),
  ADD COLUMN IF NOT EXISTS delivery_status text DEFAULT 'pending'
    CHECK (delivery_status IN ('pending','executed','confirmed','disputed')),
  ADD COLUMN IF NOT EXISTS buyer_confirmed_at timestamptz,
  ADD COLUMN IF NOT EXISTS seller_transfer_id text,
  ADD COLUMN IF NOT EXISTS payout_requested_at timestamptz,
  ADD COLUMN IF NOT EXISTS payout_request_note text,
  ADD COLUMN IF NOT EXISTS escrow_released_at timestamptz,
  ADD COLUMN IF NOT EXISTS auto_confirm_at timestamptz;

-- 3. escrow_disputes: neue Tabelle für Streitfälle
CREATE TABLE IF NOT EXISTS escrow_disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id),
  booking_id uuid REFERENCES talent_bookings(id),
  dispute_type text NOT NULL CHECK (dispute_type IN ('buyer_no_confirm','seller_no_deliver','quality_issue','fraud')),
  initiated_by uuid REFERENCES profiles(id) NOT NULL,
  status text DEFAULT 'open' CHECK (status IN ('open','reviewing','resolved_buyer','resolved_seller','escalated')),
  seller_evidence text,
  buyer_evidence text,
  admin_decision text,
  admin_id uuid REFERENCES profiles(id),
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE escrow_disputes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_disputes" ON escrow_disputes
  FOR ALL USING (initiated_by = auth.uid() OR 
    EXISTS (SELECT 1 FROM profiles WHERE id=auth.uid() AND role IN ('admin','superadmin')));

-- 4. profiles: Stripe Connect Spalten (falls noch nicht vorhanden)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS stripe_account_id text,
  ADD COLUMN IF NOT EXISTS stripe_connect_status text DEFAULT 'not_connected'
    CHECK (stripe_connect_status IN ('not_connected','pending','active','restricted'));

-- 5. RPC: Käufer bestätigt Erhalt
CREATE OR REPLACE FUNCTION public.rpc_buyer_confirm_receipt(
  p_order_id uuid DEFAULT NULL,
  p_booking_id uuid DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_transfer_needed boolean := false;
BEGIN
  IF p_order_id IS NOT NULL THEN
    UPDATE orders SET
      delivery_status = 'confirmed',
      escrow_status = 'released',
      buyer_confirmed_at = now(),
      escrow_released_at = now(),
      updated_at = now()
    WHERE id = p_order_id
      AND buyer_id = v_user_id  -- nur Käufer darf bestätigen
      AND escrow_status = 'holding'
      AND delivery_status IN ('shipped','delivered');
    IF NOT FOUND THEN
      RETURN jsonb_build_object('ok',false,'error','Order nicht gefunden oder nicht in korrektem Status');
    END IF;
    RETURN jsonb_build_object('ok',true,'type','order','id',p_order_id,'action','confirm_receipt');
  END IF;

  IF p_booking_id IS NOT NULL THEN
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
      RETURN jsonb_build_object('ok',false,'error','Buchung nicht gefunden oder nicht in korrektem Status');
    END IF;
    RETURN jsonb_build_object('ok',true,'type','booking','id',p_booking_id,'action','confirm_receipt');
  END IF;

  RETURN jsonb_build_object('ok',false,'error','order_id oder booking_id erforderlich');
END;
$$;

-- 6. RPC: Verkäufer beantragt Auszahlung
CREATE OR REPLACE FUNCTION public.rpc_seller_request_payout(
  p_order_id uuid DEFAULT NULL,
  p_booking_id uuid DEFAULT NULL,
  p_note text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  IF p_order_id IS NOT NULL THEN
    UPDATE orders SET
      payout_requested_at = now(),
      payout_request_note = p_note,
      delivery_status = 'disputed',
      updated_at = now()
    WHERE id = p_order_id
      AND (metadata->>'seller_id')::uuid = v_user_id  -- Verkäufer
      AND escrow_status = 'holding'
      AND payout_requested_at IS NULL;
    IF NOT FOUND THEN
      RETURN jsonb_build_object('ok',false,'error','Order nicht gefunden oder Antrag bereits gestellt');
    END IF;
    INSERT INTO escrow_disputes (order_id, dispute_type, initiated_by, status)
    VALUES (p_order_id, 'buyer_no_confirm', v_user_id, 'open');
    RETURN jsonb_build_object('ok',true,'type','order','id',p_order_id,'action','payout_requested');
  END IF;

  IF p_booking_id IS NOT NULL THEN
    UPDATE talent_bookings SET
      payout_requested_at = now(),
      payout_request_note = p_note,
      delivery_status = 'disputed',
      updated_at = now()
    WHERE id = p_booking_id
      AND seller_id = v_user_id
      AND escrow_status = 'holding'
      AND payout_requested_at IS NULL;
    IF NOT FOUND THEN
      RETURN jsonb_build_object('ok',false,'error','Buchung nicht gefunden oder Antrag bereits gestellt');
    END IF;
    INSERT INTO escrow_disputes (booking_id, dispute_type, initiated_by, status)
    VALUES (p_booking_id, 'buyer_no_confirm', v_user_id, 'open');
    RETURN jsonb_build_object('ok',true,'type','booking','id',p_booking_id,'action','payout_requested');
  END IF;

  RETURN jsonb_build_object('ok',false,'error','order_id oder booking_id erforderlich');
END;
$$;

-- 7. RPC: Admin gibt Escrow frei (nach Prüfung)
CREATE OR REPLACE FUNCTION public.rpc_admin_release_escrow(
  p_dispute_id uuid,
  p_decision text, -- 'resolved_buyer' oder 'resolved_seller'
  p_admin_note text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_admin_id uuid := auth.uid();
  v_dispute escrow_disputes;
BEGIN
  -- Admin-Check
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id=v_admin_id AND role IN ('admin','superadmin')) THEN
    RETURN jsonb_build_object('ok',false,'error','Keine Admin-Berechtigung');
  END IF;

  SELECT * INTO v_dispute FROM escrow_disputes WHERE id=p_dispute_id AND status='open';
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok',false,'error','Dispute nicht gefunden oder bereits geschlossen');
  END IF;

  UPDATE escrow_disputes SET
    status = p_decision,
    admin_decision = p_admin_note,
    admin_id = v_admin_id,
    resolved_at = now(),
    updated_at = now()
  WHERE id = p_dispute_id;

  -- Bei resolved_seller: Escrow freigeben (Transfer wird via Edge Function getriggert)
  IF p_decision = 'resolved_seller' THEN
    IF v_dispute.order_id IS NOT NULL THEN
      UPDATE orders SET escrow_status='released', escrow_released_at=now()
      WHERE id=v_dispute.order_id;
    END IF;
    IF v_dispute.booking_id IS NOT NULL THEN
      UPDATE talent_bookings SET escrow_status='released', escrow_released_at=now()
      WHERE id=v_dispute.booking_id;
    END IF;
  END IF;

  -- Bei resolved_buyer: Refund
  IF p_decision = 'resolved_buyer' THEN
    IF v_dispute.order_id IS NOT NULL THEN
      UPDATE orders SET escrow_status='refunded', escrow_released_at=now()
      WHERE id=v_dispute.order_id;
    END IF;
    IF v_dispute.booking_id IS NOT NULL THEN
      UPDATE talent_bookings SET escrow_status='refunded', escrow_released_at=now()
      WHERE id=v_dispute.booking_id;
    END IF;
  END IF;

  RETURN jsonb_build_object('ok',true,'dispute_id',p_dispute_id,'decision',p_decision);
END;
$$;

-- 8. Trigger: updated_at für escrow_disputes
CREATE TRIGGER trg_escrow_disputes_updated_at
  BEFORE UPDATE ON escrow_disputes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 9. Auto-Confirm: bestehende paid Orders auf Escrow-Status 'none' belassen
-- (sie wurden bereits ausgezahlt, kein Escrow-Holding nötig)
UPDATE orders SET escrow_status='released' WHERE state='paid' AND escrow_status='none';
