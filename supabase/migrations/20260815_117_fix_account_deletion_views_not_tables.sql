-- Migration 117: Fix rpc_delete_own_account — DELETE FROM auf VIEWs statt Tabellen
-- Datum: 2026-08-15
--
-- BUG: Migration 115 enthielt zwei DELETE-Statements auf Objekte, die in
-- Wirklichkeit VIEWs sind, keine Tabellen — PostgreSQL erlaubt kein DELETE
-- auf einer einfachen View ohne INSTEAD OF-Trigger:
--   1) "buyer_order_status" — VIEW über orders + order_items (bereits per
--      UPDATE orders/order_items in Schritt 2 anonymisiert, siehe Migration 115).
--   2) "commerce_price_authority" — VIEW über works + experiences (bereits
--      per DELETE FROM works/experiences in Schritt 5 abgedeckt).
--
-- Symptom: 'cannot delete from view "buyer_order_status"' (500,
-- DATA_DELETE_FAILED) — reproduziert per Test-User-Aufruf der
-- delete-account Edge Function, NACH dem Fix von Migration 116.
--
-- Fix: Beide DELETE-Zeilen ersatzlos entfernt (redundant, Daten bereits
-- durch die darunterliegenden Basistabellen abgedeckt). Rest der Funktion
-- unveraendert.

CREATE OR REPLACE FUNCTION public.rpc_delete_own_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  target uuid := auth.uid();
BEGIN
  IF target IS NULL THEN
    RAISE EXCEPTION 'NOT_AUTHENTICATED: Kein authentifizierter Nutzer.';
  END IF;

  -- ── 1) NO ACTION FK-Referenzen entschaerfen (sonst blockiert Schritt 4) ──
  UPDATE public.ambassadors_applications SET reviewed_by = NULL WHERE reviewed_by = target;
  UPDATE public.escrow_disputes SET admin_id = NULL WHERE admin_id = target;
  UPDATE public.escrow_disputes SET initiated_by = NULL WHERE initiated_by = target;
  UPDATE public.profiles SET referred_by_ambassador_id = NULL WHERE referred_by_ambassador_id = target;
  UPDATE public.stripe_payouts SET approved_by = NULL WHERE approved_by = target;
  UPDATE public.stripe_payouts SET rejected_by = NULL WHERE rejected_by = target;
  UPDATE public.talent_bookings SET ambassador_id = NULL WHERE ambassador_id = target;
  UPDATE public.talents SET reviewed_by = NULL WHERE reviewed_by = target;

  -- ── 2) Transaktions-/Finanz-/Audit-Tabellen ohne FK: ANONYMISIEREN ──
  UPDATE public.orders SET customer_id = NULL, contact_name = NULL, contact_email = NULL WHERE customer_id = target;
  UPDATE public.orders SET ambassador_id = NULL WHERE ambassador_id = target;
  UPDATE public.bookings SET user_id = NULL, customer_id = NULL, client_name = NULL, customer_note = NULL WHERE user_id = target OR customer_id = target;
  UPDATE public.bookings SET ambassador_id = NULL WHERE ambassador_id = target;
  UPDATE public.order_items SET seller_id = NULL WHERE seller_id = target;
  UPDATE public.payments SET user_id = NULL WHERE user_id = target;
  UPDATE public.payments SET recipient_id = NULL WHERE recipient_id = target;
  UPDATE public.payments SET wirker_id = NULL WHERE wirker_id = target;
  UPDATE public.creator_payouts SET creator_id = NULL WHERE creator_id = target;
  UPDATE public.shipments SET creator_id = NULL WHERE creator_id = target;
  UPDATE public.booking_events SET actor_id = NULL WHERE actor_id = target;
  UPDATE public.commerce_events SET actor_id = NULL WHERE actor_id = target;
  UPDATE public.platform_events SET actor_id = NULL WHERE actor_id = target;
  UPDATE public.platform_events SET recipient_id = NULL WHERE recipient_id = target;
  UPDATE public.recommendations SET to_user_id = NULL WHERE to_user_id = target;
  UPDATE public.user_recommendations SET target_user_id = NULL WHERE target_user_id = target;
  UPDATE public.chats SET participant_ids = array_remove(participant_ids, target) WHERE target = ANY(participant_ids);
  UPDATE public.notifications SET user_id = NULL WHERE user_id = target;

  -- ── 3) Chat-Nachrichten: bestehender Soft-Delete-Mechanismus (Memory #832) ──
  UPDATE public.messages
  SET is_deleted = true, text = '[Nutzer hat seinen Account gelöscht]', media_url = NULL, media_type = NULL, edited_at = NOW()
  WHERE sender_id = target;

  -- ── 4) Watch-/Relations-/Report-/Invitation-Tabellen ohne FK: HART LOESCHEN ──
  DELETE FROM public.profile_watchlist WHERE watcher_id = target OR profile_id = target;
  DELETE FROM public.profile_relations WHERE requester_id = target OR target_id = target;
  DELETE FROM public.momente_reports WHERE reporter_id = target;
  DELETE FROM public.recommendation_reports WHERE reporter_id = target;
  DELETE FROM public.invitation_responses WHERE user_id = target;
  DELETE FROM public.invitations WHERE user_id = target;
  DELETE FROM public.content_shares WHERE sender_id = target OR recipient_id = target;

  -- ── 5) Eigene Inhalte/Aktionen ohne FK auf profiles: HART LOESCHEN ──
  -- FIX (Migration 117): "buyer_order_status" und "commerce_price_authority"
  -- entfernt — beide sind VIEWs (kein DELETE moeglich), Daten bereits ueber
  -- die darunterliegenden Basistabellen (orders/order_items, works/experiences)
  -- abgedeckt.
  DELETE FROM public.availability_slots WHERE user_id = target;
  DELETE FROM public.chat_participants WHERE user_id = target;
  DELETE FROM public.connections WHERE user_id = target;
  DELETE FROM public.creator_wallets WHERE user_id = target;
  DELETE FROM public.experiences WHERE user_id = target;
  DELETE FROM public.favorites WHERE user_id = target;
  DELETE FROM public.feed_items WHERE user_id = target;
  DELETE FROM public.follows WHERE follower_id = target OR followed_id = target;
  DELETE FROM public.impact_project_updates WHERE author_id = target;
  DELETE FROM public.impact_score_failures WHERE user_id = target;
  DELETE FROM public.moments WHERE user_id = target;
  DELETE FROM public.notification_settings WHERE user_id = target;
  DELETE FROM public.privacy_settings WHERE user_id = target;
  DELETE FROM public.project_support WHERE user_id = target;
  DELETE FROM public.recommendations WHERE from_user_id = target;
  DELETE FROM public.stories WHERE user_id = target;
  DELETE FROM public.user_recommendations WHERE user_id = target;
  DELETE FROM public.wirker WHERE user_id = target;
  DELETE FROM public.wirker_profiles WHERE user_id = target;
  DELETE FROM public.work_likes WHERE user_id = target;
  DELETE FROM public.work_saves WHERE user_id = target;
  DELETE FROM public.works WHERE creator_id = target OR user_id = target;

  -- ── 6) Finale Loeschung des Profils ──
  DELETE FROM public.profiles WHERE id = target;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.rpc_delete_own_account() TO authenticated;

COMMENT ON FUNCTION public.rpc_delete_own_account() IS 'DSGVO Art.17 Account-Loeschung: loescht/anonymisiert saemtliche Daten des aufrufenden Nutzers (auth.uid()) ueber ~50 Tabellen hinweg. SECURITY DEFINER, aber striktes Self-Service (kein Admin-Override). Aufruf NUR ueber DeleteAccountModal.jsx nach expliziter Warnbestaetigung. auth.users-Zeile wird separat per Edge Function (Service-Role) via deleteAccount.ts geloescht. FIX (Migration 116): messages-Soft-Delete nutzt Spalte "text". FIX (Migration 117): DELETE-Statements auf Views (buyer_order_status, commerce_price_authority) entfernt — Daten bereits ueber Basistabellen abgedeckt. Live-verifiziert per End-to-End-Test-User-Loeschung 2026-08-15.';
