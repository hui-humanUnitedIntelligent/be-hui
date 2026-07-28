-- =============================================================================
-- AUDIT FIX 002 — notifications Tabelle Migration (SSOT-Dokumentation)
-- Datum: 2026-07-28
-- Zweck: notifications existiert in DB aber nicht in SQL-Migrations-Dateien.
--        Diese Migration ist reproduzierbar und idempotent (CREATE IF NOT EXISTS).
-- =============================================================================

-- ═══════════════════════════════════════════════════════════════════════
-- notifications Tabelle
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.notifications (
  id              uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type            text        NOT NULL,
  title           text        NOT NULL,
  body            text,
  data            jsonb       NOT NULL DEFAULT '{}',
  is_read         boolean     NOT NULL DEFAULT false,
  read            boolean     NOT NULL DEFAULT false,  -- Legacy-Alias für is_read
  action_url      text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  entity_id       uuid,
  entity_type     text,
  target_user_id  uuid,
  actor_id        uuid,
  sender_id       uuid,
  metadata        jsonb       NOT NULL DEFAULT '{}',
  icon            text
);

-- Indizes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id     ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read     ON public.notifications(is_read) WHERE NOT is_read;
CREATE INDEX IF NOT EXISTS idx_notifications_created_at  ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type        ON public.notifications(type);

-- RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policies (idempotent — existieren bereits in Produktion)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='notifications' AND policyname='notifications_own'
  ) THEN
    CREATE POLICY "notifications_own"
    ON public.notifications
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Service-Role-Policy (für Backend-Insert via RPCs)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='notifications' AND policyname='notifications_service_all'
  ) THEN
    CREATE POLICY "notifications_service_all"
    ON public.notifications
    FOR ALL
    USING (true)
    WITH CHECK (true);
  END IF;
END $$;

-- Duplikat-Policy bereinigen (notifications_owner = identisch mit notifications_own)
DROP POLICY IF EXISTS "notifications_owner" ON public.notifications;

-- update_updated_at-Trigger (nicht relevant da kein updated_at — Skip)

-- Kommentare
COMMENT ON TABLE public.notifications IS
  'Resonanzzentrum-Notifications. SSOT für alle System-Events, Content-Änderungen und Community-Aktionen.';
COMMENT ON COLUMN public.notifications.read IS
  'Legacy-Alias für is_read. Beide Felder werden parallel befüllt für Abwärtskompatibilität.';
COMMENT ON COLUMN public.notifications.type IS
  'Event-Typ: follow, like, comment, booking_request, booking_confirmed, booking_cancelled, work_published, work_rejected, experience_published, experience_rejected, content_deleted, moment_reported, impact_vote, ambassador_referral, system';

