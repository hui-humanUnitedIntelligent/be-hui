-- Migration 141: Bankdaten-RPCs für Org-Profile freischalten
-- ════════════════════════════════════════════════════════════════
-- BUG (2026-08-31): BankdatenModal im Org-Profil zeigte die Bankdaten
-- des HAUPTACCOUNTS an und konnte auch nur auf diesen speichern.
-- Root Cause: Beide RPCs pruefen
--   IF auth.uid() IS DISTINCT FROM p_ambassador_id THEN forbidden
-- Ein Org-Profil hat eine andere ID als auth.uid() — der Aufruf
-- wird blockiert. SettingsModal bekommt jetzt effectiveProfile (das
-- Org-Profil) als profile-Prop und uebergibt deren ID an BankdatenModal.
-- Diese Migration erweitert beide RPCs so, dass sie auch p_ambassador_id-
-- Werte akzeptieren, die zu einem Org-Profil gehoeren, dessen
-- owner_user_id = auth.uid() ist.
-- ════════════════════════════════════════════════════════════════

-- ── rpc_get_ambassador_bank_status ──
CREATE OR REPLACE FUNCTION public.rpc_get_ambassador_bank_status(p_ambassador_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_row record;
BEGIN
  -- FIX 4 (2026-08-31): Erlaube auch Org-Profile deren owner_user_id = auth.uid()
  IF auth.uid() IS DISTINCT FROM p_ambassador_id AND NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = p_ambassador_id
      AND account_type = 'organization'
      AND owner_user_id = auth.uid()
  ) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'forbidden');
  END IF;

  SELECT bank_iban_last4, bank_details_updated_at INTO v_row
  FROM public.profiles WHERE id = p_ambassador_id;

  RETURN jsonb_build_object(
    'ok', true,
    'has_bank_details', v_row.bank_iban_last4 IS NOT NULL,
    'bank_iban_last4', v_row.bank_iban_last4,
    'updated_at', v_row.bank_details_updated_at
  );
END;
$function$;

-- ── rpc_save_ambassador_bank_details ──
CREATE OR REPLACE FUNCTION public.rpc_save_ambassador_bank_details(
  p_ambassador_id uuid,
  p_iban text,
  p_holder text,
  p_bic text DEFAULT NULL,
  p_bank_name text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  v_enc_key text;
  v_iban_clean text;
BEGIN
  -- FIX 4 (2026-08-31): Erlaube auch Org-Profile deren owner_user_id = auth.uid()
  IF auth.uid() IS DISTINCT FROM p_ambassador_id AND NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = p_ambassador_id
      AND account_type = 'organization'
      AND owner_user_id = auth.uid()
  ) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'forbidden');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_ambassador_id) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'profile_not_found');
  END IF;

  v_iban_clean := upper(regexp_replace(coalesce(p_iban, ''), '\s+', '', 'g'));
  IF length(v_iban_clean) < 15 OR length(v_iban_clean) > 34 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_iban');
  END IF;
  IF coalesce(trim(p_holder), '') = '' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'holder_required');
  END IF;

  SELECT decrypted_secret INTO v_enc_key FROM vault.decrypted_secrets WHERE name = 'ambassador_bank_enc_key';
  IF v_enc_key IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'enc_key_missing');
  END IF;

  UPDATE public.profiles SET
    bank_iban_enc = pgp_sym_encrypt(v_iban_clean, v_enc_key),
    bank_holder_enc = pgp_sym_encrypt(trim(p_holder), v_enc_key),
    bank_bic_enc = CASE WHEN coalesce(trim(p_bic), '') <> '' THEN pgp_sym_encrypt(upper(trim(p_bic)), v_enc_key) ELSE NULL END,
    bank_name_enc = CASE WHEN coalesce(trim(p_bank_name), '') <> '' THEN pgp_sym_encrypt(trim(p_bank_name), v_enc_key) ELSE NULL END,
    bank_iban_last4 = right(v_iban_clean, 4),
    bank_details_updated_at = now()
  WHERE id = p_ambassador_id;

  INSERT INTO public.notification_events(table_name, record_id, action, admin_id, created_at)
  VALUES ('profiles', p_ambassador_id::text, 'bank_details_saved', auth.uid()::text, now());

  RETURN jsonb_build_object('ok', true, 'bank_iban_last4', right(v_iban_clean, 4));
END;
$function$;
