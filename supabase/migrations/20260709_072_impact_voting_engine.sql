-- ══════════════════════════════════════════════════════════════════════════════
-- IMPACT VOTING ENGINE — Migration 20260709_072
-- IMPACT-VOTING-ENGINE-001 (2026-07-09)
--
-- Additiv: Keine bestehenden Strukturen verändert oder gelöscht.
-- Erweitert: impact_applications (neue Felder)
-- Neu:       impact_distributions (Verteilungsprotokoll)
-- Trigger:   trg_update_impact_ranking (nach jedem Vote)
-- Trigger:   trg_check_project_completion (bei Ziel-Erreichen)
-- Hilfsfn:   fn_recompute_impact_ranking() — Top-3 Ränge neu berechnen
-- Hilfsfn:   fn_check_project_completion() — Abschluss prüfen
-- ══════════════════════════════════════════════════════════════════════════════

-- ── 1. impact_applications: neue Felder (additiv) ────────────────────────────
ALTER TABLE public.impact_applications
  ADD COLUMN IF NOT EXISTS current_amount_eur NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rank               INTEGER,
  ADD COLUMN IF NOT EXISTS is_completed       BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS completed_at       TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS completion_note    TEXT;

COMMENT ON COLUMN public.impact_applications.current_amount_eur IS
  'Summe aller bisher ausgeschütteten Impact-Euros (aus impact_distributions)';
COMMENT ON COLUMN public.impact_applications.rank IS
  'Aktueller Voting-Rang (1=meiste Stimmen). NULL = nicht unter Top-3.';
COMMENT ON COLUMN public.impact_applications.is_completed IS
  'true wenn current_amount_eur >= funding_goal — Projekt vollständig finanziert.';

-- ── 2. impact_distributions — Verteilungsprotokoll (neue Tabelle) ─────────────
CREATE TABLE IF NOT EXISTS public.impact_distributions (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id        UUID        NOT NULL,   -- Referenz auf orders.id
  project_id      UUID        NOT NULL REFERENCES public.impact_applications(id) ON DELETE CASCADE,
  rank_at_time    INTEGER     NOT NULL CHECK (rank_at_time IN (1,2,3)),
  share_pct       NUMERIC(5,2) NOT NULL,  -- 50.00 / 30.00 / 20.00
  amount_eur      NUMERIC(12,2) NOT NULL,
  pool_month      TEXT        NOT NULL,   -- YYYY-MM
  distributed_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_impact_dist_project
  ON public.impact_distributions(project_id);
CREATE INDEX IF NOT EXISTS idx_impact_dist_order
  ON public.impact_distributions(order_id);
CREATE INDEX IF NOT EXISTS idx_impact_dist_month
  ON public.impact_distributions(pool_month);

-- RLS: öffentlich lesbar (Transparenz), nur service_role darf schreiben
ALTER TABLE public.impact_distributions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "impact_distributions_read" ON public.impact_distributions;
CREATE POLICY "impact_distributions_read"
  ON public.impact_distributions FOR SELECT
  USING (true);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.impact_distributions;

COMMENT ON TABLE public.impact_distributions IS
  'Protokolliert jede 50/30/20-Ausschüttung an Top-3 Projekte pro Transaktion.';

-- ── 3. fn_recompute_impact_ranking() ─────────────────────────────────────────
-- Berechnet nach jedem Vote die aktuellen Ränge neu.
-- Nur approved-Projekte nehmen teil. Top-3 bekommen rank 1/2/3, Rest NULL.
CREATE OR REPLACE FUNCTION public.fn_recompute_impact_ranking()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_month TEXT := to_char(now(), 'YYYY-MM');
  r RECORD;
  v_rank INTEGER := 1;
BEGIN
  -- Erst alle Ränge zurücksetzen
  UPDATE public.impact_applications
  SET rank = NULL
  WHERE status = 'approved' AND is_completed = false;

  -- Dann Top-3 nach Stimmen (diesen Monat) setzen
  FOR r IN
    SELECT ia.id
    FROM public.impact_applications ia
    LEFT JOIN (
      SELECT project_id, COUNT(*) AS vote_count
      FROM public.impact_votes
      WHERE pool_month = v_month
      GROUP BY project_id
    ) vc ON vc.project_id = ia.id
    WHERE ia.status = 'approved' AND ia.is_completed = false
    ORDER BY COALESCE(vc.vote_count, 0) DESC, ia.created_at ASC
    LIMIT 3
  LOOP
    UPDATE public.impact_applications
    SET rank = v_rank
    WHERE id = r.id;
    v_rank := v_rank + 1;
  END LOOP;
END;
$$;

-- ── 4. Trigger: trg_update_impact_ranking (nach jedem Vote INSERT) ────────────
CREATE OR REPLACE FUNCTION public.trg_fn_update_impact_ranking()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  PERFORM public.fn_recompute_impact_ranking();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_impact_ranking ON public.impact_votes;
CREATE TRIGGER trg_update_impact_ranking
  AFTER INSERT ON public.impact_votes
  FOR EACH ROW EXECUTE FUNCTION public.trg_fn_update_impact_ranking();

-- ── 5. fn_check_project_completion() ─────────────────────────────────────────
-- Prüft nach jeder Distribution ob ein Projekt sein Ziel erreicht hat.
CREATE OR REPLACE FUNCTION public.fn_check_project_completion()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT id, project_name, user_id, funding_goal, current_amount_eur
    FROM public.impact_applications
    WHERE status = 'approved'
      AND is_completed = false
      AND current_amount_eur >= funding_goal
  LOOP
    -- Projekt als abgeschlossen markieren
    UPDATE public.impact_applications
    SET is_completed = true,
        completed_at = now(),
        rank = NULL,
        completion_note = 'Finanzierungsziel erreicht am ' || to_char(now(), 'DD.MM.YYYY')
    WHERE id = r.id;

    -- Notification an Projekt-Initiator
    INSERT INTO public.notifications (
      user_id, type, title, body, metadata, created_at
    ) VALUES (
      r.user_id,
      'impact_project_completed',
      '🎉 Dein Projekt wurde vollständig finanziert!',
      'Das Projekt "' || r.project_name || '" hat sein Finanzierungsziel von €' ||
        ROUND(r.funding_goal, 0)::text || ' erreicht. Herzlichen Glückwunsch!',
      jsonb_build_object(
        'project_id', r.id,
        'project_name', r.project_name,
        'funded_amount', r.current_amount_eur,
        'goal', r.funding_goal
      ),
      now()
    );

    -- Rang neu berechnen (abgeschlossenes Projekt raus)
    PERFORM public.fn_recompute_impact_ranking();
  END LOOP;
END;
$$;

-- ── 6. RPC: rpc_get_impact_ranking() — für SADB/EDB/App ─────────────────────
CREATE OR REPLACE FUNCTION public.rpc_get_impact_ranking()
RETURNS TABLE (
  project_id      UUID,
  project_name    TEXT,
  funding_goal    NUMERIC,
  current_amount  NUMERIC,
  vote_count      BIGINT,
  rank            INTEGER,
  share_pct       NUMERIC,
  is_completed    BOOLEAN,
  cover_url       TEXT,
  contact_email   TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_month TEXT := to_char(now(), 'YYYY-MM');
BEGIN
  RETURN QUERY
  SELECT
    ia.id,
    ia.project_name,
    ia.funding_goal,
    COALESCE(ia.current_amount_eur, 0),
    COALESCE(vc.vote_count, 0),
    ia.rank,
    CASE ia.rank
      WHEN 1 THEN 50.00
      WHEN 2 THEN 30.00
      WHEN 3 THEN 20.00
      ELSE NULL
    END AS share_pct,
    ia.is_completed,
    ia.cover_url,
    ia.contact_email
  FROM public.impact_applications ia
  LEFT JOIN (
    SELECT project_id, COUNT(*) AS vote_count
    FROM public.impact_votes
    WHERE pool_month = v_month
    GROUP BY project_id
  ) vc ON vc.project_id = ia.id
  WHERE ia.status = 'approved'
  ORDER BY COALESCE(vc.vote_count, 0) DESC, ia.created_at ASC;
END;
$$;

-- ── 7. RPC: rpc_distribute_impact_to_projects(p_projekte_eur, p_order_id) ────
-- Wird von rpc_process_order_fees aufgerufen (Phase 2).
-- Verteilt den projekte_foerdern_eur-Anteil 50/30/20 auf die aktuellen Top-3.
CREATE OR REPLACE FUNCTION public.rpc_distribute_impact_to_projects(
  p_projekte_eur NUMERIC,
  p_order_id     UUID
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_month     TEXT := to_char(now(), 'YYYY-MM');
  v_top3      RECORD;
  v_shares    NUMERIC[] := ARRAY[0.50, 0.30, 0.20];
  v_pcts      NUMERIC[] := ARRAY[50.00, 30.00, 20.00];
  v_idx       INTEGER;
  v_amount    NUMERIC;
  v_total     NUMERIC := 0;
  v_result    jsonb := '[]'::jsonb;
BEGIN
  -- Sicherheit: 0€ → nichts tun
  IF p_projekte_eur IS NULL OR p_projekte_eur <= 0 THEN
    RETURN jsonb_build_object('ok', true, 'distributed', false, 'reason', 'no_amount');
  END IF;

  -- Top-3 ranked Projekte holen
  v_idx := 1;
  FOR v_top3 IN
    SELECT id, project_name, rank
    FROM public.impact_applications
    WHERE status = 'approved'
      AND is_completed = false
      AND rank IN (1,2,3)
    ORDER BY rank ASC
  LOOP
    v_amount := ROUND(p_projekte_eur * v_shares[v_idx], 2);

    -- Distribution-Protokoll
    INSERT INTO public.impact_distributions (
      order_id, project_id, rank_at_time, share_pct, amount_eur, pool_month
    ) VALUES (
      p_order_id, v_top3.id, v_top3.rank, v_pcts[v_idx], v_amount, v_month
    );

    -- Projekt-Konto hochzählen
    UPDATE public.impact_applications
    SET current_amount_eur = COALESCE(current_amount_eur, 0) + v_amount
    WHERE id = v_top3.id;

    v_total := v_total + v_amount;
    v_result := v_result || jsonb_build_object(
      'rank', v_top3.rank,
      'project_id', v_top3.id,
      'project_name', v_top3.project_name,
      'amount_eur', v_amount,
      'share_pct', v_pcts[v_idx]
    );

    v_idx := v_idx + 1;
  END LOOP;

  -- Abschluss-Check nach Distribution
  PERFORM public.fn_check_project_completion();

  RETURN jsonb_build_object(
    'ok', true,
    'distributed', true,
    'total_eur', v_total,
    'month', v_month,
    'distributions', v_result
  );
END;
$$;

-- ── 8. Initiales Ranking berechnen (bestehende Votes auswerten) ───────────────
SELECT public.fn_recompute_impact_ranking();

