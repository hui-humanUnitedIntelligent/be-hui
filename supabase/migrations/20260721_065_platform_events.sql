-- Migration: platform_events Tabelle
-- Zweck: Event-Layer für Discovery, Trust, Resonanz (fire-and-forget aus dem Feed)
-- Erzeugt: 2026-07-21, gefixt nach 404-Fehler beim Scrollen im Entdecken-Bereich

CREATE TABLE IF NOT EXISTS platform_events (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type   text NOT NULL,
  actor_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  target_id    uuid,
  target_type  text,
  recipient_id uuid,
  metadata     jsonb DEFAULT '{}'::jsonb,
  created_at   timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_platform_events_actor
  ON platform_events(actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_platform_events_type
  ON platform_events(event_type, created_at DESC);

ALTER TABLE platform_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_insert_own_events" ON platform_events
  FOR INSERT WITH CHECK (auth.uid() = actor_id);

CREATE POLICY "users_read_own_events" ON platform_events
  FOR SELECT USING (auth.uid() = actor_id);
