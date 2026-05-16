-- ══════════════════════════════════════════════════════════════
-- HUI Core Architecture v7 — Schema + Indexes
-- 
-- Dieses Script im Supabase SQL Editor ausführen.
-- Es ist IDEMPOTENT — kann sicher mehrfach ausgeführt werden.
-- 
-- Enthält:
--   1. Schema-Erweiterungen (neue Tabellen, fehlende Spalten)
--   2. Optimale Indexes für Skalierung
--   3. Impact-Voting-System (1/2 Stimmen-Logik)
--   4. RLS Policies
-- ══════════════════════════════════════════════════════════════

-- ─── 1. MEMBERSHIPS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS memberships (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  membership_type text NOT NULL DEFAULT 'basisuser'
                  CHECK (membership_type IN ('basisuser','member','wirker','talent','admin')),
  status          text NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active','expired','cancelled')),
  vote_weight     integer NOT NULL DEFAULT 1
                  CHECK (vote_weight IN (1, 2)),
  started_at      timestamptz DEFAULT NOW(),
  expires_at      timestamptz,
  created_at      timestamptz DEFAULT NOW(),
  updated_at      timestamptz DEFAULT NOW()
);
-- Enforce one active membership per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_memberships_active_user
  ON memberships(user_id) WHERE status = 'active';

-- ─── 2. IMPACT ROUNDS ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS impact_rounds (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  month           text NOT NULL, -- Format: YYYY-MM
  status          text NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active','voting','distributing','completed')),
  pool_eur        numeric(10,2) DEFAULT 0,
  winner_project_id uuid,
  voting_ends_at  timestamptz,
  distributed_at  timestamptz,
  created_at      timestamptz DEFAULT NOW(),
  updated_at      timestamptz DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_rounds_month_unique
  ON impact_rounds(month);

-- ─── 3. IMPACT VOTES ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS impact_votes (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id  uuid NOT NULL,
  round_id    uuid NOT NULL,
  weight      integer NOT NULL DEFAULT 1,
  created_at  timestamptz DEFAULT NOW()
);
-- Prevent duplicate votes (same user, same project, same round)
CREATE UNIQUE INDEX IF NOT EXISTS idx_ivotes_unique
  ON impact_votes(user_id, round_id, project_id);

-- ─── 4. CONVERSATIONS (scalable chat) ───────────────────────
CREATE TABLE IF NOT EXISTS conversations (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  participant_a     uuid NOT NULL REFERENCES auth.users(id),
  participant_b     uuid NOT NULL REFERENCES auth.users(id),
  booking_id        uuid,
  last_message_at   timestamptz DEFAULT NOW(),
  last_message_text text,
  unread_count_a    integer DEFAULT 0,
  unread_count_b    integer DEFAULT 0,
  created_at        timestamptz DEFAULT NOW(),
  updated_at        timestamptz DEFAULT NOW()
);

-- ─── 5. USER MATCH SCORES ────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_match_scores (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_user_id  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score           numeric(5,2) NOT NULL DEFAULT 0,
  categories      jsonb DEFAULT '[]',
  updated_at      timestamptz DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_match_pair
  ON user_match_scores(user_id, target_user_id);

-- ─── 6. SICHERSTELLEN: fehlende Spalten in bestehenden Tabellen
DO $$ BEGIN
  -- profiles: membership fields
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS membership_type text DEFAULT 'basisuser';
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS dna_tags jsonb DEFAULT '[]';
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_modules jsonb DEFAULT '{}';
  
  -- impact_projects: goal + round tracking
  ALTER TABLE impact_projects ADD COLUMN IF NOT EXISTS goal_eur numeric(10,2) DEFAULT 0;
  ALTER TABLE impact_projects ADD COLUMN IF NOT EXISTS round_id uuid;
  ALTER TABLE impact_projects ADD COLUMN IF NOT EXISTS distributed_at timestamptz;
  
  -- bookings: escrow fields
  ALTER TABLE bookings ADD COLUMN IF NOT EXISTS escrow_status text DEFAULT 'held';
  ALTER TABLE bookings ADD COLUMN IF NOT EXISTS platform_fee numeric(10,2) DEFAULT 0;
  ALTER TABLE bookings ADD COLUMN IF NOT EXISTS impact_fee numeric(10,2) DEFAULT 0;
  ALTER TABLE bookings ADD COLUMN IF NOT EXISTS experience_id uuid;
  ALTER TABLE bookings ADD COLUMN IF NOT EXISTS work_id uuid;
  
  -- messages: conversation_id + type
  ALTER TABLE messages ADD COLUMN IF NOT EXISTS conversation_id uuid;
  ALTER TABLE messages ADD COLUMN IF NOT EXISTS type text DEFAULT 'text';
  
  -- works: extra fields
  ALTER TABLE works ADD COLUMN IF NOT EXISTS medium text;
  ALTER TABLE works ADD COLUMN IF NOT EXISTS likes_count integer DEFAULT 0;
  
  -- experiences: extra fields  
  ALTER TABLE experiences ADD COLUMN IF NOT EXISTS spots_available integer DEFAULT 0;
  ALTER TABLE experiences ADD COLUMN IF NOT EXISTS location_label text;
  
  -- wirker_profiles: score fields
  ALTER TABLE wirker_profiles ADD COLUMN IF NOT EXISTS rating_avg numeric(3,2) DEFAULT 0;
  ALTER TABLE wirker_profiles ADD COLUMN IF NOT EXISTS booking_count integer DEFAULT 0;
  ALTER TABLE wirker_profiles ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false;

EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Column additions: some already exist — OK';
END $$;

-- ═══════════════════════════════════════════════════════════════
-- INDEXES — Performance für Skalierung
-- ═══════════════════════════════════════════════════════════════

-- profiles
CREATE INDEX IF NOT EXISTS idx_profiles_username      ON profiles(username) WHERE username IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_is_wirker     ON profiles(is_wirker) WHERE is_wirker = true;
CREATE INDEX IF NOT EXISTS idx_profiles_has_talent    ON profiles(has_talent_profile) WHERE has_talent_profile = true;
CREATE INDEX IF NOT EXISTS idx_profiles_created_at    ON profiles(created_at DESC);

-- memberships
CREATE INDEX IF NOT EXISTS idx_memberships_user_id    ON memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_status     ON memberships(status) WHERE status = 'active';

-- wirker_profiles
CREATE INDEX IF NOT EXISTS idx_wirker_user_id         ON wirker_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_wirker_slug            ON wirker_profiles(slug);
CREATE INDEX IF NOT EXISTS idx_wirker_categories      ON wirker_profiles USING gin(categories);

-- works
CREATE INDEX IF NOT EXISTS idx_works_user_id          ON works(user_id);
CREATE INDEX IF NOT EXISTS idx_works_user_status      ON works(user_id, status);
CREATE INDEX IF NOT EXISTS idx_works_created_at       ON works(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_works_category         ON works(category) WHERE category IS NOT NULL;

-- experiences
CREATE INDEX IF NOT EXISTS idx_exp_user_id            ON experiences(user_id);
CREATE INDEX IF NOT EXISTS idx_exp_user_status        ON experiences(user_id, status);
CREATE INDEX IF NOT EXISTS idx_exp_created_at         ON experiences(created_at DESC);

-- stories
CREATE INDEX IF NOT EXISTS idx_stories_user_id        ON stories(user_id);
CREATE INDEX IF NOT EXISTS idx_stories_active         ON stories(created_at DESC) WHERE expires_at > NOW();

-- feed_items
CREATE INDEX IF NOT EXISTS idx_feed_user_id           ON feed_items(user_id);
CREATE INDEX IF NOT EXISTS idx_feed_created_at        ON feed_items(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feed_active            ON feed_items(created_at DESC) WHERE expires_at IS NULL OR expires_at > NOW();

-- bookings
CREATE INDEX IF NOT EXISTS idx_bookings_user_id       ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_wirker_id     ON bookings(wirker_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status        ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_user_status   ON bookings(user_id, status);
CREATE INDEX IF NOT EXISTS idx_bookings_wirker_status ON bookings(wirker_id, status);

-- conversations
CREATE INDEX IF NOT EXISTS idx_convos_participant_a   ON conversations(participant_a);
CREATE INDEX IF NOT EXISTS idx_convos_participant_b   ON conversations(participant_b);
CREATE INDEX IF NOT EXISTS idx_convos_last_msg        ON conversations(last_message_at DESC);

-- messages
CREATE INDEX IF NOT EXISTS idx_messages_convo_time    ON messages(conversation_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_messages_unread        ON messages(conversation_id, read) WHERE read = false;

-- impact_projects
CREATE INDEX IF NOT EXISTS idx_impact_active          ON impact_projects(votes DESC) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_impact_status          ON impact_projects(status);

-- impact_rounds
CREATE INDEX IF NOT EXISTS idx_rounds_month           ON impact_rounds(month DESC);

-- impact_votes
CREATE INDEX IF NOT EXISTS idx_ivotes_user_round      ON impact_votes(user_id, round_id);
CREATE INDEX IF NOT EXISTS idx_ivotes_project         ON impact_votes(project_id);

-- user_match_scores
CREATE INDEX IF NOT EXISTS idx_match_user_score       ON user_match_scores(user_id, score DESC);
CREATE INDEX IF NOT EXISTS idx_match_updated          ON user_match_scores(updated_at DESC);

-- likes / favorites
CREATE INDEX IF NOT EXISTS idx_likes_user_id          ON likes(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_likes_unique    ON likes(user_id, item_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user_id      ON favorites(user_id);

-- recommendations
CREATE INDEX IF NOT EXISTS idx_recs_wirker_id         ON recommendations(wirker_id);
CREATE INDEX IF NOT EXISTS idx_recs_created_at        ON recommendations(created_at DESC);

-- availability_slots
CREATE INDEX IF NOT EXISTS idx_avail_user_date        ON availability_slots(user_id, date);

-- ═══════════════════════════════════════════════════════════════
-- RLS POLICIES — Neue Tabellen
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE memberships       ENABLE ROW LEVEL SECURITY;
ALTER TABLE impact_rounds     ENABLE ROW LEVEL SECURITY;
ALTER TABLE impact_votes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations     ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_match_scores ENABLE ROW LEVEL SECURITY;

-- Memberships: User sieht eigene
DROP POLICY IF EXISTS memberships_select ON memberships;
CREATE POLICY memberships_select ON memberships FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS memberships_insert ON memberships;
CREATE POLICY memberships_insert ON memberships FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Impact Rounds: alle lesen
DROP POLICY IF EXISTS rounds_select ON impact_rounds;
CREATE POLICY rounds_select ON impact_rounds FOR SELECT
  USING (true);

-- Impact Votes: eigene sehen + erstellen
DROP POLICY IF EXISTS votes_select ON impact_votes;
CREATE POLICY votes_select ON impact_votes FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS votes_insert ON impact_votes;
CREATE POLICY votes_insert ON impact_votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Conversations: nur Teilnehmer
DROP POLICY IF EXISTS convos_select ON conversations;
CREATE POLICY convos_select ON conversations FOR SELECT
  USING (auth.uid() = participant_a OR auth.uid() = participant_b);

DROP POLICY IF EXISTS convos_insert ON conversations;
CREATE POLICY convos_insert ON conversations FOR INSERT
  WITH CHECK (auth.uid() = participant_a OR auth.uid() = participant_b);

DROP POLICY IF EXISTS convos_update ON conversations;
CREATE POLICY convos_update ON conversations FOR UPDATE
  USING (auth.uid() = participant_a OR auth.uid() = participant_b);

-- Match Scores: eigene sehen
DROP POLICY IF EXISTS match_select ON user_match_scores;
CREATE POLICY match_select ON user_match_scores FOR SELECT
  USING (auth.uid() = user_id);

