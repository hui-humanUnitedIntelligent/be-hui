-- Migration 128: profiles SELECT Policy für anon (öffentliche Profile ohne Login)
-- Red-Team-Audit B.14: Migration 104 hat REVOKE SELECT + column-level GRANT
-- für anon gemacht, aber KEINE RLS SELECT-Policy für anon erstellt.
-- → RLS blockiert alle SELECT von anon, obwohl Spalten freigegeben sind.
-- → Öffentliche Profile (z.B. /profil/:id) sind ohne Login nicht sichtbar.
--
-- FIX: SELECT-Policy für anon erstellen, die alle Zeilen erlaubt.
-- Datenschutz wird bereits durch column-level GRANT gesichert:
# -- anon sieht nur: full_name, username, avatar_url, bio, etc. (kein email, phone, stripe, bank)
-- Sensitive Spalten sind für anon gar nicht freigegeben (Migration 104).

CREATE POLICY IF NOT EXISTS profiles_select_anon
  ON public.profiles
  FOR SELECT
  TO anon
  USING (true);

-- Hinweis: USING(true) ist hier sicher, weil die column-level GRANT
-- bereits die Spaltensichtbarkeit einschränkt. anon kann NIE email,
-- phone, stripe_account_id, bank_* etc. abfragen — Postgres gibt
-- "permission denied for column" zurück.
