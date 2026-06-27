-- ═══════════════════════════════════════════════════════════════════════════════
-- HUI Migration 057 — Commerce Schema Final (Zero-Assumption)
-- ═══════════════════════════════════════════════════════════════════════════════
--
-- Ersetzt hui_056: keine festen Schema-Annahmen.
-- Jede Operation auf BESTEHENDEN Spalten wird via information_schema geprüft.
-- ADD COLUMN IF NOT EXISTS / CREATE TABLE IF NOT EXISTS bleiben unkritisch.
--
-- Produktions-Baseline (aus Laufzeitfehlern + Edge Functions bestätigt):
--   orders:       customer_id, state, commission_eur  (NICHT buyer_id/status/platform_fee_eur)
--   order_items:  seller_id, unit_price_eur, work_id   (NICHT price_eur/creator_id)
-- ═══════════════════════════════════════════════════════════════════════════════

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- 0. HILFSFUNKTION — Spalten-Existenz zur Laufzeit
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.hui_col_exists(
  p_table  text,
  p_column text
) RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = p_table
      AND column_name  = p_column
  );
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. CLEANUP — Relikte aus 051–056 (DROP IF EXISTS ist immer sicher)
-- ─────────────────────────────────────────────────────────────────────────────

DROP INDEX IF EXISTS idx_orders_buyer;
DROP INDEX IF EXISTS idx_orders_status;
DROP INDEX IF EXISTS idx_orders_buyer_pending;
DROP INDEX IF EXISTS idx_orders_cart_hash;

ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;

DROP POLICY IF EXISTS "orders_buyer_select"         ON public.orders;
DROP POLICY IF EXISTS "orders_buyer_insert"         ON public.orders;
DROP POLICY IF EXISTS "orders_buyer_select_aborted" ON public.orders;

DROP VIEW IF EXISTS public.buyer_order_status;
DROP VIEW IF EXISTS public.commerce_price_authority;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. ENUM TYPEN — idempotent
-- ─────────────────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE commerce_item_type AS ENUM (
    'work','experience','event','service','support','pickup'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. update_updated_at FUNKTION
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. ORDERS — nur erweitern (kein CREATE TABLE)
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS stripe_payment_intent TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS stripe_session_id     TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS stripe_customer_id    TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_address      JSONB;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS contact_name          TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS contact_email         TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS subtotal_eur          NUMERIC(10,2) DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_eur          NUMERIC(10,2) DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS discount_eur          NUMERIC(10,2) DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS currency              TEXT DEFAULT 'eur';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cart_hash             TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_confirmed_at  TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cancelled_at          TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS metadata              JSONB;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS impact_eur            NUMERIC(10,2) DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS notes                 TEXT;

DO $$ BEGIN
  ALTER TABLE public.orders
    ADD CONSTRAINT orders_stripe_pi_unique UNIQUE (stripe_payment_intent);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.orders
    ADD CONSTRAINT orders_stripe_session_unique UNIQUE (stripe_session_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Indizes nur auf nachweislich vorhandene Spalten
DO $$ BEGIN
  IF public.hui_col_exists('orders', 'customer_id') THEN
    CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
  END IF;
  IF public.hui_col_exists('orders', 'state') THEN
    CREATE INDEX IF NOT EXISTS idx_orders_state ON public.orders(state);
  ELSIF public.hui_col_exists('orders', 'status') THEN
    CREATE INDEX IF NOT EXISTS idx_orders_status_legacy ON public.orders(status);
  END IF;
  IF public.hui_col_exists('orders', 'stripe_payment_intent') THEN
    CREATE INDEX IF NOT EXISTS idx_orders_stripe_pi
      ON public.orders(stripe_payment_intent)
      WHERE stripe_payment_intent IS NOT NULL;
  END IF;
  IF public.hui_col_exists('orders', 'cart_hash')
     AND public.hui_col_exists('orders', 'customer_id') THEN
    CREATE INDEX IF NOT EXISTS idx_orders_cart_hash_v2
      ON public.orders(customer_id, cart_hash)
      WHERE cart_hash IS NOT NULL;
  ELSIF public.hui_col_exists('orders', 'cart_hash')
     AND public.hui_col_exists('orders', 'buyer_id') THEN
    CREATE INDEX IF NOT EXISTS idx_orders_cart_hash_buyer
      ON public.orders(buyer_id, cart_hash)
      WHERE cart_hash IS NOT NULL;
  END IF;
  IF public.hui_col_exists('orders', 'customer_id')
     AND public.hui_col_exists('orders', 'state') THEN
    CREATE INDEX IF NOT EXISTS idx_orders_cust_pending
      ON public.orders(customer_id, state)
      WHERE state = 'pending';
  END IF;
END $$;

DO $$ BEGIN
  IF public.hui_col_exists('orders', 'updated_at') THEN
    DROP TRIGGER IF EXISTS trg_orders_updated_at ON public.orders;
    CREATE TRIGGER trg_orders_updated_at
      BEFORE UPDATE ON public.orders
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
  END IF;
END $$;

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "orders_select_own"        ON public.orders;
DROP POLICY IF EXISTS "orders_insert_own"        ON public.orders;
DROP POLICY IF EXISTS "orders_service_all"       ON public.orders;
DROP POLICY IF EXISTS "orders_select_customer"   ON public.orders;
DROP POLICY IF EXISTS "orders_insert_customer"   ON public.orders;
DROP POLICY IF EXISTS "orders_update_customer"   ON public.orders;

DO $$ BEGIN
  IF public.hui_col_exists('orders', 'customer_id') THEN
    CREATE POLICY "orders_select_customer" ON public.orders
      FOR SELECT TO authenticated USING (auth.uid() = customer_id);
    CREATE POLICY "orders_insert_customer" ON public.orders
      FOR INSERT TO authenticated WITH CHECK (auth.uid() = customer_id);
    CREATE POLICY "orders_update_customer" ON public.orders
      FOR UPDATE TO authenticated USING (auth.uid() = customer_id);
  ELSIF public.hui_col_exists('orders', 'buyer_id') THEN
    CREATE POLICY "orders_select_customer" ON public.orders
      FOR SELECT TO authenticated USING (auth.uid() = buyer_id);
    CREATE POLICY "orders_insert_customer" ON public.orders
      FOR INSERT TO authenticated WITH CHECK (auth.uid() = buyer_id);
    CREATE POLICY "orders_update_customer" ON public.orders
      FOR UPDATE TO authenticated USING (auth.uid() = buyer_id);
  END IF;
END $$;

CREATE POLICY "orders_service_all" ON public.orders
  FOR ALL TO service_role USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. ORDER_ITEMS — erweitern
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS seller_id          UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS creator_id         UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS item_type          TEXT DEFAULT 'work';
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS item_id            UUID;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS snapshot           JSONB DEFAULT '{}';
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS shipping_type      TEXT DEFAULT 'none';
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS unit_price_eur     NUMERIC(10,2) DEFAULT 0;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS shipping_eur       NUMERIC(10,2) DEFAULT 0;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS payout_eur         NUMERIC(10,2);
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS impact_eur         NUMERIC(10,2) DEFAULT 0;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS fulfillment_status TEXT DEFAULT 'new';
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS fulfillment_note   TEXT;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS fulfilled_at       TIMESTAMPTZ;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS payout_status      TEXT DEFAULT 'held';
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS payout_released_at TIMESTAMPTZ;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS payout_paid_at     TIMESTAMPTZ;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS stripe_transfer_id TEXT;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS created_at         TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS updated_at         TIMESTAMPTZ DEFAULT now();

-- Backfill unit_price_eur NUR wenn Quellspalte price_eur existiert
DO $$ BEGIN
  IF public.hui_col_exists('order_items', 'price_eur')
     AND public.hui_col_exists('order_items', 'unit_price_eur') THEN
    UPDATE public.order_items
      SET unit_price_eur = price_eur
      WHERE (unit_price_eur IS NULL OR unit_price_eur = 0)
        AND price_eur IS NOT NULL
        AND price_eur > 0;
  END IF;
END $$;

-- seller_id aus creator_id befüllen (nur wenn beide existieren)
DO $$ BEGIN
  IF public.hui_col_exists('order_items', 'seller_id')
     AND public.hui_col_exists('order_items', 'creator_id') THEN
    UPDATE public.order_items
      SET seller_id = creator_id
      WHERE seller_id IS NULL AND creator_id IS NOT NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF public.hui_col_exists('order_items', 'updated_at') THEN
    DROP TRIGGER IF EXISTS trg_order_items_updated_at ON public.order_items;
    CREATE TRIGGER trg_order_items_updated_at
      BEFORE UPDATE ON public.order_items
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
  END IF;
END $$;

DO $$ BEGIN
  IF public.hui_col_exists('order_items', 'order_id') THEN
    CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);
  END IF;
  IF public.hui_col_exists('order_items', 'seller_id') THEN
    CREATE INDEX IF NOT EXISTS idx_order_items_seller ON public.order_items(seller_id);
  ELSIF public.hui_col_exists('order_items', 'creator_id') THEN
    CREATE INDEX IF NOT EXISTS idx_order_items_creator ON public.order_items(creator_id);
  END IF;
  IF public.hui_col_exists('order_items', 'fulfillment_status') THEN
    CREATE INDEX IF NOT EXISTS idx_order_items_fulfill ON public.order_items(fulfillment_status);
  END IF;
  IF public.hui_col_exists('order_items', 'payout_status') THEN
    CREATE INDEX IF NOT EXISTS idx_order_items_payout ON public.order_items(payout_status);
  END IF;
END $$;

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "order_items_select"         ON public.order_items;
DROP POLICY IF EXISTS "order_items_buyer_select"   ON public.order_items;
DROP POLICY IF EXISTS "order_items_creator_select" ON public.order_items;
DROP POLICY IF EXISTS "order_items_seller_select"  ON public.order_items;
DROP POLICY IF EXISTS "order_items_service_all"    ON public.order_items;

DO $$ BEGIN
  IF public.hui_col_exists('order_items', 'order_id')
     AND public.hui_col_exists('orders', 'customer_id') THEN
    CREATE POLICY "order_items_buyer_select" ON public.order_items
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM public.orders
          WHERE orders.id = order_items.order_id
            AND orders.customer_id = auth.uid()
        )
      );
  ELSIF public.hui_col_exists('order_items', 'order_id')
     AND public.hui_col_exists('orders', 'buyer_id') THEN
    CREATE POLICY "order_items_buyer_select" ON public.order_items
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM public.orders
          WHERE orders.id = order_items.order_id
            AND orders.buyer_id = auth.uid()
        )
      );
  END IF;
  IF public.hui_col_exists('order_items', 'seller_id') THEN
    CREATE POLICY "order_items_seller_select" ON public.order_items
      FOR SELECT USING (seller_id = auth.uid());
  ELSIF public.hui_col_exists('order_items', 'creator_id') THEN
    CREATE POLICY "order_items_seller_select" ON public.order_items
      FOR SELECT USING (creator_id = auth.uid());
  END IF;
END $$;

CREATE POLICY "order_items_service_all" ON public.order_items
  FOR ALL TO service_role USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. SHIPMENTS
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.shipments (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id           UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  order_item_id      UUID REFERENCES public.order_items(id) ON DELETE CASCADE,
  creator_id         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  carrier            TEXT,
  tracking_number    TEXT,
  tracking_url       TEXT,
  shipped_at         TIMESTAMPTZ,
  estimated_delivery TIMESTAMPTZ,
  delivered_at       TIMESTAMPTZ,
  notes              TEXT,
  metadata           JSONB,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS order_id           UUID REFERENCES public.orders(id) ON DELETE CASCADE;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS order_item_id      UUID REFERENCES public.order_items(id) ON DELETE CASCADE;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS tracking_url       TEXT;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS estimated_delivery TIMESTAMPTZ;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS delivered_at       TIMESTAMPTZ;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS notes              TEXT;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS metadata           JSONB;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS status             TEXT DEFAULT 'preparing';

DO $$ BEGIN
  IF public.hui_col_exists('shipments', 'updated_at') THEN
    DROP TRIGGER IF EXISTS trg_shipments_updated_at ON public.shipments;
    CREATE TRIGGER trg_shipments_updated_at
      BEFORE UPDATE ON public.shipments
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
  END IF;
END $$;

DO $$ BEGIN
  IF public.hui_col_exists('shipments', 'order_id') THEN
    CREATE INDEX IF NOT EXISTS idx_shipments_order ON public.shipments(order_id);
  END IF;
  IF public.hui_col_exists('shipments', 'order_item_id') THEN
    CREATE INDEX IF NOT EXISTS idx_shipments_item ON public.shipments(order_item_id);
  END IF;
  IF public.hui_col_exists('shipments', 'creator_id') THEN
    CREATE INDEX IF NOT EXISTS idx_shipments_creator ON public.shipments(creator_id);
  END IF;
END $$;

ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "shipments_creator_all"  ON public.shipments;
DROP POLICY IF EXISTS "shipments_buyer_select" ON public.shipments;
DROP POLICY IF EXISTS "shipments_service_all"  ON public.shipments;

DO $$ BEGIN
  IF public.hui_col_exists('shipments', 'creator_id') THEN
    CREATE POLICY "shipments_creator_all" ON public.shipments
      FOR ALL USING (creator_id = auth.uid())
      WITH CHECK (creator_id = auth.uid());
  END IF;
  IF public.hui_col_exists('shipments', 'order_id')
     AND public.hui_col_exists('orders', 'customer_id') THEN
    CREATE POLICY "shipments_buyer_select" ON public.shipments
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM public.orders
          WHERE orders.id = shipments.order_id
            AND orders.customer_id = auth.uid()
        )
      );
  ELSIF public.hui_col_exists('shipments', 'order_id')
     AND public.hui_col_exists('orders', 'buyer_id') THEN
    CREATE POLICY "shipments_buyer_select" ON public.shipments
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM public.orders
          WHERE orders.id = shipments.order_id
            AND orders.buyer_id = auth.uid()
        )
      );
  END IF;
END $$;

CREATE POLICY "shipments_service_all" ON public.shipments
  FOR ALL TO service_role USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE ON public.shipments TO authenticated;
GRANT ALL ON public.shipments TO service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. CREATOR_WALLETS — bestehende Tabelle respektieren (phase4d)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.creator_wallets (
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

ALTER TABLE public.creator_wallets ADD COLUMN IF NOT EXISTS stripe_account_id          TEXT;
ALTER TABLE public.creator_wallets ADD COLUMN IF NOT EXISTS stripe_onboarding_complete BOOLEAN DEFAULT false;
ALTER TABLE public.creator_wallets ADD COLUMN IF NOT EXISTS stripe_charges_enabled     BOOLEAN DEFAULT false;
ALTER TABLE public.creator_wallets ADD COLUMN IF NOT EXISTS stripe_payouts_enabled     BOOLEAN DEFAULT false;
ALTER TABLE public.creator_wallets ADD COLUMN IF NOT EXISTS stripe_onboarding_url      TEXT;
ALTER TABLE public.creator_wallets ADD COLUMN IF NOT EXISTS pending_balance            NUMERIC(10,2) DEFAULT 0;
ALTER TABLE public.creator_wallets ADD COLUMN IF NOT EXISTS total_earned               NUMERIC(10,2) DEFAULT 0;

DO $$ BEGIN
  IF public.hui_col_exists('creator_wallets', 'updated_at') THEN
    DROP TRIGGER IF EXISTS trg_creator_wallets_updated_at ON public.creator_wallets;
    CREATE TRIGGER trg_creator_wallets_updated_at
      BEFORE UPDATE ON public.creator_wallets
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
  END IF;
END $$;

ALTER TABLE public.creator_wallets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "wallets_owner_select" ON public.creator_wallets;
DROP POLICY IF EXISTS "wallets_service_all"  ON public.creator_wallets;
DROP POLICY IF EXISTS "wallet_owner_select"  ON public.creator_wallets;

DO $$ BEGIN
  IF public.hui_col_exists('creator_wallets', 'user_id') THEN
    CREATE POLICY "wallets_owner_select" ON public.creator_wallets
      FOR SELECT USING (user_id = auth.uid());
  END IF;
END $$;

CREATE POLICY "wallets_service_all" ON public.creator_wallets
  FOR ALL TO service_role USING (true) WITH CHECK (true);

GRANT SELECT ON public.creator_wallets TO authenticated;
GRANT ALL ON public.creator_wallets TO service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. CREATOR_PAYOUTS
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.creator_payouts (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id           UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  order_item_ids     JSONB,
  order_item_id      UUID REFERENCES public.order_items(id) ON DELETE SET NULL,
  gross_eur          NUMERIC(10,2),
  net_eur            NUMERIC(10,2),
  amount_eur         NUMERIC(10,2),
  platform_fee_eur   NUMERIC(10,2) DEFAULT 0,
  stripe_transfer_id TEXT,
  status             TEXT NOT NULL DEFAULT 'pending',
  initiated_at       TIMESTAMPTZ,
  paid_at            TIMESTAMPTZ,
  notes              TEXT,
  metadata           JSONB,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.creator_payouts ADD COLUMN IF NOT EXISTS order_item_ids   JSONB;
ALTER TABLE public.creator_payouts ADD COLUMN IF NOT EXISTS order_item_id    UUID REFERENCES public.order_items(id) ON DELETE SET NULL;
ALTER TABLE public.creator_payouts ADD COLUMN IF NOT EXISTS gross_eur        NUMERIC(10,2);
ALTER TABLE public.creator_payouts ADD COLUMN IF NOT EXISTS net_eur          NUMERIC(10,2);
ALTER TABLE public.creator_payouts ADD COLUMN IF NOT EXISTS amount_eur       NUMERIC(10,2);
ALTER TABLE public.creator_payouts ADD COLUMN IF NOT EXISTS platform_fee_eur NUMERIC(10,2) DEFAULT 0;
ALTER TABLE public.creator_payouts ADD COLUMN IF NOT EXISTS stripe_transfer_id TEXT;
ALTER TABLE public.creator_payouts ADD COLUMN IF NOT EXISTS initiated_at     TIMESTAMPTZ;
ALTER TABLE public.creator_payouts ADD COLUMN IF NOT EXISTS notes            TEXT;
ALTER TABLE public.creator_payouts ADD COLUMN IF NOT EXISTS metadata         JSONB;

DO $$ BEGIN
  IF public.hui_col_exists('creator_payouts', 'updated_at') THEN
    DROP TRIGGER IF EXISTS trg_creator_payouts_updated_at ON public.creator_payouts;
    CREATE TRIGGER trg_creator_payouts_updated_at
      BEFORE UPDATE ON public.creator_payouts
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
  END IF;
END $$;

DO $$ BEGIN
  IF public.hui_col_exists('creator_payouts', 'creator_id') THEN
    CREATE INDEX IF NOT EXISTS idx_creator_payouts_creator ON public.creator_payouts(creator_id);
  END IF;
  IF public.hui_col_exists('creator_payouts', 'status') THEN
    CREATE INDEX IF NOT EXISTS idx_creator_payouts_status ON public.creator_payouts(status);
  END IF;
END $$;

ALTER TABLE public.creator_payouts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "payouts_creator_select" ON public.creator_payouts;
DROP POLICY IF EXISTS "payouts_service_all"    ON public.creator_payouts;

DO $$ BEGIN
  IF public.hui_col_exists('creator_payouts', 'creator_id') THEN
    CREATE POLICY "payouts_creator_select" ON public.creator_payouts
      FOR SELECT USING (creator_id = auth.uid());
  END IF;
END $$;

CREATE POLICY "payouts_service_all" ON public.creator_payouts
  FOR ALL TO service_role USING (true) WITH CHECK (true);

GRANT SELECT ON public.creator_payouts TO authenticated;
GRANT ALL ON public.creator_payouts TO service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- 9. COMMERCE_EVENTS
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.commerce_events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type    TEXT NOT NULL,
  order_id      UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  order_item_id UUID REFERENCES public.order_items(id) ON DELETE SET NULL,
  payout_id     UUID REFERENCES public.creator_payouts(id) ON DELETE SET NULL,
  actor_id      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_type    TEXT DEFAULT 'system',
  payload       JSONB NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.commerce_events ADD COLUMN IF NOT EXISTS order_item_id UUID REFERENCES public.order_items(id) ON DELETE SET NULL;
ALTER TABLE public.commerce_events ADD COLUMN IF NOT EXISTS payout_id  UUID REFERENCES public.creator_payouts(id) ON DELETE SET NULL;
ALTER TABLE public.commerce_events ADD COLUMN IF NOT EXISTS actor_id   UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.commerce_events ADD COLUMN IF NOT EXISTS actor_type TEXT DEFAULT 'system';
ALTER TABLE public.commerce_events ADD COLUMN IF NOT EXISTS payload    JSONB DEFAULT '{}';

DO $$ BEGIN
  IF public.hui_col_exists('commerce_events', 'order_id') THEN
    CREATE INDEX IF NOT EXISTS idx_commerce_events_order ON public.commerce_events(order_id);
  END IF;
  IF public.hui_col_exists('commerce_events', 'event_type') THEN
    CREATE INDEX IF NOT EXISTS idx_commerce_events_type ON public.commerce_events(event_type);
  END IF;
  IF public.hui_col_exists('commerce_events', 'created_at') THEN
    CREATE INDEX IF NOT EXISTS idx_commerce_events_created ON public.commerce_events(created_at DESC);
  END IF;
END $$;

ALTER TABLE public.commerce_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "commerce_events_service_all" ON public.commerce_events;
CREATE POLICY "commerce_events_service_all" ON public.commerce_events
  FOR ALL TO service_role USING (true) WITH CHECK (true);
GRANT ALL ON public.commerce_events TO service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- 10. WEBHOOK_EVENTS — Legacy- und Commerce-Schema vereinen via ADD COLUMN
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.webhook_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id TEXT UNIQUE,
  event_type      TEXT NOT NULL,
  order_id        UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  status          TEXT NOT NULL DEFAULT 'received',
  payload         JSONB,
  payload_summary JSONB,
  processed_at    TIMESTAMPTZ,
  error_message   TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.webhook_events ADD COLUMN IF NOT EXISTS stripe_event_id TEXT;
ALTER TABLE public.webhook_events ADD COLUMN IF NOT EXISTS event_type      TEXT;
ALTER TABLE public.webhook_events ADD COLUMN IF NOT EXISTS order_id        UUID REFERENCES public.orders(id) ON DELETE SET NULL;
ALTER TABLE public.webhook_events ADD COLUMN IF NOT EXISTS status          TEXT DEFAULT 'received';
ALTER TABLE public.webhook_events ADD COLUMN IF NOT EXISTS payload         JSONB;
ALTER TABLE public.webhook_events ADD COLUMN IF NOT EXISTS payload_summary JSONB;
ALTER TABLE public.webhook_events ADD COLUMN IF NOT EXISTS processed_at    TIMESTAMPTZ;
ALTER TABLE public.webhook_events ADD COLUMN IF NOT EXISTS error_message   TEXT;
ALTER TABLE public.webhook_events ADD COLUMN IF NOT EXISTS created_at      TIMESTAMPTZ DEFAULT now();

DO $$ BEGIN
  IF public.hui_col_exists('webhook_events', 'stripe_event_id') THEN
    CREATE INDEX IF NOT EXISTS idx_webhook_events_stripe_id ON public.webhook_events(stripe_event_id);
  END IF;
  IF public.hui_col_exists('webhook_events', 'status') THEN
    CREATE INDEX IF NOT EXISTS idx_webhook_events_status ON public.webhook_events(status);
  END IF;
  IF public.hui_col_exists('webhook_events', 'created_at') THEN
    CREATE INDEX IF NOT EXISTS idx_webhook_events_created ON public.webhook_events(created_at DESC);
  END IF;
END $$;

ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "webhook_events_service_all" ON public.webhook_events;
CREATE POLICY "webhook_events_service_all" ON public.webhook_events
  FOR ALL TO service_role USING (true) WITH CHECK (true);
GRANT ALL ON public.webhook_events TO service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- 11. IMPACT_ROUNDS + NOTIFICATIONS + profiles.membership_type
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.impact_rounds (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  month       TEXT NOT NULL UNIQUE,
  status      TEXT NOT NULL DEFAULT 'active',
  pool_eur    NUMERIC(10,2) NOT NULL DEFAULT 0,
  awarded_eur NUMERIC(10,2) DEFAULT 0,
  closed_at   TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.impact_rounds ADD COLUMN IF NOT EXISTS awarded_eur NUMERIC(10,2) DEFAULT 0;
ALTER TABLE public.impact_rounds ADD COLUMN IF NOT EXISTS closed_at   TIMESTAMPTZ;

DO $$ BEGIN
  IF public.hui_col_exists('impact_rounds', 'updated_at') THEN
    DROP TRIGGER IF EXISTS trg_impact_rounds_updated_at ON public.impact_rounds;
    CREATE TRIGGER trg_impact_rounds_updated_at
      BEFORE UPDATE ON public.impact_rounds
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
  END IF;
END $$;

ALTER TABLE public.impact_rounds ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "impact_rounds_public_select" ON public.impact_rounds;
DROP POLICY IF EXISTS "impact_rounds_service_all"   ON public.impact_rounds;

CREATE POLICY "impact_rounds_public_select" ON public.impact_rounds
  FOR SELECT USING (true);
CREATE POLICY "impact_rounds_service_all" ON public.impact_rounds
  FOR ALL TO service_role USING (true) WITH CHECK (true);

GRANT SELECT ON public.impact_rounds TO authenticated, anon;
GRANT ALL ON public.impact_rounds TO service_role;

INSERT INTO public.impact_rounds (month, status, pool_eur)
VALUES (to_char(now(), 'YYYY-MM'), 'active', 0)
ON CONFLICT (month) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.notifications (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        REFERENCES auth.users(id) ON DELETE CASCADE,
  type       TEXT        NOT NULL DEFAULT 'info',
  title      TEXT,
  body       TEXT,
  read       BOOLEAN     NOT NULL DEFAULT false,
  data       JSONB       DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$ BEGIN
  IF public.hui_col_exists('notifications', 'user_id') THEN
    CREATE INDEX IF NOT EXISTS idx_notif_user_id ON public.notifications(user_id);
  END IF;
  IF public.hui_col_exists('notifications', 'read') THEN
    CREATE INDEX IF NOT EXISTS idx_notif_read ON public.notifications(read);
  END IF;
  IF public.hui_col_exists('notifications', 'created_at') THEN
    CREATE INDEX IF NOT EXISTS idx_notif_created ON public.notifications(created_at DESC);
  END IF;
END $$;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_owner"       ON public.notifications;
DROP POLICY IF EXISTS "notifications_service_all"   ON public.notifications;

DO $$ BEGIN
  IF public.hui_col_exists('notifications', 'user_id') THEN
    CREATE POLICY "notifications_owner" ON public.notifications
      FOR ALL USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

CREATE POLICY "notifications_service_all" ON public.notifications
  FOR ALL TO service_role USING (true) WITH CHECK (true);

GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS membership_type TEXT DEFAULT 'free';

-- ─────────────────────────────────────────────────────────────────────────────
-- 12. VIEW commerce_price_authority — dynamisch aus vorhandenen Spalten
-- ─────────────────────────────────────────────────────────────────────────────

DO $view$
DECLARE
  v_works_creator   text := 'NULL::uuid';
  v_works_price     text := '0::numeric';
  v_works_shipping  text := '0::numeric';
  v_works_status    text := '''published''::text';
  v_works_title     text := ''''''::text';
  v_works_cover     text := 'NULL::text';
  v_works_where     text := 'TRUE';
  v_exp_creator     text := 'NULL::uuid';
  v_exp_price       text := '0::numeric';
  v_exp_status      text := '''active''::text';
  v_exp_title       text := ''''''::text';
  v_exp_cover       text := 'NULL::text';
  v_exp_where       text := 'TRUE';
  v_sql             text;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'works') THEN
    RAISE NOTICE 'commerce_price_authority: works-Tabelle fehlt — View übersprungen';
    RETURN;
  END IF;

  IF public.hui_col_exists('works', 'creator_id') AND public.hui_col_exists('works', 'user_id') THEN
    v_works_creator := 'COALESCE(w.creator_id, w.user_id)';
  ELSIF public.hui_col_exists('works', 'creator_id') THEN
    v_works_creator := 'w.creator_id';
  ELSIF public.hui_col_exists('works', 'user_id') THEN
    v_works_creator := 'w.user_id';
  END IF;

  IF public.hui_col_exists('works', 'price') THEN
    v_works_price := 'COALESCE(w.price, 0)';
  END IF;

  IF public.hui_col_exists('works', 'shipping_cost') THEN
    v_works_shipping := 'COALESCE(w.shipping_cost, 0)';
  END IF;

  IF public.hui_col_exists('works', 'status') THEN
    v_works_status := 'w.status';
    v_works_where := 'w.status IN (''published'', ''approved'')';
  END IF;

  IF public.hui_col_exists('works', 'for_sale') THEN
    v_works_where := v_works_where || ' AND (w.for_sale IS NULL OR w.for_sale = true)';
  END IF;

  IF public.hui_col_exists('works', 'title') THEN
    v_works_title := 'w.title';
  END IF;

  IF public.hui_col_exists('works', 'cover_url') THEN
    v_works_cover := 'w.cover_url';
  END IF;

  v_sql := format($fmt$
    CREATE OR REPLACE VIEW public.commerce_price_authority AS
      SELECT
        'work'::text                    AS item_type,
        w.id                            AS item_id,
        %s                              AS creator_id,
        %s                              AS price_eur,
        %s                              AS shipping_eur,
        %s                              AS title,
        %s                              AS cover_url,
        %s                              AS status
      FROM public.works w
      WHERE %s
  $fmt$, v_works_creator, v_works_price, v_works_shipping,
       v_works_title, v_works_cover, v_works_status, v_works_where);

  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'experiences') THEN
    IF public.hui_col_exists('experiences', 'user_id') THEN
      v_exp_creator := 'e.user_id';
    END IF;
    IF public.hui_col_exists('experiences', 'price') THEN
      v_exp_price := 'COALESCE(e.price, 0)';
    END IF;

    IF public.hui_col_exists('experiences', 'status') THEN
      v_exp_status := 'e.status';
      v_exp_where := 'e.status IN (''published'', ''approved'', ''active'')';
    END IF;

    IF public.hui_col_exists('experiences', 'title') THEN
      v_exp_title := 'e.title';
    END IF;

    IF public.hui_col_exists('experiences', 'cover_url') THEN
      v_exp_cover := 'e.cover_url';
    END IF;

    v_sql := v_sql || format($fmt$
      UNION ALL
      SELECT
        'experience'::text              AS item_type,
        e.id                            AS item_id,
        %s                              AS creator_id,
        %s                              AS price_eur,
        0::numeric                      AS shipping_eur,
        %s                              AS title,
        %s                              AS cover_url,
        %s                              AS status
      FROM public.experiences e
      WHERE %s
    $fmt$, v_exp_creator, v_exp_price, v_exp_title, v_exp_cover, v_exp_status, v_exp_where);
  END IF;

  BEGIN
    EXECUTE v_sql;
    GRANT SELECT ON public.commerce_price_authority TO service_role, authenticated;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'commerce_price_authority: View-Erstellung fehlgeschlagen — %', SQLERRM;
  END;
END;
$view$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 13. VIEW buyer_order_status — dynamisch aus vorhandenen Spalten
-- ─────────────────────────────────────────────────────────────────────────────

DO $view$
DECLARE
  v_buyer_col    text;
  v_state_col    text;
  v_fee_col      text := '0::numeric';
  v_impact_col   text := '0::numeric';
  v_price_expr   text := '0::numeric';
  v_total_expr   text := '0::numeric';
  v_created_expr text := 'NULL::timestamptz';
  v_total_group  text := '';
  v_created_group text := '';
  v_creator_col  text;
  v_has_item_type      boolean := public.hui_col_exists('order_items', 'item_type');
  v_has_fulfillment    boolean := public.hui_col_exists('order_items', 'fulfillment_status');
  v_has_snapshot       boolean := public.hui_col_exists('order_items', 'snapshot');
  v_has_oi_created     boolean := public.hui_col_exists('order_items', 'created_at');
  v_has_quantity       boolean := public.hui_col_exists('order_items', 'quantity');
  v_extra_order_cols   text := '';
  v_extra_order_group  text := '';
  v_sql                text;
BEGIN
  IF NOT public.hui_col_exists('order_items', 'order_id') THEN
    RAISE NOTICE 'buyer_order_status: order_items.order_id fehlt — View übersprungen';
    RETURN;
  END IF;

  IF public.hui_col_exists('orders', 'customer_id') THEN
    v_buyer_col := 'customer_id';
  ELSIF public.hui_col_exists('orders', 'buyer_id') THEN
    v_buyer_col := 'buyer_id';
  ELSE
    RAISE NOTICE 'buyer_order_status: weder customer_id noch buyer_id — View übersprungen';
    RETURN;
  END IF;

  IF public.hui_col_exists('orders', 'state') THEN
    v_state_col := 'state';
  ELSIF public.hui_col_exists('orders', 'status') THEN
    v_state_col := 'status';
  ELSE
    RAISE NOTICE 'buyer_order_status: weder state noch status — View übersprungen';
    RETURN;
  END IF;

  IF public.hui_col_exists('orders', 'commission_eur') THEN
    v_fee_col := 'o.commission_eur';
  ELSIF public.hui_col_exists('orders', 'platform_fee_eur') THEN
    v_fee_col := 'o.platform_fee_eur';
  END IF;

  IF public.hui_col_exists('orders', 'impact_eur') THEN
    v_impact_col := 'o.impact_eur';
  END IF;

  IF public.hui_col_exists('orders', 'total_eur') THEN
    v_total_expr  := 'o.total_eur';
    v_total_group := ', o.total_eur';
  END IF;

  IF public.hui_col_exists('orders', 'created_at') THEN
    v_created_expr  := 'o.created_at';
    v_created_group := ', o.created_at';
  END IF;

  IF public.hui_col_exists('order_items', 'unit_price_eur')
     AND public.hui_col_exists('order_items', 'price_eur') THEN
    v_price_expr := 'COALESCE(oi.unit_price_eur, oi.price_eur, 0)';
  ELSIF public.hui_col_exists('order_items', 'unit_price_eur') THEN
    v_price_expr := 'COALESCE(oi.unit_price_eur, 0)';
  ELSIF public.hui_col_exists('order_items', 'price_eur') THEN
    v_price_expr := 'COALESCE(oi.price_eur, 0)';
  END IF;

  IF public.hui_col_exists('order_items', 'seller_id') THEN
    v_creator_col := 'oi.seller_id';
  ELSIF public.hui_col_exists('order_items', 'creator_id') THEN
    v_creator_col := 'oi.creator_id';
  ELSE
    v_creator_col := 'NULL::uuid';
  END IF;

  IF public.hui_col_exists('orders', 'stripe_payment_intent') THEN
    v_extra_order_cols  := v_extra_order_cols  || ', o.stripe_payment_intent';
    v_extra_order_group := v_extra_order_group || ', o.stripe_payment_intent';
  END IF;
  IF public.hui_col_exists('orders', 'payment_confirmed_at') THEN
    v_extra_order_cols  := v_extra_order_cols  || ', o.payment_confirmed_at';
    v_extra_order_group := v_extra_order_group || ', o.payment_confirmed_at';
  END IF;
  IF public.hui_col_exists('orders', 'shipping_address') THEN
    v_extra_order_cols  := v_extra_order_cols  || ', o.shipping_address';
    v_extra_order_group := v_extra_order_group || ', o.shipping_address';
  END IF;
  IF public.hui_col_exists('orders', 'contact_name') THEN
    v_extra_order_cols  := v_extra_order_cols  || ', o.contact_name';
    v_extra_order_group := v_extra_order_group || ', o.contact_name';
  END IF;
  IF public.hui_col_exists('orders', 'contact_email') THEN
    v_extra_order_cols  := v_extra_order_cols  || ', o.contact_email';
    v_extra_order_group := v_extra_order_group || ', o.contact_email';
  END IF;

  v_sql := format($fmt$
    CREATE OR REPLACE VIEW public.buyer_order_status AS
      SELECT
        o.id,
        o.%1$I                              AS customer_id,
        o.%1$I                              AS buyer_id,
        o.%2$I                              AS state,
        o.%2$I                              AS status,
        %14$s                               AS total_eur,
        %13$s                               AS impact_eur,
        %3$s                                AS commission_eur,
        %3$s                                AS platform_fee_eur
        %4$s,
        %15$s                               AS created_at,
        COALESCE(
          json_agg(
            json_build_object(
              'id',                 oi.id,
              'item_type',          %5$s,
              'quantity',           %6$s,
              'unit_price_eur',     %7$s,
              'fulfillment_status', %8$s,
              'seller_id',          %9$s,
              'creator_id',         %9$s,
              'snapshot',           %10$s
            ) %11$s
          ) FILTER (WHERE oi.id IS NOT NULL),
          '[]'::json
        ) AS order_items
      FROM public.orders o
      LEFT JOIN public.order_items oi ON oi.order_id = o.id
      GROUP BY
        o.id, o.%1$I, o.%2$I%16$s,
        %13$s, %3$s%12$s
  $fmt$,
    v_buyer_col,
    v_state_col,
    v_fee_col,
    v_extra_order_cols,
    CASE WHEN v_has_item_type   THEN 'COALESCE(oi.item_type, ''work'')' ELSE '''work''' END,
    CASE WHEN v_has_quantity    THEN 'oi.quantity' ELSE '1' END,
    v_price_expr,
    CASE WHEN v_has_fulfillment THEN 'COALESCE(oi.fulfillment_status, ''new'')' ELSE '''new''' END,
    v_creator_col,
    CASE WHEN v_has_snapshot    THEN 'COALESCE(oi.snapshot, ''{}''::jsonb)' ELSE '''{}''::jsonb' END,
    CASE WHEN v_has_oi_created  THEN 'ORDER BY oi.created_at' ELSE '' END,
    v_extra_order_group,
    v_impact_col,
    v_total_expr,
    v_created_expr,
    v_total_group || v_created_group
  );

  BEGIN
    EXECUTE v_sql;
    GRANT SELECT ON public.buyer_order_status TO authenticated, service_role;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'buyer_order_status: View-Erstellung fehlgeschlagen — %', SQLERRM;
  END;
END;
$view$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 14. increment_wallet_balance
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.increment_wallet_balance(
  p_user_id UUID,
  p_amount  NUMERIC
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_cols text := 'user_id, balance';
  v_vals text;
  v_upd  text;
BEGIN
  IF NOT public.hui_col_exists('creator_wallets', 'user_id') THEN
    RAISE EXCEPTION 'creator_wallets.user_id fehlt';
  END IF;
  IF NOT public.hui_col_exists('creator_wallets', 'balance') THEN
    RAISE NOTICE 'increment_wallet_balance: balance-Spalte fehlt — kein Update';
    RETURN;
  END IF;

  v_vals := format('%L, %L', p_user_id, p_amount);
  v_upd  := format('balance = creator_wallets.balance + %L', p_amount);

  IF public.hui_col_exists('creator_wallets', 'total_earned') THEN
    v_cols := v_cols || ', total_earned';
    v_vals := v_vals || format(', %L', p_amount);
    v_upd  := v_upd || format(', total_earned = creator_wallets.total_earned + %L', p_amount);
  END IF;

  IF public.hui_col_exists('creator_wallets', 'pending_balance') THEN
    v_cols := v_cols || ', pending_balance';
    v_vals := v_vals || ', 0';
  END IF;

  IF public.hui_col_exists('creator_wallets', 'updated_at') THEN
    v_upd := v_upd || ', updated_at = now()';
  END IF;

  EXECUTE format(
    'INSERT INTO public.creator_wallets (%s) VALUES (%s) ON CONFLICT (user_id) DO UPDATE SET %s',
    v_cols, v_vals, v_upd
  );
END;
$$;

REVOKE ALL ON FUNCTION public.increment_wallet_balance FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_wallet_balance TO service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- 15. Schema-Reload
-- ─────────────────────────────────────────────────────────────────────────────

GRANT USAGE ON SCHEMA public TO service_role, authenticated, anon;
NOTIFY pgrst, 'reload schema';

COMMIT;

-- ═══════════════════════════════════════════════════════════════════════════════
-- VERIFIKATION (nach COMMIT ausführen)
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. Tabellen
SELECT
  obj_name,
  obj_type,
  CASE WHEN exists_check THEN '✅ vorhanden' ELSE '❌ FEHLT' END AS result
FROM (VALUES
  ('orders',           'TABLE', EXISTS(SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='orders')),
  ('order_items',      'TABLE', EXISTS(SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='order_items')),
  ('works',            'TABLE', EXISTS(SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='works')),
  ('experiences',      'TABLE', EXISTS(SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='experiences')),
  ('shipments',        'TABLE', EXISTS(SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='shipments')),
  ('creator_wallets',  'TABLE', EXISTS(SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='creator_wallets')),
  ('creator_payouts',  'TABLE', EXISTS(SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='creator_payouts')),
  ('commerce_events',  'TABLE', EXISTS(SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='commerce_events')),
  ('webhook_events',   'TABLE', EXISTS(SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='webhook_events')),
  ('impact_rounds',    'TABLE', EXISTS(SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='impact_rounds')),
  ('notifications',    'TABLE', EXISTS(SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='notifications'))
) AS t(obj_name, obj_type, exists_check)
ORDER BY obj_name;

-- 2. Views
SELECT
  viewname AS obj_name,
  'VIEW' AS obj_type,
  '✅ vorhanden' AS result
FROM pg_views
WHERE schemaname = 'public'
  AND viewname IN ('commerce_price_authority', 'buyer_order_status')
ORDER BY viewname;

-- 3. Trigger
SELECT
  tgname AS obj_name,
  'TRIGGER' AS obj_type,
  '✅ vorhanden' AS result
FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND NOT t.tgisinternal
  AND tgname IN (
    'trg_orders_updated_at', 'trg_order_items_updated_at',
    'trg_shipments_updated_at', 'trg_creator_wallets_updated_at',
    'trg_creator_payouts_updated_at', 'trg_impact_rounds_updated_at'
  )
ORDER BY tgname;

-- 4. Policies
SELECT
  tablename || '.' || policyname AS obj_name,
  'POLICY' AS obj_type,
  '✅ vorhanden' AS result
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'orders', 'order_items', 'shipments', 'creator_wallets',
    'creator_payouts', 'commerce_events', 'webhook_events',
    'impact_rounds', 'notifications'
  )
ORDER BY tablename, policyname;

-- 5. Funktionen
SELECT
  proname AS obj_name,
  'FUNC' AS obj_type,
  '✅ vorhanden' AS result
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND proname IN ('hui_col_exists', 'update_updated_at', 'increment_wallet_balance')
ORDER BY proname;

-- 6. Commerce-Spalten (orders + order_items)
SELECT
  table_name || '.' || column_name AS obj_name,
  'COMMERCE_COL' AS obj_type,
  '✅ vorhanden' AS result
FROM information_schema.columns
WHERE table_schema = 'public'
  AND (
    (table_name = 'orders' AND column_name IN (
      'customer_id', 'state', 'commission_eur', 'total_eur', 'impact_eur',
      'cart_hash', 'subtotal_eur', 'shipping_eur', 'discount_eur',
      'shipping_address', 'contact_name', 'contact_email', 'metadata'
    ))
    OR (table_name = 'order_items' AND column_name IN (
      'order_id', 'seller_id', 'creator_id', 'unit_price_eur', 'price_eur',
      'item_type', 'item_id', 'snapshot', 'fulfillment_status',
      'payout_status', 'payout_eur', 'impact_eur', 'shipping_eur'
    ))
  )
ORDER BY table_name, column_name;

-- 7. Stripe-Spalten
SELECT
  table_name || '.' || column_name AS obj_name,
  'STRIPE_COL' AS obj_type,
  '✅ vorhanden' AS result
FROM information_schema.columns
WHERE table_schema = 'public'
  AND (
    (table_name = 'orders' AND column_name IN (
      'stripe_payment_intent', 'stripe_session_id', 'stripe_customer_id',
      'payment_confirmed_at'
    ))
    OR (table_name = 'order_items' AND column_name = 'stripe_transfer_id')
    OR (table_name = 'creator_wallets' AND column_name IN (
      'stripe_account_id', 'stripe_onboarding_complete',
      'stripe_charges_enabled', 'stripe_payouts_enabled', 'stripe_onboarding_url'
    ))
    OR (table_name = 'creator_payouts' AND column_name = 'stripe_transfer_id')
    OR (table_name = 'webhook_events' AND column_name = 'stripe_event_id')
  )
ORDER BY table_name, column_name;

-- 8. Wallet-Spalten
SELECT
  'creator_wallets.' || column_name AS obj_name,
  'WALLET_COL' AS obj_type,
  '✅ vorhanden' AS result
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'creator_wallets'
  AND column_name IN (
    'user_id', 'balance', 'pending_balance', 'total_earned',
    'stripe_account_id', 'stripe_onboarding_complete',
    'stripe_charges_enabled', 'stripe_payouts_enabled'
  )
ORDER BY column_name;
