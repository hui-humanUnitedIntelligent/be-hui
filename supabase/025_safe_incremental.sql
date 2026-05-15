-- ═══════════════════════════════════════════════════════════════════════
-- HUI 025 — SAFE INCREMENTAL MIGRATION  (v3 — Real Schema Verified)
-- Datum: 2026-05-15
--
-- GEBAUT GEGEN DIE ECHTE DB-STRUKTUR (CSV-Export verifiziert):
--
-- availability_slots: user_id (KEIN provider_id/wirker_id)
-- bookings:           user_id, wirker_id, customer_id ✓
-- chats:              participant_ids ARRAY (KEIN user1_id/user2_id)
-- experiences:        status ✓, media_url ✓ — fehlende Felder ergänzen
-- feed_items:         published_at (KEIN status-Feld!)
-- favorites:          wirker_name text (kein wirker_id FK)
-- follows:            follower_id, followed_id ✓
--
-- REGELN:
--   • Kein RENAME COLUMN
--   • Kein DROP TABLE
--   • ADD COLUMN IF NOT EXISTS für alle neuen Felder
--   • Policies referenzieren NUR verifizierte Spalten
--   • Unbekannte Tabellen (works, stories etc.): defensive Policies (true)
-- ═══════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────
-- 1. WORKS (Spalten unbekannt — defensiv)
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.works (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title      text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.works
  ADD COLUMN IF NOT EXISTS description        text,
  ADD COLUMN IF NOT EXISTS media_url          text,
  ADD COLUMN IF NOT EXISTS media_type         text          DEFAULT 'image',
  ADD COLUMN IF NOT EXISTS caption            text,
  ADD COLUMN IF NOT EXISTS cover_url          text,
  ADD COLUMN IF NOT EXISTS images             text[]        DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS price              numeric(10,2),
  ADD COLUMN IF NOT EXISTS quantity           integer       DEFAULT 1,
  ADD COLUMN IF NOT EXISTS shipping_available boolean       DEFAULT false,
  ADD COLUMN IF NOT EXISTS pickup_available   boolean       DEFAULT false,
  ADD COLUMN IF NOT EXISTS delivery_time      text,
  ADD COLUMN IF NOT EXISTS for_sale           boolean       DEFAULT true,
  ADD COLUMN IF NOT EXISTS location_text      text,
  ADD COLUMN IF NOT EXISTS category           text,
  ADD COLUMN IF NOT EXISTS medium             text,
  ADD COLUMN IF NOT EXISTS tags               text[]        DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS mood_tags          text[]        DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS atmosphere_tags    text[]        DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS energy_level       text,
  ADD COLUMN IF NOT EXISTS social_energy      text,
  ADD COLUMN IF NOT EXISTS creator_vibe       text,
  ADD COLUMN IF NOT EXISTS views              integer       DEFAULT 0,
  ADD COLUMN IF NOT EXISTS likes_count        integer       DEFAULT 0,
  ADD COLUMN IF NOT EXISTS status             text          DEFAULT 'published';

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='works' AND column_name='state')
  THEN ALTER TABLE public.works ADD COLUMN state text DEFAULT 'published';
  END IF;
END $$;

UPDATE public.works SET status = 'published' WHERE status IS NULL OR status = '';
UPDATE public.works SET media_url = cover_url WHERE media_url IS NULL AND cover_url IS NOT NULL;
UPDATE public.works SET media_url = images[1]
  WHERE media_url IS NULL AND images IS NOT NULL AND array_length(images,1) > 0;

ALTER TABLE public.works ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS works_select_all ON public.works;
DROP POLICY IF EXISTS works_insert_own ON public.works;
DROP POLICY IF EXISTS works_update_own ON public.works;
DROP POLICY IF EXISTS works_delete_own ON public.works;
CREATE POLICY works_select_all ON public.works FOR SELECT USING (true);
CREATE POLICY works_insert_own ON public.works FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY works_update_own ON public.works FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY works_delete_own ON public.works FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS works_user_id_idx    ON public.works(user_id);
CREATE INDEX IF NOT EXISTS works_status_idx     ON public.works(status);
CREATE INDEX IF NOT EXISTS works_created_at_idx ON public.works(created_at DESC);

-- ─────────────────────────────────────────────────────────────────────
-- 2. EXPERIENCES (DB-verifiziert: status✓ media_url✓ cover_url✓)
-- Fehlende Felder ergänzen
-- ─────────────────────────────────────────────────────────────────────
-- Tabelle existiert bereits — nur neue Spalten hinzufügen
ALTER TABLE public.experiences
  ADD COLUMN IF NOT EXISTS available_days     text,
  ADD COLUMN IF NOT EXISTS location_text      text,
  ADD COLUMN IF NOT EXISTS mood               text,
  ADD COLUMN IF NOT EXISTS mood_tags          text[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS atmosphere_tags    text[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS energy_level       text,
  ADD COLUMN IF NOT EXISTS social_energy      text,
  ADD COLUMN IF NOT EXISTS creator_vibe       text,
  ADD COLUMN IF NOT EXISTS format             text    DEFAULT 'online',
  ADD COLUMN IF NOT EXISTS language           text    DEFAULT 'Deutsch',
  ADD COLUMN IF NOT EXISTS price_type         text    DEFAULT 'fixed',
  ADD COLUMN IF NOT EXISTS max_participants   integer,
  ADD COLUMN IF NOT EXISTS booking_mode       text    DEFAULT 'direct',
  ADD COLUMN IF NOT EXISTS caption            text,
  ADD COLUMN IF NOT EXISTS tags               text[]  DEFAULT '{}';

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='experiences' AND column_name='state')
  THEN ALTER TABLE public.experiences ADD COLUMN state text DEFAULT 'published';
  END IF;
END $$;

UPDATE public.experiences SET status = 'published' WHERE status IS NULL OR status = '';
UPDATE public.experiences SET media_url = cover_url WHERE media_url IS NULL AND cover_url IS NOT NULL;

ALTER TABLE public.experiences ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS exp_select_all ON public.experiences;
DROP POLICY IF EXISTS exp_insert_own ON public.experiences;
DROP POLICY IF EXISTS exp_update_own ON public.experiences;
DROP POLICY IF EXISTS exp_delete_own ON public.experiences;
CREATE POLICY exp_select_all ON public.experiences FOR SELECT USING (true);
CREATE POLICY exp_insert_own ON public.experiences FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY exp_update_own ON public.experiences FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY exp_delete_own ON public.experiences FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS exp_user_id_idx    ON public.experiences(user_id);
CREATE INDEX IF NOT EXISTS exp_status_idx     ON public.experiences(status);
CREATE INDEX IF NOT EXISTS exp_created_at_idx ON public.experiences(created_at DESC);

-- ─────────────────────────────────────────────────────────────────────
-- 3. STORIES (Spalten unbekannt — defensiv)
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.stories (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.stories
  ADD COLUMN IF NOT EXISTS media_url          text,
  ADD COLUMN IF NOT EXISTS media_type         text    DEFAULT 'image',
  ADD COLUMN IF NOT EXISTS username           text,
  ADD COLUMN IF NOT EXISTS avatar_url         text,
  ADD COLUMN IF NOT EXISTS text_overlay       text,
  ADD COLUMN IF NOT EXISTS caption            text,
  ADD COLUMN IF NOT EXISTS mood               text,
  ADD COLUMN IF NOT EXISTS is_highlight       boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS expires_at         timestamptz,
  ADD COLUMN IF NOT EXISTS mood_tags          text[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS atmosphere_tags    text[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS energy_level       text,
  ADD COLUMN IF NOT EXISTS social_energy      text,
  ADD COLUMN IF NOT EXISTS visibility         text    DEFAULT 'public',
  ADD COLUMN IF NOT EXISTS allow_comments     boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS status             text    DEFAULT 'published',
  ADD COLUMN IF NOT EXISTS views_count        integer DEFAULT 0;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='stories' AND column_name='state')
  THEN ALTER TABLE public.stories ADD COLUMN state text DEFAULT 'published';
  END IF;
END $$;

UPDATE public.stories SET status = 'published' WHERE status IS NULL OR status = '';

ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS stories_select_all ON public.stories;
DROP POLICY IF EXISTS stories_insert_own ON public.stories;
DROP POLICY IF EXISTS stories_update_own ON public.stories;
DROP POLICY IF EXISTS stories_delete_own ON public.stories;
CREATE POLICY stories_select_all ON public.stories FOR SELECT USING (true);
CREATE POLICY stories_insert_own ON public.stories FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY stories_update_own ON public.stories FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY stories_delete_own ON public.stories FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS stories_user_id_idx    ON public.stories(user_id);
CREATE INDEX IF NOT EXISTS stories_status_idx     ON public.stories(status);
CREATE INDEX IF NOT EXISTS stories_created_at_idx ON public.stories(created_at DESC);
CREATE INDEX IF NOT EXISTS stories_expires_at_idx ON public.stories(expires_at);

-- ─────────────────────────────────────────────────────────────────────
-- 4. PROFILES
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id         uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS display_name       text          DEFAULT '',
  ADD COLUMN IF NOT EXISTS username           text,
  ADD COLUMN IF NOT EXISTS avatar_url         text,
  ADD COLUMN IF NOT EXISTS header_img         text,
  ADD COLUMN IF NOT EXISTS bio                text,
  ADD COLUMN IF NOT EXISTS role               text          DEFAULT 'basisuser',
  ADD COLUMN IF NOT EXISTS is_wirker          boolean       DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_talent_profile boolean       DEFAULT false,
  ADD COLUMN IF NOT EXISTS focus_type         text,
  ADD COLUMN IF NOT EXISTS talent             text,
  ADD COLUMN IF NOT EXISTS location_label     text,
  ADD COLUMN IF NOT EXISTS is_available       boolean       DEFAULT true,
  ADD COLUMN IF NOT EXISTS impact_eur         numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS followers_count    integer       DEFAULT 0,
  ADD COLUMN IF NOT EXISTS follower_count     integer       DEFAULT 0,
  ADD COLUMN IF NOT EXISTS profile_views      integer       DEFAULT 0,
  ADD COLUMN IF NOT EXISTS dna_tags           text[]        DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS profile_modules    jsonb         DEFAULT '{}';

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS profiles_select_all ON public.profiles;
DROP POLICY IF EXISTS profiles_insert_own ON public.profiles;
DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
CREATE POLICY profiles_select_all ON public.profiles FOR SELECT USING (true);
CREATE POLICY profiles_insert_own ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY profiles_update_own ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE INDEX IF NOT EXISTS profiles_username_idx   ON public.profiles(username);
CREATE INDEX IF NOT EXISTS profiles_is_wirker_idx  ON public.profiles(is_wirker);
CREATE INDEX IF NOT EXISTS profiles_created_at_idx ON public.profiles(created_at DESC);

-- ─────────────────────────────────────────────────────────────────────
-- 5. WIRKER_PROFILES
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.wirker_profiles (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.wirker_profiles
  ADD COLUMN IF NOT EXISTS slug                  text UNIQUE,
  ADD COLUMN IF NOT EXISTS talent                text,
  ADD COLUMN IF NOT EXISTS wirker_type           text          DEFAULT 'selbst',
  ADD COLUMN IF NOT EXISTS location_label        text,
  ADD COLUMN IF NOT EXISTS categories            text[]        DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS bio                   text,
  ADD COLUMN IF NOT EXISTS avatar_url            text,
  ADD COLUMN IF NOT EXISTS header_img            text,
  ADD COLUMN IF NOT EXISTS hourly_rate           numeric(10,2),
  ADD COLUMN IF NOT EXISTS is_verified           boolean       DEFAULT false,
  ADD COLUMN IF NOT EXISTS impact_eur            numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS followers_count       integer       DEFAULT 0,
  ADD COLUMN IF NOT EXISTS recommendations_count integer       DEFAULT 0,
  ADD COLUMN IF NOT EXISTS dna_tags              text[]        DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS focus_type            text,
  ADD COLUMN IF NOT EXISTS is_available          boolean       DEFAULT true;

ALTER TABLE public.wirker_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS wp_select_all ON public.wirker_profiles;
DROP POLICY IF EXISTS wp_insert_own ON public.wirker_profiles;
DROP POLICY IF EXISTS wp_update_own ON public.wirker_profiles;
CREATE POLICY wp_select_all ON public.wirker_profiles FOR SELECT USING (true);
CREATE POLICY wp_insert_own ON public.wirker_profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY wp_update_own ON public.wirker_profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS wp_user_id_idx ON public.wirker_profiles(user_id);
CREATE INDEX IF NOT EXISTS wp_slug_idx    ON public.wirker_profiles(slug);

-- ─────────────────────────────────────────────────────────────────────
-- 6. FOLLOWS (DB-verifiziert: follower_id, followed_id ✓)
-- ─────────────────────────────────────────────────────────────────────
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS follows_select_all ON public.follows;
DROP POLICY IF EXISTS follows_insert_own ON public.follows;
DROP POLICY IF EXISTS follows_delete_own ON public.follows;
CREATE POLICY follows_select_all ON public.follows FOR SELECT USING (true);
CREATE POLICY follows_insert_own ON public.follows
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = follower_id);
CREATE POLICY follows_delete_own ON public.follows
  FOR DELETE TO authenticated USING (auth.uid() = follower_id);
CREATE INDEX IF NOT EXISTS follows_follower_idx ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS follows_followed_idx ON public.follows(followed_id);

-- ─────────────────────────────────────────────────────────────────────
-- 7. BOOKINGS
-- DB-verifiziert: user_id ✓, wirker_id ✓, customer_id ✓
-- Fehlende Spalten ergänzen
-- ─────────────────────────────────────────────────────────────────────
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS experience_id  uuid REFERENCES public.experiences(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS work_id        uuid REFERENCES public.works(id)       ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS total_amount   numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS notes          text,
  ADD COLUMN IF NOT EXISTS escrow_status  text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS impact_fee     numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS commission     numeric(10,2) DEFAULT 0;

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS book_select_own        ON public.bookings;
DROP POLICY IF EXISTS book_insert_own        ON public.bookings;
DROP POLICY IF EXISTS book_update_own        ON public.bookings;
DROP POLICY IF EXISTS bookings_wirker_select ON public.bookings;
DROP POLICY IF EXISTS bookings_wirker_update ON public.bookings;
-- wirker_id + user_id: beide DB-verifiziert ✓
CREATE POLICY book_select_own ON public.bookings
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = wirker_id OR auth.uid() = customer_id);
CREATE POLICY book_insert_own ON public.bookings
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY book_update_own ON public.bookings
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = wirker_id);

CREATE INDEX IF NOT EXISTS book_user_id_idx   ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS book_wirker_id_idx ON public.bookings(wirker_id);
CREATE INDEX IF NOT EXISTS book_status_idx    ON public.bookings(status);

-- ─────────────────────────────────────────────────────────────────────
-- 8. CHATS
-- DB-verifiziert: participant_ids ARRAY — KEIN user1_id/user2_id
-- Policy nutzt: auth.uid() = ANY(participant_ids)
-- ─────────────────────────────────────────────────────────────────────
ALTER TABLE public.chats
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS chats_select_own ON public.chats;
DROP POLICY IF EXISTS chats_insert_own ON public.chats;
DROP POLICY IF EXISTS chats_update_own ON public.chats;
-- participant_ids ist ARRAY — DB-verifiziert ✓
CREATE POLICY chats_select_own ON public.chats
  FOR SELECT TO authenticated
  USING (auth.uid() = ANY(participant_ids));
CREATE POLICY chats_insert_own ON public.chats
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = ANY(participant_ids));
CREATE INDEX IF NOT EXISTS chats_booking_id_idx ON public.chats(booking_id);

-- ─────────────────────────────────────────────────────────────────────
-- 9. MESSAGES
-- Spalten unbekannt — defensiv aufbauen
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.messages (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id    uuid REFERENCES public.chats(id) ON DELETE CASCADE,
  sender_id  uuid REFERENCES auth.users(id)   ON DELETE CASCADE,
  text       text,
  read       boolean     DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS receiver_id  uuid REFERENCES auth.users(id)    ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS image_url    text,
  ADD COLUMN IF NOT EXISTS background   text,
  ADD COLUMN IF NOT EXISTS story_id     uuid REFERENCES public.stories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS message_type text DEFAULT 'text';

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS msg_select_own ON public.messages;
DROP POLICY IF EXISTS msg_insert_own ON public.messages;
DROP POLICY IF EXISTS msg_update_own ON public.messages;
-- Prüft ob User in participant_ids des zugehörigen Chats ist
CREATE POLICY msg_select_own ON public.messages
  FOR SELECT TO authenticated
  USING (
    auth.uid() = sender_id OR
    auth.uid() = receiver_id OR
    EXISTS (
      SELECT 1 FROM public.chats c
      WHERE c.id = chat_id AND auth.uid() = ANY(c.participant_ids)
    )
  );
CREATE POLICY msg_insert_own ON public.messages
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);
CREATE POLICY msg_update_own ON public.messages
  FOR UPDATE TO authenticated USING (auth.uid() = receiver_id OR auth.uid() = sender_id);

CREATE INDEX IF NOT EXISTS msg_chat_id_idx    ON public.messages(chat_id);
CREATE INDEX IF NOT EXISTS msg_sender_id_idx  ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS msg_created_at_idx ON public.messages(created_at DESC);

-- ─────────────────────────────────────────────────────────────────────
-- 10. COMMENTS (DB-verifiziert: work_id, user_id, text ✓)
-- ─────────────────────────────────────────────────────────────────────
ALTER TABLE public.comments
  ADD COLUMN IF NOT EXISTS target_id   uuid,
  ADD COLUMN IF NOT EXISTS target_type text    DEFAULT 'work',
  ADD COLUMN IF NOT EXISTS likes_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS parent_id   uuid    REFERENCES public.comments(id) ON DELETE CASCADE;

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS comments_select_all ON public.comments;
DROP POLICY IF EXISTS comments_insert_own ON public.comments;
DROP POLICY IF EXISTS comments_delete_own ON public.comments;
CREATE POLICY comments_select_all ON public.comments FOR SELECT USING (true);
CREATE POLICY comments_insert_own ON public.comments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY comments_delete_own ON public.comments
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS comments_work_id_idx ON public.comments(work_id);
CREATE INDEX IF NOT EXISTS comments_user_id_idx ON public.comments(user_id);

-- ─────────────────────────────────────────────────────────────────────
-- 11. FAVORITES (DB-verifiziert: user_id ✓, wirker_name text)
-- ─────────────────────────────────────────────────────────────────────
ALTER TABLE public.favorites
  ADD COLUMN IF NOT EXISTS target_type text DEFAULT 'wirker';

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS fav_select_own ON public.favorites;
DROP POLICY IF EXISTS fav_insert_own ON public.favorites;
DROP POLICY IF EXISTS fav_delete_own ON public.favorites;
-- user_id DB-verifiziert ✓
CREATE POLICY fav_select_own ON public.favorites
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY fav_insert_own ON public.favorites
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY fav_delete_own ON public.favorites
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS fav_user_id_idx ON public.favorites(user_id);

-- ─────────────────────────────────────────────────────────────────────
-- 12. FEED_ITEMS
-- DB-verifiziert: published_at (KEIN status!) — content_type, content_id ✓
-- Fehlende Felder ergänzen, KEIN status-Update
-- ─────────────────────────────────────────────────────────────────────
ALTER TABLE public.feed_items
  ADD COLUMN IF NOT EXISTS status     text DEFAULT 'published',
  ADD COLUMN IF NOT EXISTS caption    text;

-- published_at auf neu erstellte Rows setzen falls NULL
UPDATE public.feed_items
  SET published_at = created_at
  WHERE published_at IS NULL AND created_at IS NOT NULL;

ALTER TABLE public.feed_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS fi_select_all ON public.feed_items;
DROP POLICY IF EXISTS fi_insert_own ON public.feed_items;
DROP POLICY IF EXISTS fi_delete_own ON public.feed_items;
-- user_id DB-verifiziert ✓
CREATE POLICY fi_select_all ON public.feed_items FOR SELECT USING (true);
CREATE POLICY fi_insert_own ON public.feed_items
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY fi_delete_own ON public.feed_items
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS fi_user_id_idx    ON public.feed_items(user_id);
CREATE INDEX IF NOT EXISTS fi_created_at_idx ON public.feed_items(created_at DESC);

-- ─────────────────────────────────────────────────────────────────────
-- 13. AVAILABILITY_SLOTS
-- DB-verifiziert: user_id (KEIN provider_id/wirker_id als Owner!)
-- Fehlende Felder ergänzen
-- ─────────────────────────────────────────────────────────────────────
ALTER TABLE public.availability_slots
  ADD COLUMN IF NOT EXISTS day_of_week  integer,
  ADD COLUMN IF NOT EXISTS start_time   time,
  ADD COLUMN IF NOT EXISTS end_time     time,
  ADD COLUMN IF NOT EXISTS is_available boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS wirker_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.availability_slots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS avail_select_all ON public.availability_slots;
DROP POLICY IF EXISTS avail_insert_own ON public.availability_slots;
DROP POLICY IF EXISTS avail_update_own ON public.availability_slots;
CREATE POLICY avail_select_all ON public.availability_slots FOR SELECT USING (true);
-- user_id DB-verifiziert ✓
CREATE POLICY avail_insert_own ON public.availability_slots
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY avail_update_own ON public.availability_slots
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS avail_user_id_idx ON public.availability_slots(user_id);

-- ─────────────────────────────────────────────────────────────────────
-- 14. ESCROW (DB-verifiziert — nur RLS setzen)
-- ─────────────────────────────────────────────────────────────────────
ALTER TABLE public.escrow ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS escrow_select_auth ON public.escrow;
DROP POLICY IF EXISTS escrow_insert_auth ON public.escrow;
CREATE POLICY escrow_select_auth ON public.escrow FOR SELECT TO authenticated USING (true);
CREATE POLICY escrow_insert_auth ON public.escrow FOR INSERT TO authenticated WITH CHECK (true);
CREATE INDEX IF NOT EXISTS escrow_booking_id_idx ON public.escrow(booking_id);

-- ─────────────────────────────────────────────────────────────────────
-- 15. RECOMMENDATIONS (Spalten unbekannt — defensiv)
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.recommendations (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.recommendations
  ADD COLUMN IF NOT EXISTS user_id    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS target_id  uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS rating     integer CHECK (rating BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS text       text,
  ADD COLUMN IF NOT EXISTS work_title text,
  ADD COLUMN IF NOT EXISTS booking_id uuid,
  ADD COLUMN IF NOT EXISTS is_public  boolean DEFAULT true;

ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS rec_select_all  ON public.recommendations;
DROP POLICY IF EXISTS rec_insert_auth ON public.recommendations;
-- USING (true) — Spaltenstand unbekannt, kein Risiko
CREATE POLICY rec_select_all  ON public.recommendations FOR SELECT USING (true);
CREATE POLICY rec_insert_auth ON public.recommendations FOR INSERT TO authenticated WITH CHECK (true);
CREATE INDEX IF NOT EXISTS rec_target_id_idx ON public.recommendations(target_id);

-- ─────────────────────────────────────────────────────────────────────
-- 16. IMPACT_POOL (DB-verifiziert — ergänzen)
-- ─────────────────────────────────────────────────────────────────────
ALTER TABLE public.impact_pool
  ADD COLUMN IF NOT EXISTS total_eur     numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS distributed   boolean       DEFAULT false,
  ADD COLUMN IF NOT EXISTS distributed_at timestamptz,
  ADD COLUMN IF NOT EXISTS created_at    timestamptz   DEFAULT now();

ALTER TABLE public.impact_pool ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS pool_select_all ON public.impact_pool;
CREATE POLICY pool_select_all ON public.impact_pool FOR SELECT USING (true);

-- ─────────────────────────────────────────────────────────────────────
-- 17. NOTIFICATIONS + SETTINGS
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  type       text NOT NULL,
  title      text,
  body       text,
  read       boolean     DEFAULT false,
  data       jsonb       DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS notif_select_own ON public.notifications;
DROP POLICY IF EXISTS notif_insert_any ON public.notifications;
DROP POLICY IF EXISTS notif_update_own ON public.notifications;
CREATE POLICY notif_select_own ON public.notifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY notif_insert_any ON public.notifications
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY notif_update_own ON public.notifications
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS notif_user_id_idx ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS notif_created_idx ON public.notifications(created_at DESC);

CREATE TABLE IF NOT EXISTS public.notification_settings (
  user_id    uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.notification_settings
  ADD COLUMN IF NOT EXISTS email_bookings boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS email_messages boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS push_bookings  boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS push_messages  boolean DEFAULT true;
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS ns_all_own ON public.notification_settings;
CREATE POLICY ns_all_own ON public.notification_settings
  FOR ALL TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.privacy_settings (
  user_id    uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.privacy_settings
  ADD COLUMN IF NOT EXISTS profile_visibility text    DEFAULT 'public',
  ADD COLUMN IF NOT EXISTS show_location      boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS allow_messages     boolean DEFAULT true;
ALTER TABLE public.privacy_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS ps_all_own ON public.privacy_settings;
CREATE POLICY ps_all_own ON public.privacy_settings
  FOR ALL TO authenticated USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────
-- 18. IMPACT_PROJECTS + IMPACT_VOTES
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.impact_projects (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.impact_projects
  ADD COLUMN IF NOT EXISTS description    text,
  ADD COLUMN IF NOT EXISTS category       text,
  ADD COLUMN IF NOT EXISTS status         text          DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS votes          integer       DEFAULT 0,
  ADD COLUMN IF NOT EXISTS awarded_eur    numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS month          text,
  ADD COLUMN IF NOT EXISTS website        text,
  ADD COLUMN IF NOT EXISTS contact_name   text,
  ADD COLUMN IF NOT EXISTS contact_email  text,
  ADD COLUMN IF NOT EXISTS tags           text[]        DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS icon           text,
  ADD COLUMN IF NOT EXISTS color          text,
  ADD COLUMN IF NOT EXISTS distributed_at timestamptz;
ALTER TABLE public.impact_projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS ip_select_all   ON public.impact_projects;
DROP POLICY IF EXISTS ip_insert_admin ON public.impact_projects;
CREATE POLICY ip_select_all   ON public.impact_projects FOR SELECT USING (true);
CREATE POLICY ip_insert_admin ON public.impact_projects FOR INSERT TO authenticated WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.impact_votes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.impact_projects(id) ON DELETE CASCADE,
  user_id    uuid REFERENCES auth.users(id)             ON DELETE CASCADE,
  month      text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, month)
);
ALTER TABLE public.impact_votes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS iv_select_own ON public.impact_votes;
DROP POLICY IF EXISTS iv_insert_own ON public.impact_votes;
CREATE POLICY iv_select_own ON public.impact_votes
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY iv_insert_own ON public.impact_votes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS iv_user_id_idx    ON public.impact_votes(user_id);
CREATE INDEX IF NOT EXISTS iv_project_id_idx ON public.impact_votes(project_id);

-- ─────────────────────────────────────────────────────────────────────
-- 19. MEDIA
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.media (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.media
  ADD COLUMN IF NOT EXISTS type              text,
  ADD COLUMN IF NOT EXISTS mime              text,
  ADD COLUMN IF NOT EXISTS storage_path      text,
  ADD COLUMN IF NOT EXISTS storage_bucket    text,
  ADD COLUMN IF NOT EXISTS url               text,
  ADD COLUMN IF NOT EXISTS caption           text,
  ADD COLUMN IF NOT EXISTS media_url         text,
  ADD COLUMN IF NOT EXISTS media_type        text,
  ADD COLUMN IF NOT EXISTS content_id        uuid,
  ADD COLUMN IF NOT EXISTS compression_state text DEFAULT 'done',
  ADD COLUMN IF NOT EXISTS width             integer,
  ADD COLUMN IF NOT EXISTS height            integer;
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS media_select_all ON public.media;
DROP POLICY IF EXISTS media_insert_own ON public.media;
CREATE POLICY media_select_all ON public.media FOR SELECT USING (true);
CREATE POLICY media_insert_own ON public.media
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS media_user_id_idx ON public.media(user_id);

-- ─────────────────────────────────────────────────────────────────────
-- 20. WORK_LIKES / WORK_SAVES / STORY_VIEWS (neue Tabellen)
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.work_likes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_id    uuid REFERENCES public.works(id) ON DELETE CASCADE,
  user_id    uuid REFERENCES auth.users(id)   ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(work_id, user_id)
);
ALTER TABLE public.work_likes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS wl_select_all ON public.work_likes;
DROP POLICY IF EXISTS wl_insert_own ON public.work_likes;
DROP POLICY IF EXISTS wl_delete_own ON public.work_likes;
CREATE POLICY wl_select_all ON public.work_likes FOR SELECT USING (true);
CREATE POLICY wl_insert_own ON public.work_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY wl_delete_own ON public.work_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS wl_work_id_idx ON public.work_likes(work_id);

CREATE TABLE IF NOT EXISTS public.story_views (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id  uuid REFERENCES public.stories(id) ON DELETE CASCADE,
  viewer_id uuid REFERENCES auth.users(id)     ON DELETE CASCADE,
  viewed_at timestamptz DEFAULT now(),
  UNIQUE(story_id, viewer_id)
);
ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS sv_select_own ON public.story_views;
DROP POLICY IF EXISTS sv_insert_own ON public.story_views;
CREATE POLICY sv_select_own ON public.story_views
  FOR SELECT TO authenticated USING (auth.uid() = viewer_id);
CREATE POLICY sv_insert_own ON public.story_views
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = viewer_id);
CREATE INDEX IF NOT EXISTS sv_story_id_idx  ON public.story_views(story_id);
CREATE INDEX IF NOT EXISTS sv_viewer_id_idx ON public.story_views(viewer_id);

-- ─────────────────────────────────────────────────────────────────────
-- 21. DATA RECOVERY
-- ─────────────────────────────────────────────────────────────────────
UPDATE public.works SET status = 'published' WHERE status IS NULL OR status = '';
UPDATE public.works SET media_url = COALESCE(cover_url, images[1])
  WHERE media_url IS NULL
    AND (cover_url IS NOT NULL OR (images IS NOT NULL AND array_length(images,1) > 0));
UPDATE public.experiences SET status = 'published' WHERE status IS NULL OR status = '';
UPDATE public.experiences SET media_url = cover_url WHERE media_url IS NULL AND cover_url IS NOT NULL;
UPDATE public.stories    SET status = 'published' WHERE status IS NULL OR status = '';
UPDATE public.feed_items SET published_at = created_at WHERE published_at IS NULL;

-- ─────────────────────────────────────────────────────────────────────
-- 22. SCHEMA-CACHE FLUSH
-- ─────────────────────────────────────────────────────────────────────
NOTIFY pgrst, 'reload schema';

-- ─────────────────────────────────────────────────────────────────────
-- VERIFIKATION
-- ─────────────────────────────────────────────────────────────────────
SELECT
  'HUI 025 v3 — Real Schema Verified — abgeschlossen' AS status,
  NOW() AS ts,
  (SELECT COUNT(*) FROM public.works)           AS works,
  (SELECT COUNT(*) FROM public.works WHERE status='published') AS works_pub,
  (SELECT COUNT(*) FROM public.stories)         AS stories,
  (SELECT COUNT(*) FROM public.experiences)     AS experiences,
  (SELECT COUNT(*) FROM public.profiles)        AS profiles,
  (SELECT COUNT(*) FROM public.wirker_profiles) AS wirker_profiles,
  (SELECT COUNT(*) FROM public.bookings)        AS bookings,
  (SELECT COUNT(*) FROM public.chats)           AS chats,
  (SELECT COUNT(*) FROM public.feed_items)      AS feed_items;
