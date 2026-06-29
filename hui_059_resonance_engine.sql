-- ═══════════════════════════════════════════════════════════════════════
-- HUI CORE ENGINE — Migration 059
-- Phase 1.5: Resonanz Engine
--
-- Philosophie:
--   Handlung ≠ Wirkung.
--   Wirkung entsteht erst, wenn andere Menschen tatsächlich reagieren.
--
--   Diese Migration erweitert die bestehende Core Engine additiv.
--   Keine bestehende Tabelle wird verändert — nur ergänzt.
--   Kein Breaking Change. Keine Duplikation.
--
-- Architektur:
--   Ebene 1: HANDLUNG      — etwas ist passiert            (signal_layer = 'action')
--   Ebene 2: RESONANZ      — andere haben reagiert          (signal_layer = 'resonance')
--   Ebene 3: WIRKUNG       — bestätigte, dauerhafte Wirkung (signal_layer = 'impact')
--
--   Nur Signale auf Ebene 3 (impact) dürfen:
--   ✓ den Orb beeinflussen
--   ✓ Empfehlungen verbessern
--   ✓ Feed-Semantik verändern
--   ✓ langfristige Wirkungsprofile schreiben
--
-- Additive-only: alle Statements sind idempotent.
-- ═══════════════════════════════════════════════════════════════════════


-- ═══════════════════════════════════════════════════════════════════════
-- 1. ENUM: signal_layer
--    Die drei semantischen Ebenen der HUI-Wirkungsarchitektur.
--    Wird als neue Spalte in core_signals ergänzt.
-- ═══════════════════════════════════════════════════════════════════════
DO $$ BEGIN
  CREATE TYPE signal_layer AS ENUM (
    'action',     -- Ebene 1: Handlung  — jemand hat etwas getan
    'resonance',  -- Ebene 2: Resonanz  — andere haben reagiert
    'impact'      -- Ebene 3: Wirkung   — bestätigte, dauerhafte Wirkung
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ═══════════════════════════════════════════════════════════════════════
-- 2. core_signals ERGÄNZUNGEN
--    Additive Spalten — bestehende Daten bleiben vollständig erhalten.
--
--    signal_layer:      In welcher Ebene lebt dieses Signal?
--    source_signal_id:  Auf welche Handlung antwortet diese Resonanz?
--                       NULL bei Handlungen (Ebene 1), gesetzt bei Resonanz/Wirkung.
--    resonance_count:   Wie viele Menschen haben auf diese Handlung reagiert?
--                       Wird inkrementell hochgezählt (nur auf Ebene 1 Signalen).
--    echo_depth:        Wie weit hat sich die Wirkung ausgebreitet?
--                       0 = keine Resonanz, 1 = direkte Antwort, 2 = Weiterempfehlung, ...
-- ═══════════════════════════════════════════════════════════════════════
ALTER TABLE public.core_signals
  ADD COLUMN IF NOT EXISTS signal_layer       signal_layer  NOT NULL DEFAULT 'action',
  ADD COLUMN IF NOT EXISTS source_signal_id   uuid
    REFERENCES public.core_signals(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS resonance_count    integer       NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS echo_depth         smallint      NOT NULL DEFAULT 0
    CHECK (echo_depth >= 0 AND echo_depth <= 5);

-- Bestehende Signale klassifizieren:
-- Signale die bereits faktisch Resonanz sind → 'resonance'
-- Alle anderen → bleiben 'action' (Default greift bereits)
UPDATE public.core_signals
  SET signal_layer = 'resonance'
  WHERE signal_type IN (
    'connection_accepted',
    'work_sold',
    'experience_booked',
    'booking_completed',
    'service_delivered',
    'impact_project_supported',
    'recommendation_given'
  )
  AND signal_layer = 'action';  -- Idempotenz

-- Indices für Resonanz-Queries
CREATE INDEX IF NOT EXISTS idx_core_signals_layer
  ON public.core_signals(user_id, signal_layer) WHERE voided_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_core_signals_source
  ON public.core_signals(source_signal_id) WHERE source_signal_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_core_signals_resonance_count
  ON public.core_signals(resonance_count DESC, signal_layer)
  WHERE voided_at IS NULL AND signal_layer = 'action';


-- ═══════════════════════════════════════════════════════════════════════
-- 3. core_profiles ERGÄNZUNGEN
--    Resonanzgewichtete Wirkungsstärke — getrennt von rohen Handlungs-Signalen.
--
--    resonance_strength_*:
--      Wie viel Resonanz hat dieser Mensch in diesem Grundpfeiler erzeugt?
--      Steigt NUR wenn andere Menschen tatsächlich reagiert haben.
--      Basis für den Orb (ersetzt strength_* als Orb-Eingabe).
--
--    impact_depth:
--      Durchschnittliche Resonanztiefe über alle Grundpfeiler.
--      Organisches Maß dafür wie weit Wirkung kreist.
--
--    resonance_ratio:
--      Anteil der Handlungen die tatsächlich Resonanz erzeugt haben.
--      0.0 = keine Resonanz, 1.0 = jede Handlung wurde aufgenommen.
--      Interner Wert — nie als Zahl anzeigen.
-- ═══════════════════════════════════════════════════════════════════════
ALTER TABLE public.core_profiles
  -- Resonanzgewichtete Stärke pro Grundpfeiler
  ADD COLUMN IF NOT EXISTS resonance_verbinden      numeric(6,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS resonance_unterstuetzen  numeric(6,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS resonance_erschaffen     numeric(6,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS resonance_wertschoepfen  numeric(6,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS resonance_impact         numeric(6,2) DEFAULT 0,

  -- Übergreifende Resonanz-Metriken
  ADD COLUMN IF NOT EXISTS impact_depth        numeric(4,3) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS resonance_ratio     numeric(4,3) DEFAULT 0,

  -- Anzahl der Handlungen die Resonanz erzeugt haben
  ADD COLUMN IF NOT EXISTS resonant_action_count  integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_action_count     integer DEFAULT 0;


-- ═══════════════════════════════════════════════════════════════════════
-- 4. TABELLE: core_resonance_chains
--    Verfolgt die vollständige Resonanzkette einer Handlung.
--    "Werk → Kauf → Weiterempfehlung → Impact" — die ganze Spirale.
--
--    Diese Tabelle existiert ausschließlich für Analyse und Orb-Berechnung.
--    Niemals direkt im UI anzeigen.
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.core_resonance_chains (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Ursprüngliche Handlung (Ebene 1)
  root_signal_id    uuid        NOT NULL REFERENCES public.core_signals(id) ON DELETE CASCADE,
  root_user_id      uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  root_pillar       hui_pillar  NOT NULL,
  root_signal_type  text        NOT NULL,

  -- Resonanz-Ereignisse (JSON-Array — effizient, flexibel)
  -- Jeder Eintrag: { signal_id, user_id, signal_type, layer, occurred_at, depth }
  chain_events      jsonb       NOT NULL DEFAULT '[]',

  -- Aggregierte Metriken der Kette
  chain_depth       smallint    NOT NULL DEFAULT 0,  -- max echo_depth in dieser Kette
  participant_count integer     NOT NULL DEFAULT 0,  -- wie viele verschiedene Menschen
  pillar_spread     hui_pillar[] DEFAULT '{}',        -- welche Grundpfeiler wurden berührt

  -- Wurde Wirkung (Ebene 3) bestätigt?
  has_impact        boolean     NOT NULL DEFAULT false,
  impact_confirmed_at timestamptz,

  -- Zeitstempel
  started_at        timestamptz NOT NULL DEFAULT now(),
  last_echo_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_resonance_chains_root_user
  ON public.core_resonance_chains(root_user_id);

CREATE INDEX IF NOT EXISTS idx_resonance_chains_root_signal
  ON public.core_resonance_chains(root_signal_id);

CREATE INDEX IF NOT EXISTS idx_resonance_chains_has_impact
  ON public.core_resonance_chains(root_user_id, has_impact)
  WHERE has_impact = true;


-- ═══════════════════════════════════════════════════════════════════════
-- 5. FUNKTION: core_record_resonance()
--    Neuer Haupteinstieg für Resonanz-Signale.
--    Wird aufgerufen wenn jemand auf eine Handlung eines anderen reagiert.
--
--    Was diese Funktion tut:
--    1. Schreibt ein Signal auf Ebene 2 (resonance)
--    2. Erhöht resonance_count auf dem Quell-Signal (Ebene 1)
--    3. Berechnet echo_depth (wie tief in der Kette?)
--    4. Aktualisiert / erstellt die Resonanzkette
--    5. Prüft ob Wirkung (Ebene 3) entstanden ist
--    6. Löst ggf. core_confirm_impact() aus
--
--    Wichtig: Diese Funktion schreibt NICHT direkt in resonance_strength_*.
--    Das macht core_compute_profile() periodisch.
-- ═══════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.core_record_resonance(
  p_reactor_id      uuid,       -- Wer reagiert?
  p_source_signal   uuid,       -- Auf welches Signal (Ebene 1 oder 2)?
  p_signal_type     text,       -- Welche Art von Resonanz?
  p_weight          numeric     DEFAULT 1.0,
  p_entity_id       uuid        DEFAULT NULL,
  p_entity_type     text        DEFAULT NULL,
  p_target_user_id  uuid        DEFAULT NULL,
  p_occurred_at     timestamptz DEFAULT now()
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_source          record;
  v_root_signal_id  uuid;
  v_echo_depth      smallint;
  v_new_signal_id   uuid;
  v_chain_id        uuid;
  v_classified      record;
BEGIN
  -- Quell-Signal lesen
  SELECT cs.user_id, cs.pillar, cs.signal_layer, cs.echo_depth,
         cs.source_signal_id, cs.signal_type
  INTO v_source
  FROM public.core_signals cs
  WHERE cs.id = p_source_signal AND cs.voided_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'core_record_resonance: Quell-Signal nicht gefunden: %', p_source_signal;
  END IF;

  -- Echotiefe berechnen
  v_echo_depth := LEAST(v_source.echo_depth + 1, 5);

  -- Root-Signal bestimmen (Handlung auf Ebene 1)
  IF v_source.signal_layer = 'action' THEN
    v_root_signal_id := p_source_signal;
  ELSE
    -- Navigiere zur Wurzel
    v_root_signal_id := COALESCE(v_source.source_signal_id, p_source_signal);
  END IF;

  -- Grundpfeiler des Quell-Signals übernehmen
  -- (Resonanz bleibt im gleichen Grundpfeiler wie die ursprüngliche Handlung)

  -- Resonanz-Signal schreiben (Ebene 2)
  INSERT INTO public.core_signals (
    user_id, pillar, category, signal_type,
    weight, is_giving,
    target_user_id, entity_id, entity_type,
    signal_layer, source_signal_id, echo_depth,
    occurred_at
  ) VALUES (
    p_reactor_id,
    v_source.pillar,
    'community',      -- Resonanz ist immer Community-Kategorie
    p_signal_type,
    p_weight,
    true,             -- Resonanz ist immer Geben (auf jemand anderen reagieren)
    v_source.user_id, -- Ziel ist der ursprüngliche Handelnde
    p_entity_id,
    p_entity_type,
    'resonance',
    p_source_signal,
    v_echo_depth,
    p_occurred_at
  )
  RETURNING id INTO v_new_signal_id;

  -- resonance_count auf dem Quell-Signal erhöhen
  UPDATE public.core_signals
    SET resonance_count = resonance_count + 1
    WHERE id = v_root_signal_id;

  -- core_profile für den Handelnden initialisieren (falls noch nicht vorhanden)
  INSERT INTO public.core_profiles (user_id)
  VALUES (v_source.user_id)
  ON CONFLICT (user_id) DO NOTHING;

  -- Resonanzkette aktualisieren oder erstellen
  SELECT id INTO v_chain_id
  FROM public.core_resonance_chains
  WHERE root_signal_id = v_root_signal_id;

  IF v_chain_id IS NULL THEN
    -- Neue Kette starten
    INSERT INTO public.core_resonance_chains (
      root_signal_id, root_user_id, root_pillar, root_signal_type,
      chain_events, chain_depth, participant_count,
      pillar_spread, started_at, last_echo_at
    ) VALUES (
      v_root_signal_id,
      v_source.user_id,
      v_source.pillar,
      v_source.signal_type,
      jsonb_build_array(jsonb_build_object(
        'signal_id',   v_new_signal_id,
        'user_id',     p_reactor_id,
        'signal_type', p_signal_type,
        'layer',       'resonance',
        'occurred_at', p_occurred_at,
        'depth',       v_echo_depth
      )),
      v_echo_depth,
      1,
      ARRAY[v_source.pillar],
      now(), now()
    );
  ELSE
    -- Bestehende Kette erweitern
    UPDATE public.core_resonance_chains SET
      chain_events = chain_events || jsonb_build_object(
        'signal_id',   v_new_signal_id,
        'user_id',     p_reactor_id,
        'signal_type', p_signal_type,
        'layer',       'resonance',
        'occurred_at', p_occurred_at,
        'depth',       v_echo_depth
      ),
      chain_depth       = GREATEST(chain_depth, v_echo_depth),
      participant_count = participant_count + 1,
      last_echo_at      = now()
    WHERE id = v_chain_id;
  END IF;

  -- Wirkung (Ebene 3) prüfen:
  -- Wenn resonance_count >= 3 UND echo_depth >= 2 → Wirkung bestätigen
  DECLARE
    v_res_count integer;
  BEGIN
    SELECT resonance_count INTO v_res_count
    FROM public.core_signals WHERE id = v_root_signal_id;

    IF v_res_count >= 3 AND v_echo_depth >= 2 THEN
      PERFORM public.core_confirm_impact(v_root_signal_id, v_source.user_id, v_source.pillar);
    END IF;
  END;

  RETURN v_new_signal_id;
END;
$$;


-- ═══════════════════════════════════════════════════════════════════════
-- 6. FUNKTION: core_confirm_impact()
--    Bestätigt Wirkung (Ebene 3) für eine Handlung.
--    Schreibt ein Impact-Signal und markiert die Resonanzkette.
--
--    Wird aufgerufen wenn:
--    a) resonance_count >= 3 UND echo_depth >= 2  (organisch durch Resonanz)
--    b) Explizit durch bestimmte Aktionen
--       (Booking completed, Service delivered, etc.)
--
--    WICHTIG: Diese Funktion schreibt in resonance_strength_* des core_profiles.
--    Das ist der einzige Weg wie Wirkung in den Orb gelangt.
-- ═══════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.core_confirm_impact(
  p_root_signal_id  uuid,
  p_user_id         uuid,
  p_pillar          hui_pillar,
  p_weight_override numeric DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_chain         record;
  v_impact_weight numeric;
  v_already_done  boolean;
BEGIN
  -- Idempotenz: Nur einmal pro Kette
  SELECT has_impact INTO v_already_done
  FROM public.core_resonance_chains
  WHERE root_signal_id = p_root_signal_id;

  IF v_already_done THEN RETURN; END IF;

  -- Kettenmetriken lesen für Gewichtsberechnung
  SELECT participant_count, chain_depth, chain_events
  INTO v_chain
  FROM public.core_resonance_chains
  WHERE root_signal_id = p_root_signal_id;

  -- Wirkungsgewicht berechnen:
  -- Basis = participant_count * depth_multiplikator
  -- Mehr Menschen + tiefere Kette = stärkere Wirkung (aber gedeckelt)
  v_impact_weight := COALESCE(
    p_weight_override,
    LEAST(
      1.0
      + COALESCE(v_chain.participant_count, 1) * 0.4
      + COALESCE(v_chain.chain_depth, 1)       * 0.3,
      4.0   -- Maximum: keine einzelne Wirkung darf überwältigend sein
    )
  );

  -- Impact-Signal schreiben (Ebene 3)
  INSERT INTO public.core_signals (
    user_id, pillar, category, signal_type,
    weight, is_giving,
    signal_layer, source_signal_id, echo_depth,
    occurred_at
  ) VALUES (
    p_user_id,
    p_pillar,
    'community',
    'impact_confirmed',
    v_impact_weight,
    true,
    'impact',
    p_root_signal_id,
    0,   -- Wirkungssignale haben keine Tiefe — sie sind das Ergebnis
    now()
  );

  -- resonance_strength_* aktualisieren (EINZIGER Pfad zum Orb)
  EXECUTE format(
    'UPDATE public.core_profiles SET
       resonance_%I = LEAST(resonance_%I + $1, 1000.0),
       resonant_action_count = resonant_action_count + 1,
       updated_at = now()
     WHERE user_id = $2',
    p_pillar::text, p_pillar::text
  ) USING v_impact_weight, p_user_id;

  -- Resonanzkette als abgeschlossen markieren
  UPDATE public.core_resonance_chains SET
    has_impact           = true,
    impact_confirmed_at  = now()
  WHERE root_signal_id = p_root_signal_id;

END;
$$;


-- ═══════════════════════════════════════════════════════════════════════
-- 7. FUNKTION: core_compute_profile() — ERWEITERUNG (REPLACE)
--    Erweitert die bestehende Funktion um Resonanz-Metriken.
--
--    NEU:
--    - resonance_ratio: Anteil der Handlungen mit Resonanz
--    - impact_depth: Durchschnittliche Resonanztiefe
--    - orb_* basiert jetzt PRIMÄR auf resonance_strength_*
--      (nicht mehr direkt auf strength_*)
--
--    Rückwärtskompatibel: strength_* bleibt erhalten als Rohdaten.
-- ═══════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.core_compute_profile(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_strengths         record;
  v_resonances        record;
  v_total             numeric;
  v_res_total         numeric;
  v_max               numeric;
  v_res_max           numeric;
  v_active_count      integer;
  v_giving_ratio      numeric;
  v_recent_count      integer;
  v_depth_score       numeric;
  v_resonance_ratio   numeric;
  v_impact_depth      numeric;
  v_total_actions     integer;
  v_resonant_actions  integer;
  v_dominant          hui_pillar[];
BEGIN
  -- Profile sicherstellen
  INSERT INTO public.core_profiles (user_id) VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  -- Handlungs-Stärken (Ebene 1 — Rohdaten, unveränderlich)
  SELECT
    SUM(weight) FILTER (WHERE pillar = 'verbinden')     AS v,
    SUM(weight) FILTER (WHERE pillar = 'unterstuetzen') AS u,
    SUM(weight) FILTER (WHERE pillar = 'erschaffen')    AS e,
    SUM(weight) FILTER (WHERE pillar = 'wertschoepfen') AS w,
    SUM(weight) FILTER (WHERE pillar = 'impact')        AS i,
    COUNT(*)    FILTER (WHERE signal_layer = 'action')  AS total_act,
    COUNT(*)    FILTER (WHERE signal_layer = 'impact')  AS resonant_act
  INTO v_strengths
  FROM public.core_signals
  WHERE user_id = p_user_id AND voided_at IS NULL;

  -- Resonanz-Stärken (aus core_profiles — werden durch core_confirm_impact befüllt)
  SELECT
    resonance_verbinden, resonance_unterstuetzen,
    resonance_erschaffen, resonance_wertschoepfen,
    resonance_impact
  INTO v_resonances
  FROM public.core_profiles WHERE user_id = p_user_id;

  -- Handlungs-Stärken in core_profiles schreiben
  UPDATE public.core_profiles SET
    strength_verbinden      = COALESCE(v_strengths.v, 0),
    strength_unterstuetzen  = COALESCE(v_strengths.u, 0),
    strength_erschaffen     = COALESCE(v_strengths.e, 0),
    strength_wertschoepfen  = COALESCE(v_strengths.w, 0),
    strength_impact         = COALESCE(v_strengths.i, 0),
    total_signals           = COALESCE(v_strengths.total_act, 0)
                            + COALESCE(v_strengths.resonant_act, 0),
    total_action_count      = COALESCE(v_strengths.total_act, 0)
  WHERE user_id = p_user_id;

  -- Gesamt-Resonanz (für Orb-Berechnung)
  v_res_total := COALESCE(v_resonances.resonance_verbinden, 0)
               + COALESCE(v_resonances.resonance_unterstuetzen, 0)
               + COALESCE(v_resonances.resonance_erschaffen, 0)
               + COALESCE(v_resonances.resonance_wertschoepfen, 0)
               + COALESCE(v_resonances.resonance_impact, 0);

  v_res_max := GREATEST(
    COALESCE(v_resonances.resonance_verbinden, 0),
    COALESCE(v_resonances.resonance_unterstuetzen, 0),
    COALESCE(v_resonances.resonance_erschaffen, 0),
    COALESCE(v_resonances.resonance_wertschoepfen, 0),
    COALESCE(v_resonances.resonance_impact, 0),
    1
  );

  -- Resonanz-Ratio: Anteil der Handlungen die Resonanz erzeugten
  v_resonance_ratio := CASE
    WHEN COALESCE(v_strengths.total_act, 0) = 0 THEN 0
    ELSE LEAST(
      COALESCE(v_strengths.resonant_act, 0)::numeric /
      GREATEST(v_strengths.total_act, 1)::numeric,
      1.0
    )
  END;

  -- Durchschnittliche Resonanztiefe aus Ketten
  SELECT COALESCE(AVG(chain_depth), 0)
  INTO v_impact_depth
  FROM public.core_resonance_chains
  WHERE root_user_id = p_user_id;

  -- Geben-Ratio
  SELECT
    CASE WHEN COUNT(*) = 0 THEN 0.5
         ELSE COUNT(*) FILTER (WHERE is_giving) * 1.0 / COUNT(*)
    END
  INTO v_giving_ratio
  FROM public.core_signals
  WHERE user_id = p_user_id AND voided_at IS NULL;

  -- Kürzliche Aktivität (30 Tage)
  SELECT COUNT(*) INTO v_recent_count
  FROM public.core_signals
  WHERE user_id = p_user_id
    AND voided_at IS NULL
    AND occurred_at > now() - interval '30 days';

  -- Tiefe: Qualität der Impact-Signale
  SELECT COALESCE(AVG(weight) / 3.0, 0) INTO v_depth_score
  FROM public.core_signals
  WHERE user_id = p_user_id
    AND voided_at IS NULL
    AND signal_layer = 'impact';

  -- Anzahl aktiver Grundpfeiler (basierend auf RESONANZ, nicht Handlungen)
  -- Schwellenwert: > 5% des Resonanz-Maximums
  v_active_count := (
    CASE WHEN COALESCE(v_resonances.resonance_verbinden, 0)     > v_res_max * 0.05 THEN 1 ELSE 0 END +
    CASE WHEN COALESCE(v_resonances.resonance_unterstuetzen, 0) > v_res_max * 0.05 THEN 1 ELSE 0 END +
    CASE WHEN COALESCE(v_resonances.resonance_erschaffen, 0)    > v_res_max * 0.05 THEN 1 ELSE 0 END +
    CASE WHEN COALESCE(v_resonances.resonance_wertschoepfen, 0) > v_res_max * 0.05 THEN 1 ELSE 0 END +
    CASE WHEN COALESCE(v_resonances.resonance_impact, 0)        > v_res_max * 0.05 THEN 1 ELSE 0 END
  );

  -- Dominante Grundpfeiler — jetzt basierend auf RESONANZ-Stärken
  -- (nicht auf rohen Handlungs-Signalen)
  SELECT ARRAY(
    SELECT p::hui_pillar FROM (VALUES
      ('verbinden'::text,     COALESCE(v_resonances.resonance_verbinden, 0)),
      ('unterstuetzen'::text, COALESCE(v_resonances.resonance_unterstuetzen, 0)),
      ('erschaffen'::text,    COALESCE(v_resonances.resonance_erschaffen, 0)),
      ('wertschoepfen'::text, COALESCE(v_resonances.resonance_wertschoepfen, 0)),
      ('impact'::text,        COALESCE(v_resonances.resonance_impact, 0))
    ) t(p, val)
    WHERE val > 0
    ORDER BY val DESC
    LIMIT 3
  ) INTO v_dominant;

  -- core_profiles vollständig aktualisieren
  UPDATE public.core_profiles SET
    -- Dominante Pfeiler basieren jetzt auf RESONANZ
    dominant_pillars = v_dominant,

    -- Resonanz-Metriken
    resonance_ratio      = v_resonance_ratio,
    impact_depth         = LEAST(COALESCE(v_impact_depth, 0) / 5.0, 1.0),
    resonant_action_count = COALESCE(v_strengths.resonant_act, 0),
    total_action_count   = COALESCE(v_strengths.total_act, 0),

    -- ORB-PARAMETER — basieren jetzt auf RESONANZ (nicht auf Handlungs-Rohdaten)
    --
    -- orb_vitality: Wie lebendig ist das Blatt?
    --   = Gewichtung aus: Resonanz-Volumen + kürzliche Aktivität + Resonanz-Ratio
    orb_vitality = LEAST(
      (LEAST(v_res_total / 100.0, 1.0) * 0.5) +       -- Gesamt-Resonanz
      (LEAST(v_recent_count / 10.0, 1.0) * 0.3) +     -- Kürzliche Aktivität
      (v_resonance_ratio * 0.2),                        -- Ratio (Handlungen → Resonanz)
      1.0
    ),

    -- orb_depth: Wie tief wirkt dieser Mensch?
    --   = Qualität der Impact-Signale + Kettenbreite
    orb_depth = LEAST(
      (COALESCE(v_depth_score, 0) * 0.6) +
      (LEAST(COALESCE(v_impact_depth, 0) / 5.0, 1.0) * 0.4),
      1.0
    ),

    -- orb_breadth: Über wie viele Grundpfeiler resoniert dieser Mensch?
    orb_breadth = LEAST(v_active_count / 5.0, 1.0),

    -- orb_warmth: Gibt dieser Mensch mehr als er erhält?
    orb_warmth = LEAST(v_giving_ratio, 1.0),

    orb_last_changed = CASE
      WHEN v_res_total > 0 THEN now()
      ELSE orb_last_changed
    END,

    computed_at  = now(),
    updated_at   = now()
  WHERE user_id = p_user_id;
END;
$$;


-- ═══════════════════════════════════════════════════════════════════════
-- 8. FUNKTION: core_record_signal() — ERWEITERUNG (REPLACE)
--    Erweitert um signal_layer Parameter.
--    Rückwärtskompatibel — Default bleibt 'action'.
--
--    WICHTIG: Bei signal_layer = 'action' KEIN direkter Orb-Einfluss.
--    Orb-Einfluss entsteht ausschließlich über core_confirm_impact().
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
  p_occurred_at   timestamptz DEFAULT now(),
  p_signal_layer  signal_layer DEFAULT 'action'   -- NEU: Default 'action' = rückwärtskompatibel
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
    signal_layer,
    occurred_at
  ) VALUES (
    p_user_id, p_pillar, p_category, p_signal_type,
    p_weight, p_is_giving,
    p_target_user, p_entity_id, p_entity_type,
    p_signal_layer,
    p_occurred_at
  )
  RETURNING id INTO v_signal_id;

  -- core_profile initialisieren
  INSERT INTO public.core_profiles (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  -- total_action_count erhöhen (nur bei Handlungen, Ebene 1)
  IF p_signal_layer = 'action' THEN
    UPDATE public.core_profiles SET
      total_action_count = total_action_count + 1,
      -- strength_* bleibt als Rohdaten erhalten
      updated_at = now()
    WHERE user_id = p_user_id;

    -- strength_* für Rohdaten aktualisieren
    EXECUTE format(
      'UPDATE public.core_profiles SET
         strength_%I = LEAST(strength_%I + $1, 1000.0)
       WHERE user_id = $2',
      p_pillar::text, p_pillar::text
    ) USING p_weight, p_user_id;
  END IF;

  -- WICHTIG: Bei 'action' → KEINE Änderung an resonance_* oder orb_*
  -- Der Orb bewegt sich erst wenn Resonanz bestätigt ist.

  -- Bei bereits bestätigter Resonanz/Wirkung: direkt in Profile schreiben
  IF p_signal_layer = 'resonance' OR p_signal_layer = 'impact' THEN
    EXECUTE format(
      'UPDATE public.core_profiles SET
         resonance_%I = LEAST(resonance_%I + $1, 1000.0),
         updated_at = now()
       WHERE user_id = $2',
      p_pillar::text, p_pillar::text
    ) USING p_weight, p_user_id;
  END IF;

  -- Verbindungssignal bilateral (bei allen Ebenen)
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
      bond_strength  = core_connections.bond_strength +
                       CASE WHEN p_signal_layer = 'impact' THEN p_weight
                            WHEN p_signal_layer = 'resonance' THEN p_weight * 0.6
                            ELSE p_weight * 0.2   -- Handlungen zählen wenig für Verbindungsstärke
                       END,
      signal_count   = core_connections.signal_count + 1,
      last_signal_at = now(),
      shared_pillars = (
        SELECT ARRAY(SELECT DISTINCT unnest(core_connections.shared_pillars || ARRAY[p_pillar]))
      );
  END IF;

  RETURN v_signal_id;
END;
$$;


-- ═══════════════════════════════════════════════════════════════════════
-- 9. VIEW: core_resonance_stats (für Team Dashboard)
--    Zeigt Wirkungstiefe pro Nutzer — ohne Zahlen, ohne Ranking.
--    "Menschen, die HUI besonders leben."
-- ═══════════════════════════════════════════════════════════════════════
CREATE OR REPLACE VIEW public.core_resonance_stats AS
SELECT
  cp.user_id,

  -- Dominante Wirkungsfelder (Resonanz-basiert)
  cp.dominant_pillars,

  -- Organische Wirkungstiefe (intern, nie als Zahl anzeigen)
  cp.orb_vitality,
  cp.orb_depth,
  cp.orb_breadth,
  cp.orb_warmth,
  cp.impact_depth,
  cp.resonance_ratio,

  -- Wie viele Resonanzketten wurden bestätigt?
  (SELECT COUNT(*) FROM public.core_resonance_chains rc
   WHERE rc.root_user_id = cp.user_id AND rc.has_impact = true) AS confirmed_impact_chains,

  -- Wie viele Menschen wurden berührt?
  (SELECT COALESCE(SUM(participant_count), 0)
   FROM public.core_resonance_chains rc
   WHERE rc.root_user_id = cp.user_id) AS total_people_reached,

  -- Zeitstempel
  cp.computed_at,
  cp.active_since

FROM public.core_profiles cp;

COMMENT ON VIEW public.core_resonance_stats IS
  'HUI Team Dashboard — Wirkungstiefe pro Nutzer. Keine Rangliste. Zeigt wer HUI lebt.';


-- ═══════════════════════════════════════════════════════════════════════
-- 10. RLS für neue Tabelle
-- ═══════════════════════════════════════════════════════════════════════
ALTER TABLE public.core_resonance_chains ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS core_resonance_chains_own ON public.core_resonance_chains;
CREATE POLICY core_resonance_chains_own ON public.core_resonance_chains
  FOR SELECT USING (auth.uid() = root_user_id);


-- ═══════════════════════════════════════════════════════════════════════
-- 11. KOMMENTARE
-- ═══════════════════════════════════════════════════════════════════════
COMMENT ON COLUMN public.core_signals.signal_layer IS
  'Ebene 1=action (Handlung), Ebene 2=resonance (Reaktion anderer), Ebene 3=impact (bestätigte Wirkung)';
COMMENT ON COLUMN public.core_signals.source_signal_id IS
  'Auf welche Handlung (Ebene 1) antwortet dieses Signal? NULL bei Ebene 1.';
COMMENT ON COLUMN public.core_signals.resonance_count IS
  'Wie viele Menschen haben auf diese Handlung reagiert? Nur auf Ebene-1-Signalen gesetzt.';
COMMENT ON COLUMN public.core_profiles.resonance_verbinden IS
  'Bestätigte Wirkungsstärke im Grundpfeiler Verbinden. Einzige Orb-Eingabe für diesen Pfeiler.';
COMMENT ON FUNCTION public.core_record_resonance IS
  'Resonanz Engine Haupteinstieg. Aufgerufen wenn jemand auf eine Handlung reagiert.';
COMMENT ON FUNCTION public.core_confirm_impact IS
  'Bestätigt Ebene-3-Wirkung. EINZIGER Pfad der resonance_strength_* verändert.';
