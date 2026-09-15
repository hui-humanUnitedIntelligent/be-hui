-- 20260915_141_project_direct_support.sql
-- ═══════════════════════════════════════════════════════════════════
-- PROJECT-DIRECT-SUPPORT-001 (2026-09-15, Michael-Spec "Projekt Direkt
-- Unterstützung — Stripe Direct Funding Hub")
--
-- Nutzer können genehmigte, nicht abgeschlossene Herzensprojekte direkt
-- per Stripe unterstützen. Das Geld fließt NACH Stripe-Gebühr direkt in
-- current_amount_eur des Projekts (bereits existierendes Feld, SSOT für
-- den Fortschrittsbalken — siehe ImpactPage.jsx) und erhöht dessen
-- Fortschritt. Das ist ADDITIV zum bestehenden Impact-Pool/Voting-System
-- (Balanced Growth v1, 50/30/20-Verteilung) — beide Wege existieren
-- parallel, es wird NICHTS am Pool-Mechanismus verändert.
--
-- Namens-Entscheidung (Abweichung vom Ursprungs-Prompt, technisch
-- begründet): Ursprungsspec schlug eine neue Spalte "impact_pool" pro
-- Projekt vor — das kollidiert semantisch mit dem bestehenden, globalen
-- SSOT-Begriff "Impact-Pool" (stripe_impact_pool-Tabelle, Balanced
-- Growth v1 30%-Topf). Stattdessen: bestehendes current_amount_eur
-- wiederverwenden (ist bereits die SSOT für den Fortschrittsbalken).
-- ═══════════════════════════════════════════════════════════════════

-- 1) Additive Felder auf impact_applications
ALTER TABLE public.impact_applications
  ADD COLUMN IF NOT EXISTS direct_supports INT NOT NULL DEFAULT 0;
ALTER TABLE public.impact_applications
  ADD COLUMN IF NOT EXISTS last_support_date TIMESTAMPTZ;

-- 2) Neue Tabelle: Audit-Log jeder Direkt-Unterstützung (analog stripe_payments
--    für "Talent unterstützen" — gleiches Muster: pending → succeeded/failed)
CREATE TABLE IF NOT EXISTS public.project_direct_supports (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id         UUID NOT NULL REFERENCES public.impact_applications(id) ON DELETE CASCADE,
  supporter_user_id  UUID NOT NULL REFERENCES public.profiles(id),
  gross_amount_eur   NUMERIC(10,2) NOT NULL,
  stripe_fee_eur     NUMERIC(10,2) NOT NULL DEFAULT 0,
  net_amount_eur     NUMERIC(10,2) NOT NULL,
  stripe_payment_id  TEXT,                       -- Stripe-IDs immer TEXT (Standing Instruction)
  status             TEXT NOT NULL DEFAULT 'pending', -- pending | succeeded | failed
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pds_project_id ON public.project_direct_supports(project_id);
CREATE INDEX IF NOT EXISTS idx_pds_supporter  ON public.project_direct_supports(supporter_user_id);
CREATE INDEX IF NOT EXISTS idx_pds_stripe_pi   ON public.project_direct_supports(stripe_payment_id);

-- updated_at Trigger (kanonisches Muster, siehe Kurzfakten-Memory)
DROP TRIGGER IF EXISTS trg_pds_updated_at ON public.project_direct_supports;
CREATE TRIGGER trg_pds_updated_at
  BEFORE UPDATE ON public.project_direct_supports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3) RLS
ALTER TABLE public.project_direct_supports ENABLE ROW LEVEL SECURITY;

-- Supporter sieht eigene Unterstützungen
DROP POLICY IF EXISTS pds_select_own ON public.project_direct_supports;
CREATE POLICY pds_select_own ON public.project_direct_supports
  FOR SELECT TO authenticated
  USING (supporter_user_id = auth.uid());

-- Projekt-Ersteller sieht Unterstützungen für sein eigenes Projekt
DROP POLICY IF EXISTS pds_select_project_owner ON public.project_direct_supports;
CREATE POLICY pds_select_project_owner ON public.project_direct_supports
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.impact_applications ia
      WHERE ia.id = project_direct_supports.project_id AND ia.user_id = auth.uid()
    )
  );

-- Insert nur für die eigene, pending Zeile (Edge Function nutzt Service Role,
-- läuft an RLS vorbei — diese Policy sichert nur einen eventuellen Client-Insert ab)
DROP POLICY IF EXISTS pds_insert_own ON public.project_direct_supports;
CREATE POLICY pds_insert_own ON public.project_direct_supports
  FOR INSERT TO authenticated
  WITH CHECK (supporter_user_id = auth.uid());

-- 4) RPC: atomarer Increment auf current_amount_eur (kein Read-Modify-Write,
--    race-condition-sicher bei parallelen Unterstützungen). Schützt zusätzlich
--    abgeschlossene Projekte (is_completed=true) vor weiteren Zuflüssen —
--    analog zum bestehenden Schutz beim Projekt-Bearbeiten/Löschen.
CREATE OR REPLACE FUNCTION public.rpc_add_project_direct_support(
  p_project_id UUID,
  p_net_amount_eur NUMERIC
) RETURNS TABLE(new_amount_eur NUMERIC, funding_goal NUMERIC, is_completed BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  UPDATE public.impact_applications
  SET current_amount_eur = COALESCE(current_amount_eur, 0) + p_net_amount_eur,
      direct_supports     = COALESCE(direct_supports, 0) + 1,
      last_support_date   = now()
  WHERE id = p_project_id
    AND status = 'approved'
    AND is_completed = false
  RETURNING impact_applications.current_amount_eur, impact_applications.funding_goal, impact_applications.is_completed;
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_add_project_direct_support(UUID, NUMERIC) TO service_role;
