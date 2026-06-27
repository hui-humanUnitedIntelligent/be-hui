-- ═══════════════════════════════════════════════════════════════════
-- HUI Migration 051 — Commerce Engine Foundation
-- Sprint C1: Orders · Order Items · Shipments · Payouts · Events
-- ═══════════════════════════════════════════════════════════════════
-- Prinzipien:
--   ✅ Additiv — keine bestehenden Tabellen oder Daten verändert
--   ✅ Snapshots — Order Items speichern Kaufzeitpunkt-Zustand
--   ✅ Multi-Creator — 1 Order, N Order Items, N Creator
--   ✅ Payment ≠ Payout — strikt getrennte Felder + Statuses
--   ✅ Legacy-kompatibel — work_sales + experience_bookings bleiben
-- ═══════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────
-- ENUM TYPEN
-- ─────────────────────────────────────────────────────────────────

-- Produkttypen (Shipping Resolver)
DO $$ BEGIN
  CREATE TYPE commerce_item_type AS ENUM (
    'work', 'experience', 'event', 'service', 'support', 'pickup'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Versandtypen
DO $$ BEGIN
  CREATE TYPE shipping_type AS ENUM (
    'physical', 'digital', 'experience', 'service', 'pickup', 'none'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Order-Gesamtstatus
DO $$ BEGIN
  CREATE TYPE order_status AS ENUM (
    'pending', 'paid', 'partially_fulfilled', 'fulfilled',
    'cancelled', 'refunded', 'failed'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Fulfillment-Status pro Order Item
DO $$ BEGIN
  CREATE TYPE fulfillment_status AS ENUM (
    'new', 'processing', 'shipped', 'delivered', 'done',
    'cancelled', 'returned'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Payout-Status pro Order Item
DO $$ BEGIN
  CREATE TYPE payout_status AS ENUM (
    'held', 'pending_release', 'released', 'paid', 'failed', 'refunded'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Commerce Event Types
DO $$ BEGIN
  CREATE TYPE commerce_event_type AS ENUM (
    'order_created', 'payment_confirmed', 'payment_failed',
    'item_processing', 'item_shipped', 'item_delivered', 'item_done',
    'item_cancelled', 'item_returned',
    'payout_released', 'payout_paid', 'payout_failed',
    'tracking_added', 'refund_initiated', 'refund_completed',
    'impact_credited'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─────────────────────────────────────────────────────────────────
-- ORDERS — eine pro Checkout-Session (ggf. mehrere Creator)
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Käufer
  buyer_id              UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  contact_name          TEXT,
  contact_email         TEXT,

  -- Stripe
  stripe_payment_intent UUID UNIQUE,         -- set nach Webhook
  stripe_session_id     TEXT UNIQUE,          -- Checkout Session ID
  stripe_customer_id    TEXT,

  -- Shipping (nur bei physical items)
  shipping_address      JSONB,               -- {name, line1, line2, city, postal_code, country}

  -- Beträge (alle in EUR Cent oder Dezimal — konsistent)
  subtotal_eur          NUMERIC(10,2) DEFAULT 0,
  shipping_eur          NUMERIC(10,2) DEFAULT 0,
  discount_eur          NUMERIC(10,2) DEFAULT 0,
  total_eur             NUMERIC(10,2) DEFAULT 0,
  platform_fee_eur      NUMERIC(10,2) DEFAULT 0,
  impact_eur            NUMERIC(10,2) DEFAULT 0,

  -- Status
  status                order_status NOT NULL DEFAULT 'pending',
  payment_confirmed_at  TIMESTAMPTZ,
  cancelled_at          TIMESTAMPTZ,

  -- Metadaten
  currency              TEXT NOT NULL DEFAULT 'eur',
  notes                 TEXT,
  metadata              JSONB,               -- erweiterbar ohne Migration

  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────────
-- ORDER ITEMS — ein Eintrag pro Werk/Erlebnis/Creator
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_items (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id              UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,

  -- Creator (Empfänger dieser Position)
  creator_id            UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Item-Referenz (soft — Snapshot ist die echte Quelle)
  item_type             commerce_item_type NOT NULL,
  item_id               UUID,               -- FK zu works.id / experiences.id (nullable bei support)

  -- Snapshot — Kaufzeitpunkt-Zustand (unveränderlich nach Erstellung)
  snapshot              JSONB NOT NULL DEFAULT '{}',
  -- Struktur:
  -- {
  --   title, description, price, cover_url, creator_name, creator_avatar,
  --   shipping_cost, impact_eur, category, delivery_type,
  --   variant: { name, sku }, captured_at
  -- }

  -- Versand
  shipping_type         shipping_type NOT NULL DEFAULT 'none',

  -- Mengen + Preise
  quantity              INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price_eur        NUMERIC(10,2) NOT NULL DEFAULT 0,
  shipping_eur          NUMERIC(10,2) NOT NULL DEFAULT 0,
  line_total_eur        NUMERIC(10,2) GENERATED ALWAYS AS
                          (unit_price_eur * quantity + shipping_eur) STORED,

  -- Fulfillment (Creator steuert dies)
  fulfillment_status    fulfillment_status NOT NULL DEFAULT 'new',
  fulfillment_note      TEXT,
  fulfilled_at          TIMESTAMPTZ,

  -- Payout (von HUI gesteuert — getrennt von Payment)
  payout_status         payout_status NOT NULL DEFAULT 'held',
  payout_eur            NUMERIC(10,2),       -- Auszahlungsbetrag (nach Plattformgebühr)
  payout_released_at    TIMESTAMPTZ,
  payout_paid_at        TIMESTAMPTZ,
  stripe_transfer_id    TEXT,               -- Stripe Connect Transfer ID

  -- Impact (pro Item berechnet)
  impact_eur            NUMERIC(10,2) DEFAULT 0,

  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────────
-- SHIPMENTS — Versanddetails pro Order Item
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shipments (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_item_id         UUID NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
  order_id              UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,

  -- Tracking
  carrier               TEXT,               -- DHL, DPD, UPS, etc.
  tracking_number       TEXT,
  tracking_url          TEXT,

  -- Status
  shipped_at            TIMESTAMPTZ,
  estimated_delivery    DATE,
  delivered_at          TIMESTAMPTZ,

  -- Adresse (Kopie aus Order — für Rückverfolgung)
  recipient_address     JSONB,

  notes                 TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────────
-- CREATOR PAYOUTS — aggregierte Auszahlungen
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS creator_payouts (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id            UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Order Items in diesem Payout (Array von UUIDs)
  order_item_ids        UUID[] NOT NULL DEFAULT '{}',

  -- Stripe Connect
  stripe_account_id     TEXT,               -- Creator Stripe Connect Account
  stripe_transfer_id    TEXT UNIQUE,        -- Transfer ID

  -- Beträge
  gross_eur             NUMERIC(10,2) NOT NULL DEFAULT 0,
  platform_fee_eur      NUMERIC(10,2) NOT NULL DEFAULT 0,
  net_eur               NUMERIC(10,2) NOT NULL DEFAULT 0,

  -- Status
  status                payout_status NOT NULL DEFAULT 'held',
  initiated_at          TIMESTAMPTZ,
  paid_at               TIMESTAMPTZ,
  failed_at             TIMESTAMPTZ,
  failure_reason        TEXT,

  metadata              JSONB,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────────
-- COMMERCE EVENTS — Audit Log für alle Commerce-Prozesse
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS commerce_events (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type            commerce_event_type NOT NULL,

  -- Referenzen (nullable — Event kann verschiedene Ebenen betreffen)
  order_id              UUID REFERENCES orders(id) ON DELETE SET NULL,
  order_item_id         UUID REFERENCES order_items(id) ON DELETE SET NULL,
  payout_id             UUID REFERENCES creator_payouts(id) ON DELETE SET NULL,

  -- Akteur
  actor_id              UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_type            TEXT,               -- 'buyer', 'creator', 'system', 'webhook', 'admin'

  -- Payload (freie Struktur für Event-spezifische Daten)
  payload               JSONB NOT NULL DEFAULT '{}',

  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────────
-- INDIZES
-- ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_orders_buyer        ON orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_stripe_pi    ON orders(stripe_payment_intent);
CREATE INDEX IF NOT EXISTS idx_orders_status       ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created      ON orders(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_order_items_order   ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_creator ON order_items(creator_id);
CREATE INDEX IF NOT EXISTS idx_order_items_item    ON order_items(item_id);
CREATE INDEX IF NOT EXISTS idx_order_items_fulfill ON order_items(fulfillment_status);
CREATE INDEX IF NOT EXISTS idx_order_items_payout  ON order_items(payout_status);

CREATE INDEX IF NOT EXISTS idx_shipments_item      ON shipments(order_item_id);
CREATE INDEX IF NOT EXISTS idx_shipments_order     ON shipments(order_id);

CREATE INDEX IF NOT EXISTS idx_creator_payouts_creator ON creator_payouts(creator_id);
CREATE INDEX IF NOT EXISTS idx_creator_payouts_status  ON creator_payouts(status);

CREATE INDEX IF NOT EXISTS idx_commerce_events_order   ON commerce_events(order_id);
CREATE INDEX IF NOT EXISTS idx_commerce_events_creator ON commerce_events(order_item_id);
CREATE INDEX IF NOT EXISTS idx_commerce_events_type    ON commerce_events(event_type);
CREATE INDEX IF NOT EXISTS idx_commerce_events_created ON commerce_events(created_at DESC);

-- ─────────────────────────────────────────────────────────────────
-- UPDATED_AT TRIGGER
-- ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_orders_updated_at        ON orders;
DROP TRIGGER IF EXISTS trg_order_items_updated_at   ON order_items;
DROP TRIGGER IF EXISTS trg_shipments_updated_at     ON shipments;
DROP TRIGGER IF EXISTS trg_creator_payouts_updated_at ON creator_payouts;

CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_order_items_updated_at
  BEFORE UPDATE ON order_items FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_shipments_updated_at
  BEFORE UPDATE ON shipments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_creator_payouts_updated_at
  BEFORE UPDATE ON creator_payouts FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─────────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE orders            ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items       ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments         ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_payouts   ENABLE ROW LEVEL SECURITY;
ALTER TABLE commerce_events   ENABLE ROW LEVEL SECURITY;

-- orders: Käufer sieht eigene Orders
CREATE POLICY "orders_buyer_select" ON orders
  FOR SELECT USING (auth.uid() = buyer_id);
CREATE POLICY "orders_buyer_insert" ON orders
  FOR INSERT WITH CHECK (auth.uid() = buyer_id);

-- order_items: Creator sieht eigene Items, Käufer sieht seine Order
CREATE POLICY "order_items_creator_select" ON order_items
  FOR SELECT USING (
    auth.uid() = creator_id
    OR auth.uid() IN (SELECT buyer_id FROM orders WHERE id = order_id)
  );
CREATE POLICY "order_items_creator_update" ON order_items
  FOR UPDATE USING (auth.uid() = creator_id)
  WITH CHECK (auth.uid() = creator_id);

-- shipments: Creator (über order_item) + Käufer (über order)
CREATE POLICY "shipments_creator_select" ON shipments
  FOR SELECT USING (
    auth.uid() IN (SELECT creator_id FROM order_items WHERE id = order_item_id)
    OR auth.uid() IN (SELECT buyer_id FROM orders WHERE id = order_id)
  );
CREATE POLICY "shipments_creator_insert" ON shipments
  FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT creator_id FROM order_items WHERE id = order_item_id)
  );
CREATE POLICY "shipments_creator_update" ON shipments
  FOR UPDATE USING (
    auth.uid() IN (SELECT creator_id FROM order_items WHERE id = order_item_id)
  );

-- creator_payouts: nur eigene
CREATE POLICY "creator_payouts_select" ON creator_payouts
  FOR SELECT USING (auth.uid() = creator_id);

-- commerce_events: Creator sieht Events zu eigenen Items
CREATE POLICY "commerce_events_select" ON commerce_events
  FOR SELECT USING (
    auth.uid() IN (SELECT creator_id FROM order_items WHERE id = order_item_id)
    OR auth.uid() IN (SELECT buyer_id FROM orders WHERE id = order_id)
  );

-- ═══════════════════════════════════════════════════════════════════
-- END Migration 051
-- ═══════════════════════════════════════════════════════════════════
