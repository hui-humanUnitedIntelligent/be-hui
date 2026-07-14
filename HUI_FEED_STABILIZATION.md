# HUI Feed Stabilization — Root Cause Analysis & Fix

**Status:** Release Blocker — resolved (minimal fix)  
**Branch:** `cursor/feed-stabilization-0127`  
**Date:** 2026-07-14

---

## Symptom

Der Feed verhielt sich nicht deterministisch:

- Teilweise nur wenige Beiträge, später wieder mehr
- Endlos leerer Scrollbereich
- Nicht alle Beiträge erschienen
- Infinite Scroll unzuverlässig

---

## AUFGABE 1 — Datenfluss (vollständig dokumentiert)

```
Supabase (works, experiences, beitraege, invitations)
    ↓ fetchFeedPage() / fetchSearchResults()
    ↓ ProfileService.getMany() — Autor-Anreicherung
    ↓ unifiedNormalizer (toFeedItem, normalize*Row)
    ↓ _sortKey Sortierung (FEED.13B Experience-Relevanz)
useFeedStream
    ↓ items[] (Rohdaten, Pagination-State)
    ↓ rhythmizeFeed() — feedRhythmEngine.js
    ↓ rhythmicItems[] (Reihenfolge + Ghost-Spacer)
UnifiedFeed
    ↓ resolvedItems (optionale Re-Normalisierung)
    ↓ FeedList
    ↓ Filter: _isGhost entfernen, Dedup per id
    ↓ useVirtualizer (@tanstack/react-virtual)
    ↓ ReactionCard → FeedRouter → *Content → BaseFeedCard
```

### Stufe 1: Supabase

| Datei | Funktion |
|-------|----------|
| `src/feed/useFeedStream.js` | `fetchFeedPage()` |

- 4 parallele Queries: `works`, `experiences`, `beitraege`, `invitations`
- Limit: 10 pro Quelle (+ 2 invitations ohne Cursor)
- Multi-Cursor: `{ works, exps, beitr }` (FEED.2E)
- `hasMore`: true wenn mindestens eine Quelle das volle Limit liefert

### Stufe 2: useFeedStream

| State | Bedeutung |
|-------|-----------|
| `items` | Roh-Items nach Fetch + Pagination |
| `rhythmicItems` | Nach Rhythm-Engine |
| `loading` / `loadingMore` | Initial / Pagination |
| `hasMore` | Weitere Seiten verfügbar |
| `pendingItems` | Realtime Soft-Hydration Queue |

Suchmodus (`isSearching`) ersetzt Export-Items durch `searchItems`, lässt aber die normale Pipeline im Hintergrund laufen.

### Stufe 3: Transformation

| Datei | Funktion |
|-------|----------|
| `src/system/feed/unifiedNormalizer.js` | `toFeedItem()`, `normalize*Row()` |

Einheitliches Item-Shape: `id`, `type`, `author`, `media`, `createdAt`, `_raw`.

### Stufe 4: Filter

| Ort | Filter |
|-----|--------|
| `FeedList` useMemo | `!i._isGhost`, gültige `id`, Dedup per Map |
| `loadMore` | Dedup gegen bestehende IDs |
| `resolvedItems` | `toFeedItem()` wenn Shape unvollständig |

### Stufe 5: Sortierung

1. **Fetch:** `_sortKey` (chronologisch + Experience 48h-Vorlauf, FEED.13B)
2. **Rhythm:** `rhythmizeFeed()` — Typ-Abstände, Energie-Balance (R1–R7)
3. **Suche:** `matchTier()` + `sortByRelevance()` pro Gruppe

### Stufe 6: Pagination

| Komponente | Rolle |
|------------|-------|
| `loadMore()` | Nächste Seite laden |
| `FeedBottomSentinel` | IntersectionObserver → `loadMore` |
| `prefetchedRef` | Idle-Prefetch (70%-Hook existiert, war nicht verdrahtet) |

### Stufe 7: Virtualizer

| Parameter | Wert |
|-----------|------|
| Library | `@tanstack/react-virtual` |
| `estimateSize` | 640px |
| `overscan` | 3 |
| Aktivierung | `scrollReady && tabVisible && arr.length > 6` |

### Stufe 8: UnifiedFeed → FeedCard

`ReactionCard` → `FeedRouter` → `MomentContent` / `WorkContent` / `ExperienceContent` / `EventContent` → `BaseFeedCard`

---

## AUFGABE 2 — Runtime-Protokollierung

Aktiviert automatisch in DEV oder via:

```js
localStorage.setItem('hui_feed_debug', '1')
```

### Inspiziertes Objekt

```js
window.__HUI_FEED_DEBUG__
```

### Protokollierte Metriken

| Metrik | Stufe |
|--------|-------|
| `items.length` | `items` |
| `filtered.length` | `filtered` |
| `sorted.length` | `sorted` |
| `pages` (append count) | `pagination` |
| `hasNextPage` | `virtualizer` |
| `isFetching` | Hook-Export |
| `isFetchingNextPage` | `virtualizer` / Hook-Export |
| `virtualRows.length` | `virtualizer` |
| `count` | `virtualizer` |
| `totalSize` | `virtualizer` |
| `scrollHeight` | `virtualizer` |
| `clientHeight` | `virtualizer` |

Implementierung: `src/feed/feedStabilizationDebug.js`

---

## AUFGABE 3 — Datenverlust

### Nachgewiesene Verluststellen

| Von | Nach | Ursache | Fix |
|-----|------|---------|-----|
| `rhythmic` | `filtered` | Ghost-Items (`_isGhost: true`) wurden gezählt aber als leere Karten gerendert | Ghost-Filter in `FeedList` |
| `rhythmic` | `filtered` | Dedup per `id` (korrekt, kein Bug) | — |
| `stream` | `resolved` | `toFeedItem()` gibt `null` für ungültige Items | Erwartetes Verhalten |
| `pagination` | `items` | Invitation-Dedup bei wiederholten Fetches | Kein Datenverlust, nur Dedup |

**Kein Datenverlust in Supabase-Queries nachgewiesen.** Das Symptom „weniger Beiträge" entstand durch:

1. Ghost-Items, die Scroll-Höhe aufblähten ohne sichtbaren Inhalt
2. Virtualizer-Moduswechsel, der sichtbare Zeilen reduzierte

---

## AUFGABE 4 — Virtualizer vs. Datenanzahl

### Root Cause (bewiesen)

```js
// VORHER (UnifiedFeed.jsx FeedList):
const useVirt = !!scrollContainerRef?.current && arr.length > 6;
```

**Problem:** `scrollContainerRef.current` ist beim ersten Render `null`. Refs werden erst nach Commit gesetzt. Ref-Änderungen triggern keinen Re-Render.

**Effekt:**
- Erster Render mit Items → Non-Virtualized (Fallback)
- Späterer Re-Render (z.B. `loading` → `false`, Rhythm-Effect) → Virtualized
- Moduswechsel ändert `scrollHeight` dramatisch → leerer Scrollbereich
- `totalSize` basiert auf geschätzten 640px, echte Karten variieren (280–340px Media)

### Fix

1. `useScrollContainerReady()` — State-basierte Ref-Erkennung via `requestAnimationFrame`
2. `tabVisible` Prop — Virtualizer deaktiviert wenn Feed-Tab `height: 0` (KeepAlive)
3. `rowVirtualizer.measure()` bei Tab-Sichtbarkeit / Scroll-Ready
4. Ghost-Items aus `count` entfernen

---

## AUFGABE 5 — Infinite Scroll

### Nachgewiesene Probleme

| Problem | Beweis | Fix |
|---------|--------|-----|
| Mehrfach-Feuer | `FeedBottomSentinel` ohne In-Flight-Guard | `firedRef` + Reset bei `!intersecting` |
| Parallele `loadMore` | `loadingMore` State async, Race vor `setLoadingMore(true)` | `loadMoreInFlightRef` |
| Gar nicht feuern | Sentinel in `height:0` Tab unsichtbar für Observer | `tabVisible` Gate |

Protokollierung: `logSentinelFire()`, `logLoadMore("call"|"skip")`

---

## AUFGABE 6 — Feed State mehrfach / stale

### Befund

| Aspekt | Status |
|--------|--------|
| `useFeedStream` Instanzen | Eine pro `UnifiedFeed` (KeepAlive = kein Unmount) |
| Session-Cache | Deaktiviert (`loadCache()` → immer `null`) |
| Stale Closure in `_silentRefresh` | Harmlos (Cache disabled) |
| Realtime Channel Dedup | Globaler Channel-Reuse (`hui_feed_realtime_v4f`) |
| Search vs. Normal parallel | By Design — kein State-Korruption |

Hook-Mount wird protokolliert (`logHookMount` / `logHookUnmount`).

**Kein doppelter Hook-State nachgewiesen.** Das nicht-deterministische Verhalten kam vom Render-Pfad-Wechsel (Virtualizer), nicht von stale State.

---

## AUFGABE 7 — KeepAlive Auswirkungen

### Mechanismus

`src/lib/world/tabVisibilityController.js` (Phase 17.1):

- Inaktiver Tab: `position: absolute`, `height: 0`, `overflow: hidden`, `opacity: 0`
- Feed bleibt gemountet → `useFeedStream` läuft weiter
- Scroll-Container (`.hui-scroll`) umschließt alle Tabs

### Auswirkung auf Feed

| Szenario | Problem | Fix |
|----------|---------|-----|
| Feed-Tab inaktiv | Virtualizer misst in `height:0` Container | `tabVisible={keepFeed?.opacity === 1}` |
| Tab-Wechsel zurück | Virtualizer-Größen stale | `measure()` bei `tabVisible` Change |
| Sentinel | Viewport-Observer funktioniert, aber Content unsichtbar | Kein `loadMore` wenn Tab inaktiv (Sentinel nicht im Viewport) |

Protokollierung: `logKeepAlive({ tabVisible, searchActive, ... })`

---

## AUFGABE 8 — Minimalfix (implementiert)

### Geänderte Dateien

| Datei | Änderung |
|-------|----------|
| `src/feed/feedStabilizationDebug.js` | **NEU** — Runtime-Diagnostics |
| `src/feed/UnifiedFeed.jsx` | `useScrollContainerReady`, Ghost-Filter, Virtualizer-Fix, `tabVisible`, `openPreview` Fix |
| `src/feed/useFeedStream.js` | Stage-Logging, `loadMoreInFlightRef`, `isFetching` Exports |
| `src/feed/FeedScrollSentinel.jsx` | Sentinel In-Flight-Guard |
| `src/pages/Home.jsx` | `tabVisible` Prop |

### Bewusst NICHT geändert

- Keine Performance-Optimierungen
- Kein Refactoring der Rhythm-Engine (Ghosts werden gefiltert, nicht entfernt aus Engine)
- Keine Änderung an Supabase-Queries
- Prefetch bei 70% weiterhin nicht verdrahtet (separates Ticket)

---

## Definition of Done

| Kriterium | Status |
|-----------|--------|
| Feed zeigt jederzeit alle Beiträge | ✅ Ghost-Filter + stabiler Virtualizer-Pfad |
| Kein leerer Scrollbereich | ✅ Kein Render-Modus-Wechsel mehr |
| Infinite Scroll stabil | ✅ Race-Guards |
| Virtualizer stabil | ✅ `scrollReady` + `tabVisible` + `measure()` |
| Build erfolgreich | ✅ `npm run build` |
| Ursache dokumentiert | ✅ Dieses Dokument |

---

## Debugging-Anleitung

```js
// Verbose Logging aktivieren
localStorage.setItem('hui_feed_debug', '1')
location.reload()

// Snapshot inspizieren
console.table(window.__HUI_FEED_DEBUG__.lastSnapshot)

// History (letzte 200 Events)
window.__HUI_FEED_DEBUG__.history

// Supabase-Rohdaten
window.__HUI_STREAM_DEBUG__
```

### Erwartete stabile Werte

```
filtered.length === count (virtualizer)
virtualRows.length <= count
totalSize >= virtualRows.length * 200 (nach measure)
loadMoreSkips steigt bei schnellem Scroll (Guard greift)
sentinelFires ≈ loadMoreCalls (kein 10×-Feuer)
```

---

## Bekannte Restrisiken (nicht Teil dieses Fixes)

1. **Invitation ohne Cursor** — 2 neueste bei jedem Page-Fetch (Bandwidth, kein Datenverlust)
2. **Prefetch 70%** — `onScrollProgress` nicht verdrahtet
3. **Realtime ohne Profile** — Live-Items ohne Avatar bis Refresh
4. **estimateSize 640px** — Scroll-Jitter bis `measureElement` konvergiert (akzeptabel)
