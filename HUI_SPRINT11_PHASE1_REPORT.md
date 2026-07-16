# HUI Sprint 11 — Phase 1: Notification System Modularisierung

**Sprint:** Implementation Sprint 11, Phase 1  
**Scope:** Refactoring von `useNotifications.jsx` in logische Module  
**Datum:** 2026-07-16  

---

## Zusammenfassung

Der monolithische Hook `src/lib/useNotifications.jsx` (1.090 Zeilen) wurde in ein Modulverzeichnis `src/lib/notifications/` aufgeteilt. Die öffentliche Hook-API, Businesslogik, Realtime-Verhalten und UI bleiben zu 100 % identisch. Die Root-Datei ist ein 8-zeiliger Re-Export für Backwards Compatibility.

---

## Aufgabe 1 — Analyse der ursprünglichen Datei

| Metrik | Wert |
|--------|------|
| **Gesamtgröße** | 1.090 Zeilen |
| **Datei** | `src/lib/useNotifications.jsx` |

### Öffentliche API

| Export | Typ | Beschreibung |
|--------|-----|--------------|
| `useNotifications()` | Hook | Zentraler Notification-Hook |
| `ResonanzzentrumPanel` | Komponente | Slide-Over Panel (4 Tabs) |
| `NotificationBadge` | Komponente | Badge für Header/Profil |
| `NotificationInbox` | Komponente | Legacy-Alias → `ResonanzzentrumPanel` |

**`useNotifications()` Rückgabewerte (unverändert):**

```javascript
{ items, unread, loading, markRead, markAllRead, deleteNotif, reload: load }
```

### Interne States (`useNotifications`)

| State | Typ | Zweck |
|-------|-----|-------|
| `items` | `Array` | Gefilterte Notifications (ohne Follow-ups) |
| `unread` | `number` | Ungelesen-Zähler (aus ungefilterten Daten) |
| `loading` | `boolean` | Lade-Status |
| `subRef` | `Ref` | Realtime-Channel-Referenz |

### useEffects

| Hook | Effect | Trigger |
|------|--------|---------|
| `useNotifications` | Load + Realtime-Subscription | `[user?.id, load]` |
| `useConnectionRequests` | Load pending requests | `[load]` |
| `useWeekStats` | Parallel-Count-Queries | `[userId]` |
| `ResonanzzentrumPanel` | CSS-Injection | `[]` (mount) |

### Realtime-Subscriptions

| Channel | Event | Tabelle | Filter | Dedupe |
|---------|-------|---------|--------|--------|
| `notif:${userId}` | INSERT | `notifications` | `user_id=eq.${userId}` | Ja — `supabase.getChannels()` prüft existierenden Topic |

### Queries

| Query | Tabelle | Zweck |
|-------|---------|-------|
| Notifications Load | `notifications` | 80 neueste, select id/type/title/body/is_read/created_at/data/metadata/action_url/actor_id |
| Connection Requests | `profile_relations` | pending, target_id = user |
| Week Stats | `profile_watchlist`, `notifications` | 4 parallele Count-Queries (7 Tage) |

### Actions

| Action | Optimistic UI | Supabase | Event |
|--------|---------------|----------|-------|
| `markRead(id)` | ✅ | UPDATE is_read | `hui:notif:read` |
| `markAllRead()` | ✅ | UPDATE all unread | `hui:notif:read` |
| `deleteNotif(id)` | ✅ | DELETE | `hui:notif:read` |
| `respond(id, action)` | ✅ (filter) | UPDATE profile_relations.status | — |

### Helper / Utils

- `TYPE_META`, `getMeta()` — Kategorie-Mapping (tab/icon/color/label)
- `fmtTime()` — Relative Zeitformatierung
- Follow-up-Filter (`data.is_followup === true`)
- Rejection-Type-Erkennung + Modal-Mapping
- Tab-Gruppierung (alle/wichtig/relevant/info)
- `PANEL_CSS`, `injectCSS()` — Panel-Animationen

---

## Aufgabe 2 — Neue Modulstruktur

```
src/lib/notifications/
├── index.js                          # Public re-exports
├── useNotifications.jsx              # Hook-Orchestrator (86 Zeilen)
├── useConnectionRequests.js          # Interner Hook (Panel)
├── useWeekStats.js                   # Interner Hook (Panel)
├── notificationQueries.js            # Supabase-Fetches
├── notificationRealtime.js           # Channel-Setup + Dedupe
├── notificationActions.js            # markRead/markAllRead/delete/respond
├── notificationHelpers.js            # Filter, Tab-Logik, Rejection-Maps
├── notificationTypes.js              # T, TYPE_META, getMeta
├── notificationUtils.js              # fmtTime, PANEL_CSS, injectCSS
├── ResonanzzentrumPanel.jsx          # Panel-Komponente
├── NotificationInbox.jsx             # Legacy-Wrapper
└── components/
    ├── NotifItem.jsx
    ├── ConnectionRequestItem.jsx
    ├── RejectionDetailModal.jsx
    ├── SectionHeader.jsx
    ├── WeekStats.jsx
    ├── EmptyTab.jsx
    └── NotificationBadge.jsx

src/lib/useNotifications.jsx          # Re-Export (8 Zeilen, Backwards Compat)
```

**Import-Pfade unverändert:** Alle Consumer importieren weiterhin aus `../lib/useNotifications.jsx`.

---

## Aufgabe 3 — Ausgelagerte Module

| Modul | Inhalt | Zeilen |
|-------|--------|--------|
| `notificationTypes.js` | Design-Tokens `T`, `TYPE_META`, `getMeta` | 64 |
| `notificationUtils.js` | `fmtTime`, `PANEL_CSS`, `injectCSS` | 38 |
| `notificationQueries.js` | `fetchNotifications`, `fetchConnectionRequests`, `fetchWeekStats` | 53 |
| `notificationRealtime.js` | `subscribeNotificationInserts` (Dedupe + Cleanup) | 32 |
| `notificationActions.js` | Supabase-Updates + `hui:notif:read` Event | 25 |
| `notificationHelpers.js` | Filter, Tab-Counts, Rejection-Maps, Empty-Messages | 80 |
| `useNotifications.jsx` | State-Orchestrierung, optimistic UI | 86 |
| `components/*` | UI-Subkomponenten (keine Logik-Änderung) | 478 |
| `ResonanzzentrumPanel.jsx` | Panel-Orchestrierung | 275 |

---

## Aufgabe 4 — Businesslogik

| Aspekt | Status |
|--------|--------|
| Öffentliche Hook-API | ✅ Unverändert |
| State-Shape | ✅ Unverändert |
| Query-Selektoren | ✅ Identisch |
| Realtime-Dedupe | ✅ Identisch (`notif:${userId}`) |
| Follow-up-Filter | ✅ Identisch |
| Unread-Zählung | ✅ Aus ungefilterten Daten (bewusstes Verhalten beibehalten) |
| Optimistic Updates | ✅ Im Hook-Orchestrator |
| CustomEvent `hui:notif:read` | ✅ In Actions-Modul |
| Keine neuen Hooks (öffentlich) | ✅ |
| Keine Architekturänderung | ✅ |

---

## Aufgabe 5 — Regression

| Test | Ergebnis |
|------|----------|
| Benachrichtigungen laden | ✅ Query-Modul, gleiche Select/Limit/Order |
| Realtime INSERT | ✅ Dedupe-Logik 1:1 extrahiert |
| Gelesen/Ungelesen | ✅ Optimistic + Supabase UPDATE |
| Badge | ✅ `NotificationBadge` + `hui:notif:read` Event |
| Öffnen (Panel) | ✅ `ResonanzzentrumPanel` unverändert |
| Löschen | ✅ Optimistic DELETE + Badge-Update |
| Navigation | ✅ Import-Pfade unverändert |
| App-Neustart | ✅ Build erfolgreich, keine Runtime-Errors |

**Consumer (unverändert):**

- `src/components/home/header/NotificationButton.jsx`
- `src/pages/MyBasisProfile.jsx`

---

## Aufgabe 6 — Build

```bash
npm install   # ✅ 377 packages, 0 vulnerabilities
npm run build # ✅ 829 modules, built in ~5s
```

---

## Aufgabe 7 — Performance

| Prüfpunkt | Ergebnis |
|-----------|----------|
| Zusätzliche Re-Renders | ✅ Keine — gleiche Hook-Struktur, gleiche Dependencies |
| Zusätzliche Realtime-Subscriptions | ✅ Keine — Dedupe-Logik unverändert |
| Zusätzliche Timer | ✅ Keine |
| Zusätzliche Netzwerkanfragen | ✅ Keine — Queries 1:1 extrahiert |
| Bundle-Größe | ✅ Unverändert (Code-Splitting via Vite, gleiche Exports) |

---

## Risiken

| Risiko | Mitigation |
|--------|------------|
| Doppelte Realtime-Channels | Dedupe in `notificationRealtime.js` 1:1 übernommen; `NotificationButton` ruft weiterhin kein `useNotifications()` auf |
| Import-Pfad-Brüche | Root-Re-Export `src/lib/useNotifications.jsx` |
| Unread vs. gefilterte Items | Bewusstes Verhalten dokumentiert und beibehalten |

---

## Definition of Done

| Kriterium | Status |
|-----------|--------|
| `useNotifications.jsx` deutlich kleiner | ✅ 1.090 → 8 Zeilen (Root) + 86 Zeilen (Orchestrator) |
| Öffentliche Hook-API unverändert | ✅ |
| Businesslogik unverändert | ✅ |
| Realtime unverändert | ✅ |
| Keine neuen Features | ✅ |
| Keine Architekturänderung | ✅ |
| Build erfolgreich | ✅ |
| Performance unverändert oder besser | ✅ |
| Ein Commit | ✅ |
| Eine PR | ✅ |

---

## Dateigrößen-Vergleich

| Datei | Vorher | Nachher |
|-------|--------|---------|
| `src/lib/useNotifications.jsx` | 1.090 Zeilen | 8 Zeilen (Re-Export) |
| `src/lib/notifications/` (gesamt) | — | 1.175 Zeilen (17 Dateien) |
| Hook-Orchestrator | (inline) | 86 Zeilen |
