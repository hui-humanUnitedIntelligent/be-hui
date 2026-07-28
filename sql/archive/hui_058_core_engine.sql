-- ═══════════════════════════════════════════════════════════════════════
-- HUI CORE ENGINE — Migration 058
-- Phase 1: Wirkungsdaten-Fundament
--
-- Philosophie:
--   Die Core Engine erfasst KEINE Punkte, XP oder Scores.
--   Sie erfasst WIRKUNGSSIGNALE — echte menschliche Handlungen.
--
--   Sichtbar für den Nutzer:
--   NIEMALS Zahlen, Level, Badges, Ranglisten.
--   NUR das organisch gewachsene Orb-Symbol und natürliche Sprache.
--
--   Genutzt von:
--   Orb Engine · Feed Engine · Recommendation Engine · Project Engine
--   Impact Engine · Team Engine · zukünftige KI-Module
--
-- Additive-only: alle Statements sind idempotent.
-- ═══════════════════════════════════════════════════════════════════════

-- ─── Extensions (bereits vorhanden, zur Sicherheit) ───────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ═══════════════════════════════════════════════════════════════════════
-- 1. ENUM: hui_pillar
--    Die fünf Grundpfeiler der HUI-Philosophie.
--    Interner Bezeichner — niemals direkt als UI-Label verwendet.
-- ═══════════════════════════════════════════════════════════════════════
DO $$ BEGIN
  CREATE TYPE hui_pillar AS ENUM (
    'verbinden',      -- 🤝 Menschen zusammenbringen
    'unterstuetzen',  -- 💚 Anderen helfen
    'erschaffen',     -- 🎨 Neues entstehen lassen
    'wertschoepfen',  -- 🌱 Mehrwert für andere schaffen
    'impact'          -- 🌍 Positive Wirkung für Gemeinschaft
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ═══════════════════════════════════════════════════════════════════════
-- 2. ENUM: signal_category
--    Rohe Klassifizierung eines Wirkungssignals.
-- ═══════════════════════════════════════════════════════════════════════
DO $$ BEGIN
  CREATE TYPE signal_category AS ENUM (
    'connection',     -- Verbindung hergestellt
    'support',        -- Unterstützung gegeben/erhalten
    'creation',       -- Inhalt erschaffen (Werk, Erlebnis, Story, Projekt)
    'transaction',    -- Wertschöpfung (Kauf, Buchung, Zahlung)
    'impact_action',  -- Impact-Aktion (Stimme, Beitrag, Projekt-Start)
    'collaboration',  -- Zusammenarbeit (Buchung abgeschlossen, Empfehlung)
    'community'       -- Gemeinschafts-Signal (Resonanz, Weiterleitung)
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ═══════════════════════════════════════════════════════════════════════
-- 3. TABELLE: core_signals
--    Herzstück der Engine.
--    Jede echte menschliche Wirkungshandlung hinterlässt hier ein Signal.
--
--    Nicht: "User hat geliked"
--    Sondern: "User hat eine echte Verbindung initiiert"
--
--    Signals sind IMMUTABLE — kein UPDATE nach INSERT.
--    Löschen nur via soft-delete (voided_at).
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.core_signals (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Kategorisierung
  pillar          hui_pillar  NOT NULL,
  category        signal_category NOT NULL,
  signal_type     text        NOT NULL,   -- z.B. 'connection_created', 'work_published', 'booking_completed'

  -- Kontext (optional)
  target_user_id  uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  entity_id       uuid,       -- ID des referenzierten Objekts (work, experience, project, ...)
  entity_type     text,       -- 'work' | 'experience' | 'booking' | 'impact_project' | ...

  -- Gewicht — qualitatives Tiefensignal
  -- 1.0 = Standard-Aktion, 2.0 = tiefe Zusammenarbeit, 0.5 = leichtes Signal
  weight          numeric(4,2) NOT NULL DEFAULT 1.0 CHECK (weight > 0 AND weight <= 5.0),

  -- Richtung
  is_giving       boolean     NOT NULL DEFAULT true,  -- true = ich gebe, false = ich empfange

  -- Zeitstempel
  occurred_at     timestamptz NOT NULL DEFAULT now(), -- wann ist es tatsächlich passiert
  created_at      timestamptz NOT NULL DEFAULT now(),

  -- Soft-Delete
  voided_at       timestamptz,
  void_reason     text
);

-- Indices für Core Engine Queries
CREATE INDEX IF NOT EXISTS idx_core_signals_user_id
  ON public.core_signals(user_id) WHERE voided_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_core_signals_pillar
  ON public.core_signals(user_id, pillar) WHERE voided_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_core_signals_occurred
  ON public.core_signals(user_id, occurred_at DESC) WHERE voided_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_core_signals_entity
  ON public.core_signals(entity_id, entity_type) WHERE voided_at IS NULL;

-- ═══════════════════════════════════════════════════════════════════════
-- 4. TABELLE: core_profiles
--    Aggregierter Wirkungsstand eines Nutzers.
--    Wird durch Trigger automatisch aktualisiert.
--    NIEMALS direkt aus dem Frontend schreiben.
--
--    Kein Score. Kein Level. Keine Punkte.
--    Nur: wie stark lebt dieser Mensch welchen Grundpfeiler?
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.core_profiles (
  user_id             uuid    PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Wirkungsstärke pro Grundpfeiler (0.0–100.0, intern, nie als Zahl anzeigen)
  strength_verbinden      numeric(6,2) DEFAULT 0,
  strength_unterstuetzen  numeric(6,2) DEFAULT 0,
  strength_erschaffen     numeric(6,2) DEFAULT 0,
  strength_wertschoepfen  numeric(6,2) DEFAULT 0,
  strength_impact         numeric(6,2) DEFAULT 0,

  -- Dominante Grundpfeiler (top 3, sortiert)
  dominant_pillars    hui_pillar[]  DEFAULT '{}',

  -- Orb-State (für Orb Engine)
  -- Werte zwischen 0.0 und 1.0 — keine sichtbaren Zahlen
  orb_vitality        numeric(4,3)  DEFAULT 0.0,   -- "wie lebendig" das Blatt ist
  orb_depth           numeric(4,3)  DEFAULT 0.0,   -- Tiefe der Wirkung (Wiederholungen, Qualität)
  orb_breadth         numeric(4,3)  DEFAULT 0.0,   -- Breite (wie viele Grundpfeiler aktiv)
  orb_warmth          numeric(4,3)  DEFAULT 0.0,   -- Wärme (Geben vs. Nehmen Verhältnis)
  orb_last_changed    timestamptz,                  -- wann hat sich Orb zuletzt verändert

  -- Statistiken
  total_signals       integer  DEFAULT 0,
  active_since        timestamptz DEFAULT now(),

  -- Zeitstempel
  computed_at         timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_core_profiles_dominant
  ON public.core_profiles USING GIN(dominant_pillars);

-- ═══════════════════════════════════════════════════════════════════════
-- 5. TABELLE: core_connections
--    Verfolgt Wirkungsverbindungen zwischen Menschen.
--    Anders als follows: hier geht es um echte Wirkungsbeziehungen.
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.core_connections (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a          uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_b          uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Stärke der Verbindung (steigt mit echter Interaktion)
  bond_strength   numeric(5,2) DEFAULT 1.0,

  -- Welche Grundpfeiler verbinden diese Menschen?
  shared_pillars  hui_pillar[] DEFAULT '{}',

  -- Komplementarität: ergänzen sie sich?
  complementarity numeric(4,3) DEFAULT 0.0,   -- 0 = identisch, 1 = perfekte Ergänzung

  -- Zeitstempel
  first_signal_at timestamptz NOT NULL DEFAULT now(),
  last_signal_at  timestamptz NOT NULL DEFAULT now(),
  signal_count    integer DEFAULT 1,

  UNIQUE(user_a, user_b),
  CHECK(user_a < user_b)  -- Normalisierung: user_a immer < user_b (UUID sort)
);

CREATE INDEX IF NOT EXISTS idx_core_connections_user_a
  ON public.core_connections(user_a);
CREATE INDEX IF NOT EXISTS idx_core_connections_user_b
  ON public.core_connections(user_b);

-- ═══════════════════════════════════════════════════════════════════════
-- 6. TABELLE: core_content_signals
--    Verbindet Inhalte (works, experiences, posts, projects)
--    mit ihren Grundpfeilern. Wird vom Feed-Engine genutzt.
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.core_content_signals (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id       uuid        NOT NULL,
  entity_type     text        NOT NULL,   -- 'work' | 'experience' | 'post' | 'impact_project'
  creator_id      uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Grundpfeiler-Zuordnung (ein Inhalt kann mehrere haben)
  pillars         hui_pillar[] NOT NULL DEFAULT '{}',
  primary_pillar  hui_pillar,

  -- Wirkungstiefe dieses Inhalts (intern)
  depth_score     numeric(4,3) DEFAULT 0.5,

  created_at      timestamptz NOT NULL DEFAULT now(),

  UNIQUE(entity_id, entity_type)
);

CREATE INDEX IF NOT EXISTS idx_core_content_pillars
  ON public.core_content_signals USING GIN(pillars);

-- ═══════════════════════════════════════════════════════════════════════
-- 7. FUNKTION: core_record_signal()
--    Haupteinstieg der Core Engine.
--    Wird von allen anderen Services aufgerufen — niemals direkt aus dem Frontend.
--    Erstellt Signal + aktualisiert core_profiles atomisch.
-- ═══════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.core_record_signal(
  p_user_id       uuid,
  p_pillar        hui_pillar,
  p_category      signal_category,
  p_signal_type   text,
  p_weight        numeric DEFAULT 1.0,
  p_is_giving     boolean DEFAULT true,
  p_target_user   uuid    DEFAULT NULL,
  p_entity_id     uuid    DEFAULT NULL,
  p_entity_type   text    DEFAULT NULL,
  p_occurred_at   timestamptz DEFAULT now()
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_signal_id uuid;
BEGIN
  -- Signal einfügen
  INSERT INTO public.core_signals (
    user_id, pillar, category, signal_type,
    weight, is_giving,
    target_user_id, entity_id, entity_type,
    occurred_at
  ) VALUES (
    p_user_id, p_pillar, p_category, p_signal_type,
    p_weight, p_is_giving,
    p_target_user, p_entity_id, p_entity_type,
    p_occurred_at
  )
  RETURNING id INTO v_signal_id;

  -- core_profile initialisieren oder aktualisieren
  INSERT INTO public.core_profiles (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  -- Wirkungsstärke des entsprechenden Grundpfeilers erhöhen
  EXECUTE format(
    'UPDATE public.core_profiles SET
       strength_%I = LEAST(strength_%I + $1, 1000.0),
       total_signals = total_signals + 1,
       updated_at = now()
     WHERE user_id = $2',
    p_pillar::text, p_pillar::text
  ) USING p_weight, p_user_id;

  -- Verbindungssignal bilateral eintragen
  IF p_target_user IS NOT NULL AND p_target_user != p_user_id THEN
    INSERT INTO public.core_connections (
      user_a, user_b, shared_pillars, signal_count,
      first_signal_at, last_signal_at
    )
    VALUES (
      LEAST(p_user_id, p_target_user),
      GREATEST(p_user_id, p_target_user),
      ARRAY[p_pillar],
      1,
      now(), now()
    )
    ON CONFLICT (user_a, user_b) DO UPDATE SET
      bond_strength  = core_connections.bond_strength + (p_weight * 0.5),
      signal_count   = core_connections.signal_count + 1,
      last_signal_at = now(),
      shared_pillars = (
        SELECT ARRAY(
          SELECT DISTINCT unnest(core_connections.shared_pillars || ARRAY[p_pillar])
        )
      );
  END IF;

  RETURN v_signal_id;
END;
$$;

-- ═══════════════════════════════════════════════════════════════════════
-- 8. FUNKTION: core_compute_profile()
--    Berechnet alle abgeleiteten Werte aus den Rohdaten.
--    Wird periodisch aufgerufen (nicht bei jedem Signal).
--    Berechnet: dominant_pillars, orb_vitality, orb_depth, orb_breadth, orb_warmth
-- ═══════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.core_compute_profile(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_strengths     record;
  v_total         numeric;
  v_max           numeric;
  v_active_count  integer;
  v_giving_ratio  numeric;
  v_recent_count  integer;
  v_depth_score   numeric;
  v_dominant      hui_pillar[];
BEGIN
  -- Profile sicherstellen
  INSERT INTO public.core_profiles (user_id) VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  -- Stärken lesen
  SELECT
    strength_verbinden, strength_unterstuetzen, strength_erschaffen,
    strength_wertschoepfen, strength_impact,
    total_signals
  INTO v_strengths
  FROM public.core_profiles WHERE user_id = p_user_id;

  -- Gesamt-Summe
  v_total := COALESCE(v_strengths.strength_verbinden, 0)
           + COALESCE(v_strengths.strength_unterstuetzen, 0)
           + COALESCE(v_strengths.strength_erschaffen, 0)
           + COALESCE(v_strengths.strength_wertschoepfen, 0)
           + COALESCE(v_strengths.strength_impact, 0);

  IF v_total = 0 THEN RETURN; END IF;

  -- Maximum (für Normalisierung)
  v_max := GREATEST(
    v_strengths.strength_verbinden,
    v_strengths.strength_unterstuetzen,
    v_strengths.strength_erschaffen,
    v_strengths.strength_wertschoepfen,
    v_strengths.strength_impact
  );

  -- Anzahl aktiver Grundpfeiler (> 5% des Maximums)
  v_active_count := (
    CASE WHEN v_strengths.strength_verbinden     > v_max * 0.05 THEN 1 ELSE 0 END +
    CASE WHEN v_strengths.strength_unterstuetzen > v_max * 0.05 THEN 1 ELSE 0 END +
    CASE WHEN v_strengths.strength_erschaffen    > v_max * 0.05 THEN 1 ELSE 0 END +
    CASE WHEN v_strengths.strength_wertschoepfen > v_max * 0.05 THEN 1 ELSE 0 END +
    CASE WHEN v_strengths.strength_impact        > v_max * 0.05 THEN 1 ELSE 0 END
  );

  -- Geben-Ratio (wie viel gibt dieser Mensch relativ zu dem was er bekommt?)
  SELECT
    CASE WHEN COUNT(*) = 0 THEN 0.5
         ELSE COUNT(*) FILTER (WHERE is_giving) * 1.0 / COUNT(*)
    END
  INTO v_giving_ratio
  FROM public.core_signals
  WHERE user_id = p_user_id AND voided_at IS NULL;

  -- Kürzliche Aktivität (letzte 30 Tage)
  SELECT COUNT(*) INTO v_recent_count
  FROM public.core_signals
  WHERE user_id = p_user_id
    AND voided_at IS NULL
    AND occurred_at > now() - interval '30 days';

  -- Tiefe: Wie regelmäßig und wie qualitativ sind die Signale?
  SELECT
    CASE WHEN COUNT(*) = 0 THEN 0
         ELSE LEAST(AVG(weight) / 3.0, 1.0)
    END
  INTO v_depth_score
  FROM public.core_signals
  WHERE user_id = p_user_id AND voided_at IS NULL;

  -- Dominante Grundpfeiler (Top 3, nur wenn > 0)
  SELECT ARRAY(
    SELECT unnest::hui_pillar FROM (
      SELECT unnest, val FROM (VALUES
        ('verbinden'::text,     v_strengths.strength_verbinden),
        ('unterstuetzen'::text, v_strengths.strength_unterstuetzen),
        ('erschaffen'::text,    v_strengths.strength_erschaffen),
        ('wertschoepfen'::text, v_strengths.strength_wertschoepfen),
        ('impact'::text,        v_strengths.strength_impact)
      ) t(unnest, val)
      WHERE val > 0
      ORDER BY val DESC
      LIMIT 3
    ) ordered
  ) INTO v_dominant;

  -- Update core_profiles
  UPDATE public.core_profiles SET
    dominant_pillars = v_dominant,

    -- Vitalität: kombiniert aus Gesamt-Aktivität + kürzlicher Aktivität
    orb_vitality = LEAST(
      (LEAST(v_strengths.total_signals::numeric / 50.0, 1.0) * 0.6) +
      (LEAST(v_recent_count::numeric / 10.0, 1.0) * 0.4),
      1.0
    ),

    -- Tiefe: Qualität der Signale
    orb_depth = LEAST(v_depth_score, 1.0),

    -- Breite: Anzahl aktiver Grundpfeiler / 5
    orb_breadth = LEAST(v_active_count / 5.0, 1.0),

    -- Wärme: Geben-Ratio (0.5 = ausgeglichen, 1.0 = gibt viel)
    orb_warmth = LEAST(v_giving_ratio, 1.0),

    orb_last_changed = now(),
    computed_at = now(),
    updated_at = now()
  WHERE user_id = p_user_id;
END;
$$;

-- ═══════════════════════════════════════════════════════════════════════
-- 9. RLS POLICIES
-- ═══════════════════════════════════════════════════════════════════════

-- core_signals: nur eigene lesen
ALTER TABLE public.core_signals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS core_signals_select_own ON public.core_signals;
CREATE POLICY core_signals_select_own ON public.core_signals
  FOR SELECT USING (auth.uid() = user_id);

-- core_profiles: eigenes lesen + öffentliche Felder für andere
ALTER TABLE public.core_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS core_profiles_select_own ON public.core_profiles;
CREATE POLICY core_profiles_select_own ON public.core_profiles
  FOR SELECT USING (auth.uid() = user_id);

-- core_connections: eigene lesen
ALTER TABLE public.core_connections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS core_connections_select ON public.core_connections;
CREATE POLICY core_connections_select ON public.core_connections
  FOR SELECT USING (auth.uid() = user_a OR auth.uid() = user_b);

-- core_content_signals: alle lesen (Inhalt ist public)
ALTER TABLE public.core_content_signals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS core_content_signals_select ON public.core_content_signals;
CREATE POLICY core_content_signals_select ON public.core_content_signals
  FOR SELECT USING (true);

-- ═══════════════════════════════════════════════════════════════════════
-- 10. KOMMENTARE
-- ═══════════════════════════════════════════════════════════════════════
COMMENT ON TABLE public.core_signals IS
  'HUI Core Engine — Wirkungssignale. Immutable. Niemals direkt aus Frontend schreiben.';
COMMENT ON TABLE public.core_profiles IS
  'HUI Core Engine — Aggregierter Wirkungsstand. Wird durch core_compute_profile() befüllt.';
COMMENT ON TABLE public.core_connections IS
  'HUI Core Engine — Wirkungsverbindungen zwischen Menschen. Keine Follow-Mechanik.';
COMMENT ON TABLE public.core_content_signals IS
  'HUI Core Engine — Grundpfeiler-Zuordnung für Inhalte. Wird vom Feed-Engine genutzt.';
COMMENT ON FUNCTION public.core_record_signal IS
  'HUI Core Engine — Haupteinstieg. Alle anderen Services rufen dies auf.';
COMMENT ON FUNCTION public.core_compute_profile IS
  'HUI Core Engine — Periodische Neuberechnung des Wirkungsstands. Nicht bei jedem Signal.';
