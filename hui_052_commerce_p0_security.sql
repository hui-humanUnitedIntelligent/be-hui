-- ═══════════════════════════════════════════════════════════════════
-- ═══════════════════════════════════════════════════════════════════
-- LEGACY — SUPERSEDED BY COMMERCE 2.0 — REMOVE AFTER PHASE 5
-- Kanonische Migration: hui_057_commerce_schema_final.sql
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
