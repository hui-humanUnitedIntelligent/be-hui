-- ═══════════════════════════════════════════════════════════════════════════════
-- HUI Migration 055 — Commerce Production Final
-- ═══════════════════════════════════════════════════════════════════════════════
-- Analyse-Basis:
--   works:          user_id (PK-Owner), creator_id (Alias), price NUMERIC(10,2),
--                   cover_url TEXT, status TEXT DEFAULT 'published', title TEXT,
--                   shipping_cost NUMERIC(10,2) — KEIN price_eur
--   experiences:    user_id (PK-Owner), price NUMERIC(10,2), cover_url TEXT,
--                   status TEXT DEFAULT 'draft', title TEXT — KEIN price_eur
--   profiles:       membership_type TEXT DEFAULT 'free' | 'basisuser'
--   notifications:  id, user_id, type, title, body, read, data, created_at
--
-- Edge Functions verwenden:
--   orders:           buyer_id, subtotal_eur, total_eur, platform_fee_eur,
--                     impact_eur, status, currency, cart_hash,
--                     stripe_payment_intent (TEXT), payment_confirmed_at,
--                     shipping_address, contact_name, contact_email
--   order_items:      order_id, creator_id, item_type, item_id, snapshot,
--                     shipping_type, quantity, unit_price_eur, shipping_eur,
--                     payout_eur, impact_eur, fulfillment_status, payout_status,
--                     payout_released_at, payout_paid_at, stripe_transfer_id
--   creator_payouts:  creator_id, order_item_ids, gross_eur, platform_fee_eur,
--                     net_eur, stripe_transfer_id, status, initiated_at, paid_at
--   commerce_price_authority VIEW:
--                     item_id, item_type, price_eur (← COALESCE(price,0)),
--                     creator_id (← COALESCE(creator_id, user_id)),
--                     title, cover_url — nur existierende Spalten
-- ═══════════════════════════════════════════════════════════════════════════════

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. ENUM TYPEN — idempotent via EXCEPTION
-- ─────────────────────────────────────────────────────────────────────────────

DO $$ BEGIN CREATE TYPE commerce_item_type AS ENUM (
  'work','experience','event','service','support','pickup'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE shipping_type AS ENUM (
  'physical','digital','experience','service','pickup','none'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE order_status AS ENUM (
  'pending','paid','partially_fulfilled','fulfilled',
  'cancelled','refunded','failed','aborted'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE fulfillment_status AS ENUM (
  'new','processing','shipped','delivered','done','cancelled','returned'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE payout_status AS ENUM (
  'held','pending_release','released','paid','failed','refunded'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE commerce_event_type AS ENUM (
  'order_created','payment_confirmed','payment_failed',
  'item_processing','item_shipped','item_delivered','item_done',
  'item_cancelled','item_returned',
  'payout_released','payout_paid','payout_failed',
  'tracking_added','refund_initiated','refund_completed','impact_credited'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. TRIGGER-FUNKTION update_updated_at
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. ORDERS
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.orders (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id              UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  contact_name          TEXT,
  contact_email         TEXT,
  stripe_payment_intent TEXT        UNIQUE,   -- Stripe PI-ID (kein UUID!)
  stripe_session_id     TEXT        UNIQUE,
  stripe_customer_id    TEXT,
  shipping_address      JSONB,
  subtotal_eur          NUMERIC(10,2) NOT NULL DEFAULT 0,
  shipping_eur          NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount_eur          NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_eur             NUMERIC(10,2) NOT NULL DEFAULT 0,
  platform_fee_eur      NUMERIC(10,2) NOT NULL DEFAULT 0,
  impact_eur            NUMERIC(10,2) NOT NULL DEFAULT 0,
  cart_hash             TEXT,
  status                TEXT        NOT NULL DEFAULT 'pending',
  payment_confirmed_at  TIMESTAMPTZ,
  cancelled_at          TIMESTAMPTZ,
  currency              TEXT        NOT NULL DEFAULT 'eur',
  notes                 TEXT,
  metadata              JSONB,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Typ-Fix: stripe_payment_intent war in alten Schemas UUID — muss TEXT sein
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'orders'
      AND column_name = 'stripe_payment_intent' AND data_type = 'uuid'
  ) THEN
    -- Unique Constraint temporär droppen, Typ ändern, neu erstellen
    ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_stripe_payment_intent_key;
    ALTER TABLE public.orders ALTER COLUMN stripe_payment_intent TYPE TEXT
      USING stripe_payment_intent::TEXT;
    ALTER TABLE public.orders ADD CONSTRAINT orders_stripe_payment_intent_key
      UNIQUE (stripe_payment_intent);
    RAISE NOTICE 'orders.stripe_payment_intent: UUID → TEXT migriert';
  END IF;
END $$;

-- Fehlende Spalten ergänzen (idempotent)
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS contact_name          TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS contact_email         TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS stripe_session_id     TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS stripe_customer_id    TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_address      JSONB;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS discount_eur          NUMERIC(10,2) DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS platform_fee_eur      NUMERIC(10,2) DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS impact_eur            NUMERIC(10,2) DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cart_hash             TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_confirmed_at  TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cancelled_at          TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS notes                 TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS metadata              JSONB;

-- Status-Constraint (sicher)
DO $$ BEGIN
  ALTER TABLE public.orders ADD CONSTRAINT orders_status_check
    CHECK (status IN (
      'pending','paid','partially_fulfilled','fulfilled',
      'cancelled','refunded','failed','aborted'
    ));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Trigger
DROP TRIGGER IF EXISTS trg_orders_updated_at ON public.orders;
CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Indizes (IF NOT EXISTS überall)
CREATE INDEX IF NOT EXISTS idx_orders_buyer         ON public.orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_stripe_pi     ON public.orders(stripe_payment_intent);
CREATE INDEX IF NOT EXISTS idx_orders_status        ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created       ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_cart_hash     ON public.orders(cart_hash)     WHERE cart_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_buyer_pending ON public.orders(buyer_id, status) WHERE status = 'pending';

-- RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "orders_buyer_select" ON public.orders;
DROP POLICY IF EXISTS "orders_service_all"  ON public.orders;
CREATE POLICY "orders_buyer_select" ON public.orders
  FOR SELECT USING (auth.uid() = buyer_id);
CREATE POLICY "orders_service_all" ON public.orders
  FOR ALL TO service_role USING (true) WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. ORDER_ITEMS
--    Felder aus Edge Function: creator_id, item_type, item_id, snapshot,
--    shipping_type, quantity, unit_price_eur, shipping_eur, payout_eur,
--    impact_eur, fulfillment_status, payout_status,
--    payout_released_at, payout_paid_at, stripe_transfer_id
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.order_items (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id            UUID        NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  creator_id          UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  item_type           TEXT        NOT NULL DEFAULT 'work',
  item_id             UUID,
  snapshot            JSONB       NOT NULL DEFAULT '{}',
  shipping_type       TEXT        NOT NULL DEFAULT 'none',
  quantity            INT         NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price_eur      NUMERIC(10,2) NOT NULL DEFAULT 0,
  shipping_eur        NUMERIC(10,2) NOT NULL DEFAULT 0,
  payout_eur          NUMERIC(10,2),
  impact_eur          NUMERIC(10,2) DEFAULT 0,
  fulfillment_status  TEXT        NOT NULL DEFAULT 'new',
  fulfillment_note    TEXT,
  fulfilled_at        TIMESTAMPTZ,
  payout_status       TEXT        NOT NULL DEFAULT 'held',
  payout_released_at  TIMESTAMPTZ,
  payout_paid_at      TIMESTAMPTZ,
  stripe_transfer_id  TEXT,        -- aus release-payout benötigt
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Fehlende Spalten
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS impact_eur         NUMERIC(10,2) DEFAULT 0;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS fulfillment_note   TEXT;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS fulfilled_at       TIMESTAMPTZ;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS payout_released_at TIMESTAMPTZ;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS payout_paid_at     TIMESTAMPTZ;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS stripe_transfer_id TEXT;

DROP TRIGGER IF EXISTS trg_order_items_updated_at ON public.order_items;
CREATE TRIGGER trg_order_items_updated_at
  BEFORE UPDATE ON public.order_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS idx_order_items_order   ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_creator ON public.order_items(creator_id);
CREATE INDEX IF NOT EXISTS idx_order_items_item    ON public.order_items(item_id);
CREATE INDEX IF NOT EXISTS idx_order_items_fulfill ON public.order_items(fulfillment_status);
CREATE INDEX IF NOT EXISTS idx_order_items_payout  ON public.order_items(payout_status);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "order_items_buyer_select"   ON public.order_items;
DROP POLICY IF EXISTS "order_items_creator_select" ON public.order_items;
DROP POLICY IF EXISTS "order_items_service_all"    ON public.order_items;
CREATE POLICY "order_items_buyer_select" ON public.order_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.orders
            WHERE orders.id = order_items.order_id AND orders.buyer_id = auth.uid())
  );
CREATE POLICY "order_items_creator_select" ON public.order_items
  FOR SELECT USING (creator_id = auth.uid());
CREATE POLICY "order_items_service_all" ON public.order_items
  FOR ALL TO service_role USING (true) WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. SHIPMENTS
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.shipments (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id           UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
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

DROP TRIGGER IF EXISTS trg_shipments_updated_at ON public.shipments;
CREATE TRIGGER trg_shipments_updated_at
  BEFORE UPDATE ON public.shipments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS idx_shipments_order   ON public.shipments(order_id);
CREATE INDEX IF NOT EXISTS idx_shipments_item    ON public.shipments(order_item_id);
CREATE INDEX IF NOT EXISTS idx_shipments_creator ON public.shipments(creator_id);

ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "shipments_creator_all"  ON public.shipments;
DROP POLICY IF EXISTS "shipments_buyer_select" ON public.shipments;
DROP POLICY IF EXISTS "shipments_service_all"  ON public.shipments;
CREATE POLICY "shipments_creator_all" ON public.shipments
  FOR ALL USING (creator_id = auth.uid()) WITH CHECK (creator_id = auth.uid());
CREATE POLICY "shipments_buyer_select" ON public.shipments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.orders
            WHERE orders.id = shipments.order_id AND orders.buyer_id = auth.uid())
  );
CREATE POLICY "shipments_service_all" ON public.shipments
  FOR ALL TO service_role USING (true) WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE ON public.shipments TO authenticated;
GRANT ALL ON public.shipments TO service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. CREATOR_WALLETS
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

DROP TRIGGER IF EXISTS trg_creator_wallets_updated_at ON public.creator_wallets;
CREATE TRIGGER trg_creator_wallets_updated_at
  BEFORE UPDATE ON public.creator_wallets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE public.creator_wallets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "wallets_owner_select" ON public.creator_wallets;
DROP POLICY IF EXISTS "wallets_service_all"  ON public.creator_wallets;
CREATE POLICY "wallets_owner_select" ON public.creator_wallets
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "wallets_service_all" ON public.creator_wallets
  FOR ALL TO service_role USING (true) WITH CHECK (true);
GRANT SELECT ON public.creator_wallets TO authenticated;
GRANT ALL ON public.creator_wallets TO service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. CREATOR_PAYOUTS
--    Felder aus release-payout: creator_id, order_item_ids (JSONB-Array),
--    gross_eur, platform_fee_eur, net_eur, stripe_transfer_id,
--    status, initiated_at, paid_at
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.creator_payouts (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_item_ids     JSONB,          -- Array von Order-Item-UUIDs
  order_item_id      UUID REFERENCES public.order_items(id) ON DELETE SET NULL, -- Legacy
  gross_eur          NUMERIC(10,2),
  net_eur            NUMERIC(10,2),
  amount_eur         NUMERIC(10,2),  -- Legacy-Alias für gross_eur
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

-- Fehlende Spalten ergänzen
ALTER TABLE public.creator_payouts ADD COLUMN IF NOT EXISTS order_item_ids   JSONB;
ALTER TABLE public.creator_payouts ADD COLUMN IF NOT EXISTS gross_eur        NUMERIC(10,2);
ALTER TABLE public.creator_payouts ADD COLUMN IF NOT EXISTS net_eur          NUMERIC(10,2);
ALTER TABLE public.creator_payouts ADD COLUMN IF NOT EXISTS platform_fee_eur NUMERIC(10,2) DEFAULT 0;
ALTER TABLE public.creator_payouts ADD COLUMN IF NOT EXISTS stripe_transfer_id TEXT;
ALTER TABLE public.creator_payouts ADD COLUMN IF NOT EXISTS initiated_at     TIMESTAMPTZ;
ALTER TABLE public.creator_payouts ADD COLUMN IF NOT EXISTS notes            TEXT;
ALTER TABLE public.creator_payouts ADD COLUMN IF NOT EXISTS metadata         JSONB;

DROP TRIGGER IF EXISTS trg_creator_payouts_updated_at ON public.creator_payouts;
CREATE TRIGGER trg_creator_payouts_updated_at
  BEFORE UPDATE ON public.creator_payouts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS idx_creator_payouts_creator ON public.creator_payouts(creator_id);
CREATE INDEX IF NOT EXISTS idx_creator_payouts_status  ON public.creator_payouts(status);

ALTER TABLE public.creator_payouts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "payouts_creator_select" ON public.creator_payouts;
DROP POLICY IF EXISTS "payouts_service_all"    ON public.creator_payouts;
CREATE POLICY "payouts_creator_select" ON public.creator_payouts
  FOR SELECT USING (creator_id = auth.uid());
CREATE POLICY "payouts_service_all" ON public.creator_payouts
  FOR ALL TO service_role USING (true) WITH CHECK (true);
GRANT SELECT ON public.creator_payouts TO authenticated;
GRANT ALL ON public.creator_payouts TO service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. COMMERCE_EVENTS
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.commerce_events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type    TEXT NOT NULL,
  order_id      UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  order_item_id UUID REFERENCES public.order_items(id) ON DELETE SET NULL,
  payout_id     UUID REFERENCES public.creator_payouts(id) ON DELETE SET NULL,
  actor_id      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_type    TEXT NOT NULL DEFAULT 'system',
  payload       JSONB NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.commerce_events ADD COLUMN IF NOT EXISTS payout_id  UUID REFERENCES public.creator_payouts(id) ON DELETE SET NULL;
ALTER TABLE public.commerce_events ADD COLUMN IF NOT EXISTS actor_id   UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.commerce_events ADD COLUMN IF NOT EXISTS actor_type TEXT DEFAULT 'system';

-- Default setzen falls actor_type NULL (für bestehende Zeilen)
UPDATE public.commerce_events SET actor_type = 'system' WHERE actor_type IS NULL;

CREATE INDEX IF NOT EXISTS idx_commerce_events_order   ON public.commerce_events(order_id);
CREATE INDEX IF NOT EXISTS idx_commerce_events_item    ON public.commerce_events(order_item_id);
CREATE INDEX IF NOT EXISTS idx_commerce_events_type    ON public.commerce_events(event_type);
CREATE INDEX IF NOT EXISTS idx_commerce_events_created ON public.commerce_events(created_at DESC);

ALTER TABLE public.commerce_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "commerce_events_service_all" ON public.commerce_events;
CREATE POLICY "commerce_events_service_all" ON public.commerce_events
  FOR ALL TO service_role USING (true) WITH CHECK (true);
GRANT ALL ON public.commerce_events TO service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- 9. WEBHOOK_EVENTS
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.webhook_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id TEXT UNIQUE NOT NULL,
  event_type      TEXT NOT NULL,
  order_id        UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  status          TEXT NOT NULL DEFAULT 'received',
  payload         JSONB,
  processed_at    TIMESTAMPTZ,
  error_message   TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.webhook_events ADD COLUMN IF NOT EXISTS error_message TEXT;
ALTER TABLE public.webhook_events ADD COLUMN IF NOT EXISTS processed_at  TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_webhook_events_stripe_id ON public.webhook_events(stripe_event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_status    ON public.webhook_events(status);
CREATE INDEX IF NOT EXISTS idx_webhook_events_created   ON public.webhook_events(created_at DESC);

ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "webhook_events_service_all" ON public.webhook_events;
CREATE POLICY "webhook_events_service_all" ON public.webhook_events
  FOR ALL TO service_role USING (true) WITH CHECK (true);
GRANT ALL ON public.webhook_events TO service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- 10. IMPACT_ROUNDS
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

DROP TRIGGER IF EXISTS trg_impact_rounds_updated_at ON public.impact_rounds;
CREATE TRIGGER trg_impact_rounds_updated_at
  BEFORE UPDATE ON public.impact_rounds
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE public.impact_rounds ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "impact_rounds_public_select" ON public.impact_rounds;
DROP POLICY IF EXISTS "impact_rounds_service_all"   ON public.impact_rounds;
CREATE POLICY "impact_rounds_public_select" ON public.impact_rounds FOR SELECT USING (true);
CREATE POLICY "impact_rounds_service_all"   ON public.impact_rounds
  FOR ALL TO service_role USING (true) WITH CHECK (true);
GRANT SELECT ON public.impact_rounds TO authenticated, anon;
GRANT ALL ON public.impact_rounds TO service_role;

-- Aktive Runde für aktuellen Monat
INSERT INTO public.impact_rounds (month, status, pool_eur)
VALUES (to_char(now(), 'YYYY-MM'), 'active', 0)
ON CONFLICT (month) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- 11. NOTIFICATIONS — sicherstellen (Webhook-Abhängigkeit)
--     Echtes Schema: id, user_id, type, title, body, read, data, created_at
-- ─────────────────────────────────────────────────────────────────────────────

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

CREATE INDEX IF NOT EXISTS idx_notif_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notif_read    ON public.notifications(read);
CREATE INDEX IF NOT EXISTS idx_notif_created ON public.notifications(created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  -- Policy nur erstellen wenn sie fehlt
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='notifications' AND policyname='notifications_owner'
  ) THEN
    CREATE POLICY "notifications_owner" ON public.notifications
      FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;
DROP POLICY IF EXISTS "notifications_service_all" ON public.notifications;
CREATE POLICY "notifications_service_all" ON public.notifications
  FOR ALL TO service_role USING (true) WITH CHECK (true);
GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- 12. profiles: membership_type sicherstellen (release-payout braucht es)
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS membership_type TEXT DEFAULT 'free';

-- ─────────────────────────────────────────────────────────────────────────────
-- 13. VIEW: commerce_price_authority
--     Basiert auf echtem Schema:
--       works:       user_id, creator_id (beide können Owner sein),
--                    price NUMERIC(10,2), cover_url, status, title
--       experiences: user_id (owner), price NUMERIC(10,2), cover_url, status, title
--     Edge Function erwartet: item_id, item_type, price_eur, creator_id, title, cover_url
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW public.commerce_price_authority AS

  -- Werke: creator_id bevorzugt, Fallback auf user_id
  SELECT
    'work'                                              AS item_type,
    id                                                  AS item_id,
    COALESCE(creator_id, user_id)                       AS creator_id,
    COALESCE(price, 0)                                  AS price_eur,
    COALESCE(shipping_cost, 0)                          AS shipping_eur,
    title,
    cover_url,
    status
  FROM public.works
  WHERE status IN ('published', 'approved')
    AND for_sale IS NOT FALSE   -- NULL = erlaubt, FALSE = explizit nicht

  UNION ALL

  -- Erlebnisse: nur user_id als Owner (kein creator_id-Feld)
  SELECT
    'experience'                                        AS item_type,
    id                                                  AS item_id,
    user_id                                             AS creator_id,
    COALESCE(price, 0)                                  AS price_eur,
    0                                                   AS shipping_eur,
    title,
    cover_url,
    status
  FROM public.experiences
  WHERE status IN ('published', 'approved', 'active');

GRANT SELECT ON public.commerce_price_authority TO service_role, authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- 14. VIEW: buyer_order_status
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW public.buyer_order_status AS
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
      '[]'::json
    ) AS order_items
  FROM public.orders o
  LEFT JOIN public.order_items oi ON oi.order_id = o.id
  GROUP BY o.id, o.status, o.total_eur, o.impact_eur,
           o.stripe_payment_intent, o.payment_confirmed_at, o.created_at,
           o.shipping_address, o.contact_name, o.contact_email;

GRANT SELECT ON public.buyer_order_status TO authenticated, service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- 15. FUNKTION: increment_wallet_balance
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.increment_wallet_balance(
  p_user_id UUID,
  p_amount  NUMERIC
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.creator_wallets (user_id, balance, total_earned, pending_balance)
  VALUES (p_user_id, p_amount, p_amount, 0)
  ON CONFLICT (user_id) DO UPDATE SET
    balance      = creator_wallets.balance + p_amount,
    total_earned = creator_wallets.total_earned + p_amount,
    updated_at   = now();
END;
$$;

REVOKE ALL ON FUNCTION public.increment_wallet_balance FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_wallet_balance TO service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- 16. GRANTS (konsolidiert)
-- ─────────────────────────────────────────────────────────────────────────────

GRANT USAGE ON SCHEMA public TO service_role, authenticated, anon;

-- ─────────────────────────────────────────────────────────────────────────────
-- 17. PostgREST Schema-Reload
-- ─────────────────────────────────────────────────────────────────────────────

NOTIFY pgrst, 'reload schema';

-- ═══════════════════════════════════════════════════════════════════════════════
-- VERIFIKATION — zeigt Status aller Commerce-Objekte nach Migration
-- ═══════════════════════════════════════════════════════════════════════════════

COMMIT;

-- Verifikation nach COMMIT ausführen
SELECT
  obj_name, obj_type,
  CASE WHEN exists_check THEN '✅ vorhanden' ELSE '❌ FEHLT' END AS status
FROM (VALUES
  ('orders',                   'TABLE', EXISTS(SELECT 1 FROM pg_tables   WHERE schemaname='public' AND tablename='orders')),
  ('order_items',              'TABLE', EXISTS(SELECT 1 FROM pg_tables   WHERE schemaname='public' AND tablename='order_items')),
  ('shipments',                'TABLE', EXISTS(SELECT 1 FROM pg_tables   WHERE schemaname='public' AND tablename='shipments')),
  ('creator_wallets',          'TABLE', EXISTS(SELECT 1 FROM pg_tables   WHERE schemaname='public' AND tablename='creator_wallets')),
  ('creator_payouts',          'TABLE', EXISTS(SELECT 1 FROM pg_tables   WHERE schemaname='public' AND tablename='creator_payouts')),
  ('commerce_events',          'TABLE', EXISTS(SELECT 1 FROM pg_tables   WHERE schemaname='public' AND tablename='commerce_events')),
  ('webhook_events',           'TABLE', EXISTS(SELECT 1 FROM pg_tables   WHERE schemaname='public' AND tablename='webhook_events')),
  ('impact_rounds',            'TABLE', EXISTS(SELECT 1 FROM pg_tables   WHERE schemaname='public' AND tablename='impact_rounds')),
  ('notifications',            'TABLE', EXISTS(SELECT 1 FROM pg_tables   WHERE schemaname='public' AND tablename='notifications')),
  ('commerce_price_authority', 'VIEW',  EXISTS(SELECT 1 FROM pg_views    WHERE schemaname='public' AND viewname='commerce_price_authority')),
  ('buyer_order_status',       'VIEW',  EXISTS(SELECT 1 FROM pg_views    WHERE schemaname='public' AND viewname='buyer_order_status')),
  ('increment_wallet_balance', 'FUNC',  EXISTS(SELECT 1 FROM pg_proc     WHERE proname='increment_wallet_balance')),
  ('update_updated_at',        'FUNC',  EXISTS(SELECT 1 FROM pg_proc     WHERE proname='update_updated_at'))
) AS t(obj_name, obj_type, exists_check)
ORDER BY obj_type, obj_name;
