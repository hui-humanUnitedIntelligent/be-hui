# HUI Sprint 7 Phase 3 — P0 Presence Runtime Stabilization

**Datum:** 2026-07-16  
**Scope:** Entfernung des toten Presence-Write-Pfads. Kein Refactoring, keine Architekturänderung, kein Wechsel auf `user_presence`.

---

## Root Cause

Drei parallele Presence-Write-Pfade existierten im Code:

| # | Hook | Ziel | Status vor Fix |
|---|------|------|----------------|
| 1 | `usePresence.js` (`Home.jsx`) | `profiles.last_seen_at` | **Produktiv** — gelesen von Chat, Discover, `formatPresence` |
| 2 | `sessionHooks.useOwnPresence` (`HomeShell.jsx`) | `profiles.last_seen` | **Produktiv (Write)** — **0 Reads** |
| 3 | `usePresence.jsx` | `user_presence` | **Nicht gemountet** — nur `PresenceDot`/`fmtPresence` importiert |

**P0-Bug:** `useOwnPresence` schrieb alle 2 Minuten `profiles.last_seen`, während die gesamte lesende UI `last_seen_at` nutzt. Parallele Writes auf unterschiedliche Spalten ohne Konsistenz.

---

## Geänderte Dateien

| Datei | Änderung |
|-------|----------|
| `src/components/home/HomeShell.jsx` | `useOwnPresence(user?.id)` entfernt; Import entfernt |
| `src/lib/sessionHooks.js` | `useOwnPresence()` Funktion entfernt (~50 Zeilen); Kommentar präzisiert |

**Nicht geändert (bewusst):**

- `src/lib/usePresence.js` — produktiver Write `last_seen_at` unverändert
- `src/lib/usePresence.jsx` — nicht gemountet, außerhalb Scope
- `sessionHooks.usePresence()` Read-Hook — 0 Importe, unverändert
- Kein Schema, kein Realtime, kein `user_presence`-Cutover

---

## Runtime-Verifikation (statisch)

### Presence-Write-Pfade nach Fix

```bash
grep -r '\.update.*last_seen' src/
# → nur src/lib/usePresence.js:35  (last_seen_at)
```

| Pfad | Tabelle | Spalte | Aktiv? |
|------|---------|--------|--------|
| `Home.jsx` → `usePresence.js` | `profiles` | `last_seen_at` | **Ja** (Mount, 60s Heartbeat, Foreground) |
| ~~`HomeShell.jsx` → `useOwnPresence`~~ | ~~`profiles`~~ | ~~`last_seen`~~ | **Entfernt** |
| `usePresence.jsx` (nicht gemountet) | `user_presence` | — | Nein |

### Aufrufkette (produktiv)

```
App-Start / Login
  ↓
Home.jsx: usePresence(currentUser?.id)
  ↓
usePresence.js: ping()
  ↓
supabase.from("profiles").update({ last_seen_at })
  ↓
Trigger: App-Start, Heartbeat 60s, visibilitychange → visible
```

### Read-Pfade (unverändert)

| Consumer | Quelle |
|----------|--------|
| `ChatHeader.jsx` | `formatPresence(conv.other_profile?.last_seen_at)` |
| `ConversationCard.jsx` | `formatPresence(...last_seen_at)` |
| `DiscoverPage.jsx` | `formatPresence(person.last_seen_at)` |

---

## Regression (statische Prüfung)

| Bereich | Prüfung | Ergebnis |
|---------|---------|----------|
| Home | `usePresence` in `Home.jsx:177` unverändert | ✓ |
| Chat | `formatPresence(last_seen_at)` unverändert | ✓ |
| Discover | `formatPresence(last_seen_at)` unverändert | ✓ |
| Feed | Kein Presence-Write betroffen | ✓ |
| Login | Auth → Home → `usePresence` Mount | ✓ |
| Logout | `userId` null → Hook no-op | ✓ |
| Reconnect | `visibilitychange` → `ping()` in `usePresence.js` | ✓ |

**Erwartung:** Keine sichtbare UI-Änderung — der entfernte Write hatte keine Leser (Write Path Audit).

---

## Build

```bash
npm install   # Exit 0
npm run build # Exit 0 — vite build ✓ built in ~5s
```

---

## Risiken

| Risiko | Schwere | Mitigation |
|--------|---------|------------|
| Entfernter Write war unsichtbar | Niedrig | Audit bestätigt 0 Reads auf `last_seen` |
| `usePresence.jsx` schreibt `user_presence` wenn später gemountet | Niedrig | Hook aktuell nicht aufgerufen; Phase 2+ Konsolidierung |
| `sessionHooks.usePresence` liest noch `last_seen` (ungenutzt) | Niedrig | Phase 4 Cleanup — außerhalb P0-Scope |

---

## Definition of Done

| Kriterium | Status |
|-----------|--------|
| Nur noch ein produktiver Presence-Write | ✓ (`last_seen_at`) |
| `last_seen` wird nicht mehr geschrieben | ✓ |
| `last_seen_at` bleibt unverändert | ✓ |
| Keine Runtime-Regression | ✓ (statisch) |
| Build erfolgreich | ✓ |
| Keine Architekturänderung | ✓ |
| Nur dieser P0-Bug behoben | ✓ |

---

## Git

- **Branch:** `cursor/presence-p0-runtime-81c2`
- **Commit:** Ein Commit
- **PR:** Draft gegen `main`
