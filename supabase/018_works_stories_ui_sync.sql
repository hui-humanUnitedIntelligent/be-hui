-- ═══════════════════════════════════════════════════════════════════
-- HUI 018: works + stories table — UI/Schema sync
-- Ergänzt alle Spalten die HuiCreateFlow.jsx inserted aber noch nicht
-- in der Tabelle existieren.
-- Alle ADD COLUMN IF NOT EXISTS → idempotent, sicher zu re-run.
-- Datum: 2026-05-15
-- ═══════════════════════════════════════════════════════════════════

-- ══════════════════════════════════════════════
-- A. WORKS TABLE
-- ══════════════════════════════════════════════

-- Medien-Felder (aus ...base in handlePublish)
ALTER TABLE public.works
  ADD COLUMN IF NOT EXISTS media_url    text,
  ADD COLUMN IF NOT EXISTS media_type   text
    CHECK (media_type IS NULL OR media_type IN ('image','video')),
  ADD COLUMN IF NOT EXISTS caption      text;

-- cover_url: primäres Bild für DiscoveryFeed
ALTER TABLE public.works
  ADD COLUMN IF NOT EXISTS cover_url    text;

-- status: text-Version neben 'state' ENUM
ALTER TABLE public.works
  ADD COLUMN IF NOT EXISTS status       text NOT NULL DEFAULT 'published'
    CHECK (status IN ('draft','published','archived'));

-- Mood-Felder (aus ...base)
ALTER TABLE public.works
  ADD COLUMN IF NOT EXISTS mood_tags    text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS energy_level text,
  ADD COLUMN IF NOT EXISTS social_energy text;

-- Preis: UI nutzt 'price', v5 hat 'price_eur'
-- Beide koexistieren — kein Break
ALTER TABLE public.works
  ADD COLUMN IF NOT EXISTS price        numeric(10,2)
    CHECK (price IS NULL OR price >= 0);

-- Menge: UI nutzt 'quantity', v5 hat 'stock'
ALTER TABLE public.works
  ADD COLUMN IF NOT EXISTS quantity     integer DEFAULT 1;

-- Versand/Abholung als Boolean-Flags
ALTER TABLE public.works
  ADD COLUMN IF NOT EXISTS shipping_available boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS pickup_available   boolean DEFAULT false;

-- Lieferzeit als Freitext
ALTER TABLE public.works
  ADD COLUMN IF NOT EXISTS delivery_time text;

-- for_sale: zeigen vs. verkaufen
ALTER TABLE public.works
  ADD COLUMN IF NOT EXISTS for_sale     boolean DEFAULT true;

-- location als Freitext (neben der GEOGRAPHY-Spalte falls vorhanden)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'works'
      AND column_name  = 'location'
      AND udt_name     = 'text'
  ) THEN
    BEGIN
      ALTER TABLE public.works ADD COLUMN location_text text;
      RAISE NOTICE 'works.location_text added';
    EXCEPTION WHEN duplicate_column THEN NULL;
    END;
  END IF;
END $$;

-- Indizes für works
CREATE INDEX IF NOT EXISTS idx_works_status
  ON public.works(status) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_works_for_sale
  ON public.works(for_sale) WHERE for_sale = true;
CREATE INDEX IF NOT EXISTS idx_works_mood_tags
  ON public.works USING gin(mood_tags);
CREATE INDEX IF NOT EXISTS idx_works_cover_url
  ON public.works(cover_url) WHERE cover_url IS NOT NULL;

-- RLS für works
ALTER TABLE public.works ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS works_select_public ON public.works;
CREATE POLICY works_select_public ON public.works
  FOR SELECT USING (status = 'published' OR user_id = auth.uid());

DROP POLICY IF EXISTS works_insert_own ON public.works;
CREATE POLICY works_insert_own ON public.works
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS works_update_own ON public.works;
CREATE POLICY works_update_own ON public.works
  FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS works_delete_own ON public.works;
CREATE POLICY works_delete_own ON public.works
  FOR DELETE USING (user_id = auth.uid());

-- ══════════════════════════════════════════════
-- B. STORIES TABLE
-- ══════════════════════════════════════════════

-- media_url: direkter URL statt slides JSONB (UI-Vereinfachung)
ALTER TABLE public.stories
  ADD COLUMN IF NOT EXISTS media_url    text;

-- media_type: 'image' | 'video'
ALTER TABLE public.stories
  ADD COLUMN IF NOT EXISTS media_type   text
    CHECK (media_type IS NULL OR media_type IN ('image','video'));

-- caption: top-level Freitext (UI nutzt das, v5 hatte slides[].caption)
ALTER TABLE public.stories
  ADD COLUMN IF NOT EXISTS caption      text;

-- location: Ort als Freitext
ALTER TABLE public.stories
  ADD COLUMN IF NOT EXISTS location     text;

-- status: text-Version neben 'state' ENUM
ALTER TABLE public.stories
  ADD COLUMN IF NOT EXISTS status       text DEFAULT 'published'
    CHECK (status IS NULL OR status IN ('draft','published','archived'));

-- Mood-Felder
ALTER TABLE public.stories
  ADD COLUMN IF NOT EXISTS mood_tags    text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS energy_level text,
  ADD COLUMN IF NOT EXISTS social_energy text;

-- Indizes für stories
CREATE INDEX IF NOT EXISTS idx_stories_status
  ON public.stories(status) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_stories_media_url
  ON public.stories(media_url) WHERE media_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_stories_mood_tags
  ON public.stories USING gin(mood_tags);

-- RLS für stories (falls nicht schon vorhanden)
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS stories_select_public ON public.stories;
CREATE POLICY stories_select_public ON public.stories
  FOR SELECT USING (
    status = 'published'
    OR user_id = auth.uid()
    OR (expires_at IS NULL OR expires_at > NOW())
  );

DROP POLICY IF EXISTS stories_insert_own ON public.stories;
CREATE POLICY stories_insert_own ON public.stories
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS stories_update_own ON public.stories;
CREATE POLICY stories_update_own ON public.stories
  FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS stories_delete_own ON public.stories;
CREATE POLICY stories_delete_own ON public.stories
  FOR DELETE USING (user_id = auth.uid());

-- ══════════════════════════════════════════════
-- C. Schema-Cache refreshen
-- ══════════════════════════════════════════════
NOTIFY pgrst, 'reload schema';

-- ══════════════════════════════════════════════
-- D. Verifikation
-- ══════════════════════════════════════════════
SELECT 'works' AS tbl, column_name, data_type
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'works'
    AND column_name IN (
      'media_url','media_type','caption','cover_url','status',
      'mood_tags','energy_level','social_energy','price','quantity',
      'shipping_available','pickup_available','delivery_time','for_sale'
    )
UNION ALL
SELECT 'stories', column_name, data_type
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'stories'
    AND column_name IN (
      'media_url','media_type','caption','location',
      'status','mood_tags','energy_level','social_energy'
    )
ORDER BY tbl, column_name;

SELECT 'HUI 018 — works + stories sync ✓' AS status;
