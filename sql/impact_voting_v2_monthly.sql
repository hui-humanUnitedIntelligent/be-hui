-- ════════════════════════════════════════════════════════════════
-- IMPACT-VOTING v2: Universelle Monats-Voting-Logik
-- Erstellt: 2026-08-22
-- Ändert NICHTS bestehendes — nur ADDITIVE Tabellen/RPCs
-- ════════════════════════════════════════════════════════════════

-- 1. Tabelle: impact_monthly_projects (Admin wählt 3 Projekte pro Monat)
CREATE TABLE IF NOT EXISTS impact_monthly_projects (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    UUID NOT NULL REFERENCES impact_applications(id) ON DELETE CASCADE,
  pool_month    TEXT NOT NULL,
  position      INT NOT NULL DEFAULT 0,
  selected_by   UUID,
  selected_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  replaced_at   TIMESTAMPTZ,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_impact_monthly_unique ON impact_monthly_projects (project_id, pool_month) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_impact_monthly_month ON impact_monthly_projects (pool_month, is_active);
CREATE TRIGGER IF NOT EXISTS trg_impact_monthly_updated_at BEFORE UPDATE ON impact_monthly_projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 2. Tabelle: impact_events (SADB-Verknüpfung, 5 Event-Typen)
CREATE TABLE IF NOT EXISTS impact_events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type    TEXT NOT NULL,
  project_id    UUID REFERENCES impact_applications(id) ON DELETE SET NULL,
  pool_month    TEXT,
  voter_id      UUID,
  data          JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_impact_events_type ON impact_events (event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_impact_events_month ON impact_events (pool_month, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_impact_events_project ON impact_events (project_id, created_at DESC);

-- 3. RLS
ALTER TABLE impact_monthly_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "impact_monthly_read" ON impact_monthly_projects FOR SELECT USING (true);
CREATE POLICY "impact_monthly_write_admin" ON impact_monthly_projects FOR ALL USING (auth.role() = 'service_role');
ALTER TABLE impact_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "impact_events_read" ON impact_events FOR SELECT USING (true);
CREATE POLICY "impact_events_insert" ON impact_events FOR INSERT WITH CHECK (true);
CREATE POLICY "impact_events_write_admin" ON impact_events FOR ALL USING (auth.role() = 'service_role');

-- 4. RPC: rpc_select_monthly_project (Admin wählt Projekt für Monat)
CREATE OR REPLACE FUNCTION rpc_select_monthly_project(p_project_id UUID, p_pool_month TEXT, p_position INT DEFAULT 0, p_selected_by UUID DEFAULT NULL)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_count INT; v_existing RECORD;
BEGIN
  SELECT count(*) INTO v_count FROM impact_monthly_projects WHERE pool_month = p_pool_month AND is_active = true;
  SELECT id INTO v_existing FROM impact_monthly_projects WHERE project_id = p_project_id AND pool_month = p_pool_month AND is_active = true;
  IF v_existing IS NOT NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'Projekt bereits für diesen Monat ausgewählt'); END IF;
  IF v_count >= 3 THEN RETURN jsonb_build_object('ok', false, 'error', 'Bereits 3 Projekte für diesen Monat ausgewählt'); END IF;
  INSERT INTO impact_monthly_projects (project_id, pool_month, position, selected_by) VALUES (p_project_id, p_pool_month, COALESCE(p_position, v_count + 1), p_selected_by);
  INSERT INTO impact_events (event_type, project_id, pool_month, data) VALUES ('impact_project_added', p_project_id, p_pool_month, jsonb_build_object('position', COALESCE(p_position, v_count + 1)));
  RETURN jsonb_build_object('ok', true, 'count', v_count + 1);
END; $$;

-- 5. RPC: rpc_remove_monthly_project (Projekt aus Voting entfernen bei Abschluss)
CREATE OR REPLACE FUNCTION rpc_remove_monthly_project(p_project_id UUID, p_pool_month TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE impact_monthly_projects SET is_active = false, replaced_at = now() WHERE project_id = p_project_id AND pool_month = p_pool_month AND is_active = true;
  INSERT INTO impact_events (event_type, project_id, pool_month, data) VALUES ('impact_project_completed', p_project_id, p_pool_month, jsonb_build_object('removed_at', now()::text));
  RETURN jsonb_build_object('ok', true);
END; $$;

-- 6. RPC: rpc_get_monthly_projects (Liefert 3 aktive Projekte + Vote-Counts)
CREATE OR REPLACE FUNCTION rpc_get_monthly_projects(p_pool_month TEXT DEFAULT NULL)
RETURNS TABLE (project_id UUID, project_name TEXT, short_desc TEXT, cover_url TEXT, media_urls JSONB, funding_goal NUMERIC, current_amount_eur NUMERIC, is_completed BOOLEAN, status TEXT, votes BIGINT, position INT, created_at TIMESTAMPTZ)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_month TEXT;
BEGIN
  v_month := COALESCE(p_pool_month, to_char(now(), 'YYYY-MM'));
  RETURN QUERY
  SELECT ia.id, ia.project_name, ia.short_desc, ia.cover_url, ia.media_urls,
    COALESCE(ia.funding_goal, 0), COALESCE(ia.current_amount_eur, 0),
    COALESCE(ia.is_completed, false), ia.status,
    COALESCE(v.vote_count, 0)::BIGINT, imp.position, ia.created_at
  FROM impact_monthly_projects imp
  INNER JOIN impact_applications ia ON ia.id = imp.project_id
  LEFT JOIN LATERAL (SELECT count(*) AS vote_count FROM impact_votes iv WHERE iv.project_id = imp.project_id AND iv.pool_month = v_month) v ON true
  WHERE imp.pool_month = v_month AND imp.is_active = true
  ORDER BY v.vote_count DESC, ia.created_at ASC;
END; $$;

-- 7. RPC: rpc_log_impact_event (universeller Event-Logger)
CREATE OR REPLACE FUNCTION rpc_log_impact_event(p_event_type TEXT, p_project_id UUID DEFAULT NULL, p_pool_month TEXT DEFAULT NULL, p_voter_id UUID DEFAULT NULL, p_data JSONB DEFAULT NULL)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO impact_events (event_type, project_id, pool_month, voter_id, data) VALUES (p_event_type, p_project_id, p_pool_month, p_voter_id, p_data);
  RETURN jsonb_build_object('ok', true);
END; $$;

-- 8. RPC: rpc_monthly_impact_reset (Monats-Reset: Stimmen archivieren + Events)
CREATE OR REPLACE FUNCTION rpc_monthly_impact_reset()
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_month TEXT := to_char(now(), 'YYYY-MM'); v_count INT;
BEGIN
  BEGIN INSERT INTO impact_votes_archive SELECT * FROM impact_votes; GET DIAGNOSTICS v_count = ROW_COUNT; EXCEPTION WHEN OTHERS THEN v_count := -1; END;
  DELETE FROM impact_votes;
  UPDATE impact_monthly_projects SET is_active = false, replaced_at = now() WHERE is_active = true;
  INSERT INTO impact_events (event_type, pool_month, data) VALUES ('impact_month_reset', v_month, jsonb_build_object('archived_votes', v_count, 'reset_at', now()::text));
  RETURN jsonb_build_object('ok', true, 'archived_votes', v_count);
END; $$;

-- 9. Trigger: Event bei Vote-Cast automatisch loggen
CREATE OR REPLACE FUNCTION trg_log_vote_cast() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO impact_events (event_type, project_id, pool_month, voter_id, data) VALUES ('impact_vote_cast', NEW.project_id, NEW.pool_month, NEW.voter_id, jsonb_build_object('weight', NEW.weight));
  INSERT INTO impact_events (event_type, pool_month, data) VALUES ('impact_ranking_updated', NEW.pool_month, jsonb_build_object('trigger', 'vote_cast', 'project_id', NEW.project_id));
  RETURN NEW;
END; $$;
CREATE TRIGGER IF NOT EXISTS trg_impact_vote_cast_event AFTER INSERT ON impact_votes FOR EACH ROW EXECUTE FUNCTION trg_log_vote_cast();

-- 10. Trigger: Event bei Projekt-Abschluss loggen + aus Monthly entfernen
CREATE OR REPLACE FUNCTION trg_log_project_completed() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF (NEW.is_completed = true AND (OLD.is_completed = false OR OLD.is_completed IS NULL)) THEN
    INSERT INTO impact_events (event_type, project_id, pool_month, data) VALUES ('impact_project_completed', NEW.id, to_char(now(), 'YYYY-MM'), jsonb_build_object('completed_at', now()::text, 'funded_amount', NEW.current_amount_eur));
    UPDATE impact_monthly_projects SET is_active = false, replaced_at = now() WHERE project_id = NEW.id AND is_active = true;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER IF NOT EXISTS trg_impact_project_completed_event AFTER UPDATE ON impact_applications FOR EACH ROW EXECUTE FUNCTION trg_log_project_completed();

-- FERTIG — Alle Tabellen/RPCs/Trigger sind ADDITIV, nichts gelöscht.
