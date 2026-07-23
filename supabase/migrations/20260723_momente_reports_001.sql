-- ══════════════════════════════════════════════════════════════
-- MOMENTE-REPORTS-001: Community-Schutz für Momente-Posts
-- ══════════════════════════════════════════════════════════════

-- Tabelle: momente_reports
-- Speichert jede Meldung eines Nutzers für einen Moment
CREATE TABLE IF NOT EXISTS momente_reports (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  moment_id   uuid  NOT NULL,   -- FK zu moments (beitraege)
  reporter_id uuid  NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason      text  DEFAULT 'inappropriate',
  created_at  timestamptz NOT NULL DEFAULT now(),
  -- Jeder Nutzer kann jeden Moment nur EINMAL melden
  UNIQUE (moment_id, reporter_id)
);

-- Index für schnelle Zählungen
CREATE INDEX IF NOT EXISTS idx_momente_reports_moment_id
  ON momente_reports (moment_id);

CREATE INDEX IF NOT EXISTS idx_momente_reports_reporter_id
  ON momente_reports (reporter_id);

-- RLS: Nutzer können eigene Meldungen erstellen + lesen
ALTER TABLE momente_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reporter_insert" ON momente_reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "reporter_select_own" ON momente_reports
  FOR SELECT USING (auth.uid() = reporter_id);

CREATE POLICY "admin_all" ON momente_reports
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'superadmin', 'super_admin', 'employee')
    )
  );

-- ── RPC: rpc_report_moment ─────────────────────────────────
-- Meldet einen Moment. Wenn 5+ Meldungen → automatisch status='reported'
-- Gibt zurück: { success, already_reported, report_count, auto_removed }
CREATE OR REPLACE FUNCTION rpc_report_moment(
  p_moment_id   uuid,
  p_reporter_id uuid,
  p_reason      text DEFAULT 'inappropriate'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_report_count int;
  v_already      bool;
  v_auto_removed bool := false;
BEGIN
  -- Bereits gemeldet?
  SELECT EXISTS (
    SELECT 1 FROM momente_reports
    WHERE moment_id = p_moment_id AND reporter_id = p_reporter_id
  ) INTO v_already;

  IF v_already THEN
    RETURN jsonb_build_object(
      'success', false,
      'already_reported', true,
      'report_count', (SELECT COUNT(*) FROM momente_reports WHERE moment_id = p_moment_id),
      'auto_removed', false
    );
  END IF;

  -- Meldung einfügen
  INSERT INTO momente_reports (moment_id, reporter_id, reason)
  VALUES (p_moment_id, p_reporter_id, p_reason);

  -- Aktuellen Melde-Count ermitteln
  SELECT COUNT(*) INTO v_report_count
  FROM momente_reports WHERE moment_id = p_moment_id;

  -- Auto-Remove bei 5+ verschiedenen Meldern
  IF v_report_count >= 5 THEN
    -- beitraege ist die echte Momente-Tabelle in be-hui
    UPDATE beitraege
    SET status = 'reported'
    WHERE id = p_moment_id
    AND status NOT IN ('reported', 'deleted');

    IF FOUND THEN
      v_auto_removed := true;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'already_reported', false,
    'report_count', v_report_count,
    'auto_removed', v_auto_removed
  );
END;
$$;

-- ── Admin-RPC: rpc_get_momente_admin ──────────────────────────
-- Lädt alle Momente mit Report-Count für SADB
CREATE OR REPLACE FUNCTION rpc_get_momente_admin(
  p_status  text DEFAULT 'all',  -- 'all' | 'public' | 'reported' | 'deleted'
  p_limit   int  DEFAULT 100,
  p_offset  int  DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'entries', COALESCE(jsonb_agg(row_to_json(m.*) ORDER BY m.created_at DESC), '[]'::jsonb),
    'total',   COUNT(*) OVER()
  )
  INTO v_result
  FROM (
    SELECT
      cp.id,
      cp.user_id    AS initiator_id,
      p.full_name   AS initiator_name,
      p.username    AS initiator_username,
      p.avatar_url  AS initiator_avatar,
      cp.caption,
      cp.type       AS moment_type,
      cp.status,
      cp.created_at,
      (SELECT COUNT(*) FROM momente_reports mr WHERE mr.moment_id = cp.id) AS report_count
    FROM beitraege cp
    LEFT JOIN profiles p ON p.id = cp.user_id
    WHERE (p_status = 'all' OR cp.status = p_status)
    ORDER BY cp.created_at DESC
    LIMIT p_limit
    OFFSET p_offset
  ) m;

  RETURN v_result;
END;
$$;

-- Status 'reported' für beitraege erlauben (falls ENUM)
-- (In be-hui ist status text, also kein ENUM-Problem)

COMMENT ON TABLE momente_reports IS 'MOMENTE-REPORTS-001: Community-Meldungen für Momente-Posts. 5 Meldungen → auto status=reported';
