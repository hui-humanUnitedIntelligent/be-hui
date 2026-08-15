-- ══════════════════════════════════════════════════════════════════════════
-- Migration 112: rpc_check_email_confirmed
-- ══════════════════════════════════════════════════════════════════════════
-- ZWECK:
--   EmailVerificationModal.jsx pollt bisher alle 3 Sekunden via
--   supabase.auth.signInWithPassword({email, password}), um zu prüfen ob die
--   E-Mail bereits bestätigt wurde. Solange NICHT bestätigt, antwortet
--   Supabase Auth mit 400 Bad Request ("Email not confirmed") — das erzeugt
--   bei jedem Poll-Tick einen sichtbaren Fehler in der Browser-Konsole (F12),
--   was der Nutzer als Rauschen/Bug wahrnimmt (Report 2026-08-15).
--
--   Diese RPC ersetzt das Polling: sie prüft NUR ob email_confirmed_at
--   gesetzt ist (read-only, kein Auth-Versuch, kein Passwort nötig) →
--   kein 400 mehr während des Wartens. Der tatsächliche signInWithPassword
--   wird im Frontend erst EIN EINZIGES MAL aufgerufen, sobald diese RPC
--   true zurückgibt (danach garantiert erfolgreich, kein Fehler).
--
-- SICHERHEIT:
--   SECURITY DEFINER, da auth.users nicht öffentlich lesbar ist.
--   Gibt ausschließlich ein Boolean zurück — keine sensiblen Felder.
--   Rate-Limiting ist nicht nötig, da kein Auth-Bruteforce-Vektor entsteht
--   (kein Passwort-Check, keine Session, kein Nutzerdaten-Leak außer
--   "existiert diese E-Mail und ist bestätigt" — das ist ohnehin über den
--   Registrierungs-Flow selbst ableitbar).
-- ══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.rpc_check_email_confirmed(p_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_confirmed boolean;
BEGIN
  SELECT (email_confirmed_at IS NOT NULL) INTO v_confirmed
  FROM auth.users
  WHERE email = p_email
  LIMIT 1;

  RETURN COALESCE(v_confirmed, false);
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_check_email_confirmed(text) TO anon, authenticated;

COMMENT ON FUNCTION public.rpc_check_email_confirmed(text) IS
  'Prueft nur ob email_confirmed_at gesetzt ist, ohne Auth-Versuch. Ersetzt das vorherige signInWithPassword-Polling in EmailVerificationModal.jsx, das bei jedem Tick ein 400 Bad Request erzeugte (Console-Rauschen). SECURITY DEFINER fuer Lesezugriff auf auth.users. Migration 112, 2026-08-15.';
