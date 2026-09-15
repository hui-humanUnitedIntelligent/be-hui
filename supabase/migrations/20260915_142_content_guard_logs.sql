-- 20260915_142_content_guard_logs.sql
-- CONTENT-GUARD-001 (2026-09-15, Michael-Spec Teil 2 "Content Awareness Guard"):
-- Logging-Tabelle fuer Chat-Trigger-Events (Off-App-Transaktions-Keywords).
-- Der Awareness-Hinweis selbst laeuft als System-Nachricht (message_type
-- 'system_awareness') durch die bestehende messages-Tabelle — KEINE neue
-- Message-Infrastruktur. Diese Tabelle dient ausschliesslich dem SADB-Tab
-- "Chat Content Guard" (Heute/Woche-Counts, Top-Keywords, Export).
--
-- chat_id als TEXT (Spiegel von messages.chat_id — bewusst NICHT uuid wegen
-- des bekannten Typ-Mismatches messages.chat_id TEXT vs chats.id UUID).
CREATE TABLE IF NOT EXISTS public.content_guard_logs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  timestamptz NOT NULL DEFAULT now(),
  chat_id     text,
  message_id  uuid,
  user_id     uuid NOT NULL,
  category    text NOT NULL,
  keyword     text NOT NULL
);

-- Kanonischer updated_at-Trigger (SSOT-Regel: update_updated_at_column)
ALTER TABLE public.content_guard_logs
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
CREATE TRIGGER trg_content_guard_logs_updated_at
  BEFORE UPDATE ON public.content_guard_logs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS: Clients (authenticated) duerfen NUR eigene Trigger-Events loggen.
-- Kein SELECT/UPDATE/DELETE fuer Clients — Lesen macht der SADB-Admin
-- exklusiv ueber Service-Role (bypassed RLS).
ALTER TABLE public.content_guard_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "content_guard_logs_insert_own" ON public.content_guard_logs;
CREATE POLICY "content_guard_logs_insert_own" ON public.content_guard_logs
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
