-- Migration: DB Webhook Trigger für Push Notifications
-- Created: 2026-08-10
-- Purpose: Trigger send-push-notifications Edge Function when new outbox entry is created

-- 1. Function that calls the edge function via pg_net (fire-and-forget)
CREATE OR REPLACE FUNCTION public.fn_trigger_push_edge_function()
RETURNS TRIGGER AS $$
DECLARE
  edge_url TEXT := 'https://gxztrhvhcxhmunhhkfjd.supabase.co/functions/v1/send-push-notifications';
  anon_key TEXT := current_setting('app.supabase_anon_key', true);
BEGIN
  -- Fire-and-forget call to the edge function via pg_net
  PERFORM net.http_post(
    url := edge_url,
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || anon_key,
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object('outbox_id', NEW.id)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Trigger on INSERT into notifications_outbox
DROP TRIGGER IF EXISTS trg_push_outbox_to_edge ON public.notifications_outbox;
CREATE TRIGGER trg_push_outbox_to_edge
  AFTER INSERT ON public.notifications_outbox
  FOR EACH ROW EXECUTE FUNCTION public.fn_trigger_push_edge_function();
