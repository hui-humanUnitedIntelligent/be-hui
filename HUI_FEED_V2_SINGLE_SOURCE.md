# HUI Feed V2 — Single Source of Truth

**Status:** Architekturbereinigung (kein Hotfix, keine Performance-Optimierung, keine UI-Änderung)  
**Datum:** 2026-07-14  
**Ziel:** Haupt-Feed („Entdecken") auf eine einzige chronologische Datenquelle zurückführen.

---

## Produktentscheidung

Der Haupt-Feed ist ab sofort **chronologisch**: neueste relevante Beiträge zuerst.

- Keine künstliche Umordnung
- Keine Rhythmisierung
- Keine Experience-Boosts (über Rhythm Engine)
- Keine Queue-Reorder
- Keine impliziten Prioritäten durch `feedRhythmEngine`

---

## Aufgabe 1 — Analyse: `feedRhythmEngine` Verwendung

### Importstellen

| Datei | Import | Status nach V2 |
|-------|--------|----------------|
| `src/feed/useFeedStream.js` | `rhythmizeFeed` aus `./feedRhythmEngine.js` | **Entfernt** (Haupt-Feed entkoppelt) |
| `src/feed/feedRhythmEngine.js` | — (Definition) | **Unverändert** (bleibt im Projekt) |

Keine weiteren Importe von `feedRhythmEngine` im `src/`-Baum.

### Aufrufstellen

| Datei | Funktion | Aufruf | Status nach V2 |
|-------|----------|--------|----------------|
| `src/feed/useFeedStream.js` | `useFeedStream` | `rhythmizeFeed([...items])` in `useEffect` | **Entfernt** |
| `src/feed/feedRhythmEngine.js` | intern | `resolveContentType`, `energyOf`, `isAllowed`, `spacingAfter` | Unverändert |

Exportierte Hilfsfunktionen (`getRhythmMargin`, `getEnergyLabel`, `resolveContentType`) sind aktuell **nicht** von anderen Modulen importiert — nur in `feedRhythmEngine.js` selbst und in generierten Dependency-Docs referenziert.

### Abhängigkeiten

```
fetchFeedPage() / Realtime / Pagination
        │
        ▼
   items (State)          ← Single Source of Truth (V2)
        │
        ├──► UnifiedFeed.jsx → FeedList → FeedRouter → Karten
        └──► (vorher) rhythmizeFeed() → rhythmicItems → UnifiedFeed  ✗ entfernt
```

`feedRhythmEngine.js` hat **keine** externen Abhängigkeiten (reines JS, keine DB/Supabase/React).

### Seiteneffekte der Rhythm Engine (vor Entkopplung)

1. **Reihenfolge-Umordnung** — Queue-basierte Platzierung nach Typ/Energie (R1–R7)
2. **Ghost-Items** — synthetische Spacer (`__ghost_*`, `_isGhost: true`) für Atmung zwischen Karten
3. **`_rhythm`-Annotation** — `marginBottom`, `energyScore`, `contentType` pro Item
4. **Zusätzliche Items** — Ghost-Padding erhöhte die sichtbare Listenlänge über DB-Daten hinaus
5. **Doppelter State** — `items` (chronologisch) vs. `rhythmicItems` (umgeordnet) im Hook

---

## Aufgabe 2 — Umstellung `useFeedStream`

### Vorher

```javascript
const [items, setItems] = useState([]);
const [rhythmicItems, setRhythmicItems] = useState([]);

useEffect(() => {
  const rhythmic = rhythmizeFeed([...items]);
  setRhythmicItems(rhythmic);
}, [items]);

return {
  items: isSearching ? searchItems : rhythmicItems,  // ← Rhythm Engine im Export
  rawItems: items,
};
```

### Nachher

```javascript
const [items, setItems] = useState([]);

// Cache-Sync direkt an chronologische items gebunden
useEffect(() => {
  if (items.length === 0) return;
  saveCache(items, cursorRef.current);
}, [items]);

return {
  items: isSearching ? searchItems : items,  // ← chronologisch, Single Source
  rawItems: items,
};
```

---

## Aufgabe 3 — Rhythm Engine entkoppelt, nicht gelöscht

- `src/feed/feedRhythmEngine.js` — **unverändert**
- `rhythmizeFeed`, `getRhythmMargin`, `getEnergyLabel`, `resolveContentType` — **weiterhin exportiert**
- Kein Refactoring, keine Löschung
- Nur der Import und Aufruf in `useFeedStream.js` wurde entfernt

---

## Aufgabe 4 — Funktionserhalt (Regression-Analyse)

| Funktion | Mechanismus | Betroffen? | Status |
|----------|-------------|------------|--------|
| **Infinite Scroll** | `loadMore` → `fetchFeedPage` → `setItems` | Nein (arbeitet auf `items`) | ✅ Erhalten |
| **Pagination** | Multi-Cursor (`works`, `exps`, `beitr`), `hasMore`, Prefetch | Nein | ✅ Erhalten |
| **Realtime** | Supabase Channel → `_receiveLiveItem` → `pendingItems` → `flushPendingItems` → `setItems` | Nein | ✅ Erhalten |
| **Reactions** | `UnifiedFeed` → `ReactionCard` → `FeedRouter` | Nein | ✅ Erhalten |
| **Kommentare** | `CommentsSheet` / Karten-Handler | Nein | ✅ Erhalten |
| **Bilder** | `WorkContent`, `ExperienceContent`, Normalizer | Nein | ✅ Erhalten |
| **Feed-Karten** | `FeedRouter` → Content-Komponenten | Nein | ✅ Erhalten |
| **Suche** | `isSearching` → `fetchSearchResults` → `searchItems` | Nein (eigener Pfad) | ✅ Erhalten |
| **Discover** | `onDiscover` / `DiscoverPage` | Nein | ✅ Erhalten |

**Einzige sichtbare Änderung:** Reihenfolge der Karten im Normal-Feed entspricht jetzt `items` statt `rhythmicItems` (Produktziel).

---

## Aufgabe 5 — Sortierung / Datenbank-Reihenfolge

### Datenfluss Sortierung

1. **DB-Queries** — je Quelle `order("created_at", { ascending: false })`
2. **Merge in `fetchFeedPage`** — Items werden nach `_sortKey` sortiert (siehe Hinweis unten)
3. **Pagination** — `loadMore` hängt deduplizierte Seiten an `items` an (chronologische Akkumulation)
4. **Frontend (V2)** — **keine** weitere Umordnung durch `rhythmizeFeed`

### Verbleibende Sortierlogik (außerhalb Rhythm Engine)

`fetchFeedPage` enthält **FEED.13B — Upcoming Experience Relevance Ranking**: Experiences mit Termin in den nächsten 7 Tagen erhalten einen erhöhten `_sortKey` (`max(created_at, event_date - 48h)`). Diese Logik war **vor** der Rhythm Engine aktiv und wurde in diesem Ticket **nicht** geändert (Scope: Rhythm-Entkopplung).

**V2-Ergebnis:** Die Rhythm-Engine-Umordnung (Typ-Queues, Ghost-Items, Energie-Balance) entfällt vollständig im Haupt-Feed.

---

## Aufgabe 6 — Weißer Bereich / Safari-Verhalten

### Dokumentation (keine Fixes in diesem Ticket)

| Symptom | Möglicher Zusammenhang mit Rhythm Engine | Erwartung nach V2 |
|---------|------------------------------------------|-------------------|
| **Weiße Lücken im Feed** | Ghost-Items (`_isGhost: true`) erzeugten leere Spacer-Karten zwischen Inhalten | **Mögliche Verbesserung** — keine Ghost-Items mehr im Haupt-Feed |
| **`_rhythm.marginBottom`** | Variable Abstände (8–34 px) je nach Typ-Übergang | Entfällt im Feed-Export; Karten nutzen festes Card-Spacing |
| **Safari Paint/GPU** | Unabhängig von Rhythm Engine (`safariPaintRecovery.js`, `PaintRecoveryManager` in `Home.jsx`) | **Keine direkte Änderung** — Safari-Fixes bleiben separat |
| **`pureDiscovery` leerer Bereich** | `minHeight: 40vh` in `UnifiedFeed.jsx` bei aktiver Suche ohne Filter | Unverändert (Such-UX, kein Rhythm-Thema) |

**Fazit:** Der weiße Bereich durch Ghost-Spacer sollte verschwinden oder reduziert sein. Safari-spezifische Paint-Probleme sind ein separates Subsystem und wurden nicht adressiert.

---

## Bisheriger vs. neuer Datenfluss

### Bisheriger Datenfluss

```
Supabase (works, experiences, beitraege, invitations)
        │
        ▼
  fetchFeedPage()  ──►  items[]  (chronologisch, _sortKey-sortiert)
        │                      │
        │                      ▼
        │              rhythmizeFeed()  ← feedRhythmEngine
        │                      │
        │                      ▼
        │              rhythmicItems[]  (umgeordnet + Ghosts + _rhythm)
        │                      │
        ▼                      ▼
   rawItems (Debug)     items (Export) ──► UnifiedFeed ──► FeedList
```

**Problem:** Zwei konkurrierende Wahrheiten — `items` vs. `rhythmicItems`.

### Neuer Datenfluss (V2)

```
Supabase (works, experiences, beitraege, invitations)
        │
        ▼
  fetchFeedPage()  ──►  items[]  (chronologisch)
        │                      │
        │                      ▼
        │              items (Export) ──► UnifiedFeed ──► FeedList
        │
   Realtime / loadMore / flushPending ──► setItems (gleiche Quelle)

Suchmodus (parallel, unverändert):
  fetchSearchResults() ──► searchItems ──► items (Export wenn isSearching)
```

**Single Source of Truth:** `items` State im Normalmodus.

### Entfernte Feed-Abhängigkeit

- Import: `rhythmizeFeed` aus `feedRhythmEngine.js`
- State: `rhythmicItems`
- Effect: Rhythmisierungs-`useEffect`
- Export-Pfad: `rhythmicItems` → `items`

---

## Auswirkungen

| Bereich | Auswirkung |
|---------|------------|
| Haupt-Feed Reihenfolge | Strikt chronologisch (nach `fetchFeedPage`-Sortierung) |
| Ghost-Spacer | Entfallen im Feed |
| `_rhythm`-Margins | Nicht mehr im Feed-Item-Stream |
| `feedRhythmEngine.js` | Datei bleibt, für zukünftige Nutzung verfügbar |
| Suche | Unverändert (eigener `fetchSearchResults`-Pfad) |
| API des Hooks | `items` und `rawItems` identisch im Normalmodus |
| Bundle | Minimal kleiner (ein Import weniger in `useFeedStream`) |

---

## Regressionstest

### Manuell

1. **Chronologie** — Neuen Beitrag erstellen → erscheint oben (nach Soft-Hydration-Tap oder Refresh)
2. **Infinite Scroll** — Bis Ende scrollen → weitere Karten laden (`loadingMore` Spinner)
3. **Realtime** — Zweiter Tab: neuer Beitrag → Badge „N neue" → Tap → Insert oben
4. **Reactions** — Herz/Kommentar auf Karte → persistiert nach Reload
5. **Suche** — Suchbegriff eingeben → gruppierte Ergebnisse, kein Rhythm-Einfluss
6. **Discover** — Discover-Button / Navigation funktioniert
7. **Keine Ghost-Karten** — Keine leeren `__ghost_*`-Einträge in der Liste

### Build

```bash
npm run build
```

Erwartung: erfolgreicher Vite-Build ohne Fehler.

### Code-Checks

```bash
# Rhythm Engine nicht mehr im Feed-Hook
rg "rhythmizeFeed|feedRhythmEngine" src/feed/useFeedStream.js
# → keine Treffer

# Rhythm Engine Datei unverändert vorhanden
test -f src/feed/feedRhythmEngine.js && echo OK
```

---

## Definition of Done

- [x] `useFeedStream` exportiert chronologische `items`
- [x] Haupt-Feed besitzt genau eine Datenquelle (`items` State)
- [x] `feedRhythmEngine` ist nicht mehr Teil des Haupt-Feeds
- [x] Keine Produkt- oder UI-Änderungen (nur Datenpfad)
- [x] Keine Löschung der Rhythm Engine
- [x] Build erfolgreich
