-- ═══════════════════════════════════════════════════════════════════════════
-- IMPACT-COMPLETION-FEED-POST-001 (2026-08-10)
-- ═══════════════════════════════════════════════════════════════════════════
-- Ziel: Wenn ein Impact-Projekt vollständig finanziert wird (is_completed
-- wechselt auf true), soll automatisch ein sichtbarer Feed-Post vom
-- System-Nutzer "HUI (System)" erzeugt werden — rein additiv, keine
-- bestehende Logik wird verändert oder entfernt.
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Additive Spalte: profiles.is_system_account
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_system_account boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.profiles.is_system_account IS
  'true = automatisierter System-Account (z.B. "HUI (System)"). Kein echter Nutzer.';

-- 2. System-Profil vervollstaendigen
UPDATE public.profiles
SET
  display_name       = 'HUI (System)',
  full_name           = 'HUI (System)',
  avatar_url          = '/assets/brand/hui-logo.png',
  bio                 = 'Offizieller System-Account von HUI. Teilt automatische Meilenstein-Updates, wenn ein Herzensprojekt vollstaendig finanziert wurde.',
  is_system_account   = true
WHERE id = '152619c1-9adc-40bf-9078-eb67f5024ed2';

-- 3. fn_check_project_completion() — additiv erweitert
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
    SELECT id, project_name, user_id, funding_goal, current_amount_eur
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

    -- NEU (additiv): System-Feed-Post "HUI (System)"
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
      user_id, src, type, caption, visibility_scope, moment_source, created_at
    ) VALUES (
      v_system_uid,
      NULL,
      'gedanke',
      v_message,
      'public',
      'system_impact_completion',
      now()
    );

    -- Rang neu berechnen (UNVERAENDERT)
    PERFORM public.fn_recompute_impact_ranking();
  END LOOP;
END;
$$;
