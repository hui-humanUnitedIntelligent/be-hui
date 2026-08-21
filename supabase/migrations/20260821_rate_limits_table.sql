-- ═══════════════════════════════════════════════════════════════
-- RATE LIMITING TABLE (2026-08-21)
-- Backing store for Edge Function rate limiting
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public._rate_limits (
  id BIGSERIAL PRIMARY KEY,
  key TEXT NOT NULL,           -- action:ip
  action TEXT NOT NULL,        -- action name
  ip TEXT,                     -- client IP
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_rate_limits_key_time ON public._rate_limits(key, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rate_limits_created ON public._rate_limits(created_at);

-- Auto-cleanup: delete rows older than 1 hour (runs every 10 min)
-- Using pg_cron if available, otherwise manual cleanup in Edge Functions
CREATE INDEX IF NOT EXISTS idx_rate_limits_action ON public._rate_limits(action);

-- RLS: Disable (service role only — Edge Functions use service role key)
ALTER TABLE public._rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public._rate_limits FROM anon, authenticated;
GRANT INSERT, SELECT, DELETE ON public._rate_limits TO service_role;

