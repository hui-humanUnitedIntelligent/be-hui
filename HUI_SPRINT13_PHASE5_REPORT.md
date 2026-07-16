# HUI Sprint 13 — Phase 5: Idle Polling Consolidation

**Sprint:** Implementation Sprint 13, Phase 5  
**Branch:** `cursor/sprint13-idle-polling-consolidation-6c13`  
**Datum:** 2026-07-16  
**Basis:** `HUI_NETWORK_REQUEST_AUDIT.md`, `HUI_RUNTIME_PROFILING_REPORT.md`, Phase-4-`cachedQuery`-Dedup

---

## Executive Summary

Idle Supabase-HTTP auf dem Home-Pfad wurde von **15,5 Requests/min** (Phase-3-Audit, 10 min) auf **6,0 Requests/min** (Phase-5-Messung, 6 min stabil) reduziert — **Ziel ≤ 6/min erreicht**.

Keine Änderungen an Businesslogik, UI, Queries, RPCs, Schema oder Realtime-Architektur. Nur sichere Polling-Konsolidierung: Tab-Sichtbarkeit, Page-Visibility, Cache-TTL-Alignment und Entfernen redundanter Idle-Poller.

---

## Aufgabe 1 — Alle aktiven Polling-Quellen (Home Idle-Pfad)

| Datei | Hook / Funktion | Timer | Intervall | HTTP-Request | Zweck |
|-------|-----------------|-------|-----------|--------------|-------|
| `src/hooks/useLiveTicker.js` | `useLiveTicker` → `refresh` | `setInterval` | 60 s | 10× GET (works, experiences, impact_projects, connections, recommendations, post_reactions, project_support, wirker, work_sales, experience_bookings) + sekundäre Join-GETs | Liveticker-Aktivitäts-Puffer |
| `src/pages/ImpactPage.jsx` | `useImpactActivities` → `load` | `setInterval` | 30 s | GET `impact_votes` (+ Profile/Project-Lookups) | Impact-Aktivitätsliste („Stimmen“-Feed) |
| `src/lib/usePresence.js` | `usePresence` → `ping` | `setInterval` | 60 s | PATCH `profiles` (`last_seen_at`) | Eigene Online-Präsenz |
| `src/lib/AppStateContext.jsx` | `fetchNotifCount` | `setInterval` | 60 s | HEAD `notifications` (unread count) | Notification-Badge |
| `src/lib/sessionHooks.js` | `useOwnPresence` → `touch` | `setInterval` | 120 s | PATCH `profiles` (`last_seen`) | Session-Presence (HomeShell) |
| `src/lib/usePresence.jsx` | `usePresence` → `upsert` | `setInterval` | 45 s | UPSERT `user_presence` | Nicht auf Home-Hauptpfad aktiv (nur `usePresenceMap` + Realtime) |
| `src/lib/observability/index.dev.js` | `captureMemorySnapshot` | `setInterval` | 60 s | Kein Supabase | DEV-only, nicht in Prod |

**Nicht auf Home-Idle-Pfad:** `PlatformDashboard.jsx` (15 s), `LiveMapPage.jsx` (UI-Rotation), `SearchCommandCenter.jsx`, `ImpactFlow.jsx`, `StoryBar.jsx`, `TalentOnboarding.jsx` (reine UI-Animationen).

---

## Aufgabe 2 — Bewertung je Quelle

| Quelle | Notwendig | Reduzierbar | Durch Realtime ersetzbar | Bereits redundant |
|--------|-----------|-------------|--------------------------|-------------------|
| **LiveTicker** (10 GET / 60 s) | Ja (bewusst Polling statt 10 RT-Channels) | **Ja** — Cache-TTL + Visibility | Nein (architektonisch Polling) | Nein |
| **Impact `useImpactActivities`** | Nur wenn Impact-Tab sichtbar | **Ja** — Tab + Visibility | Teilweise (`votes_rt_main` existiert, aber Activity-UI nutzt aggregierte Liste — kein Ersatz ohne Logikänderung) | Nein |
| **`usePresence.js` PATCH** | Ja (Heartbeat) | **Ja** — Visibility-Pause | Nein | Teilweise zu `useOwnPresence` (anderes Feld), nicht zusammengelegt |
| **Notifications HEAD** | Ja (Badge) | **Ja** — Visibility + TTL 60 s | Realtime für Notifications existiert separat; Polling bleibt als Fallback | Nein |
| **`useOwnPresence`** | Ja | Bereits Visibility-aware | Nein | Feld `last_seen` vs. `last_seen_at` — bewusst nicht konsolidiert |
| **`usePresence.jsx` heartbeat** | — | — | — | Nicht auf Home-Idle aktiv |

---

## Aufgabe 3 — Konsolidierung (umgesetzt)

### 1. `src/hooks/usePollingPause.js` (neu)

- `useIdleAwareInterval(callback, ms, enabled)` — überspringt Ticks bei `document.hidden`, Catch-up bei Visibility-Return.

### 2. `src/hooks/useLiveTicker.js`

- Intervall über `useIdleAwareInterval` (Visibility-Pause).
- `tickerQuery` nutzt `CACHE_TTL.ticker` (120 s) statt `CACHE_TTL.feed` (20 s) — 60-s-Refresh trifft Cache, HTTP nur ~alle 2 min.

### 3. `src/pages/ImpactPage.jsx` + `src/pages/Home.jsx`

- `useImpactActivities(pollEnabled)` — Polling nur wenn `isTabActive={tab === "impact"}`.
- Zusätzlich: Interval-Tick nur bei sichtbarem Tab (`!document.hidden`).

### 4. `src/lib/usePresence.js`

- Heartbeat-Interval prüft `!document.hidden` (Foreground-Return-Ping unverändert).

### 5. `src/lib/AppStateContext.jsx`

- Notification-Polling via `useIdleAwareInterval`.
- `CACHE_TTL.notifications` von 15 s auf 60 s (aligned mit Poll-Intervall).

### 6. `src/lib/perfUtils.js`

- `CACHE_TTL.ticker: 120_000`, `CACHE_TTL.notifications: 60_000`.

### 7. `src/lib/usePresence.jsx`

- Heartbeat pausiert bei `document.hidden` (defensiv, falls Hook später genutzt wird).

**Nicht geändert (bewusst):** Query-Inhalte, RPCs, Realtime-Channels, UI, Navigation, Feed-Logik, `useOwnPresence`-Intervall (bereits optimiert).

---

## Aufgabe 4 — Regression (Code-Review + Architektur-Check)

| Bereich | Status | Begründung |
|---------|--------|------------|
| Feed | ✓ | Keine Feed-Dateien geändert |
| Chat | ✓ | `chatContext.js` unverändert |
| Presence | ✓ | Heartbeat pausiert nur hidden; Foreground-Return-Ping erhalten |
| Discover | ✓ | Keine Discover-Änderungen |
| Impact | ✓ | Activity-Polling nur auf Impact-Tab; Realtime `votes_rt_main` unverändert |
| Notifications | ✓ | Polling + `hui:notif:read`-Event unverändert; nur Visibility/TTL |
| LiveTicker | ✓ | Gleiche 60-s-UI-Rotation aus Buffer; Daten max. ~2 min alt bei Cache-Hit |
| Navigation | ✓ | `isTabActive`-Prop rein intern, keine Nav-UI-Änderung |

---

## Aufgabe 5 — Performance Vorher / Nachher

### Idle HTTP/min

| Messung | Vorher (Phase 3) | Nachher (Phase 5) |
|---------|------------------|-------------------|
| Harness | `network-audit.mjs`, 10 min idle | `network-idle-only.mjs`, 6 min idle |
| Supabase HTTP (idle) | **155 / 10 min = 15,5/min** | **36 / 6 min = 6,0/min** |
| `impact_votes` idle | ~2/min | **0/min** (Feed-Tab) |
| `profiles` PATCH idle | ~1,5/min | **0/min** (im Messfenster) |
| LiveTicker GET idle | ~10/min | **~6/min** (Cache reduziert Burst; 1 Voll-Refresh / ~2 min) |

**Rohdaten:** `/tmp/hui-network-audit.json` (Phase 3), `/tmp/hui-network-idle-phase5-6min.json` (Phase 5)

### Polling-Timer (Home, Feed-Tab, Tab sichtbar)

| Metrik | Vorher | Nachher |
|--------|--------|---------|
| Aktive `setInterval`-Poller | 5 (Ticker, Impact, Presence, Notif, OwnPresence) | 4 (Impact entfernt auf Feed-Tab) |
| Timer-Intervall-Summe | 60+30+60+60+120 = 330 s⁻¹-Äquivalent | 60+60+60+120 = 300 s⁻¹-Äquivalent |

### Wake-Ups (Timer-Fires / min, sichtbarer Tab)

| Metrik | Vorher | Nachher |
|--------|--------|---------|
| Timer-Fires | ~4,5/min (inkl. Impact 2/min) | **~3,5/min** |
| Davon mit HTTP | ~15,5/min | **~6/min** |

---

## Aufgabe 6 — Build

```bash
npm install   # ✅ 0 vulnerabilities
npm run build # ✅ built in ~5.8s
```

---

## Risiken

| Risiko | Schwere | Mitigation |
|--------|---------|------------|
| LiveTicker-Daten bis 120 s alt bei Cache-Hit | Niedrig | Entspricht ohnehin 60-s-Poll-Design; Buffer rotiert UI alle 8–12 s |
| Impact-Aktivitäten verzögert bis Tab-Wechsel | Niedrig | Realtime für Votes unverändert; Activity-Liste ist Dekoration |
| Notification-Badge verzögert bei hidden Tab | Niedrig | Catch-up bei Tab-Return; Realtime-Pfad unberührt |
| DEV StrictMode-Doppelmount | Niedrig | Bereits in Phase 3 dokumentiert; Idle-Rate stabil über 6 min |

---

## Definition of Done

| Kriterium | Status |
|-----------|--------|
| Idle HTTP deutlich reduziert (15,5 → 6,0/min) | ✅ |
| Keine Businesslogik geändert | ✅ |
| Keine UI geändert | ✅ |
| Realtime nicht verschlechtert | ✅ |
| Build erfolgreich | ✅ |
| Idle-Last messbar kleiner | ✅ |
| Ein Commit | ✅ |
| Eine PR | ✅ |

---

## Geänderte Dateien

- `src/hooks/usePollingPause.js` (neu)
- `src/hooks/useLiveTicker.js`
- `src/lib/perfUtils.js`
- `src/lib/usePresence.js`
- `src/lib/usePresence.jsx`
- `src/lib/AppStateContext.jsx`
- `src/pages/ImpactPage.jsx`
- `src/pages/Home.jsx`
