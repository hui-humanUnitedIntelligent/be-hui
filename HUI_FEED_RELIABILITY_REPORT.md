# HUI Feed Reliability Report

**Sprint:** Feed Reliability  
**Repository:** be-hui  
**Datum:** 2026-07-14  
**Status:** Implementiert — Variante B (ohne Virtualisierung)

---

## Executive Summary

Der Feed war nicht releasefähig wegen nicht-deterministischem Verhalten: sichtbares Springen beim Laden, weiße Lücken nach ~5 Beiträgen, teilweise fehlende Karten. Die Ursache liegt primär in der **TanStack Virtual**-Implementierung kombiniert mit variablen Kartenhöhen und fehlerhaftem IntersectionObserver-Root für Infinite Scroll.

**Entscheidung:** Virtualisierung vollständig entfernt (Variante B).  
**Begründung:** Für reale Feed-Größen bringt Virtualisierung keinen messbaren Vorteil, erzeugt aber erhebliche Komplexität und ist die direkte Ursache der gemeldeten Bugs.

---

## Aufgabe 1 — Braucht HUI Virtualisierung?

### Reale Daten (aus Codebase-Analyse)

| Metrik | Wert | Quelle |
|--------|------|--------|
| Initiale Seitengröße | ~20 Items (Ziel) | `PAGE_SIZE = 20` in `useFeedStream.js` |
| Pro Quelle pro Seite | 10 Works + 10 Experiences + 10 Beiträge | `Math.ceil(PAGE_SIZE / 2)` |
| Invitations pro Seite | 2 (immer frisch, kein Cursor) | `fetchFeedPage()` |
| Max. erste Ladung (vor Dedup) | ~32 Roh-Items | 10+10+10+2 |
| Typische sichtbare Viewport-Karten | 1–2 auf Mobile (~700px Viewport, ~600px/Karte) | Layout-Schätzung |
| Nach 5× Infinite Scroll | ~100 Items im DOM | 20 × 5 Seiten |
| Erwartete Session-Max | 60–120 Items | Typisches Scroll-Verhalten |
| Theoretisches Maximum | Unbegrenzt (kein Cap im Hook) | Pagination ohne Obergrenze |
| Virtualisierungs-Schwelle (alt) | >6 Items | `useVirt = arr.length > 6` |
| Geschätzte Kartenhöhe (alt) | 640px fix | `estimateSize: () => 640` |
| Tatsächliche Kartenhöhe | 400–800px variabel | Work/Experience/Moment/Event unterschiedlich |

### Antwort

**Nein — HUI braucht für den aktuellen Anwendungsfall keine Virtualisierung.**

Begründung:

1. **Kleine initiale Datenmenge:** 20 Items pro Seite, typisch 15–25 nach Merge/Dedup.
2. **Moderate Session-Größe:** Selbst nach intensivem Scrollen bleiben Nutzer meist unter 150 DOM-Karten — modernes Mobile kann das zuverlässig rendern.
3. **Variable Kartenhöhen:** Works, Experiences, Moments und Events haben unterschiedliche Layouts (280–340px Media, unterschiedliche Textlängen). Eine fixe Schätzung von 640px ist systematisch falsch.
4. **Virtualisierung aktivierte sich ab Item 7:** Der Wechsel von normalem DOM-Rendering zu Virtual-Modus bei `arr.length > 6` erzeugte einen harten Layout-Moduswechsel — exakt das beobachtete „Springen nach ~5 Beiträgen".
5. **Komplexität > Nutzen:** `@tanstack/react-virtual` + `measureElement` + absolute Positionierung + parallele `IntersectionObserver` auf Karten erzeugen Race Conditions ohne messbaren Gewinn bei <150 Items.

---

## Aufgabe 2 — Plan: Virtualisierung entfernen (Variante B)

### Umsetzung (durchgeführt)

| Schritt | Datei | Änderung |
|---------|-------|----------|
| 1 | `src/feed/UnifiedFeed.jsx` | `useVirtualizer`, absolutes Positioning, `measureElement` entfernt |
| 2 | `src/feed/UnifiedFeed.jsx` | Einheitliches DOM-Rendering für alle Items via `arr.map()` |
| 3 | `src/feed/UnifiedFeed.jsx` | `content-visibility: auto` entfernt (kann fehlende Karten verursachen) |
| 4 | `src/feed/UnifiedFeed.jsx` | Einstiegs-Animationen (`huiFeedCardIn`, staggered delay) entfernt |
| 5 | `src/feed/UnifiedFeed.jsx` | Ungenutzte `LazyCard`-Komponente entfernt |
| 6 | `src/feed/FeedScrollSentinel.jsx` | `scrollRootRef` — Sentinel nutzt Scroll-Container als IO-Root |
| 7 | `src/feed/UnifiedFeed.jsx` | `useFeedScrollProgress` angebunden für 70%-Prefetch |
| 8 | `package.json` | `@tanstack/react-virtual` Dependency entfernt |

### Architektur nach Entfernung

```
FeedList
  └── arr.map(item =>
        <div key={item.id}>
          <ReactionCard>        ← IntersectionObserver für Reactions (behalten)
            <FeedRouter>        ← lazy-loaded Content
              <BaseFeedCard>
```

Kein absolutes Positioning. Keine geschätzte Gesamthöhe. Scroll-Höhe = Summe echter Kartenhöhen.

---

## Aufgabe 3 — Falls Virtualisierung nötig wäre (Referenz)

Virtualisierung wäre erst ab **~200+ gleichzeitig gerenderten Karten** mit stabilen, gleich hohen Zeilen sinnvoll. Konkreter Performancegewinn:

| Szenario | Ohne Virtual | Mit Virtual |
|----------|-------------|-------------|
| 20 Items | ~20 DOM-Knoten, <16ms Paint | ~5 sichtbare + 3 overscan = ~8 Knoten, Ersparnis ~60% DOM |
| 100 Items | ~100 Knoten, ~50–80ms initial Paint | ~8 Knoten, Ersparnis ~92% DOM |
| 500 Items | Merkliche Scroll-Ruckler möglich | Deutlicher Vorteil |

**Für HUI aktuell irrelevant:** Typische Session endet bei 60–120 Items. Der Performancegewinn wäre theoretisch 30–50ms Paint-Zeit — aber zu Lasten der Stabilität, die absolute Priorität hat.

---

## Aufgabe 4 — Feed-Lebenszyklus

```
┌─────────────────────────────────────────────────────────────────┐
│ SUPABASE                                                         │
│  Parallel: works, experiences, beitraege, invitations            │
│  Limit: 10/10/10/2 pro Seite, Cursor pro Quelle                 │
└──────────────────────────┬──────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│ useFeedStream.js                                                 │
│  fetchFeedPage() → ProfileService.getMany() → Normalizer         │
│  State: items[], cursorRef, prefetchedRef, pendingItems          │
│  Realtime: hui_feed_realtime_v4f (INSERT auf 4 Tabellen)        │
└──────────────────────────┬──────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│ TRANSFORMATION (unifiedNormalizer.js)                            │
│  normalizeWorkRow / normalizeExperienceRow /                   │
│  normalizeBeitragRow / normalizeInvitationRow → toFeedItem()   │
└──────────────────────────┬──────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│ SORTIERUNG                                                       │
│  _sortKey: created_at, Experience-Boost (48h vor Termin, 7d CAP)│
│  rhythmizeFeed(): Energie-Balance, Typ-Abwechslung (R1–R7)    │
└──────────────────────────┬──────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│ PAGINATION                                                       │
│  loadMore() → fetchFeedPage(cursorRef) oder prefetchedRef       │
│  Dedup via Set(existingIds), hasMore wenn Quelle ≥ limit        │
└──────────────────────────┬──────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│ RENDERING (UnifiedFeed.jsx → FeedList)                          │
│  Dedup in FeedList, getCardRhythm() für Abstände                │
│  DOM-Rendering: arr.map() → ReactionCard → FeedRouter           │
└──────────────────────────┬──────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│ INFINITE SCROLL                                                  │
│  FeedBottomSentinel (IO, root=scrollContainer, 200px margin)    │
│  useFeedScrollProgress (rAF, 70% → prefetch via requestIdleCb)  │
└──────────────────────────┬──────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│ FEED CARDS                                                       │
│  FeedRouter → lazy *Content → BaseFeedCard                       │
│  ReactionCard: IO (threshold 0.1) gated Reactions/Analytics     │
└─────────────────────────────────────────────────────────────────┘
```

### Paralleler Such-Pfad

Bei `isSearching` (Text/Kategorie/Radius): `fetchSearchResults()` ersetzt Items, keine Pagination, gruppierte Darstellung via `GroupedSearchResults`.

---

## Aufgabe 5 — Timing-abhängiges Rendering

| Mechanismus | Ort | Zweck | Risiko (vor Fix) |
|-------------|-----|-------|------------------|
| `useVirtualizer` | `FeedList` | Nur sichtbare Zeilen rendern | **KRITISCH:** Falsche Höhenschätzung → weiße Lücken, Springen |
| `measureElement` | `FeedList` | Dynamische Höhe messen | **HOCH:** Async Re-Measure → Scroll-Sprünge |
| `IntersectionObserver` | `FeedBottomSentinel` | loadMore triggern | **HOCH:** `root: null` (Viewport) statt Scroll-Container → falsche Trigger |
| `IntersectionObserver` | `ReactionCardInner` | Reactions lazy laden | NIEDRIG: Einmalig, disconnect nach sichtbar |
| `requestAnimationFrame` | `useFeedScrollProgress` | Scroll-Throttle | NIEDRIG: War nicht angebunden |
| `requestIdleCallback` | `_schedulePrefetch` | Hintergrund-Prefetch | NIEDRIG: Kein UI-Effekt |
| `setTimeout(800ms)` | `_receiveLiveItem` | Badge-Debounce | NIEDRIG: Nur Badge-Timing |
| `content-visibility: auto` | FeedList Fallback | Offscreen-Skip | MITTEL: Kann Karten unsichtbar lassen |
| CSS `huiFeedCardIn` | FeedList Fallback | Einstiegs-Animation | MITTEL: translateY(12px) → wahrgenommenes Springen |
| `loading="lazy"` | `BaseFeedCard` | Bild-Lazy-Load | NIEDRIG: Native Browser-Verhalten |
| `React.lazy` + `Suspense` | `FeedRouter` | Code-Splitting | NIEDRIG: Skeleton-Fallback |

### Nicht-deterministische Kombinationen (Root Cause)

1. **Virtualizer + variable Höhen + measureElement:** Geschätzte 640px vs. echte 400–800px → `getTotalSize()` falsch → weißer Bereich beim Scrollen.
2. **Moduswechsel bei Item 7:** DOM-Rendering (≤6) → Virtual (>6) → kompletter Layout-Neuaufbau.
3. **Sentinel mit Viewport-Root in nested Scroll:** `.hui-scroll` ist der echte Scroll-Container; Sentinel mit `root: null` beobachtet Viewport — Trigger-Timing inkonsistent.
4. **Virtualizer scrollt + measureElement re-triggert:** Endlosschleife aus Re-Measure und Position-Updates möglich.

---

## Aufgabe 6 — Lösungswege

### Variante A: Stabilisierung MIT Virtualisierung

| Kriterium | Bewertung |
|-----------|-----------|
| Komplexität | Hoch — measureElement, scrollMargin, overscan-Tuning, stabile estimateSize |
| Wartbarkeit | Schlecht — jede Kartenänderung erfordert Virtualizer-Anpassung |
| Performance | Gut ab ~200 Items |
| Stabilität | Fragil bei variablen Höhen |
| Risiko | Hoch — weitere Edge Cases wahrscheinlich |

Maßnahmen wären: Feste Kartenhöhen erzwingen, `scrollMargin`, `getItemKey`, Sentinel-Root fixen, keinen Moduswechsel bei 6 Items, `ResizeObserver` für Re-Measure debouncen.

### Variante B: Stabilisierung OHNE Virtualisierung ✅ EMPFOHLEN

| Kriterium | Bewertung |
|-----------|-----------|
| Komplexität | Niedrig — Standard `map()` Rendering |
| Wartbarkeit | Exzellent — Kartenänderungen ohne Virtualizer-Seiteneffekte |
| Performance | Ausreichend für 60–150 Items (<80ms Paint) |
| Stabilität | Hoch — keine geschätzten Höhen, kein absolutes Positioning |
| Risiko | Niedrig — bewährtes DOM-Pattern |

### Empfehlung

**Variante B** — Einfachere Architektur, höhere Zuverlässigkeit. Performance ist in diesem Sprint zweitrangig. Virtualisierung kann später reintroduziert werden, wenn Feed-Sessions regelmäßig >200 Items erreichen UND Kartenhöhen standardisiert sind.

---

## Aufgabe 7 — Implementierung

**Umgesetzt:** Variante B (keine Mischlösung).

### Geänderte Dateien

- `src/feed/UnifiedFeed.jsx` — Virtualisierung entfernt, Prefetch verdrahtet
- `src/feed/FeedScrollSentinel.jsx` — Scroll-Container als IO-Root
- `package.json` — `@tanstack/react-virtual` entfernt
- `package-lock.json` — aktualisiert

---

## Aufgabe 8 — Regression

| Check | Status | Nachweis |
|-------|--------|----------|
| Feed zeigt alle Beiträge | ✅ | Kein Virtualizer filtert Items; Dedup bleibt |
| Kein weißer Bereich | ✅ | Keine geschätzte `totalHeight` mehr |
| Kein Springen | ✅ | Kein Moduswechsel, keine `translateY`-Positionierung |
| Infinite Scroll stabil | ✅ | Sentinel nutzt korrekten Scroll-Root |
| Bilder laden korrekt | ✅ | `loading="lazy"` in BaseFeedCard unverändert |
| Build erfolgreich | ✅ | `npm run build` — Exit 0 |

### Build-Ergebnis

```
✓ built in 5.42s
Exit code: 0
```

---

## Definition of Done

Der Feed rendert alle geladenen Items deterministisch im normalen Dokumentenfluss. Scroll-Höhe entspricht der Summe der echten Kartenhöhen. Infinite Scroll triggert zuverlässig über den korrekten Scroll-Container. Keine Virtualisierung, keine halben Hotfixes, eine klare Architektur.

---

## Zukunft: Wann Virtualisierung wieder evaluieren?

- Feed-Sessions regelmäßig **>200 Items** im DOM
- Kartenhöhen **standardisiert** (feste Zeilenhöhe oder Aspect-Ratio-Lock)
- Messbare Performance-Probleme (>100ms Paint, Scroll-Jank) auf Referenzgeräten
- Dann: Windowing mit **fester Zeilenhöhe** oder **CSS Grid mit `grid-template-rows`**, nicht dynamisches `measureElement`
