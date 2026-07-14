# HUI Feed — Runtime-Diagnostik

**Status:** P0 Release Blocker — Reproduktion ausstehend  
**Datum:** 2026-07-14  
**Scope:** Nur Instrumentierung. **Keine Bugfixes.**

---

## Verifikationsstatus WebKit

| Umgebung | Safari/WebKit verfügbar? | Feed-Bug verifiziert? |
|----------|--------------------------|------------------------|
| Cloud-Agent (Linux x86_64) | **Nein** — keine echte Safari-Laufzeit | **Kann ohne WebKit-Laufzeit nicht verifiziert werden.** |
| Firefox (Desktop) | Nein (anderes Engine-Verhalten) | Nicht als WebKit-Nachweis gültig |
| iPad Safari (Zielgerät) | **Ja — erforderlich** | Noch offen |

**Wichtig:** Playwright WebKit auf Linux ist **nicht** dasselbe wie Safari auf einem echten iPad. Bis ein Lauf auf echtem iPad/WebKit mit exportierten Diagnosedaten vorliegt, gilt:

> **Der Feed-White-Area-Bug ist nicht als behoben zu betrachten.**

---

## Symptom (unverändert)

Auf einem echten iPad in Safari:

1. Feed lädt zunächst
2. Danach entsteht wieder ein weißer Bereich
3. Infinite Scroll funktioniert nicht zuverlässig
4. Verhalten tritt trotz früherer Hotfix-Versuche weiterhin auf

Firefox verhält sich anders — deshalb ist WebKit-Reproduktion zwingend.

---

## Was wurde implementiert (nur Diagnostik)

### 1. Globales Debug-Objekt: `window.__HUI_FEED_DEBUG__`

Wird beim Mount von `UnifiedFeed` initialisiert und kontinuierlich befüllt.

| Feld | Inhalt |
|------|--------|
| `snapshot` | Aktueller Live-Snapshot (Scroll, Items, Fetch-State, Sentinel, DOM) |
| `lastSuccessfulRender` | Zeitstempel + Metadaten des letzten erfolgreichen Renders |
| `loadMoreCalls[]` | Jeder `loadMore()`-Aufruf inkl. Block-Grund |
| `observerEvents[]` | IntersectionObserver-Events des Bottom-Sentinels |
| `anomalies[]` | Automatisch erkannte Verdachtsfälle (z. B. Scroll-Stall) |
| `events[]` | Chronologisches Event-Log |
| `export()` | JSON-Download aller Daten |
| `copy()` | Payload in Zwischenablage |
| `getPayload()` | Payload als Objekt (ohne Download) |

### 2. Live-Snapshot (`snapshot`)

Enthält bei jedem Update:

- `scrollTop`, `scrollHeight`, `clientHeight`, `scrollable`, `progress`
- `itemsLength`
- `renderedCards` (virtualisiert oder vollständig)
- `hasNextPage` (entspricht `hasMore` im Hook)
- `isFetching` (initialer Load)
- `isFetchingNextPage` (Pagination)
- `useVirtualizer`, `virtualItemCount`
- `sentinelPosition` (Bounding-Rect des Bottom-Sentinels)
- `scrollContainer` (Tag, Klasse, Selektor — typisch `.hui-scroll`)
- `domNodeCount`, `feedCardCount`
- `observerConnected`

### 3. Diagnose-Overlay (DEV only)

**Aktivierung auf dem iPad:**

```javascript
localStorage.setItem('hui_feed_debug', '1');
location.reload();
```

**Deaktivierung:**

```javascript
localStorage.removeItem('hui_feed_debug');
location.reload();
```

Das Overlay erscheint nur wenn:

- `import.meta.env.DEV === true` (Vite Dev-Server), **und**
- `localStorage.hui_feed_debug === '1'`

Angezeigt werden live (ohne DevTools):

- Items
- Rendered (Karten im DOM)
- Scrollposition
- NextPage
- Fetching-Status
- Observer Status
- DOM Count
- Virtualizer-Status

Position: unten links, über der Bottom-Navigation.

### 4. Instrumentierte Stellen

| Datei | Was wird geloggt |
|-------|------------------|
| `src/feed/huiFeedRuntimeDiagnostics.js` | Zentrale Sammlung, Snapshots, Anomalie-Heuristiken, Export |
| `src/feed/UnifiedFeed.jsx` | Init, periodische Snapshots, Scroll-Listener, Overlay |
| `src/feed/FeedScrollSentinel.jsx` | IntersectionObserver connect/disconnect/intersecting/loadMore_triggered |
| `src/feed/useFeedStream.js` | Jeder `loadMore()`-Aufruf mit Fetch-State |

---

## Reproduktions-Protokoll (iPad Safari)

### Vorbereitung

1. App im **DEV-Modus** auf dem iPad öffnen (oder Staging-Build mit aktivierter Diagnostik)
2. In Safari-Konsole (oder via Bookmarklet) ausführen:

```javascript
localStorage.setItem('hui_feed_debug', '1');
location.reload();
```

3. Zum Feed-Tab navigieren

### Reproduktion

1. Feed laden lassen
2. Nach unten scrollen bis der weiße Bereich erscheint
3. 5–10 Sekunden warten (Observer/Snapshots laufen weiter)
4. Export ausführen:

```javascript
window.__HUI_FEED_DEBUG__.export();
```

Alternativ in Zwischenablage:

```javascript
window.__HUI_FEED_DEBUG__.copy();
```

### Was im Export auf Fehler hinweist

| Signal | Bedeutung |
|--------|-----------|
| `anomalies[].code === 'WHITE_AREA_SUSPECT'` | Unten angekommen, `hasNextPage: true`, aber kaum Karten gerendert |
| `anomalies[].code === 'SCROLL_STALL_SUSPECT'` | >85 % gescrollt, `hasNextPage: true`, kein `isFetchingNextPage` |
| `loadMoreCalls[].blocked: true` | `loadMore()` wurde aufgerufen, aber sofort abgebrochen |
| `observerEvents` ohne `loadMore_triggered` trotz `intersecting` | Sentinel sichtbar, aber kein Nachladen ausgelöst |
| `snapshot.useVirtualizer: true` + `renderedCards` << `itemsLength` | Virtualizer rendert weniger als erwartet |
| `snapshot.scrollHeight` ≈ `scrollTop + clientHeight` + `hasNextPage: true` | Scroll-Ende erreicht, aber noch Seiten verfügbar |

### Minimale Console-Checks (ohne Export)

```javascript
// Aktueller Stand
window.__HUI_FEED_DEBUG__.snapshot

// Letzter Render
window.__HUI_FEED_DEBUG__.lastSuccessfulRender

// Observer-Historie
window.__HUI_FEED_DEBUG__.observerEvents.slice(-10)

// loadMore-Aufrufe
window.__HUI_FEED_DEBUG__.loadMoreCalls.slice(-10)
```

---

## Bekannte Architektur-Hinweise (für Interpretation)

Diese Punkte sind **keine Fixes**, sondern Kontext für die Diagnose:

1. **Scroll-Container:** `.hui-scroll` in `Home.jsx` — nicht `document`, sondern ein innerer Flex-Child
2. **Virtualizer:** Aktiv wenn `scrollContainerRef.current` gesetzt **und** `items.length > 6`
3. **Sentinel root:** `IntersectionObserver` nutzt `root: null` (Viewport), nicht den Scroll-Container — relevant für WebKit-Interpretation
4. **hasMore:** Kommt aus `useFeedStream` Cursor-Logik (works/exps/beiträge je 10 pro Seite)

---

## Was bewusst NICHT gemacht wurde

- Keine Scroll-Fixes
- Keine Virtualizer-Anpassungen
- Keine Sentinel-Root-Änderungen
- Keine Performance-Optimierungen
- Keine Behauptung „Bug behoben“

---

## Nächster Schritt

1. Reproduktion auf **echtem iPad Safari**
2. `window.__HUI_FEED_DEBUG__.export()` bei Auftreten des weißen Bereichs
3. JSON an das Team liefern
4. Erst danach: gezielter Fix basierend auf den Runtime-Daten

---

## Dateien dieser Änderung

```
src/feed/huiFeedRuntimeDiagnostics.js   — Kern-Instrumentierung
src/feed/FeedDebugOverlay.jsx           — DEV-Overlay
src/feed/FeedScrollSentinel.jsx         — Observer-Events
src/feed/useFeedStream.js               — loadMore()-Logging
src/feed/UnifiedFeed.jsx                — Snapshot-Pipeline + Overlay-Mount
HUI_FEED_RUNTIME_DIAGNOSTICS.md         — dieses Dokument
```
