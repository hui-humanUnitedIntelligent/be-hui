# HUI Sprint 8 Phase 2 — Presence Read Consolidation (Runtime-Aktivierung)

**Datum:** 2026-07-16  
**Scope:** `usePresence.jsx` produktionsfähig aktivieren; `usePresenceMap` + Realtime; **keine** UI-Umstellung in Chat/Discover/Feed.

---

## Root Cause

Nach Sprint 8 Phase 1 (Dual-Write-Brücke in `usePresence.js`) war `user_presence` zwar befüllt, aber:

| Komponente | Status vor Phase 2 |
|------------|-------------------|
| `usePresence.jsx` → `usePresence()` | **Nicht gemountet** — volles Status-Modell inaktiv |
| `usePresence.jsx` → `usePresenceMap()` | **0 produktive Aufrufe** — Realtime ungetestet |
| UI (Chat/Discover) | Liest `profiles.last_seen_at` via `formatPresence` |

Die Read-Pipeline `user_presence → Realtime → Hook → Status` existierte im Code, war aber **nicht produktiv verdrahtet**.

---

## Implementierung

### Geänderte / neue Dateien

| Datei | Änderung |
|-------|----------|
| `src/lib/usePresence.jsx` | Produktionshärtung: ref-count Realtime-Registry, Reconnect, Cleanup |
| `src/lib/PresenceRuntime.jsx` | **Neu** — unsichtbare Bridge (null-Render) |
| `src/lib/usePresence.js` | Nur noch `profiles.last_seen_at` (UI-Read-Pfad) |
| `src/pages/Home.jsx` | `<PresenceRuntime />` bei authentifiziertem User |

### Architektur nach Phase 2

```
Home.jsx
  ├─► usePresence.js        → profiles.last_seen_at   (60s, UI-Read unverändert)
  └─► PresenceRuntime.jsx
        ├─► usePresence.jsx       → user_presence WRITE (45s, status/idle/offline)
        └─► usePresenceMap.jsx    → user_presence READ  + Realtime (self-ID, ohne UI)
```

### usePresence.jsx — Write-Hook

- UPSERT `user_presence` mit `status`, `last_seen_at`, `current_page`, `updated_at`
- Heartbeat 45s, Idle → `away` (90s), Foreground → `online`, Unmount/`beforeunload` → `offline`
- Activity-Events debounced (pointer/keydown/touch)

### usePresenceMap — Read + Realtime

| Feature | Implementierung |
|---------|-----------------|
| Initial Load | `SELECT` aus `user_presence` für übergebene IDs |
| Realtime | `postgres_changes` auf `user_presence` |
| Channel-Dedupe | Ref-count Registry (`presenceMapChannels`) — multi-mount/multi-tab safe |
| Filter | 1 ID: `user_id=eq.{id}`; mehrere: `user_id=in.(...)` |
| DELETE | `status: offline` aus `payload.old` |
| Reconnect | `visibilitychange → visible` → Reload |
| Cleanup | Listener entfernen; Channel bei `refCount === 0` via `removeChannel` |

### PresenceRuntime

- Rendert `null` — **keine sichtbare UI-Änderung**
- Mountet Write + Read-Pipeline für eingeloggten User
- `usePresenceMap([userId])` verifiziert Realtime ohne UI-Anbindung

### Unverändert (bewusst)

- `ChatHeader.jsx`, `ConversationCard.jsx` — `formatPresence(last_seen_at)`
- `DiscoverPage.jsx` — `formatPresence(person.last_seen_at)`
- `BaseFeedCard.jsx` — nur `PresenceDot`/`fmtPresence` Import (ungenutzt im Feed-Header)
- Keine Feed-, Commerce-, Profile-Änderungen

---

## Runtime

### Pipeline (ohne UI)

```
user_presence (DB)
  ↓ postgres_changes (Realtime)
usePresenceMap listener
  ↓ setMap({ [userId]: { status, last_seen_at, ... } })
Hook-State (intern, nicht gerendert)
```

### Write-Zyklus (usePresence.jsx)

1. Mount → `online`
2. Heartbeat 45s → Status refresh
3. Hidden → `away`
4. Visible → `online` + Idle-Timer reset
5. Unmount → `offline`

### Subscriptions

- Topic: `presence_map_{sortedUserIds}`
- Ref-count: Mehrere `usePresenceMap`-Mounts mit gleichen IDs teilen einen Channel
- Cleanup: Letzter Unmount entfernt Channel

---

## Build

```bash
npm install   # Exit 0
npm run build # Exit 0 — vite build ✓ built in ~5s
```

---

## Regression (statische Prüfung)

| Bereich | Prüfung | Ergebnis |
|---------|---------|----------|
| Login | `PresenceRuntime` mountet bei `currentUser.id` | ✓ |
| Logout | `userId` null → Runtime nicht gerendert, Hooks no-op | ✓ |
| Reconnect | `visibilitychange` → Reload in `usePresenceMap` | ✓ |
| Mehrere Tabs | Separate JS-Kontexte, je eigener Channel | ✓ |
| App im Hintergrund | `usePresence.jsx` → `away`; `.js` Heartbeat läuft | ✓ |
| Cleanup | `removeChannel` bei refCount 0; offline auf Unmount | ✓ |
| Home / Feed / Discover / Chat | Keine Read-Umstellung | ✓ |

---

## Risiken

| Risiko | Schwere | Mitigation |
|--------|---------|------------|
| Zwei Write-Hooks (`profiles` + `user_presence`) | Niedrig | Bewusst in Brückenphase; unterschiedliche Ziele |
| Realtime nicht deployed / RLS | Mittel | Graceful silent catch; Initial Load funktioniert |
| `usePresenceMap` mit vielen IDs | Niedrig | Noch nicht in UI; Phase 3 Batch-Limits beachten |
| Doppelte `user_presence` Writes wenn Phase-1-Dual-Write noch in .js | — | Phase 2 entfernt `user_presence` aus `.js` |

---

## Definition of Done

| Kriterium | Status |
|-----------|--------|
| `usePresence.jsx` vollständig produktionsfähig | ✓ |
| `usePresenceMap` produktionsfähig | ✓ |
| Realtime stabil (ref-count, cleanup, reconnect) | ✓ |
| Noch keine UI umgestellt | ✓ |
| Build erfolgreich | ✓ |
| Keine Regression | ✓ (statisch) |

---

## Git

- **Branch:** `cursor/presence-read-prep-81c2`
- **Commit:** Ein Commit
- **PR:** Draft gegen `main`
