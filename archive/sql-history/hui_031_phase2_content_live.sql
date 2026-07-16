-- ═══════════════════════════════════════════════════════════════
-- HUI PHASE 2 — POSTS, WERKE & RESONANZ LIVE
-- Migration: 031_phase2_content_live.sql
--
-- Neue / ergänzte Tabellen:
--   feed_posts     — Gedanken / Posts im HomeFeed
--   works          — Werke (Spalten-Ergänzungen)
--   resonances     — Resonanz-Einträge (inspired, saved, etc.)
--   storage-Policy — sichere Uploads für 'media' Bucket
--
-- PRINZIPIEN:
--   • Keine Likes-Spalten — nur resonances
--   • is_archived statt DELETE für Posts
--   • RLS: User sieht/ändert nur eigene Inhalte
--   • creator_id FK mit CASCADE
-- ═══════════════════════════════════════════════════════════════

-- ── feed_posts: Gedanken im HomeFeed ─────────────────────────
CREATE TABLE IF NOT EXISTS public.feed_posts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  caption      TEXT,
  media_url    TEXT,
  media_type   TEXT NOT NULL DEFAULT 'text',   -- text | image | video | audio
  mood         TEXT,
  location     TEXT,
  is_archived  BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_feed_posts_user      ON public.feed_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_feed_posts_created   ON public.feed_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feed_posts_archived  ON public.feed_posts(is_archived) WHERE is_archived = false;

ALTER TABLE public.feed_posts ENABLE ROW LEVEL SECURITY;
-- Jeder liest nicht-archivierte Posts
CREATE POLICY IF NOT EXISTS "feed_posts_public_read" ON public.feed_posts
  FOR SELECT USING (is_archived = false);
-- Nur eigene Posts schreiben
CREATE POLICY IF NOT EXISTS "feed_posts_own_insert" ON public.feed_posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "feed_posts_own_update" ON public.feed_posts
  FOR UPDATE USING (auth.uid() = user_id);

-- ── works: Spalten-Ergänzungen ────────────────────────────────
ALTER TABLE public.works
  ADD COLUMN IF NOT EXISTS creator_id   UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS description  TEXT,
  ADD COLUMN IF NOT EXISTS medium       TEXT,
  ADD COLUMN IF NOT EXISTS tags         TEXT[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS visibility   TEXT NOT NULL DEFAULT 'public',
  ADD COLUMN IF NOT EXISTS location_text TEXT,
  ADD COLUMN IF NOT EXISTS images       JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS updated_at   TIMESTAMPTZ DEFAULT now();

-- creator_id aus user_id befüllen wenn leer
UPDATE public.works SET creator_id = user_id WHERE creator_id IS NULL AND user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_works_creator    ON public.works(creator_id);
CREATE INDEX IF NOT EXISTS idx_works_status     ON public.works(status);
CREATE INDEX IF NOT EXISTS idx_works_visibility ON public.works(visibility);

ALTER TABLE public.works ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "works_public_read" ON public.works
  FOR SELECT USING (status = 'published' AND visibility = 'public');
CREATE POLICY IF NOT EXISTS "works_own_all" ON public.works
  FOR ALL USING (auth.uid() = creator_id OR auth.uid() = user_id);

-- ── resonances: Resonanz-Einträge ────────────────────────────
CREATE TABLE IF NOT EXISTS public.resonances (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type    TEXT NOT NULL,    -- work | experience | profile | community | story | connection
  target_id      UUID NOT NULL,
  resonance_type TEXT NOT NULL,    -- inspired | saved | connected | recommended | supported | participated | deep_resonance
  weight         INTEGER NOT NULL DEFAULT 1,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Idempotent: kein Doppel-Eintrag
  UNIQUE (user_id, target_type, target_id, resonance_type)
);

CREATE INDEX IF NOT EXISTS idx_resonances_target ON public.resonances(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_resonances_user   ON public.resonances(user_id);
CREATE INDEX IF NOT EXISTS idx_resonances_type   ON public.resonances(resonance_type);

ALTER TABLE public.resonances ENABLE ROW LEVEL SECURITY;
-- User sieht eigene Resonanzen
CREATE POLICY IF NOT EXISTS "resonances_own_read" ON public.resonances
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "resonances_own_insert" ON public.resonances
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "resonances_own_delete" ON public.resonances
  FOR DELETE USING (auth.uid() = user_id);

-- ── Storage Policies (media Bucket) ──────────────────────────
-- WICHTIG: Erst den Bucket in Supabase anlegen (Storage Dashboard)
-- Dann diese Policies per SQL activieren:

-- Erlaubt authentifizierten Nutzern Uploads in eigenen Ordner
-- (wird in Supabase Dashboard unter Storage > Policies gesetzt)

-- ── Kommentar ─────────────────────────────────────────────────
-- Diese Migration ist idempotent.
-- Bestehende Werke werden mit creator_id befüllt.
-- resonances hat UNIQUE-Constraint gegen Doppel-Einträge.
-- ═══════════════════════════════════════════════════════════════
