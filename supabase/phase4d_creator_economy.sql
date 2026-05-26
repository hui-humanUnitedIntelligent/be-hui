-- ═══════════════════════════════════════════════════════════════════════
-- HUI PHASE 4D — CREATOR ECONOMY SYSTEM
-- Erstellt: 2026-05-26
-- Tabellen: creator_wallets, creator_supports, experience_bookings
-- Erweiterungen: works (commerce), profiles (badges)
-- ═══════════════════════════════════════════════════════════════════════

-- ── 0. Sicherheitsnetz ───────────────────────────────────────────────
SET search_path TO public;

-- ═══════════════════════════════════════════════════════════════════════
-- 1. CREATOR WALLETS
-- Automatisch erstellt wenn User Talent wird (via Trigger)
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.creator_wallets (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  balance          NUMERIC(10,2) DEFAULT 0.00 NOT NULL,
  pending_balance  NUMERIC(10,2) DEFAULT 0.00 NOT NULL,
  total_earned     NUMERIC(10,2) DEFAULT 0.00 NOT NULL,
  currency         TEXT DEFAULT 'EUR' NOT NULL,
  payout_email     TEXT,
  payout_iban      TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at       TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT creator_wallets_user_id_unique UNIQUE (user_id),
  CONSTRAINT balance_non_negative       CHECK (balance >= 0),
  CONSTRAINT pending_balance_non_negative CHECK (pending_balance >= 0),
  CONSTRAINT total_earned_non_negative   CHECK (total_earned >= 0)
);

COMMENT ON TABLE  public.creator_wallets IS 'Wallet für jeden Talent-Creator — Einnahmen, Pending, Total';
COMMENT ON COLUMN public.creator_wallets.balance         IS 'Verfügbares Guthaben';
COMMENT ON COLUMN public.creator_wallets.pending_balance IS 'Noch nicht freigegebene Einnahmen (z.B. nach Buchung, vor Abschluss)';
COMMENT ON COLUMN public.creator_wallets.total_earned    IS 'Kumulierte Lebenszeit-Einnahmen';

-- RLS
ALTER TABLE public.creator_wallets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wallet_owner_select" ON public.creator_wallets;
DROP POLICY IF EXISTS "wallet_owner_update" ON public.creator_wallets;
DROP POLICY IF EXISTS "wallet_service_all"  ON public.creator_wallets;

CREATE POLICY "wallet_owner_select" ON public.creator_wallets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "wallet_owner_update" ON public.creator_wallets
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "wallet_service_all" ON public.creator_wallets
  FOR ALL USING (auth.role() = 'service_role');

-- Trigger: updated_at
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_wallets_updated_at ON public.creator_wallets;
CREATE TRIGGER trg_wallets_updated_at
  BEFORE UPDATE ON public.creator_wallets
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Trigger: Wallet auto-erstellen wenn membership_type = 'talent'
CREATE OR REPLACE FUNCTION public.auto_create_creator_wallet()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.membership_type = 'talent' AND NEW.membership_active = TRUE THEN
    INSERT INTO public.creator_wallets (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_wallet ON public.profiles;
CREATE TRIGGER trg_auto_wallet
  AFTER INSERT OR UPDATE OF membership_type, membership_active ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.auto_create_creator_wallet();

-- ═══════════════════════════════════════════════════════════════════════
-- 2. CREATOR SUPPORTS (Direkte Unterstützungen BasisUser → Talent)
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.creator_supports (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  supporter_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  creator_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount           NUMERIC(8,2) NOT NULL,
  currency         TEXT DEFAULT 'EUR' NOT NULL,
  message          TEXT,
  -- Payment-Vorbereitung (Stripe etc.)
  payment_status   TEXT DEFAULT 'pending' NOT NULL,
  payment_provider TEXT DEFAULT 'stripe',
  transaction_id   TEXT,
  -- Kontext: woher kam der Support (Feed, Profil, Work, ...)
  source_type      TEXT,
  source_id        UUID,
  created_at       TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT amount_positive      CHECK (amount > 0),
  CONSTRAINT payment_status_valid CHECK (payment_status IN ('pending','completed','failed','refunded')),
  CONSTRAINT no_self_support      CHECK (supporter_id != creator_id)
);

COMMENT ON TABLE  public.creator_supports IS 'Direkte Talent-Unterstützungen — emotionales Herzstück des Creator Economy';
COMMENT ON COLUMN public.creator_supports.source_type IS 'feed_post | profile | work | experience | impact_project';

-- RLS
ALTER TABLE public.creator_supports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "support_supporter_select" ON public.creator_supports;
DROP POLICY IF EXISTS "support_creator_select"   ON public.creator_supports;
DROP POLICY IF EXISTS "support_insert"            ON public.creator_supports;
DROP POLICY IF EXISTS "support_service_all"       ON public.creator_supports;

CREATE POLICY "support_supporter_select" ON public.creator_supports
  FOR SELECT USING (auth.uid() = supporter_id);

CREATE POLICY "support_creator_select" ON public.creator_supports
  FOR SELECT USING (auth.uid() = creator_id);

CREATE POLICY "support_insert" ON public.creator_supports
  FOR INSERT WITH CHECK (auth.uid() = supporter_id);

CREATE POLICY "support_service_all" ON public.creator_supports
  FOR ALL USING (auth.role() = 'service_role');

-- Index
CREATE INDEX IF NOT EXISTS idx_supports_creator_id   ON public.creator_supports(creator_id);
CREATE INDEX IF NOT EXISTS idx_supports_supporter_id ON public.creator_supports(supporter_id);
CREATE INDEX IF NOT EXISTS idx_supports_created_at   ON public.creator_supports(created_at DESC);

-- ═══════════════════════════════════════════════════════════════════════
-- 3. EXPERIENCE BOOKINGS
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.experience_bookings (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  experience_id    UUID NOT NULL REFERENCES public.experiences(id) ON DELETE RESTRICT,
  creator_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_id          UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  seats            INTEGER DEFAULT 1 NOT NULL,
  amount           NUMERIC(8,2) NOT NULL,
  currency         TEXT DEFAULT 'EUR' NOT NULL,
  booking_status   TEXT DEFAULT 'pending' NOT NULL,
  -- Nachricht vom Gast
  guest_message    TEXT,
  -- Antwort vom Creator
  creator_response TEXT,
  confirmed_at     TIMESTAMPTZ,
  cancelled_at     TIMESTAMPTZ,
  completed_at     TIMESTAMPTZ,
  -- Payment
  payment_status   TEXT DEFAULT 'pending' NOT NULL,
  payment_provider TEXT DEFAULT 'stripe',
  transaction_id   TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at       TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT seats_positive          CHECK (seats > 0),
  CONSTRAINT amount_non_negative     CHECK (amount >= 0),
  CONSTRAINT booking_status_valid    CHECK (booking_status IN ('pending','confirmed','cancelled','completed','no_show')),
  CONSTRAINT payment_status_valid    CHECK (payment_status IN ('pending','completed','failed','refunded')),
  CONSTRAINT no_self_booking         CHECK (user_id != creator_id)
);

COMMENT ON TABLE public.experience_bookings IS 'Buchungen für Erlebnisse — Kern des Experience Economy';

-- RLS
ALTER TABLE public.experience_bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "booking_guest_select"   ON public.experience_bookings;
DROP POLICY IF EXISTS "booking_creator_select" ON public.experience_bookings;
DROP POLICY IF EXISTS "booking_guest_insert"   ON public.experience_bookings;
DROP POLICY IF EXISTS "booking_creator_update" ON public.experience_bookings;
DROP POLICY IF EXISTS "booking_service_all"    ON public.experience_bookings;

CREATE POLICY "booking_guest_select" ON public.experience_bookings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "booking_creator_select" ON public.experience_bookings
  FOR SELECT USING (auth.uid() = creator_id);

CREATE POLICY "booking_guest_insert" ON public.experience_bookings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "booking_creator_update" ON public.experience_bookings
  FOR UPDATE USING (auth.uid() = creator_id);

CREATE POLICY "booking_service_all" ON public.experience_bookings
  FOR ALL USING (auth.role() = 'service_role');

DROP TRIGGER IF EXISTS trg_bookings_updated_at ON public.experience_bookings;
CREATE TRIGGER trg_bookings_updated_at
  BEFORE UPDATE ON public.experience_bookings
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Index
CREATE INDEX IF NOT EXISTS idx_bookings_experience_id ON public.experience_bookings(experience_id);
CREATE INDEX IF NOT EXISTS idx_bookings_creator_id    ON public.experience_bookings(creator_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id       ON public.experience_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status        ON public.experience_bookings(booking_status);

-- ═══════════════════════════════════════════════════════════════════════
-- 4. WORKS — Commerce-Felder ergänzen (safe: nur wenn nicht vorhanden)
-- ═══════════════════════════════════════════════════════════════════════
ALTER TABLE public.works
  ADD COLUMN IF NOT EXISTS is_for_sale    BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS inventory      INTEGER DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS sales_count    INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS currency       TEXT DEFAULT 'EUR';

COMMENT ON COLUMN public.works.is_for_sale IS 'true = Werk ist käuflich';
COMMENT ON COLUMN public.works.inventory   IS 'NULL = unbegrenzt, >0 = limitierte Auflage';
COMMENT ON COLUMN public.works.sales_count IS 'Anzahl erfolgreicher Verkäufe';

-- Work Sales Log
CREATE TABLE IF NOT EXISTS public.work_sales (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  work_id          UUID NOT NULL REFERENCES public.works(id) ON DELETE RESTRICT,
  creator_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  buyer_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount           NUMERIC(8,2) NOT NULL,
  currency         TEXT DEFAULT 'EUR' NOT NULL,
  payment_status   TEXT DEFAULT 'pending' NOT NULL,
  payment_provider TEXT DEFAULT 'stripe',
  transaction_id   TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT amount_positive   CHECK (amount > 0),
  CONSTRAINT no_self_purchase  CHECK (buyer_id != creator_id),
  CONSTRAINT payment_status_valid CHECK (payment_status IN ('pending','completed','failed','refunded'))
);

ALTER TABLE public.work_sales ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sale_buyer_select"   ON public.work_sales;
DROP POLICY IF EXISTS "sale_creator_select" ON public.work_sales;
DROP POLICY IF EXISTS "sale_insert"         ON public.work_sales;
DROP POLICY IF EXISTS "sale_service_all"    ON public.work_sales;

CREATE POLICY "sale_buyer_select"   ON public.work_sales FOR SELECT USING (auth.uid() = buyer_id);
CREATE POLICY "sale_creator_select" ON public.work_sales FOR SELECT USING (auth.uid() = creator_id);
CREATE POLICY "sale_insert"         ON public.work_sales FOR INSERT WITH CHECK (auth.uid() = buyer_id);
CREATE POLICY "sale_service_all"    ON public.work_sales FOR ALL   USING (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_work_sales_creator_id ON public.work_sales(creator_id);
CREATE INDEX IF NOT EXISTS idx_work_sales_work_id    ON public.work_sales(work_id);

-- ═══════════════════════════════════════════════════════════════════════
-- 5. PROFILES — Creator-Badge-Vorbereitung
-- ═══════════════════════════════════════════════════════════════════════
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS creator_badge    TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS profile_views    INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_supporters INTEGER DEFAULT 0;

COMMENT ON COLUMN public.profiles.creator_badge    IS 'talent | verified_talent | community_creator | raumhalter | NULL';
COMMENT ON COLUMN public.profiles.profile_views    IS 'Gesamte Profilaufrufe (Analytics)';
COMMENT ON COLUMN public.profiles.total_supporters IS 'Anzahl einzigartiger Unterstützer';

-- ═══════════════════════════════════════════════════════════════════════
-- 6. ANALYTICS EVENTS (leichtgewichtig — kein schweres Event-System)
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.creator_analytics (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_type   TEXT NOT NULL,
  source_type  TEXT,
  source_id    UUID,
  viewer_id    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT event_type_valid CHECK (event_type IN (
    'profile_view','story_view','work_view','experience_view',
    'booking','purchase','support','follow'
  ))
);

COMMENT ON TABLE public.creator_analytics IS 'Leichtgewichtige Creator-Insights — keine externen Analytics-Tools nötig';

ALTER TABLE public.creator_analytics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "analytics_creator_select" ON public.creator_analytics;
DROP POLICY IF EXISTS "analytics_insert"         ON public.creator_analytics;
DROP POLICY IF EXISTS "analytics_service_all"    ON public.creator_analytics;

CREATE POLICY "analytics_creator_select" ON public.creator_analytics
  FOR SELECT USING (auth.uid() = creator_id);

CREATE POLICY "analytics_insert" ON public.creator_analytics
  FOR INSERT WITH CHECK (true); -- Jeder kann Events für Creator tracken

CREATE POLICY "analytics_service_all" ON public.creator_analytics
  FOR ALL USING (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_analytics_creator_id  ON public.creator_analytics(creator_id);
CREATE INDEX IF NOT EXISTS idx_analytics_event_type  ON public.creator_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_created_at  ON public.creator_analytics(created_at DESC);

-- ═══════════════════════════════════════════════════════════════════════
-- 7. RPC: get_creator_summary (Dashboard Summary in einem Aufruf)
-- ═══════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.get_creator_summary(p_user_id UUID)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_wallet         RECORD;
  v_supports       RECORD;
  v_bookings       RECORD;
  v_sales          RECORD;
  v_analytics      RECORD;
BEGIN
  -- Wallet
  SELECT balance, pending_balance, total_earned
  INTO v_wallet
  FROM public.creator_wallets WHERE user_id = p_user_id;

  -- Supports (letzte 30 Tage)
  SELECT
    COUNT(*) as count,
    COALESCE(SUM(amount),0) as total
  INTO v_supports
  FROM public.creator_supports
  WHERE creator_id = p_user_id
    AND payment_status = 'completed'
    AND created_at > NOW() - INTERVAL '30 days';

  -- Bookings
  SELECT
    COUNT(*) FILTER (WHERE booking_status = 'pending')   as pending,
    COUNT(*) FILTER (WHERE booking_status = 'confirmed') as confirmed,
    COUNT(*) FILTER (WHERE booking_status = 'completed') as completed
  INTO v_bookings
  FROM public.experience_bookings WHERE creator_id = p_user_id;

  -- Work Sales (letzte 30 Tage)
  SELECT COUNT(*) as count, COALESCE(SUM(amount),0) as total
  INTO v_sales
  FROM public.work_sales
  WHERE creator_id = p_user_id
    AND payment_status = 'completed'
    AND created_at > NOW() - INTERVAL '30 days';

  -- Analytics (letzte 7 Tage)
  SELECT
    COUNT(*) FILTER (WHERE event_type = 'profile_view') as profile_views,
    COUNT(*) FILTER (WHERE event_type = 'story_view')   as story_views,
    COUNT(*) FILTER (WHERE event_type = 'work_view')    as work_views
  INTO v_analytics
  FROM public.creator_analytics
  WHERE creator_id = p_user_id
    AND created_at > NOW() - INTERVAL '7 days';

  RETURN json_build_object(
    'wallet', json_build_object(
      'balance',         COALESCE(v_wallet.balance, 0),
      'pending_balance', COALESCE(v_wallet.pending_balance, 0),
      'total_earned',    COALESCE(v_wallet.total_earned, 0)
    ),
    'supports_30d', json_build_object(
      'count', COALESCE(v_supports.count, 0),
      'total', COALESCE(v_supports.total, 0)
    ),
    'bookings', json_build_object(
      'pending',   COALESCE(v_bookings.pending, 0),
      'confirmed', COALESCE(v_bookings.confirmed, 0),
      'completed', COALESCE(v_bookings.completed, 0)
    ),
    'sales_30d', json_build_object(
      'count', COALESCE(v_sales.count, 0),
      'total', COALESCE(v_sales.total, 0)
    ),
    'analytics_7d', json_build_object(
      'profile_views', COALESCE(v_analytics.profile_views, 0),
      'story_views',   COALESCE(v_analytics.story_views, 0),
      'work_views',    COALESCE(v_analytics.work_views, 0)
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_creator_summary(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_creator_summary(UUID) TO authenticated;

-- ═══════════════════════════════════════════════════════════════════════
-- 8. RPC: process_support (Wallet nach Support updaten)
-- ═══════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.process_support(
  p_support_id UUID
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_support RECORD;
BEGIN
  SELECT * INTO v_support FROM public.creator_supports WHERE id = p_support_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Support not found'; END IF;

  -- Wallet updaten
  UPDATE public.creator_wallets
  SET
    balance       = balance + v_support.amount,
    total_earned  = total_earned + v_support.amount,
    updated_at    = NOW()
  WHERE user_id = v_support.creator_id;

  -- Support als completed markieren
  UPDATE public.creator_supports
  SET payment_status = 'completed'
  WHERE id = p_support_id;

  -- Analytics Event
  INSERT INTO public.creator_analytics (creator_id, event_type, source_type, source_id, viewer_id)
  VALUES (v_support.creator_id, 'support', v_support.source_type, v_support.source_id, v_support.supporter_id);
END;
$$;

REVOKE ALL ON FUNCTION public.process_support(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.process_support(UUID) TO service_role;

COMMENT ON FUNCTION public.get_creator_summary IS 'Dashboard-Summary in einem DB-Aufruf — Wallet + Supports + Bookings + Sales + Analytics';
COMMENT ON FUNCTION public.process_support     IS 'Service-Role only: Support completed → Wallet aktualisieren';
