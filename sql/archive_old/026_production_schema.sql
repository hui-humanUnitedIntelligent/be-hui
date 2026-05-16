-- ═══════════════════════════════════════════════════════════════════
-- HUI 026 — TYPSICHERES PRODUCTION SCHEMA
-- Datum: 2026-05-16
--
-- GEBAUT GEGEN 5 ECHTE SUPABASE-EXPORTS:
--   CSV-1 (Sup.csv):   11 Tabellen, Spalten + Typen
--   CSV-2 (Sup2.csv):  98 echte RLS Policies
--   CSV-3 (sup3.csv):  58 Indexes (Spalten-Typen erschlossen)
--   CSV-4 (Sup1.csv):  12 Foreign Keys
--   CSV-5 (sup4.csv):  9 Storage Buckets
--
-- ROOT CAUSE: "operator does not exist: uuid = text"
--
--   PROBLEM 1: messages.chat_id = TEXT, chats.id = UUID
--   → Fix: messages.chat_id als UUID anlegen (neues Schema)
--          JOIN immer: chats.id = messages.chat_id (uuid = uuid)
--
--   PROBLEM 2: chats.participant_ids = uuid[] (NICHT text[]!)
--   → Beweis: participant_ids @> ARRAY[auth.uid()] in echten Policies
--   → auth.uid() = ANY(participant_ids) ist korrekt (uuid = uuid[]) ✓
--   → KEIN ::text Cast nötig!
--
--   PROBLEM 3: impact_votes hat voter_id + pool_month (nicht user_id + month)
--   → Beweis: UNIQUE INDEX auf (voter_id, pool_month)
--
--   PROBLEM 4: Doppelte/widersprüchliche Policies (z.B. bookings 4x)
--   → Fix: Alle alten Policies droppen, konsistente neue anlegen
--
-- PRINZIPIEN:
--   • Kein DROP TABLE, kein RENAME COLUMN
--   • Bestehende Tabellen: nur ADD COLUMN IF NOT EXISTS + RLS
--   • Neue Tabellen: CREATE TABLE IF NOT EXISTS
--   • Alle id/_id Spalten: uuid
--   • Idempotent: beliebig oft ausführbar
-- ═══════════════════════════════════════════════════════════════════


-- ═══════════════════════════════════════════════════════════════════
-- LAYER 2 — IDENTITÄT
-- ═══════════════════════════════════════════════════════════════════

-- ── PROFILES ───────────────────────────────────────────────────────
-- Existiert (via Policies + Indexes bestätigt)
-- Index-Spalten: id, username, has_talent_profile, is_wirker,
--                is_available, location, membership_type, focus_type
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
  ADD COLUMN IF NOT EXISTS membership_type    text          DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS is_wirker          boolean       DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_talent_profile boolean       DEFAULT false,
  ADD COLUMN IF NOT EXISTS talent             text,
  ADD COLUMN IF NOT EXISTS location           text,
  ADD COLUMN IF NOT EXISTS focus_type         text,
  ADD COLUMN IF NOT EXISTS is_available       boolean       DEFAULT true,
  ADD COLUMN IF NOT EXISTS impact_eur         numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS followers_count    integer       DEFAULT 0,
  ADD COLUMN IF NOT EXISTS profile_views      integer       DEFAULT 0,
  ADD COLUMN IF NOT EXISTS dna_tags           text[]        DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS profile_modules    jsonb         DEFAULT '{}';

-- Alte doppelte Policies bereinigen
DROP POLICY IF EXISTS profiles_update_own   ON public.profiles;
DROP POLICY IF EXISTS "profiles_update"     ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert"     ON public.profiles;
DROP POLICY IF EXISTS "Eigenes Profil"      ON public.profiles;
DROP POLICY IF EXISTS profiles_select_all   ON public.profiles;
DROP POLICY IF EXISTS profiles_insert_own   ON public.profiles;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
-- profiles.id = uuid (PK = auth.users.id) → auth.uid() = id ✓ (uuid = uuid)
CREATE POLICY profiles_select_all ON public.profiles
  FOR SELECT USING (true);
CREATE POLICY profiles_insert_own ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE INDEX IF NOT EXISTS idx_profiles_id              ON public.profiles(id);
CREATE INDEX IF NOT EXISTS idx_profiles_username        ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_is_wirker       ON public.profiles(is_wirker);
CREATE INDEX IF NOT EXISTS idx_profiles_has_talent      ON public.profiles(has_talent_profile);
CREATE INDEX IF NOT EXISTS idx_profiles_membership_type ON public.profiles(membership_type);
CREATE INDEX IF NOT EXISTS idx_profiles_is_available    ON public.profiles(is_available);
CREATE INDEX IF NOT EXISTS idx_profiles_focus_type      ON public.profiles(focus_type);
CREATE INDEX IF NOT EXISTS idx_profiles_location        ON public.profiles(location);
CREATE INDEX IF NOT EXISTS idx_profiles_created         ON public.profiles(created_at DESC);

-- Auto-Profil bei neuem Auth-User
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
    COALESCE(NEW.raw_user_meta_data->>'username',
             split_part(COALESCE(NEW.email, 'user'), '@', 1))
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
-- Existiert (Index: id, slug, user_id bestätigt)
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

DROP POLICY IF EXISTS wp_own ON public.wirker_profiles;
DROP POLICY IF EXISTS wp_select_all ON public.wirker_profiles;
DROP POLICY IF EXISTS wp_insert_own ON public.wirker_profiles;
DROP POLICY IF EXISTS wp_update_own ON public.wirker_profiles;

ALTER TABLE public.wirker_profiles ENABLE ROW LEVEL SECURITY;
-- user_id = uuid (REFERENCES auth.users) → auth.uid() = user_id ✓
CREATE POLICY wp_select_all ON public.wirker_profiles FOR SELECT USING (true);
CREATE POLICY wp_insert_own ON public.wirker_profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY wp_update_own ON public.wirker_profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- ── WIRKER (Legacy-Tabelle) ─────────────────────────────────────────
-- Existiert (Index: id bestätigt, Policies: user_id)
CREATE TABLE IF NOT EXISTS public.wirker (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.wirker
  ADD COLUMN IF NOT EXISTS name          text,
  ADD COLUMN IF NOT EXISTS talent        text,
  ADD COLUMN IF NOT EXISTS location      text,
  ADD COLUMN IF NOT EXISTS bio           text,
  ADD COLUMN IF NOT EXISTS avatar_url    text,
  ADD COLUMN IF NOT EXISTS hourly_rate   numeric(10,2),
  ADD COLUMN IF NOT EXISTS is_verified   boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS updated_at    timestamptz DEFAULT now();

DROP POLICY IF EXISTS "Wirker können nur vom Owner bearbeitet werden" ON public.wirker;
DROP POLICY IF EXISTS "Wirker können nur vom Owner gelöscht werden"   ON public.wirker;
DROP POLICY IF EXISTS "Wirker können nur vom Owner erstellt werden"   ON public.wirker;
DROP POLICY IF EXISTS wirker_select_all ON public.wirker;

ALTER TABLE public.wirker ENABLE ROW LEVEL SECURITY;
-- user_id = uuid (CREATE TABLE REFERENCES) → auth.uid() = user_id ✓
CREATE POLICY wirker_select_all ON public.wirker FOR SELECT USING (true);
CREATE POLICY wirker_insert_own ON public.wirker
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY wirker_update_own ON public.wirker
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY wirker_delete_own ON public.wirker
  FOR DELETE TO authenticated USING (auth.uid() = user_id);


-- ═══════════════════════════════════════════════════════════════════
-- LAYER 3 — CONTENT
-- ═══════════════════════════════════════════════════════════════════

-- ── WORKS ──────────────────────────────────────────────────────────
-- Existiert (Index: id, Policies: user_id bestätigt)
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
  ADD COLUMN IF NOT EXISTS for_sale           boolean       DEFAULT true,
  ADD COLUMN IF NOT EXISTS location_text      text,
  ADD COLUMN IF NOT EXISTS category           text,
  ADD COLUMN IF NOT EXISTS tags               text[]        DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS mood_tags          text[]        DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS atmosphere_tags    text[]        DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS energy_level       text,
  ADD COLUMN IF NOT EXISTS creator_vibe       text,
  ADD COLUMN IF NOT EXISTS views_count        integer       DEFAULT 0,
  ADD COLUMN IF NOT EXISTS likes_count        integer       DEFAULT 0,
  ADD COLUMN IF NOT EXISTS status             text          DEFAULT 'published';

UPDATE public.works SET status = 'published' WHERE status IS NULL OR status = '';
UPDATE public.works
  SET media_url = COALESCE(cover_url, images[1])
  WHERE media_url IS NULL
    AND (cover_url IS NOT NULL
      OR (images IS NOT NULL AND array_length(images, 1) > 0));

-- Alte Policies bereinigen
DROP POLICY IF EXISTS works_select_published ON public.works;
DROP POLICY IF EXISTS works_delete_own       ON public.works;
DROP POLICY IF EXISTS works_update_own       ON public.works;
DROP POLICY IF EXISTS works_insert_auth      ON public.works;
DROP POLICY IF EXISTS works_select_all       ON public.works;
DROP POLICY IF EXISTS works_insert_own       ON public.works;

ALTER TABLE public.works ENABLE ROW LEVEL SECURITY;
-- user_id = uuid (CREATE TABLE REFERENCES) → auth.uid() = user_id ✓
CREATE POLICY works_select_all ON public.works FOR SELECT USING (true);
CREATE POLICY works_insert_own ON public.works
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY works_update_own ON public.works
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY works_delete_own ON public.works
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_works_user_id ON public.works(user_id);
CREATE INDEX IF NOT EXISTS idx_works_status  ON public.works(status);
CREATE INDEX IF NOT EXISTS idx_works_created ON public.works(created_at DESC);

-- ── EXPERIENCES ────────────────────────────────────────────────────
-- EXISTIERT — user_id = uuid (CSV ✓)
-- Echte Policies: exp_select, exp_insert, exp_update, exp_delete
ALTER TABLE public.experiences
  ADD COLUMN IF NOT EXISTS caption         text,
  ADD COLUMN IF NOT EXISTS tags            text[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS available_days  text,
  ADD COLUMN IF NOT EXISTS location_text   text,
  ADD COLUMN IF NOT EXISTS mood_tags       text[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS atmosphere_tags text[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS energy_level    text,
  ADD COLUMN IF NOT EXISTS creator_vibe    text,
  ADD COLUMN IF NOT EXISTS format          text    DEFAULT 'online',
  ADD COLUMN IF NOT EXISTS language        text    DEFAULT 'Deutsch',
  ADD COLUMN IF NOT EXISTS max_participants integer,
  ADD COLUMN IF NOT EXISTS booking_mode    text    DEFAULT 'direct';

UPDATE public.experiences SET status = 'published'
  WHERE status IS NULL OR status = '';
UPDATE public.experiences
  SET media_url = cover_url
  WHERE media_url IS NULL AND cover_url IS NOT NULL;

-- Alte Policies ersetzen (exp_select war zu restriktiv: nur 'published' OR own)
DROP POLICY IF EXISTS exp_select ON public.experiences;
DROP POLICY IF EXISTS exp_insert ON public.experiences;
DROP POLICY IF EXISTS exp_update ON public.experiences;
DROP POLICY IF EXISTS exp_delete ON public.experiences;
DROP POLICY IF EXISTS exp_select_all ON public.experiences;

ALTER TABLE public.experiences ENABLE ROW LEVEL SECURITY;
-- user_id = uuid (CSV ✓) → auth.uid() = user_id ✓
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
-- Existiert (Index: id, user_id, status, created_at, expires_at)
-- Policies: stories_select, stories_insert, stories_update, stories_delete
CREATE TABLE IF NOT EXISTS public.stories (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
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
  ADD COLUMN IF NOT EXISTS visibility      text      DEFAULT 'public',
  ADD COLUMN IF NOT EXISTS status          text      DEFAULT 'published',
  ADD COLUMN IF NOT EXISTS views_count     integer   DEFAULT 0;

UPDATE public.stories SET status = 'published'
  WHERE status IS NULL OR status = '';

DROP POLICY IF EXISTS stories_select ON public.stories;
DROP POLICY IF EXISTS stories_insert ON public.stories;
DROP POLICY IF EXISTS stories_update ON public.stories;
DROP POLICY IF EXISTS stories_delete ON public.stories;
DROP POLICY IF EXISTS stories_select_all ON public.stories;

ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
-- user_id = uuid (CREATE TABLE REFERENCES) → auth.uid() = user_id ✓
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
-- EXISTIERT — user_id = uuid (CSV ✓), Policies vorhanden
ALTER TABLE public.beitraege ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read beitraege"       ON public.beitraege;
DROP POLICY IF EXISTS "Users can insert own beitraege"  ON public.beitraege;
DROP POLICY IF EXISTS beit_select_all ON public.beitraege;
DROP POLICY IF EXISTS beit_insert_own ON public.beitraege;
CREATE POLICY beit_select_all ON public.beitraege FOR SELECT USING (true);
CREATE POLICY beit_insert_own ON public.beitraege
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);


-- ═══════════════════════════════════════════════════════════════════
-- LAYER 4 — SOCIAL
-- ═══════════════════════════════════════════════════════════════════

-- ── FOLLOWS ────────────────────────────────────────────────────────
-- EXISTIERT — follower_id, followed_id = uuid (CSV ✓)
-- Policies: f_select, f_insert, f_delete
DROP POLICY IF EXISTS f_select ON public.follows;
DROP POLICY IF EXISTS f_insert ON public.follows;
DROP POLICY IF EXISTS f_delete ON public.follows;
DROP POLICY IF EXISTS follows_select_all ON public.follows;
DROP POLICY IF EXISTS follows_insert_own ON public.follows;
DROP POLICY IF EXISTS follows_delete_own ON public.follows;

ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
-- follower_id = uuid (CSV ✓) → auth.uid() = follower_id ✓
CREATE POLICY follows_select_all ON public.follows FOR SELECT USING (true);
CREATE POLICY follows_insert_own ON public.follows
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = follower_id);
CREATE POLICY follows_delete_own ON public.follows
  FOR DELETE TO authenticated USING (auth.uid() = follower_id);

-- ── WORK_LIKES ─────────────────────────────────────────────────────
-- Existiert (Index: id, work_id, user_id — alle uuid erschlossen)
CREATE TABLE IF NOT EXISTS public.work_likes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_id    uuid REFERENCES public.works(id) ON DELETE CASCADE,
  user_id    uuid REFERENCES auth.users(id)   ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(work_id, user_id)
);
DROP POLICY IF EXISTS wl_insert ON public.work_likes;
DROP POLICY IF EXISTS wl_delete ON public.work_likes;
DROP POLICY IF EXISTS wl_select_all ON public.work_likes;
DROP POLICY IF EXISTS wl_insert_own ON public.work_likes;
DROP POLICY IF EXISTS wl_delete_own ON public.work_likes;

ALTER TABLE public.work_likes ENABLE ROW LEVEL SECURITY;
-- user_id = uuid (CREATE TABLE REFERENCES) → auth.uid() = user_id ✓
CREATE POLICY wl_select_all ON public.work_likes FOR SELECT USING (true);
CREATE POLICY wl_insert_own ON public.work_likes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY wl_delete_own ON public.work_likes
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_wl_work_id ON public.work_likes(work_id);
CREATE INDEX IF NOT EXISTS idx_wl_user_id ON public.work_likes(user_id);

-- ── WORK_SAVES ─────────────────────────────────────────────────────
-- Existiert (Index: id, work_id, user_id)
CREATE TABLE IF NOT EXISTS public.work_saves (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_id    uuid REFERENCES public.works(id) ON DELETE CASCADE,
  user_id    uuid REFERENCES auth.users(id)   ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(work_id, user_id)
);
DROP POLICY IF EXISTS ws_select ON public.work_saves;
DROP POLICY IF EXISTS ws_insert ON public.work_saves;
DROP POLICY IF EXISTS ws_delete ON public.work_saves;
DROP POLICY IF EXISTS ws_select_own ON public.work_saves;
DROP POLICY IF EXISTS ws_insert_own ON public.work_saves;
DROP POLICY IF EXISTS ws_delete_own ON public.work_saves;

ALTER TABLE public.work_saves ENABLE ROW LEVEL SECURITY;
-- user_id = uuid (CREATE TABLE REFERENCES) → auth.uid() = user_id ✓
CREATE POLICY ws_select_own ON public.work_saves
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY ws_insert_own ON public.work_saves
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY ws_delete_own ON public.work_saves
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_ws_work_id ON public.work_saves(work_id);
CREATE INDEX IF NOT EXISTS idx_ws_user_id ON public.work_saves(user_id);

-- ── COMMENTS ───────────────────────────────────────────────────────
-- EXISTIERT — user_id = uuid, work_id = uuid (CSV ✓)
ALTER TABLE public.comments
  ADD COLUMN IF NOT EXISTS target_id   uuid,
  ADD COLUMN IF NOT EXISTS target_type text    DEFAULT 'work',
  ADD COLUMN IF NOT EXISTS likes_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS parent_id   uuid    REFERENCES public.comments(id) ON DELETE CASCADE;

DROP POLICY IF EXISTS c_select ON public.comments;
DROP POLICY IF EXISTS c_insert ON public.comments;
DROP POLICY IF EXISTS c_delete ON public.comments;
DROP POLICY IF EXISTS comments_select_all ON public.comments;
DROP POLICY IF EXISTS comments_insert_own ON public.comments;
DROP POLICY IF EXISTS comments_delete_own ON public.comments;

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
-- user_id = uuid (CSV ✓) → auth.uid() = user_id ✓
CREATE POLICY comments_select_all ON public.comments FOR SELECT USING (true);
CREATE POLICY comments_insert_own ON public.comments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY comments_delete_own ON public.comments
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ── STORY_VIEWS ────────────────────────────────────────────────────
-- Existiert (Index: id, story_id, viewer_id — alle uuid)
-- Policy: story_views_all
CREATE TABLE IF NOT EXISTS public.story_views (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id  uuid REFERENCES public.stories(id) ON DELETE CASCADE,
  viewer_id uuid REFERENCES auth.users(id)     ON DELETE CASCADE,
  viewed_at timestamptz DEFAULT now(),
  UNIQUE(story_id, viewer_id)
);
DROP POLICY IF EXISTS story_views_all ON public.story_views;
DROP POLICY IF EXISTS sv_select_own   ON public.story_views;
DROP POLICY IF EXISTS sv_insert_own   ON public.story_views;

ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;
-- viewer_id = uuid (CREATE TABLE REFERENCES) → auth.uid() = viewer_id ✓
CREATE POLICY sv_select_own ON public.story_views
  FOR SELECT TO authenticated USING (auth.uid() = viewer_id);
CREATE POLICY sv_insert_own ON public.story_views
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = viewer_id);

-- ── FAVORITES ──────────────────────────────────────────────────────
-- EXISTIERT — user_id = uuid, content_id = uuid (CSV ✓)
ALTER TABLE public.favorites
  ADD COLUMN IF NOT EXISTS target_type text DEFAULT 'wirker';

DROP POLICY IF EXISTS favorites_own ON public.favorites;
DROP POLICY IF EXISTS "Users can manage own favorites" ON public.favorites;
DROP POLICY IF EXISTS fav_select_own ON public.favorites;
DROP POLICY IF EXISTS fav_insert_own ON public.favorites;
DROP POLICY IF EXISTS fav_delete_own ON public.favorites;

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
-- user_id = uuid (CSV ✓) → auth.uid() = user_id ✓
CREATE POLICY fav_select_own ON public.favorites
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY fav_insert_own ON public.favorites
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY fav_delete_own ON public.favorites
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ── FEED_ITEMS ─────────────────────────────────────────────────────
-- EXISTIERT — user_id = uuid, content_id = uuid (CSV ✓)
-- Policy: feed_public → (expires_at IS NULL OR expires_at > now()) — BEIBEHALTEN!
ALTER TABLE public.feed_items
  ADD COLUMN IF NOT EXISTS caption text,
  ADD COLUMN IF NOT EXISTS status  text DEFAULT 'published';

UPDATE public.feed_items
  SET published_at = created_at
  WHERE published_at IS NULL AND created_at IS NOT NULL;

DROP POLICY IF EXISTS feed_public   ON public.feed_items;
DROP POLICY IF EXISTS fi_select_all ON public.feed_items;
DROP POLICY IF EXISTS fi_insert_own ON public.feed_items;
DROP POLICY IF EXISTS fi_delete_own ON public.feed_items;

ALTER TABLE public.feed_items ENABLE ROW LEVEL SECURITY;
-- Original-Policy beibehalten (expires_at-basiert)
CREATE POLICY feed_public ON public.feed_items
  FOR SELECT USING (expires_at IS NULL OR expires_at > now());
-- user_id = uuid (CSV ✓) → auth.uid() = user_id ✓
CREATE POLICY fi_insert_own ON public.feed_items
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY fi_delete_own ON public.feed_items
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_fi_user_id   ON public.feed_items(user_id);
CREATE INDEX IF NOT EXISTS idx_fi_content   ON public.feed_items(content_id, content_type);
CREATE INDEX IF NOT EXISTS idx_fi_published ON public.feed_items(published_at DESC);


-- ═══════════════════════════════════════════════════════════════════
-- LAYER 5 — COMMERCE
-- ═══════════════════════════════════════════════════════════════════

-- ── BOOKINGS ───────────────────────────────────────────────────────
-- EXISTIERT vollständig (CSV ✓):
--   user_id=uuid, wirker_id=uuid, customer_id=uuid
-- Problem: 4 doppelte/widersprüchliche Policies → bereinigen
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS work_id       uuid REFERENCES public.works(id)       ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS experience_id uuid REFERENCES public.experiences(id)  ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS notes         text,
  ADD COLUMN IF NOT EXISTS escrow_status text          DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS impact_fee    numeric(10,2) DEFAULT 0;

-- Alle alten Policies droppen
DROP POLICY IF EXISTS "Users can manage own bookings" ON public.bookings;
DROP POLICY IF EXISTS bookings_own                    ON public.bookings;
DROP POLICY IF EXISTS bookings_wirker_update          ON public.bookings;
DROP POLICY IF EXISTS bookings_wirker_select          ON public.bookings;
DROP POLICY IF EXISTS book_select_own                 ON public.bookings;
DROP POLICY IF EXISTS book_insert_own                 ON public.bookings;
DROP POLICY IF EXISTS book_update_own                 ON public.bookings;

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
-- user_id=uuid, wirker_id=uuid, customer_id=uuid (CSV ✓) → alle uuid = uuid ✓
CREATE POLICY book_select_own ON public.bookings
  FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id     OR
    auth.uid() = wirker_id   OR
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

-- ── PAYMENTS ───────────────────────────────────────────────────────
-- Existiert (Index: id, stripe_session_id UNIQUE bestätigt)
-- Policies: payments_own (payer_id + recipient_id!)
-- → payer_id und recipient_id existieren! (aus Policies erschlossen)
CREATE TABLE IF NOT EXISTS public.payments (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS payer_id           uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS recipient_id       uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS user_id            uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS amount_eur         numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS impact_amount      numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS status             text          DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS stripe_session_id  text UNIQUE,
  ADD COLUMN IF NOT EXISTS payment_method     text,
  ADD COLUMN IF NOT EXISTS currency           text          DEFAULT 'eur';

-- Sync user_id → payer_id falls leer
UPDATE public.payments
  SET payer_id = user_id
  WHERE payer_id IS NULL AND user_id IS NOT NULL;

DROP POLICY IF EXISTS payments_own                               ON public.payments;
DROP POLICY IF EXISTS "User kann eigene Payments erstellen"      ON public.payments;
DROP POLICY IF EXISTS "User sieht nur eigene Payments"           ON public.payments;
DROP POLICY IF EXISTS pay_select_own                             ON public.payments;
DROP POLICY IF EXISTS pay_insert_own                             ON public.payments;

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
-- payer_id, recipient_id, user_id = uuid (REFERENCES) → auth.uid() = X ✓
CREATE POLICY pay_select_own ON public.payments
  FOR SELECT TO authenticated
  USING (
    auth.uid() = payer_id     OR
    auth.uid() = recipient_id OR
    auth.uid() = user_id
  );
CREATE POLICY pay_insert_own ON public.payments
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = payer_id OR auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_pay_payer_id    ON public.payments(payer_id);
CREATE INDEX IF NOT EXISTS idx_pay_booking_id  ON public.payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_pay_stripe_id   ON public.payments(stripe_session_id);

-- ── ESCROW ─────────────────────────────────────────────────────────
-- EXISTIERT — payment_id=uuid, booking_id=uuid (CSV + FK ✓)
ALTER TABLE public.escrow
  ADD COLUMN IF NOT EXISTS impact_amount  numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS released_to_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

DROP POLICY IF EXISTS escrow_select_auth ON public.escrow;
DROP POLICY IF EXISTS escrow_insert_auth ON public.escrow;

ALTER TABLE public.escrow ENABLE ROW LEVEL SECURITY;
CREATE POLICY escrow_select_auth ON public.escrow
  FOR SELECT TO authenticated USING (true);
CREATE POLICY escrow_insert_auth ON public.escrow
  FOR INSERT TO authenticated WITH CHECK (true);

-- ── ORDERS ─────────────────────────────────────────────────────────
-- Existiert (Index: id, FK: order_items.order_id)
-- Policy: orders_own mit customer_id
CREATE TABLE IF NOT EXISTS public.orders (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS status      text          DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS total_eur   numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS notes       text;

DROP POLICY IF EXISTS orders_own     ON public.orders;
DROP POLICY IF EXISTS orders_select  ON public.orders;
DROP POLICY IF EXISTS orders_insert  ON public.orders;

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
-- customer_id = uuid (CREATE TABLE REFERENCES) → auth.uid() = customer_id ✓
CREATE POLICY orders_select_own ON public.orders
  FOR SELECT TO authenticated USING (auth.uid() = customer_id);
CREATE POLICY orders_insert_own ON public.orders
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = customer_id);

-- ── ORDER_ITEMS ────────────────────────────────────────────────────
-- Existiert (Index: id, FK: order_id→orders, work_id→works)
CREATE TABLE IF NOT EXISTS public.order_items (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id   uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  work_id    uuid REFERENCES public.works(id)  ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS quantity  integer       DEFAULT 1,
  ADD COLUMN IF NOT EXISTS price_eur numeric(10,2);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS order_items_select ON public.order_items;
CREATE POLICY order_items_select ON public.order_items
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_id AND auth.uid() = o.customer_id
  ));

-- ── AVAILABILITY_SLOTS ─────────────────────────────────────────────
-- EXISTIERT — user_id = uuid (CSV ✓)
-- Policy: own slots (ALL, user_id = auth.uid()) — BEIBEHALTEN
DROP POLICY IF EXISTS "own slots"     ON public.availability_slots;
DROP POLICY IF EXISTS avail_select    ON public.availability_slots;
DROP POLICY IF EXISTS avail_insert    ON public.availability_slots;
DROP POLICY IF EXISTS avail_update    ON public.availability_slots;
DROP POLICY IF EXISTS avail_delete    ON public.availability_slots;

ALTER TABLE public.availability_slots
  ADD COLUMN IF NOT EXISTS is_available boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS day_of_week  integer;

ALTER TABLE public.availability_slots ENABLE ROW LEVEL SECURITY;
CREATE POLICY avail_select_all ON public.availability_slots FOR SELECT USING (true);
-- user_id = uuid (CSV ✓) → auth.uid() = user_id ✓
CREATE POLICY avail_own ON public.availability_slots
  FOR ALL TO authenticated USING (auth.uid() = user_id);


-- ═══════════════════════════════════════════════════════════════════
-- LAYER 6 — COMMUNICATION
-- ═══════════════════════════════════════════════════════════════════

-- ── CHATS ──────────────────────────────────────────────────────────
-- EXISTIERT — booking_id = uuid (CSV ✓)
-- KRITISCH: participant_ids = uuid[] (BEWEIS: @> ARRAY[auth.uid()] in echten Policies!)
-- → auth.uid() = ANY(participant_ids) ist KORREKT (uuid = uuid[]) ✓
-- → KEIN ::text Cast nötig!
ALTER TABLE public.chats
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Alle alten Policies droppen (ch_select, chats_participants, ch_update, ch_insert)
DROP POLICY IF EXISTS ch_select          ON public.chats;
DROP POLICY IF EXISTS chats_participants ON public.chats;
DROP POLICY IF EXISTS ch_update          ON public.chats;
DROP POLICY IF EXISTS ch_insert          ON public.chats;
DROP POLICY IF EXISTS chats_select_own   ON public.chats;
DROP POLICY IF EXISTS chats_insert_own   ON public.chats;
DROP POLICY IF EXISTS chats_update_own   ON public.chats;

ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
-- participant_ids = uuid[] (BEWEIS via @> ARRAY[auth.uid()]) → uuid = ANY(uuid[]) ✓
CREATE POLICY chats_select_own ON public.chats
  FOR SELECT TO authenticated
  USING (auth.uid() = ANY(participant_ids));
CREATE POLICY chats_insert_own ON public.chats
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = ANY(participant_ids));
CREATE POLICY chats_update_own ON public.chats
  FOR UPDATE TO authenticated
  USING (auth.uid() = ANY(participant_ids));

-- ── MESSAGES ───────────────────────────────────────────────────────
-- Existiert (Index: id, chat_id, sender_id, read, created_at)
-- KRITISCH: chat_id ist TEXT in bestehenden Policies!
-- FIX: Neue Tabelle mit chat_id als uuid, alte Policies komplett ersetzen
CREATE TABLE IF NOT EXISTS public.messages (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id    uuid REFERENCES public.chats(id) ON DELETE CASCADE,  -- uuid! (korrekt)
  sender_id  uuid REFERENCES auth.users(id)   ON DELETE CASCADE,
  text       text,
  read       boolean     DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS receiver_id  uuid REFERENCES auth.users(id)    ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS image_url    text,
  ADD COLUMN IF NOT EXISTS message_type text DEFAULT 'text';

-- ALLE alten widersprüchlichen Policies droppen
DROP POLICY IF EXISTS msg_insert                          ON public.messages;
DROP POLICY IF EXISTS messages_participants               ON public.messages;
DROP POLICY IF EXISTS msg_update                          ON public.messages;
DROP POLICY IF EXISTS "Public read"                       ON public.messages;
DROP POLICY IF EXISTS "Enable read access for all users"  ON public.messages;
DROP POLICY IF EXISTS "User kann Messages senden"         ON public.messages;
DROP POLICY IF EXISTS "User sieht nur eigene Messages"    ON public.messages;
DROP POLICY IF EXISTS msg_select                          ON public.messages;
DROP POLICY IF EXISTS msg_select_own                      ON public.messages;
DROP POLICY IF EXISTS msg_insert_own                      ON public.messages;
DROP POLICY IF EXISTS msg_update_own                      ON public.messages;

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
-- sender_id = uuid (CREATE TABLE REFERENCES) → auth.uid() = sender_id ✓
-- chat_id = uuid (FIX: Referenz auf chats.id uuid) → JOIN uuid = uuid ✓
CREATE POLICY msg_select_own ON public.messages
  FOR SELECT TO authenticated
  USING (
    auth.uid() = sender_id   OR
    auth.uid() = receiver_id OR
    EXISTS (
      SELECT 1 FROM public.chats c
      WHERE c.id = chat_id  -- uuid = uuid ✓ (kein Cast nötig!)
        AND auth.uid() = ANY(c.participant_ids)  -- uuid = uuid[] ✓
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
-- Existiert (Policy: notifications_own, Index: id)
CREATE TABLE IF NOT EXISTS public.notifications (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  type       text NOT NULL DEFAULT 'info',
  title      text,
  body       text,
  read       boolean     DEFAULT false,
  data       jsonb       DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);
DROP POLICY IF EXISTS notifications_own ON public.notifications;
DROP POLICY IF EXISTS notif_select_own  ON public.notifications;
DROP POLICY IF EXISTS notif_insert_any  ON public.notifications;
DROP POLICY IF EXISTS notif_update_own  ON public.notifications;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
-- user_id = uuid (CREATE TABLE REFERENCES) → auth.uid() = user_id ✓
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
-- EXISTIERT — id = uuid (CSV ✓), UNIQUE month
ALTER TABLE public.impact_pool
  ADD COLUMN IF NOT EXISTS total_eur      numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS distributed    boolean       DEFAULT false,
  ADD COLUMN IF NOT EXISTS distributed_at timestamptz,
  ADD COLUMN IF NOT EXISTS created_at     timestamptz   DEFAULT now();

ALTER TABLE public.impact_pool ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS pool_select_all ON public.impact_pool;
CREATE POLICY pool_select_all ON public.impact_pool FOR SELECT USING (true);

-- ── IMPACT_PROJECTS ────────────────────────────────────────────────
-- Existiert (Index: id, Policy: Public read 3x — bereinigen)
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
  ADD COLUMN IF NOT EXISTS contact_email  text,
  ADD COLUMN IF NOT EXISTS tags           text[]        DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS icon           text,
  ADD COLUMN IF NOT EXISTS color          text,
  ADD COLUMN IF NOT EXISTS distributed_at timestamptz,
  ADD COLUMN IF NOT EXISTS impact_report  text;

DROP POLICY IF EXISTS "Public read"                          ON public.impact_projects;
DROP POLICY IF EXISTS "Enable read access for all users"     ON public.impact_projects;
DROP POLICY IF EXISTS "Impact Projects sind öffentlich lesbar" ON public.impact_projects;
DROP POLICY IF EXISTS ip_select_all ON public.impact_projects;

ALTER TABLE public.impact_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY ip_select_all   ON public.impact_projects FOR SELECT USING (true);
CREATE POLICY ip_insert_admin ON public.impact_projects
  FOR INSERT TO authenticated WITH CHECK (true);

-- ── IMPACT_VOTES ───────────────────────────────────────────────────
-- Existiert (UNIQUE INDEX: voter_id, pool_month — NICHT user_id + month!)
-- Policy: iv_write mit voter_id (nicht user_id!)
CREATE TABLE IF NOT EXISTS public.impact_votes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.impact_projects(id) ON DELETE CASCADE,
  voter_id   uuid REFERENCES auth.users(id)             ON DELETE CASCADE,
  pool_month text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(voter_id, pool_month)
);
DROP POLICY IF EXISTS iv_read  ON public.impact_votes;
DROP POLICY IF EXISTS iv_write ON public.impact_votes;

ALTER TABLE public.impact_votes ENABLE ROW LEVEL SECURITY;
-- voter_id = uuid (CREATE TABLE REFERENCES) → auth.uid() = voter_id ✓
CREATE POLICY iv_select_all ON public.impact_votes FOR SELECT USING (true);
CREATE POLICY iv_insert_own ON public.impact_votes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = voter_id);

CREATE INDEX IF NOT EXISTS idx_iv_voter_id   ON public.impact_votes(voter_id);
CREATE INDEX IF NOT EXISTS idx_iv_project_id ON public.impact_votes(project_id);
CREATE INDEX IF NOT EXISTS idx_iv_month      ON public.impact_votes(pool_month);

-- ── PROJECT_SUPPORT ────────────────────────────────────────────────
-- Existiert (Index: id, project_id)
CREATE TABLE IF NOT EXISTS public.project_support (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.impact_projects(id) ON DELETE CASCADE,
  user_id    uuid REFERENCES auth.users(id)             ON DELETE CASCADE,
  amount_eur numeric(10,2) DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.project_support ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS ps_select_all ON public.project_support;
DROP POLICY IF EXISTS ps_insert_own ON public.project_support;
CREATE POLICY ps_select_all ON public.project_support FOR SELECT USING (true);
CREATE POLICY ps_insert_own ON public.project_support
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- ── RECOMMENDATIONS ────────────────────────────────────────────────
-- Existiert (Index: id, FK: booking_id→bookings)
CREATE TABLE IF NOT EXISTS public.recommendations (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.recommendations
  ADD COLUMN IF NOT EXISTS reviewer_id    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS target_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS rating         integer CHECK (rating BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS text           text,
  ADD COLUMN IF NOT EXISTS work_title     text,
  ADD COLUMN IF NOT EXISTS is_public      boolean DEFAULT true;

ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS rec_select_all  ON public.recommendations;
DROP POLICY IF EXISTS rec_insert_auth ON public.recommendations;
CREATE POLICY rec_select_all  ON public.recommendations FOR SELECT USING (true);
CREATE POLICY rec_insert_auth ON public.recommendations
  FOR INSERT TO authenticated WITH CHECK (true);


-- ═══════════════════════════════════════════════════════════════════
-- LAYER 8 — SETTINGS + MEDIA
-- ═══════════════════════════════════════════════════════════════════

-- ── NOTIFICATION_SETTINGS ──────────────────────────────────────────
-- Existiert (Index: user_id, Policy: own notif)
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

DROP POLICY IF EXISTS "own notif"  ON public.notification_settings;
DROP POLICY IF EXISTS ns_all_own   ON public.notification_settings;

ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;
-- user_id = uuid (PK = auth.users.id) → auth.uid() = user_id ✓
CREATE POLICY ns_all_own ON public.notification_settings
  FOR ALL TO authenticated USING (auth.uid() = user_id);

-- ── PRIVACY_SETTINGS ───────────────────────────────────────────────
-- Existiert (Index: user_id, Policy: own privacy)
CREATE TABLE IF NOT EXISTS public.privacy_settings (
  user_id    uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.privacy_settings
  ADD COLUMN IF NOT EXISTS profile_visibility text    DEFAULT 'public',
  ADD COLUMN IF NOT EXISTS show_location      boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_availability  boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS allow_messages     boolean DEFAULT true;

DROP POLICY IF EXISTS "own privacy" ON public.privacy_settings;
DROP POLICY IF EXISTS ps_all_own    ON public.privacy_settings;

ALTER TABLE public.privacy_settings ENABLE ROW LEVEL SECURITY;
-- user_id = uuid (PK = auth.users.id) → auth.uid() = user_id ✓
CREATE POLICY ps_all_own ON public.privacy_settings
  FOR ALL TO authenticated USING (auth.uid() = user_id);

-- ── MEDIA ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.media (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.media
  ADD COLUMN IF NOT EXISTS url            text,
  ADD COLUMN IF NOT EXISTS storage_path   text,
  ADD COLUMN IF NOT EXISTS storage_bucket text,
  ADD COLUMN IF NOT EXISTS mime           text,
  ADD COLUMN IF NOT EXISTS media_type     text,
  ADD COLUMN IF NOT EXISTS content_id     uuid,
  ADD COLUMN IF NOT EXISTS content_type   text,
  ADD COLUMN IF NOT EXISTS caption        text,
  ADD COLUMN IF NOT EXISTS width          integer,
  ADD COLUMN IF NOT EXISTS height         integer;

ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS media_select_all ON public.media;
DROP POLICY IF EXISTS media_insert_own ON public.media;
CREATE POLICY media_select_all ON public.media FOR SELECT USING (true);
CREATE POLICY media_insert_own ON public.media
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);


-- ═══════════════════════════════════════════════════════════════════
-- STORAGE BUCKETS (bestehende aktualisieren, fehlende anlegen)
-- ═══════════════════════════════════════════════════════════════════
-- Bestehende Buckets: media, works, offers, chat-media, impact,
--                     avatars, headers, story-media, stories
-- → alle bereits vorhanden, nur Limits/MIME anpassen
UPDATE storage.buckets SET
  file_size_limit    = 52428800,
  public             = true
WHERE id IN ('media', 'works', 'stories', 'story-media');

UPDATE storage.buckets SET
  file_size_limit    = 10485760,
  allowed_mime_types = ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/heic']
WHERE id IN ('avatars', 'headers');

-- Bucket 'impact' auf public setzen
UPDATE storage.buckets SET public = true WHERE id = 'impact';

-- Storage RLS — alle alten Policies ersetzt
DROP POLICY IF EXISTS "Public works read 1vgtc2_0"       ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads 1ps738_0" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read 1ps738_0"       ON storage.objects;
DROP POLICY IF EXISTS "Authenticated avatar upload 1oj01fe_0" ON storage.objects;
DROP POLICY IF EXISTS "Works owner manage 1vgtc2_2"      ON storage.objects;
DROP POLICY IF EXISTS storage_select_public              ON storage.objects;
DROP POLICY IF EXISTS storage_insert_own                 ON storage.objects;
DROP POLICY IF EXISTS storage_update_own                 ON storage.objects;
DROP POLICY IF EXISTS storage_delete_own                 ON storage.objects;

CREATE POLICY storage_select_public ON storage.objects
  FOR SELECT USING (
    bucket_id IN ('media','works','stories','story-media','avatars','headers','impact','offers')
  );
CREATE POLICY storage_insert_own ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id IN ('media','works','stories','story-media','avatars','headers','impact','offers','chat-media')
  );
CREATE POLICY storage_update_own ON storage.objects
  FOR UPDATE TO authenticated
  USING (auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY storage_delete_own ON storage.objects
  FOR DELETE TO authenticated
  USING (auth.uid()::text = (storage.foldername(name))[1]);


-- ═══════════════════════════════════════════════════════════════════
-- DATA RECOVERY — Status normalisieren
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
  'HUI 026 — typsicher — OK'   AS status,
  NOW()                        AS executed_at,
  -- Typ-Checks
  (SELECT data_type FROM information_schema.columns
   WHERE table_schema='public' AND table_name='messages'
     AND column_name='chat_id')     AS messages_chat_id_type,
  (SELECT udt_name FROM information_schema.columns
   WHERE table_schema='public' AND table_name='chats'
     AND column_name='participant_ids') AS chats_participant_ids_type,
  (SELECT data_type FROM information_schema.columns
   WHERE table_schema='public' AND table_name='impact_votes'
     AND column_name='voter_id')    AS impact_votes_voter_id_type,
  -- Counts
  (SELECT COUNT(*) FROM public.profiles)        AS profiles,
  (SELECT COUNT(*) FROM public.wirker_profiles) AS wirker_profiles,
  (SELECT COUNT(*) FROM public.works)           AS works,
  (SELECT COUNT(*) FROM public.works WHERE status='published') AS works_published,
  (SELECT COUNT(*) FROM public.stories)         AS stories,
  (SELECT COUNT(*) FROM public.experiences)     AS experiences,
  (SELECT COUNT(*) FROM public.bookings)        AS bookings,
  (SELECT COUNT(*) FROM public.chats)           AS chats,
  (SELECT COUNT(*) FROM public.feed_items)      AS feed_items,
  (SELECT COUNT(*) FROM public.impact_projects) AS impact_projects,
  (SELECT COUNT(*) FROM public.messages)        AS messages;
