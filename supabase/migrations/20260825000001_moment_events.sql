-- MOMENT-CONNECT (2026-08-25): SADB-Event-Tabelle für Moment-Verbindungen
-- Speichert alle Events des Moment-Connect-Systems:
-- moment_connect_clicked, moment_chat_created, moment_chat_opened,
-- moment_chat_reopened, moment_chat_closed, moment_interaction_logged

CREATE TABLE IF NOT EXISTS moment_events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type    TEXT NOT NULL,
  moment_id     UUID REFERENCES beitraege(id) ON DELETE SET NULL,
  chat_id       UUID REFERENCES chats(id) ON DELETE SET NULL,
  user_id       UUID REFERENCES profiles(id) ON DELETE SET NULL,
  other_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  metadata      JSONB DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS: Nutzer können nur eigene Events sehen, Admins alle
ALTER TABLE moment_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY moment_events_select_own ON moment_events
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'superadmin', 'super_admin')
    )
  );

CREATE POLICY moment_events_insert_own ON moment_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Index für häufige Queries
CREATE INDEX IF NOT EXISTS idx_moment_events_type ON moment_events(event_type);
CREATE INDEX IF NOT EXISTS idx_moment_events_moment ON moment_events(moment_id);
CREATE INDEX IF NOT EXISTS idx_moment_events_chat ON moment_events(chat_id);
CREATE INDEX IF NOT EXISTS idx_moment_events_user ON moment_events(user_id);
CREATE INDEX IF NOT EXISTS idx_moment_events_created ON moment_events(created_at DESC);
