-- PROFILE-RELATIONS-001: Verbindungsanfragen zwischen Nutzern
-- Root Cause der 404-Fehler: Tabelle fehlte komplett in der DB

CREATE TABLE IF NOT EXISTS public.profile_relations (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  intention     text,                    -- work, experience, exchange, create, other
  message       text,
  status        text NOT NULL DEFAULT 'pending',  -- pending, accepted, declined
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT profile_relations_unique UNIQUE (requester_id, target_id)
);

-- Trigger für updated_at
CREATE OR REPLACE TRIGGER update_profile_relations_updated_at
  BEFORE UPDATE ON public.profile_relations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Index für Performance
CREATE INDEX IF NOT EXISTS idx_profile_relations_target   ON public.profile_relations(target_id, status);
CREATE INDEX IF NOT EXISTS idx_profile_relations_requester ON public.profile_relations(requester_id);

-- RLS aktivieren
ALTER TABLE public.profile_relations ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Nutzer sehen eigene Verbindungsanfragen"
  ON public.profile_relations FOR SELECT
  USING (auth.uid() = requester_id OR auth.uid() = target_id);

CREATE POLICY "Nutzer können Anfragen senden"
  ON public.profile_relations FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Ziel-Nutzer kann Status ändern"
  ON public.profile_relations FOR UPDATE
  USING (auth.uid() = target_id OR auth.uid() = requester_id);

CREATE POLICY "Nutzer können eigene Anfragen löschen"
  ON public.profile_relations FOR DELETE
  USING (auth.uid() = requester_id);
