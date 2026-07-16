# HUI Presence Consolidation — Complete

**Sprint:** Implementation Sprint 8, Phase 6 (Final Cutover)  
**Status:** Abgeschlossen  
**Datum:** 2026-07-16  

---

## Finale Architektur

```
┌─────────────────────────────────────────────────────────────┐
│                    user_presence (SSOT)                      │
│  user_id | status | last_seen_at | updated_at | current_page │
└─────────────────────────────────────────────────────────────┘
         ▲ WRITE                              │ READ + Realtime
         │                                    ▼
  usePresence(userId)              usePresenceMap(userIds)
  (Home.jsx — eigener User)        (Feed, Chat, Discover)
         │                                    │
         │ Heartbeat 45s                      │ postgres_changes *
         │ online / away / offline            ▼
         │                              presenceDisplay(row)
         │                              → UI Label + Dot
```

**Entfernt aus Runtime:** `profiles.last_seen_at`, `profiles.last_seen`, `formatPresence()`.

---

## Aufgabe 1 — Vollständige Trefferliste (vor Cutover)

| Datei | Funktion | Zeile | Read/Write | Status |
|-------|----------|-------|------------|--------|
| `src/lib/usePresence.js` | `formatPresence` | 11 | Read (timestamp) | **Entfernt** → `presenceDisplay` |
| `src/lib/usePresence.js` | `usePresence` | 28–36 | **Write** `profiles.last_seen_at` | **Entfernt** |
| `src/lib/sessionHooks.js` | `usePresence` | 140–170 | **Read** `profiles.last_seen` | **Entfernt** |
| `src/lib/sessionHooks.js` | `useOwnPresence` | 174–222 | **Write** `profiles.last_seen` | **Entfernt** |
| `src/pages/Home.jsx` | — | 181 | Write via old `usePresence.js` | **→ usePresence.jsx** |
| `src/components/home/HomeShell.jsx` | — | 77 | Write via `useOwnPresence` | **Entfernt** (Duplikat) |
| `src/components/chat-center/ChatHeader.jsx` | — | 17 | Read `other_profile.last_seen_at` | **→ usePresenceMap** |
| `src/components/chat-center/ConversationCard.jsx` | — | 33 | Read `last_seen_at` | **→ usePresenceMap** |
| `src/pages/DiscoverPage.jsx` | `PersonCard` | 274 | Read `person.last_seen_at` | **→ usePresenceMap** |
| `src/feed/UnifiedFeed.jsx` | `FeedList` | ~507 | — | **Phase 5** → `usePresenceMap` |
| `src/lib/usePresence.jsx` | `usePresence` | 24–30 | Write `user_presence` | **Beibehalten (SSOT)** |
| `src/lib/usePresence.jsx` | `usePresenceMap` | 105–108 | Read `user_presence` | **Beibehalten** |

SQL/Migration-Dateien (`sql/`, `docs/hui_schema_v5_core.sql`) enthalten historische Schema-Definitionen — **keine Runtime**.

---

## Aufgabe 2 — Produktive Reads nach Cutover

**Keine produktiven Reads mehr aus `profiles.last_seen_at` / `profiles.last_seen`.**

Verifikation: `node scripts/sprint8-phase6-presence-cutover-check.mjs`

---

## Aufgabe 3 — Dual Write beendet

| Pfad | Vorher | Nachher |
|------|--------|---------|
| `usePresence.js` | `profiles.update({ last_seen_at })` | Re-Export aus `usePresence.jsx` |
| `sessionHooks.useOwnPresence` | `profiles.update({ last_seen })` | Entfernt |
| `usePresence.jsx` | `user_presence.upsert(...)` | **Einziger Write-Pfad** |

Write-Felder (unverändert):

- `status`
- `last_seen_at`
- `updated_at`
- `current_page`

---

## Aufgabe 4 — Runtime

```
Login
  → usePresence(userId) in Home.jsx
  → upsert user_presence { status: "online" }

Heartbeat (45s)
  → upsert user_presence { status, last_seen_at, updated_at }

Idle (90s)
  → status: "away"

Tab hidden
  → status: "away"

Tab visible / Activity
  → status: "online"

beforeunload / unmount
  → status: "offline"

Realtime
  → usePresenceMap postgres_changes on user_presence
  → Feed / Chat / Discover UI updates
```

---

## Aufgabe 5 — Regression

| Bereich | Ergebnis |
|---------|----------|
| Feed | ✅ Phase 5 — `usePresenceMap` in FeedList |
| Discover | ✅ PeopleSection batch `usePresenceMap` |
| Chat | ✅ ChatHeader + ConversationCard `usePresenceMap` |
| Login | ✅ `usePresence` online upsert |
| Logout / App schließen | ✅ offline upsert on unmount |
| Reconnect | ✅ Realtime subscription in `usePresenceMap` |
| Mehrere Tabs | ✅ Channel dedupe in `usePresenceMap` |

---

## Aufgabe 6 — Build

```bash
npm install
npm run build
node scripts/sprint8-phase6-presence-cutover-check.mjs
```

---

## Verbliebene Reads / Writes

| Operation | Quelle | Datei |
|-----------|--------|-------|
| **Write** | `user_presence` | `src/lib/usePresence.jsx` → `usePresence` |
| **Read** | `user_presence` | `src/lib/usePresence.jsx` → `usePresenceMap` |
| **Display** | `user_presence` row | `presenceDisplay()`, `fmtPresence()`, `PresenceDot` |

**Keine** produktiven Reads/Writes auf `profiles.last_seen*` in `src/`.

---

## Risiken

| Risiko | Mitigation |
|--------|------------|
| User ohne `user_presence`-Row | Fallback `offline` / kein Dot |
| Legacy DB-Spalte `profiles.last_seen_at` | Schema bleibt; Runtime ignoriert |
| Doppelter Heartbeat (Home only) | `useOwnPresence` aus HomeShell entfernt |

---

## Definition of Done

| Kriterium | Status |
|-----------|--------|
| `user_presence` einzige SSOT | ✅ |
| Keine Writes `profiles.last_seen_at` | ✅ |
| Keine Reads `profiles.last_seen_at` | ✅ |
| Chat → `user_presence` | ✅ |
| Discover → `user_presence` | ✅ |
| Feed → `user_presence` | ✅ (Phase 5) |
| Realtime | ✅ |
| Build | ✅ |
| Konsolidierung abgeschlossen | ✅ |
