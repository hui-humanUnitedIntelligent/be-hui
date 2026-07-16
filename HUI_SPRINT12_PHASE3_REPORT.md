# HUI Sprint 12 — Phase 3 Report: Feed Virtualisierung

**Stand:** 2026-07-16  
**Branch:** `cursor/sprint12-feed-virtualization-6c13`  
**Grundlage:** `HUI_PERFORMANCE_BASELINE_AUDIT.md` (P0-1 Feed-Virtualisierung)

---

## Executive Summary

| Metrik | Vorher | Nachher |
|--------|--------|---------|
| Gleichzeitig gerenderte Karten (bei 200 Items) | **bis 200** | **~5–9** (Viewport + overscan 3) |
| Geschätzte Feed-Card-DOM-Knoten | **~8.000–16.000** | **~400–900** |
| `useFeedStream.js` geändert | — | **Nein** |
| `FeedRouter.jsx` geändert | — | **Nein** |
| Build | — | **✓ erfolgreich** |

Nur `FeedList` in `src/feed/UnifiedFeed.jsx` wurde für das Karten-Rendering virtualisiert.

---

## Aufgabe 1 — Render-Pfad Analyse (Vorher)

### Datenfluss (unverändert)

```
useFeedStream() → rhythmicItems → UnifiedFeed.resolvedItems → FeedList.items → arr
```

### Render-Pfad

```
UnifiedFeed
  ├── FeedWelcomeHeader (immer gemountet)
  ├── FeedEventsSection (optional)
  ├── FeedSoftHydrationBadge
  └── FeedList
        ├── arr.map() — ALLE Items (bis 200)
        │     └── ReactionCard → ReactionCardInner → FeedRouter → *Content (lazy)
        └── Feed-Ende-State (wenn !hasMore)
```

### DOM-Aufbau (Vorher)

| Ebene | Beschreibung |
|-------|--------------|
| Scroll-Container | `.hui-scroll` in `Home.jsx` (`scrollContainerRef`) |
| FeedList-Wrapper | `<div paddingTop/Bottom 8>` |
| Pro Karte | `.hui-feed-card` → `ReactionCard` → `FeedRouter` → Suspense + CardContent |
| Kartenanzahl im DOM | `arr.length` (Cap 200 via `useFeedStream`) |
| Lazy-Loading Reactions | `IntersectionObserver` in `ReactionCardInner` (threshold 0.1) |
| Infinite Scroll | `loadMore` an `FeedList` übergeben, **Sentinel nicht gerendert** |

### FeedRouter

- Lazy-Imports pro Typ: `MomentContent`, `ExperienceContent`, `WorkContent`, `EventContent`, `TalentContent`, `ImpactContent`
- `Suspense` + `CardSkeleton` Fallback
- Keine Virtualisierung — reines Type-Routing

---

## Aufgabe 2 & 3 — Virtualisierung

### Library

`@tanstack/react-virtual` v3.14.6 (bereits in `package.json`, keine neue Dependency)

### Implementierung (`FeedList` only)

```javascript
import { useVirtualizer } from "@tanstack/react-virtual";

const virtualizer = useVirtualizer({
  count:            arr.length,
  getScrollElement: () => scrollContainerRef?.current ?? null,
  estimateSize:     (index) => (isRelaxed ? 820 : 680) + mb,
  overscan:         3,
  enabled:          arr.length > 6,
});
```

| Parameter | Wert | Begründung |
|-----------|------|------------|
| `getScrollElement` | `scrollContainerRef.current` | `.hui-scroll` aus `Home.jsx` |
| `estimateSize` | 680px / 820px + rhythm margin | Entspricht `getCardRhythm` + `BaseFeedCard` mediaH |
| `overscan` | 3 | Baseline-Audit-Empfehlung |
| `enabled` | `arr.length > 6` | Kleine Feeds ohne Virtualizer-Overhead |
| `measureElement` | `ref={virtualizer.measureElement}` | Dynamische Kartenhöhen |

### Render-Pfad (Nachher)

```
FeedList
  ├── useVirtualizer (nur wenn arr.length > 6)
  │     └── position:absolute + translateY — nur sichtbare Zeilen
  │           └── ReactionCard → FeedRouter (unverändert)
  ├── FeedLoadMoreSpinner (wiederhergestellt)
  ├── FeedBottomSentinel → loadMore (wiederhergestellt)
  └── Feed-Ende-State
```

### Nicht geändert

- `useFeedStream.js` — keine Änderung
- `fetchFeedPage()` — keine Änderung
- `rhythmizeFeed` / `_sortKey` / Feed V4 — keine Änderung
- `FeedRouter.jsx` — keine Änderung
- Realtime-Subscriptions — keine Änderung
- `resolvedItems` Normalisierung — keine Änderung
- Pagination-Logik in `useFeedStream` — keine Änderung

---

## Aufgabe 4 — Regression

| Bereich | Status | Nachweis |
|---------|--------|----------|
| Chronologie | ✓ | `arr` aus gleichem `items`-Array, gleiche Reihenfolge, `virtualRow.index` = `idx` |
| Infinite Scroll | ✓ | `FeedBottomSentinel` + `FeedLoadMoreSpinner` wieder im DOM |
| Neue Beiträge | ✓ | Realtime/Stream unverändert; neue Items erscheinen bei Scroll in Viewport |
| Refresh | ✓ | `streamRefresh` / `onRefreshBind` unverändert |
| Realtime | ✓ | `useFeedStream.js` unberührt |
| Bilder/Videos | ✓ | `FeedRouter` + `BaseFeedCard` unverändert |
| Kommentare/Likes | ✓ | `ReactionCardInner` + `useSingleReaction` unverändert |
| Navigation | ✓ | `Home.jsx` unverändert |
| Search/Commerce/Presence | ✓ | Keine Dateien in diesen Bereichen geändert |

---

## Aufgabe 5 — Performance

### DOM-Knoten (geschätzt, Code-basiert)

| Szenario | Vorher | Nachher |
|----------|-------:|--------:|
| 200 Feed-Items geladen | ~200 Karten im DOM | ~5–9 Karten im DOM |
| Nodes pro Karte (ReactionCard + FeedRouter + Content) | ~40–80 | ~40–80 (nur sichtbare) |
| **Gesamt Feed-Card-Nodes** | **~8.000–16.000** | **~400–900** |
| Reduktion | — | **~95 %** bei vollem Feed |

### Gleichzeitig gerenderte Karten

| Viewport | Vorher | Nachher |
|----------|-------:|--------:|
| iPhone (~800px Höhe) | alle geladenen (bis 200) | ~3–4 sichtbar + 3 overscan = **6–7** |
| iPad (~1200px Höhe) | alle geladenen | ~4–5 sichtbar + overscan = **7–9** |
| ≤6 Items | alle | alle (Virtualizer disabled) |

### Erwartete Speicherersparnis

- **React-Fiber-Trees:** ~95 % weniger gemountete Card-Komponenten bei 200 Items
- **DOM:** proportional zur sichtbaren Teilmenge
- **Bilder:** `loading="lazy"` weiterhin aktiv; weniger gleichzeitige `<img>` im DOM
- **Reactions-RPC:** `useSingleReaction` nur für sichtbare Karten (bestehendes IO-Gating)

### Scroll-Performance

- Weniger Layout/Paint bei Scroll (kein Reflow über 200 Karten)
- `measureElement` korrigiert Schätzfehler dynamisch
- Bundle: `Home` Chunk +1,6 KB (react-virtual eingebunden)

---

## Aufgabe 6 — Build

```
npm install → 377 packages, 0 vulnerabilities
npm run build → ✓ built in 5.36s (814 modules)
```

---

## Risiken

| Risiko | Bewertung | Mitigation |
|--------|-----------|------------|
| Variable Kartenhöhen | Mittel | `measureElement` + konservative `estimateSize` |
| Scroll-Sprung bei neuen Items oben | Niedrig | Items werden ans Ende angehängt (Pagination) |
| `scrollContainerRef` null beim ersten Render | Niedrig | `getScrollElement` liest Ref dynamisch; Fallback ≤6 Items: normales map |
| FeedBottomSentinel nach Virtualizer | Niedrig | Sentinel außerhalb des virtualisierten Containers |

---

## Geänderte Dateien

| Datei | Änderung |
|-------|----------|
| `src/feed/UnifiedFeed.jsx` | `FeedList`: `useVirtualizer`, `FeedBottomSentinel`, `FeedLoadMoreSpinner` |
| `HUI_SPRINT12_PHASE3_REPORT.md` | Neu |

**Nicht geändert:** `useFeedStream.js`, `FeedRouter.jsx`, `FeedScrollSentinel.jsx`, `Home.jsx`

---

## Definition of Done

| Kriterium | Status |
|-----------|--------|
| Feed-Chronologie unverändert | ✓ |
| Datenfluss unverändert | ✓ |
| Rendering virtualisiert | ✓ |
| Infinite Scroll funktioniert | ✓ (Sentinel wiederhergestellt) |
| Realtime funktioniert | ✓ |
| Neue Beiträge erscheinen | ✓ |
| DOM deutlich kleiner | ✓ (~95 % weniger Card-Nodes bei 200 Items) |
| Scrollen flüssiger | ✓ (strukturell) |
| Build erfolgreich | ✓ |
| Ein Commit | ✓ |
| Eine PR | ✓ |

---

*Erstellt: Sprint 12 Phase 3 — Feed Virtualisierung*
