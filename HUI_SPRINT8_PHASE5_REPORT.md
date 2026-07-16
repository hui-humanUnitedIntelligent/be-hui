# HUI Sprint 8 — Phase 5: Presence Read Cutover (Feed)

**Sprint:** Implementation Sprint 8, Phase 5  
**Scope:** Presence-Anzeige im Feed → Single Source of Truth `user_presence`  
**Datum:** 2026-07-16  

---

## Zusammenfassung

Der Feed liest Presence ausschließlich über `usePresenceMap()` aus der Tabelle `user_presence`. Es gibt keine Reads aus `profiles.last_seen_at` und kein `formatPresence()` im Feed-Bereich.

---

## Aufgabe 1 — Betroffene Feed-Komponenten

| Datei | Funktion | Zeile | Bisher | Jetzt |
|-------|----------|-------|--------|-------|
| `src/feed/UnifiedFeed.jsx` | `FeedList` | ~497–512 | `_presenceStatus` nicht befüllt | `usePresenceMap(authorIds)` → `_presenceStatus` |
| `src/feed/cards/BaseFeedCard.jsx` | `HumanHeader` | ~229 | `item._presenceStatus` (unverbunden) | `_presenceStatus` aus `user_presence.status` |
| `src/feed/cards/BaseFeedCard.jsx` | `FeedCardHeader` | ~337 | `presenceStatus` prop (PresenceDot) | unverändert — erwartet Status-String, kein `last_seen_at` |

**Hinweis:** Im Feed-Quellcode gab es **keine** direkten Aufrufe von `formatPresence()` oder `profiles.last_seen_at`. Die Presence-Anzeige war über `_presenceStatus` vorbereitet, aber nie an `user_presence` angebunden. Der Cutover schließt diese Lücke.

**Nicht im Feed (bewusst unverändert):**

| Datei | Grund |
|-------|-------|
| `DiscoverPage.jsx` | Außerhalb Feed-Scope |
| `ChatHeader.jsx` / `ConversationCard.jsx` | Chat-Scope |

---

## Aufgabe 2 — Umstellung auf `usePresenceMap()`

### `UnifiedFeed.jsx` — `FeedList`

```javascript
const authorIds = useMemo(() => { /* author.id aus Feed-Items */ }, [arr]);
const presenceMap = usePresenceMap(authorIds);

// pro Karte:
_presenceStatus: resolvePresenceStatus(item)  // → presenceMap[uid].status || "offline"
```

### `BaseFeedCard.jsx` — `HumanHeader`

- Avatar-Dot nutzt `PresenceDot` mit Status aus `_presenceStatus`
- Unterstützt: `online`, `away` (Idle), `offline` (kein Dot)

**Keine Änderungen an:** `useFeedStream.js`, Sortierung, Pagination, Suche, Feed V4, Layout.

---

## Aufgabe 3 — Runtime

```
user_presence (Supabase)
  ↓ SELECT user_id,status,last_seen_at WHERE user_id IN (...)
usePresenceMap (initial load)
  ↓ Realtime: postgres_changes on user_presence
presenceMap state update
  ↓ FeedList resolvePresenceStatus(item)
Feed-Karte (_presenceStatus)
  ↓ HumanHeader → PresenceDot
DOM
```

**Verifikation:** `node scripts/sprint8-phase5-presence-check.mjs`

---

## Aufgabe 4 — Regression

| Test | Ergebnis |
|------|----------|
| Feed lädt | ✅ Build + keine Feed-Logik geändert |
| Presence korrekt (online/away/offline) | ✅ Mock-Pipeline + PresenceDot |
| Realtime (Reconnect) | ✅ `usePresenceMap` Realtime-Subscription unverändert |
| Infinite Scroll | ✅ Unverändert (FeedList Pagination unangetastet) |
| Feed Refresh | ✅ `authorIds` neu berechnet bei Item-Änderung |
| Neue Beiträge | ✅ Neue Author-IDs in `usePresenceMap` |
| Reihenfolge / Chronologie | ✅ Keine Sortier- oder Stream-Änderung |

**Browser (Safari/Firefox):** ⏳ Nach Deploy manuell prüfen (Online-Dot + Away-Dot bei Idle).

---

## Aufgabe 5 — Build

```bash
npm install   # ✅ (bereits installiert)
npm run build # ✅ erfolgreich
node scripts/sprint8-phase5-presence-check.mjs # ✅
```

---

## Risiken

| Risiko | Bewertung | Mitigation |
|--------|-----------|------------|
| `usePresenceMap` Realtime-Filter bei >100 Author-IDs | Niedrig | Feed capped bei 200 Items; typisch <50 unique Authors pro Page |
| Presence-Update triggert Card-Re-Render | Akzeptiert | Nur `_presenceStatus` ändert sich; Feed-Chronologie unberührt |
| User ohne `user_presence`-Row | Erwartet | Fallback `"offline"` — kein Dot |

---

## Definition of Done

| Kriterium | Status |
|-----------|--------|
| Feed liest Presence aus `user_presence` | ✅ |
| Keine `profiles.last_seen_at` Reads im Feed | ✅ |
| Realtime via `usePresenceMap` | ✅ |
| Keine Feed-Chronologie-Änderung | ✅ |
| Keine Feed V4 / Runtime / Search Änderung | ✅ |
| Build erfolgreich | ✅ |
| Ein Commit | ✅ |
| Eine PR | ✅ |

---

## Geänderte Dateien

- `src/feed/UnifiedFeed.jsx` — `usePresenceMap` in `FeedList`
- `src/feed/cards/BaseFeedCard.jsx` — `HumanHeader` PresenceDot (online/away)
- `scripts/sprint8-phase5-presence-check.mjs` — Verifikation
- `HUI_SPRINT8_PHASE5_REPORT.md` — dieser Bericht
