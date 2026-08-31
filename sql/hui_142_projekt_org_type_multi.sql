-- ════════════════════════════════════════════════════════════════
-- Migration 142: Dritter Org-Typ "Projekt" + Mehrere Org-Profile pro User
-- Datum: 2026-08-31
--
-- FEATURE-REQUEST (Michael): Dritten Organisationstyp "Projekt" hinzufügen
-- (analog zu Verein/Unternehmen). Ein Nutzer soll mehrere Org-Profile
-- (Verein UND Unternehmen UND Projekt) parallel besitzen können.
--
-- ROOT-CAUSE-CHECK (Arbeitsregeln §2/§4 — Fakten vor Code):
-- (1) org_type ist eine reine TEXT-Spalte ohne CHECK-Constraint/Enum
--     (Migration 132, Kommentar "'verein' oder 'unternehmen'" war nur
--     Doku, keine harte Regel) -- 'projekt' als Wert ist DB-seitig
--     bereits ohne Schema-Änderung zulässig. Kein CHECK-Constraint,
--     kein Trigger validiert org_type gegen eine feste Werteliste.
-- (2) idx_profiles_owner_unique (Migration 132) ist ein PARTIAL UNIQUE
--     INDEX auf (owner_user_id) WHERE account_type='organization' --
--     das erlaubt bisher NUR 1 Org-Profil pro Nutzer, unabhängig vom
--     Typ. Das blockiert "Verein + Unternehmen + Projekt gleichzeitig".
-- (3) AuthContext.jsx.loadOrgProfiles() lädt bereits ALLE Org-Profile
--     eines Users als Array (`.eq('owner_user_id', userId)` ohne
--     Typ-Filter) -- Frontend-Code unterstützt strukturell bereits
--     mehrere Org-Profile, nur der DB-Constraint verhindert es.
-- (4) AccountSwitcher.jsx zeigt "+ Konto hinzufügen" IMMER an (kein
--     hasOrgs-Gate das das Erstellen eines zweiten Org-Profils
--     blockiert) -- UI ist bereits multi-org-fähig.
--
-- FIX: Unique-Index von (owner_user_id) auf (owner_user_id, org_type)
-- verschärfen -- ein Nutzer kann weiterhin NICHT zwei "Verein"-Profile
-- anlegen, aber sehr wohl 1x Verein + 1x Unternehmen + 1x Projekt
-- parallel. Das entspricht exakt der Anforderung "mehrere Org-Profile
-- (Verein, Unternehmen, Projekt) parallel besitzen".
-- ════════════════════════════════════════════════════════════════

-- ── 1. Alten Constraint entfernen (max 1 Org-Profil pro User, egal Typ) ──
DROP INDEX IF EXISTS public.idx_profiles_owner_unique;

-- ── 2. Neuer Constraint: max 1 Org-Profil pro (User, Typ) ────────
-- Verhindert weiterhin Duplikate desselben Typs (z.B. 2x "Verein"),
-- erlaubt aber verschiedene Typen parallel (Verein + Unternehmen + Projekt).
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_owner_type_unique
  ON public.profiles(owner_user_id, org_type)
  WHERE account_type = 'organization';

-- ── 3. Keine weiteren Schema-Änderungen nötig ────────────────────
-- org_type bleibt TEXT ohne CHECK-Constraint -- 'projekt' ist als Wert
-- bereits zulässig. Keine Trigger validieren org_type gegen eine feste
-- Werteliste (verifiziert per Repo-Scan über alle sql/*.sql Dateien).
