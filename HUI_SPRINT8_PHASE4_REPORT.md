# HUI Sprint 8 Phase 4 — Presence Read Cutover (Discover)

**Datum:** 2026-07-16  
**Scope:** Discover liest Presence ausschließlich aus `user_presence` via `usePresenceMap`. Keine Änderungen an Feed, Chat, Commerce, Profile.

---

## Betroffene Komponenten

### Vorher (Legacy-Read)

| Datei | Zeile | Legacy-Quelle |
|-------|-------|---------------|
| `DiscoverPage.jsx` | 15 | `import { formatPresence } from "../lib/usePresence.js"` |
| `DiscoverPage.jsx` | 274 | `formatPresence(person.last_seen_at)` in `PersonCard` |
| `DiscoverPage.jsx` | 1764 | `last_seen_at: null` im Profile-Mapping (Identity Contract) |

### Nachher (user_presence)

| Datei | Änderung |
|-------|----------|
| `DiscoverPage.jsx` | `usePresenceMap(presenceUserIds)` — zentral für alle sichtbaren Personen |
| `DiscoverPage.jsx` | `presenceDisplayFromRow(presenceMap[person.id])` in `PersonCard` |
| `DiscoverPage.jsx` | `presenceMap` durch `PeopleSection` → `PersonCard` |
| `DiscoverPage.jsx` | `last_seen_at` aus Profile-Mapping entfernt |

### Unverändert (bewusst)

| Bereich | Read-Quelle |
|---------|-------------|
| Chat | `usePresenceMap` (Phase 3) |
| Feed | Kein Presence-Read |
| Profile | Kein Presence-Read in diesem Sprint |
| Home Write | `profiles.last_seen_at` via `usePresence.js` |

---

## Runtime

```
user_presence (DB)
  ↓ SELECT (initial load)
  ↓ postgres_changes (Realtime)
usePresenceMap(presenceUserIds)  [DiscoverPage]
  ↓ presenceMap[userId]
presenceDisplayFromRow(row)
  ↓ { label, dot, online }
PersonCard (Karten-Ansicht)
```

### Presence-User-IDs

Gesammelt aus `filteredPeople` (DB-Profile oder Seed-Fallback):
- Nur echte UUIDs (`/^[0-9a-f-]{36}$/i`)
- Seed-Personen (`p1`…`p6`) werden ausgeschlossen → kein Presence-Dot (wie vorher mit `last_seen_at: null`)

### Ansichten

| Ansicht | Presence |
|---------|----------|
| Karten (`view === "cards"`) | ✓ Dot + Label via `PersonCard` |
| Liste (`view === "list"`) | Kein Presence-UI (unverändert, war nie vorhanden) |
| Filter (Radius) | Betrifft Talente/Werke/Erlebnisse, nicht People-Presence |
| Suche | Kein separater People-Search in DiscoverPage |

---

## Realtime

| Aspekt | Implementierung |
|--------|-----------------|
| Subscription | `usePresenceMap` → ref-count Channel Registry (Phase 2) |
| Filter | `user_id=in.(uuid1,uuid2,...)` (max. 12 Profile aus Query) |
| Updates | `setMap` bei INSERT/UPDATE/DELETE |
| Reconnect | `visibilitychange → visible` → Reload |
| Cleanup | `removeChannel` bei refCount 0 |

Discover öffnet **eine** zentrale `usePresenceMap`-Subscription für alle angezeigten Personen-UUIDs.

---

## Regression (statische Prüfung)

| Szenario | Verhalten | Ergebnis |
|----------|-----------|----------|
| Online | `status === "online"` → grüner Dot, „Online" | ✓ |
| Idle/Away | `status === "away"` → amber Dot, „Gerade aktiv" | ✓ |
| Offline | `fmtPresence(row)` aus `last_seen_at` | ✓ |
| Reconnect | Visibility-Reload in `usePresenceMap` | ✓ |
| Karten | `PersonCard` mit `presenceMap` | ✓ |
| Listen | Kein Presence-UI (unverändert) | ✓ |
| Filter | Radius-Filter unabhängig von Presence | ✓ |
| Suche | Kein People-Search in Discover | n/a |
| Seed-Fallback | Keine UUID → kein Presence | ✓ |
| Kein DB-Eintrag | `presenceMap[id]` undefined → kein Dot | ✓ |

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
| `user_presence` leer für Profil | Mittel | UI zeigt keinen Dot (wie vorher mit `last_seen_at: null`) |
| Online-Schwelle anders als Legacy (`<120s` vs `status`) | Niedrig | Bewusste SSOT-Semantik; konsistent mit Chat-Cutover |
| Listen-Ansicht ohne Presence | Niedrig | War nie implementiert; kein Scope in diesem Sprint |
| Phase 3 PR #156 nicht gemerged | Niedrig | Branch baut auf Phase-3-Branch |

---

## Definition of Done

| Kriterium | Status |
|-----------|--------|
| Discover liest ausschließlich `user_presence` | ✓ |
| Keine Reads mehr aus `profiles.last_seen_at` in Discover | ✓ |
| Realtime funktioniert | ✓ (via `usePresenceMap`) |
| Keine Regression | ✓ (statisch) |
| Build erfolgreich | ✓ |
| Keine Änderungen außerhalb Discover | ✓ |

---

## Git

- **Branch:** `cursor/presence-discover-cutover-81c2`
- **Commit:** Ein Commit
- **PR:** Draft gegen `main` (stacked auf Sprint 8 Phase 3)
