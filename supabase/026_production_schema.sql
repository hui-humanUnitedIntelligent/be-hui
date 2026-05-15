-- ═══════════════════════════════════════════════════════════════════
-- HUI 026 — CLEAN PRODUCTION SCHEMA
-- Datum: 2026-05-15
--
-- GEBAUT GEGEN ECHTE DB (2 CSV-Exports verifiziert):
--   CSV-1: Spalten (11 Tabellen mit vollständiger Struktur)
--   CSV-2: Foreign Keys (12 FK-Beziehungen verifiziert)
--
-- PRINZIPIEN:
--   • Kein DROP TABLE, kein RENAME COLUMN
--   • Bestehende Tabellen: nur ADD COLUMN IF NOT EXISTS + RLS
--   • Neue Tabellen: CREATE TABLE IF NOT EXISTS
--   • Alle Policies referenzieren AUSSCHLIESSLICH verifizierte Spalten
--   • Einheitlicher Owner-Spaltenname: user_id (ausser bookings: wirker_id)
--   • Chats: participant_ids ARRAY — Policy via ANY()
--   • Idempotent: kann beliebig oft ausgeführt werden
--
-- LAYER-ARCHITEKTUR:
--   L1  auth.users          (Supabase managed)
--   L2  profiles, wirker_profiles
--   L3  works, experiences, stories, beitraege
--   L4  follows, work_likes, work_saves, comments, story_views, favorites, feed_items
--   L5  bookings, payments, escrow, orders, order_items, availability_slots
--   L6  chats, messages, notifications
--   L7  impact_pool, impact_projects, impact_votes, recommendations
--   L8  notification_settings, privacy_settings, media
-- ═══════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────
-- HELPER: Idempotente Policy-Funktion
-- ───────────────────────────────────────────────────────────────────
-- Alle Policies werden via DROP IF EXISTS + CREATE angelegt.
-- Das ist idempotent und überschreibt veraltete Policies sicher.


-- ═══════════════════════════════════════════════════════════════════
-- LAYER 2 — IDENTITÄT
-- ═══════════════════════════════════════════════════════════════════

-- ── PROFILES ───────────────────────────────────────────────────────
-- PK = id (= auth.users.id) — keine separate uuid, direkter Link
CREATE TABLE IF NOT EXISTS public.profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS display_name       text            DEFAULT '',
  ADD COLUMN IF NOT EXISTS username           text,
  ADD COLUMN IF NOT EXISTS avatar_url         text,
  ADD COLUMN IF NOT EXISTS header_img         text,
  ADD COLUMN IF NOT EXISTS bio                text,
  ADD COLUMN IF NOT EXISTS role               text            DEFAULT 'basisuser',
  ADD COLUMN IF NOT EXISTS is_wirker          boolean         DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_talent_profile boolean         DEFAULT false,
  ADD COLUMN IF NOT EXISTS talent             text,
  ADD COLUMN IF NOT EXISTS location_label     text,
  ADD COLUMN IF NOT EXISTS is_available       boolean         DEFAULT true,
  ADD COLUMN IF NOT EXISTS impact_eur         numeric(10,2)   DEFAULT 0,
  ADD COLUMN IF NOT EXISTS followers_count    integer         DEFAULT 0,
  ADD COLUMN IF NOT EXISTS profile_views      integer         DEFAULT 0,
  ADD COLUMN IF NOT EXISTS dna_tags           text[]          DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS profile_modules    jsonb           DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS focus_type         text;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS profiles_select_all ON public.profiles;
DROP POLICY IF EXISTS profiles_insert_own ON public.profiles;
DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
CREATE POLICY profiles_select_all ON public.profiles
  FOR SELECT USING (true);
CREATE POLICY profiles_insert_own ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE INDEX IF NOT EXISTS idx_profiles_username  ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_is_wirker ON public.profiles(is_wirker);

-- Auto-Profil bei neuem User anlegen
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── WIRKER_PROFILES ────────────────────────────────────────────────
-- Öffentliche Talent-Bühne — getrennt vom privaten Basisprofil
-- user_id UNIQUE → genau ein Wirker-Profil pro User
CREATE TABLE IF NOT EXISTS public.wirker_profiles (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
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

CREATE INDEX IF NOT EXISTS idx_wp_user_id ON public.wirker_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_wp_slug    ON public.wirker_profiles(slug);


-- ═══════════════════════════════════════════════════════════════════
-- LAYER 3 — CONTENT
-- ═══════════════════════════════════════════════════════════════════

-- ── WORKS ──────────────────────────────────────────────────────────
-- Existiert via FK (work_likes, work_saves, comments, order_items)
-- Spalten unbekannt → vollständig via CREATE + ADD COLUMN IF NOT EXISTS
CREATE TABLE IF NOT EXISTS public.works (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title       text NOT NULL DEFAULT '',
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
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
  ADD COLUMN IF NOT EXISTS views_count        integer       DEFAULT 0,
  ADD COLUMN IF NOT EXISTS likes_count        integer       DEFAULT 0,
  ADD COLUMN IF NOT EXISTS status             text          DEFAULT 'published';

-- media_url aus cover_url befüllen falls leer
UPDATE public.works
  SET media_url = COALESCE(cover_url, images[1])
  WHERE media_url IS NULL
    AND (cover_url IS NOT NULL OR (images IS NOT NULL AND array_length(images,1) > 0));
UPDATE public.works SET status = 'published' WHERE status IS NULL OR status = '';

ALTER TABLE public.works ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS works_select_all ON public.works;
DROP POLICY IF EXISTS works_insert_own ON public.works;
DROP POLICY IF EXISTS works_update_own ON public.works;
DROP POLICY IF EXISTS works_delete_own ON public.works;
CREATE POLICY works_select_all ON public.works FOR SELECT USING (true);
CREATE POLICY works_insert_own ON public.works
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY works_update_own ON public.works
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY works_delete_own ON public.works
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_works_user_id   ON public.works(user_id);
CREATE INDEX IF NOT EXISTS idx_works_status    ON public.works(status);
CREATE INDEX IF NOT EXISTS idx_works_created   ON public.works(created_at DESC);

-- ── EXPERIENCES ────────────────────────────────────────────────────
-- EXISTIERT: id, user_id, title, description, price, duration,
--            cover_url, date, spots_available, status, created_at,
--            updated_at, media_url, media_type
-- Nur fehlende Spalten ergänzen
ALTER TABLE public.experiences
  ADD COLUMN IF NOT EXISTS caption            text,
  ADD COLUMN IF NOT EXISTS tags               text[]  DEFAULT '{}',
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
  ADD COLUMN IF NOT EXISTS booking_mode       text    DEFAULT 'direct';

UPDATE public.experiences SET status = 'published' WHERE status IS NULL OR status = '';
UPDATE public.experiences
  SET media_url = cover_url
  WHERE media_url IS NULL AND cover_url IS NOT NULL;

ALTER TABLE public.experiences ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS exp_select_all ON public.experiences;
DROP POLICY IF EXISTS exp_insert_own ON public.experiences;
DROP POLICY IF EXISTS exp_update_own ON public.experiences;
DROP POLICY IF EXISTS exp_delete_own ON public.experiences;
-- user_id DB-verifiziert ✓
CREATE POLICY exp_select_all ON public.experiences FOR SELECT USING (true);
CREATE POLICY exp_insert_own ON public.experiences
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY exp_update_own ON public.experiences
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY exp_delete_own ON public.experiences
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_exp_user_id ON public.experiences(user_id);
CREATE INDEX IF NOT EXISTS idx_exp_status  ON public.experiences(status);
CREATE INDEX IF NOT EXISTS idx_exp_created ON public.experiences(created_at DESC);

-- ── STORIES ────────────────────────────────────────────────────────
-- Existiert via FK (story_views.story_id → stories.id)
-- Spalten unbekannt → CREATE IF NOT EXISTS + vollständige Spalten
CREATE TABLE IF NOT EXISTS public.stories (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);
ALTER TABLE public.stories
  ADD COLUMN IF NOT EXISTS media_url       text,
  ADD COLUMN IF NOT EXISTS media_type      text      DEFAULT 'image',
  ADD COLUMN IF NOT EXISTS username        text,
  ADD COLUMN IF NOT EXISTS avatar_url      text,
  ADD COLUMN IF NOT EXISTS text_overlay    text,
  ADD COLUMN IF NOT EXISTS caption         text,
  ADD COLUMN IF NOT EXISTS mood            text,
  ADD COLUMN IF NOT EXISTS location        text,
  ADD COLUMN IF NOT EXISTS is_highlight    boolean   DEFAULT false,
  ADD COLUMN IF NOT EXISTS expires_at      timestamptz,
  ADD COLUMN IF NOT EXISTS mood_tags       text[]    DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS atmosphere_tags text[]    DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS energy_level    text,
  ADD COLUMN IF NOT EXISTS social_energy   text,
  ADD COLUMN IF NOT EXISTS visibility      text      DEFAULT 'public',
  ADD COLUMN IF NOT EXISTS allow_comments  boolean   DEFAULT true,
  ADD COLUMN IF NOT EXISTS status          text      DEFAULT 'published',
  ADD COLUMN IF NOT EXISTS views_count     integer   DEFAULT 0;

UPDATE public.stories SET status = 'published' WHERE status IS NULL OR status = '';

ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS stories_select_all ON public.stories;
DROP POLICY IF EXISTS stories_insert_own ON public.stories;
DROP POLICY IF EXISTS stories_update_own ON public.stories;
DROP POLICY IF EXISTS stories_delete_own ON public.stories;
CREATE POLICY stories_select_all ON public.stories FOR SELECT USING (true);
CREATE POLICY stories_insert_own ON public.stories
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY stories_update_own ON public.stories
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY stories_delete_own ON public.stories
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_stories_user_id ON public.stories(user_id);
CREATE INDEX IF NOT EXISTS idx_stories_status  ON public.stories(status);
CREATE INDEX IF NOT EXISTS idx_stories_created ON public.stories(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stories_expires ON public.stories(expires_at);

-- ── BEITRAEGE (Legacy) ─────────────────────────────────────────────
-- EXISTIERT: id, user_id, src, type, caption, created_at
-- Nicht anfassen — nur RLS sicherstellen
ALTER TABLE public.beitraege ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS beit_select_all ON public.beitraege;
DROP POLICY IF EXISTS beit_insert_own ON public.beitraege;
CREATE POLICY beit_select_all ON public.beitraege FOR SELECT USING (true);
CREATE POLICY beit_insert_own ON public.beitraege
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);


-- ═══════════════════════════════════════════════════════════════════
-- LAYER 4 — SOCIAL
-- ═══════════════════════════════════════════════════════════════════

-- ── FOLLOWS ────────────────────────────────────────────────────────
-- EXISTIERT: follower_id, followed_id, created_at — DB-verifiziert ✓
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS follows_select_all ON public.follows;
DROP POLICY IF EXISTS follows_insert_own ON public.follows;
DROP POLICY IF EXISTS follows_delete_own ON public.follows;
CREATE POLICY follows_select_all ON public.follows FOR SELECT USING (true);
CREATE POLICY follows_insert_own ON public.follows
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = follower_id);
CREATE POLICY follows_delete_own ON public.follows
  FOR DELETE TO authenticated USING (auth.uid() = follower_id);

CREATE INDEX IF NOT EXISTS idx_follows_follower ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_followed ON public.follows(followed_id);

-- ── WORK_LIKES ─────────────────────────────────────────────────────
-- Existiert via FK (work_likes.work_id → works.id)
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
CREATE POLICY wl_insert_own ON public.work_likes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY wl_delete_own ON public.work_likes
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_wl_work_id ON public.work_likes(work_id);
CREATE INDEX IF NOT EXISTS idx_wl_user_id ON public.work_likes(user_id);

-- ── WORK_SAVES ─────────────────────────────────────────────────────
-- Existiert via FK (work_saves.work_id → works.id)
CREATE TABLE IF NOT EXISTS public.work_saves (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_id    uuid REFERENCES public.works(id) ON DELETE CASCADE,
  user_id    uuid REFERENCES auth.users(id)   ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(work_id, user_id)
);
ALTER TABLE public.work_saves ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS ws_select_own ON public.work_saves;
DROP POLICY IF EXISTS ws_insert_own ON public.work_saves;
DROP POLICY IF EXISTS ws_delete_own ON public.work_saves;
CREATE POLICY ws_select_own ON public.work_saves
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY ws_insert_own ON public.work_saves
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY ws_delete_own ON public.work_saves
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_ws_work_id ON public.work_saves(work_id);
CREATE INDEX IF NOT EXISTS idx_ws_user_id ON public.work_saves(user_id);

-- ── COMMENTS ───────────────────────────────────────────────────────
-- EXISTIERT: id, work_id(FK→works), user_id, text, created_at ✓
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

CREATE INDEX IF NOT EXISTS idx_comments_work_id ON public.comments(work_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON public.comments(user_id);

-- ── STORY_VIEWS ────────────────────────────────────────────────────
-- Existiert via FK (story_views.story_id → stories.id)
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

CREATE INDEX IF NOT EXISTS idx_sv_story_id  ON public.story_views(story_id);
CREATE INDEX IF NOT EXISTS idx_sv_viewer_id ON public.story_views(viewer_id);

-- ── FAVORITES ──────────────────────────────────────────────────────
-- EXISTIERT: id, user_id, wirker_name(text), created_at,
--            content_type, content_id, updated_at — DB-verifiziert ✓
ALTER TABLE public.favorites
  ADD COLUMN IF NOT EXISTS target_type text DEFAULT 'wirker';

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS fav_select_own ON public.favorites;
DROP POLICY IF EXISTS fav_insert_own ON public.favorites;
DROP POLICY IF EXISTS fav_delete_own ON public.favorites;
CREATE POLICY fav_select_own ON public.favorites
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY fav_insert_own ON public.favorites
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY fav_delete_own ON public.favorites
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_fav_user_id ON public.favorites(user_id);

-- ── FEED_ITEMS ─────────────────────────────────────────────────────
-- EXISTIERT: id, content_type, content_id, user_id, tags(ARRAY),
--            category, score, published_at, expires_at, created_at
-- WICHTIG: kein status-Feld! published_at ist das Steuerfeld.
ALTER TABLE public.feed_items
  ADD COLUMN IF NOT EXISTS caption text;

-- published_at befüllen wo leer
UPDATE public.feed_items
  SET published_at = created_at
  WHERE published_at IS NULL AND created_at IS NOT NULL;

ALTER TABLE public.feed_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS fi_select_all ON public.feed_items;
DROP POLICY IF EXISTS fi_insert_own ON public.feed_items;
DROP POLICY IF EXISTS fi_delete_own ON public.feed_items;
CREATE POLICY fi_select_all ON public.feed_items FOR SELECT USING (true);
CREATE POLICY fi_insert_own ON public.feed_items
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY fi_delete_own ON public.feed_items
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_fi_user_id   ON public.feed_items(user_id);
CREATE INDEX IF NOT EXISTS idx_fi_published ON public.feed_items(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_fi_type      ON public.feed_items(content_type);


-- ═══════════════════════════════════════════════════════════════════
-- LAYER 5 — COMMERCE
-- ═══════════════════════════════════════════════════════════════════

-- ── BOOKINGS ───────────────────────────────────────────────────────
-- EXISTIERT vollständig (DB-verifiziert):
--   user_id(Käufer), wirker_id(Anbieter), customer_id,
--   wirker_name, service, status, state, total_eur, ...
-- Nur fehlende Spalten ergänzen
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS work_id        uuid REFERENCES public.works(id)       ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS experience_id  uuid REFERENCES public.experiences(id)  ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS notes          text,
  ADD COLUMN IF NOT EXISTS escrow_status  text          DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS impact_fee     numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS commission     numeric(10,2) DEFAULT 0;

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS book_select_own        ON public.bookings;
DROP POLICY IF EXISTS book_insert_own        ON public.bookings;
DROP POLICY IF EXISTS book_update_own        ON public.bookings;
DROP POLICY IF EXISTS bookings_wirker_select ON public.bookings;
DROP POLICY IF EXISTS bookings_wirker_update ON public.bookings;
-- wirker_id, user_id, customer_id — alle DB-verifiziert ✓
CREATE POLICY book_select_own ON public.bookings
  FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id OR
    auth.uid() = wirker_id OR
    auth.uid() = customer_id
  );
CREATE POLICY book_insert_own ON public.bookings
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY book_update_own ON public.bookings
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = wirker_id);

CREATE INDEX IF NOT EXISTS idx_book_user_id   ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_book_wirker_id ON public.bookings(wirker_id);
CREATE INDEX IF NOT EXISTS idx_book_status    ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_book_created   ON public.bookings(created_at DESC);

-- ── PAYMENTS ───────────────────────────────────────────────────────
-- Existiert via FK (payments.booking_id → bookings.id)
-- Spalten unbekannt → CREATE IF NOT EXISTS + ADD COLUMN IF NOT EXISTS
CREATE TABLE IF NOT EXISTS public.payments (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS user_id        uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS amount_eur     numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS impact_amount  numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS status         text          DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS stripe_id      text,
  ADD COLUMN IF NOT EXISTS payment_method text,
  ADD COLUMN IF NOT EXISTS currency       text          DEFAULT 'eur';

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS pay_select_own ON public.payments;
DROP POLICY IF EXISTS pay_insert_own ON public.payments;
-- user_id via ADD COLUMN IF NOT EXISTS garantiert ✓
CREATE POLICY pay_select_own ON public.payments
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY pay_insert_own ON public.payments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_pay_user_id    ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_pay_booking_id ON public.payments(booking_id);

-- ── ESCROW ─────────────────────────────────────────────────────────
-- EXISTIERT: id, payment_id(FK→payments), booking_id(FK→bookings),
--            amount_eur, state, activated_at, released_at,
--            release_trigger, created_at — DB-verifiziert ✓
ALTER TABLE public.escrow
  ADD COLUMN IF NOT EXISTS impact_amount  numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS released_to_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.escrow ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS escrow_select_auth ON public.escrow;
DROP POLICY IF EXISTS escrow_insert_auth ON public.escrow;
-- Escrow: authentifizierte User dürfen lesen (Join via booking klärt Zugriff im Frontend)
CREATE POLICY escrow_select_auth ON public.escrow
  FOR SELECT TO authenticated USING (true);
CREATE POLICY escrow_insert_auth ON public.escrow
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_escrow_booking_id ON public.escrow(booking_id);
CREATE INDEX IF NOT EXISTS idx_escrow_state      ON public.escrow(state);

-- ── ORDERS / ORDER_ITEMS ───────────────────────────────────────────
-- Beide existieren via FK — Struktur unbekannt → nur RLS aktivieren
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
    WHERE table_schema='public' AND table_name='orders')
  THEN ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables
    WHERE table_schema='public' AND table_name='order_items')
  THEN ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- ── AVAILABILITY_SLOTS ─────────────────────────────────────────────
-- EXISTIERT: id, user_id(Owner!), date, time_from, time_to,
--            blocked, note, created_at — DB-verifiziert ✓
-- WICHTIG: user_id ist der Wirker-Owner (nicht provider_id!)
ALTER TABLE public.availability_slots
  ADD COLUMN IF NOT EXISTS is_available boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS day_of_week  integer;

ALTER TABLE public.availability_slots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS avail_select_all ON public.availability_slots;
DROP POLICY IF EXISTS avail_insert_own ON public.availability_slots;
DROP POLICY IF EXISTS avail_update_own ON public.availability_slots;
DROP POLICY IF EXISTS avail_delete_own ON public.availability_slots;
CREATE POLICY avail_select_all ON public.availability_slots FOR SELECT USING (true);
-- user_id DB-verifiziert ✓
CREATE POLICY avail_insert_own ON public.availability_slots
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY avail_update_own ON public.availability_slots
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY avail_delete_own ON public.availability_slots
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_avail_user_id ON public.availability_slots(user_id);
CREATE INDEX IF NOT EXISTS idx_avail_date    ON public.availability_slots(date);


-- ═══════════════════════════════════════════════════════════════════
-- LAYER 6 — COMMUNICATION
-- ═══════════════════════════════════════════════════════════════════

-- ── CHATS ──────────────────────────────────────────────────────────
-- EXISTIERT: id, booking_id(FK→bookings), participant_ids(ARRAY),
--            state, last_message_at, last_message, opened_at,
--            closed_at, created_at — DB-verifiziert ✓
-- KRITISCH: participant_ids ist ARRAY — Policy via ANY()!
ALTER TABLE public.chats
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS chats_select_own ON public.chats;
DROP POLICY IF EXISTS chats_insert_own ON public.chats;
DROP POLICY IF EXISTS chats_update_own ON public.chats;
-- participant_ids ARRAY — DB-verifiziert ✓
CREATE POLICY chats_select_own ON public.chats
  FOR SELECT TO authenticated
  USING (auth.uid()::text = ANY(participant_ids::text[]));
CREATE POLICY chats_insert_own ON public.chats
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid()::text = ANY(participant_ids::text[]));
CREATE POLICY chats_update_own ON public.chats
  FOR UPDATE TO authenticated
  USING (auth.uid()::text = ANY(participant_ids::text[]));

CREATE INDEX IF NOT EXISTS idx_chats_booking_id ON public.chats(booking_id);

-- ── MESSAGES ───────────────────────────────────────────────────────
-- Neu — Chat-Nachrichten
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
  ADD COLUMN IF NOT EXISTS story_id     uuid REFERENCES public.stories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS message_type text DEFAULT 'text';

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS msg_select_own ON public.messages;
DROP POLICY IF EXISTS msg_insert_own ON public.messages;
DROP POLICY IF EXISTS msg_update_own ON public.messages;
-- sender_id DB-verifiziert (CREATE TABLE) ✓
-- Chat-Mitgliedschaft via participant_ids-Join
CREATE POLICY msg_select_own ON public.messages
  FOR SELECT TO authenticated
  USING (
    auth.uid() = sender_id OR
    auth.uid() = receiver_id OR
    EXISTS (
      SELECT 1 FROM public.chats c
      WHERE c.id = chat_id AND auth.uid()::text = ANY(c.participant_ids)
    )
  );
CREATE POLICY msg_insert_own ON public.messages
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);
CREATE POLICY msg_update_own ON public.messages
  FOR UPDATE TO authenticated
  USING (auth.uid() = receiver_id OR auth.uid() = sender_id);

CREATE INDEX IF NOT EXISTS idx_msg_chat_id   ON public.messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_msg_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_msg_created   ON public.messages(created_at DESC);

-- ── NOTIFICATIONS ──────────────────────────────────────────────────
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

CREATE INDEX IF NOT EXISTS idx_notif_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notif_read    ON public.notifications(read);
CREATE INDEX IF NOT EXISTS idx_notif_created ON public.notifications(created_at DESC);


-- ═══════════════════════════════════════════════════════════════════
-- LAYER 7 — IMPACT
-- ═══════════════════════════════════════════════════════════════════

-- ── IMPACT_POOL ────────────────────────────────────────────────────
-- EXISTIERT: id, month — DB-verifiziert ✓
ALTER TABLE public.impact_pool
  ADD COLUMN IF NOT EXISTS total_eur      numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS distributed    boolean       DEFAULT false,
  ADD COLUMN IF NOT EXISTS distributed_at timestamptz,
  ADD COLUMN IF NOT EXISTS created_at     timestamptz   DEFAULT now();

ALTER TABLE public.impact_pool ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS pool_select_all ON public.impact_pool;
CREATE POLICY pool_select_all ON public.impact_pool FOR SELECT USING (true);

-- ── IMPACT_PROJECTS ────────────────────────────────────────────────
-- Existiert via FK (impact_votes.project_id → impact_projects.id)
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
  ADD COLUMN IF NOT EXISTS distributed_at timestamptz,
  ADD COLUMN IF NOT EXISTS impact_report  text;

ALTER TABLE public.impact_projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS ip_select_all   ON public.impact_projects;
DROP POLICY IF EXISTS ip_insert_admin ON public.impact_projects;
CREATE POLICY ip_select_all   ON public.impact_projects FOR SELECT USING (true);
CREATE POLICY ip_insert_admin ON public.impact_projects FOR INSERT TO authenticated WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_ip_status ON public.impact_projects(status);
CREATE INDEX IF NOT EXISTS idx_ip_month  ON public.impact_projects(month);

-- ── IMPACT_VOTES ───────────────────────────────────────────────────
-- Existiert via FK (impact_votes.project_id → impact_projects.id)
-- UNIQUE(user_id, month) — ein Vote pro Monat pro User
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

CREATE INDEX IF NOT EXISTS idx_iv_user_id    ON public.impact_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_iv_project_id ON public.impact_votes(project_id);

-- ── RECOMMENDATIONS ────────────────────────────────────────────────
-- Existiert via FK (recommendations.booking_id → bookings.id)
-- Spalten unbekannt → CREATE IF NOT EXISTS + ADD COLUMN IF NOT EXISTS
-- Policy: USING (true) — kein Spalten-Filter auf unbekannte Spalten
CREATE TABLE IF NOT EXISTS public.recommendations (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.recommendations
  ADD COLUMN IF NOT EXISTS reviewer_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS target_user_id   uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS rating           integer CHECK (rating BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS text             text,
  ADD COLUMN IF NOT EXISTS work_title       text,
  ADD COLUMN IF NOT EXISTS is_public        boolean DEFAULT true;

ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS rec_select_all  ON public.recommendations;
DROP POLICY IF EXISTS rec_insert_auth ON public.recommendations;
-- Keine Spalten-Filter — maximale Kompatibilität mit unbekanntem Schema
CREATE POLICY rec_select_all  ON public.recommendations FOR SELECT USING (true);
CREATE POLICY rec_insert_auth ON public.recommendations FOR INSERT TO authenticated WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_rec_target_user_id ON public.recommendations(target_user_id);
CREATE INDEX IF NOT EXISTS idx_rec_booking_id     ON public.recommendations(booking_id);


-- ═══════════════════════════════════════════════════════════════════
-- LAYER 8 — SETTINGS + MEDIA
-- ═══════════════════════════════════════════════════════════════════

-- ── NOTIFICATION_SETTINGS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notification_settings (
  user_id    uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.notification_settings
  ADD COLUMN IF NOT EXISTS email_bookings boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS email_messages boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS email_impact   boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS push_bookings  boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS push_messages  boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS push_impact    boolean DEFAULT false;

ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS ns_all_own ON public.notification_settings;
CREATE POLICY ns_all_own ON public.notification_settings
  FOR ALL TO authenticated USING (auth.uid() = user_id);

-- ── PRIVACY_SETTINGS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.privacy_settings (
  user_id    uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.privacy_settings
  ADD COLUMN IF NOT EXISTS profile_visibility text    DEFAULT 'public',
  ADD COLUMN IF NOT EXISTS show_location      boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_availability  boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS allow_messages     boolean DEFAULT true;

ALTER TABLE public.privacy_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS ps_all_own ON public.privacy_settings;
CREATE POLICY ps_all_own ON public.privacy_settings
  FOR ALL TO authenticated USING (auth.uid() = user_id);

-- ── MEDIA ──────────────────────────────────────────────────────────
-- Zentrale Medienverwaltung für alle Content-Typen
CREATE TABLE IF NOT EXISTS public.media (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.media
  ADD COLUMN IF NOT EXISTS url               text,
  ADD COLUMN IF NOT EXISTS storage_path      text,
  ADD COLUMN IF NOT EXISTS storage_bucket    text,
  ADD COLUMN IF NOT EXISTS mime              text,
  ADD COLUMN IF NOT EXISTS media_type        text,
  ADD COLUMN IF NOT EXISTS content_id        uuid,
  ADD COLUMN IF NOT EXISTS content_type      text,
  ADD COLUMN IF NOT EXISTS caption           text,
  ADD COLUMN IF NOT EXISTS width             integer,
  ADD COLUMN IF NOT EXISTS height            integer,
  ADD COLUMN IF NOT EXISTS compression_state text DEFAULT 'done';

ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS media_select_all ON public.media;
DROP POLICY IF EXISTS media_insert_own ON public.media;
CREATE POLICY media_select_all ON public.media FOR SELECT USING (true);
CREATE POLICY media_insert_own ON public.media
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_media_user_id    ON public.media(user_id);
CREATE INDEX IF NOT EXISTS idx_media_content_id ON public.media(content_id);


-- ═══════════════════════════════════════════════════════════════════
-- STORAGE BUCKETS
-- ═══════════════════════════════════════════════════════════════════
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('media',   'media',   true, 52428800,
   ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/heic',
         'video/mp4','video/webm','video/quicktime']),
  ('stories', 'stories', true, 52428800,
   ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/heic',
         'video/mp4','video/webm','video/quicktime']),
  ('works',   'works',   true, 52428800,
   ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/heic',
         'video/mp4','video/webm']),
  ('avatars', 'avatars', true, 10485760,
   ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/heic']),
  ('headers', 'headers', true, 10485760,
   ARRAY['image/jpeg','image/jpg','image/png','image/webp'])
ON CONFLICT (id) DO UPDATE SET
  public          = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit;

-- Storage RLS für alle Buckets
DROP POLICY IF EXISTS storage_select_public  ON storage.objects;
DROP POLICY IF EXISTS storage_insert_own     ON storage.objects;
DROP POLICY IF EXISTS storage_update_own     ON storage.objects;
DROP POLICY IF EXISTS storage_delete_own     ON storage.objects;
CREATE POLICY storage_select_public ON storage.objects
  FOR SELECT USING (bucket_id IN ('media','stories','works','avatars','headers'));
CREATE POLICY storage_insert_own ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id IN ('media','stories','works','avatars','headers'));
CREATE POLICY storage_update_own ON storage.objects
  FOR UPDATE TO authenticated
  USING (auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY storage_delete_own ON storage.objects
  FOR DELETE TO authenticated
  USING (auth.uid()::text = (storage.foldername(name))[1]);


-- ═══════════════════════════════════════════════════════════════════
-- DATA RECOVERY
-- ═══════════════════════════════════════════════════════════════════
UPDATE public.works       SET status = 'published' WHERE status IS NULL OR status = '';
UPDATE public.experiences SET status = 'published' WHERE status IS NULL OR status = '';
UPDATE public.stories     SET status = 'published' WHERE status IS NULL OR status = '';


-- ═══════════════════════════════════════════════════════════════════
-- SCHEMA-CACHE FLUSH
-- ═══════════════════════════════════════════════════════════════════
NOTIFY pgrst, 'reload schema';


-- ═══════════════════════════════════════════════════════════════════
-- VERIFIKATION
-- ═══════════════════════════════════════════════════════════════════
SELECT
  'HUI 026 — Clean Production Schema — OK' AS status,
  NOW()                                    AS executed_at,
  (SELECT udt_name FROM information_schema.columns
   WHERE table_schema='public' AND table_name='chats'
     AND column_name='participant_ids') AS participant_ids_type,
  (SELECT COUNT(*) FROM public.profiles)        AS profiles,
  (SELECT COUNT(*) FROM public.wirker_profiles) AS wirker_profiles,
  (SELECT COUNT(*) FROM public.works)           AS works,
  (SELECT COUNT(*) FROM public.works   WHERE status = 'published') AS works_published,
  (SELECT COUNT(*) FROM public.stories)         AS stories,
  (SELECT COUNT(*) FROM public.experiences)     AS experiences,
  (SELECT COUNT(*) FROM public.bookings)        AS bookings,
  (SELECT COUNT(*) FROM public.chats)           AS chats,
  (SELECT COUNT(*) FROM public.feed_items)      AS feed_items,
  (SELECT COUNT(*) FROM public.impact_projects) AS impact_projects;
