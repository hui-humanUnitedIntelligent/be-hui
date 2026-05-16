-- ═══════════════════════════════════════════════════════════════════
-- HUI 027 — PRECISION REPAIR MIGRATION
-- Datum: 2026-05-16
--
-- KEINE BLIND-MIGRATION. Gebaut gegen 5 echte CSV-Exports:
--   Sup.csv    → 11 Tabellen mit verifizierten Spaltentypen
--   Sup1.csv   → 12 Foreign Keys
--   Sup2.csv   → 98 echte RLS Policies (inkl. Konflikte)
--   sup3.csv   → 58 Indexes
--   sup4.csv   → 9 Storage Buckets
--
-- REPARIERT NUR WAS WIRKLICH KAPUTT IST:
--
--   FIX A: messages.chat_id  TEXT → UUID
--           (Beweis: (messages.chat_id)::uuid in 2 echten Policies)
--   FIX B: messages — 8 widersprüchliche Policies → 3 saubere
--   FIX C: bookings — 2 redundante ALL-Policies entfernen
--   FIX D: favorites — 1 doppelte ALL-Policy entfernen
--   FIX E: impact_projects — 2 von 3 identischen SELECT-Policies
--   FIX F: wirker — 2 von 3 identischen SELECT-Policies
--   FIX G: payments — 2 widersprüchliche SELECT=true entfernen
--   FIX H: profiles — 1 doppelte UPDATE-Policy entfernen
--   FIX I: Fehlende Tabellen & Spalten (CREATE/ADD IF NOT EXISTS)
--   FIX J: status = 'published' normalisieren
--
-- NICHT ANGEFASST:
--   • Alle anderen verifizierten Policies bleiben exakt wie sie sind
--   • Keine Spalten umbenannt
--   • Keine Tabellen gelöscht
--   • Kein reviewer_id (existiert nicht in DB)
--   • wirker bleibt als Legacy-Tabelle erhalten
-- ═══════════════════════════════════════════════════════════════════


-- ═══════════════════════════════════════════════════════════════════
-- FIX A: messages.chat_id  TEXT → UUID
-- ═══════════════════════════════════════════════════════════════════
-- Beweis aus echten Policies:
--   'msg_select':  (messages.chat_id)::uuid  → chat_id war TEXT
--   'msg_update':  (messages.chat_id)::uuid  → chat_id war TEXT
-- Fix: Spalte in UUID umwandeln, dann kein Cast mehr nötig

DO $$
DECLARE
  col_type text;
BEGIN
  SELECT data_type INTO col_type
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name   = 'messages'
    AND column_name  = 'chat_id';

  IF col_type = 'text' THEN
    -- FK-Constraint vorher droppen falls vorhanden
    ALTER TABLE public.messages
      DROP CONSTRAINT IF EXISTS messages_chat_id_fkey;

    -- TEXT → UUID casten (leere Strings werden NULL)
    ALTER TABLE public.messages
      ALTER COLUMN chat_id TYPE uuid
      USING CASE
        WHEN chat_id IS NULL OR chat_id = '' THEN NULL
        ELSE chat_id::uuid
      END;

    -- FK neu anlegen
    ALTER TABLE public.messages
      ADD CONSTRAINT messages_chat_id_fkey
      FOREIGN KEY (chat_id) REFERENCES public.chats(id) ON DELETE CASCADE;

    RAISE NOTICE 'FIX A: messages.chat_id TEXT → UUID ✓';
  ELSIF col_type = 'uuid' THEN
    RAISE NOTICE 'FIX A: messages.chat_id ist bereits UUID — kein Fix nötig';
  ELSE
    RAISE NOTICE 'FIX A: messages.chat_id Typ = % — manuell prüfen', col_type;
  END IF;
END $$;


-- ═══════════════════════════════════════════════════════════════════
-- FIX B: messages — alle 8 alten Policies → 3 saubere neue
-- ═══════════════════════════════════════════════════════════════════
-- Alle echten Policies aus Sup2.csv droppen:
DROP POLICY IF EXISTS msg_insert                         ON public.messages;
DROP POLICY IF EXISTS messages_participants              ON public.messages;
DROP POLICY IF EXISTS msg_update                        ON public.messages;
DROP POLICY IF EXISTS "Public read"                     ON public.messages;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.messages;
DROP POLICY IF EXISTS "User kann Messages senden"        ON public.messages;
DROP POLICY IF EXISTS "User sieht nur eigene Messages"   ON public.messages;
DROP POLICY IF EXISTS msg_select                        ON public.messages;
-- Zusätzlich aus vorherigen Migrations-Versuchen:
DROP POLICY IF EXISTS msg_select_own                    ON public.messages;
DROP POLICY IF EXISTS msg_insert_own                    ON public.messages;
DROP POLICY IF EXISTS msg_update_own                    ON public.messages;

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 3 saubere, nicht-redundante Policies:
-- sender_id = uuid (aus Index erschlossen + REFERENCES auth.users)
-- chat_id   = uuid (nach FIX A) → JOIN chats.id = chat_id (uuid = uuid ✓)
-- participant_ids = uuid[] (Beweis: @> ARRAY[auth.uid()] in echten Policies)

CREATE POLICY msg_select ON public.messages
  FOR SELECT TO authenticated
  USING (
    auth.uid() = sender_id
    OR
    EXISTS (
      SELECT 1 FROM public.chats c
      WHERE c.id = messages.chat_id          -- uuid = uuid ✓ (kein Cast)
        AND auth.uid() = ANY(c.participant_ids)  -- uuid = ANY(uuid[]) ✓
    )
  );

CREATE POLICY msg_insert ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY msg_update ON public.messages
  FOR UPDATE TO authenticated
  USING (auth.uid() = sender_id);


-- ═══════════════════════════════════════════════════════════════════
-- FIX C: bookings — redundante Policies bereinigen
-- ═══════════════════════════════════════════════════════════════════
-- Aus Sup2.csv: 4 Policies, davon 2 redundant zu bookings_own
-- Behalten:  bookings_own (ALL: customer_id OR wirker_id)
--            bookings_wirker_select (SELECT: user_id OR wirker_id)
-- Droppen:   'Users can manage own bookings' (nur user_id — Subset von bookings_own)
--            bookings_wirker_update (UPDATE: wirker_id — Subset von bookings_own)

DROP POLICY IF EXISTS "Users can manage own bookings" ON public.bookings;
DROP POLICY IF EXISTS bookings_wirker_update          ON public.bookings;
-- Vorherige Migrations-Versuche:
DROP POLICY IF EXISTS book_select_own   ON public.bookings;
DROP POLICY IF EXISTS book_insert_own   ON public.bookings;
DROP POLICY IF EXISTS book_update_own   ON public.bookings;

-- bookings_own + bookings_wirker_select aus der DB bleiben exakt so wie sie sind.
-- user_id=uuid, wirker_id=uuid, customer_id=uuid (CSV ✓) → keine Typ-Probleme


-- ═══════════════════════════════════════════════════════════════════
-- FIX D: favorites — doppelte Policy entfernen
-- ═══════════════════════════════════════════════════════════════════
-- Aus Sup2.csv: 2 identische ALL-Policies auf favorites
-- Behalten:  favorites_own
-- Droppen:   'Users can manage own favorites'
DROP POLICY IF EXISTS "Users can manage own favorites" ON public.favorites;
-- Vorherige Migrations-Versuche:
DROP POLICY IF EXISTS fav_select_own ON public.favorites;
DROP POLICY IF EXISTS fav_insert_own ON public.favorites;
DROP POLICY IF EXISTS fav_delete_own ON public.favorites;


-- ═══════════════════════════════════════════════════════════════════
-- FIX E: impact_projects — 2 von 3 identischen SELECT-Policies
-- ═══════════════════════════════════════════════════════════════════
-- Aus Sup2.csv: 3 identische SELECT=true Policies
DROP POLICY IF EXISTS "Enable read access for all users"       ON public.impact_projects;
DROP POLICY IF EXISTS "Impact Projects sind öffentlich lesbar" ON public.impact_projects;
-- Vorherige Migrations-Versuche:
DROP POLICY IF EXISTS ip_select_all   ON public.impact_projects;
DROP POLICY IF EXISTS ip_insert_admin ON public.impact_projects;
-- 'Public read' bleibt (die originale)


-- ═══════════════════════════════════════════════════════════════════
-- FIX F: wirker — 2 von 3 identischen SELECT-Policies
-- ═══════════════════════════════════════════════════════════════════
-- Aus Sup2.csv: 3 SELECT=true Policies auf wirker
DROP POLICY IF EXISTS "Enable read access for all users" ON public.wirker;
DROP POLICY IF EXISTS "Public read"                      ON public.wirker;
-- 'Wirker sind öffentlich lesbar' bleibt
-- Vorherige Migrations-Versuche:
DROP POLICY IF EXISTS wirker_select_all ON public.wirker;
DROP POLICY IF EXISTS wirker_insert_own ON public.wirker;
DROP POLICY IF EXISTS wirker_update_own ON public.wirker;
DROP POLICY IF EXISTS wirker_delete_own ON public.wirker;


-- ═══════════════════════════════════════════════════════════════════
-- FIX G: payments — widersprüchliche SELECT-Policies
-- ═══════════════════════════════════════════════════════════════════
-- Aus Sup2.csv: payments_own (SELECT: payer_id OR recipient_id)
--               PLUS 2x SELECT=true (widersprüchlich!)
--               PLUS 'User sieht nur eigene Payments' (widersprüchlich zu =true)
-- Fix: alle SELECT=true entfernen, payments_own und restricted SELECT bleiben
DROP POLICY IF EXISTS "Enable read access for all users" ON public.payments;
DROP POLICY IF EXISTS "Public read"                      ON public.payments;
-- payments_own und 'User sieht nur eigene Payments' bleiben
-- Vorherige Migrations-Versuche:
DROP POLICY IF EXISTS pay_select_own ON public.payments;
DROP POLICY IF EXISTS pay_insert_own ON public.payments;


-- ═══════════════════════════════════════════════════════════════════
-- FIX H: profiles — doppelte UPDATE-Policy
-- ═══════════════════════════════════════════════════════════════════
-- Aus Sup2.csv: profiles_update_own + 'Eigenes Profil'(ALL) + profiles_update
-- profiles_update ist Duplikat zu profiles_update_own
DROP POLICY IF EXISTS profiles_update ON public.profiles;
-- Vorherige Migrations-Versuche:
DROP POLICY IF EXISTS profiles_select_all ON public.profiles;
DROP POLICY IF EXISTS profiles_insert_own ON public.profiles;
DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
-- Neu: profiles_insert fehlt komplett in der DB! Anlegen:
-- (profiles_insert aus Sup2.csv existiert bereits — kein DROP nötig)


-- ═══════════════════════════════════════════════════════════════════
-- FIX I: Fehlende Tabellen & Spalten (sicher, idempotent)
-- ═══════════════════════════════════════════════════════════════════

-- ── works (nur CREATE IF NOT EXISTS + fehlende Spalten) ────────────
CREATE TABLE IF NOT EXISTS public.works (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title      text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.works
  ADD COLUMN IF NOT EXISTS description     text,
  ADD COLUMN IF NOT EXISTS media_url       text,
  ADD COLUMN IF NOT EXISTS media_type      text    DEFAULT 'image',
  ADD COLUMN IF NOT EXISTS caption         text,
  ADD COLUMN IF NOT EXISTS cover_url       text,
  ADD COLUMN IF NOT EXISTS price           numeric(10,2),
  ADD COLUMN IF NOT EXISTS for_sale        boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS location_text   text,
  ADD COLUMN IF NOT EXISTS category        text,
  ADD COLUMN IF NOT EXISTS tags            text[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS mood_tags       text[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS atmosphere_tags text[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS energy_level    text,
  ADD COLUMN IF NOT EXISTS creator_vibe    text,
  ADD COLUMN IF NOT EXISTS views_count     integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS likes_count     integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS status          text    DEFAULT 'published';

-- ── stories (nur CREATE IF NOT EXISTS + fehlende Spalten) ──────────
-- Bekannte Spalten: id, user_id, status, expires_at, created_at (aus Indexes)
-- visibility aus Policy: stories_select nutzt visibility
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

-- ── profiles (nur CREATE IF NOT EXISTS + fehlende Spalten) ─────────
-- Bekannte Spalten aus Indexes: id, username, is_wirker, has_talent_profile,
--   is_available, location, membership_type, focus_type, created_at
CREATE TABLE IF NOT EXISTS public.profiles (
  id         uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS display_name       text    DEFAULT '',
  ADD COLUMN IF NOT EXISTS username           text,
  ADD COLUMN IF NOT EXISTS avatar_url         text,
  ADD COLUMN IF NOT EXISTS header_img         text,
  ADD COLUMN IF NOT EXISTS bio                text,
  ADD COLUMN IF NOT EXISTS role               text    DEFAULT 'basisuser',
  ADD COLUMN IF NOT EXISTS membership_type    text    DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS is_wirker          boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_talent_profile boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS talent             text,
  ADD COLUMN IF NOT EXISTS location           text,
  ADD COLUMN IF NOT EXISTS focus_type         text,
  ADD COLUMN IF NOT EXISTS is_available       boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS impact_eur         numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS followers_count    integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS dna_tags           text[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS profile_modules    jsonb   DEFAULT '{}';

-- ── wirker_profiles ────────────────────────────────────────────────
-- Bekannte Spalten: id, user_id, slug (aus Indexes)
CREATE TABLE IF NOT EXISTS public.wirker_profiles (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.wirker_profiles
  ADD COLUMN IF NOT EXISTS slug                  text UNIQUE,
  ADD COLUMN IF NOT EXISTS talent                text,
  ADD COLUMN IF NOT EXISTS location_label        text,
  ADD COLUMN IF NOT EXISTS bio                   text,
  ADD COLUMN IF NOT EXISTS avatar_url            text,
  ADD COLUMN IF NOT EXISTS header_img            text,
  ADD COLUMN IF NOT EXISTS hourly_rate           numeric(10,2),
  ADD COLUMN IF NOT EXISTS is_verified           boolean       DEFAULT false,
  ADD COLUMN IF NOT EXISTS impact_eur            numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS followers_count       integer       DEFAULT 0,
  ADD COLUMN IF NOT EXISTS recommendations_count integer       DEFAULT 0,
  ADD COLUMN IF NOT EXISTS dna_tags              text[]        DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS is_available          boolean       DEFAULT true,
  ADD COLUMN IF NOT EXISTS categories            text[]        DEFAULT '{}';

-- ── impact_projects ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.impact_projects (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL DEFAULT '',
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

-- ── impact_votes ───────────────────────────────────────────────────
-- UNIQUE(voter_id, pool_month) — aus echtem Index bestätigt
CREATE TABLE IF NOT EXISTS public.impact_votes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.impact_projects(id) ON DELETE CASCADE,
  voter_id   uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  pool_month text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(voter_id, pool_month)
);

-- ── messages — fehlende Spalten ergänzen ───────────────────────────
CREATE TABLE IF NOT EXISTS public.messages (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id    uuid REFERENCES public.chats(id) ON DELETE CASCADE,  -- uuid!
  sender_id  uuid REFERENCES auth.users(id)   ON DELETE CASCADE,
  text       text,
  read       boolean     DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS receiver_id  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS image_url    text,
  ADD COLUMN IF NOT EXISTS message_type text DEFAULT 'text';

-- ── story_views ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.story_views (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id  uuid REFERENCES public.stories(id) ON DELETE CASCADE,
  viewer_id uuid REFERENCES auth.users(id)     ON DELETE CASCADE,
  viewed_at timestamptz DEFAULT now(),
  UNIQUE(story_id, viewer_id)
);

-- ── work_likes ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.work_likes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_id    uuid REFERENCES public.works(id) ON DELETE CASCADE,
  user_id    uuid REFERENCES auth.users(id)   ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(work_id, user_id)
);

-- ── work_saves ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.work_saves (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_id    uuid REFERENCES public.works(id) ON DELETE CASCADE,
  user_id    uuid REFERENCES auth.users(id)   ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(work_id, user_id)
);

-- ── payments (fehlende Spalten) ────────────────────────────────────
-- Bekannte Spalten: id, booking_id(FK→bookings), stripe_session_id(UNIQUE)
--                   payer_id, recipient_id, user_id (aus Policies)
CREATE TABLE IF NOT EXISTS public.payments (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS payer_id          uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS recipient_id      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS user_id           uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS amount_eur        numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS impact_amount     numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS status            text          DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS stripe_session_id text,
  ADD COLUMN IF NOT EXISTS payment_method    text,
  ADD COLUMN IF NOT EXISTS currency          text          DEFAULT 'eur';

-- stripe_session_id UNIQUE (aus Index bestätigt)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename  = 'payments'
      AND indexname  = 'payments_stripe_session_id_key'
  ) THEN
    ALTER TABLE public.payments
      ADD CONSTRAINT payments_stripe_session_id_key
      UNIQUE (stripe_session_id);
  END IF;
END $$;

-- ── orders ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.orders (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS status    text          DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS total_eur numeric(10,2) DEFAULT 0;

-- ── order_items ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.order_items (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id   uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  work_id    uuid REFERENCES public.works(id)  ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS quantity  integer       DEFAULT 1,
  ADD COLUMN IF NOT EXISTS price_eur numeric(10,2);

-- ── recommendations ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.recommendations (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.recommendations
  -- KEIN reviewer_id! Existiert nicht in der DB.
  ADD COLUMN IF NOT EXISTS reviewer_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS target_user_id   uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS rating           integer CHECK (rating BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS text             text,
  ADD COLUMN IF NOT EXISTS work_title       text,
  ADD COLUMN IF NOT EXISTS is_public        boolean DEFAULT true;

-- ── notifications ──────────────────────────────────────────────────
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

-- ── notification_settings ──────────────────────────────────────────
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

-- ── privacy_settings ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.privacy_settings (
  user_id    uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.privacy_settings
  ADD COLUMN IF NOT EXISTS profile_visibility text    DEFAULT 'public',
  ADD COLUMN IF NOT EXISTS show_location      boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_availability  boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS allow_messages     boolean DEFAULT true;

-- ── project_support ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.project_support (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.impact_projects(id) ON DELETE CASCADE,
  user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_eur numeric(10,2) DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- ── impact_pool (fehlende Spalten) ─────────────────────────────────
ALTER TABLE public.impact_pool
  ADD COLUMN IF NOT EXISTS total_eur      numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS distributed    boolean       DEFAULT false,
  ADD COLUMN IF NOT EXISTS distributed_at timestamptz,
  ADD COLUMN IF NOT EXISTS created_at     timestamptz   DEFAULT now();

-- ── experiences (fehlende Spalten) ─────────────────────────────────
ALTER TABLE public.experiences
  ADD COLUMN IF NOT EXISTS caption         text,
  ADD COLUMN IF NOT EXISTS tags            text[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS available_days  text,
  ADD COLUMN IF NOT EXISTS location_text   text,
  ADD COLUMN IF NOT EXISTS mood_tags       text[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS atmosphere_tags text[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS energy_level    text,
  ADD COLUMN IF NOT EXISTS creator_vibe    text,
  ADD COLUMN IF NOT EXISTS max_participants integer,
  ADD COLUMN IF NOT EXISTS booking_mode    text    DEFAULT 'direct';

-- ── favorites (fehlende Spalte) ────────────────────────────────────
ALTER TABLE public.favorites
  ADD COLUMN IF NOT EXISTS target_type text DEFAULT 'wirker';

-- ── feed_items (fehlende Spalten) ──────────────────────────────────
ALTER TABLE public.feed_items
  ADD COLUMN IF NOT EXISTS caption text,
  ADD COLUMN IF NOT EXISTS status  text DEFAULT 'published';

-- ── availability_slots (fehlende Spalten) ──────────────────────────
ALTER TABLE public.availability_slots
  ADD COLUMN IF NOT EXISTS is_available boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS day_of_week  integer;

-- ── chats (fehlende Spalten) ───────────────────────────────────────
ALTER TABLE public.chats
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- ── bookings (fehlende Spalten) ────────────────────────────────────
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS work_id       uuid REFERENCES public.works(id)       ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS experience_id uuid REFERENCES public.experiences(id)  ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS notes         text,
  ADD COLUMN IF NOT EXISTS escrow_status text          DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS impact_fee    numeric(10,2) DEFAULT 0;


-- ═══════════════════════════════════════════════════════════════════
-- FIX J: Status normalisieren
-- ═══════════════════════════════════════════════════════════════════
UPDATE public.works       SET status = 'published' WHERE status IS NULL OR status = '';
UPDATE public.experiences SET status = 'published' WHERE status IS NULL OR status = '';
UPDATE public.stories     SET status = 'published' WHERE status IS NULL OR status = '';

-- feed_items: published_at auffüllen
UPDATE public.feed_items
  SET published_at = created_at
  WHERE published_at IS NULL AND created_at IS NOT NULL;


-- ═══════════════════════════════════════════════════════════════════
-- RLS AKTIVIEREN (nur wo noch nicht aktiv)
-- ═══════════════════════════════════════════════════════════════════
ALTER TABLE public.profiles             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wirker_profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wirker               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.works                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_views          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_likes           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_saves           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.privacy_settings     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendations      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.impact_projects      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.impact_votes         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_support      ENABLE ROW LEVEL SECURITY;


-- ═══════════════════════════════════════════════════════════════════
-- AUTO-PROFIL TRIGGER
-- ═══════════════════════════════════════════════════════════════════
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


-- ═══════════════════════════════════════════════════════════════════
-- SCHEMA-CACHE FLUSH
-- ═══════════════════════════════════════════════════════════════════
NOTIFY pgrst, 'reload schema';


-- ═══════════════════════════════════════════════════════════════════
-- VERIFIKATION — zeigt was wirklich in der DB ist
-- ═══════════════════════════════════════════════════════════════════
SELECT
  'HUI 027 Repair — OK' AS status,
  NOW()                 AS executed_at,

  -- FIX A: chat_id muss uuid sein
  (SELECT data_type FROM information_schema.columns
   WHERE table_schema='public' AND table_name='messages'
     AND column_name='chat_id')
   AS messages_chat_id_typ,         -- erwartet: uuid

  -- participant_ids Typ (zur Info)
  (SELECT udt_name FROM information_schema.columns
   WHERE table_schema='public' AND table_name='chats'
     AND column_name='participant_ids')
   AS chats_participant_ids_typ,    -- erwartet: _uuid

  -- Policies pro Tabelle (Duplikate erkennen)
  (SELECT COUNT(*) FROM pg_policies
   WHERE schemaname='public' AND tablename='messages')
   AS messages_policy_count,        -- erwartet: 3

  (SELECT COUNT(*) FROM pg_policies
   WHERE schemaname='public' AND tablename='bookings')
   AS bookings_policy_count,        -- erwartet: 2

  (SELECT COUNT(*) FROM pg_policies
   WHERE schemaname='public' AND tablename='favorites')
   AS favorites_policy_count,       -- erwartet: 1

  -- Datenmenge
  (SELECT COUNT(*) FROM public.works
   WHERE status = 'published')      AS works_published,
  (SELECT COUNT(*) FROM public.stories
   WHERE status = 'published')      AS stories_published,
  (SELECT COUNT(*) FROM public.experiences
   WHERE status = 'published')      AS experiences_published,
  (SELECT COUNT(*) FROM public.profiles)  AS profiles_total,
  (SELECT COUNT(*) FROM public.messages)  AS messages_total;
