-- ═══════════════════════════════════════════════════════════════════
-- ARCH-006.1 — Additive Stripe-Schema-Ergänzungen (Architektur-Entscheidung
-- vom 2026-07-01: id bleibt TEXT, kein PK-Rewrite, keine Migration,
-- keine RPC-/Webhook-Änderungen. Nur additive, risikofreie Ergänzungen.)
-- ═══════════════════════════════════════════════════════════════════
SET search_path = public;

-- ── 1) Fehlende Indizes auf stripe_payments (rein additiv, keine Logikänderung)
CREATE INDEX IF NOT EXISTS idx_stripe_payments_user_id       ON public.stripe_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_stripe_payments_ambassador_id ON public.stripe_payments(ambassador_id);
CREATE INDEX IF NOT EXISTS idx_stripe_payments_status        ON public.stripe_payments(status);

-- ── 2) stripe_charge_id — nullable, additiv (kann von Webhooks künftig befüllt werden,
--       ändert nichts an bestehender Logik, kein NOT NULL, kein Default nötig)
ALTER TABLE public.stripe_payments ADD COLUMN IF NOT EXISTS stripe_charge_id text;
ALTER TABLE public.stripe_refunds  ADD COLUMN IF NOT EXISTS stripe_charge_id text;

-- ── 3) tier auf stripe_ambassador_commissions — nullable, additiv
--       (bronze/silber/gold/platin — analog zum bestehenden Ambassador-Level-System)
ALTER TABLE public.stripe_ambassador_commissions ADD COLUMN IF NOT EXISTS tier text;

NOTIFY pgrst, 'reload schema';
