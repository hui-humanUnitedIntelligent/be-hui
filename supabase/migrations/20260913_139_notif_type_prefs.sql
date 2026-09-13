-- Migration 139 (2026-09-13): NOTIF-TYPE-PREFS-001
-- 6 deaktivierbare Benachrichtigungstypen (Buchungen, Kommentare, Likes &
-- Inspirationen, Follower & Reposts, Systemnachrichten, Sonstige) —
-- SSOT-Tabelle bleibt user_notification_settings (additiv, PRINZIP 1:
-- Erweitern statt duplizieren; KEINE neue Tabelle).
-- Bidirektionale Synchronisation zwischen Resonanzzentrum-Filter und
-- Settings (PushNotificationBlock) über dieselben Spalten.
-- Die 6 Spalten steuern: (a) Resonanzzentrum-Sichtbarkeit (Client-Filter),
-- (b) Push-Versand pro Typ (send-push-notifications Edge Function).
-- Die bestehenden 3 Push-Kategorie-Spalten (push_buchungen/kauf_verkauf/
-- informativ) bleiben unberührt (kein Breaking Change).

ALTER TABLE public.user_notification_settings
  ADD COLUMN IF NOT EXISTS notif_bookings BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS notif_comments BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS notif_likes BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS notif_followers BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS notif_system BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS notif_other BOOLEAN DEFAULT true;

-- rpc_get_push_settings: neue Spalten additiv zurueckgeben (alte Aufrufer
-- lesen benannte Felder -> unbeeinflusst).
CREATE OR REPLACE FUNCTION public.rpc_get_push_settings()
RETURNS TABLE(push_enabled BOOLEAN, push_buchungen BOOLEAN, push_kauf_verkauf BOOLEAN, push_informativ BOOLEAN,
              notif_bookings BOOLEAN, notif_comments BOOLEAN, notif_likes BOOLEAN,
              notif_followers BOOLEAN, notif_system BOOLEAN, notif_other BOOLEAN)
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT push_enabled, push_buchungen, push_kauf_verkauf, push_informativ,
         notif_bookings, notif_comments, notif_likes,
         notif_followers, notif_system, notif_other
  FROM public.user_notification_settings WHERE user_id = auth.uid();
$$;

-- rpc_set_push_category: 6 neue Typ-Keys ergaenzt (alte 3 bleiben gueltig).
CREATE OR REPLACE FUNCTION public.rpc_set_push_category(p_category text, p_enabled boolean)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF p_category NOT IN ('buchungen','kauf_verkauf','informativ',
                        'bookings','comments','likes','followers','system','other') THEN
    RAISE EXCEPTION 'invalid category: %', p_category;
  END IF;

  INSERT INTO public.user_notification_settings (user_id, last_updated)
  VALUES (auth.uid(), now())
  ON CONFLICT (user_id) DO NOTHING;

  IF p_category = 'buchungen' THEN
    UPDATE public.user_notification_settings SET push_buchungen = p_enabled, last_updated = now() WHERE user_id = auth.uid();
  ELSIF p_category = 'kauf_verkauf' THEN
    UPDATE public.user_notification_settings SET push_kauf_verkauf = p_enabled, last_updated = now() WHERE user_id = auth.uid();
  ELSIF p_category = 'informativ' THEN
    UPDATE public.user_notification_settings SET push_informativ = p_enabled, last_updated = now() WHERE user_id = auth.uid();
  ELSIF p_category = 'bookings' THEN
    UPDATE public.user_notification_settings SET notif_bookings = p_enabled, last_updated = now() WHERE user_id = auth.uid();
  ELSIF p_category = 'comments' THEN
    UPDATE public.user_notification_settings SET notif_comments = p_enabled, last_updated = now() WHERE user_id = auth.uid();
  ELSIF p_category = 'likes' THEN
    UPDATE public.user_notification_settings SET notif_likes = p_enabled, last_updated = now() WHERE user_id = auth.uid();
  ELSIF p_category = 'followers' THEN
    UPDATE public.user_notification_settings SET notif_followers = p_enabled, last_updated = now() WHERE user_id = auth.uid();
  ELSIF p_category = 'system' THEN
    UPDATE public.user_notification_settings SET notif_system = p_enabled, last_updated = now() WHERE user_id = auth.uid();
  ELSE
    UPDATE public.user_notification_settings SET notif_other = p_enabled, last_updated = now() WHERE user_id = auth.uid();
  END IF;
END;
$$;

-- Backfill: alle bestehenden Zeilen Default true (ADD COLUMN DEFAULT setzt
-- nur neue Zeilen auf true; bestehende bekommen den Default ebenfalls, aber
-- explizit absichern):
UPDATE public.user_notification_settings
SET notif_bookings = COALESCE(notif_bookings, true),
    notif_comments = COALESCE(notif_comments, true),
    notif_likes = COALESCE(notif_likes, true),
    notif_followers = COALESCE(notif_followers, true),
    notif_system = COALESCE(notif_system, true),
    notif_other = COALESCE(notif_other, true);
