-- ════════════════════════════════════════════════════════════════
-- Migration 134: Fix — fehlende INSERT-RLS-Policy für Org-Profil-Erstellung
-- Datum: 2026-08-30
-- Root Cause: Migration 132 hat RLS für das LESEN von Org-Profilen und für
-- das Erstellen von CONTENT (works/talents/experiences) unter einem
-- Org-Profil geregelt — aber NICHT für das Erstellen des Org-Profils
-- (profiles-Zeile) selbst. Bestehende INSERT-Policies auf profiles
-- ("Eigenes Profil", "profiles_insert") verlangen beide
-- auth.uid() = id — das schlägt zwingend fehl, weil das Org-Profil
-- eine EIGENE, zufällig generierte UUID als id bekommt (nicht die
-- des einloggten Users). Fehler beim Klick auf "Konto erstellen":
-- "new row violates row-level security policy for table 'profiles'"
-- (403 Forbidden beim POST /profiles).
--
-- Fix: Zusätzliche, additive INSERT-Policy — erlaubt das Anlegen
-- einer profiles-Zeile mit account_type='organization', wenn der
-- eingeloggte User als owner_user_id eingetragen ist (exakt das
-- Muster, das OrgProfileCreateFlow.jsx beim Insert sendet).
-- RLS-Policies mit demselben cmd sind OR-verknüpft (permissive) —
-- bestehende Policies bleiben unverändert aktiv.
-- ════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "profiles_insert_org" ON public.profiles;
CREATE POLICY "profiles_insert_org" ON public.profiles
  FOR INSERT
  WITH CHECK (
    account_type = 'organization'
    AND owner_user_id = auth.uid()
  );
