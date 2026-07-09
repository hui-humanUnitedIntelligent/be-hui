-- ═══════════════════════════════════════════════════════════════════════
-- HUI — Migration 073: Kommentarfunktion 1.0 (Living Design System)
--
-- BESTANDSANALYSE (per Live-Schema-Introspektion via Supabase REST, nicht
-- vermutet -- 2026-07-09):
--   Es existiert bereits eine "comments"-Tabelle (id, work_id, user_id,
--   text, created_at) -- aber ausschliesslich fuer Werke, ohne Threading,
--   ohne Bearbeiten/Loeschen (kein updated_at/deleted_at), ohne
--   Wertschaetzung (Herz), ohne Melden/Moderation. Genutzt in
--   WorkDetailPage.jsx + ContentPreviewSheet.jsx.
--
--   post_reactions/saved_posts sind bereits generisch ueber post_id+
--   post_type (freier Text, kein Enum) fuer ALLE Content-Typen aufgebaut
--   (Migration 060) -- dieselbe Konvention wird hier fortgesetzt statt
--   neu erfunden.
--
--   Kein Report-/Moderationssystem fuer Inhalte existiert bisher irgendwo
--   in der DB (geprueft: reports/content_reports/moderation -- keine
--   dieser Tabellen existiert). comment_reports ist daher echte
--   Neuentwicklung, keine Dopplung.
--
-- ENTSCHEIDUNG (Evolution statt Rewrite, siehe Architektur-Charta #1):
--   Die bestehende "comments"-Tabelle wird zu "post_comments" WEITER-
--   ENTWICKELT (umbenannt + erweitert), nicht durch eine zweite,
--   parallele Tabelle ersetzt. Alle bestehenden Werk-Kommentare bleiben
--   erhalten (post_type wird fuer sie auf 'work' gesetzt, post_id
--   uebernimmt 1:1 den bisherigen Wert aus work_id).
--
--   Spaltenname "user_id" (statt "author_id") bewusst beibehalten, um
--   konsistent mit der bereits etablierten Konvention in post_reactions/
--   saved_posts/comments zu bleiben (dasselbe Konzept, kein Zweitname).
--
-- Diese Datei ist rein additiv/idempotent (IF NOT EXISTS / IF EXISTS)
-- und kann gefahrlos erneut ausgefuehrt werden.
-- ═══════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. comments → post_comments (Umbenennung + Erweiterung) ──────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='comments')
     AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='post_comments') THEN
    ALTER TABLE public.comments RENAME TO post_comments;
  END IF;
END $$;

-- Falls weder "comments" noch "post_comments" existiert (frische DB) --
-- Tabelle direkt in Zielform anlegen.
CREATE TABLE IF NOT EXISTS public.post_comments (
  id                uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id           uuid        NOT NULL,
  post_type         text        NOT NULL DEFAULT 'work',
  user_id           uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  parent_comment_id uuid        REFERENCES public.post_comments(id) ON DELETE CASCADE,
  text              text        NOT NULL,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz,
  deleted_at        timestamptz
);

-- Falls die Tabelle aus der Umbenennung kam (alte Struktur: work_id statt
-- post_id, kein post_type/parent_comment_id/updated_at/deleted_at) --
-- Spalten additiv nachziehen.
ALTER TABLE public.post_comments
  ADD COLUMN IF NOT EXISTS post_type         text NOT NULL DEFAULT 'work',
  ADD COLUMN IF NOT EXISTS parent_comment_id uuid REFERENCES public.post_comments(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS updated_at        timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_at        timestamptz;

-- work_id -> post_id (nur falls die alte Spalte noch existiert, Daten
-- 1:1 uebernehmen, keine Daten verlieren).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='post_comments' AND column_name='work_id')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='post_comments' AND column_name='post_id') THEN
    ALTER TABLE public.post_comments RENAME COLUMN work_id TO post_id;
  END IF;
END $$;

ALTER TABLE public.post_comments ADD COLUMN IF NOT EXISTS post_id uuid;

CREATE INDEX IF NOT EXISTS idx_post_comments_post   ON public.post_comments (post_id, post_type, created_at);
CREATE INDEX IF NOT EXISTS idx_post_comments_parent ON public.post_comments (parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_user   ON public.post_comments (user_id, created_at DESC);

ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS pc_read   ON public.post_comments;
DROP POLICY IF EXISTS pc_insert ON public.post_comments;
DROP POLICY IF EXISTS pc_update ON public.post_comments;
DROP POLICY IF EXISTS pc_delete ON public.post_comments;
-- Lesen: alle (nicht geloeschte werden clientseitig gefiltert, Admin sieht alles)
CREATE POLICY pc_read   ON public.post_comments FOR SELECT USING (true);
-- Schreiben: nur eigene Kommentare anlegen
CREATE POLICY pc_insert ON public.post_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
-- Bearbeiten/Loeschen (Soft-Delete via UPDATE deleted_at): nur eigene Kommentare
CREATE POLICY pc_update ON public.post_comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY pc_delete ON public.post_comments FOR DELETE USING (auth.uid() = user_id);

-- ── 2. comment_hearts — Wertschaetzung pro Kommentar (Herz-Icon) ──────
CREATE TABLE IF NOT EXISTS public.comment_hearts (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id  uuid        NOT NULL REFERENCES public.post_comments(id) ON DELETE CASCADE,
  user_id     uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT  unique_comment_heart UNIQUE (comment_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_comment_hearts_comment ON public.comment_hearts (comment_id);
ALTER TABLE public.comment_hearts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS ch_read  ON public.comment_hearts;
DROP POLICY IF EXISTS ch_write ON public.comment_hearts;
CREATE POLICY ch_read  ON public.comment_hearts FOR SELECT USING (true);
CREATE POLICY ch_write ON public.comment_hearts FOR ALL    USING (auth.uid() = user_id);

-- ── 3. comment_reports — Melden (neue Faehigkeit, keine Dopplung) ────
CREATE TABLE IF NOT EXISTS public.comment_reports (
  id           uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id   uuid        NOT NULL REFERENCES public.post_comments(id) ON DELETE CASCADE,
  reporter_id  uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason       text        NOT NULL, -- 'spam' | 'beleidigung' | 'unangemessen'
  status       text        NOT NULL DEFAULT 'open', -- 'open' | 'reviewed' | 'dismissed'
  created_at   timestamptz NOT NULL DEFAULT now(),
  reviewed_at  timestamptz,
  CONSTRAINT   unique_comment_report UNIQUE (comment_id, reporter_id)
);
CREATE INDEX IF NOT EXISTS idx_comment_reports_status ON public.comment_reports (status, created_at DESC);
ALTER TABLE public.comment_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS cr_insert ON public.comment_reports;
DROP POLICY IF EXISTS cr_read_own ON public.comment_reports;
CREATE POLICY cr_insert   ON public.comment_reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY cr_read_own ON public.comment_reports FOR SELECT USING (auth.uid() = reporter_id);
-- Admin-Zugriff (alle Reports lesen/aktualisieren) laeuft ueber
-- asServiceRole im Backend -- keine Extra-Policy noetig (Service-Role
-- umgeht RLS grundsaetzlich).

-- ── 4. Realtime aktivieren (gleiche Lehre wie Migration 069/070) ─────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'post_comments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.post_comments;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'comment_hearts'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.comment_hearts;
  END IF;
END $$;

-- REPLICA IDENTITY FULL (wie saved_posts, Migration 070) -- DELETE-Events
-- liefern sonst nur die id-Spalte im payload.old, siehe MERKEN.3-Lehre.
ALTER TABLE public.post_comments  REPLICA IDENTITY FULL;
ALTER TABLE public.comment_hearts REPLICA IDENTITY FULL;

-- ── 5. countComments()-RPC — schnelle Zaehlung ohne Volltransfer ─────
CREATE OR REPLACE FUNCTION public.count_comments(p_post_id uuid, p_post_type text)
RETURNS integer
LANGUAGE sql STABLE
AS $$
  SELECT COUNT(*)::integer
  FROM public.post_comments
  WHERE post_id = p_post_id AND post_type = p_post_type AND deleted_at IS NULL;
$$;

-- ── 6. comment_heart_counts()-RPC — Batch-Zaehlung der Herzen pro
--    geladenem Kommentar-Set (vermeidet N Einzelabfragen im Client) ────
CREATE OR REPLACE FUNCTION public.comment_heart_counts(p_comment_ids uuid[])
RETURNS TABLE(comment_id uuid, count integer)
LANGUAGE sql STABLE
AS $$
  SELECT ch.comment_id, COUNT(*)::integer
  FROM public.comment_hearts ch
  WHERE ch.comment_id = ANY(p_comment_ids)
  GROUP BY ch.comment_id;
$$;

COMMIT;

-- ═══════════════════════════════════════════════════════════════════════
-- Manuell einmalig im Supabase SQL Editor ausfuehren (wie Migration 069/072).
-- Danach: bestehende Werk-Kommentare sind automatisch als post_type='work'
-- weiterhin vorhanden -- kein Datenverlust, keine App-Downtime noetig.
-- ═══════════════════════════════════════════════════════════════════════
