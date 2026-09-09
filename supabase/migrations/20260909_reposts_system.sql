-- 20260909_reposts_system.sql
-- SUPPORT-PROJECT-001 Folge-Prompt: REPOST-SYSTEM-001 (2026-09-09)
-- ═══════════════════════════════════════════════════════════════════
-- Neue Tabelle `reposts` — Nutzer koennen Werke/Talente/Erlebnisse/
-- Projekte in ihr eigenes Profil/Feed "republizieren" (mit optionalem
-- eigenem Kommentar). Momente sind ausdruecklich AUSGESCHLOSSEN
-- (Michaels Vorgabe) -- als harte DB-CHECK-Constraint UND clientseitig.
--
-- Architektur: 1:1 dem bestehenden saved_posts/post_reactions-Muster
-- entnommen (Erweitern statt duplizieren, HUI-Architektur-Charta
-- Prinzip 1) -- KEINE neue Infrastruktur-Art, nur eine neue Tabelle
-- nach bekanntem Zuschnitt:
--   - post_data (jsonb) = Snapshot-Feld wie saved_posts.post_data,
--     damit der Feed reposts ohne Zusatz-Join rendern kann.
--   - RLS-Split analog post_reactions: OEFFENTLICH lesbar (rp_read,
--     damit andere Nutzer den Repost im Feed sehen), Schreiben nur
--     durch den Ersteller (rp_write).
--   - REPLICA IDENTITY FULL von Anfang an (Lehre aus saved_posts-
--     Nachtrag 070: DELETE-Realtime-Events brauchen alle Spalten im
--     old-Record, sonst matcht ein user_id-gefilterter Client-Listener
--     nie) -- kein Nachtrag noetig.
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.reposts (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL,
  original_type text NOT NULL,
  original_id   uuid NOT NULL,
  caption       text,
  post_data     jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT reposts_original_type_check
    CHECK (original_type IN ('work', 'talent', 'experience', 'project')),
  CONSTRAINT reposts_caption_length_check
    CHECK (caption IS NULL OR char_length(caption) <= 500)
);

-- Ein Nutzer kann denselben Original-Post nur EINMAL reposten
-- (Anforderung 6, Keine Repost-Ketten wird zusaetzlich clientseitig
-- erzwungen: RepostModal wird fuer type="repost" gar nicht angeboten).
CREATE UNIQUE INDEX IF NOT EXISTS unique_repost
  ON public.reposts (user_id, original_type, original_id);

CREATE INDEX IF NOT EXISTS idx_reposts_user
  ON public.reposts (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reposts_original
  ON public.reposts (original_type, original_id);

ALTER TABLE public.reposts ENABLE ROW LEVEL SECURITY;

CREATE POLICY rp_read ON public.reposts
  FOR SELECT USING (true);

CREATE POLICY rp_write ON public.reposts
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- updated_at-Trigger (kanonische Funktion, siehe Memory #539 --
-- existiert bereits systemweit, hier nur referenziert, nicht neu
-- definiert).
CREATE TRIGGER trg_reposts_updated_at
  BEFORE UPDATE ON public.reposts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Realtime (Anforderung 8) + REPLICA IDENTITY FULL sofort (siehe
-- Kommentar oben -- vermeidet den saved_posts-Nachtrag-Bug von Anfang an).
ALTER TABLE public.reposts REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'reposts'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.reposts;
  END IF;
END $$;
