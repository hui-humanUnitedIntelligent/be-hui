-- ═══════════════════════════════════════════════════════════════════
-- HUI 017: experiences table — UI/Schema sync
-- Ergänzt alle Spalten die HuiCreateFlow.jsx inserted aber noch nicht
-- in der Tabelle existieren.
-- Alle ALTER TABLE ADD COLUMN IF NOT EXISTS → idempotent, sicher zu re-run.
-- Bestehende Daten werden NICHT verändert.
-- Datum: 2026-05-15
-- ═══════════════════════════════════════════════════════════════════

-- ── 1. Kernspalten die das Insert-Objekt aus handlePublish braucht ──

-- media_url: URL des hochgeladenen Bildes/Videos (kommt aus ...base)
ALTER TABLE public.experiences
  ADD COLUMN IF NOT EXISTS media_url    text;

-- media_type: 'image' oder 'video'
ALTER TABLE public.experiences
  ADD COLUMN IF NOT EXISTS media_type   text
    CHECK (media_type IS NULL OR media_type IN ('image','video'));

-- caption: Freitext-Caption (aus ...base)
ALTER TABLE public.experiences
  ADD COLUMN IF NOT EXISTS caption      text;

-- status: published/draft/archived — UI nutzt 'status' text
-- (neben dem bestehenden 'state' ENUM — beide können koexistieren)
ALTER TABLE public.experiences
  ADD COLUMN IF NOT EXISTS status       text NOT NULL DEFAULT 'published'
    CHECK (status IN ('draft','published','archived'));

-- location: text (Freitext-Adresse aus UI — neben der GEOGRAPHY-Spalte)
-- WICHTIG: 'location' als GEOGRAPHY existiert ggf. schon als GEOGRAPHY-Typ.
-- Wir benennen die UI-Freitext-Version 'location_text' falls Konflikt.
DO $$
BEGIN
  -- Prüfe ob 'location' bereits als GEOGRAPHY-Spalte existiert
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'experiences'
      AND column_name  = 'location'
      AND data_type    != 'text'
      AND udt_name     != 'text'
  ) THEN
    -- location ist GEOGRAPHY — text-version als location_text anlegen
    ALTER TABLE public.experiences
      ADD COLUMN IF NOT EXISTS location_text text;
    RAISE NOTICE 'location_text added (location column exists as geo-type)';
  ELSE
    -- location existiert noch nicht oder ist bereits text → einfach ADD
    ALTER TABLE public.experiences
      ADD COLUMN IF NOT EXISTS location text;
    RAISE NOTICE 'location added as text';
  END IF;
END $$;

-- ── 2. Fehlende fachliche Spalten ──

-- price: numerischer Preis (UI nutzt 'price', v5 hatte 'price_per_session_eur')
-- Beide Spalten koexistieren — kein Datenverlust
ALTER TABLE public.experiences
  ADD COLUMN IF NOT EXISTS price        numeric(10,2)
    CHECK (price IS NULL OR price >= 0);

-- price_type: 'stunde'|'session'|'tag'|'fest'
ALTER TABLE public.experiences
  ADD COLUMN IF NOT EXISTS price_type   text
    CHECK (price_type IS NULL OR price_type IN ('stunde','session','tag','fest'));

-- format: 'online'|'vor-ort'|'hybrid'
-- (neben location_type aus v5 — coexistenz, kein Break)
ALTER TABLE public.experiences
  ADD COLUMN IF NOT EXISTS format       text DEFAULT 'online'
    CHECK (format IS NULL OR format IN ('online','vor-ort','hybrid','on_site','remote','flexible'));

-- duration: Freitext-Dauer z.B. "2h", "90 Minuten"
-- (neben duration_min integer aus v5)
ALTER TABLE public.experiences
  ADD COLUMN IF NOT EXISTS duration     text;

-- available_days: Freitext z.B. "Mo–Fr" oder text[]
-- PGRST204-Fehler tritt genau hier auf — wichtigste Spalte
ALTER TABLE public.experiences
  ADD COLUMN IF NOT EXISTS available_days text;

-- language: Unterrichtssprache
ALTER TABLE public.experiences
  ADD COLUMN IF NOT EXISTS language     text DEFAULT 'Deutsch';

-- ── 3. Mood / Atmosphären-Felder ──

-- mood_tags: array aus moodUtils (aus ...base)
ALTER TABLE public.experiences
  ADD COLUMN IF NOT EXISTS mood_tags    text[] DEFAULT '{}';

-- energy_level: z.B. 'low'|'medium'|'high'
ALTER TABLE public.experiences
  ADD COLUMN IF NOT EXISTS energy_level text;

-- social_energy: z.B. 'solo'|'small-group'|'large-group'
ALTER TABLE public.experiences
  ADD COLUMN IF NOT EXISTS social_energy text;

-- ── 4. Bestehende Spalten sichern / updated_at Trigger ──

-- Falls updated_at noch nicht existiert
ALTER TABLE public.experiences
  ADD COLUMN IF NOT EXISTS updated_at   timestamptz NOT NULL DEFAULT NOW();

-- Trigger: updated_at automatisch aktualisieren
CREATE OR REPLACE FUNCTION public.hui_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_experiences_updated_at ON public.experiences;
CREATE TRIGGER trg_experiences_updated_at
  BEFORE UPDATE ON public.experiences
  FOR EACH ROW EXECUTE FUNCTION public.hui_set_updated_at();

-- ── 5. Indizes für neue Spalten ──

CREATE INDEX IF NOT EXISTS idx_exp_status
  ON public.experiences(status)
  WHERE status = 'published';

CREATE INDEX IF NOT EXISTS idx_exp_format
  ON public.experiences(format);

CREATE INDEX IF NOT EXISTS idx_exp_language
  ON public.experiences(language);

CREATE INDEX IF NOT EXISTS idx_exp_mood_tags
  ON public.experiences USING gin(mood_tags);

-- ── 6. RLS sichern (falls noch nicht vorhanden) ──

ALTER TABLE public.experiences ENABLE ROW LEVEL SECURITY;

-- Öffentliche published Experiences lesen
DROP POLICY IF EXISTS exp_select_public ON public.experiences;
CREATE POLICY exp_select_public ON public.experiences
  FOR SELECT USING (status = 'published' OR user_id = auth.uid());

-- Eigene Experiences anlegen
DROP POLICY IF EXISTS exp_insert_own ON public.experiences;
CREATE POLICY exp_insert_own ON public.experiences
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Eigene Experiences bearbeiten
DROP POLICY IF EXISTS exp_update_own ON public.experiences;
CREATE POLICY exp_update_own ON public.experiences
  FOR UPDATE USING (user_id = auth.uid());

-- Eigene Experiences löschen
DROP POLICY IF EXISTS exp_delete_own ON public.experiences;
CREATE POLICY exp_delete_own ON public.experiences
  FOR DELETE USING (user_id = auth.uid());

-- ── 7. Schema-Cache refreshen (PostgREST) ──
-- Das behebt den PGRST204 "column not found in schema cache" Fehler
NOTIFY pgrst, 'reload schema';

-- ── 8. Verifikation ──
SELECT
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name   = 'experiences'
ORDER BY ordinal_position;

SELECT 'HUI 017 — experiences sync ✓' AS status;
