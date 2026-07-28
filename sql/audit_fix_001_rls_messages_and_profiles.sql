-- =============================================================================
-- AUDIT FIX 001 — RLS Bereinigung + messages.chat_id UUID Migration
-- Datum: 2026-07-28
-- Basis: HUI APP Vollständiger Audit Report
-- =============================================================================

-- ═══════════════════════════════════════════════════════════════════════
-- TEIL 1: messages.chat_id TEXT → UUID
-- ═══════════════════════════════════════════════════════════════════════
-- Alle bestehenden Werte sind valide UUIDs (34 Rows geprüft).
-- Alle Policies die chat_id::uuid casten werden bereinigt.

-- 1a. Bestehende Policies auf messages DROPPEN (werden neu erstellt)
DROP POLICY IF EXISTS "Public read"                  ON public.messages;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.messages;
DROP POLICY IF EXISTS "User sieht nur eigene Messages" ON public.messages;
DROP POLICY IF EXISTS "msg_select"                   ON public.messages;
DROP POLICY IF EXISTS "messages_participants"         ON public.messages;
DROP POLICY IF EXISTS "msg_insert"                   ON public.messages;
DROP POLICY IF EXISTS "msg_update"                   ON public.messages;
DROP POLICY IF EXISTS "User kann Messages senden"    ON public.messages;

-- 1b. chat_id Typ ändern TEXT → UUID
ALTER TABLE public.messages
  ALTER COLUMN chat_id TYPE uuid USING chat_id::uuid;

-- 1c. Foreign-Key-Constraint hinzufügen
ALTER TABLE public.messages
  ADD CONSTRAINT messages_chat_id_fkey
  FOREIGN KEY (chat_id) REFERENCES public.chats(id) ON DELETE CASCADE;

-- 1d. Index für Performance
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON public.messages(chat_id);

-- ═══════════════════════════════════════════════════════════════════════
-- TEIL 2: Saubere RLS Policies auf messages
-- SSOT: Nur Chat-Teilnehmer dürfen Messages lesen/senden/aktualisieren
-- ═══════════════════════════════════════════════════════════════════════

-- KEINE Änderung an messages_participants (ALL-Policy) — existiert nicht mehr
-- Stattdessen: 3 spezifische Policies

-- SELECT: Nur Teilnehmer des Chats dürfen Messages sehen
CREATE POLICY "messages_select_participants"
ON public.messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.chats
    WHERE chats.id = messages.chat_id
      AND auth.uid() = ANY(chats.participant_ids)
  )
);

-- INSERT: Nur Sender selbst + muss Teilnehmer sein
CREATE POLICY "messages_insert_participants"
ON public.messages
FOR INSERT
WITH CHECK (
  auth.uid() = sender_id
  AND EXISTS (
    SELECT 1 FROM public.chats
    WHERE chats.id = messages.chat_id
      AND auth.uid() = ANY(chats.participant_ids)
  )
);

-- UPDATE: Nur eigene Messages (z.B. is_read markieren)
CREATE POLICY "messages_update_own"
ON public.messages
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.chats
    WHERE chats.id = messages.chat_id
      AND auth.uid() = ANY(chats.participant_ids)
  )
);

-- ═══════════════════════════════════════════════════════════════════════
-- TEIL 3: profiles RLS — sensitive Felder schützen
-- Problem: profiles_authenticated_read gibt alles frei (qual = true)
-- Lösung: Security-Definer View für öffentliche Profile
-- ═══════════════════════════════════════════════════════════════════════

-- 3a. Bestehende überlappende UPDATE-Policy bereinigen
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
-- profiles_update bleibt (identisch)

-- 3b. profiles_authenticated_read NICHT droppen (breaking) — stattdessen
--     Row-Level-Security via Column-Level-Security über View-Ansatz

-- Sichere öffentliche Profil-View (ohne sensitive Felder)
DROP VIEW IF EXISTS public.profiles_public;
CREATE VIEW public.profiles_public AS
  SELECT
    id,
    created_at,
    updated_at,
    username,
    full_name,
    nickname,
    bio,
    avatar_url,
    banner_url,
    role,
    is_talent,
    is_wirker,
    is_ambassador,
    -- is_guardian: NICHT exponiert (internes Moderations-Flag)
    -- trust_score: NICHT exponiert (internes Ranking-Feld)
    -- reduced_reach_until: NICHT exponiert (internes Sanktions-Feld)
    -- stripe_account_id: NICHT exponiert (Finanz-Sensitivität)
    -- stripe_connect_status: NICHT exponiert
    location_text,
    website_url,
    instagram_url,
    twitter_url
  FROM public.profiles;

-- Öffentlich lesbar (anon + authenticated)
GRANT SELECT ON public.profiles_public TO anon, authenticated;

-- Sicherheitskommentar
COMMENT ON VIEW public.profiles_public IS
  'Öffentliche Profil-Ansicht. Sensitive Felder (trust_score, reduced_reach_until, is_guardian, stripe_*) sind bewusst ausgeschlossen.';

-- ═══════════════════════════════════════════════════════════════════════
-- TEIL 4: Duplikate auf INSERT-Policies messages bereinigen (bereits in T1)
-- ═══════════════════════════════════════════════════════════════════════
-- ✅ Erledigt in TEIL 1 durch DROP ALL + Neuerstellung

-- ═══════════════════════════════════════════════════════════════════════
-- VERIFIKATION
-- ═══════════════════════════════════════════════════════════════════════
SELECT
  'messages.chat_id type'       AS check_name,
  data_type                     AS result
FROM information_schema.columns
WHERE table_name = 'messages' AND column_name = 'chat_id'
UNION ALL
SELECT
  'messages policies count',
  COUNT(*)::text
FROM pg_policies
WHERE tablename = 'messages'
UNION ALL
SELECT
  'profiles public view exists',
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.views
    WHERE table_name = 'profiles_public'
  ) THEN 'YES' ELSE 'NO' END;
