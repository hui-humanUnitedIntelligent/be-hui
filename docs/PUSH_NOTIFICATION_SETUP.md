# Push-Notification-System: Setup-Guide

## Übersicht
Das HUI Push-Notification-System besteht aus:
1. **DB-Tabellen** (SADB): `user_notification_settings`, `user_device_tokens`, `notifications_outbox`
2. **DB-Trigger**: Jede neue `notifications`-Zeile erzeugt automatisch einen `notifications_outbox`-Eintrag
3. **Edge Function**: `send-push-notifications` (liest outbox → sendet via FCM)
4. **Frontend**: Token-Registrierung, Vordergrund-Banner, Deep-Link-Navigation
5. **Settings UI**: Push-Toggle in Einstellungen

## Status: LIVE
- ✅ DB-Tabellen in Produktion (2026-08-06)
- ✅ RPCs in Produktion
- ✅ Trigger aktiv
- ✅ Frontend-Code gebaut und deployed
- ⏳ Firebase-Projekt + google-services.json erforderlich
- ⏳ Edge Function env vars erforderlich

## Was Michael noch tun muss:

### 1. Firebase-Projekt erstellen
1. Gehe zu https://console.firebase.google.com/
2. Neues Projekt erstellen (z.B. "HUI-App")
3. App hinzufügen → Android, Package name: `com.hui.app`
4. `google-services.json` herunterladen
5. Datei nach `android/app/google-services.json` kopieren

### 2. Service Account Key für Edge Function
1. Firebase Console → Projekt-Einstellungen → Service Accounts
2. "Generate new private key" → JSON herunterladen
3. Als Supabase Secrets speichern:
   - `FCM_PROJECT_ID`, `FCM_CLIENT_EMAIL`, `FCM_PRIVATE_KEY`

### 3. Edge Function deployen
```bash
supabase functions deploy send-push-notifications --project-ref gxztrhvhcxhmunhhkfjd
```

### 4. Webhook oder pg_cron einrichten
Siehe Details in der vollständigen Setup-Dokumentation.

## Architektur
```
[Event] → notifications INSERT → Trigger → outbox (pending)
  → Edge Function → check push_enabled → FCM → Gerät
```
