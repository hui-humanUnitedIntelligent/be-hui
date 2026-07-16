-- ═══════════════════════════════════════════════════════════════
-- HUI PHASE B — SYSTEM- & BACKEND-LOGIK
-- Migration: 028_resonance_trust_events_points.sql
-- 
-- Neue Tabellen:
--   resonances          — Resonanz-Objekte (kein Like-System)
--   trust_signals       — Interne Trust-Ereignisse
--   platform_events     — Plattform-Nervensystem (Event Layer)
--   hui_points_ledger   — Punkte-Vorbereitungs-Ledger
--   content_flags       — Community Health: Meldungen
--
-- ALLE Tabellen mit RLS geschützt.
-- Keine öffentlichen Scores — nur interne Intelligenz.
-- ═══════════════════════════════════════════════════════════════

-- ── resonances ───────────────────────────────────────────────
-- Ersetzt work_likes / work_saves durch ein flexibles Resonanzsystem
CREATE TABLE IF NOT EXISTS public.resonances (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type     TEXT NOT NULL,    -- 'work' | 'experience' | 'profile' | 'community' | 'impact_project'
  target_id       UUID NOT NULL,
  resonance_type  TEXT NOT NULL,    -- 'inspired' | 'saved' | 'connected' | 'recommended' | 'participated' | 'deep_resonance'
  weight          INTEGER NOT NULL DEFAULT 1,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, target_type, target_id, resonance_type)
);

-- Index für schnelle Abfragen
CREATE INDEX IF NOT EXISTS idx_resonances_target ON public.resonances(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_resonances_user   ON public.resonances(user_id);

-- RLS
ALTER TABLE public.resonances ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "resonances_own_read"   ON public.resonances FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "resonances_own_write"  ON public.resonances FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "resonances_own_delete" ON public.resonances FOR DELETE USING (auth.uid() = user_id);
-- Öffentliche Resonanz-Counts (ohne User-Identität): über DB-View oder RPC
CREATE POLICY IF NOT EXISTS "resonances_public_count" ON public.resonances FOR SELECT USING (true);

-- ── trust_signals ─────────────────────────────────────────────
-- Interne Trust-Ereignisse — NIEMALS direkt im UI anzeigen
CREATE TABLE IF NOT EXISTS public.trust_signals (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  signal_type   TEXT NOT NULL,    -- TRUST_SIGNALS key
  delta         INTEGER NOT NULL, -- Positive oder negative Änderung
  context_id    UUID,             -- Optional: booking_id, connection_id etc.
  context_type  TEXT,             -- Optional: 'booking' | 'recommendation' etc.
  note          TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trust_signals_user ON public.trust_signals(user_id, created_at DESC);

ALTER TABLE public.trust_signals ENABLE ROW LEVEL SECURITY;
-- Nur Moderatoren/Service-Role können Trust-Signale lesen
CREATE POLICY IF NOT EXISTS "trust_signals_service_only" ON public.trust_signals
  FOR ALL USING (false); -- Frontend-Zugriff verboten — nur via RPC/Service-Role

-- trust_score auf profiles ergänzen (falls noch nicht vorhanden)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS trust_score INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'basis_user';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_member BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS member_since TIMESTAMPTZ;

-- ── platform_events ───────────────────────────────────────────
-- Nervensystem der Plattform — alle wichtigen Aktionen
CREATE TABLE IF NOT EXISTS public.platform_events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type    TEXT NOT NULL,    -- PLATFORM_EVENTS value
  actor_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_id     UUID,
  target_type   TEXT,
  recipient_id  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata      JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_platform_events_actor   ON public.platform_events(actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_platform_events_type    ON public.platform_events(event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_platform_events_target  ON public.platform_events(target_id, target_type);

ALTER TABLE public.platform_events ENABLE ROW LEVEL SECURITY;
-- User kann eigene Events sehen
CREATE POLICY IF NOT EXISTS "events_actor_read" ON public.platform_events
  FOR SELECT USING (auth.uid() = actor_id);
-- Insert nur für eigene Events
CREATE POLICY IF NOT EXISTS "events_actor_write" ON public.platform_events
  FOR INSERT WITH CHECK (auth.uid() = actor_id);

-- ── hui_points_ledger ─────────────────────────────────────────
-- Vorbereitungs-Ledger für HUI Punkte — noch nicht öffentlich aktiv
CREATE TABLE IF NOT EXISTS public.hui_points_ledger (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source        TEXT NOT NULL,    -- POINTS_SOURCES key
  points        INTEGER NOT NULL,
  category      TEXT NOT NULL,    -- POINTS_CATEGORIES key
  context_id    UUID,
  context_type  TEXT,
  one_time_key  TEXT,             -- Für idempotente Vergabe
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, one_time_key) -- Kein Doppel-Vergabe
);

CREATE INDEX IF NOT EXISTS idx_points_user ON public.hui_points_ledger(user_id);

ALTER TABLE public.hui_points_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "points_own_read" ON public.hui_points_ledger
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "points_own_write" ON public.hui_points_ledger
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ── content_flags ─────────────────────────────────────────────
-- Community Health: Meldungen gehen ins interne Review
CREATE TABLE IF NOT EXISTS public.content_flags (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_id    UUID NOT NULL,
  content_type  TEXT NOT NULL,  -- 'message' | 'work' | 'story' | 'profile'
  community_id  UUID,
  reason        TEXT NOT NULL,  -- 'disrespectful' | 'spam' | 'inappropriate' | 'other'
  note          TEXT,
  status        TEXT NOT NULL DEFAULT 'pending',  -- 'pending' | 'reviewed' | 'resolved'
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (reporter_id, content_id)
);

ALTER TABLE public.content_flags ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "flags_own_write" ON public.content_flags
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);
-- Moderatoren lesen über Service-Role

-- ── Kommentar ─────────────────────────────────────────────────
-- Diese Migration ist idempotent (IF NOT EXISTS / IF NOT EXISTS).
-- Sicher auf einer bestehenden DB auszuführen.
-- ═══════════════════════════════════════════════════════════════
