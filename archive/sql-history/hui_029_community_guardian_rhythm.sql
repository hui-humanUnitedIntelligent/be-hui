-- ═══════════════════════════════════════════════════════════════
-- HUI PHASE C — COMMUNITY- & LIVE-REALITÄT
-- Migration: 029_community_guardian_rhythm.sql
--
-- Neue Tabellen:
--   communities           — Resonanzräume (Kern)
--   community_members     — Mitglieder mit Rollen
--   guardian_actions      — Interne Guardian-Protokollierung
--   visibility_reductions — Sanfte Sichtbarkeits-Dämpfung
--   rate_limits           — Rhythmus-Schutz (intern, unsichtbar)
--
-- ALLE Tabellen mit RLS.
-- Guardian-Aktionen NIEMALS öffentlich.
-- Rate-Limits NIEMALS als UI-Feedback anzeigen.
-- ═══════════════════════════════════════════════════════════════

-- ── communities ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.communities (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  description     TEXT,
  type            TEXT NOT NULL DEFAULT 'resonance_space',
  location_label  TEXT,             -- Stadt/Region (keine GPS-Koordinaten)
  is_public       BOOLEAN NOT NULL DEFAULT true,
  avatar_url      TEXT,
  cover_url       TEXT,
  created_by      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_count    INTEGER NOT NULL DEFAULT 0,
  quality_score   INTEGER NOT NULL DEFAULT 50,  -- intern, nie öffentlich
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_communities_location ON public.communities(location_label);
CREATE INDEX IF NOT EXISTS idx_communities_type     ON public.communities(type);

ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "communities_public_read" ON public.communities
  FOR SELECT USING (is_public = true);
CREATE POLICY IF NOT EXISTS "communities_own_write" ON public.communities
  FOR ALL USING (auth.uid() = created_by);

-- ── community_members ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.community_members (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id    UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role            TEXT NOT NULL DEFAULT 'member',    -- member | guardian | moderator
  joined_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  promoted_at     TIMESTAMPTZ,
  promotion_note  TEXT,
  UNIQUE (community_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_comm_members_community ON public.community_members(community_id);
CREATE INDEX IF NOT EXISTS idx_comm_members_user      ON public.community_members(user_id);

ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;
-- Alle Mitglieder sehen wer noch Mitglied ist
CREATE POLICY IF NOT EXISTS "members_community_read" ON public.community_members
  FOR SELECT USING (
    community_id IN (
      SELECT community_id FROM public.community_members WHERE user_id = auth.uid()
    )
    OR
    community_id IN (
      SELECT id FROM public.communities WHERE is_public = true
    )
  );
CREATE POLICY IF NOT EXISTS "members_own_write" ON public.community_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "members_own_delete" ON public.community_members
  FOR DELETE USING (auth.uid() = user_id);

-- ── guardian_actions ──────────────────────────────────────────
-- INTERN — niemals im öffentlichen UI anzeigen
CREATE TABLE IF NOT EXISTS public.guardian_actions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guardian_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  community_id      UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  target_member_id  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action            TEXT NOT NULL,
  energy            TEXT,    -- warm | steady | gentle | careful | joyful
  note              TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.guardian_actions ENABLE ROW LEVEL SECURITY;
-- Nur Guardians dieser Community sehen eigene Aktionen
CREATE POLICY IF NOT EXISTS "guardian_actions_own" ON public.guardian_actions
  FOR SELECT USING (auth.uid() = guardian_id);
CREATE POLICY IF NOT EXISTS "guardian_actions_write" ON public.guardian_actions
  FOR INSERT WITH CHECK (auth.uid() = guardian_id);

-- ── visibility_reductions ─────────────────────────────────────
-- Sanfte Dämpfung — KEIN öffentlicher Block
CREATE TABLE IF NOT EXISTS public.visibility_reductions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reduced_by    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_id    UUID NOT NULL,
  content_type  TEXT NOT NULL,
  community_id  UUID REFERENCES public.communities(id) ON DELETE CASCADE,
  reason        TEXT,
  is_permanent  BOOLEAN NOT NULL DEFAULT false,
  reversed_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.visibility_reductions ENABLE ROW LEVEL SECURITY;
-- Nur Service-Role/Moderator liest
CREATE POLICY IF NOT EXISTS "vis_reductions_service_only" ON public.visibility_reductions
  FOR ALL USING (false);

-- ── rate_limits ───────────────────────────────────────────────
-- Rhythmus-Schutz intern — User sieht NICHTS davon
CREATE TABLE IF NOT EXISTS public.rate_limits (
  user_id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  limited_until   TIMESTAMPTZ NOT NULL,
  reason          TEXT,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
-- User kann nicht sehen ob er limitiert ist (verhindert Manipulation)
CREATE POLICY IF NOT EXISTS "rate_limits_hidden" ON public.rate_limits
  FOR ALL USING (false);

-- ── profiles: lokale Felder ergänzen ─────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS reduced_reach_until TIMESTAMPTZ;

-- ── Kommentar ─────────────────────────────────────────────────
-- RHYTHMUS-SCHUTZ: Keine Streak-Tabellen, keine FOMO-Trigger.
-- GUARDIAN: Alle Aktionen intern — nie öffentlich sichtbar.
-- SPAM: Sichtbarkeits-Dämpfung statt Sperre.
-- Diese Migration ist idempotent (IF NOT EXISTS).
-- ═══════════════════════════════════════════════════════════════
