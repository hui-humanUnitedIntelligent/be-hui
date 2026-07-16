-- Additive RLS-Ergänzung: admin_read Policy (gleiche Definition wie bei
-- stripe_refunds/stripe_webhooks/stripe_impact_pool_events) auf die 4 Tabellen,
-- die sie noch nicht haben. Notwendig, damit SADB/EDB-Realtime-Subscriptions
-- (die über den authenticated Client laufen, nicht service_role) Live-Updates
-- für ALLE Nutzer sehen, nicht nur für den eigenen 'own_*'-Datensatz.
-- Rein additiv: bestehende Policies (own_*, service_role_all) bleiben unverändert.
SET search_path = public;

DROP POLICY IF EXISTS admin_read ON public.stripe_payments;
CREATE POLICY admin_read ON public.stripe_payments FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = ANY (ARRAY['superadmin','admin','employee'])));

DROP POLICY IF EXISTS admin_read ON public.stripe_subscriptions;
CREATE POLICY admin_read ON public.stripe_subscriptions FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = ANY (ARRAY['superadmin','admin','employee'])));

DROP POLICY IF EXISTS admin_read ON public.stripe_payouts;
CREATE POLICY admin_read ON public.stripe_payouts FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = ANY (ARRAY['superadmin','admin','employee'])));

DROP POLICY IF EXISTS admin_read ON public.stripe_ambassador_commissions;
CREATE POLICY admin_read ON public.stripe_ambassador_commissions FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = ANY (ARRAY['superadmin','admin','employee'])));

NOTIFY pgrst, 'reload schema';
