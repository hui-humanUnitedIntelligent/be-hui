-- ══════════════════════════════════════════════════════════════════
-- Migration: Nutzer-Blockierung + Hard-Delete Infrastruktur
-- Ausführen in: Supabase SQL Editor (hui-app Projekt)
-- ══════════════════════════════════════════════════════════════════

-- 1. Neue Spalten in profiles hinzufügen
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS blocked     BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS blocked_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS blocked_by  TEXT;

-- 2. Index für schnellen Blocked-Check beim Login
CREATE INDEX IF NOT EXISTS idx_profiles_blocked 
  ON public.profiles (blocked) 
  WHERE blocked = TRUE;

-- 3. Realtime für profiles aktivieren (für Sofort-Logout via Listener)
-- (Falls noch nicht aktiviert — in Supabase Dashboard unter Database > Replication)
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;

-- 4. RLS Policy: Nutzer kann eigenes blocked-Flag lesen (für Login-Check)
-- Service Role kann immer alles lesen/schreiben — kein extra Policy nötig.

-- 5. Sicherheits-Policy: blockierte Nutzer können keine eigenen Daten schreiben
-- (RLS verhindert bereits, dass blockierte Nutzer schreiben können wenn blocked=true
--  und die Policy entsprechend konfiguriert ist)

-- ── Bestehende 'blocked' Nutzer (role='blocked') migrieren ────────
UPDATE public.profiles
SET 
  blocked    = TRUE,
  blocked_at = NOW()
WHERE role = 'blocked' AND blocked IS NOT TRUE;

-- ── Bestehende 'deleted' Nutzer bleiben wie sie sind (soft-deleted)
-- Hard-Delete läuft ab jetzt über die Admin API

-- ══════════════════════════════════════════════════════════════════
-- Verifikation
-- ══════════════════════════════════════════════════════════════════
SELECT 
  COUNT(*) AS total_users,
  COUNT(*) FILTER (WHERE blocked = TRUE) AS blocked_users,
  COUNT(*) FILTER (WHERE role = 'deleted') AS soft_deleted_users
FROM public.profiles;

