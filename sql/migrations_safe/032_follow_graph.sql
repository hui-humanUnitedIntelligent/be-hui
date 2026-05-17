-- ═══════════════════════════════════════════════════════════════════
-- HUI — Migration 032: Follow Graph Foundation
-- Phase 5D.1 Hotfix — 2026-05-17
-- ═══════════════════════════════════════════════════════════════════
--
-- ZWECK:
-- Produktionsreife follows-Tabelle als Fundament des Human Graph.
-- Spaltenname: followed_id (konsistent mit AppStateContext.jsx)
--
-- SICHERHEIT:
-- • Kein Self-Follow (CHECK constraint)
-- • UNIQUE(follower_id, followed_id) — kein Duplicate Edge
-- • ON DELETE CASCADE — kein Orphan-Follow
-- • RLS aktiviert — nur eigene Follows manipulierbar
-- • Vollständige Indexe für Graph-Queries
--
-- WICHTIG — Spaltenname:
-- AppStateContext.jsx nutzt "followed_id" (nicht "following_id").
-- Diese Migration ist konsistent damit.
--
-- AUSFÜHREN: Supabase SQL Editor → Run
-- ═══════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Tabelle erstellen (idempotent) ─────────────────────────────
CREATE TABLE IF NOT EXISTS public.follows (
  id           uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id  uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  followed_id  uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at   timestamptz DEFAULT now() NOT NULL,
  updated_at   timestamptz DEFAULT now() NOT NULL,

  -- Safety: kein Self-Follow
  CONSTRAINT no_self_follow CHECK (follower_id != followed_id),

  -- Kein Duplicate Edge
  CONSTRAINT unique_follow    UNIQUE (follower_id, followed_id)
);

-- ── 2. Indexe für Graph-Queries ────────────────────────────────────

-- Wem folgt User X? (loadFollows, useFollowStatus)
CREATE INDEX IF NOT EXISTS idx_follows_follower
  ON public.follows (follower_id, followed_id);

-- Wer folgt User X? (follower count, bridge calc)
CREATE INDEX IF NOT EXISTS idx_follows_followed
  ON public.follows (followed_id, follower_id);

-- Mutual-follow Query: beide Richtungen gleichzeitig
CREATE INDEX IF NOT EXISTS idx_follows_mutual
  ON public.follows (follower_id, followed_id, created_at DESC);

-- Zeitbasiert (follow churn, network growth metrics)
CREATE INDEX IF NOT EXISTS idx_follows_created
  ON public.follows (created_at DESC);

-- Für affinity queries: wer hat neulich gefolgt?
CREATE INDEX IF NOT EXISTS idx_follows_recent
  ON public.follows (followed_id, created_at DESC)
  WHERE created_at > now() - interval '30 days';

-- ── 3. Updated_at Trigger ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_follows_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_follows_updated_at ON public.follows;
CREATE TRIGGER trg_follows_updated_at
  BEFORE UPDATE ON public.follows
  FOR EACH ROW EXECUTE FUNCTION public.set_follows_updated_at();

-- ── 4. RLS aktivieren ──────────────────────────────────────────────
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- Cleanup: alte Policies entfernen (idempotent)
DROP POLICY IF EXISTS "follows_select_own"   ON public.follows;
DROP POLICY IF EXISTS "follows_select_public" ON public.follows;
DROP POLICY IF EXISTS "follows_insert_own"   ON public.follows;
DROP POLICY IF EXISTS "follows_delete_own"   ON public.follows;
DROP POLICY IF EXISTS "follows_update_deny"  ON public.follows;

-- ── 5. RLS Policies ────────────────────────────────────────────────

-- SELECT: eigene Follows lesen + öffentliche Follows sehen
-- (Discovery und Graph brauchen fremde follows zum Lesen)
CREATE POLICY "follows_select_public"
  ON public.follows FOR SELECT
  TO authenticated
  USING (true);
-- RATIONALE: Follow-Verbindungen sind öffentlich (wie auf jeder Plattform).
-- Nur die Manipulation ist geschützt.

-- INSERT: nur eigene Follows erstellen
CREATE POLICY "follows_insert_own"
  ON public.follows FOR INSERT
  TO authenticated
  WITH CHECK (
    follower_id = auth.uid()
    AND followed_id != auth.uid()  -- Doppel-Schutz zusätzlich zu CHECK constraint
  );

-- DELETE: nur eigene Follows löschen
CREATE POLICY "follows_delete_own"
  ON public.follows FOR DELETE
  TO authenticated
  USING (follower_id = auth.uid());

-- UPDATE: verboten (follows werden nur erstellt oder gelöscht)
CREATE POLICY "follows_update_deny"
  ON public.follows FOR UPDATE
  TO authenticated
  USING (false);

-- ── 6. Hilfsfunktionen für Graph-Queries ──────────────────────────

-- Mutual Follows zwischen zwei Usern prüfen
CREATE OR REPLACE FUNCTION public.get_mutual_follows(user_a uuid, user_b uuid)
RETURNS TABLE(user_id uuid) LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT f1.followed_id AS user_id
  FROM public.follows f1
  INNER JOIN public.follows f2
    ON f1.followed_id = f2.followed_id
  WHERE f1.follower_id = user_a
    AND f2.follower_id = user_b
    AND f1.followed_id != user_a
    AND f1.followed_id != user_b;
$$;

-- Gegenseitige Follows (A folgt B UND B folgt A)
CREATE OR REPLACE FUNCTION public.is_mutual_follow(user_a uuid, user_b uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.follows WHERE follower_id = user_a AND followed_id = user_b
  ) AND EXISTS (
    SELECT 1 FROM public.follows WHERE follower_id = user_b AND followed_id = user_a
  );
$$;

-- Follower Count (für Profile-Anzeige — ohne Ranking-Obsession)
CREATE OR REPLACE FUNCTION public.get_follow_counts(target_id uuid)
RETURNS TABLE(followers bigint, following bigint) LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT
    (SELECT count(*) FROM public.follows WHERE followed_id = target_id) AS followers,
    (SELECT count(*) FROM public.follows WHERE follower_id = target_id) AS following;
$$;

-- Gemeinsame Connections (für Graph-Nähe)
CREATE OR REPLACE FUNCTION public.get_shared_connections(user_a uuid, user_b uuid, lim int DEFAULT 20)
RETURNS TABLE(profile_id uuid, display_name text, avatar_url text) LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT p.id, p.display_name, p.avatar_url
  FROM public.follows fa
  INNER JOIN public.follows fb
    ON fa.followed_id = fb.followed_id
  INNER JOIN public.profiles p
    ON p.id = fa.followed_id
  WHERE fa.follower_id = user_a
    AND fb.follower_id = user_b
    AND fa.followed_id != user_a
    AND fa.followed_id != user_b
  LIMIT lim;
$$;

-- ── 7. Integrity View (für Observability) ─────────────────────────
CREATE OR REPLACE VIEW public.follow_graph_health AS
SELECT
  count(*)                                         AS total_follows,
  count(DISTINCT follower_id)                      AS unique_followers,
  count(DISTINCT followed_id)                      AS unique_followed,
  (SELECT count(*) FROM public.follows f1
   WHERE EXISTS (
     SELECT 1 FROM public.follows f2
     WHERE f2.follower_id = f1.followed_id
       AND f2.followed_id = f1.follower_id
   )) / 2                                          AS mutual_follow_pairs,
  round(avg(
    (SELECT count(*) FROM public.follows f2
     WHERE f2.follower_id = f1.followed_id)
  )::numeric, 2)                                   AS avg_followers_per_creator,
  max(created_at)                                  AS last_follow_at
FROM public.follows f1;

-- Anmerkung: View ist nur für Admins und Health-Monitoring.
-- Kein Follower-Leaderboard. Kein Ranking.

COMMIT;

-- ═══════════════════════════════════════════════════════════════════
-- VALIDIERUNG (nach Ausführung prüfen):
-- ═══════════════════════════════════════════════════════════════════
--
-- SELECT * FROM follow_graph_health;
-- → Sollte: total_follows=0, Tables korrekt, keine Fehler
--
-- INSERT INTO follows (follower_id, followed_id)
-- VALUES (auth.uid(), auth.uid());
-- → Sollte FEHLSCHLAGEN (no_self_follow constraint)
--
-- INSERT INTO follows (follower_id, followed_id)
-- VALUES ('...', '...'); -- zweimal gleich
-- → Zweiter INSERT sollte FEHLSCHLAGEN (unique_follow constraint)
--
-- ═══════════════════════════════════════════════════════════════════
