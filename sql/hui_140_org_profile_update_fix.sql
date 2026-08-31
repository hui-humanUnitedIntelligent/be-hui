-- Migration 140: UPDATE-Policy für Org-Profile (RLS-Lücke)
-- ══════════════════════════════════════════════════════════════════
-- BUG-REPORT (2026-08-31, Michael): "Über uns"-Bio speichert die neue
-- Eingabe nicht -- alte Bio bleibt nach "Speichern" unverändert stehen.
--
-- ROOT CAUSE (verifiziert per pg_policy-Query gegen die Live-DB):
-- Migration 132/134/136/137 haben INSERT (profiles_insert_org), DELETE
-- (rpc_delete_org_profile, SECURITY DEFINER) und die abhängigen Content-
-- Tabellen (works/talents/experiences/beitraege, Migration 137) korrekt
-- mit owner_user_id-Policies für Org-Profile ausgestattet -- aber die
-- UPDATE-Policy für `profiles` selbst wurde dabei vergessen. Es existieren
-- nur zwei UPDATE-Policies auf `profiles`, BEIDE ausschließlich für das
-- persönliche Profil:
--   "Eigenes Profil"   USING/CHECK (auth.uid() = id)   -- cmd ALL
--   "profiles_update"  USING       (auth.uid() = id)   -- cmd UPDATE
-- Keine davon deckt den Fall ab, dass ein Nutzer (auth.uid()) Eigentümer
-- (owner_user_id) eines ORG-Profils mit ANDERER id ist. Der Supabase-
-- Client-Call
--   supabase.from("profiles").update({bio:...}).eq("id", orgId)
-- gibt dabei KEINEN Fehler zurück (RLS blockt einfach 0 Zeilen, kein
-- Exception) -- weshalb der Bug im Frontend unsichtbar war (kein
-- catch-Block hat angeschlagen, saveOk wurde sogar fälschlich true).
--
-- FIX: Analoge UPDATE-Policy zur bereits bestehenden profiles_insert_org
-- (Migration 134) ergänzen. WITH CHECK verhindert zusätzlich, dass ein
-- Org-Owner per UPDATE den account_type wegändert oder owner_user_id auf
-- einen anderen User umbiegt (Privilege-Escalation-Schutz).
-- ══════════════════════════════════════════════════════════════════

CREATE POLICY "profiles_update_org"
  ON public.profiles
  FOR UPDATE
  USING (account_type = 'organization' AND owner_user_id = auth.uid())
  WITH CHECK (account_type = 'organization' AND owner_user_id = auth.uid());

COMMENT ON POLICY "profiles_update_org" ON public.profiles IS
  'Erlaubt dem Eigentuemer (owner_user_id = auth.uid()) das Bearbeiten seines eigenen Org-Profils (Verein/Unternehmen). Migration 140, 2026-08-31. Analoge Policy zu profiles_insert_org (Migration 134). USING+WITH CHECK verhindern Umbiegen von account_type/owner_user_id.';
