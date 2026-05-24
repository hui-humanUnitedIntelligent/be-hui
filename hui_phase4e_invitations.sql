-- ═══════════════════════════════════════════════════════════════
-- HUI Phase 4E — Invitation Reality
-- invitations + invitation_responses
-- ═══════════════════════════════════════════════════════════════

-- 1. invitations
CREATE TABLE IF NOT EXISTS public.invitations (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title            TEXT,
  body             TEXT,
  text             TEXT,                          -- short caption (primary)
  vibe             TEXT,                          -- stimmungs-key (kaffee/spaziergang/…)
  mood             TEXT,
  energy           TEXT,
  city             TEXT,
  location         TEXT,
  time_label       TEXT,                          -- human-readable ("Heute 16 Uhr")
  starts_at        TIMESTAMPTZ,
  expires_at       TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '48 hours'),
  visibility       TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public','followers','private')),
  status           TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','expired','cancelled')),
  max_participants INTEGER,
  content_type     TEXT GENERATED ALWAYS AS ('invitation') STORED,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. invitation_responses
CREATE TABLE IF NOT EXISTS public.invitation_responses (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_id  UUID NOT NULL REFERENCES public.invitations(id) ON DELETE CASCADE,
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  response       TEXT NOT NULL CHECK (response IN ('interested','coming','maybe')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (invitation_id, user_id)               -- 1 Response pro User pro Invitation
);

-- 3. Indizes
CREATE INDEX IF NOT EXISTS idx_invitations_user_id    ON public.invitations(user_id);
CREATE INDEX IF NOT EXISTS idx_invitations_expires_at ON public.invitations(expires_at);
CREATE INDEX IF NOT EXISTS idx_invitations_status     ON public.invitations(status);
CREATE INDEX IF NOT EXISTS idx_invitations_visibility ON public.invitations(visibility);
CREATE INDEX IF NOT EXISTS idx_inv_resp_invitation_id ON public.invitation_responses(invitation_id);
CREATE INDEX IF NOT EXISTS idx_inv_resp_user_id       ON public.invitation_responses(user_id);

-- 4. updated_at Trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_invitations_updated ON public.invitations;
CREATE TRIGGER trg_invitations_updated
  BEFORE UPDATE ON public.invitations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. Auto-expire: status='expired' wenn expires_at vorbei
-- Wird per Query-Filter gelöst (WHERE expires_at > NOW() AND status='active')
-- Kein Cron nötig — der Feed-Query filtert serverseitig.

-- 6. RLS aktivieren
ALTER TABLE public.invitations          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitation_responses ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies — invitations
-- Alle authentifizierten User sehen aktive, öffentliche Invitations
DROP POLICY IF EXISTS "invitations_select_public"  ON public.invitations;
CREATE POLICY "invitations_select_public" ON public.invitations
  FOR SELECT USING (
    visibility = 'public'
    AND status = 'active'
    AND expires_at > NOW()
  );

-- Eigene Invitations immer sichtbar (auch abgelaufen/private)
DROP POLICY IF EXISTS "invitations_select_own" ON public.invitations;
CREATE POLICY "invitations_select_own" ON public.invitations
  FOR SELECT USING (auth.uid() = user_id);

-- Erstellen: nur für eingeloggte User
DROP POLICY IF EXISTS "invitations_insert" ON public.invitations;
CREATE POLICY "invitations_insert" ON public.invitations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Bearbeiten: nur eigene
DROP POLICY IF EXISTS "invitations_update" ON public.invitations;
CREATE POLICY "invitations_update" ON public.invitations
  FOR UPDATE USING (auth.uid() = user_id);

-- 8. RLS Policies — invitation_responses
DROP POLICY IF EXISTS "inv_resp_select" ON public.invitation_responses;
CREATE POLICY "inv_resp_select" ON public.invitation_responses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.invitations i
      WHERE i.id = invitation_id
        AND (i.visibility = 'public' OR i.user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "inv_resp_insert" ON public.invitation_responses;
CREATE POLICY "inv_resp_insert" ON public.invitation_responses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "inv_resp_update" ON public.invitation_responses;
CREATE POLICY "inv_resp_update" ON public.invitation_responses
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "inv_resp_delete" ON public.invitation_responses;
CREATE POLICY "inv_resp_delete" ON public.invitation_responses
  FOR DELETE USING (auth.uid() = user_id);

-- 9. Hilfsfunktion: response_count je Invitation (optional, für Performance)
CREATE OR REPLACE FUNCTION public.get_invitation_counts(inv_id UUID)
RETURNS TABLE(coming INT, interested INT, maybe INT) 
LANGUAGE SQL STABLE AS $$
  SELECT
    COUNT(*) FILTER (WHERE response = 'coming')     ::INT,
    COUNT(*) FILTER (WHERE response = 'interested') ::INT,
    COUNT(*) FILTER (WHERE response = 'maybe')      ::INT
  FROM public.invitation_responses
  WHERE invitation_id = inv_id;
$$;
