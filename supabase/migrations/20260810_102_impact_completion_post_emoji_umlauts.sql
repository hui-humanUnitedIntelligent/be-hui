-- ═══════════════════════════════════════════════════════════════════════════
-- IMPACT-COMPLETION-FEED-POST-003 (2026-08-10)
-- ═══════════════════════════════════════════════════════════════════════════
-- Fix: Emoji (🎉 💚) + deutsche Umlaute (vollständig, Unterstützung, großartig)
-- in fn_check_project_completion() und im bestehenden retroaktiven Post.
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Funktion aktualisieren: Emoji + Umlaute + Projektnamen in allen Varianten
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

    -- System-Feed-Post "HUI" — mit Emoji, Umlauten, Projektnamen + Cover-Bild
    SELECT count(*) INTO v_ordinal_n
    FROM public.impact_applications
    WHERE is_completed = true;

    v_ordinal_wd := CASE v_ordinal_n
      WHEN 1  THEN 'erste'   WHEN 2  THEN 'zweite'  WHEN 3  THEN 'dritte'
      WHEN 4  THEN 'vierte'  WHEN 5  THEN 'fünfte'  WHEN 6  THEN 'sechste'
      WHEN 7  THEN 'siebte'  WHEN 8  THEN 'achte'   WHEN 9  THEN 'neunte'
      WHEN 10 THEN 'zehnte'  WHEN 11 THEN 'elfte'   WHEN 12 THEN 'zwölfte'
      WHEN 13 THEN 'dreizehnte' WHEN 14 THEN 'vierzehnte' WHEN 15 THEN 'fünfzehnte'
      WHEN 16 THEN 'sechzehnte' WHEN 17 THEN 'siebzehnte' WHEN 18 THEN 'achtzehnte'
      WHEN 19 THEN 'neunzehnte' WHEN 20 THEN 'zwanzigste'
      ELSE v_ordinal_n::text || '.'
    END;

    v_message := CASE (v_ordinal_n - 1) % 3
      WHEN 0 THEN '🎉 Das ' || v_ordinal_wd || ' Projekt wurde vollständig finanziert! ' ||
                  r.project_name || ' hat gemeinsam Unterstützung erhalten – großartig gemacht! 💚'
      WHEN 1 THEN '🎉 Das ' || v_ordinal_wd || ' Projekt von HUI wurde gerade erfolgreich finanziert! ' ||
                  r.project_name || ' — Gemeinsam schaffen wir Wirkung. 💚'
      ELSE        '🎉 Das ' || v_ordinal_wd || ' Projekt wurde soeben abgeschlossen! ' ||
                  r.project_name || ' — Wieder ein Schritt mehr Richtung gemeinsamer Wirkung. 💚'
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

-- 2. Bestehenden retroaktiven Post (Lichtpunkt Alltag) Text korrigieren
UPDATE public.beitraege
SET caption = '🎉 Das erste Projekt wurde vollständig finanziert! Lichtpunkt Alltag hat gemeinsam Unterstützung erhalten – großartig gemacht! 💚'
WHERE moment_source = 'system_impact_completion'
  AND linked_project_id IS NOT NULL;
