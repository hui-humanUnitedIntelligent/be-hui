-- Migration 118: Fix Registrierungsdaten-Verlust (username/full_name)
-- Datum: 2026-08-15
--
-- BUG (User-Report, Screenshot "Peter Stock @peter-stock"):
-- Der bei der Registrierung eingegebene Username geht verloren und wird
-- durch einen aus dem Namen generierten Slug ersetzt.
--
-- ROOT CAUSE (verifiziert per DB-Query gegen auth.users.raw_user_meta_data,
-- welches die unveränderlichen Original-Registrierungsdaten enthält):
--   1) handle_new_user() Trigger setzte username BISHER hart auf NULL,
--      obwohl LoginPage.jsx den Username in options.data.username an
--      signUp() übergibt (raw_user_meta_data->>'username' war immer da).
--   2) Der nachfolgende Client-seitige profiles.upsert() in LoginPage.jsx
--      (mit den korrekten Werten) schlägt bei mailer_autoconfirm=false
--      durch RLS fehl, da vor E-Mail-Bestätigung noch keine Session/
--      auth.uid() existiert (Policies verlangen auth.uid() = id).
--      → profiles.username bleibt NULL, profiles.full_name bleibt NULL.
--   3) ProfileCompletionFlow.jsx zeigt daraufhin Step 0 ("Dein Name") an,
--      weil profile_complete=false — dieses Feld ist aber technisch ein
--      USERNAME-Feld (UsernameInput/validateUsername). Der Nutzer denkt,
--      er gibt seinen Namen erneut ein, tatsächlich wird sein Name in
--      einen Username-Slug normalisiert und überschreibt für immer den
--      Username, den er bei der Registrierung tatsächlich gewählt hatte.
--
-- Beispiel (verifiziert, User stock.michael88@gmail.com):
--   Registriert:  full_name="Peter Stock", username="stocki"
--   DB (kaputt):  full_name=NULL,          username="peter-stock" (Slug!)
--
-- FIX:
--   A) handle_new_user() uebernimmt jetzt username/full_name/anrede aus
--      raw_user_meta_data — der Trigger ist SSOT (Memory #803) und laeuft
--      atomar in der signUp()-Transaktion, unabhaengig von Session/RLS-
--      Timing des nachfolgenden Client-Upserts.
--   B) Einmaliger Backfill: alle bestehenden Profile, bei denen full_name
--      IS NULL ist (= sichere Signatur "Registrierung nie erfolgreich
--      abgeschlossen", siehe Kommentar unten) und deren Original-
--      Registrierungsdaten in auth.users.raw_user_meta_data noch vorhanden
--      sind, werden auf die tatsaechlich bei der Registrierung
--      eingegebenen Werte zurueckgesetzt.
--
--   WICHTIG — warum "full_name IS NULL" ein sicheres Backfill-Kriterium
--   ist: ProfilBearbeitenModal.jsx (die einzige Stelle, an der Nutzer
--   ihren Namen/Username SPAETER bewusst aendern) schreibt IMMER
--   full_name MIT (Zeile 200: full_name: fullName.trim()). Ein Profil mit
--   full_name=NULL wurde also garantiert NIE erfolgreich durch eine
--   bewusste Nutzer-Aktion geschrieben — der Backfill ueberschreibt daher
--   niemals eine legitime spaetere Namensaenderung.

-- ── A) Trigger-Fix: username/full_name/anrede aus Registrierungsdaten uebernehmen ──
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (
    id, full_name, display_name, avatar_url, username, anrede,
    role, membership_type, email, created_at, updated_at
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture'),
    NEW.raw_user_meta_data->>'username',
    NEW.raw_user_meta_data->>'anrede',
    'basisuser',
    'basisuser',
    NEW.email,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$function$;

COMMENT ON FUNCTION public.handle_new_user() IS 'Kanonische Methode zur Profilgenerierung (Memory #803, SSOT). Uebernimmt full_name/display_name/username/anrede/avatar_url direkt aus auth.users.raw_user_meta_data (von supabase.auth.signUp() options.data befuellt) — laeuft atomar innerhalb der signUp()-Transaktion, unabhaengig von Session/RLS-Timing eines nachfolgenden Client-Upserts. FIX (Migration 118, 2026-08-15): username war zuvor hart auf NULL gesetzt, full_name/anrede fehlten komplett — Root Cause des "Username stimmt nicht"-Bugs (siehe Migrations-Kommentar).';

-- ── B) Backfill bestehender kaputter Profile aus den unveraenderlichen ──
-- ── Original-Registrierungsdaten in auth.users.raw_user_meta_data ──
UPDATE public.profiles p
SET
  full_name    = COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', p.full_name),
  username     = COALESCE(u.raw_user_meta_data->>'username', p.username),
  anrede       = COALESCE(p.anrede, u.raw_user_meta_data->>'anrede'),
  updated_at   = NOW()
FROM auth.users u
WHERE u.id = p.id
  AND p.full_name IS NULL
  AND (u.raw_user_meta_data->>'full_name' IS NOT NULL OR u.raw_user_meta_data->>'username' IS NOT NULL)
  -- Sicherheitsnetz: niemals einen bereits belegten Username doppelt vergeben
  AND (
    u.raw_user_meta_data->>'username' IS NULL
    OR NOT EXISTS (
      SELECT 1 FROM public.profiles p2
      WHERE p2.username = u.raw_user_meta_data->>'username' AND p2.id <> p.id
    )
  );
