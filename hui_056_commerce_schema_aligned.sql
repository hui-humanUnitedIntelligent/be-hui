-- ═══════════════════════════════════════════════════════════════════════════════
-- HUI Migration 056 — Commerce Schema Production Final (Schema-Safe)
-- ═══════════════════════════════════════════════════════════════════════════════
--
-- ECHTES PRODUKTIONSSCHEMA public.orders:
--   id, customer_id, state, total_eur, commission_eur, impact_eur,
--   tracking_number, shipped_at, created_at, updated_at
--   (+notes, +status aus 026/027 — aber state ist kanonisch)
--
-- DIESE MIGRATION:
--   ✅ Entfernt fehlerhafte Relikte aus 051–054 (INDEX/CONSTRAINT auf status/buyer_id)
--   ✅ Erweitert orders ausschließlich mit ADD COLUMN IF NOT EXISTS
--   ✅ Alle Referenzen auf orders.state, orders.customer_id, orders.commission_eur
--   ✅ Keine NOT NULL ohne DEFAULT auf bestehenden Tabellen
--   ✅ Keine CREATE TABLE orders
--   ✅ Vollständig idempotent — kann mehrfach laufen
-- ═══════════════════════════════════════════════════════════════════════════════

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- 0. CLEANUP: Relikte aus Migration 051–054 entfernen
--    Alle Indizes/Constraints/Policies die auf nicht-existente Spalten zeigen
-- ─────────────────────────────────────────────────────────────────────────────

-- Indizes auf orders.status und orders.buyer_id (aus 051/053/054 — schema-falsch)
DROP INDEX IF EXISTS idx_orders_buyer;
DROP INDEX IF EXISTS idx_orders_status;
DROP INDEX IF EXISTS idx_orders_buyer_pending;
DROP INDEX IF EXISTS idx_orders_cart_hash;         -- hatte status-Bedingung

-- Constraint auf orders.status (aus 054 — falls angelegt)
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;

-- Alte Policies mit buyer_id (aus 051/052/053/054 — schema-falsch)
DROP POLICY IF EXISTS "orders_buyer_select"         ON public.orders;
DROP POLICY IF EXISTS "orders_buyer_insert"         ON public.orders;
DROP POLICY IF EXISTS "orders_buyer_select_aborted" ON public.orders;

-- Alte Views mit buyer_id/status (aus 053/054 — schema-falsch)
DROP VIEW IF EXISTS buyer_order_status;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. ENUM TYPEN — idempotent
-- ─────────────────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE commerce_item_type AS ENUM (
    'work','experience','event','service','support','pickup'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. update_updated_at FUNKTION
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. ORDERS — NUR ERWEITERN
--    Kanonisches Schema: customer_id, state, commission_eur
--    Neue Felder: stripe_payment_intent, cart_hash, shipping_address, etc.
-- ─────────────────────────────────────────────────────────────────────────────

-- Neue Felder ergänzen (alle nullable oder mit DEFAULT — safe für bestehende Zeilen)
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

-- Unique Constraints (sicher — Exception bei Duplikat)
DO $$ BEGIN
  ALTER TABLE public.orders
    ADD CONSTRAINT orders_stripe_pi_unique UNIQUE (stripe_payment_intent);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.orders
    ADD CONSTRAINT orders_stripe_session_unique UNIQUE (stripe_session_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Indizes — ausschließlich auf echte orders-Spalten (state, customer_id)
CREATE INDEX IF NOT EXISTS idx_orders_customer_id
  ON public.orders(customer_id);

CREATE INDEX IF NOT EXISTS idx_orders_state
  ON public.orders(state);

CREATE INDEX IF NOT EXISTS idx_orders_stripe_pi
  ON public.orders(stripe_payment_intent)
  WHERE stripe_payment_intent IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_orders_cart_hash_v2
  ON public.orders(customer_id, cart_hash)
  WHERE cart_hash IS NOT NULL;

-- Partial Index für Idempotenz-Lookup (state = 'pending')
CREATE INDEX IF NOT EXISTS idx_orders_cust_pending
  ON public.orders(customer_id, state)
  WHERE state = 'pending';

-- Trigger für updated_at
DROP TRIGGER IF EXISTS trg_orders_updated_at ON public.orders;
CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Alle alten Policies entfernen (bereits oben gedroppt)
DROP POLICY IF EXISTS "orders_select_own"        ON public.orders;
DROP POLICY IF EXISTS "orders_insert_own"        ON public.orders;
DROP POLICY IF EXISTS "orders_service_all"       ON public.orders;
DROP POLICY IF EXISTS "orders_select_customer"   ON public.orders;
DROP POLICY IF EXISTS "orders_insert_customer"   ON public.orders;

-- Neue Policies auf customer_id (kanonisch)
CREATE POLICY "orders_select_customer" ON public.orders
  FOR SELECT TO authenticated USING (auth.uid() = customer_id);

CREATE POLICY "orders_insert_customer" ON public.orders
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "orders_update_customer" ON public.orders
  FOR UPDATE TO authenticated USING (auth.uid() = customer_id);

CREATE POLICY "orders_service_all" ON public.orders
  FOR ALL TO service_role USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. ORDER_ITEMS — Erweitern
--    Bestehend: id, order_id, work_id, quantity, price_eur, seller_id, created_at
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS seller_id          UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS item_type          TEXT DEFAULT 'work';
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
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS updated_at         TIMESTAMPTZ DEFAULT now();

-- unit_price_eur aus price_eur befüllen wenn leer (Datenkonsistenz)
UPDATE public.order_items
  SET unit_price_eur = price_eur
  WHERE unit_price_eur = 0 AND price_eur IS NOT NULL AND price_eur > 0;

DROP TRIGGER IF EXISTS trg_order_items_updated_at ON public.order_items;
CREATE TRIGGER trg_order_items_updated_at
  BEFORE UPDATE ON public.order_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE INDEX IF NOT EXISTS idx_order_items_order    ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_seller   ON public.order_items(seller_id);
CREATE INDEX IF NOT EXISTS idx_order_items_fulfill  ON public.order_items(fulfillment_status);
CREATE INDEX IF NOT EXISTS idx_order_items_payout   ON public.order_items(payout_status);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "order_items_select"         ON public.order_items;
DROP POLICY IF EXISTS "order_items_buyer_select"   ON public.order_items;
DROP POLICY IF EXISTS "order_items_creator_select" ON public.order_items;
DROP POLICY IF EXISTS "order_items_seller_select"  ON public.order_items;
DROP POLICY IF EXISTS "order_items_service_all"    ON public.order_items;

CREATE POLICY "order_items_buyer_select" ON public.order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
        AND orders.customer_id = auth.uid()   -- kanonisch: customer_id
    )
  );

CREATE POLICY "order_items_seller_select" ON public.order_items
  FOR SELECT USING (seller_id = auth.uid());

CREATE POLICY "order_items_service_all" ON public.order_items
  FOR ALL TO service_role USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. SHIPMENTS
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

DROP TRIGGER IF EXISTS trg_shipments_updated_at ON public.shipments;
CREATE TRIGGER trg_shipments_updated_at
  BEFORE UPDATE ON public.shipments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE INDEX IF NOT EXISTS idx_shipments_order    ON public.shipments(order_id);
CREATE INDEX IF NOT EXISTS idx_shipments_item     ON public.shipments(order_item_id);
CREATE INDEX IF NOT EXISTS idx_shipments_creator  ON public.shipments(creator_id);

ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "shipments_creator_all"  ON public.shipments;
DROP POLICY IF EXISTS "shipments_buyer_select" ON public.shipments;
DROP POLICY IF EXISTS "shipments_service_all"  ON public.shipments;

CREATE POLICY "shipments_creator_all" ON public.shipments
  FOR ALL USING (creator_id = auth.uid())
  WITH CHECK (creator_id = auth.uid());

CREATE POLICY "shipments_buyer_select" ON public.shipments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = shipments.order_id
        AND orders.customer_id = auth.uid()   -- kanonisch: customer_id
    )
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
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

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
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.creator_payouts (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

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
  actor_type    TEXT DEFAULT 'system',
  payload       JSONB NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.commerce_events ADD COLUMN IF NOT EXISTS payout_id  UUID REFERENCES public.creator_payouts(id) ON DELETE SET NULL;
ALTER TABLE public.commerce_events ADD COLUMN IF NOT EXISTS actor_id   UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.commerce_events ADD COLUMN IF NOT EXISTS actor_type TEXT DEFAULT 'system';

CREATE INDEX IF NOT EXISTS idx_commerce_events_order   ON public.commerce_events(order_id);
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
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

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

-- ─────────────────────────────────────────────────────────────────────────────
-- 11. NOTIFICATIONS — sicherstellen
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
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'notifications'
      AND policyname = 'notifications_owner'
  ) THEN
    CREATE POLICY "notifications_owner" ON public.notifications
      FOR ALL USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
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

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS membership_type TEXT DEFAULT 'free';

-- ─────────────────────────────────────────────────────────────────────────────
-- 13. VIEW: commerce_price_authority
--     Basiert auf echten Spalten: user_id/creator_id, price, cover_url
--     Kein Bezug auf orders — eigenständige View auf works/experiences
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW public.commerce_price_authority AS
  SELECT
    'work'                              AS item_type,
    w.id                                AS item_id,
    COALESCE(w.creator_id, w.user_id)   AS creator_id,
    COALESCE(w.price, 0)                AS price_eur,
    COALESCE(w.shipping_cost, 0)        AS shipping_eur,
    w.title,
    w.cover_url,
    w.status
  FROM public.works w
  WHERE w.status IN ('published', 'approved')
    AND (w.for_sale IS NULL OR w.for_sale = true)

  UNION ALL

  SELECT
    'experience'                        AS item_type,
    e.id                                AS item_id,
    e.user_id                           AS creator_id,
    COALESCE(e.price, 0)                AS price_eur,
    0                                   AS shipping_eur,
    e.title,
    e.cover_url,
    e.status
  FROM public.experiences e
  WHERE e.status IN ('published', 'approved', 'active');

GRANT SELECT ON public.commerce_price_authority TO service_role, authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- 14. VIEW: buyer_order_status
--     Verwendet AUSSCHLIESSLICH: customer_id, state, commission_eur (kanonisch)
--     Gibt Edge-Function-kompatible Aliase zurück
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW public.buyer_order_status AS
  SELECT
    o.id,
    o.customer_id,
    o.customer_id                             AS buyer_id,
    o.state,
    o.state                                   AS status,
    o.total_eur,
    o.impact_eur,
    o.commission_eur,
    o.commission_eur                          AS platform_fee_eur,
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
          'item_type',          COALESCE(oi.item_type, 'work'),
          'quantity',           oi.quantity,
          'unit_price_eur',     COALESCE(oi.unit_price_eur, oi.price_eur, 0),
          'fulfillment_status', COALESCE(oi.fulfillment_status, 'new'),
          'seller_id',          oi.seller_id,
          'creator_id',         oi.seller_id,
          'snapshot',           COALESCE(oi.snapshot, '{}')
        ) ORDER BY oi.created_at
      ) FILTER (WHERE oi.id IS NOT NULL),
      '[]'::json
    ) AS order_items
  FROM public.orders o
  LEFT JOIN public.order_items oi ON oi.order_id = o.id
  GROUP BY
    o.id, o.customer_id, o.state, o.total_eur, o.impact_eur,
    o.commission_eur, o.stripe_payment_intent, o.payment_confirmed_at,
    o.created_at, o.shipping_address, o.contact_name, o.contact_email;

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
-- 16. GRANTS + Schema-Reload
-- ─────────────────────────────────────────────────────────────────────────────

GRANT USAGE ON SCHEMA public TO service_role, authenticated, anon;
NOTIFY pgrst, 'reload schema';

COMMIT;

-- ═══════════════════════════════════════════════════════════════════════════════
-- VERIFIKATION (nach COMMIT ausführen)
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT
  obj_name,
  obj_type,
  CASE WHEN exists_check THEN '✅ vorhanden' ELSE '❌ FEHLT' END AS result
FROM (VALUES
  ('orders',                      'TABLE',  EXISTS(SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='orders')),
  ('order_items',                 'TABLE',  EXISTS(SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='order_items')),
  ('shipments',                   'TABLE',  EXISTS(SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='shipments')),
  ('creator_wallets',             'TABLE',  EXISTS(SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='creator_wallets')),
  ('creator_payouts',             'TABLE',  EXISTS(SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='creator_payouts')),
  ('commerce_events',             'TABLE',  EXISTS(SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='commerce_events')),
  ('webhook_events',              'TABLE',  EXISTS(SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='webhook_events')),
  ('impact_rounds',               'TABLE',  EXISTS(SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='impact_rounds')),
  ('notifications',               'TABLE',  EXISTS(SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='notifications')),
  ('commerce_price_authority',    'VIEW',   EXISTS(SELECT 1 FROM pg_views  WHERE schemaname='public' AND viewname='commerce_price_authority')),
  ('buyer_order_status',          'VIEW',   EXISTS(SELECT 1 FROM pg_views  WHERE schemaname='public' AND viewname='buyer_order_status')),
  ('increment_wallet_balance',    'FUNC',   EXISTS(SELECT 1 FROM pg_proc   WHERE proname='increment_wallet_balance')),
  ('update_updated_at',           'FUNC',   EXISTS(SELECT 1 FROM pg_proc   WHERE proname='update_updated_at')),
  ('orders.customer_id',          'COL',    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='orders' AND column_name='customer_id')),
  ('orders.state',                'COL',    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='orders' AND column_name='state')),
  ('orders.commission_eur',       'COL',    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='orders' AND column_name='commission_eur')),
  ('orders.stripe_payment_intent','COL',    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='orders' AND column_name='stripe_payment_intent')),
  ('orders.cart_hash',            'COL',    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='orders' AND column_name='cart_hash')),
  ('orders.shipping_address',     'COL',    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='orders' AND column_name='shipping_address')),
  ('order_items.seller_id',       'COL',    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='order_items' AND column_name='seller_id')),
  ('order_items.payout_status',   'COL',    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='order_items' AND column_name='payout_status')),
  ('order_items.stripe_transfer_id','COL',  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='order_items' AND column_name='stripe_transfer_id')),
  ('order_items.snapshot',        'COL',    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='order_items' AND column_name='snapshot'))
) AS t(obj_name, obj_type, exists_check)
ORDER BY
  CASE obj_type WHEN 'TABLE' THEN 1 WHEN 'VIEW' THEN 2 WHEN 'FUNC' THEN 3 ELSE 4 END,
  obj_name;
