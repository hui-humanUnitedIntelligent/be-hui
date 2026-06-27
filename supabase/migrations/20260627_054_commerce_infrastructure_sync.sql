-- ═══════════════════════════════════════════════════════════════════
-- ═══════════════════════════════════════════════════════════════════
-- LEGACY — SUPERSEDED BY COMMERCE 2.0 — REMOVE AFTER PHASE 5
-- Kanonische Migration: supabase/migrations/20260627_057_commerce_schema_final.sql
-- ═══════════════════════════════════════════════════════════════════
-- HUI Migration 054 — Commerce Infrastructure Sync
-- Zweck: Fehlende Spalten und Tabellen ergänzen (non-destructive)
-- Befund: orders/order_items existieren als Stubs, alle Commerce-2.0-
--         Felder fehlen; 5 Tabellen fehlen komplett
-- ═══════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────
-- 1. orders: fehlende Spalten ergänzen
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS buyer_id         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS status           TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS currency         TEXT NOT NULL DEFAULT 'eur',
  ADD COLUMN IF NOT EXISTS subtotal_eur     NUMERIC(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS shipping_eur     NUMERIC(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS platform_fee_eur NUMERIC(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS impact_eur       NUMERIC(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS stripe_payment_intent TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS stripe_customer_id    TEXT,
  ADD COLUMN IF NOT EXISTS cart_hash        TEXT,
  ADD COLUMN IF NOT EXISTS contact_name     TEXT,
  ADD COLUMN IF NOT EXISTS contact_email    TEXT,
  ADD COLUMN IF NOT EXISTS shipping_address JSONB,
  ADD COLUMN IF NOT EXISTS payment_confirmed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS notes            TEXT;

-- status Constraint (idempotent)
DO $$ BEGIN
  ALTER TABLE orders ADD CONSTRAINT orders_status_check
    CHECK (status IN ('pending','paid','failed','aborted','refunded'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Index für Idempotenz-Lookup
CREATE INDEX IF NOT EXISTS idx_orders_buyer_pending
  ON orders(buyer_id, status) WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_orders_cart_hash
  ON orders(buyer_id, cart_hash, status) WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_orders_stripe_pi
  ON orders(stripe_payment_intent);

-- RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "orders_buyer_select" ON orders;
CREATE POLICY "orders_buyer_select" ON orders
  FOR SELECT USING (auth.uid() = buyer_id);
-- INSERT/UPDATE: nur Service Role (keine User-Policy)

-- ─────────────────────────────────────────────────────────────────
-- 2. order_items: fehlende Spalten ergänzen
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS creator_id         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS item_type          TEXT NOT NULL DEFAULT 'work',
  ADD COLUMN IF NOT EXISTS item_id            UUID,
  ADD COLUMN IF NOT EXISTS snapshot           JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS shipping_type      TEXT NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS shipping_eur       NUMERIC(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payout_eur         NUMERIC(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS impact_eur         NUMERIC(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS platform_fee_eur   NUMERIC(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fulfillment_status TEXT NOT NULL DEFAULT 'new',
  ADD COLUMN IF NOT EXISTS payout_status      TEXT NOT NULL DEFAULT 'held',
  ADD COLUMN IF NOT EXISTS payout_released_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS payout_paid_at     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS stripe_transfer_id TEXT,
  ADD COLUMN IF NOT EXISTS tracking_number    TEXT,
  ADD COLUMN IF NOT EXISTS shipped_at         TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS delivered_at       TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS created_at         TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at         TIMESTAMPTZ DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_order_items_order_id
  ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_creator_id
  ON order_items(creator_id);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "order_items_creator_select" ON order_items;
CREATE POLICY "order_items_creator_select" ON order_items
  FOR SELECT USING (auth.uid() = creator_id);

-- ─────────────────────────────────────────────────────────────────
-- 3. Fehlende Tabellen: commerce_events
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS commerce_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type  TEXT NOT NULL,
  order_id    UUID REFERENCES orders(id) ON DELETE SET NULL,
  actor_id    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_type  TEXT NOT NULL DEFAULT 'system',
  payload     JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_commerce_events_order ON commerce_events(order_id);
ALTER TABLE commerce_events ENABLE ROW LEVEL SECURITY;
-- Nur Service Role schreibt — kein User-Zugriff

-- ─────────────────────────────────────────────────────────────────
-- 4. Fehlende Tabellen: webhook_events
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS webhook_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id TEXT NOT NULL UNIQUE,
  event_type      TEXT NOT NULL,
  processed_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  payload_summary JSONB DEFAULT '{}',
  status          TEXT NOT NULL DEFAULT 'processed'
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_stripe_id
  ON webhook_events(stripe_event_id);
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
-- Nur Service Role

-- ─────────────────────────────────────────────────────────────────
-- 5. Fehlende Tabellen: creator_wallets
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS creator_wallets (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                   UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  balance                   NUMERIC(10,2) NOT NULL DEFAULT 0,
  pending_balance           NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_earned              NUMERIC(10,2) NOT NULL DEFAULT 0,
  stripe_account_id         TEXT,
  stripe_onboarding_complete BOOLEAN DEFAULT false,
  stripe_charges_enabled    BOOLEAN DEFAULT false,
  stripe_payouts_enabled    BOOLEAN DEFAULT false,
  stripe_onboarding_url     TEXT,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE creator_wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wallets_owner_select" ON creator_wallets
  FOR SELECT USING (auth.uid() = user_id);
-- Balance-Writes: nur Service Role

-- ─────────────────────────────────────────────────────────────────
-- 6. Fehlende Tabellen: creator_payouts
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS creator_payouts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id          UUID REFERENCES orders(id) ON DELETE SET NULL,
  amount_eur        NUMERIC(10,2) NOT NULL DEFAULT 0,
  status            TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','processing','paid','failed')),
  stripe_transfer_id TEXT,
  paid_at           TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE creator_payouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payouts_creator_select" ON creator_payouts
  FOR SELECT USING (auth.uid() = creator_id);

-- ─────────────────────────────────────────────────────────────────
-- 7. Fehlende Tabellen: shipments
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shipments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  order_item_id   UUID REFERENCES order_items(id) ON DELETE SET NULL,
  creator_id      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  carrier         TEXT,
  tracking_number TEXT,
  tracking_url    TEXT,
  status          TEXT NOT NULL DEFAULT 'preparing',
  shipped_at      TIMESTAMPTZ,
  delivered_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "shipments_creator_select" ON shipments
  FOR SELECT USING (auth.uid() = creator_id);

-- ─────────────────────────────────────────────────────────────────
-- 8. commerce_price_authority View
-- ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW commerce_price_authority AS
  SELECT
    'work'       AS item_type,
    id           AS item_id,
    user_id      AS creator_id,
    COALESCE(price, 0) AS price_eur,
    0            AS shipping_eur,
    title,
    cover_url,
    status
  FROM works
  WHERE status IN ('published', 'approved')

  UNION ALL

  SELECT
    'experience' AS item_type,
    id           AS item_id,
    user_id      AS creator_id,
    COALESCE(price, 0) AS price_eur,
    0            AS shipping_eur,
    title,
    cover_url,
    status
  FROM experiences
  WHERE status IN ('published', 'approved');

GRANT SELECT ON commerce_price_authority TO service_role;
GRANT SELECT ON commerce_price_authority TO authenticated;

-- ─────────────────────────────────────────────────────────────────
-- 9. buyer_order_status View (für Redirect Handler)
-- ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW buyer_order_status AS
  SELECT
    o.id,
    o.buyer_id,
    o.status,
    o.total_eur,
    o.impact_eur,
    o.payment_confirmed_at,
    o.created_at,
    o.stripe_payment_intent,
    COUNT(oi.id) AS item_count
  FROM orders o
  LEFT JOIN order_items oi ON oi.order_id = o.id
  WHERE o.buyer_id = auth.uid()
  GROUP BY o.id;

GRANT SELECT ON buyer_order_status TO authenticated;

-- ─────────────────────────────────────────────────────────────────
-- 10. increment_wallet_balance RPC
-- ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION increment_wallet_balance(
  p_user_id UUID,
  p_amount  NUMERIC
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO creator_wallets (user_id, balance, total_earned, pending_balance)
  VALUES (p_user_id, p_amount, p_amount, 0)
  ON CONFLICT (user_id) DO UPDATE SET
    balance      = creator_wallets.balance + EXCLUDED.balance,
    total_earned = creator_wallets.total_earned + EXCLUDED.total_earned,
    updated_at   = now();
END;
$$;

REVOKE ALL ON FUNCTION increment_wallet_balance FROM PUBLIC;
GRANT EXECUTE ON FUNCTION increment_wallet_balance TO service_role;

-- ─────────────────────────────────────────────────────────────────
-- 11. impact_rounds sicherstellen (für Webhook)
-- ─────────────────────────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'impact_rounds' AND schemaname = 'public') THEN
    CREATE TABLE IF NOT EXISTS impact_rounds (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      month       TEXT NOT NULL,
      status      TEXT NOT NULL DEFAULT 'active',
      pool_eur    NUMERIC(10,2) NOT NULL DEFAULT 0,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    ALTER TABLE impact_rounds ENABLE ROW LEVEL SECURITY;
    -- Aktive Runde für aktuellen Monat anlegen
    INSERT INTO impact_rounds (month, status, pool_eur)
    VALUES (to_char(now(), 'YYYY-MM'), 'active', 0)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- Aktuelle Runde sicherstellen
INSERT INTO impact_rounds (month, status, pool_eur)
SELECT to_char(now(), 'YYYY-MM'), 'active', 0
WHERE NOT EXISTS (
  SELECT 1 FROM impact_rounds WHERE status = 'active'
) ON CONFLICT DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════
-- END Migration 054
-- ═══════════════════════════════════════════════════════════════════
