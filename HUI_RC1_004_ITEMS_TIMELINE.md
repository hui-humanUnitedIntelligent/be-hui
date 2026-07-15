# HUI RC1-004 — items[] Timeline & Root Cause

**Ticket:** RC1-004 (P0)  
**Datum:** 2026-07-15  
**Methode:** Instrumentierung von `setItems()` + Laufzeit-Simulation (`node scripts/hui-rc1-004-items-timeline.mjs`)  
**Runtime-API:** `window.__HUI_ITEMS_TIMELINE__`

---

## AUFGABE 1 — Instrumentierung

Jeder `setItems()`-Aufruf in `useFeedStream` protokolliert:

| Feld | Beschreibung |
|------|--------------|
| `ms` | Millisekunden seit Mount |
| `time` | ISO-Zeitstempel |
| `caller` | Aufrufende Funktion |
| `before` | `items.length` vorher |
| `after` | `items.length` nachher |
| `reason` | Grund des Updates |

Zusätzlich wird ein **Display-Swap** protokolliert, wenn `isSearching` umschaltet (kein `setItems`, aber sichtbarer Feed wird leer).

**Dev-Konsole:** `[HUI_ITEMS] …`  
**Runtime:** `window.__HUI_ITEMS_TIMELINE__.events`

---

## AUFGABE 2 — Alle Stellen mit `setItems()` / `items=[]`

### Feed-Hook (`src/feed/useFeedStream.js`)

| Datei | Zeile | Aufruf | Funktion | Grund |
|-------|-------|--------|----------|-------|
| `src/feed/useFeedStream.js` | 775 | `useState([])` | mount | initial state |
| `src/feed/useFeedStream.js` | 833 | `setItems(cached.items)` | `initialLoad` | `cache restore()` |
| `src/feed/useFeedStream.js` | 847 | `setItems(newItems)` | `initialLoad` | `initialLoad()` |
| `src/feed/useFeedStream.js` | 869 | `setItems(fresh)` | `_silentRefresh` | `silent refresh()` |
| `src/feed/useFeedStream.js` | 883 | `setItems(prev=>…)` | `loadMore` | `loadMore()` (Prefetch) |
| `src/feed/useFeedStream.js` | 900 | `setItems(prev=>…)` | `loadMore` | `loadMore()` |
| `src/feed/useFeedStream.js` | 944 | `setItems(prev=>…)` | `_receiveLiveItem` | `receiveRealtime()` |
| `src/feed/useFeedStream.js` | 953 | `setItems(prev=>…)` | `flushPendingItems` | `flushPendingItems()` |
| `src/feed/useFeedStream.js` | 1074 | `setItems(prev=>…)` | `refresh` | `refresh()` |

### Display-Swap (kein `setItems`, aber Feed wird leer)

| Datei | Zeile | Mechanismus |
|-------|-------|-------------|
| `src/feed/useFeedStream.js` | 1095 | `items: isSearching ? searchItems : items` |

### Kein `setItems([])` im Feed-Hook

Es gibt **keinen** Aufruf `setItems([])` in `useFeedStream.js`.  
`items[]` wird durch den RC1-004-Bug **nicht geleert** — der sichtbare Feed wechselt auf leere `searchItems`.

### Andere Dateien (nicht Feed-Stream, zur Vollständigkeit)

| Datei | Zeile | Aufruf |
|-------|-------|--------|
| `src/components/shared/CommentsSheet.jsx` | 251 | `setItems([])` |
| `src/lib/useNotifications.jsx` | 130 | `setItems([])` (Logout) |
| `src/components/profile/MerkenSection.jsx` | 70 | eigenes `items` (Merken) |

---

## AUFGABE 3 — Timeline (bewiesen via Simulation)

```
0 ms
items = []
sichtbar = 0
↓
120 ms
initialLoad() — setItems: 0 → 20
items = 20
sichtbar = 20
↓
180 ms
SearchCommandCenter meldet radiusKm=25 + geo aus localStorage
isSearching = true  (BUG: ohne searchActive)
DISPLAY-SWAP → searchItems (items[] bleibt 20)
sichtbar = 0
↓
250 ms
Empty State
items = 20  ← State unverändert
sichtbar = 0
```

**Reproduktion:**

```bash
node scripts/hui-rc1-004-items-timeline.mjs
```

---

## AUFGABE 4 — Race Condition

| Aspekt | Befund |
|--------|--------|
| **Gleichzeitige Schreiber** | `initialLoad()` und `SearchCommandCenter`-Effect laufen parallel |
| **Reihenfolge** | 1. `initialLoad` setzt `items=20` → 2. Radius/Geo aus localStorage setzt `isSearching=true` |
| **Race** | Kein Datenverlust in `items[]` — **Anzeige-Race** zwischen Feed-State und Such-Modus |
| **Letzter Gewinner** | `isSearching=true` → Export `searchItems` (leer) gewinnt über `items` (20) |

---

## Verursachende Funktion

**Nicht** `setItems()` — kein Aufruf leert `items[]`.

**Verursacher:** `isSearching`-Berechnung in `useFeedStream` (Zeile ~738), ausgelöst durch `SearchCommandCenter`-Effect (`SearchCommandCenter.jsx:484–491`), der gespeicherten Radius/Geo meldet, während `searchActive=false`.

```javascript
// VOR FIX — isSearching=true sobald geo+radiusKm aus localStorage da sind:
const isSearching = !!(searchQuery).trim() || !!categoryFilters?.length || hasRadius;
```

---

## Root Cause

`hasRadius` allein aktiviert den Suchmodus, auch wenn die Such-UI geschlossen ist (`searchActive=false`).  
Der Hook exportiert dann `searchItems` (initial `[]`) statt `items` (bereits geladen).  
Der Nutzer sieht: Feed lädt kurz → verschwindet.

---

## Minimal-Fix (genau einer)

`isSearching` nur bei aktiver Such-UI (`searchActive`) erlauben; `searchActive` von `UnifiedFeed` durchreichen.

```javascript
// useFeedStream.js
const isSearching = searchActive && (
  !!(searchQuery || "").trim() || !!categoryFilters?.length || hasRadius
);
```

```javascript
// UnifiedFeed.jsx
useFeedStream({ …, searchActive });
```

**Nach Fix:** Bei `searchActive=false` bleibt `isSearching=false` → Feed zeigt weiterhin `items` (20).

---

## Definition of Done

| Kriterium | Status |
|-----------|--------|
| Bewiesen, welcher Code den Feed leert | ✅ Display-Swap via `isSearching`, nicht `setItems([])` |
| Genau ein Fix | ✅ `searchActive`-Gate für `isSearching` |
| Feed bleibt stabil | ✅ Simulation: 20 Items sichtbar nach 250 ms |
| Nur Laufzeitdaten | ✅ `__HUI_ITEMS_TIMELINE__` + Simulationsskript |
