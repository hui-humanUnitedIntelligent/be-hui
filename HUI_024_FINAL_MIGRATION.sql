-- ═══════════════════════════════════════════════════════════════════════
-- HUI 024 — MASTER PRODUCTION SCHEMA
-- Datum: 2026-05-15
--
-- WARUM DIESER SCRIPT:
--   Vollständiger Schema-Audit hat 26 Tabellen aus 50+ Komponenten extrahiert.
--   Zwischen Frontend-Erwartungen und Production-DB bestehen massive Drifts:
--   - works: state ENUM vs status text, fehlende likes_count, medium, tags
--   - experiences: location GEOGRAPHY vs location_text text, fehlende Felder
--   - stories: fehlende text_overlay, mood, caption, location
--   - profiles: fehlende followers_count, profile_modules, dna_tags, focus_type
--   - wirker_profiles: fehlende location_label, categories, wirker_type
--   - bookings: fehlende client_name, service_title, work_title, total_amount
--   - messages: fehlende image_url, background, story_id, receiver_id
--   - Fehlende Tabellen: chats, notifications, notification_settings,
--     privacy_settings, follows, likes, work_likes, work_saves, comments,
--     story_views, recommendations, availability_slots, payouts, favorites
--
-- GARANTIEN:
--   ✓ 100% idempotent (mehrfach ausführen = sicher)
--   ✓ Keine bestehenden Daten werden gelöscht
--   ✓ Alle ADD COLUMN IF NOT EXISTS
--   ✓ Alle CREATE TABLE IF NOT EXISTS
--   ✓ RLS für alle Tabellen
--   ✓ Storage Buckets
--   ✓ Schema-Cache flush am Ende
-- ═══════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────
-- SCHRITT 1: CORE TABLES — works, experiences, stories, profiles
-- ─────────────────────────────────────────────────────────────────────

-- ══════════════════════════════════════════════════════════════════════
-- 1.1 WORKS
-- Frontend erwartet: id, title, description, price, cover_url, media_url,
--   images, category, status, state, mood_tags, atmosphere_tags,
--   energy_level, social_energy, creator_vibe, for_sale, created_at,
--   user_id, likes_count, medium, tags
-- ══════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.works (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title        text NOT NULL DEFAULT '',
  description  text,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);

ALTER TABLE public.works
  ADD COLUMN IF NOT EXISTS media_url          text,
  ADD COLUMN IF NOT EXISTS media_type         text DEFAULT 'image',
  ADD COLUMN IF NOT EXISTS caption            text,
  ADD COLUMN IF NOT EXISTS cover_url          text,
  ADD COLUMN IF NOT EXISTS images             text[]    DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS price              numeric(10,2),
  ADD COLUMN IF NOT EXISTS quantity           integer   DEFAULT 1,
  ADD COLUMN IF NOT EXISTS shipping_available boolean   DEFAULT false,
  ADD COLUMN IF NOT EXISTS pickup_available   boolean   DEFAULT false,
  ADD COLUMN IF NOT EXISTS delivery_time      text,
  ADD COLUMN IF NOT EXISTS for_sale           boolean   DEFAULT true,
  ADD COLUMN IF NOT EXISTS location_text      text,
  ADD COLUMN IF NOT EXISTS category           text      DEFAULT 'Kunst',
  ADD COLUMN IF NOT EXISTS medium             text,
  ADD COLUMN IF NOT EXISTS tags               text[]    DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS mood_tags          text[]    DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS atmosphere_tags    text[]    DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS energy_level       text,
  ADD COLUMN IF NOT EXISTS social_energy      text,
  ADD COLUMN IF NOT EXISTS creator_vibe       text,
  ADD COLUMN IF NOT EXISTS views              integer   DEFAULT 0,
  ADD COLUMN IF NOT EXISTS likes_count        integer   DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sale_mode          text      DEFAULT 'for_sale',
  ADD COLUMN IF NOT EXISTS status             text      DEFAULT 'published';

-- state ENUM koexistiert mit status — beide erlauben 'published'
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='works' AND column_name='state')
  THEN ALTER TABLE public.works ADD COLUMN state text DEFAULT 'published';
  END IF;
END $$;

-- Vorhandene works: status/state auf published setzen wenn NULL
UPDATE public.works SET status = 'published'
WHERE status IS NULL OR status = '';

UPDATE public.works SET media_url = cover_url
WHERE media_url IS NULL AND cover_url IS NOT NULL;

UPDATE public.works SET media_url = images[1]
WHERE media_url IS NULL AND images IS NOT NULL AND array_length(images, 1) > 0;

-- Works RLS
ALTER TABLE public.works ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS works_select_all   ON public.works;
DROP POLICY IF EXISTS works_insert_own   ON public.works;
DROP POLICY IF EXISTS works_update_own   ON public.works;
DROP POLICY IF EXISTS works_delete_own   ON public.works;

CREATE POLICY works_select_all ON public.works
  FOR SELECT USING (true);  -- öffentlich lesbar

CREATE POLICY works_insert_own ON public.works
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY works_update_own ON public.works
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY works_delete_own ON public.works
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Index
CREATE INDEX IF NOT EXISTS works_user_id_idx    ON public.works(user_id);
CREATE INDEX IF NOT EXISTS works_status_idx     ON public.works(status);
CREATE INDEX IF NOT EXISTS works_created_at_idx ON public.works(created_at DESC);

-- ══════════════════════════════════════════════════════════════════════
-- 1.2 EXPERIENCES
-- Frontend erwartet: id, title, description, price, price_type, format,
--   location_text, category, status, state, mood_tags, atmosphere_tags,
--   energy_level, social_energy, creator_vibe, media_url, media_type,
--   caption, available_days, language, created_at, user_id,
--   duration, max_participants, booking_mode
-- ══════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.experiences (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title       text NOT NULL DEFAULT '',
  description text,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

ALTER TABLE public.experiences
  ADD COLUMN IF NOT EXISTS media_url          text,
  ADD COLUMN IF NOT EXISTS media_type         text      DEFAULT 'image',
  ADD COLUMN IF NOT EXISTS cover_url          text,
  ADD COLUMN IF NOT EXISTS caption            text,
  ADD COLUMN IF NOT EXISTS price              numeric(10,2),
  ADD COLUMN IF NOT EXISTS price_type         text      DEFAULT 'fixed',
  ADD COLUMN IF NOT EXISTS format             text      DEFAULT 'online',
  ADD COLUMN IF NOT EXISTS duration           text,
  ADD COLUMN IF NOT EXISTS available_days     text,
  ADD COLUMN IF NOT EXISTS language           text      DEFAULT 'Deutsch',
  ADD COLUMN IF NOT EXISTS location_text      text,
  ADD COLUMN IF NOT EXISTS category           text,
  ADD COLUMN IF NOT EXISTS mood               text,
  ADD COLUMN IF NOT EXISTS max_participants   integer,
  ADD COLUMN IF NOT EXISTS booking_mode       text      DEFAULT 'direct',
  ADD COLUMN IF NOT EXISTS mood_tags          text[]    DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS atmosphere_tags    text[]    DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS energy_level       text,
  ADD COLUMN IF NOT EXISTS social_energy      text,
  ADD COLUMN IF NOT EXISTS creator_vibe       text,
  ADD COLUMN IF NOT EXISTS status             text      DEFAULT 'published';

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='experiences' AND column_name='state')
  THEN ALTER TABLE public.experiences ADD COLUMN state text DEFAULT 'published';
  END IF;
END $$;

-- location GEOGRAPHY → location_text text migration (falls GEOGRAPHY-Spalte existiert)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='experiences'
    AND column_name='location' AND data_type = 'USER-DEFINED')
  THEN
    UPDATE public.experiences SET location_text = ST_AsText(location::geometry)
    WHERE location_text IS NULL AND location IS NOT NULL;
    RAISE NOTICE 'experiences.location (GEOGRAPHY) → location_text migriert';
  ELSIF EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='experiences'
    AND column_name='location' AND data_type IN ('text','character varying'))
  THEN
    UPDATE public.experiences SET location_text = location::text
    WHERE location_text IS NULL AND location IS NOT NULL;
  END IF;
END $$;

UPDATE public.experiences SET status = 'published'
WHERE status IS NULL OR status = '';

UPDATE public.experiences SET media_url = cover_url
WHERE media_url IS NULL AND cover_url IS NOT NULL;

-- Experiences RLS
ALTER TABLE public.experiences ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS exp_select_all  ON public.experiences;
DROP POLICY IF EXISTS exp_insert_own  ON public.experiences;
DROP POLICY IF EXISTS exp_update_own  ON public.experiences;
DROP POLICY IF EXISTS exp_delete_own  ON public.experiences;

CREATE POLICY exp_select_all ON public.experiences FOR SELECT USING (true);
CREATE POLICY exp_insert_own ON public.experiences FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY exp_update_own ON public.experiences FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY exp_delete_own ON public.experiences FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS exp_user_id_idx    ON public.experiences(user_id);
CREATE INDEX IF NOT EXISTS exp_status_idx     ON public.experiences(status);
CREATE INDEX IF NOT EXISTS exp_created_at_idx ON public.experiences(created_at DESC);

-- ══════════════════════════════════════════════════════════════════════
-- 1.3 STORIES
-- Frontend erwartet: id, user_id, username, avatar_url, media_url,
--   media_type, text_overlay, mood, is_highlight, created_at, expires_at,
--   caption, location, mood_tags, atmosphere_tags, energy_level,
--   social_energy, status, state, visibility, allow_comments
-- ══════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.stories (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

ALTER TABLE public.stories
  ADD COLUMN IF NOT EXISTS media_url      text,
  ADD COLUMN IF NOT EXISTS media_type     text      DEFAULT 'image',
  ADD COLUMN IF NOT EXISTS username       text,
  ADD COLUMN IF NOT EXISTS avatar_url     text,
  ADD COLUMN IF NOT EXISTS text_overlay   text,
  ADD COLUMN IF NOT EXISTS caption        text,
  ADD COLUMN IF NOT EXISTS mood           text,
  ADD COLUMN IF NOT EXISTS location       text,
  ADD COLUMN IF NOT EXISTS is_highlight   boolean   DEFAULT false,
  ADD COLUMN IF NOT EXISTS expires_at     timestamptz,
  ADD COLUMN IF NOT EXISTS mood_tags      text[]    DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS atmosphere_tags text[]   DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS energy_level   text,
  ADD COLUMN IF NOT EXISTS social_energy  text,
  ADD COLUMN IF NOT EXISTS visibility     text      DEFAULT 'public',
  ADD COLUMN IF NOT EXISTS allow_comments boolean   DEFAULT true,
  ADD COLUMN IF NOT EXISTS status         text      DEFAULT 'published',
  ADD COLUMN IF NOT EXISTS views_count    integer   DEFAULT 0;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='stories' AND column_name='state')
  THEN ALTER TABLE public.stories ADD COLUMN state text DEFAULT 'published';
  END IF;
END $$;

UPDATE public.stories SET status = 'published'
WHERE status IS NULL OR status = '';

-- Stories RLS
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS stories_select_all  ON public.stories;
DROP POLICY IF EXISTS stories_insert_own  ON public.stories;
DROP POLICY IF EXISTS stories_update_own  ON public.stories;
DROP POLICY IF EXISTS stories_delete_own  ON public.stories;

CREATE POLICY stories_select_all ON public.stories FOR SELECT USING (true);
CREATE POLICY stories_insert_own ON public.stories FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY stories_update_own ON public.stories FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY stories_delete_own ON public.stories FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS stories_user_id_idx    ON public.stories(user_id);
CREATE INDEX IF NOT EXISTS stories_status_idx     ON public.stories(status);
CREATE INDEX IF NOT EXISTS stories_created_at_idx ON public.stories(created_at DESC);
CREATE INDEX IF NOT EXISTS stories_expires_at_idx ON public.stories(expires_at);

-- ══════════════════════════════════════════════════════════════════════
-- 1.4 PROFILES
-- Frontend erwartet: id, display_name, username, avatar_url, header_img,
--   bio, is_wirker, has_talent_profile, focus_type, talent,
--   location_label, is_available, impact_eur, created_at, dna_tags,
--   profile_modules, role, followers_count, profile_views, follower_count
-- ══════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.profiles (
  id           uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS display_name       text      DEFAULT '',
  ADD COLUMN IF NOT EXISTS username           text,
  ADD COLUMN IF NOT EXISTS avatar_url         text,
  ADD COLUMN IF NOT EXISTS header_img         text,
  ADD COLUMN IF NOT EXISTS bio                text,
  ADD COLUMN IF NOT EXISTS role               text      DEFAULT 'basisuser',
  ADD COLUMN IF NOT EXISTS is_wirker          boolean   DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_talent_profile boolean   DEFAULT false,
  ADD COLUMN IF NOT EXISTS focus_type         text,
  ADD COLUMN IF NOT EXISTS talent             text,
  ADD COLUMN IF NOT EXISTS location_label     text,
  ADD COLUMN IF NOT EXISTS is_available       boolean   DEFAULT true,
  ADD COLUMN IF NOT EXISTS impact_eur         numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS followers_count    integer   DEFAULT 0,
  ADD COLUMN IF NOT EXISTS follower_count     integer   DEFAULT 0,
  ADD COLUMN IF NOT EXISTS profile_views      integer   DEFAULT 0,
  ADD COLUMN IF NOT EXISTS dna_tags           text[]    DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS profile_modules    jsonb     DEFAULT '{}';

-- follower_count und followers_count synchron halten
-- (Frontend verwendet beide Varianten — beide pflegen)
UPDATE public.profiles
SET follower_count = followers_count
WHERE follower_count = 0 AND followers_count > 0;

-- Profiles RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS profiles_select_all  ON public.profiles;
DROP POLICY IF EXISTS profiles_insert_own  ON public.profiles;
DROP POLICY IF EXISTS profiles_update_own  ON public.profiles;

CREATE POLICY profiles_select_all ON public.profiles FOR SELECT USING (true);
CREATE POLICY profiles_insert_own ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);
CREATE POLICY profiles_update_own ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id);

CREATE INDEX IF NOT EXISTS profiles_username_idx    ON public.profiles(username);
CREATE INDEX IF NOT EXISTS profiles_is_wirker_idx   ON public.profiles(is_wirker);
CREATE INDEX IF NOT EXISTS profiles_created_at_idx  ON public.profiles(created_at DESC);

-- ══════════════════════════════════════════════════════════════════════
-- 1.5 WIRKER_PROFILES
-- Frontend erwartet: user_id, slug, talent, wirker_type, location_label,
--   categories, bio, avatar_url, header_img, hourly_rate, is_verified,
--   impact_eur, followers_count, recommendations_count
-- ══════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.wirker_profiles (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);

ALTER TABLE public.wirker_profiles
  ADD COLUMN IF NOT EXISTS slug               text UNIQUE,
  ADD COLUMN IF NOT EXISTS talent             text,
  ADD COLUMN IF NOT EXISTS wirker_type        text      DEFAULT 'selbst',
  ADD COLUMN IF NOT EXISTS location_label     text,
  ADD COLUMN IF NOT EXISTS categories         text[]    DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS bio                text,
  ADD COLUMN IF NOT EXISTS avatar_url         text,
  ADD COLUMN IF NOT EXISTS header_img         text,
  ADD COLUMN IF NOT EXISTS hourly_rate        numeric(10,2),
  ADD COLUMN IF NOT EXISTS is_verified        boolean   DEFAULT false,
  ADD COLUMN IF NOT EXISTS impact_eur         numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS followers_count    integer   DEFAULT 0,
  ADD COLUMN IF NOT EXISTS recommendations_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS availability_slots jsonb     DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS dna_tags           text[]    DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS focus_type         text,
  ADD COLUMN IF NOT EXISTS is_available       boolean   DEFAULT true;

ALTER TABLE public.wirker_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS wp_select_all  ON public.wirker_profiles;
DROP POLICY IF EXISTS wp_insert_own  ON public.wirker_profiles;
DROP POLICY IF EXISTS wp_update_own  ON public.wirker_profiles;

CREATE POLICY wp_select_all ON public.wirker_profiles FOR SELECT USING (true);
CREATE POLICY wp_insert_own ON public.wirker_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY wp_update_own ON public.wirker_profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS wp_user_id_idx ON public.wirker_profiles(user_id);
CREATE INDEX IF NOT EXISTS wp_slug_idx    ON public.wirker_profiles(slug);

-- ─────────────────────────────────────────────────────────────────────
-- SCHRITT 2: SOCIAL TABLES
-- ─────────────────────────────────────────────────────────────────────

-- ══════════════════════════════════════════════════════════════════════
-- 2.1 FOLLOWS
-- Frontend: WorkDetailPage verwendet follows
-- ══════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.follows (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  followed_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  timestamptz DEFAULT now(),
  UNIQUE(follower_id, followed_id)
);

ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS follows_select_all  ON public.follows;
DROP POLICY IF EXISTS follows_insert_own  ON public.follows;
DROP POLICY IF EXISTS follows_delete_own  ON public.follows;

CREATE POLICY follows_select_all ON public.follows FOR SELECT USING (true);
CREATE POLICY follows_insert_own ON public.follows FOR INSERT TO authenticated WITH CHECK (auth.uid() = follower_id);
CREATE POLICY follows_delete_own ON public.follows FOR DELETE TO authenticated USING (auth.uid() = follower_id);

CREATE INDEX IF NOT EXISTS follows_follower_idx ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS follows_followed_idx ON public.follows(followed_id);

-- ══════════════════════════════════════════════════════════════════════
-- 2.2 WORK_LIKES
-- Frontend: WorkDetailPage
-- ══════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.work_likes (
  id       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_id  uuid REFERENCES public.works(id) ON DELETE CASCADE,
  user_id  uuid REFERENCES auth.users(id) ON DELETE CASCADE,
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
CREATE INDEX IF NOT EXISTS wl_user_id_idx ON public.work_likes(user_id);

-- ══════════════════════════════════════════════════════════════════════
-- 2.3 WORK_SAVES (Bookmarks)
-- Frontend: WorkDetailPage
-- ══════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.work_saves (
  id       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_id  uuid REFERENCES public.works(id) ON DELETE CASCADE,
  user_id  uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(work_id, user_id)
);

ALTER TABLE public.work_saves ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS ws_select_own ON public.work_saves;
DROP POLICY IF EXISTS ws_insert_own ON public.work_saves;
DROP POLICY IF EXISTS ws_delete_own ON public.work_saves;

CREATE POLICY ws_select_own ON public.work_saves FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY ws_insert_own ON public.work_saves FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY ws_delete_own ON public.work_saves FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS ws_work_id_idx ON public.work_saves(work_id);
CREATE INDEX IF NOT EXISTS ws_user_id_idx ON public.work_saves(user_id);

-- ══════════════════════════════════════════════════════════════════════
-- 2.4 LIKES (generisch — für Stories etc.)
-- Frontend: MeinHUI_SubPages
-- ══════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.likes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  target_id   uuid NOT NULL,
  target_type text NOT NULL,  -- 'story', 'work', 'experience'
  created_at  timestamptz DEFAULT now(),
  UNIQUE(user_id, target_id, target_type)
);

ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS likes_select_all ON public.likes;
DROP POLICY IF EXISTS likes_insert_own ON public.likes;
DROP POLICY IF EXISTS likes_delete_own ON public.likes;

CREATE POLICY likes_select_all ON public.likes FOR SELECT USING (true);
CREATE POLICY likes_insert_own ON public.likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY likes_delete_own ON public.likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS likes_user_id_idx   ON public.likes(user_id);
CREATE INDEX IF NOT EXISTS likes_target_id_idx ON public.likes(target_id);

-- ══════════════════════════════════════════════════════════════════════
-- 2.5 FAVORITES
-- Frontend: MeinHUI_SubPages, FavoritesPage
-- ══════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.favorites (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  target_id   uuid NOT NULL,
  target_type text NOT NULL DEFAULT 'wirker',
  created_at  timestamptz DEFAULT now(),
  UNIQUE(user_id, target_id, target_type)
);

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS fav_select_own ON public.favorites;
DROP POLICY IF EXISTS fav_insert_own ON public.favorites;
DROP POLICY IF EXISTS fav_delete_own ON public.favorites;

CREATE POLICY fav_select_own ON public.favorites FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY fav_insert_own ON public.favorites FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY fav_delete_own ON public.favorites FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS fav_user_id_idx ON public.favorites(user_id);

-- ══════════════════════════════════════════════════════════════════════
-- 2.6 COMMENTS
-- Frontend: CommentSection, WorkDetailPage
-- ══════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.comments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  work_id     uuid REFERENCES public.works(id) ON DELETE CASCADE,
  text        text NOT NULL,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE public.comments
  ADD COLUMN IF NOT EXISTS target_id   uuid,
  ADD COLUMN IF NOT EXISTS target_type text DEFAULT 'work',
  ADD COLUMN IF NOT EXISTS likes_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS parent_id   uuid REFERENCES public.comments(id) ON DELETE CASCADE;

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS comments_select_all  ON public.comments;
DROP POLICY IF EXISTS comments_insert_own  ON public.comments;
DROP POLICY IF EXISTS comments_delete_own  ON public.comments;

CREATE POLICY comments_select_all ON public.comments FOR SELECT USING (true);
CREATE POLICY comments_insert_own ON public.comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY comments_delete_own ON public.comments FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS comments_work_id_idx ON public.comments(work_id);
CREATE INDEX IF NOT EXISTS comments_user_id_idx ON public.comments(user_id);

-- ══════════════════════════════════════════════════════════════════════
-- 2.7 STORY_VIEWS
-- Frontend: StoryBar, WirkerProfileDashboard
-- ══════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.story_views (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id   uuid REFERENCES public.stories(id) ON DELETE CASCADE,
  viewer_id  uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  viewed_at  timestamptz DEFAULT now(),
  UNIQUE(story_id, viewer_id)
);

ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS sv_select_own ON public.story_views;
DROP POLICY IF EXISTS sv_insert_own ON public.story_views;

CREATE POLICY sv_select_own ON public.story_views FOR SELECT TO authenticated USING (auth.uid() = viewer_id);
CREATE POLICY sv_insert_own ON public.story_views FOR INSERT TO authenticated WITH CHECK (auth.uid() = viewer_id);

CREATE INDEX IF NOT EXISTS sv_story_id_idx  ON public.story_views(story_id);
CREATE INDEX IF NOT EXISTS sv_viewer_id_idx ON public.story_views(viewer_id);

-- ══════════════════════════════════════════════════════════════════════
-- 2.8 RECOMMENDATIONS
-- Frontend: WirkerProfilePage, WirkerProfileDashboard
-- ══════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.recommendations (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wirker_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  reviewer_id   uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewer_name text,
  rating        integer CHECK (rating BETWEEN 1 AND 5),
  text          text,
  work_title    text,
  booking_id    uuid,
  created_at    timestamptz DEFAULT now()
);

ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS rec_select_all  ON public.recommendations;
DROP POLICY IF EXISTS rec_insert_auth ON public.recommendations;

CREATE POLICY rec_select_all  ON public.recommendations FOR SELECT USING (true);
CREATE POLICY rec_insert_auth ON public.recommendations FOR INSERT TO authenticated WITH CHECK (true);

CREATE INDEX IF NOT EXISTS rec_wirker_id_idx ON public.recommendations(wirker_id);

-- ─────────────────────────────────────────────────────────────────────
-- SCHRITT 3: BOOKING & PAYMENT TABLES
-- ─────────────────────────────────────────────────────────────────────

-- ══════════════════════════════════════════════════════════════════════
-- 3.1 BOOKINGS
-- Frontend erwartet: id, status, amount, total_amount, scheduled_at,
--   created_at, client_name, service_title, work_title,
--   works(title), experiences(title)
-- ══════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.bookings (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  wirker_id    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS work_id        uuid REFERENCES public.works(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS experience_id  uuid REFERENCES public.experiences(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS status         text      DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS amount         numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_amount   numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS scheduled_at   timestamptz,
  ADD COLUMN IF NOT EXISTS client_name    text,
  ADD COLUMN IF NOT EXISTS service_title  text,
  ADD COLUMN IF NOT EXISTS work_title     text,
  ADD COLUMN IF NOT EXISTS notes          text,
  ADD COLUMN IF NOT EXISTS escrow_status  text      DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS impact_fee     numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS commission     numeric(10,2) DEFAULT 0;

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS book_select_own ON public.bookings;
DROP POLICY IF EXISTS book_insert_own ON public.bookings;
DROP POLICY IF EXISTS book_update_own ON public.bookings;

CREATE POLICY book_select_own ON public.bookings FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = wirker_id);
CREATE POLICY book_insert_own ON public.bookings FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY book_update_own ON public.bookings FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = wirker_id);

CREATE INDEX IF NOT EXISTS book_user_id_idx   ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS book_wirker_id_idx ON public.bookings(wirker_id);
CREATE INDEX IF NOT EXISTS book_status_idx    ON public.bookings(status);

-- ══════════════════════════════════════════════════════════════════════
-- 3.2 PAYMENTS
-- Frontend: ImpactPage, ProfilePage
-- ══════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.payments (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  booking_id    uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  amount        numeric(10,2) DEFAULT 0,
  impact_amount numeric(10,2) DEFAULT 0,
  status        text          DEFAULT 'pending',
  stripe_id     text,
  created_at    timestamptz   DEFAULT now()
);

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS payment_method text,
  ADD COLUMN IF NOT EXISTS currency       text DEFAULT 'eur';

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS pay_select_own ON public.payments;
DROP POLICY IF EXISTS pay_insert_own ON public.payments;

CREATE POLICY pay_select_own ON public.payments FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY pay_insert_own ON public.payments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS pay_user_id_idx ON public.payments(user_id);

-- ══════════════════════════════════════════════════════════════════════
-- 3.3 PAYOUTS
-- Frontend: MeinHUI_SubPages
-- ══════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.payouts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wirker_id   uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  amount      numeric(10,2) DEFAULT 0,
  status      text          DEFAULT 'pending',
  created_at  timestamptz   DEFAULT now()
);

ALTER TABLE public.payouts
  ADD COLUMN IF NOT EXISTS payout_method text,
  ADD COLUMN IF NOT EXISTS reference     text;

ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS payout_select_own ON public.payouts;

CREATE POLICY payout_select_own ON public.payouts FOR SELECT TO authenticated USING (auth.uid() = wirker_id);

CREATE INDEX IF NOT EXISTS payout_wirker_id_idx ON public.payouts(wirker_id);

-- ─────────────────────────────────────────────────────────────────────
-- SCHRITT 4: MESSAGING TABLES
-- ─────────────────────────────────────────────────────────────────────

-- ══════════════════════════════════════════════════════════════════════
-- 4.1 CHATS
-- Frontend: MeinHUI_SubPages — user1_id, user2_id, booking_id
--   + nested: messages(text, created_at, sender_id, read)
-- ══════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.chats (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  user2_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  booking_id  uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now(),
  UNIQUE(user1_id, user2_id)
);

ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS chats_select_own ON public.chats;
DROP POLICY IF EXISTS chats_insert_own ON public.chats;

CREATE POLICY chats_select_own ON public.chats FOR SELECT TO authenticated
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);
CREATE POLICY chats_insert_own ON public.chats FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE INDEX IF NOT EXISTS chats_user1_idx ON public.chats(user1_id);
CREATE INDEX IF NOT EXISTS chats_user2_idx ON public.chats(user2_id);

-- ══════════════════════════════════════════════════════════════════════
-- 4.2 MESSAGES
-- Frontend erwartet: id, chat_id, sender_id, receiver_id, text, read,
--   created_at, image_url, background, story_id
-- ══════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.messages (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id     uuid REFERENCES public.chats(id) ON DELETE CASCADE,
  sender_id   uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  text        text,
  read        boolean     DEFAULT false,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS receiver_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS image_url   text,
  ADD COLUMN IF NOT EXISTS background  text,
  ADD COLUMN IF NOT EXISTS story_id    uuid REFERENCES public.stories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS message_type text DEFAULT 'text';

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS msg_select_own ON public.messages;
DROP POLICY IF EXISTS msg_insert_own ON public.messages;
DROP POLICY IF EXISTS msg_update_own ON public.messages;

CREATE POLICY msg_select_own ON public.messages FOR SELECT TO authenticated
  USING (
    auth.uid() = sender_id OR auth.uid() = receiver_id OR
    EXISTS (SELECT 1 FROM public.chats c WHERE c.id = chat_id AND
      (c.user1_id = auth.uid() OR c.user2_id = auth.uid()))
  );
CREATE POLICY msg_insert_own ON public.messages FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id);
CREATE POLICY msg_update_own ON public.messages FOR UPDATE TO authenticated
  USING (auth.uid() = receiver_id OR auth.uid() = sender_id);

CREATE INDEX IF NOT EXISTS msg_chat_id_idx    ON public.messages(chat_id);
CREATE INDEX IF NOT EXISTS msg_sender_id_idx  ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS msg_created_at_idx ON public.messages(created_at DESC);

-- ─────────────────────────────────────────────────────────────────────
-- SCHRITT 5: NOTIFICATION & SETTINGS TABLES
-- ─────────────────────────────────────────────────────────────────────

-- ══════════════════════════════════════════════════════════════════════
-- 5.1 NOTIFICATIONS
-- Frontend: NotificationCenter
-- ══════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.notifications (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  type        text NOT NULL,
  title       text,
  body        text,
  read        boolean     DEFAULT false,
  data        jsonb       DEFAULT '{}',
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS notif_select_own ON public.notifications;
DROP POLICY IF EXISTS notif_insert_any ON public.notifications;
DROP POLICY IF EXISTS notif_update_own ON public.notifications;

CREATE POLICY notif_select_own ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY notif_insert_any ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY notif_update_own ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS notif_user_id_idx   ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS notif_read_idx      ON public.notifications(read);
CREATE INDEX IF NOT EXISTS notif_created_idx   ON public.notifications(created_at DESC);

-- ══════════════════════════════════════════════════════════════════════
-- 5.2 NOTIFICATION_SETTINGS
-- Frontend: MeinHUI_SubPages
-- ══════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.notification_settings (
  user_id           uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email_bookings    boolean DEFAULT true,
  email_messages    boolean DEFAULT true,
  email_impact      boolean DEFAULT true,
  push_bookings     boolean DEFAULT true,
  push_messages     boolean DEFAULT true,
  push_impact       boolean DEFAULT false,
  updated_at        timestamptz DEFAULT now()
);

ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS ns_select_own ON public.notification_settings;
DROP POLICY IF EXISTS ns_upsert_own ON public.notification_settings;

CREATE POLICY ns_select_own ON public.notification_settings FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY ns_upsert_own ON public.notification_settings FOR ALL TO authenticated USING (auth.uid() = user_id);

-- ══════════════════════════════════════════════════════════════════════
-- 5.3 PRIVACY_SETTINGS
-- Frontend: MeinHUI_SubPages
-- ══════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.privacy_settings (
  user_id             uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_visibility  text    DEFAULT 'public',
  show_location       boolean DEFAULT true,
  show_availability   boolean DEFAULT true,
  allow_messages      boolean DEFAULT true,
  updated_at          timestamptz DEFAULT now()
);

ALTER TABLE public.privacy_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS ps_select_own ON public.privacy_settings;
DROP POLICY IF EXISTS ps_upsert_own ON public.privacy_settings;

CREATE POLICY ps_select_own ON public.privacy_settings FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY ps_upsert_own ON public.privacy_settings FOR ALL TO authenticated USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────
-- SCHRITT 6: IMPACT TABLES
-- ─────────────────────────────────────────────────────────────────────

-- ══════════════════════════════════════════════════════════════════════
-- 6.1 IMPACT_PROJECTS
-- Frontend: ImpactPage, MeinHUI_SubPages
-- ══════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.impact_projects (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  description   text,
  category      text,
  status        text        DEFAULT 'active',
  votes         integer     DEFAULT 0,
  awarded_eur   numeric(10,2) DEFAULT 0,
  month         text,
  website       text,
  contact_name  text,
  contact_email text,
  impact_report text,
  tags          text[]      DEFAULT '{}',
  icon          text,
  color         text,
  created_at    timestamptz DEFAULT now()
);

ALTER TABLE public.impact_projects
  ADD COLUMN IF NOT EXISTS distributed_at timestamptz;

ALTER TABLE public.impact_projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS ip_select_all ON public.impact_projects;
DROP POLICY IF EXISTS ip_insert_admin ON public.impact_projects;

CREATE POLICY ip_select_all ON public.impact_projects FOR SELECT USING (true);
CREATE POLICY ip_insert_admin ON public.impact_projects FOR INSERT TO authenticated WITH CHECK (true);

-- ══════════════════════════════════════════════════════════════════════
-- 6.2 IMPACT_VOTES
-- Frontend: ImpactPage, MeinHUI_SubPages
-- ══════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.impact_votes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.impact_projects(id) ON DELETE CASCADE,
  user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  month      text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, month)
);

ALTER TABLE public.impact_votes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS iv_select_own  ON public.impact_votes;
DROP POLICY IF EXISTS iv_insert_own  ON public.impact_votes;

CREATE POLICY iv_select_own ON public.impact_votes FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY iv_insert_own ON public.impact_votes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS iv_user_id_idx   ON public.impact_votes(user_id);
CREATE INDEX IF NOT EXISTS iv_project_id_idx ON public.impact_votes(project_id);

-- ─────────────────────────────────────────────────────────────────────
-- SCHRITT 7: AVAILABILITY & MEDIA TABLES
-- ─────────────────────────────────────────────────────────────────────

-- ══════════════════════════════════════════════════════════════════════
-- 7.1 AVAILABILITY_SLOTS
-- Frontend: MeinHUI_SubPages
-- ══════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.availability_slots (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wirker_id   uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  day_of_week integer CHECK (day_of_week BETWEEN 0 AND 6),
  start_time  time,
  end_time    time,
  is_available boolean DEFAULT true,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE public.availability_slots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS avail_select_all ON public.availability_slots;
DROP POLICY IF EXISTS avail_insert_own ON public.availability_slots;
DROP POLICY IF EXISTS avail_update_own ON public.availability_slots;

CREATE POLICY avail_select_all ON public.availability_slots FOR SELECT USING (true);
CREATE POLICY avail_insert_own ON public.availability_slots FOR INSERT TO authenticated WITH CHECK (auth.uid() = wirker_id);
CREATE POLICY avail_update_own ON public.availability_slots FOR UPDATE TO authenticated USING (auth.uid() = wirker_id);

CREATE INDEX IF NOT EXISTS avail_wirker_id_idx ON public.availability_slots(wirker_id);

-- ══════════════════════════════════════════════════════════════════════
-- 7.2 MEDIA (Asset-Tabelle für Uploads)
-- Frontend: HuiCreateFlow, WerkPublisher, ExperienceCreator
-- ══════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.media (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  type             text,
  mime             text,
  storage_path     text,
  storage_bucket   text,
  url              text,
  compression_state text DEFAULT 'done',
  created_at       timestamptz DEFAULT now()
);

ALTER TABLE public.media
  ADD COLUMN IF NOT EXISTS caption     text,
  ADD COLUMN IF NOT EXISTS media_url   text,
  ADD COLUMN IF NOT EXISTS media_type  text,
  ADD COLUMN IF NOT EXISTS content_id  uuid,
  ADD COLUMN IF NOT EXISTS width       integer,
  ADD COLUMN IF NOT EXISTS height      integer;

ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS media_select_all ON public.media;
DROP POLICY IF EXISTS media_insert_own ON public.media;

CREATE POLICY media_select_all ON public.media FOR SELECT USING (true);
CREATE POLICY media_insert_own ON public.media FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS media_user_id_idx ON public.media(user_id);

-- ══════════════════════════════════════════════════════════════════════
-- 7.3 FEED_ITEMS (universeller Feed-Index)
-- Frontend: UniversalPostFlow
-- ══════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.feed_items (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  content_id   uuid NOT NULL,
  content_type text NOT NULL,  -- 'work', 'story', 'experience'
  caption      text,
  status       text        DEFAULT 'published',
  created_at   timestamptz DEFAULT now(),
  expires_at   timestamptz
);

ALTER TABLE public.feed_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS fi_select_all ON public.feed_items;
DROP POLICY IF EXISTS fi_insert_own ON public.feed_items;

CREATE POLICY fi_select_all ON public.feed_items FOR SELECT USING (true);
CREATE POLICY fi_insert_own ON public.feed_items FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS fi_user_id_idx    ON public.feed_items(user_id);
CREATE INDEX IF NOT EXISTS fi_created_at_idx ON public.feed_items(created_at DESC);

-- ─────────────────────────────────────────────────────────────────────
-- SCHRITT 8: STORAGE BUCKETS
-- ─────────────────────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('media',       'media',       true, 52428800,
   ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/gif','image/heic',
         'video/mp4','video/webm','video/quicktime','video/mov']),
  ('stories',     'stories',     true, 52428800,
   ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/gif','image/heic',
         'video/mp4','video/webm','video/quicktime','video/mov']),
  ('works',       'works',       true, 52428800,
   ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/gif','image/heic',
         'video/mp4','video/webm','video/quicktime']),
  ('experiences', 'experiences', true, 52428800,
   ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/gif','image/heic',
         'video/mp4','video/webm','video/quicktime']),
  ('avatars',     'avatars',     true, 10485760,
   ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/gif','image/heic'])
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = EXCLUDED.file_size_limit;

-- Storage RLS — alle Buckets
DO $$
DECLARE b text;
BEGIN
  FOREACH b IN ARRAY ARRAY['media','stories','works','experiences','avatars'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS hui_stor_upload_%s ON storage.objects', b);
    EXECUTE format('DROP POLICY IF EXISTS hui_stor_select_%s ON storage.objects', b);
    EXECUTE format('DROP POLICY IF EXISTS hui_stor_delete_%s ON storage.objects', b);

    EXECUTE format(
      'CREATE POLICY hui_stor_upload_%s ON storage.objects
       FOR INSERT TO authenticated
       WITH CHECK (bucket_id = %L)', b, b);

    EXECUTE format(
      'CREATE POLICY hui_stor_select_%s ON storage.objects
       FOR SELECT USING (bucket_id = %L)', b, b);

    EXECUTE format(
      'CREATE POLICY hui_stor_delete_%s ON storage.objects
       FOR DELETE TO authenticated
       USING (bucket_id = %L AND owner = auth.uid()::text)', b, b);
  END LOOP;
END $$;

-- ─────────────────────────────────────────────────────────────────────
-- SCHRITT 9: DATA RECOVERY — bestehende Rows reparieren
-- ─────────────────────────────────────────────────────────────────────

-- Works: media_url aus images recovern
UPDATE public.works
SET media_url = COALESCE(cover_url, images[1])
WHERE media_url IS NULL AND (cover_url IS NOT NULL OR (images IS NOT NULL AND array_length(images,1) > 0));

-- Works: status setzen
UPDATE public.works SET status = 'published'
WHERE (status IS NULL OR status = '') AND (state IS NULL OR state = 'published' OR state = 'active');

-- Experiences: status setzen
UPDATE public.experiences SET status = 'published'
WHERE status IS NULL OR status = '';

UPDATE public.experiences SET media_url = cover_url
WHERE media_url IS NULL AND cover_url IS NOT NULL;

-- Stories: status setzen
UPDATE public.stories SET status = 'published'
WHERE status IS NULL OR status = '';

-- Profiles: follower_count sync
UPDATE public.profiles
SET follower_count = COALESCE(followers_count, 0),
    followers_count = COALESCE(followers_count, 0)
WHERE follower_count IS DISTINCT FROM followers_count;

-- ─────────────────────────────────────────────────────────────────────
-- SCHRITT 10: VERIFIKATION
-- ─────────────────────────────────────────────────────────────────────

SELECT
  'SCHEMA AUDIT COMPLETE' AS status,
  NOW() AS timestamp,
  (SELECT COUNT(*) FROM public.works)         AS works_total,
  (SELECT COUNT(*) FROM public.works WHERE status='published') AS works_published,
  (SELECT COUNT(*) FROM public.works WHERE media_url IS NOT NULL) AS works_with_media,
  (SELECT COUNT(*) FROM public.stories)       AS stories_total,
  (SELECT COUNT(*) FROM public.stories WHERE status='published') AS stories_published,
  (SELECT COUNT(*) FROM public.experiences)   AS exp_total,
  (SELECT COUNT(*) FROM public.profiles)      AS profiles_total;

-- Zeige alle Spalten der kritischen Tabellen
SELECT table_name, column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('works','stories','experiences','profiles','wirker_profiles',
                     'bookings','messages','chats','notifications')
ORDER BY table_name, ordinal_position;

-- Schema-Cache flushen
NOTIFY pgrst, 'reload schema';

SELECT '✓ HUI 024 Master Schema abgeschlossen' AS result,
       NOW() AS completed_at;
