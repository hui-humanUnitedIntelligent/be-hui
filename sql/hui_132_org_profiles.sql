-- ════════════════════════════════════════════════════════════════
-- Migration 132: Organisations-Profile (Account-Switcher / Ansatz A)
-- Datum: 2026-08-30
-- Feature: Nutzer kann 1 Organisations-Account erstellen (Verein/Unternehmen)
--          Beide Accounts an denselben Login geknüpft. Wechsel wie Instagram.
-- Regeln: Max 1 Org-Profil pro Nutzer, kein separater Login, öffentlich sichtbar
-- ════════════════════════════════════════════════════════════════

-- ── 1. Neue Spalten in profiles ─────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_type TEXT DEFAULT 'personal',
  ADD COLUMN IF NOT EXISTS owner_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS org_name TEXT,
  ADD COLUMN IF NOT EXISTS org_type TEXT,         -- 'verein' oder 'unternehmen'
  ADD COLUMN IF NOT EXISTS org_number TEXT,       -- Vereinsnummer / Handelsregisternummer
  ADD COLUMN IF NOT EXISTS org_description TEXT,
  ADD COLUMN IF NOT EXISTS managed_by TEXT;        -- "verwaltet von {owner display_name}"

-- ── 2. Index für Owner-Lookup (welche Org-Profile gehören diesem User) ──
CREATE INDEX IF NOT EXISTS idx_profiles_owner_user_id
  ON public.profiles(owner_user_id);

-- ── 3. Constraint: max. 1 Org-Profil pro User ────────────────────
-- Partial UNIQUE Index: nur bei account_type='organization' aktiv
-- → Persönliche Profile (account_type='personal') sind von diesem
--   Constraint nicht betroffen
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_owner_unique
  ON public.profiles(owner_user_id)
  WHERE account_type = 'organization';

-- ── 4. RLS: Org-Profil öffentlich lesbar ──────────────────────────
-- Org-Profile (account_type='organization') sind für alle sichtbar
-- (analog zu persönlichen Profilen die bereits public SELECT haben)
DROP POLICY IF EXISTS "profiles_org_read" ON public.profiles;
CREATE POLICY "profiles_org_read" ON public.profiles
  FOR SELECT
  USING (account_type = 'organization');

-- ── 5. RLS: Content-Erstellung als Org-Profil ────────────────────
-- Problem: auth.uid() bleibt der persönliche User, aber Content soll
-- unter dem Org-Profil (eigene UUID) erstellt werden.
-- Lösung: INSERT erlaubt wenn auth.uid() = user_id (persönlich)
--         ODER auth.uid() = owner_user_id des Profils das zu user_id gehört
--
-- WICHTIG: Diese Policies sind ADDITIV — die bestehenden
-- INSERT-Policies (auth.uid() = user_id) bleiben aktiv.
-- Postgres RLS: Row darf geschrieben werden wenn IRGENDEINE
-- permissive INSERT-Policy erfüllt ist.

-- 5a. works
DROP POLICY IF EXISTS "works_insert_org" ON public.works;
CREATE POLICY "works_insert_org" ON public.works
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = works.user_id
      AND p.owner_user_id = auth.uid()
    )
  );

-- 5b. talents
DROP POLICY IF EXISTS "talents_insert_org" ON public.talents;
CREATE POLICY "talents_insert_org" ON public.talents
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = talents.user_id
      AND p.owner_user_id = auth.uid()
    )
  );

-- 5c. experiences
DROP POLICY IF EXISTS "experiences_insert_org" ON public.experiences;
CREATE POLICY "experiences_insert_org" ON public.experiences
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = experiences.user_id
      AND p.owner_user_id = auth.uid()
    )
  );

-- ── 6. GRANT: Neue Spalten für authenticated sichtbar machen ─────
-- Die bestehenden GRANT-Statements (Migration 104) enthalten die
-- neuen Spalten noch nicht. Ohne GRANT können authentierte Nutzer
-- die Spalten nicht lesen/schreiben.
GRANT SELECT (account_type, owner_user_id, org_name, org_type, org_number, org_description, managed_by) ON public.profiles TO authenticated;
GRANT SELECT (account_type, owner_user_id, org_name, org_type, org_number, org_description, managed_by) ON public.profiles TO anon;
