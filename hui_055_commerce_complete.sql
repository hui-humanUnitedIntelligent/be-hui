-- ═══════════════════════════════════════════════════════════════════════════════
-- HUI Migration 055 — Commerce Complete (Production Safe)
-- ═══════════════════════════════════════════════════════════════════════════════
-- Zweck: Erstellt ALLE Commerce-Tabellen, Views, Funktionen und Policies
--        die von den Edge Functions benötigt werden.
--        Sicher für bestehende DBs: CREATE IF NOT EXISTS überall.
--        Idempotent: Kann mehrfach ausgeführt werden.
--
-- Benötigte Objekte (aus Edge Function Analyse):
--   VIEWS:  commerce_price_authority, buyer_order_status
--   TABLES: orders, order_items, shipments, creator_wallets,
--           creator_payouts, commerce_events, webhook_events, impact_rounds
--   FUNCS:  increment_wallet_balance, update_updated_at
-- ═══════════════════════════════════════════════════════════════════════════════

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. ENUM TYPEN (sicher — EXCEPTION bei Duplikat)
-- ─────────────────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE commerce_item_type AS ENUM (
    'work', 'experience', 'event', 'service', 'support', 'pickup'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE shipping_type AS ENUM (
    'physical', 'digital', 'experience', 'service', 'pickup', 'none'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE order_status AS ENUM (
    'pending', 'paid', 'partially_fulfilled', 'fulfilled',
    'cancelled', 'refunded', 'failed', 'aborted'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE fulfillment_status AS ENUM (
    'new', 'processing', 'shipped', 'delivered', 'done',
    'cancelled', 'returned'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE payout_status AS ENUM (
    'held', 'pending_release', 'released', 'paid', 'failed', 'refunded'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

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

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. update_updated_at TRIGGER FUNKTION
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. ORDERS — Haupt-Bestelltabelle
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS orders (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  buyer_id              UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  contact_name          TEXT,
  contact_email         TEXT,

  -- Stripe (TEXT — Stripe IDs sind keine UUIDs)
  stripe_payment_intent TEXT UNIQUE,
  stripe_session_id     TEXT UNIQUE,
  stripe_customer_id    TEXT,

  -- Shipping
  shipping_address      JSONB,

  -- Beträge (EUR)
  subtotal_eur          NUMERIC(10,2) NOT NULL DEFAULT 0,
  shipping_eur          NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount_eur          NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_eur             NUMERIC(10,2) NOT NULL DEFAULT 0,
  platform_fee_eur      NUMERIC(10,2) NOT NULL DEFAULT 0,
  impact_eur            NUMERIC(10,2) NOT NULL DEFAULT 0,

  -- Cart-Hash für Idempotenz (verhindert doppelte Orders)
  cart_hash             TEXT,

  -- Status (TEXT für maximale Kompatibilität)
  status                TEXT NOT NULL DEFAULT 'pending',
  payment_confirmed_at  TIMESTAMPTZ,
  cancelled_at          TIMESTAMPTZ,

  currency              TEXT NOT NULL DEFAULT 'eur',
  notes                 TEXT,
  metadata              JSONB,

  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- stripe_payment_intent: Typ-Fix falls UUID (alter Schema)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders'
      AND column_name = 'stripe_payment_intent'
      AND data_type = 'uuid'
  ) THEN
    ALTER TABLE orders ALTER COLUMN stripe_payment_intent TYPE TEXT USING stripe_payment_intent::TEXT;
  END IF;
END $$;

-- Fehlende Spalten ergänzen (idempotent)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cart_hash            TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS contact_name         TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS contact_email        TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_address     JSONB;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_eur         NUMERIC(10,2) NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS platform_fee_eur     NUMERIC(10,2) NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS impact_eur           NUMERIC(10,2) NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_confirmed_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancelled_at         TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS metadata             JSONB;

-- Status-Constraint (sicher — Exception bei Duplikat)
DO $$ BEGIN
  ALTER TABLE orders ADD CONSTRAINT orders_status_check
    CHECK (status IN ('pending','paid','partially_fulfilled','fulfilled',
                      'cancelled','refunded','failed','aborted'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Trigger
DROP TRIGGER IF EXISTS trg_orders_updated_at ON orders;
CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Indizes
CREATE INDEX IF NOT EXISTS idx_orders_buyer        ON orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_stripe_pi    ON orders(stripe_payment_intent);
CREATE INDEX IF NOT EXISTS idx_orders_status       ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created      ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_cart_hash    ON orders(cart_hash) WHERE cart_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_buyer_pending ON orders(buyer_id, status) WHERE status = 'pending';

-- RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "orders_buyer_select"  ON orders;
DROP POLICY IF EXISTS "orders_service_all"   ON orders;

CREATE POLICY "orders_buyer_select" ON orders
  FOR SELECT USING (auth.uid() = buyer_id);

CREATE POLICY "orders_service_all" ON orders
  FOR ALL TO service_role USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE ON orders TO authenticated;
GRANT ALL ON orders TO service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. ORDER_ITEMS — Positionen pro Bestellung
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS order_items (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id              UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,

  creator_id            UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  item_type             TEXT NOT NULL DEFAULT 'work',
  item_id               UUID,

  snapshot              JSONB NOT NULL DEFAULT '{}',

  shipping_type         TEXT NOT NULL DEFAULT 'none',

  quantity              INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price_eur        NUMERIC(10,2) NOT NULL DEFAULT 0,
  shipping_eur          NUMERIC(10,2) NOT NULL DEFAULT 0,

  -- Fulfillment
  fulfillment_status    TEXT NOT NULL DEFAULT 'new',
  fulfillment_note      TEXT,
  fulfilled_at          TIMESTAMPTZ,

  -- Payout
  payout_status         TEXT NOT NULL DEFAULT 'held',
  payout_eur            NUMERIC(10,2),
  payout_released_at    TIMESTAMPTZ,
  payout_paid_at        TIMESTAMPTZ,

  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE order_items ADD COLUMN IF NOT EXISTS fulfillment_note TEXT;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS fulfilled_at     TIMESTAMPTZ;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS payout_released_at TIMESTAMPTZ;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS payout_paid_at   TIMESTAMPTZ;

DROP TRIGGER IF EXISTS trg_order_items_updated_at ON order_items;
CREATE TRIGGER trg_order_items_updated_at
  BEFORE UPDATE ON order_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS idx_order_items_order   ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_creator ON order_items(creator_id);
CREATE INDEX IF NOT EXISTS idx_order_items_item    ON order_items(item_id);
CREATE INDEX IF NOT EXISTS idx_order_items_fulfill ON order_items(fulfillment_status);
CREATE INDEX IF NOT EXISTS idx_order_items_payout  ON order_items(payout_status);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "order_items_buyer_select"   ON order_items;
DROP POLICY IF EXISTS "order_items_creator_select" ON order_items;
DROP POLICY IF EXISTS "order_items_service_all"    ON order_items;

CREATE POLICY "order_items_buyer_select" ON order_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.buyer_id = auth.uid())
  );

CREATE POLICY "order_items_creator_select" ON order_items
  FOR SELECT USING (creator_id = auth.uid());

CREATE POLICY "order_items_service_all" ON order_items
  FOR ALL TO service_role USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE ON order_items TO authenticated;
GRANT ALL ON order_items TO service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. SHIPMENTS — Versandverfolgung
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS shipments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id          UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  order_item_id     UUID REFERENCES order_items(id) ON DELETE CASCADE,
  creator_id        UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  carrier           TEXT,
  tracking_number   TEXT,
  tracking_url      TEXT,

  shipped_at        TIMESTAMPTZ,
  estimated_delivery TIMESTAMPTZ,
  delivered_at      TIMESTAMPTZ,

  notes             TEXT,
  metadata          JSONB,

  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_shipments_updated_at ON shipments;
CREATE TRIGGER trg_shipments_updated_at
  BEFORE UPDATE ON shipments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS idx_shipments_order     ON shipments(order_id);
CREATE INDEX IF NOT EXISTS idx_shipments_item      ON shipments(order_item_id);
CREATE INDEX IF NOT EXISTS idx_shipments_creator   ON shipments(creator_id);

ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "shipments_creator_all"  ON shipments;
DROP POLICY IF EXISTS "shipments_buyer_select" ON shipments;
DROP POLICY IF EXISTS "shipments_service_all"  ON shipments;

CREATE POLICY "shipments_creator_all" ON shipments
  FOR ALL USING (creator_id = auth.uid()) WITH CHECK (creator_id = auth.uid());

CREATE POLICY "shipments_buyer_select" ON shipments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = shipments.order_id AND orders.buyer_id = auth.uid())
  );

CREATE POLICY "shipments_service_all" ON shipments
  FOR ALL TO service_role USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE ON shipments TO authenticated;
GRANT ALL ON shipments TO service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. CREATOR_WALLETS — Guthabenkonten der Creator
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS creator_wallets (
  id                         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                    UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  balance                    NUMERIC(10,2) NOT NULL DEFAULT 0,
  pending_balance            NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_earned               NUMERIC(10,2) NOT NULL DEFAULT 0,
  stripe_account_id          TEXT,
  stripe_onboarding_complete BOOLEAN DEFAULT false,
  stripe_charges_enabled     BOOLEAN DEFAULT false,
  stripe_payouts_enabled     BOOLEAN DEFAULT false,
  stripe_onboarding_url      TEXT,
  created_at                 TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                 TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE creator_wallets ADD COLUMN IF NOT EXISTS stripe_account_id          TEXT;
ALTER TABLE creator_wallets ADD COLUMN IF NOT EXISTS stripe_onboarding_complete BOOLEAN DEFAULT false;
ALTER TABLE creator_wallets ADD COLUMN IF NOT EXISTS stripe_charges_enabled     BOOLEAN DEFAULT false;
ALTER TABLE creator_wallets ADD COLUMN IF NOT EXISTS stripe_payouts_enabled     BOOLEAN DEFAULT false;
ALTER TABLE creator_wallets ADD COLUMN IF NOT EXISTS stripe_onboarding_url      TEXT;

DROP TRIGGER IF EXISTS trg_creator_wallets_updated_at ON creator_wallets;
CREATE TRIGGER trg_creator_wallets_updated_at
  BEFORE UPDATE ON creator_wallets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE creator_wallets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wallets_owner_select"  ON creator_wallets;
DROP POLICY IF EXISTS "wallets_service_all"   ON creator_wallets;

CREATE POLICY "wallets_owner_select" ON creator_wallets
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "wallets_service_all" ON creator_wallets
  FOR ALL TO service_role USING (true) WITH CHECK (true);

GRANT SELECT ON creator_wallets TO authenticated;
GRANT ALL ON creator_wallets TO service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. CREATOR_PAYOUTS — Auszahlungen an Creator
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS creator_payouts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_item_id       UUID REFERENCES order_items(id) ON DELETE SET NULL,

  amount_eur          NUMERIC(10,2) NOT NULL,
  stripe_transfer_id  TEXT,
  status              TEXT NOT NULL DEFAULT 'pending',
  paid_at             TIMESTAMPTZ,
  notes               TEXT,
  metadata            JSONB,

  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE creator_payouts ADD COLUMN IF NOT EXISTS stripe_transfer_id TEXT;
ALTER TABLE creator_payouts ADD COLUMN IF NOT EXISTS notes               TEXT;
ALTER TABLE creator_payouts ADD COLUMN IF NOT EXISTS metadata            JSONB;

DROP TRIGGER IF EXISTS trg_creator_payouts_updated_at ON creator_payouts;
CREATE TRIGGER trg_creator_payouts_updated_at
  BEFORE UPDATE ON creator_payouts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS idx_creator_payouts_creator ON creator_payouts(creator_id);
CREATE INDEX IF NOT EXISTS idx_creator_payouts_status  ON creator_payouts(status);

ALTER TABLE creator_payouts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payouts_creator_select" ON creator_payouts;
DROP POLICY IF EXISTS "payouts_service_all"    ON creator_payouts;

CREATE POLICY "payouts_creator_select" ON creator_payouts
  FOR SELECT USING (creator_id = auth.uid());

CREATE POLICY "payouts_service_all" ON creator_payouts
  FOR ALL TO service_role USING (true) WITH CHECK (true);

GRANT SELECT ON creator_payouts TO authenticated;
GRANT ALL ON creator_payouts TO service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. COMMERCE_EVENTS — Audit-Log aller Commerce-Aktionen
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS commerce_events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type    TEXT NOT NULL,
  order_id      UUID REFERENCES orders(id) ON DELETE SET NULL,
  order_item_id UUID REFERENCES order_items(id) ON DELETE SET NULL,
  payout_id     UUID REFERENCES creator_payouts(id) ON DELETE SET NULL,
  actor_id      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_type    TEXT NOT NULL DEFAULT 'system',
  payload       JSONB NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE commerce_events ADD COLUMN IF NOT EXISTS payout_id  UUID REFERENCES creator_payouts(id) ON DELETE SET NULL;
ALTER TABLE commerce_events ADD COLUMN IF NOT EXISTS actor_id   UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE commerce_events ADD COLUMN IF NOT EXISTS actor_type TEXT NOT NULL DEFAULT 'system';

CREATE INDEX IF NOT EXISTS idx_commerce_events_order   ON commerce_events(order_id);
CREATE INDEX IF NOT EXISTS idx_commerce_events_item    ON commerce_events(order_item_id);
CREATE INDEX IF NOT EXISTS idx_commerce_events_type    ON commerce_events(event_type);
CREATE INDEX IF NOT EXISTS idx_commerce_events_created ON commerce_events(created_at DESC);

ALTER TABLE commerce_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "commerce_events_service_all" ON commerce_events;
CREATE POLICY "commerce_events_service_all" ON commerce_events
  FOR ALL TO service_role USING (true) WITH CHECK (true);

GRANT ALL ON commerce_events TO service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- 9. WEBHOOK_EVENTS — Idempotenz für Stripe Webhooks
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS webhook_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id TEXT UNIQUE NOT NULL,
  event_type      TEXT NOT NULL,
  order_id        UUID REFERENCES orders(id) ON DELETE SET NULL,
  status          TEXT NOT NULL DEFAULT 'received',
  payload         JSONB,
  processed_at    TIMESTAMPTZ,
  error_message   TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE webhook_events ADD COLUMN IF NOT EXISTS error_message TEXT;

CREATE INDEX IF NOT EXISTS idx_webhook_events_stripe_id  ON webhook_events(stripe_event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_status     ON webhook_events(status);
CREATE INDEX IF NOT EXISTS idx_webhook_events_created    ON webhook_events(created_at DESC);

ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "webhook_events_service_all" ON webhook_events;
CREATE POLICY "webhook_events_service_all" ON webhook_events
  FOR ALL TO service_role USING (true) WITH CHECK (true);

GRANT ALL ON webhook_events TO service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- 10. IMPACT_ROUNDS — monatliche Impact-Pool Runden
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS impact_rounds (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  month        TEXT NOT NULL UNIQUE,     -- Format: '2026-06'
  status       TEXT NOT NULL DEFAULT 'active',
  pool_eur     NUMERIC(10,2) NOT NULL DEFAULT 0,
  awarded_eur  NUMERIC(10,2) DEFAULT 0,
  closed_at    TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE impact_rounds ADD COLUMN IF NOT EXISTS awarded_eur NUMERIC(10,2) DEFAULT 0;
ALTER TABLE impact_rounds ADD COLUMN IF NOT EXISTS closed_at   TIMESTAMPTZ;

DROP TRIGGER IF EXISTS trg_impact_rounds_updated_at ON impact_rounds;
CREATE TRIGGER trg_impact_rounds_updated_at
  BEFORE UPDATE ON impact_rounds
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE impact_rounds ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "impact_rounds_public_select" ON impact_rounds;
DROP POLICY IF EXISTS "impact_rounds_service_all"   ON impact_rounds;

CREATE POLICY "impact_rounds_public_select" ON impact_rounds FOR SELECT USING (true);
CREATE POLICY "impact_rounds_service_all"   ON impact_rounds
  FOR ALL TO service_role USING (true) WITH CHECK (true);

GRANT SELECT ON impact_rounds TO authenticated, anon;
GRANT ALL ON impact_rounds TO service_role;

-- Aktive Runde für aktuellen Monat sicherstellen
INSERT INTO impact_rounds (month, status, pool_eur)
VALUES (to_char(now(), 'YYYY-MM'), 'active', 0)
ON CONFLICT (month) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- 11. VIEWS
-- ─────────────────────────────────────────────────────────────────────────────

-- commerce_price_authority — Server-seitige Preisquelle (kein Client-Trust)
CREATE OR REPLACE VIEW commerce_price_authority AS
  SELECT
    'work'              AS item_type,
    id                  AS item_id,
    user_id             AS creator_id,
    COALESCE(price, 0)  AS price_eur,
    0                   AS shipping_eur,
    title,
    cover_url,
    status
  FROM works
  WHERE status IN ('published', 'approved')

  UNION ALL

  SELECT
    'experience'        AS item_type,
    id                  AS item_id,
    user_id             AS creator_id,
    COALESCE(price, 0)  AS price_eur,
    0                   AS shipping_eur,
    title,
    cover_url,
    status
  FROM experiences
  WHERE status IN ('published', 'approved');

GRANT SELECT ON commerce_price_authority TO service_role, authenticated;

-- buyer_order_status — Käufer-seitige Bestellübersicht
CREATE OR REPLACE VIEW buyer_order_status AS
  SELECT
    o.id,
    o.status,
    o.total_eur,
    o.impact_eur,
    o.stripe_payment_intent,
    o.payment_confirmed_at,
    o.created_at,
    o.shipping_address,
    o.contact_name,
    o.contact_email,
    COALESCE(
      json_agg(
        json_build_object(
          'id',                 oi.id,
          'item_type',          oi.item_type,
          'quantity',           oi.quantity,
          'unit_price_eur',     oi.unit_price_eur,
          'fulfillment_status', oi.fulfillment_status,
          'creator_id',         oi.creator_id,
          'snapshot',           oi.snapshot
        ) ORDER BY oi.created_at
      ) FILTER (WHERE oi.id IS NOT NULL),
      '[]'
    ) AS order_items
  FROM orders o
  LEFT JOIN order_items oi ON oi.order_id = o.id
  GROUP BY o.id, o.status, o.total_eur, o.impact_eur,
           o.stripe_payment_intent, o.payment_confirmed_at, o.created_at,
           o.shipping_address, o.contact_name, o.contact_email;

GRANT SELECT ON buyer_order_status TO authenticated;
GRANT SELECT ON buyer_order_status TO service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- 12. FUNKTIONEN
-- ─────────────────────────────────────────────────────────────────────────────

-- increment_wallet_balance — atomares Guthaben-Update
CREATE OR REPLACE FUNCTION increment_wallet_balance(
  p_user_id UUID,
  p_amount  NUMERIC
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO creator_wallets (user_id, balance, total_earned, pending_balance)
  VALUES (p_user_id, p_amount, p_amount, 0)
  ON CONFLICT (user_id) DO UPDATE SET
    balance      = creator_wallets.balance + p_amount,
    total_earned = creator_wallets.total_earned + p_amount,
    updated_at   = now();
END;
$$;

REVOKE ALL ON FUNCTION increment_wallet_balance FROM PUBLIC;
GRANT EXECUTE ON FUNCTION increment_wallet_balance TO service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- 13. SECURITY FUNCTIONS (RLS Guards für Edge Functions)
-- ─────────────────────────────────────────────────────────────────────────────

-- Verhindert Creator-ID Manipulation durch Clients
CREATE OR REPLACE FUNCTION enforce_creator_fulfillment_only()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF auth.uid() != NEW.creator_id THEN
    RAISE EXCEPTION 'Forbidden: only the creator can update fulfillment';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_creator_fulfillment ON order_items;
CREATE TRIGGER trg_enforce_creator_fulfillment
  BEFORE UPDATE OF fulfillment_status, fulfillment_note ON order_items
  FOR EACH ROW
  WHEN (pg_trigger_depth() = 0)
  EXECUTE FUNCTION enforce_creator_fulfillment_only();

-- ─────────────────────────────────────────────────────────────────────────────
-- 14. NOTIFICATIONS: sicherstellen dass Tabelle existiert (Webhook braucht sie)
-- ─────────────────────────────────────────────────────────────────────────────

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables
    WHERE schemaname = 'public' AND tablename = 'notifications'
  ) THEN
    CREATE TABLE notifications (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      type        TEXT NOT NULL,
      title       TEXT,
      body        TEXT,
      data        JSONB DEFAULT '{}',
      read        BOOLEAN NOT NULL DEFAULT false,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "notifications_owner" ON notifications
      FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "notifications_service_all" ON notifications
      FOR ALL TO service_role USING (true) WITH CHECK (true);
    GRANT SELECT, UPDATE ON notifications TO authenticated;
    GRANT ALL ON notifications TO service_role;
    RAISE NOTICE 'notifications Tabelle erstellt';
  ELSE
    RAISE NOTICE 'notifications Tabelle bereits vorhanden';
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 15. GRANTS (konsolidiert)
-- ─────────────────────────────────────────────────────────────────────────────

GRANT USAGE ON SCHEMA public TO service_role, authenticated, anon;

-- ═══════════════════════════════════════════════════════════════════════════════
-- VERIFIKATION
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT
  obj_name,
  obj_type,
  CASE WHEN exists_check THEN '✅ vorhanden' ELSE '❌ FEHLT' END AS status
FROM (
  VALUES
    ('orders',                  'TABLE', EXISTS(SELECT 1 FROM pg_tables WHERE tablename='orders' AND schemaname='public')),
    ('order_items',             'TABLE', EXISTS(SELECT 1 FROM pg_tables WHERE tablename='order_items' AND schemaname='public')),
    ('shipments',               'TABLE', EXISTS(SELECT 1 FROM pg_tables WHERE tablename='shipments' AND schemaname='public')),
    ('creator_wallets',         'TABLE', EXISTS(SELECT 1 FROM pg_tables WHERE tablename='creator_wallets' AND schemaname='public')),
    ('creator_payouts',         'TABLE', EXISTS(SELECT 1 FROM pg_tables WHERE tablename='creator_payouts' AND schemaname='public')),
    ('commerce_events',         'TABLE', EXISTS(SELECT 1 FROM pg_tables WHERE tablename='commerce_events' AND schemaname='public')),
    ('webhook_events',          'TABLE', EXISTS(SELECT 1 FROM pg_tables WHERE tablename='webhook_events' AND schemaname='public')),
    ('impact_rounds',           'TABLE', EXISTS(SELECT 1 FROM pg_tables WHERE tablename='impact_rounds' AND schemaname='public')),
    ('commerce_price_authority','VIEW',  EXISTS(SELECT 1 FROM pg_views WHERE viewname='commerce_price_authority' AND schemaname='public')),
    ('buyer_order_status',      'VIEW',  EXISTS(SELECT 1 FROM pg_views WHERE viewname='buyer_order_status' AND schemaname='public')),
    ('increment_wallet_balance','FUNC',  EXISTS(SELECT 1 FROM pg_proc WHERE proname='increment_wallet_balance'))
) AS t(obj_name, obj_type, exists_check)
ORDER BY obj_type, obj_name;

COMMIT;
