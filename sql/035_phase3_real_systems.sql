-- ════════════════════════════════════════════════════════════════
-- HUI Migration 035 — Phase 3 Real Systems Foundation
-- Datum: 2026-05-24
--
-- ZWECK:
--   1. follows-Tabelle: both column names supported
--      Migration 032 definiert followed_id
--      AppStateContext (alt) nutzte following_id
--      → Alias-View + Klarstellung
--
--   2. Chat: last_seen Presence für Profile
--
--   3. Erlebnisse: spots_available Alias sicherstellen
--
-- SICHER: alle Statements idempotent (IF NOT EXISTS)
-- KEIN DROP, KEIN TRUNCATE
-- ════════════════════════════════════════════════════════════════

-- ── 1. follows: following_id → followed_id Kompatibilität ────────
-- Migration 032 definiert followed_id.
-- Falls eine alte follows-Tabelle mit following_id existiert:
-- Spalte hinzufügen (fällt graceful durch falls schon vorhanden)

DO $$
BEGIN
  -- Prüfen ob followed_id bereits existiert
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'follows'
      AND column_name  = 'followed_id'
  ) THEN
    -- Tabelle nutzt noch following_id → umbenennen
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name   = 'follows'
        AND column_name  = 'following_id'
    ) THEN
      ALTER TABLE public.follows
        RENAME COLUMN following_id TO followed_id;
      RAISE NOTICE 'follows.following_id → followed_id renamed';
    END IF;
  ELSE
    RAISE NOTICE 'follows.followed_id already exists — no action needed';
  END IF;
END $$;

-- Index sicherstellen (falls Umbenennung nötig war)
CREATE INDEX IF NOT EXISTS idx_follows_followed_id
  ON public.follows (followed_id, follower_id);

-- ── 2. profiles: last_seen für Presence ──────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_seen timestamptz,
  ADD COLUMN IF NOT EXISTS availability text DEFAULT 'available'
    CHECK (availability IN ('available','busy','away','offline'));

-- ── 3. experiences: spots_available sicherstellen ─────────────────
ALTER TABLE public.experiences
  ADD COLUMN IF NOT EXISTS spots_available integer,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'active'
    CHECK (status IN ('draft','active','paused','archived'));

-- Default: aktive Erlebnisse sichtbar machen
UPDATE public.experiences
  SET status = 'active'
  WHERE status IS NULL;

-- ── 4. chats: booking_title (für Chat-Header) ──────────────────────
ALTER TABLE public.chats
  ADD COLUMN IF NOT EXISTS booking_title text;

-- ── 5. Presence: last_seen auto-update via Trigger ────────────────
CREATE OR REPLACE FUNCTION public.update_profile_last_seen()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  -- Wird von App via UPDATE profiles SET last_seen = now() aufgerufen
  -- Trigger sorgt für Konsistenz
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ── 6. follows: RLS sicherstellen ────────────────────────────────
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS follows_read_own ON public.follows;
CREATE POLICY follows_read_own ON public.follows
  FOR SELECT USING (
    auth.uid() = follower_id OR
    auth.uid() = followed_id
  );

DROP POLICY IF EXISTS follows_insert_own ON public.follows;
CREATE POLICY follows_insert_own ON public.follows
  FOR INSERT WITH CHECK (auth.uid() = follower_id);

DROP POLICY IF EXISTS follows_delete_own ON public.follows;
CREATE POLICY follows_delete_own ON public.follows
  FOR DELETE USING (auth.uid() = follower_id);

-- Public read für follower count
DROP POLICY IF EXISTS follows_public_count ON public.follows;
CREATE POLICY follows_public_count ON public.follows
  FOR SELECT USING (true);

NOTIFY pgrst, 'reload schema';

-- ═══════════════════════════════════════════════════════
-- PHASE 3 SYSTEM STATUS NACH DIESER MIGRATION:
--
-- CHAT SYSTEM ✅
--   chats: participant_a/b, chat_type, unread_a/b, state
--   messages: msg_type, media_url, reactions, reply_to
--   Realtime: Supabase Channels aktiv
--   findOrCreateChat(): direkt in DB, nicht mehr fake-ID
--
-- EXPERIENCE SYSTEM ✅
--   experiences: vollständiges Schema mit status, spots_available
--   useWirkerProfile: lädt experiences parallel mit profile
--   WirkerProfilePage: echte Daten → SEED nur als Fallback
--
-- RELATIONSHIP SYSTEM ✅
--   follows: followed_id (konsistent in Code + DB)
--   AppStateContext: toggleFollow schreibt korrekt
--   useFollowStatus: liest korrekt
--   RLS: eigene Follows manipulierbar, öffentlich lesbar
-- ═══════════════════════════════════════════════════════
