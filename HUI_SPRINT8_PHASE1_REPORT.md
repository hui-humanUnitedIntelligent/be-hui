# HUI Sprint 8 Phase 1 — Presence Consolidation (Dual-Write-Brücke)

**Datum:** 2026-07-16  
**Scope:** Konsolidierungsplan Phase 2 — Dual-Write `profiles.last_seen_at` + `user_presence`. Keine UI-/Read-Änderungen.

---

## Root Cause

Die Zielarchitektur (`user_presence` als Single Source of Truth) war implementiert (`usePresence.jsx`, SQL `036_presence_reactions.sql`), aber **nicht aktiv**:

| Komponente | Status vor Sprint 8 |
|------------|---------------------|
| `usePresence.js` → `profiles.last_seen_at` | **Produktiv** (Home.jsx, 60s Heartbeat) |
| `usePresence.jsx` → `user_presence` | **Inaktiv** (0 Hook-Mounts) |
| UI-Reads (`formatPresence`) | `profiles.last_seen_at` |

Ohne Dual-Write blieb `user_presence` leer/stale — ein Read-Cutover (Phase 3) wäre nicht möglich.

---

## Implementierung

### Geänderte Datei

| Datei | Änderung |
|-------|----------|
| `src/lib/usePresence.js` | `dualWritePresence()` — paralleler Write mit **identischem Timestamp** |

### Dual-Write-Logik

Bei jedem Heartbeat (App-Start, 60s Intervall, Foreground-Return):

```
dualWritePresence(userId)
  ├─► profiles.update({ last_seen_at: now })
  └─► user_presence.upsert({
        user_id, status, last_seen_at: now,  // gleicher now
        current_page: "home", updated_at: now
      })
```

| Feld | `profiles` | `user_presence` | Identisch? |
|------|------------|-----------------|------------|
| `last_seen_at` | ✓ | ✓ | **Ja** — ein `now`-Timestamp pro Ping |
| `status` | — | `online` / `away` | Nur `user_presence` (UI liest es noch nicht) |
| `current_page` | — | `"home"` | Nur `user_presence` |

**Design-Entscheidung:** Dual-Write in **einem** Hook statt parallelem Mount von `usePresence.jsx` — garantiert identische `last_seen_at`-Werte und ein Heartbeat-Intervall (60s) statt zwei unkoordinierte Timer (60s + 45s).

### Lifecycle

| Event | `profiles.last_seen_at` | `user_presence` |
|-------|-------------------------|-----------------|
| App-Start / Heartbeat / Foreground | Update | UPSERT `online`/`away` |
| Tab schließen / Unmount | Letzter Ping bleibt | UPSERT `offline` |

### Unverändert

- `Home.jsx` — `usePresence(currentUser?.id)` unverändert
- `formatPresence()` — unverändert
- Chat, Discover, Feed — lesen weiterhin `profiles.last_seen_at`
- `usePresence.jsx` — nicht gemountet (Phase 3 Read-Cutover)
- Keine Änderungen an Commerce, Profile, Feed

---

## Runtime

### Write-Pfade nach Sprint 8

```
Home.jsx: usePresence(userId)
  ↓
dualWritePresence()
  ├─► profiles.last_seen_at     (produktiver UI-Read)
  └─► user_presence             (Ziel-SSOT, vorbereitet)
```

### Heartbeat-Zyklus

1. **Mount** → sofortiger Dual-Write  
2. **setInterval(60s)** → Dual-Write  
3. **visibilitychange → visible** → Dual-Write  
4. **beforeunload / unmount** → `user_presence.status = offline`

### Realtime

`user_presence`-Zeilen werden bei jedem Ping aktualisiert. Bestehende `usePresenceMap`-Subscriptions in `usePresence.jsx` können diese Änderungen empfangen — werden aber in Phase 3 erst produktiv genutzt. Kein Realtime-Regressionsrisiko, da Reads unverändert.

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
| Login | `userId` gesetzt → Hook mountet → Dual-Write | ✓ |
| Logout | `userId` null → Hook no-op | ✓ |
| Home | `usePresence` in Home.jsx unverändert aufgerufen | ✓ |
| Feed | Kein Presence-Import betroffen | ✓ |
| Discover | `formatPresence(person.last_seen_at)` unverändert | ✓ |
| Chat | `formatPresence(...last_seen_at)` unverändert | ✓ |
| Hintergrund | Heartbeat läuft; `status: away` bei hidden | ✓ |
| App wieder öffnen | `visibilitychange` → Ping | ✓ |

---

## Risiken

| Risiko | Schwere | Mitigation |
|--------|---------|------------|
| Doppelte DB-Writes pro Heartbeat | Niedrig | Akzeptiert in Brückenphase (Konsolidierungsplan Phase 2) |
| `user_presence` RLS verweigert Write | Mittel | Policy `auth.uid() = user_id` — gleiche Auth wie `profiles` |
| `useOwnPresence` schreibt noch `last_seen` (main) | Niedrig | Sprint 7 Phase 3 PR #153 entfernt separat |
| Offline-Unmount aktualisiert nur `user_presence` | Niedrig | UI liest `profiles.last_seen_at` — unverändert |

---

## Definition of Done

| Kriterium | Status |
|-----------|--------|
| Dual Write aktiv | ✓ |
| UI unverändert | ✓ |
| Keine Regression | ✓ (statisch) |
| Build erfolgreich | ✓ |
| Keine Architekturänderung außerhalb Presence | ✓ |

---

## Git

- **Branch:** `cursor/presence-dual-write-81c2`
- **Commit:** Ein Commit
- **PR:** Draft gegen `main`
