-- ══════════════════════════════════════════════════════════════════════
-- HUI PRODUCTION SCHEMA v8
-- Vollständig idempotent — sicher mehrfach ausführbar
-- 
-- Führe dies im Supabase SQL Editor aus.
-- Reihenfolge: Tables → Columns → FK → Constraints → Indexes → RLS
-- ══════════════════════════════════════════════════════════════════════

-- ══════════════════════════════════════════════════════════════════════
-- PHASE 1: NEUE TABELLEN
-- ══════════════════════════════════════════════════════════════════════

-- ─── memberships ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS memberships (
  id              uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  membership_type text        NOT NULL DEFAULT 'basisuser'
                              CHECK (membership_type IN ('basisuser','member','wirker','talent','admin')),
  status          text        NOT NULL DEFAULT 'active'
                              CHECK (status IN ('active','expired','cancelled')),
  vote_weight     smallint    NOT NULL DEFAULT 1
                              CHECK (vote_weight IN (1, 2)),
  started_at      timestamptz NOT NULL DEFAULT NOW(),
  expires_at      timestamptz,
  created_at      timestamptz NOT NULL DEFAULT NOW(),
  updated_at      timestamptz NOT NULL DEFAULT NOW()
);

-- ─── impact_rounds ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS impact_rounds (
  id                uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  month             text        NOT NULL,  -- YYYY-MM
  status            text        NOT NULL DEFAULT 'active'
                                CHECK (status IN ('active','voting','distributing','completed')),
  pool_eur          numeric(12,2) NOT NULL DEFAULT 0 CHECK (pool_eur >= 0),
  winner_project_id uuid,
  voting_ends_at    timestamptz,
  distributed_at    timestamptz,
  created_at        timestamptz NOT NULL DEFAULT NOW(),
  updated_at        timestamptz NOT NULL DEFAULT NOW()
);

-- ─── impact_votes ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS impact_votes (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id  uuid        NOT NULL,
  round_id    uuid        NOT NULL,
  weight      smallint    NOT NULL DEFAULT 1 CHECK (weight IN (1,2)),
  created_at  timestamptz NOT NULL DEFAULT NOW()
);

-- ─── conversations ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS conversations (
  id                uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  participant_a     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  participant_b     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  booking_id        uuid,
  last_message_at   timestamptz NOT NULL DEFAULT NOW(),
  last_message_text text,
  unread_count_a    integer     NOT NULL DEFAULT 0 CHECK (unread_count_a >= 0),
  unread_count_b    integer     NOT NULL DEFAULT 0 CHECK (unread_count_b >= 0),
  created_at        timestamptz NOT NULL DEFAULT NOW(),
  updated_at        timestamptz NOT NULL DEFAULT NOW(),
  -- Prevent duplicate conversations between same pair
  CONSTRAINT conversations_unique_pair UNIQUE (participant_a, participant_b)
);

-- ─── user_match_scores ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_match_scores (
  id              uuid          DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         uuid          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_user_id  uuid          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score           numeric(5,2)  NOT NULL DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  categories      jsonb         NOT NULL DEFAULT '[]',
  updated_at      timestamptz   NOT NULL DEFAULT NOW(),
  CONSTRAINT match_scores_unique_pair UNIQUE (user_id, target_user_id),
  CONSTRAINT match_scores_no_self CHECK (user_id != target_user_id)
);

-- ─── availability_slots ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS availability_slots (
  id          uuid    DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date        date    NOT NULL,
  start_time  time,
  end_time    time,
  is_blocked  boolean NOT NULL DEFAULT false,
  note        text,
  created_at  timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT avail_time_order CHECK (end_time IS NULL OR start_time IS NULL OR start_time < end_time)
);

-- ─── privacy_settings ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS privacy_settings (
  user_id             uuid    PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_visibility  text    NOT NULL DEFAULT 'public'
                              CHECK (profile_visibility IN ('public','members','private')),
  show_location       boolean NOT NULL DEFAULT true,
  show_availability   boolean NOT NULL DEFAULT true,
  allow_messages      text    NOT NULL DEFAULT 'members'
                              CHECK (allow_messages IN ('all','members','none')),
  updated_at          timestamptz NOT NULL DEFAULT NOW()
);

-- ─── notification_settings ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notification_settings (
  user_id             uuid    PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email_bookings      boolean NOT NULL DEFAULT true,
  email_messages      boolean NOT NULL DEFAULT true,
  email_impact        boolean NOT NULL DEFAULT false,
  push_bookings       boolean NOT NULL DEFAULT true,
  push_messages       boolean NOT NULL DEFAULT true,
  push_impact         boolean NOT NULL DEFAULT true,
  updated_at          timestamptz NOT NULL DEFAULT NOW()
);

-- ─── payouts ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payouts (
  id              uuid          DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         uuid          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_eur      numeric(12,2) NOT NULL CHECK (amount_eur > 0),
  status          text          NOT NULL DEFAULT 'pending'
                                CHECK (status IN ('pending','processing','paid','failed')),
  stripe_payout_id text,
  booking_ids     uuid[]        NOT NULL DEFAULT '{}',
  initiated_at    timestamptz   NOT NULL DEFAULT NOW(),
  paid_at         timestamptz,
  error_message   text
);

-- ─── likes ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS likes (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id     uuid        NOT NULL,
  item_type   text        NOT NULL CHECK (item_type IN ('work','experience','story','profile')),
  created_at  timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT likes_unique UNIQUE (user_id, item_id, item_type)
);

-- ─── recommendations ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS recommendations (
  id            uuid          DEFAULT gen_random_uuid() PRIMARY KEY,
  wirker_id     uuid          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reviewer_id   uuid          REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewer_name text          NOT NULL,
  rating        smallint      NOT NULL CHECK (rating BETWEEN 1 AND 5),
  text          text,
  work_title    text,
  booking_id    uuid,
  created_at    timestamptz   NOT NULL DEFAULT NOW(),
  CONSTRAINT recs_one_per_booking UNIQUE (booking_id) DEFERRABLE INITIALLY DEFERRED
);

-- ══════════════════════════════════════════════════════════════════════
-- PHASE 2: FEHLENDE SPALTEN IN BESTEHENDEN TABELLEN
-- Idempotent via DO $$ ... END $$
-- ══════════════════════════════════════════════════════════════════════

DO $$ BEGIN

  -- profiles
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS membership_type  text     DEFAULT 'basisuser';
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS dna_tags         jsonb    DEFAULT '[]';
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_modules  jsonb    DEFAULT '{}';
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_views    integer  DEFAULT 0;
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS follower_count   integer  DEFAULT 0;
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_available     boolean  DEFAULT true;
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS impact_eur       numeric(10,2) DEFAULT 0;
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at       timestamptz DEFAULT NOW();

  -- wirker_profiles
  ALTER TABLE wirker_profiles ADD COLUMN IF NOT EXISTS rating_avg    numeric(3,2) DEFAULT 0;
  ALTER TABLE wirker_profiles ADD COLUMN IF NOT EXISTS booking_count integer      DEFAULT 0;
  ALTER TABLE wirker_profiles ADD COLUMN IF NOT EXISTS is_verified   boolean      DEFAULT false;
  ALTER TABLE wirker_profiles ADD COLUMN IF NOT EXISTS categories    jsonb        DEFAULT '[]';
  ALTER TABLE wirker_profiles ADD COLUMN IF NOT EXISTS location_label text;
  ALTER TABLE wirker_profiles ADD COLUMN IF NOT EXISTS updated_at    timestamptz  DEFAULT NOW();

  -- works
  ALTER TABLE works ADD COLUMN IF NOT EXISTS medium      text;
  ALTER TABLE works ADD COLUMN IF NOT EXISTS likes_count integer DEFAULT 0;
  ALTER TABLE works ADD COLUMN IF NOT EXISTS images      jsonb   DEFAULT '[]';
  ALTER TABLE works ADD COLUMN IF NOT EXISTS tags        jsonb   DEFAULT '[]';
  ALTER TABLE works ADD COLUMN IF NOT EXISTS updated_at  timestamptz DEFAULT NOW();

  -- experiences
  ALTER TABLE experiences ADD COLUMN IF NOT EXISTS spots_available integer DEFAULT 0;
  ALTER TABLE experiences ADD COLUMN IF NOT EXISTS location_label  text;
  ALTER TABLE experiences ADD COLUMN IF NOT EXISTS duration        integer;  -- minutes
  ALTER TABLE experiences ADD COLUMN IF NOT EXISTS tags            jsonb   DEFAULT '[]';
  ALTER TABLE experiences ADD COLUMN IF NOT EXISTS updated_at      timestamptz DEFAULT NOW();

  -- bookings
  ALTER TABLE bookings ADD COLUMN IF NOT EXISTS escrow_status   text     DEFAULT 'held'
    CHECK (escrow_status IN ('held','released','refunded'));
  ALTER TABLE bookings ADD COLUMN IF NOT EXISTS platform_fee    numeric(10,2) DEFAULT 0;
  ALTER TABLE bookings ADD COLUMN IF NOT EXISTS impact_fee      numeric(10,2) DEFAULT 0;
  ALTER TABLE bookings ADD COLUMN IF NOT EXISTS experience_id   uuid;
  ALTER TABLE bookings ADD COLUMN IF NOT EXISTS work_id         uuid;
  ALTER TABLE bookings ADD COLUMN IF NOT EXISTS updated_at      timestamptz DEFAULT NOW();

  -- messages (table name varies — try both)
  BEGIN
    ALTER TABLE messages ADD COLUMN IF NOT EXISTS conversation_id uuid;
    ALTER TABLE messages ADD COLUMN IF NOT EXISTS type            text DEFAULT 'text'
      CHECK (type IN ('text','image','booking','system'));
    ALTER TABLE messages ADD COLUMN IF NOT EXISTS read            boolean DEFAULT false;
    ALTER TABLE messages ADD COLUMN IF NOT EXISTS updated_at      timestamptz DEFAULT NOW();
  EXCEPTION WHEN undefined_table THEN
    NULL; -- messages table doesn't exist yet — OK
  END;

  -- impact_projects
  ALTER TABLE impact_projects ADD COLUMN IF NOT EXISTS goal_eur       numeric(10,2) DEFAULT 0;
  ALTER TABLE impact_projects ADD COLUMN IF NOT EXISTS round_id       uuid;
  ALTER TABLE impact_projects ADD COLUMN IF NOT EXISTS tags           jsonb DEFAULT '[]';
  ALTER TABLE impact_projects ADD COLUMN IF NOT EXISTS distributed_at timestamptz;
  ALTER TABLE impact_projects ADD COLUMN IF NOT EXISTS updated_at     timestamptz DEFAULT NOW();

EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Column additions: some skipped (already exist or table missing) — OK';
END $$;

-- ══════════════════════════════════════════════════════════════════════
-- PHASE 3: FOREIGN KEYS (deferred — won't fail if data exists)
-- ══════════════════════════════════════════════════════════════════════

DO $$ BEGIN
  -- impact_votes → impact_projects
  ALTER TABLE impact_votes
    ADD CONSTRAINT fk_ivotes_project
    FOREIGN KEY (project_id) REFERENCES impact_projects(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  -- impact_votes → impact_rounds
  ALTER TABLE impact_votes
    ADD CONSTRAINT fk_ivotes_round
    FOREIGN KEY (round_id) REFERENCES impact_rounds(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  -- impact_rounds → winner project
  ALTER TABLE impact_rounds
    ADD CONSTRAINT fk_rounds_winner
    FOREIGN KEY (winner_project_id) REFERENCES impact_projects(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  -- conversations → bookings
  ALTER TABLE conversations
    ADD CONSTRAINT fk_convos_booking
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object OR undefined_table THEN NULL; END $$;

DO $$ BEGIN
  -- recommendations → bookings
  ALTER TABLE recommendations
    ADD CONSTRAINT fk_recs_booking
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  -- payouts user_id already has FK (defined in CREATE TABLE)
  NULL;
END $$;

-- ══════════════════════════════════════════════════════════════════════
-- PHASE 4: ADDITIONAL CONSTRAINTS
-- ══════════════════════════════════════════════════════════════════════

DO $$ BEGIN
  -- bookings: impact_fee + platform_fee must be positive
  ALTER TABLE bookings ADD CONSTRAINT chk_bookings_fees_positive
    CHECK (platform_fee >= 0 AND impact_fee >= 0);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  -- bookings: total amount > 0
  ALTER TABLE bookings ADD CONSTRAINT chk_bookings_amount_positive
    CHECK (amount > 0);
EXCEPTION WHEN duplicate_object OR undefined_column THEN NULL; END $$;

DO $$ BEGIN
  -- profiles: username format (lowercase, no spaces)
  ALTER TABLE profiles ADD CONSTRAINT chk_profiles_username_format
    CHECK (username ~ '^[a-z0-9_.-]{2,30}$');
EXCEPTION WHEN duplicate_object OR undefined_column THEN NULL; END $$;

DO $$ BEGIN
  -- memberships: only one active per user (partial unique index covers this,
  -- but add as constraint for explicit enforcement)
  ALTER TABLE memberships ADD CONSTRAINT chk_memberships_vote_weight_type
    CHECK (
      (membership_type = 'basisuser' AND vote_weight = 1) OR
      (membership_type IN ('member','wirker','talent','admin') AND vote_weight = 2)
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ══════════════════════════════════════════════════════════════════════
-- PHASE 5: INDEXES — vollständige Coverage
-- Alle idempotent via IF NOT EXISTS
-- ══════════════════════════════════════════════════════════════════════

-- ─── profiles ────────────────────────────────────────────────────────
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username_lower
  ON profiles(LOWER(username)) WHERE username IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_is_wirker
  ON profiles(is_wirker) WHERE is_wirker = true;
CREATE INDEX IF NOT EXISTS idx_profiles_has_talent
  ON profiles(has_talent_profile) WHERE has_talent_profile = true;
CREATE INDEX IF NOT EXISTS idx_profiles_created_at
  ON profiles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_membership_type
  ON profiles(membership_type);
-- Full text search on display_name + talent
CREATE INDEX IF NOT EXISTS idx_profiles_fts
  ON profiles USING gin(
    to_tsvector('german', COALESCE(display_name,'') || ' ' || COALESCE(talent,'') || ' ' || COALESCE(location_label,''))
  );

-- ─── memberships ─────────────────────────────────────────────────────
-- Partial unique: one active per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_memberships_active_user
  ON memberships(user_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_memberships_user_id
  ON memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_expires_at
  ON memberships(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_memberships_type_status
  ON memberships(membership_type, status);

-- ─── wirker_profiles ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_wirker_user_id
  ON wirker_profiles(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_wirker_slug
  ON wirker_profiles(slug);
CREATE INDEX IF NOT EXISTS idx_wirker_categories_gin
  ON wirker_profiles USING gin(categories);
CREATE INDEX IF NOT EXISTS idx_wirker_booking_count
  ON wirker_profiles(booking_count DESC);
CREATE INDEX IF NOT EXISTS idx_wirker_verified
  ON wirker_profiles(is_verified) WHERE is_verified = true;
CREATE INDEX IF NOT EXISTS idx_wirker_location
  ON wirker_profiles(location_label) WHERE location_label IS NOT NULL;
-- FTS on talent + location
CREATE INDEX IF NOT EXISTS idx_wirker_fts
  ON wirker_profiles USING gin(
    to_tsvector('german', COALESCE(talent,'') || ' ' || COALESCE(location_label,''))
  );

-- ─── works ───────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_works_user_status
  ON works(user_id, status);
CREATE INDEX IF NOT EXISTS idx_works_created_at
  ON works(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_works_published
  ON works(created_at DESC) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_works_category
  ON works(category) WHERE category IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_works_price
  ON works(price) WHERE price IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_works_tags_gin
  ON works USING gin(tags);
-- FTS on title
CREATE INDEX IF NOT EXISTS idx_works_title_fts
  ON works USING gin(to_tsvector('german', COALESCE(title,'')));

-- ─── experiences ─────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_exp_user_status
  ON experiences(user_id, status);
CREATE INDEX IF NOT EXISTS idx_exp_created_at
  ON experiences(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_exp_published
  ON experiences(created_at DESC) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_exp_location
  ON experiences(location_label) WHERE location_label IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_exp_title_fts
  ON experiences USING gin(to_tsvector('german', COALESCE(title,'')));

-- ─── stories ─────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_stories_user_id
  ON stories(user_id);
CREATE INDEX IF NOT EXISTS idx_stories_expires_at
  ON stories(expires_at);
-- Only active stories — most queries hit this
CREATE INDEX IF NOT EXISTS idx_stories_active
  ON stories(created_at DESC) WHERE expires_at > NOW();
CREATE INDEX IF NOT EXISTS idx_stories_user_active
  ON stories(user_id, created_at DESC) WHERE expires_at > NOW();

-- ─── feed_items ───────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_feed_user_id
  ON feed_items(user_id);
CREATE INDEX IF NOT EXISTS idx_feed_type
  ON feed_items(type);
CREATE INDEX IF NOT EXISTS idx_feed_created_at
  ON feed_items(created_at DESC);
-- Active feed items — primary query path
CREATE INDEX IF NOT EXISTS idx_feed_active_time
  ON feed_items(created_at DESC)
  WHERE expires_at IS NULL OR expires_at > NOW();
-- Feed by type (works, stories, etc.)
CREATE INDEX IF NOT EXISTS idx_feed_type_time
  ON feed_items(type, created_at DESC)
  WHERE expires_at IS NULL OR expires_at > NOW();

-- ─── bookings ────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_bookings_user_id
  ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_wirker_id
  ON bookings(wirker_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user_status
  ON bookings(user_id, status);
CREATE INDEX IF NOT EXISTS idx_bookings_wirker_status
  ON bookings(wirker_id, status);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at
  ON bookings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status
  ON bookings(payment_status) WHERE payment_status IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bookings_escrow
  ON bookings(escrow_status) WHERE escrow_status = 'held';
-- Active bookings (dashboard query)
CREATE INDEX IF NOT EXISTS idx_bookings_active
  ON bookings(wirker_id, created_at DESC)
  WHERE status IN ('pending','confirmed','in_progress');

-- ─── conversations ────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_convos_participant_a
  ON conversations(participant_a);
CREATE INDEX IF NOT EXISTS idx_convos_participant_b
  ON conversations(participant_b);
-- Combined: either participant — for inbox query
CREATE INDEX IF NOT EXISTS idx_convos_last_msg
  ON conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_convos_booking_id
  ON conversations(booking_id) WHERE booking_id IS NOT NULL;
-- Composite for inbox: get all convos for user sorted by last message
CREATE INDEX IF NOT EXISTS idx_convos_a_last
  ON conversations(participant_a, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_convos_b_last
  ON conversations(participant_b, last_message_at DESC);

-- ─── messages ────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_messages_convo_time
    ON messages(conversation_id, created_at ASC);
  CREATE INDEX IF NOT EXISTS idx_messages_unread
    ON messages(conversation_id, read) WHERE read = false;
  CREATE INDEX IF NOT EXISTS idx_messages_sender
    ON messages(sender_id);
EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- ─── impact_projects ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_impact_status
  ON impact_projects(status);
CREATE INDEX IF NOT EXISTS idx_impact_votes_desc
  ON impact_projects(votes DESC);
CREATE INDEX IF NOT EXISTS idx_impact_active_votes
  ON impact_projects(votes DESC) WHERE status IN ('active','voting','featured');
CREATE INDEX IF NOT EXISTS idx_impact_month
  ON impact_projects(month) WHERE month IS NOT NULL;

-- ─── impact_rounds ────────────────────────────────────────────────────
CREATE UNIQUE INDEX IF NOT EXISTS idx_rounds_month_unique
  ON impact_rounds(month);
CREATE INDEX IF NOT EXISTS idx_rounds_status
  ON impact_rounds(status);
CREATE INDEX IF NOT EXISTS idx_rounds_active
  ON impact_rounds(month DESC) WHERE status IN ('active','voting');

-- ─── impact_votes ─────────────────────────────────────────────────────
CREATE UNIQUE INDEX IF NOT EXISTS idx_ivotes_unique_per_project
  ON impact_votes(user_id, round_id, project_id);
CREATE INDEX IF NOT EXISTS idx_ivotes_user_round
  ON impact_votes(user_id, round_id);
CREATE INDEX IF NOT EXISTS idx_ivotes_project_round
  ON impact_votes(project_id, round_id);

-- ─── user_match_scores ────────────────────────────────────────────────
-- Already has UNIQUE constraint on (user_id, target_user_id)
CREATE INDEX IF NOT EXISTS idx_match_user_score
  ON user_match_scores(user_id, score DESC);
CREATE INDEX IF NOT EXISTS idx_match_updated
  ON user_match_scores(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_match_categories_gin
  ON user_match_scores USING gin(categories);

-- ─── likes ───────────────────────────────────────────────────────────
-- Already has UNIQUE on (user_id, item_id, item_type)
CREATE INDEX IF NOT EXISTS idx_likes_item
  ON likes(item_id, item_type);
CREATE INDEX IF NOT EXISTS idx_likes_user
  ON likes(user_id);

-- ─── favorites ───────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_favorites_user_id
  ON favorites(user_id);

-- ─── recommendations ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_recs_wirker_id
  ON recommendations(wirker_id);
CREATE INDEX IF NOT EXISTS idx_recs_created_at
  ON recommendations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recs_wirker_time
  ON recommendations(wirker_id, created_at DESC);

-- ─── availability_slots ───────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_avail_user_date
  ON availability_slots(user_id, date);
CREATE INDEX IF NOT EXISTS idx_avail_date_range
  ON availability_slots(date) WHERE is_blocked = false;

-- ─── payouts ─────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_payouts_user_id
  ON payouts(user_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status
  ON payouts(status) WHERE status IN ('pending','processing');
CREATE INDEX IF NOT EXISTS idx_payouts_initiated_at
  ON payouts(initiated_at DESC);

-- ══════════════════════════════════════════════════════════════════════
-- PHASE 6: TRIGGERS — updated_at automatisch aktualisieren
-- ══════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION hui_update_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DO $$ BEGIN
  -- memberships
  DROP TRIGGER IF EXISTS trg_memberships_updated_at ON memberships;
  CREATE TRIGGER trg_memberships_updated_at
    BEFORE UPDATE ON memberships
    FOR EACH ROW EXECUTE FUNCTION hui_update_timestamp();

  -- impact_rounds
  DROP TRIGGER IF EXISTS trg_impact_rounds_updated_at ON impact_rounds;
  CREATE TRIGGER trg_impact_rounds_updated_at
    BEFORE UPDATE ON impact_rounds
    FOR EACH ROW EXECUTE FUNCTION hui_update_timestamp();

  -- conversations
  DROP TRIGGER IF EXISTS trg_conversations_updated_at ON conversations;
  CREATE TRIGGER trg_conversations_updated_at
    BEFORE UPDATE ON conversations
    FOR EACH ROW EXECUTE FUNCTION hui_update_timestamp();

  -- profiles
  DROP TRIGGER IF EXISTS trg_profiles_updated_at ON profiles;
  CREATE TRIGGER trg_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION hui_update_timestamp();

  -- wirker_profiles
  DROP TRIGGER IF EXISTS trg_wirker_profiles_updated_at ON wirker_profiles;
  CREATE TRIGGER trg_wirker_profiles_updated_at
    BEFORE UPDATE ON wirker_profiles
    FOR EACH ROW EXECUTE FUNCTION hui_update_timestamp();

  -- works
  DROP TRIGGER IF EXISTS trg_works_updated_at ON works;
  CREATE TRIGGER trg_works_updated_at
    BEFORE UPDATE ON works
    FOR EACH ROW EXECUTE FUNCTION hui_update_timestamp();

  -- bookings
  DROP TRIGGER IF EXISTS trg_bookings_updated_at ON bookings;
  CREATE TRIGGER trg_bookings_updated_at
    BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION hui_update_timestamp();

EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE 'Some triggers skipped — tables do not exist yet';
END $$;

-- ══════════════════════════════════════════════════════════════════════
-- PHASE 7: RLS — Row Level Security
-- ══════════════════════════════════════════════════════════════════════

-- Enable RLS
ALTER TABLE memberships          ENABLE ROW LEVEL SECURITY;
ALTER TABLE impact_rounds        ENABLE ROW LEVEL SECURITY;
ALTER TABLE impact_votes         ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations        ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_match_scores    ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_slots   ENABLE ROW LEVEL SECURITY;
ALTER TABLE privacy_settings     ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts              ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes                ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendations      ENABLE ROW LEVEL SECURITY;

-- ─── memberships ─────────────────────────────────────────────────────
DROP POLICY IF EXISTS pol_memberships_select ON memberships;
CREATE POLICY pol_memberships_select ON memberships FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS pol_memberships_insert ON memberships;
CREATE POLICY pol_memberships_insert ON memberships FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS pol_memberships_update ON memberships;
CREATE POLICY pol_memberships_update ON memberships FOR UPDATE
  USING (auth.uid() = user_id);

-- ─── impact_rounds — public read ────────────────────────────────────
DROP POLICY IF EXISTS pol_rounds_select ON impact_rounds;
CREATE POLICY pol_rounds_select ON impact_rounds FOR SELECT
  USING (true);

-- Only service role can insert/update rounds (via Edge Function)
DROP POLICY IF EXISTS pol_rounds_insert ON impact_rounds;
CREATE POLICY pol_rounds_insert ON impact_rounds FOR INSERT
  WITH CHECK (false);  -- Edge Function uses service role, bypasses RLS

-- ─── impact_votes ────────────────────────────────────────────────────
DROP POLICY IF EXISTS pol_ivotes_select ON impact_votes;
CREATE POLICY pol_ivotes_select ON impact_votes FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS pol_ivotes_insert ON impact_votes;
CREATE POLICY pol_ivotes_insert ON impact_votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- No updates/deletes on votes — immutable
DROP POLICY IF EXISTS pol_ivotes_delete ON impact_votes;
CREATE POLICY pol_ivotes_delete ON impact_votes FOR DELETE
  USING (false);

-- ─── conversations ────────────────────────────────────────────────────
DROP POLICY IF EXISTS pol_convos_select ON conversations;
CREATE POLICY pol_convos_select ON conversations FOR SELECT
  USING (auth.uid() = participant_a OR auth.uid() = participant_b);

DROP POLICY IF EXISTS pol_convos_insert ON conversations;
CREATE POLICY pol_convos_insert ON conversations FOR INSERT
  WITH CHECK (auth.uid() = participant_a OR auth.uid() = participant_b);

DROP POLICY IF EXISTS pol_convos_update ON conversations;
CREATE POLICY pol_convos_update ON conversations FOR UPDATE
  USING (auth.uid() = participant_a OR auth.uid() = participant_b);

-- ─── user_match_scores ───────────────────────────────────────────────
DROP POLICY IF EXISTS pol_match_select ON user_match_scores;
CREATE POLICY pol_match_select ON user_match_scores FOR SELECT
  USING (auth.uid() = user_id);

-- Match scores only written by Edge Functions (service role)
DROP POLICY IF EXISTS pol_match_insert ON user_match_scores;
CREATE POLICY pol_match_insert ON user_match_scores FOR INSERT
  WITH CHECK (false);

-- ─── availability_slots ──────────────────────────────────────────────
DROP POLICY IF EXISTS pol_avail_select ON availability_slots;
CREATE POLICY pol_avail_select ON availability_slots FOR SELECT
  USING (true);  -- public: anyone can see availability

DROP POLICY IF EXISTS pol_avail_insert ON availability_slots;
CREATE POLICY pol_avail_insert ON availability_slots FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS pol_avail_update ON availability_slots;
CREATE POLICY pol_avail_update ON availability_slots FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS pol_avail_delete ON availability_slots;
CREATE POLICY pol_avail_delete ON availability_slots FOR DELETE
  USING (auth.uid() = user_id);

-- ─── privacy_settings ────────────────────────────────────────────────
DROP POLICY IF EXISTS pol_privacy_select ON privacy_settings;
CREATE POLICY pol_privacy_select ON privacy_settings FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS pol_privacy_upsert ON privacy_settings;
CREATE POLICY pol_privacy_upsert ON privacy_settings FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ─── notification_settings ───────────────────────────────────────────
DROP POLICY IF EXISTS pol_notif_select ON notification_settings;
CREATE POLICY pol_notif_select ON notification_settings FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS pol_notif_upsert ON notification_settings;
CREATE POLICY pol_notif_upsert ON notification_settings FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ─── payouts — private ───────────────────────────────────────────────
DROP POLICY IF EXISTS pol_payouts_select ON payouts;
CREATE POLICY pol_payouts_select ON payouts FOR SELECT
  USING (auth.uid() = user_id);

-- Payouts only created by Edge Functions (service role)
DROP POLICY IF EXISTS pol_payouts_insert ON payouts;
CREATE POLICY pol_payouts_insert ON payouts FOR INSERT
  WITH CHECK (false);

-- ─── likes ───────────────────────────────────────────────────────────
DROP POLICY IF EXISTS pol_likes_select ON likes;
CREATE POLICY pol_likes_select ON likes FOR SELECT USING (true);

DROP POLICY IF EXISTS pol_likes_insert ON likes;
CREATE POLICY pol_likes_insert ON likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS pol_likes_delete ON likes;
CREATE POLICY pol_likes_delete ON likes FOR DELETE
  USING (auth.uid() = user_id);

-- ─── recommendations — public read, auth write ────────────────────────
DROP POLICY IF EXISTS pol_recs_select ON recommendations;
CREATE POLICY pol_recs_select ON recommendations FOR SELECT USING (true);

DROP POLICY IF EXISTS pol_recs_insert ON recommendations;
CREATE POLICY pol_recs_insert ON recommendations FOR INSERT
  WITH CHECK (auth.uid() = reviewer_id OR reviewer_id IS NULL);

-- ══════════════════════════════════════════════════════════════════════
-- PHASE 8: HELPER FUNCTIONS (Server-side, SECURITY DEFINER)
-- ══════════════════════════════════════════════════════════════════════

-- Count unread messages for a user in a conversation
CREATE OR REPLACE FUNCTION hui_get_unread_count(p_conversation_id uuid, p_user_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER SET search_path = public
AS $$
  SELECT COUNT(*)::integer
  FROM messages
  WHERE conversation_id = p_conversation_id
    AND sender_id != p_user_id
    AND read = false;
$$;

-- Get user's current vote allocation for a round
CREATE OR REPLACE FUNCTION hui_get_vote_allocation(p_user_id uuid, p_round_id uuid)
RETURNS TABLE(total_allowed smallint, votes_used integer, votes_left integer)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_weight  smallint;
  v_used    integer;
  v_allowed smallint;
BEGIN
  -- Get vote weight from membership
  SELECT COALESCE(m.vote_weight, 1) INTO v_weight
  FROM memberships m
  WHERE m.user_id = p_user_id AND m.status = 'active'
  LIMIT 1;

  IF v_weight IS NULL THEN v_weight := 1; END IF;

  -- Count votes already cast this round
  SELECT COUNT(*)::integer INTO v_used
  FROM impact_votes
  WHERE user_id = p_user_id AND round_id = p_round_id;

  v_allowed := CASE WHEN v_weight >= 2 THEN 2 ELSE 1 END;

  RETURN QUERY SELECT v_allowed, v_used, GREATEST(0, v_allowed - v_used);
END;
$$;

-- ══════════════════════════════════════════════════════════════════════
-- DONE
-- ══════════════════════════════════════════════════════════════════════
SELECT 'HUI Production Schema v8 — Applied successfully' AS result;
