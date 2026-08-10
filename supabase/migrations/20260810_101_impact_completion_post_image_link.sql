-- ═══════════════════════════════════════════════════════════════════════════
-- IMPACT-COMPLETION-FEED-POST-002 (2026-08-10)
-- ═══════════════════════════════════════════════════════════════════════════
-- Ziel (additiv, erweitert 20260810_100 ohne etwas zu entfernen):
-- 1. System-Post bekommt das Cover-Bild des fertigen Projekts (type='foto'
--    statt 'gedanke') -> sieht im Feed aus wie jeder andere Foto-Moment.
-- 2. Neue Spalte beitraege.linked_project_id verknuepft den Post mit dem
--    Projekt, damit ein Klick zum fertigen Projekt fuehrt (bestehender
--    Deep-Link-Mechanismus ImpactPage state.openProjectId wird wiederverwendet
--    -- keine neue Detail-UI, keine neue Architektur).
-- 3. System-Profil: Name auf "HUI" vereinfacht (statt "HUI (System)"),
--    keine Bio/Webseite -- bereits per Direkt-Update in der Session erledigt,
--    hier zusaetzlich fest in der Migration verankert (Nachvollziehbarkeit).
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Additive Spalte: beitraege.linked_project_id
ALTER TABLE public.beitraege
  ADD COLUMN IF NOT EXISTS linked_project_id uuid REFERENCES public.impact_applications(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.beitraege.linked_project_id IS
  'Optionale Verknuepfung zu impact_applications.id -- bei System-Posts (moment_source=system_impact_completion) fuehrt ein Klick zum fertigen Projekt (ImpactPage deep-link via openProjectId).';

CREATE INDEX IF NOT EXISTS idx_beitraege_linked_project_id
  ON public.beitraege(linked_project_id) WHERE linked_project_id IS NOT NULL;

-- 2. System-Profil final: Name "HUI", kein Bio/Webseite/Standort
UPDATE public.profiles
SET display_name = 'HUI',
    full_name     = 'HUI',
    avatar_url    = 'https://be-hui.vercel.app/assets/brand/hui-logo.png',
    bio           = NULL,
    website       = NULL,
    tagline       = NULL,
    location      = NULL,
    location_label = NULL
WHERE id = '152619c1-9adc-40bf-9078-eb67f5024ed2';

-- 3. fn_check_project_completion() -- additiv erweitert:
--    - Cover-Bild + Typ 'foto' statt 'gedanke'
--    - linked_project_id gesetzt
--    - "HUI (System)"-Wortlaut aus Nachrichtentext bleibt unveraendert
--      inhaltlich (nur Bezug zum Profilnamen "HUI"), Notification-Logik
--      unveraendert.
CREATE OR REPLACE FUNCTION public.fn_check_project_completion()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  r            RECORD;
  v_ordinal_n  INTEGER;
  v_ordinal_wd TEXT;
  v_message    TEXT;
  v_system_uid UUID := '152619c1-9adc-40bf-9078-eb67f5024ed2';
BEGIN
  FOR r IN
    SELECT id, project_name, user_id, funding_goal, current_amount_eur, cover_url, media_urls
    FROM public.impact_applications
    WHERE status = 'approved'
      AND is_completed = false
      AND current_amount_eur >= funding_goal
  LOOP
    -- Projekt als abgeschlossen markieren (UNVERAENDERT)
    UPDATE public.impact_applications
    SET is_completed = true,
        completed_at = now(),
        rank = NULL,
        completion_note = 'Finanzierungsziel erreicht am ' || to_char(now(), 'DD.MM.YYYY')
    WHERE id = r.id;

    -- Notification an Projekt-Initiator (UNVERAENDERT)
    INSERT INTO public.notifications (
      user_id, type, title, body, metadata, created_at
    ) VALUES (
      r.user_id,
      'impact_project_completed',
      'Dein Projekt wurde vollstaendig finanziert!',
      'Das Projekt "' || r.project_name || '" hat sein Finanzierungsziel von EUR' ||
        ROUND(r.funding_goal, 0)::text || ' erreicht. Herzlichen Glueckwunsch!',
      jsonb_build_object(
        'project_id', r.id,
        'project_name', r.project_name,
        'funded_amount', r.current_amount_eur,
        'goal', r.funding_goal
      ),
      now()
    );

    -- System-Feed-Post "HUI" -- NEU: mit Cover-Bild + Projekt-Verknuepfung
    SELECT count(*) INTO v_ordinal_n
    FROM public.impact_applications
    WHERE is_completed = true;

    v_ordinal_wd := CASE v_ordinal_n
      WHEN 1  THEN 'erste'   WHEN 2  THEN 'zweite'  WHEN 3  THEN 'dritte'
      WHEN 4  THEN 'vierte'  WHEN 5  THEN 'fuenfte'  WHEN 6  THEN 'sechste'
      WHEN 7  THEN 'siebte'  WHEN 8  THEN 'achte'   WHEN 9  THEN 'neunte'
      WHEN 10 THEN 'zehnte'  WHEN 11 THEN 'elfte'   WHEN 12 THEN 'zwoelfte'
      WHEN 13 THEN 'dreizehnte' WHEN 14 THEN 'vierzehnte' WHEN 15 THEN 'fuenfzehnte'
      WHEN 16 THEN 'sechzehnte' WHEN 17 THEN 'siebzehnte' WHEN 18 THEN 'achtzehnte'
      WHEN 19 THEN 'neunzehnte' WHEN 20 THEN 'zwanzigste'
      ELSE v_ordinal_n::text || '.'
    END;

    v_message := CASE (v_ordinal_n - 1) % 3
      WHEN 0 THEN 'Das ' || v_ordinal_wd || ' Projekt wurde vollstaendig finanziert! ' ||
                  r.project_name || ' hat gemeinsam Unterstuetzung erhalten - grossartig gemacht!'
      WHEN 1 THEN 'Das ' || v_ordinal_wd || ' Projekt von HUI wurde gerade erfolgreich finanziert: ' ||
                  r.project_name || '! Gemeinsam schaffen wir Wirkung.'
      ELSE        'Das ' || v_ordinal_wd || ' Projekt wurde soeben abgeschlossen: ' ||
                  r.project_name || '! Wieder ein Schritt mehr Richtung gemeinsamer Wirkung.'
    END;

    INSERT INTO public.beitraege (
      user_id, src, type, caption, visibility_scope, moment_source, linked_project_id, created_at
    ) VALUES (
      v_system_uid,
      COALESCE(r.cover_url, (r.media_urls)[1]),
      'foto',
      v_message,
      'public',
      'system_impact_completion',
      r.id,
      now()
    );

    -- Rang neu berechnen (UNVERAENDERT)
    PERFORM public.fn_recompute_impact_ranking();
  END LOOP;
END;
$$;

-- 4. Bereits existierenden retroaktiven Post (Lichtpunkt Alltag) nachtraeglich
--    korrigieren: Bild + Projekt-Verknuepfung ergaenzen, Typ auf 'foto'.
UPDATE public.beitraege b
SET type = 'foto',
    src = COALESCE(a.cover_url, (a.media_urls)[1]),
    linked_project_id = a.id
FROM public.impact_applications a
WHERE b.moment_source = 'system_impact_completion'
  AND b.linked_project_id IS NULL
  AND a.project_name = 'Lichtpunkt Alltag'
  AND a.is_completed = true;
