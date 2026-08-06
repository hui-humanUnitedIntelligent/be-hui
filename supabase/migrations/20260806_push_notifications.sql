-- ────────────────────────────────────────────────────────────────────────────
-- PUSH-NOTIFICATION-SYSTEM: Tabellen, Trigger, RLS, RPCs
-- Erstellt: 2026-08-06
-- Status: LIVE in Produktion (gxztrhvhcxhmunhhkfjd)
-- ────────────────────────────────────────────────────────────────────────────

-- 1) user_notification_settings — Ein/Aus-Steuerung pro Nutzer
CREATE TABLE IF NOT EXISTS public.user_notification_settings (
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  push_enabled  BOOLEAN NOT NULL DEFAULT false,
  last_updated  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id)
);

-- 2) user_device_tokens — FCM/APNS Tokens pro Gerät
CREATE TABLE IF NOT EXISTS public.user_device_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  token       TEXT NOT NULL,
  platform    TEXT NOT NULL DEFAULT 'android',
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_device_tokens_user_token
  ON public.user_device_tokens(user_id, token);

CREATE INDEX IF NOT EXISTS idx_device_tokens_user_active
  ON public.user_device_tokens(user_id) WHERE is_active = true;

DROP TRIGGER IF EXISTS trg_device_tokens_updated_at ON public.user_device_tokens;
CREATE TRIGGER trg_device_tokens_updated_at
  BEFORE UPDATE ON public.user_device_tokens
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3) notifications_outbox — Queue für Push-Auslieferung
CREATE TABLE IF NOT EXISTS public.notifications_outbox (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID REFERENCES public.notifications(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type          TEXT NOT NULL,
  title         TEXT,
  body          TEXT,
  data          JSONB NOT NULL DEFAULT '{}'::jsonb,
  status        TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  retry_count   INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at       TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_outbox_status ON public.notifications_outbox(status, created_at);
CREATE INDEX IF NOT EXISTS idx_outbox_user ON public.notifications_outbox(user_id);

-- ─── RLS POLICIES ───────────────────────────────────────────────────────────
ALTER TABLE public.user_notification_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY rns_select_own ON public.user_notification_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY rns_update_own ON public.user_notification_settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY rns_insert_own ON public.user_notification_settings FOR INSERT WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.user_device_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY dt_select_own ON public.user_device_tokens FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY dt_insert_own ON public.user_device_tokens FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY dt_update_own ON public.user_device_tokens FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY dt_delete_own ON public.user_device_tokens FOR DELETE USING (auth.uid() = user_id);

ALTER TABLE public.notifications_outbox ENABLE ROW LEVEL SECURITY;

-- ─── TRIGGER: notifications → notifications_outbox ───────────────────────────
CREATE OR REPLACE FUNCTION public.trg_queue_push_notification()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications_outbox (
    notification_id, user_id, type, title, body, data, status
  ) VALUES (
    NEW.id, NEW.user_id, NEW.type, NEW.title, COALESCE(NEW.body, ''),
    jsonb_build_object(
      'entity_id', NEW.entity_id, 'entity_type', NEW.entity_type,
      'action_url', NEW.action_url, 'sender_id', NEW.sender_id,
      'notification_type', NEW.type, 'notification_id', NEW.id
    ),
    'pending'
  ) ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notifications_to_outbox ON public.notifications;
CREATE TRIGGER trg_notifications_to_outbox
  AFTER INSERT ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.trg_queue_push_notification();

-- ─── DEFAULT settings bei Registrierung ──────────────────────────────────────
CREATE OR REPLACE FUNCTION public.trg_create_notification_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_notification_settings (user_id, push_enabled)
  VALUES (NEW.id, false) ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_create_notification_settings ON public.profiles;
CREATE TRIGGER trg_create_notification_settings
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.trg_create_notification_settings();

INSERT INTO public.user_notification_settings (user_id, push_enabled)
SELECT id, false FROM public.profiles
WHERE id NOT IN (SELECT user_id FROM public.user_notification_settings)
ON CONFLICT DO NOTHING;

-- ─── RPCs ────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.rpc_get_push_settings()
RETURNS TABLE(push_enabled BOOLEAN)
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT push_enabled FROM public.user_notification_settings WHERE user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.rpc_set_push_enabled(p_enabled BOOLEAN)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.user_notification_settings (user_id, push_enabled, last_updated)
  VALUES (auth.uid(), p_enabled, now())
  ON CONFLICT (user_id) DO UPDATE SET push_enabled = p_enabled, last_updated = now();
  IF p_enabled = false THEN
    UPDATE public.user_device_tokens SET is_active = false WHERE user_id = auth.uid();
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.rpc_register_device_token(
  p_token TEXT, p_platform TEXT DEFAULT 'android'
) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.user_notification_settings
    WHERE user_id = auth.uid() AND push_enabled = true
  ) THEN
    INSERT INTO public.user_device_tokens (user_id, token, platform, is_active, updated_at)
    VALUES (auth.uid(), p_token, p_platform, true, now())
    ON CONFLICT (user_id, token) DO UPDATE SET is_active = true, updated_at = now();
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.rpc_invalidate_device_tokens()
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.user_device_tokens SET is_active = false WHERE user_id = auth.uid();
END;
$$;
