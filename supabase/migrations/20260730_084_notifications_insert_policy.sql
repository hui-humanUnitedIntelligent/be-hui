-- Fix: Nutzer dürfen Notifications an andere senden (z.B. Chat-Nachricht, Follow)
-- Bedingung: sender_id muss der eigene Auth-User sein (Sicherheitscheck)
-- Die bestehende "notifications_owner" Policy (FOR ALL USING user_id=auth.uid())
-- erlaubt zwar SELECT/UPDATE für eigene, aber kein INSERT an andere.

-- Neue INSERT-Policy: Sender darf für jeden Empfänger inserieren,
-- solange sender_id = auth.uid() (verhindert Fake-Absender)
DROP POLICY IF EXISTS "notifications_sender_insert" ON public.notifications;
CREATE POLICY "notifications_sender_insert" ON public.notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    OR sender_id IS NULL  -- Systembenachrichtigungen ohne Sender (via service_role oder SADB)
  );

-- SELECT bleibt weiterhin nur für eigene (user_id = auth.uid())
-- Das ist durch die bestehende "notifications_owner" Policy bereits abgedeckt
