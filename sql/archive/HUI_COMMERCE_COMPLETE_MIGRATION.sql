-- ═══════════════════════════════════════════════════
-- LEGACY — SUPERSEDED BY COMMERCE 2.0 — REMOVE AFTER PHASE 5
-- Kanonische Migration: hui_057_commerce_schema_final.sql
-- ═══════════════════════════════════════════════════
-- HUI_051_COMMERCE_FOUNDATION.SQL
-- ═══════════════════════════════════════════════════

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


-- ═══════════════════════════════════════════════════
-- HUI_052_COMMERCE_P0_SECURITY.SQL
-- ═══════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════
-- HUI Migration 052 — Commerce P0 Security + Schema Fixes
-- Behebt: stripe_payment_intent UUID→TEXT, RLS-Lücken, Idempotency,
--         increment_wallet_balance RPC, stripe_account_id, webhook_events
-- ═══════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────
-- 1. SCHEMA FIXES
-- ─────────────────────────────────────────────────────────────────

-- Stripe PI-IDs sind Strings (pi_3N...), nicht UUIDs
DO $$ BEGIN
  ALTER TABLE orders
    ALTER COLUMN stripe_payment_intent TYPE TEXT
    USING stripe_payment_intent::TEXT;
EXCEPTION WHEN others THEN
  -- Spalte existiert bereits als TEXT oder Tabelle fehlt
  NULL;
END $$;

-- stripe_session_id war bereits TEXT — sicherstellen
DO $$ BEGIN
  ALTER TABLE orders
    ALTER COLUMN stripe_customer_id TYPE TEXT;
EXCEPTION WHEN others THEN NULL; END $$;

-- stripe_account_id in creator_wallets ergänzen
ALTER TABLE creator_wallets
  ADD COLUMN IF NOT EXISTS stripe_account_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_onboarding_complete BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS stripe_onboarding_url      TEXT,
  ADD COLUMN IF NOT EXISTS stripe_charges_enabled      BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS stripe_payouts_enabled      BOOLEAN DEFAULT false;

-- ─────────────────────────────────────────────────────────────────
-- 2. WEBHOOK EVENTS — Idempotency-Tabelle
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS webhook_events (
  id              UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id TEXT    NOT NULL UNIQUE,   -- event.id von Stripe
  event_type      TEXT    NOT NULL,
  processed_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  payload_summary JSONB   DEFAULT '{}',      -- Kurzinfo für Debugging
  status          TEXT    NOT NULL DEFAULT 'processed' -- processed | failed
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_stripe_id
  ON webhook_events(stripe_event_id);

-- Webhook Events: nur Service Role schreibt, kein User-Zugriff
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
-- Keine User-Policies — nur via Service Role erreichbar

-- ─────────────────────────────────────────────────────────────────
-- 3. RLS HÄRTUNG
-- ─────────────────────────────────────────────────────────────────

-- 3a. orders: Buyer-INSERT entfernen — nur Edge Function (service role) darf inserieren
DROP POLICY IF EXISTS "orders_buyer_insert" ON orders;

-- Buyer kann EIGENE Orders lesen (unverändert)
-- Buyer kann Status NICHT selbst ändern

-- 3b. order_items: Creator darf NUR Fulfillment-Felder updaten
DROP POLICY IF EXISTS "order_items_creator_update" ON order_items;

CREATE POLICY "order_items_creator_update_fulfillment" ON order_items
  FOR UPDATE
  USING (auth.uid() = creator_id)
  WITH CHECK (
    auth.uid() = creator_id
    -- Nur Fulfillment-Felder dürfen geändert werden
    -- payout_status, payout_eur, stripe_transfer_id → nur Service Role
  );

-- Trigger: Creator darf payout_felder nicht ändern
CREATE OR REPLACE FUNCTION enforce_creator_fulfillment_only()
RETURNS TRIGGER AS $$
BEGIN
  -- Wenn Nicht-Service-Role versucht Payout-Felder zu ändern → ablehnen
  IF current_user != 'service_role' THEN
    IF NEW.payout_status    IS DISTINCT FROM OLD.payout_status    OR
       NEW.payout_eur       IS DISTINCT FROM OLD.payout_eur       OR
       NEW.payout_released_at IS DISTINCT FROM OLD.payout_released_at OR
       NEW.payout_paid_at   IS DISTINCT FROM OLD.payout_paid_at   OR
       NEW.stripe_transfer_id IS DISTINCT FROM OLD.stripe_transfer_id THEN
      RAISE EXCEPTION 'Payout-Felder dürfen nur durch die Commerce Engine geändert werden';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_creator_fulfillment_only ON order_items;
CREATE TRIGGER trg_creator_fulfillment_only
  BEFORE UPDATE ON order_items
  FOR EACH ROW EXECUTE FUNCTION enforce_creator_fulfillment_only();

-- 3c. creator_wallets: User darf Balance-Felder NICHT direkt ändern
DROP POLICY IF EXISTS "wallet_owner_update" ON creator_wallets;
DROP POLICY IF EXISTS "wallets_user_update" ON creator_wallets;

-- Nur Lese-Zugriff für Owner — Writes nur via Service Role
CREATE POLICY "wallets_owner_select" ON creator_wallets
  FOR SELECT USING (auth.uid() = user_id);

-- Balance-Schutz-Trigger
CREATE OR REPLACE FUNCTION enforce_wallet_immutable_balance()
RETURNS TRIGGER AS $$
BEGIN
  IF current_user != 'service_role' THEN
    IF NEW.balance          IS DISTINCT FROM OLD.balance          OR
       NEW.pending_balance  IS DISTINCT FROM OLD.pending_balance  OR
       NEW.total_earned     IS DISTINCT FROM OLD.total_earned     THEN
      RAISE EXCEPTION 'Wallet-Balance darf nur durch die Commerce Engine geändert werden';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_wallet_balance_guard ON creator_wallets;
CREATE TRIGGER trg_wallet_balance_guard
  BEFORE UPDATE ON creator_wallets
  FOR EACH ROW EXECUTE FUNCTION enforce_wallet_immutable_balance();

-- 3d. work_sales: payment_status-Felder schreibschützen
CREATE OR REPLACE FUNCTION enforce_sale_payment_immutable()
RETURNS TRIGGER AS $$
BEGIN
  IF current_user != 'service_role' THEN
    IF NEW.payment_status IS DISTINCT FROM OLD.payment_status OR
       NEW.amount         IS DISTINCT FROM OLD.amount THEN
      RAISE EXCEPTION 'Payment-Felder in work_sales sind durch die Commerce Engine geschützt';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sale_payment_guard ON work_sales;
CREATE TRIGGER trg_sale_payment_guard
  BEFORE UPDATE ON work_sales
  FOR EACH ROW EXECUTE FUNCTION enforce_sale_payment_immutable();

-- ─────────────────────────────────────────────────────────────────
-- 4. RPC: increment_wallet_balance (Service Role Only)
-- ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION increment_wallet_balance(
  p_user_id UUID,
  p_amount  NUMERIC
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER  -- läuft als definer (service role)
AS $$
BEGIN
  -- Upsert: Wallet anlegen falls nicht vorhanden
  INSERT INTO creator_wallets (user_id, balance, total_earned, pending_balance)
  VALUES (p_user_id, p_amount, p_amount, 0)
  ON CONFLICT (user_id) DO UPDATE SET
    balance      = creator_wallets.balance + EXCLUDED.balance,
    total_earned = creator_wallets.total_earned + EXCLUDED.total_earned,
    updated_at   = now();
END;
$$;

-- Nur via Service Role aufrufbar (nicht direkt durch User)
REVOKE ALL ON FUNCTION increment_wallet_balance FROM PUBLIC;
GRANT EXECUTE ON FUNCTION increment_wallet_balance TO service_role;

-- ─────────────────────────────────────────────────────────────────
-- 5. creator_wallets: updated_at Trigger (falls fehlend)
-- ─────────────────────────────────────────────────────────────────
DO $$ BEGIN
  ALTER TABLE creator_wallets ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
EXCEPTION WHEN others THEN NULL; END $$;

DROP TRIGGER IF EXISTS trg_creator_wallets_updated_at ON creator_wallets;
CREATE TRIGGER trg_creator_wallets_updated_at
  BEFORE UPDATE ON creator_wallets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─────────────────────────────────────────────────────────────────
-- 6. PRICE AUTHORITY VIEW — Server liest Preise direkt aus DB
-- Wird von create-payment-intent genutzt für DB-Lookup
-- ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW commerce_price_authority AS
  SELECT
    'work'       AS item_type,
    id           AS item_id,
    user_id      AS creator_id,
    price        AS price_eur,
    0            AS shipping_eur,   -- TODO: Versandkostenfeld
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
    price        AS price_eur,
    0            AS shipping_eur,
    title,
    cover_url,
    status
  FROM experiences
  WHERE status IN ('published', 'approved');

-- Service Role kann View lesen
GRANT SELECT ON commerce_price_authority TO service_role;

-- ═══════════════════════════════════════════════════════════════════
-- END Migration 052
-- ═══════════════════════════════════════════════════════════════════


-- ═══════════════════════════════════════════════════
-- HUI_053_CART_HASH_ABORTED.SQL
-- ═══════════════════════════════════════════════════

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


-- ═══════════════════════════════════════════════════
-- HUI_054_INFRASTRUCTURE_SYNC.SQL
-- ═══════════════════════════════════════════════════

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


-- ═══════════════════════════════════════════════════════════════════
-- VERIFIKATION: Nach Ausführung prüfen
-- ═══════════════════════════════════════════════════════════════════
SELECT 
  tablename,
  '✅ vorhanden' as status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'orders','order_items','commerce_events',
    'webhook_events','creator_wallets','creator_payouts',
    'shipments','impact_rounds'
  )

UNION ALL

SELECT 
  viewname as tablename,
  '✅ vorhanden (View)' as status
FROM pg_views
WHERE schemaname = 'public'
  AND viewname IN ('commerce_price_authority','buyer_order_status')

ORDER BY 1;
