-- =============================================================================
-- AUDIT FIX 005 — Schema-Drift-Bereinigung (Migrationen 028–041)
-- Datum: 2026-07-28
-- Basis: SQL Migrations Audit
-- =============================================================================
-- WICHTIG: Alle Fixes sind additiv oder idempotent.
-- Keine bestehenden Daten werden gelöscht oder Primary Keys geändert.
-- =============================================================================

-- ═══════════════════════════════════════════════════════════════════════
-- FIX 1: works — user_id als SSOT, creator_id synchronisieren
-- Befund: 31/42 Works haben NULL in creator_id — user_id ist SSOT (NOT NULL)
-- Lösung: creator_id = user_id für alle Datensätze wo creator_id IS NULL
-- ═══════════════════════════════════════════════════════════════════════
UPDATE public.works
SET creator_id = user_id
WHERE creator_id IS NULL AND user_id IS NOT NULL;

-- Sicherstellen: creator_id von hier an NOT NULL
-- (nur wenn alle Zeilen befüllt sind)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.works WHERE creator_id IS NULL) THEN
    ALTER TABLE public.works ALTER COLUMN creator_id SET NOT NULL;
    ALTER TABLE public.works ALTER COLUMN creator_id SET DEFAULT auth.uid();
    RAISE NOTICE 'creator_id: NOT NULL gesetzt';
  ELSE
    RAISE WARNING 'creator_id: noch NULL-Werte vorhanden — NOT NULL nicht gesetzt';
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════════════
-- FIX 2: chats.state — Dokumentiere den tatsächlichen Wertebereich
-- Befund: DEFAULT ist 'opened' (nicht 'open'), kein CHECK-Constraint vorhanden
-- Lösung: CHECK-Constraint mit 'opened' als kanonischem Wert
-- 'open' / 'archived' / 'muted' / 'blocked' aus Migration 029 nie deployed
-- ═══════════════════════════════════════════════════════════════════════
ALTER TABLE public.chats
  DROP CONSTRAINT IF EXISTS chats_state_check;

ALTER TABLE public.chats
  ADD CONSTRAINT chats_state_check
    CHECK (state IN ('opened', 'archived', 'muted', 'blocked', 'closed'));

-- ═══════════════════════════════════════════════════════════════════════
-- FIX 3: chats — participant_a/b Trigger-Referenzen bereinigen
-- Befund: participant_a/b existieren NICHT in DB. Alle Trigger sind weg.
-- Schutz: Sicherstellen dass kein Legacy-Trigger noch existiert
-- ═══════════════════════════════════════════════════════════════════════
DROP TRIGGER IF EXISTS after_message_insert ON public.messages;
DROP FUNCTION IF EXISTS public.fn_after_message_insert();
DROP TRIGGER IF EXISTS update_chat_last_message ON public.messages;
DROP FUNCTION IF EXISTS public.fn_update_chat_last_message();

-- Aktueller Ersatz: unread_count via messages direkt abfragen (kein Trigger)
-- chatContext.js nutzt participant_ids[] → korrekt

-- ═══════════════════════════════════════════════════════════════════════
-- FIX 4: experiences — Legacy-Felder deprecaten (NICHT löschen)
-- Befund: 4 Duplikat-Felder, 2 Defaults inkonsistent
-- Strategie: kanonische Felder definieren, Legacy-Felder als deprecated markieren
-- SSOT:
--   participant_limit (nicht max_participants)
--   pricing_type     (nicht sale_mode / price_type)
--   available_days   (nicht avail_days)
--   booking_mode DEFAULT 'request' (nicht 'direct')
-- ═══════════════════════════════════════════════════════════════════════

-- Backfill: Legacy → Canonical (nur wo canonical NULL ist)
UPDATE public.experiences
SET participant_limit = max_participants
WHERE participant_limit IS NULL AND max_participants IS NOT NULL;

UPDATE public.experiences
SET pricing_type = COALESCE(sale_mode, price_type)
WHERE pricing_type IS NULL AND (sale_mode IS NOT NULL OR price_type IS NOT NULL);

UPDATE public.experiences
SET available_days = avail_days
WHERE available_days IS NULL AND avail_days IS NOT NULL;

-- booking_mode Default korrigieren (Audit: 'direct' ist falsch, 'request' war Intention)
ALTER TABLE public.experiences
  ALTER COLUMN booking_mode SET DEFAULT 'request';

-- ═══════════════════════════════════════════════════════════════════════
-- FIX 5: resonances — Tabelle existiert NICHT, aber Code referenziert sie
-- Befund: resonances = 0 Rows in information_schema (existiert nicht)
-- Frontend nutzt post_reactions stattdessen
-- Lösung: Minimale resonances-Tabelle erstellen (Alias auf post_reactions)
--         ODER post_reactions als SSOT bestätigen
-- Entscheidung: post_reactions ist SSOT (aus Audit Fix 003 bekannt)
--               resonances-Referenzen im Code → post_reactions migrieren
-- HIER: Dokumentations-Kommentar, kein DB-Objekt
-- ═══════════════════════════════════════════════════════════════════════
-- NOTE: resonances-Tabelle wird NICHT erstellt.
-- SSOT für Resonanz-Daten: public.post_reactions
-- Frontend-Code der 'resonances' referenziert muss auf 'post_reactions' umgestellt werden.
-- Betrifft: rpc_ambassador_resonance (bereits gefixt in audit_fix_003)

-- ═══════════════════════════════════════════════════════════════════════
-- FIX 6: hui_points_ledger — als Legacy markieren
-- Befund: Tabelle existiert, aber kein Frontend-Code nutzt sie
-- Keine Daten vorhanden → keine Aktion nötig
-- ═══════════════════════════════════════════════════════════════════════
-- HINWEIS: hui_points_ledger existiert als technische Schuld.
-- Status: NICHT LÖSCHEN (könnte Constraints haben).
-- Zukunft: Entscheidung ob Points-System implementiert wird.

-- ═══════════════════════════════════════════════════════════════════════
-- VERIFIKATION
-- ═══════════════════════════════════════════════════════════════════════
SELECT
  'works_creator_id_null' AS check_name,
  COUNT(*)::text AS result
FROM public.works WHERE creator_id IS NULL
UNION ALL
SELECT 'chats_state_constraint',
  COUNT(*)::text
FROM pg_constraint
WHERE conrelid = 'public.chats'::regclass AND conname = 'chats_state_check'
UNION ALL
SELECT 'experiences_backfill_participant_limit',
  COUNT(*)::text
FROM public.experiences WHERE participant_limit IS NOT NULL
UNION ALL
SELECT 'experiences_booking_mode_request',
  COUNT(*)::text
FROM public.experiences WHERE booking_mode = 'request';
