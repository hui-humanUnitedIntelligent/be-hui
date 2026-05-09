-- ═══════════════════════════════════════════════════════════════════════
-- HUI CORE SYSTEM ARCHITECTURE — v5.0
-- PostgreSQL + Supabase + PostGIS + Stripe Connect
-- ═══════════════════════════════════════════════════════════════════════

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- ═══════════════════════════════════════════════════════════════════════
-- ENUMS — State Machines
-- ═══════════════════════════════════════════════════════════════════════

CREATE TYPE user_role AS ENUM (
  'basisuser', 'wirker', 'verified_wirker', 'admin', 'moderator', 'suspended'
);

CREATE TYPE content_type AS ENUM (
  'work', 'experience', 'story', 'post', 'impact_project', 'media'
);

CREATE TYPE content_state AS ENUM (
  'draft', 'published', 'archived', 'hidden', 'deleted', 'reported', 'sold', 'booked'
);

CREATE TYPE visibility AS ENUM (
  'public', 'followers', 'private', 'hidden'
);

CREATE TYPE story_type AS ENUM (
  'photo', 'video', 'work', 'experience', 'behind_scenes', 'impact'
);

CREATE TYPE story_state AS ENUM (
  'active', 'expired', 'highlighted', 'deleted'
);

CREATE TYPE booking_state AS ENUM (
  'requested', 'confirmed', 'active', 'completed', 'recommended', 'disputed', 'cancelled'
);

CREATE TYPE payment_state AS ENUM (
  'pending', 'paid', 'escrow', 'released', 'refunded', 'failed'
);

CREATE TYPE chat_state AS ENUM (
  'opened', 'active', 'closed', 'archived'
);

CREATE TYPE notification_type AS ENUM (
  'new_message', 'new_booking', 'new_order', 'story_reaction',
  'recommendation', 'impact_voting', 'payout', 'shipping_update',
  'booking_confirmed', 'booking_completed', 'work_sold', 'new_follower'
);

CREATE TYPE event_type AS ENUM (
  'work_published', 'work_sold', 'experience_published',
  'story_posted', 'story_expired',
  'booking_requested', 'booking_confirmed', 'booking_completed', 'booking_cancelled',
  'payment_received', 'payment_released', 'payment_refunded',
  'escrow_activated', 'escrow_released',
  'chat_opened', 'chat_closed',
  'recommendation_given', 'impact_vote_cast',
  'impact_pool_distributed', 'user_became_wirker',
  'report_submitted', 'user_suspended'
);

-- ═══════════════════════════════════════════════════════════════════════
-- USERS & PROFILES
-- ═══════════════════════════════════════════════════════════════════════

-- Extends Supabase auth.users
CREATE TABLE profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role            user_role NOT NULL DEFAULT 'basisuser',
  display_name    TEXT NOT NULL DEFAULT '',
  full_name       TEXT,
  avatar_url      TEXT,
  bio             TEXT,
  email           TEXT,
  phone           TEXT,
  city            TEXT,
  country         TEXT DEFAULT 'DE',
  location        GEOGRAPHY(POINT, 4326),          -- PostGIS
  locale          TEXT DEFAULT 'de',
  is_wirker       BOOLEAN NOT NULL DEFAULT FALSE,
  is_verified     BOOLEAN NOT NULL DEFAULT FALSE,
  stripe_customer_id TEXT UNIQUE,
  unread_messages INT NOT NULL DEFAULT 0,
  unread_notifications INT NOT NULL DEFAULT 0,
  follower_count  INT NOT NULL DEFAULT 0,
  following_count INT NOT NULL DEFAULT 0,
  impact_total_eur NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at    TIMESTAMPTZ,
  suspended_at    TIMESTAMPTZ,
  suspension_reason TEXT,
  CONSTRAINT display_name_length CHECK (char_length(display_name) <= 60),
  CONSTRAINT bio_length          CHECK (char_length(bio) <= 800)
);

-- Wirker-specific public profile
CREATE TABLE wirker_profiles (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  slug                TEXT NOT NULL UNIQUE,          -- behui.app/w/lea-s
  talent              TEXT NOT NULL,
  wirker_type         TEXT NOT NULL DEFAULT 'selbst', -- privat|selbst|kuenstler|firma|verein
  tagline             TEXT,
  header_img          TEXT,
  categories          TEXT[] NOT NULL DEFAULT '{}',
  skills              TEXT[] NOT NULL DEFAULT '{}',
  languages           TEXT[] NOT NULL DEFAULT '{"de"}',
  location_label      TEXT,
  location            GEOGRAPHY(POINT, 4326),
  radius_km           SMALLINT NOT NULL DEFAULT 30,
  hourly_rate         NUMERIC(8,2),
  is_available        BOOLEAN NOT NULL DEFAULT TRUE,
  available_from      DATE,
  available_until     DATE,
  stripe_account_id   TEXT UNIQUE,                   -- Stripe Connect Express
  stripe_onboarded    BOOLEAN NOT NULL DEFAULT FALSE,
  booking_count       INT NOT NULL DEFAULT 0,
  recommendation_count INT NOT NULL DEFAULT 0,
  impact_contributed_eur NUMERIC(10,2) NOT NULL DEFAULT 0,
  story_highlight_ids UUID[] DEFAULT '{}',
  last_active_at      TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_wirker_location ON wirker_profiles USING GIST (location);
CREATE INDEX idx_wirker_slug ON wirker_profiles (slug);
CREATE INDEX idx_wirker_categories ON wirker_profiles USING GIN (categories);

-- Follows
CREATE TABLE follows (
  follower_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id)
);

-- ═══════════════════════════════════════════════════════════════════════
-- CONTENT SYSTEM
-- ═══════════════════════════════════════════════════════════════════════

-- Works (Werke)
CREATE TABLE works (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  description     TEXT,
  category        TEXT,
  tags            TEXT[] DEFAULT '{}',
  price_eur       NUMERIC(8,2) NOT NULL CHECK (price_eur >= 0),
  currency        TEXT NOT NULL DEFAULT 'EUR',
  images          TEXT[] NOT NULL DEFAULT '{}',
  video_url       TEXT,
  state           content_state NOT NULL DEFAULT 'draft',
  visibility      visibility NOT NULL DEFAULT 'public',
  stock           INT,                               -- NULL = unlimited
  is_digital      BOOLEAN NOT NULL DEFAULT FALSE,
  shipping_days   SMALLINT DEFAULT 5,
  location        GEOGRAPHY(POINT, 4326),
  view_count      INT NOT NULL DEFAULT 0,
  save_count      INT NOT NULL DEFAULT 0,
  sale_count      INT NOT NULL DEFAULT 0,
  published_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT title_length CHECK (char_length(title) <= 120)
);

CREATE INDEX idx_works_user ON works (user_id);
CREATE INDEX idx_works_state ON works (state);
CREATE INDEX idx_works_category ON works (category);
CREATE INDEX idx_works_location ON works USING GIST (location);

-- Experiences
CREATE TABLE experiences (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  description     TEXT,
  category        TEXT,
  tags            TEXT[] DEFAULT '{}',
  price_per_session_eur NUMERIC(8,2) CHECK (price_per_session_eur >= 0),
  duration_min    SMALLINT,
  max_participants SMALLINT NOT NULL DEFAULT 1,
  location_type   TEXT NOT NULL DEFAULT 'on_site', -- on_site|remote|flexible
  location_label  TEXT,
  location        GEOGRAPHY(POINT, 4326),
  images          TEXT[] NOT NULL DEFAULT '{}',
  state           content_state NOT NULL DEFAULT 'draft',
  visibility      visibility NOT NULL DEFAULT 'public',
  booking_count   INT NOT NULL DEFAULT 0,
  view_count      INT NOT NULL DEFAULT 0,
  published_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_experiences_user ON experiences (user_id);
CREATE INDEX idx_experiences_location ON experiences USING GIST (location);

-- Stories (24h, Wirker only)
CREATE TABLE stories (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  story_type      story_type NOT NULL DEFAULT 'photo',
  state           story_state NOT NULL DEFAULT 'active',
  slides          JSONB NOT NULL DEFAULT '[]',       -- [{img, caption, link}]
  tag             TEXT,
  tag_color       TEXT,
  linked_work_id  UUID REFERENCES works(id),
  linked_exp_id   UUID REFERENCES experiences(id),
  linked_impact_id UUID,
  view_count      INT NOT NULL DEFAULT 0,
  save_count      INT NOT NULL DEFAULT 0,
  expires_at      TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '24 hours',
  is_highlight    BOOLEAN NOT NULL DEFAULT FALSE,
  highlight_label TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT slides_not_empty CHECK (jsonb_array_length(slides) > 0)
);

CREATE INDEX idx_stories_user ON stories (user_id);
CREATE INDEX idx_stories_state ON stories (state);
CREATE INDEX idx_stories_expires ON stories (expires_at) WHERE state = 'active';

-- Story views
CREATE TABLE story_views (
  story_id    UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  viewer_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  viewed_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (story_id, viewer_id)
);

-- Media (shared asset store)
CREATE TABLE media (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  url         TEXT NOT NULL,
  storage_path TEXT,
  media_type  TEXT NOT NULL DEFAULT 'image',   -- image|video|document
  mime_type   TEXT,
  size_bytes  BIGINT,
  width       INT,
  height      INT,
  duration_s  INT,
  entity_type TEXT,                            -- 'work'|'story'|'profile' etc.
  entity_id   UUID,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_media_user ON media (user_id);
CREATE INDEX idx_media_entity ON media (entity_type, entity_id);

-- ═══════════════════════════════════════════════════════════════════════
-- DISCOVERY SYSTEM
-- ═══════════════════════════════════════════════════════════════════════

-- Feed items (denormalized, rebuilt by triggers)
CREATE TABLE feed_items (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_type    content_type NOT NULL,
  content_id      UUID NOT NULL,
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  location        GEOGRAPHY(POINT, 4326),
  tags            TEXT[] DEFAULT '{}',
  category        TEXT,
  score           NUMERIC(8,4) NOT NULL DEFAULT 0,   -- ranking score
  is_promoted     BOOLEAN NOT NULL DEFAULT FALSE,
  published_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_feed_score ON feed_items (score DESC, published_at DESC);
CREATE INDEX idx_feed_location ON feed_items USING GIST (location);
CREATE INDEX idx_feed_type ON feed_items (content_type);
CREATE UNIQUE INDEX idx_feed_unique ON feed_items (content_type, content_id);

-- Favorites
CREATE TABLE favorites (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content_type content_type NOT NULL,
  content_id  UUID NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, content_type, content_id)
);

CREATE INDEX idx_favorites_user ON favorites (user_id);

-- Recommendations (verified post-booking/purchase)
CREATE TABLE recommendations (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id      UUID,                              -- FK set below
  order_id        UUID,
  from_user_id    UUID NOT NULL REFERENCES profiles(id),
  to_user_id      UUID NOT NULL REFERENCES profiles(id),
  text            TEXT NOT NULL CHECK (char_length(text) >= 10),
  result_images   TEXT[] DEFAULT '{}',
  is_public       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT one_source CHECK (
    (booking_id IS NOT NULL) != (order_id IS NOT NULL) OR
    (booking_id IS NULL AND order_id IS NULL)
  )
);

CREATE INDEX idx_recommendations_to ON recommendations (to_user_id);

-- ═══════════════════════════════════════════════════════════════════════
-- BOOKING SYSTEM
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE bookings (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  experience_id   UUID REFERENCES experiences(id),
  wirker_id       UUID NOT NULL REFERENCES profiles(id),
  customer_id     UUID NOT NULL REFERENCES profiles(id),
  state           booking_state NOT NULL DEFAULT 'requested',
  scheduled_at    TIMESTAMPTZ,
  duration_min    SMALLINT,
  location_label  TEXT,
  location        GEOGRAPHY(POINT, 4326),
  participants    SMALLINT NOT NULL DEFAULT 1,
  customer_note   TEXT,
  wirker_note     TEXT,
  -- Pricing (always stored in full detail)
  subtotal_eur    NUMERIC(8,2) NOT NULL CHECK (subtotal_eur >= 0),
  commission_rate NUMERIC(4,4) NOT NULL DEFAULT 0.15 CHECK (commission_rate BETWEEN 0.05 AND 0.30),
  impact_rate     NUMERIC(4,4) NOT NULL DEFAULT 0.025 CHECK (impact_rate BETWEEN 0 AND 0.10),
  total_eur       NUMERIC(8,2) NOT NULL,
  commission_eur  NUMERIC(8,2) GENERATED ALWAYS AS (subtotal_eur * commission_rate) STORED,
  impact_eur      NUMERIC(8,2) GENERATED ALWAYS AS (subtotal_eur * impact_rate) STORED,
  wirker_payout_eur NUMERIC(8,2) GENERATED ALWAYS AS (subtotal_eur * (1 - commission_rate)) STORED,
  -- Timeline
  requested_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  confirmed_at    TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  cancelled_at    TIMESTAMPTZ,
  cancellation_reason TEXT,
  -- Relations
  chat_id         UUID,                              -- FK set below
  payment_id      UUID,
  recommendation_id UUID,
  idempotency_key TEXT UNIQUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT customer_not_wirker CHECK (customer_id != wirker_id),
  CONSTRAINT total_consistent CHECK (
    ABS(total_eur - subtotal_eur - (subtotal_eur * impact_rate)) < 0.02
  )
);

CREATE INDEX idx_bookings_wirker ON bookings (wirker_id, state);
CREATE INDEX idx_bookings_customer ON bookings (customer_id, state);
CREATE INDEX idx_bookings_state ON bookings (state);

-- Booking state audit log
CREATE TABLE booking_events (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id  UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  from_state  booking_state,
  to_state    booking_state NOT NULL,
  actor_id    UUID REFERENCES profiles(id),
  note        TEXT,
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_booking_events_booking ON booking_events (booking_id, created_at);

-- Availability (Wirker calendar)
CREATE TABLE availability (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wirker_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date        DATE NOT NULL,
  start_time  TIME NOT NULL,
  end_time    TIME NOT NULL,
  is_blocked  BOOLEAN NOT NULL DEFAULT FALSE,
  booking_id  UUID REFERENCES bookings(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (wirker_id, date, start_time),
  CONSTRAINT end_after_start CHECK (end_time > start_time)
);

CREATE INDEX idx_availability_wirker ON availability (wirker_id, date);

-- ═══════════════════════════════════════════════════════════════════════
-- PAYMENT SYSTEM (Stripe Connect)
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE payments (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stripe_payment_intent_id TEXT UNIQUE,
  stripe_session_id   TEXT UNIQUE,
  booking_id          UUID REFERENCES bookings(id),
  order_id            UUID,                          -- FK set below
  payer_id            UUID NOT NULL REFERENCES profiles(id),
  recipient_id        UUID REFERENCES profiles(id),
  amount_eur          NUMERIC(8,2) NOT NULL CHECK (amount_eur > 0),
  commission_eur      NUMERIC(8,2) NOT NULL DEFAULT 0,
  impact_eur          NUMERIC(8,2) NOT NULL DEFAULT 0,
  payout_eur          NUMERIC(8,2) NOT NULL DEFAULT 0,
  state               payment_state NOT NULL DEFAULT 'pending',
  stripe_transfer_id  TEXT,
  stripe_refund_id    TEXT,
  idempotency_key     TEXT UNIQUE,
  metadata            JSONB DEFAULT '{}',
  paid_at             TIMESTAMPTZ,
  released_at         TIMESTAMPTZ,
  refunded_at         TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Escrow (holds between payment and release)
CREATE TABLE escrow (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_id  UUID NOT NULL UNIQUE REFERENCES payments(id),
  booking_id  UUID REFERENCES bookings(id),
  order_id    UUID,
  amount_eur  NUMERIC(8,2) NOT NULL,
  state       TEXT NOT NULL DEFAULT 'holding' CHECK (state IN ('holding','released','refunded','disputed')),
  activated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  released_at TIMESTAMPTZ,
  release_trigger TEXT,                            -- 'recommendation'|'timeout'|'admin'
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Payouts to Wirker
CREATE TABLE payouts (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wirker_id           UUID NOT NULL REFERENCES profiles(id),
  payment_id          UUID REFERENCES payments(id),
  amount_eur          NUMERIC(8,2) NOT NULL,
  stripe_transfer_id  TEXT UNIQUE,
  state               TEXT NOT NULL DEFAULT 'pending' CHECK (state IN ('pending','sent','failed')),
  sent_at             TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Orders (Werk purchases)
CREATE TABLE orders (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id     UUID NOT NULL REFERENCES profiles(id),
  state           TEXT NOT NULL DEFAULT 'pending'
    CHECK (state IN ('pending','paid','shipped','delivered','completed','refunded','cancelled')),
  total_eur       NUMERIC(8,2) NOT NULL CHECK (total_eur > 0),
  commission_eur  NUMERIC(8,2) NOT NULL DEFAULT 0,
  impact_eur      NUMERIC(8,2) NOT NULL DEFAULT 0,
  shipping_name   TEXT,
  shipping_address JSONB,
  shipping_carrier TEXT,
  tracking_number TEXT,
  shipped_at      TIMESTAMPTZ,
  delivered_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Order line items
CREATE TABLE order_items (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id    UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  work_id     UUID NOT NULL REFERENCES works(id),
  seller_id   UUID NOT NULL REFERENCES profiles(id),
  quantity    SMALLINT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price_eur NUMERIC(8,2) NOT NULL CHECK (unit_price_eur >= 0),
  total_eur   NUMERIC(8,2) GENERATED ALWAYS AS (quantity * unit_price_eur) STORED
);

-- Wire FK on orders
ALTER TABLE payments ADD CONSTRAINT fk_payment_order
  FOREIGN KEY (order_id) REFERENCES orders(id);

-- ═══════════════════════════════════════════════════════════════════════
-- IMPACT SYSTEM
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE impact_projects (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT NOT NULL,
  slug            TEXT UNIQUE,
  description     TEXT,
  category        TEXT,
  tags            TEXT[] DEFAULT '{}',
  icon            TEXT DEFAULT '🌱',
  color           TEXT DEFAULT '#3DB87A',
  website         TEXT,
  contact_name    TEXT,
  contact_email   TEXT,
  status          TEXT NOT NULL DEFAULT 'candidate'
    CHECK (status IN ('candidate','active','voting','winner','completed','archived')),
  month           TEXT,                            -- 'YYYY-MM' for monthly cycle
  votes           INT NOT NULL DEFAULT 0,
  awarded_eur     NUMERIC(8,2) DEFAULT 0,
  impact_report   TEXT,
  distributed_at  TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Monthly impact pool
CREATE TABLE impact_pool (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  month       TEXT NOT NULL UNIQUE,               -- 'YYYY-MM'
  total_eur   NUMERIC(10,2) NOT NULL DEFAULT 0,
  distributed_eur NUMERIC(10,2) NOT NULL DEFAULT 0,
  state       TEXT NOT NULL DEFAULT 'accumulating'
    CHECK (state IN ('accumulating','voting','distributed')),
  voting_ends_at TIMESTAMPTZ,
  distributed_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Individual impact transactions
CREATE TABLE impact_transactions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_id      UUID REFERENCES payments(id),
  pool_month      TEXT NOT NULL,
  amount_eur      NUMERIC(8,2) NOT NULL CHECK (amount_eur > 0),
  source_type     TEXT NOT NULL CHECK (source_type IN ('booking','order','donation')),
  project_id      UUID REFERENCES impact_projects(id),  -- set when distributed
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Votes on projects (Wirker=2, Kunden=1)
CREATE TABLE impact_votes (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  voter_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  project_id      UUID NOT NULL REFERENCES impact_projects(id) ON DELETE CASCADE,
  pool_month      TEXT NOT NULL,
  weight          SMALLINT NOT NULL DEFAULT 1 CHECK (weight IN (1, 2)),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (voter_id, pool_month)                   -- one vote per month per user
);

CREATE INDEX idx_impact_votes_project ON impact_votes (project_id, pool_month);

-- ═══════════════════════════════════════════════════════════════════════
-- COMMUNICATION SYSTEM
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE chats (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id      UUID UNIQUE REFERENCES bookings(id),
  order_id        UUID UNIQUE REFERENCES orders(id),
  participant_ids UUID[] NOT NULL,
  state           chat_state NOT NULL DEFAULT 'opened',
  last_message_at TIMESTAMPTZ,
  last_message    TEXT,
  unread_counts   JSONB DEFAULT '{}',             -- {user_id: count}
  opened_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at       TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT participants_count CHECK (array_length(participant_ids, 1) = 2)
);

CREATE INDEX idx_chats_participants ON chats USING GIN (participant_ids);
CREATE INDEX idx_chats_booking ON chats (booking_id);

-- Wire FK chat→booking
ALTER TABLE bookings ADD CONSTRAINT fk_booking_chat
  FOREIGN KEY (chat_id) REFERENCES chats(id);

CREATE TABLE messages (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_id     UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  sender_id   UUID NOT NULL REFERENCES profiles(id),
  text        TEXT,
  media_urls  TEXT[] DEFAULT '{}',
  message_type TEXT NOT NULL DEFAULT 'text'
    CHECK (message_type IN ('text','image','video','system','booking_update')),
  is_read     BOOLEAN NOT NULL DEFAULT FALSE,
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messages_chat ON messages (chat_id, created_at);

-- Notifications
CREATE TABLE notifications (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type            notification_type NOT NULL,
  title           TEXT NOT NULL,
  body            TEXT,
  data            JSONB DEFAULT '{}',
  is_read         BOOLEAN NOT NULL DEFAULT FALSE,
  action_url      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications (user_id, is_read, created_at DESC);

-- ═══════════════════════════════════════════════════════════════════════
-- SYSTEM / MODERATION
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE audit_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id    UUID REFERENCES profiles(id),
  event_type  event_type NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id   UUID NOT NULL,
  before_data JSONB,
  after_data  JSONB,
  ip_address  INET,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_entity ON audit_logs (entity_type, entity_id);
CREATE INDEX idx_audit_logs_actor ON audit_logs (actor_id, created_at DESC);

CREATE TABLE reports (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id     UUID NOT NULL REFERENCES profiles(id),
  content_type    content_type,
  content_id      UUID,
  reported_user_id UUID REFERENCES profiles(id),
  reason          TEXT NOT NULL,
  details         TEXT,
  state           TEXT NOT NULL DEFAULT 'open'
    CHECK (state IN ('open','reviewing','resolved','dismissed')),
  resolved_by     UUID REFERENCES profiles(id),
  resolution_note TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at     TIMESTAMPTZ
);

CREATE TABLE webhook_events (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source          TEXT NOT NULL DEFAULT 'stripe',
  event_id        TEXT NOT NULL UNIQUE,            -- stripe event id for dedup
  event_type      TEXT NOT NULL,
  payload         JSONB NOT NULL,
  processed       BOOLEAN NOT NULL DEFAULT FALSE,
  error           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at    TIMESTAMPTZ
);

CREATE INDEX idx_webhook_events_processed ON webhook_events (processed, created_at);

-- ═══════════════════════════════════════════════════════════════════════
-- TRIGGERS & AUTOMATION
-- ═══════════════════════════════════════════════════════════════════════

-- 1. Auto-update updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DO $$ DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['profiles','wirker_profiles','works','experiences',
    'bookings','payments','orders','impact_projects'] LOOP
    EXECUTE format('CREATE TRIGGER trg_%s_updated_at
      BEFORE UPDATE ON %s
      FOR EACH ROW EXECUTE FUNCTION set_updated_at()', t, t);
  END LOOP;
END $$;

-- 2. When booking confirmed → open chat + activate escrow
CREATE OR REPLACE FUNCTION booking_confirmed_flow()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_chat_id UUID;
BEGIN
  IF OLD.state <> 'confirmed' AND NEW.state = 'confirmed' THEN
    -- Create chat
    INSERT INTO chats (booking_id, participant_ids, state)
    VALUES (NEW.id, ARRAY[NEW.customer_id, NEW.wirker_id], 'opened')
    RETURNING id INTO v_chat_id;

    UPDATE bookings SET chat_id = v_chat_id, confirmed_at = NOW()
    WHERE id = NEW.id;

    -- System message
    INSERT INTO messages (chat_id, sender_id, text, message_type)
    VALUES (v_chat_id, NEW.wirker_id,
      'Buchung bestätigt. Euer gemeinsamer Kanal ist jetzt offen. 🎉',
      'system');

    -- Activate escrow if payment exists
    INSERT INTO escrow (payment_id, booking_id, amount_eur, state)
    SELECT p.id, NEW.id, p.amount_eur, 'holding'
    FROM payments p WHERE p.booking_id = NEW.id AND p.state = 'paid'
    ON CONFLICT DO NOTHING;

    -- Audit
    INSERT INTO audit_logs (actor_id, event_type, entity_type, entity_id, after_data)
    VALUES (NEW.wirker_id, 'booking_confirmed', 'booking', NEW.id,
      jsonb_build_object('booking_id', NEW.id, 'chat_id', v_chat_id));

    -- Notify customer
    INSERT INTO notifications (user_id, type, title, body, data)
    VALUES (NEW.customer_id, 'booking_confirmed',
      'Buchung bestätigt ✓',
      'Deine Buchung wurde bestätigt. Der Chat ist jetzt offen.',
      jsonb_build_object('booking_id', NEW.id, 'chat_id', v_chat_id));
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_booking_confirmed
AFTER UPDATE OF state ON bookings
FOR EACH ROW EXECUTE FUNCTION booking_confirmed_flow();

-- 3. When booking completed + recommendation → release escrow → payout
CREATE OR REPLACE FUNCTION booking_recommended_flow()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF OLD.state <> 'recommended' AND NEW.state = 'recommended' THEN
    -- Release escrow
    UPDATE escrow SET state = 'released', released_at = NOW(),
      release_trigger = 'recommendation'
    WHERE booking_id = NEW.id AND state = 'holding';

    -- Mark payment released
    UPDATE payments SET state = 'released', released_at = NOW()
    WHERE booking_id = NEW.id AND state IN ('paid','escrow');

    -- Create payout
    INSERT INTO payouts (wirker_id, payment_id, amount_eur, state)
    SELECT NEW.wirker_id, p.id, p.payout_eur, 'pending'
    FROM payments p WHERE p.booking_id = NEW.id AND p.state = 'released';

    -- Close chat
    UPDATE chats SET state = 'closed', closed_at = NOW()
    WHERE booking_id = NEW.id AND state IN ('opened','active');

    -- Book impact transaction
    INSERT INTO impact_transactions (payment_id, pool_month, amount_eur, source_type)
    SELECT p.id, TO_CHAR(NOW(), 'YYYY-MM'), p.impact_eur, 'booking'
    FROM payments p WHERE p.booking_id = NEW.id;

    -- Update pool
    INSERT INTO impact_pool (month, total_eur, state)
    VALUES (TO_CHAR(NOW(), 'YYYY-MM'),
      (SELECT COALESCE(SUM(p.impact_eur),0) FROM payments p
       JOIN bookings b ON p.booking_id = b.id
       WHERE b.wirker_id = NEW.wirker_id AND p.released_at >= DATE_TRUNC('month', NOW())),
      'accumulating')
    ON CONFLICT (month) DO UPDATE
    SET total_eur = impact_pool.total_eur + EXCLUDED.total_eur;

    -- Notify wirker
    INSERT INTO notifications (user_id, type, title, body, data)
    VALUES (NEW.wirker_id, 'payout',
      'Auszahlung unterwegs 💚',
      'Empfehlung erhalten. Deine Auszahlung wird verarbeitet.',
      jsonb_build_object('booking_id', NEW.id));

    -- Update wirker booking count
    UPDATE wirker_profiles SET booking_count = booking_count + 1,
      recommendation_count = recommendation_count + 1
    WHERE user_id = NEW.wirker_id;

    -- Audit
    INSERT INTO audit_logs (event_type, entity_type, entity_id)
    VALUES ('payment_released', 'booking', NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_booking_recommended
AFTER UPDATE OF state ON bookings
FOR EACH ROW EXECUTE FUNCTION booking_recommended_flow();

-- 4. Work published → inject into feed
CREATE OR REPLACE FUNCTION work_published_to_feed()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.state = 'published' AND (OLD.state IS DISTINCT FROM 'published') THEN
    INSERT INTO feed_items (content_type, content_id, user_id, location,
      tags, category, score, published_at)
    VALUES ('work', NEW.id, NEW.user_id, NEW.location,
      NEW.tags, NEW.category, 1.0, NOW())
    ON CONFLICT (content_type, content_id) DO UPDATE
    SET score = 1.0, published_at = NOW();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_work_to_feed
AFTER INSERT OR UPDATE OF state ON works
FOR EACH ROW EXECUTE FUNCTION work_published_to_feed();

-- 5. Story posted → inject into feed (expires in 24h)
CREATE OR REPLACE FUNCTION story_to_feed()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO feed_items (content_type, content_id, user_id,
      tags, score, published_at, expires_at)
    VALUES ('story', NEW.id, NEW.user_id,
      CASE WHEN NEW.tag IS NOT NULL THEN ARRAY[NEW.tag] ELSE '{}' END,
      1.5, NOW(), NEW.expires_at)
    ON CONFLICT (content_type, content_id) DO NOTHING;
  ELSIF TG_OP = 'UPDATE' AND NEW.state IN ('expired','deleted') THEN
    DELETE FROM feed_items WHERE content_type = 'story' AND content_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_story_to_feed
AFTER INSERT OR UPDATE OF state ON stories
FOR EACH ROW EXECUTE FUNCTION story_to_feed();

-- 6. Auto-expire stories
CREATE OR REPLACE FUNCTION expire_stories()
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE stories SET state = 'expired'
  WHERE state = 'active' AND expires_at < NOW();
END;
$$;
-- (Call via pg_cron: SELECT cron.schedule('expire-stories', '*/15 * * * *', 'SELECT expire_stories()'))

-- 7. Impact vote → update project vote count
CREATE OR REPLACE FUNCTION impact_vote_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE impact_projects
  SET votes = votes + NEW.weight
  WHERE id = NEW.project_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_impact_vote
AFTER INSERT ON impact_votes
FOR EACH ROW EXECUTE FUNCTION impact_vote_count();

-- 8. Recommendation given → update wirker public profile
CREATE OR REPLACE FUNCTION recommendation_to_wirker()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE wirker_profiles
  SET recommendation_count = recommendation_count + 1
  WHERE user_id = NEW.to_user_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_recommendation_to_wirker
AFTER INSERT ON recommendations
FOR EACH ROW EXECUTE FUNCTION recommendation_to_wirker();

-- 9. New unread message → increment counter
CREATE OR REPLACE FUNCTION message_unread_counter()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_other_id UUID;
BEGIN
  SELECT unnest INTO v_other_id
  FROM (SELECT unnest(participant_ids) FROM chats WHERE id = NEW.chat_id) t
  WHERE unnest <> NEW.sender_id LIMIT 1;

  UPDATE profiles SET unread_messages = unread_messages + 1
  WHERE id = v_other_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_message_unread
AFTER INSERT ON messages
FOR EACH ROW WHEN (NEW.message_type <> 'system')
EXECUTE FUNCTION message_unread_counter();

-- ═══════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS)
-- ═══════════════════════════════════════════════════════════════════════

ALTER TABLE profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE wirker_profiles   ENABLE ROW LEVEL SECURITY;
ALTER TABLE works             ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiences       ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories           ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_views       ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites         ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendations   ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings          ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_events    ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability      ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments          ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders            ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items       ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats             ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages          ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications     ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows           ENABLE ROW LEVEL SECURITY;
ALTER TABLE impact_votes      ENABLE ROW LEVEL SECURITY;

-- Profiles: public read for wirker, private for own
CREATE POLICY "profiles_public_read" ON profiles FOR SELECT USING (TRUE);
CREATE POLICY "profiles_own_update"  ON profiles FOR UPDATE USING (auth.uid() = id);

-- Wirker profiles: public
CREATE POLICY "wirker_profiles_public" ON wirker_profiles FOR SELECT USING (TRUE);
CREATE POLICY "wirker_profiles_own"    ON wirker_profiles FOR ALL USING (auth.uid() = user_id);

-- Works: published = public, own = full access
CREATE POLICY "works_public_read" ON works FOR SELECT
  USING (state = 'published' AND visibility = 'public');
CREATE POLICY "works_own_all"     ON works FOR ALL USING (auth.uid() = user_id);

-- Stories: active = public, own = full access
CREATE POLICY "stories_active_public" ON stories FOR SELECT
  USING (state = 'active' AND (SELECT visibility FROM profiles WHERE id = stories.user_id) = 'public');
CREATE POLICY "stories_own_all" ON stories FOR ALL USING (auth.uid() = user_id);

-- Bookings: own (customer or wirker)
CREATE POLICY "bookings_own" ON bookings FOR ALL
  USING (auth.uid() IN (customer_id, wirker_id));

-- Chats + Messages: participants only
CREATE POLICY "chats_participants" ON chats FOR ALL
  USING (auth.uid() = ANY(participant_ids));
CREATE POLICY "messages_participants" ON messages FOR ALL
  USING (EXISTS (SELECT 1 FROM chats c WHERE c.id = messages.chat_id AND auth.uid() = ANY(c.participant_ids)));

-- Notifications: own only
CREATE POLICY "notifications_own" ON notifications FOR ALL USING (auth.uid() = user_id);

-- Favorites: own only
CREATE POLICY "favorites_own" ON favorites FOR ALL USING (auth.uid() = user_id);

-- Payments: payer or recipient
CREATE POLICY "payments_own" ON payments FOR SELECT
  USING (auth.uid() IN (payer_id, recipient_id));

-- Impact votes: own write, all read
CREATE POLICY "impact_votes_read"  ON impact_votes FOR SELECT USING (TRUE);
CREATE POLICY "impact_votes_write" ON impact_votes FOR INSERT WITH CHECK (auth.uid() = voter_id);

-- Feed items: public
CREATE POLICY "feed_items_public" ON feed_items FOR SELECT USING (TRUE);

-- ═══════════════════════════════════════════════════════════════════════
-- REALTIME SUBSCRIPTIONS (enable via Supabase dashboard)
-- ═══════════════════════════════════════════════════════════════════════
-- Enable realtime on: messages, notifications, bookings, stories, chats
-- ALTER PUBLICATION supabase_realtime ADD TABLE messages;
-- ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
-- ALTER PUBLICATION supabase_realtime ADD TABLE bookings;
-- ALTER PUBLICATION supabase_realtime ADD TABLE stories;
-- ALTER PUBLICATION supabase_realtime ADD TABLE chats;

-- ═══════════════════════════════════════════════════════════════════════
-- SEED: Default impact pool month
-- ═══════════════════════════════════════════════════════════════════════
INSERT INTO impact_pool (month, total_eur, state)
VALUES (TO_CHAR(NOW(), 'YYYY-MM'), 0, 'accumulating')
ON CONFLICT (month) DO NOTHING;

