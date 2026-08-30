-- ════════════════════════════════════════════════════════════════
-- Migration 138: beitraege.user_id FK-Fix (Nachzug zu Migration 137)
-- Datum: 2026-08-31
-- ════════════════════════════════════════════════════════════════
--
-- ROOT CAUSE: Migration 137 hat works_creator_id_fkey und
-- experiences_user_id_fkey auf profiles(id) umgestellt, dabei aber
-- beitraege_user_id_fkey übersehen (Block 1 der Migration 137 deckte
-- nur works + experiences ab). beitraege_user_id_fkey zeigte weiterhin
-- auf auth.users(id).
--
-- Symptom: HuiMomentSheet.jsx setzt user_id = postingId (Org-Profil-ID
-- wenn Account-Switcher auf Org-Kontext steht). RLS (beitraege_insert,
-- Migration 137) erlaubt den Insert korrekt über die owner_user_id-
-- Policy — aber die FK-Constraint schlägt fehl, weil eine Org-Profil-
-- UUID keine Zeile in auth.users hat (nur in public.profiles).
-- DB-Fehler 23503 "beitraege_user_id_fkey" beim Momente-Teilen mit
-- aktivem Org-Account.

ALTER TABLE public.beitraege DROP CONSTRAINT IF EXISTS beitraege_user_id_fkey;
ALTER TABLE public.beitraege ADD CONSTRAINT beitraege_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Jede public.profiles-Zeile hat 1:1 dieselbe id wie auth.users bei
-- normalen User-Accounts (Trigger handle_new_user, siehe Memory #803) —
-- verlustfrei für bestehende Beiträge. Org-Profile haben eine eigene
-- profiles.id ohne auth.users-Pendant, genau das war der fehlende Fall.
