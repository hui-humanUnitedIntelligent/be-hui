-- ═══════════════════════════════════════════════════════════════════
-- ═══════════════════════════════════════════════════════════════════
-- LEGACY — SUPERSEDED BY COMMERCE 2.0 — REMOVE AFTER PHASE 5
-- Kanonische Migration: supabase/migrations/20260627_057_commerce_schema_final.sql
-- ═══════════════════════════════════════════════════════════════════
-- HUI Migration 053 — Commerce Production Final
-- cart_hash für Session-Idempotenz + aborted Order-Status
-- ═══════════════════════════════════════════════════════════════════

-- cart_hash für Idempotenz-Lookup (Session-Wiederverwendung)
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS cart_hash TEXT;

CREATE INDEX IF NOT EXISTS idx_orders_cart_hash
  ON orders(buyer_id, cart_hash, status)
  WHERE status = 'pending';

-- aborted Status für Order-Cleanup bei Stripe-Fehler
DO $$ BEGIN
  ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'aborted';
EXCEPTION WHEN others THEN NULL; END $$;

-- Buyer kann aborted Orders sehen (für Fehler-UX)
CREATE POLICY "orders_buyer_select_aborted" ON orders
  FOR SELECT USING (auth.uid() = buyer_id AND status = 'aborted');

-- ═══════════════════════════════════════════════════════════════════
-- check-order-status: View für Redirect-Rückkehrer
-- Buyer kann eigene Order-Status nach Redirect prüfen
-- ═══════════════════════════════════════════════════════════════════
CREATE OR REPLACE VIEW buyer_order_status AS
  SELECT
    o.id,
    o.buyer_id,
    o.status,
    o.total_eur,
    o.payment_confirmed_at,
    o.created_at,
    o.stripe_payment_intent,
    COUNT(oi.id) AS item_count
  FROM orders o
  LEFT JOIN order_items oi ON oi.order_id = o.id
  WHERE o.buyer_id = auth.uid()
  GROUP BY o.id;

GRANT SELECT ON buyer_order_status TO authenticated;

-- ═══════════════════════════════════════════════════════════════════
-- END Migration 053
-- ═══════════════════════════════════════════════════════════════════
