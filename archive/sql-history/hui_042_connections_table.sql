-- ═══════════════════════════════════════════════════════════════
-- HUI Migration 042 — connections Tabelle
-- Für: ConnectionCreatePage (Orb → Verbindung suchen)
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.connections (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type             TEXT NOT NULL DEFAULT 'kollab',
  title            TEXT NOT NULL,
  description      TEXT,
  date             DATE,
  time             TEXT,
  location         TEXT,
  max_participants INTEGER DEFAULT 30,
  cost             TEXT DEFAULT 'free',
  cost_amount      NUMERIC(10,2),
  mood             TEXT,
  visibility       TEXT NOT NULL DEFAULT 'public'
                   CHECK (visibility IN ('public','followers','private')),
  openness         TEXT DEFAULT 'open',
  status           TEXT NOT NULL DEFAULT 'active'
                   CHECK (status IN ('active','closed','cancelled')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_connections_user_id   ON public.connections(user_id);
CREATE INDEX IF NOT EXISTS idx_connections_status    ON public.connections(status);
CREATE INDEX IF NOT EXISTS idx_connections_created   ON public.connections(created_at DESC);

-- updated_at Trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_connections_updated ON public.connections;
CREATE TRIGGER trg_connections_updated
  BEFORE UPDATE ON public.connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "connections_select_public" ON public.connections;
CREATE POLICY "connections_select_public" ON public.connections
  FOR SELECT USING (visibility = 'public' AND status = 'active');

DROP POLICY IF EXISTS "connections_select_own" ON public.connections;
CREATE POLICY "connections_select_own" ON public.connections
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "connections_insert" ON public.connections;
CREATE POLICY "connections_insert" ON public.connections
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "connections_update" ON public.connections;
CREATE POLICY "connections_update" ON public.connections
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "connections_delete" ON public.connections;
CREATE POLICY "connections_delete" ON public.connections
  FOR DELETE USING (auth.uid() = user_id);
