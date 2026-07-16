# HUI Feed Architecture Audit

**Repository:** be-hui  
**Status:** P0 Investigation — reine Analyse, keine Code-Änderungen  
**Datum:** 2026-07-14  
**Commit-Basis:** `bdd83d94b35dae580b7da2a18824982a38065028`

---

## Executive Summary

### Kernbefund: Es gibt nicht einen, sondern mindestens sechs unabhängige Feed-ähnliche Datenpfade

HUI besitzt **keinen einzelnen Feed**. Der Tab „Entdecken“ (`navConfig.js` → `key: "feed"`) rendert `UnifiedFeed`, das intern wiederum **mehrere parallele Listen und Pipelines** führt. Zusätzlich existieren vollständig getrennte Pipelines für Discover/Home, LiveTicker, Events-Streifen, Suche und Legacy `feed_items`.

| # | Pipeline | Datei(en) | Konsumiert von |
|---|----------|-----------|----------------|
| 1 | **Haupt-Feed** (`fetchFeedPage` → Rhythm) | `useFeedStream.js`, `feedRhythmEngine.js` | `UnifiedFeed` → `FeedList` |
| 2 | **Such-Feed** (`fetchSearchResults`) | `useFeedStream.js` (parallel branch) | `GroupedSearchResults` |
| 3 | **Events-Streifen** | `FeedEventsSection.jsx` | Horizontal-Carousel über Feed |
| 4 | **Discover/Home** | `DiscoverPage.jsx` | Tab `discover` (Label „Home“) |
| 5 | **LiveTicker** | `useLiveTicker.js`, `HuiLiveTicker.jsx` | Über Feed + Discover |
| 6 | **Legacy feed_items** | `services/db.js` → `FeedService` | Nur Impact-Aktivitäts-Inserts |

### Root Cause für Symptome (architektonisch belegt)

| Symptom | Wahrscheinliche architektonische Ursache (Codebeleg) |
|---------|------------------------------------------------------|
| Alter Beitrag („Specktakel“) dauerhaft unter den ersten Beiträgen | **Kein** `pinned`/`featured`-Mechanismus im Code. Stattdessen: Multi-Source-Merge + `_sortKey`-Boost (Experiences) + **`rhythmizeFeed()` bricht chronologische Reihenfolge** (`feedRhythmEngine.js` R7, Queue-Reorder). Post-Titel „Specktakel“ existiert **nicht** im Repository — Ursache muss per DB-Query auf Produktionsdaten verifiziert werden. |
| Safari: Feed endet im weißen Bereich | `@tanstack/react-virtual` in `FeedList` (`estimateSize: 640`, `getTotalSize()`), kombiniert mit `FeedBottomSentinel` (`root: null` = Viewport, nicht Scroll-Container). Virtualizer-Höhe kann von echter Kartenhöhe abweichen → weißer Restbereich. |

---

## Aufgabe 1 — Vollständiger Feed-Datenfluss

### Diagramm: Haupt-Feed (Tab „Entdecken“)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ SUPABASE (PostgreSQL via PostgREST)                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│ works          status=published, approval_status=approved, LIMIT 10/page    │
│ experiences    status=published, approval_status=approved, LIMIT 10/page  │
│ beitraege      alle, ORDER created_at DESC, LIMIT 10/page                   │
│ invitations    active, public, nicht abgelaufen, LIMIT 2 (kein Cursor!)       │
│ profiles       ProfileService.getMany(userIds) — separater Batch-Enrichment │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ RPC / QUERY — fetchFeedPage()                                               │
│ Datei: src/feed/useFeedStream.js:64-283                                     │
│ - Promise.allSettled auf 4 Tabellen                                         │
│ - Multi-Cursor: { works, exps, beitr }                                      │
│ - invitations: immer neueste 2, kein Pagination-Cursor                      │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ NORMALIZER — unifiedNormalizer.js                                           │
│ - normalizeWorkRow / normalizeExperienceRow / normalizeMomentRow /          │
│   normalizeEventRow → toFeedItem()                                          │
│ - injectProfile(): { ...row, profile }                                      │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ SORTIERUNG (fetchFeedPage)                                                  │
│ - _sortKey berechnen (FEED.13B: Experience-Termin-Boost innerhalb 7 Tage)    │
│ - normalized.sort((a,b) => b._sortKey - a._sortKey)                         │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ HOOK — useFeedStream()                                                      │
│ State: items[] (chronologisch nach _sortKey)                                │
│ - loadMore: dedup + concat                                                  │
│ - flushPendingItems: prepend (Realtime)                                     │
│ - Realtime: beitraege, invitations, experiences, works INSERT               │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ RHYTHM ENGINE — rhythmizeFeed()                                             │
│ Datei: src/feed/feedRhythmEngine.js:118-309                                 │
│ - Reorder nach Typ/Energie (R1-R7)                                          │
│ - Ghost-Moments injizieren (push, splice, unshift)                          │
│ Output: rhythmicItems[]                                                     │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ EXPORT-SWITCH (useFeedStream return)                                        │
│ items: isSearching ? searchItems : rhythmicItems                            │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ UnifiedFeed.jsx                                                             │
│ - resolvedItems: toFeedItem()-Guard (nochmalige Normalisierung)               │
│ - FeedEventsSection (eigene Query, NICHT gemerged)                          │
│ - FeedWelcomeHeader / useHeuteStats (eigene Queries)                        │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ FeedList (UnifiedFeed.jsx:536-736)                                          │
│ - arr: filter + Map-Dedup                                                   │
│ - @tanstack/react-virtual (wenn arr.length > 6)                             │
│ - ReactionCard → enriched item                                              │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ FeedRouter.jsx                                                              │
│ type → MomentContent | WorkContent | ExperienceContent | EventContent       │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ BaseFeedCard + *Content                                                     │
│ Fertige Feed-Karte                                                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Paralleler Such-Zweig (gleicher Hook, andere Pipeline)

```
SearchCommandCenter → HomeShell.searchState → UnifiedFeed props
  → useFeedStream.isSearching = true
  → fetchSearchResults() [KEIN fetchFeedPage, KEIN Rhythm]
  → searchItems / searchGroups / searchPeople / searchProjects
  → GroupedSearchResults (6 Gruppen, eigene Sortierung)
```

**Wichtig:** Pagination und Realtime des Haupt-Feeds laufen im Hintergrund weiter (`useFeedStream.js:686-689`).

---

## Aufgabe 2 — Jede Stelle, an der Beiträge verändert werden

### `fetchFeedPage()` — `src/feed/useFeedStream.js`

| Operation | Zeile(n) | Beschreibung |
|-----------|----------|--------------|
| `map` | 223-228 | Normalisierung pro Quelle |
| `filter` | 223-228 | `.filter(Boolean)` nach Normalizer |
| `forEach` + Mutation | 250-266 | `item._sortKey` setzen |
| `sort` | 269 | `normalized.sort((a,b) => b._sortKey - a._sortKey)` |
| Merge (spread) | 224-228 | `[...works, ...exps, ...beitr, ...invs]` |

### `fetchSearchResults()` — `src/feed/useFeedStream.js`

| Operation | Zeile(n) | Beschreibung |
|-----------|----------|--------------|
| `map` | 536-538 | `distance_km` auf Roh-Rows |
| `map` | 557-560 | Normalizer pro Typ |
| `filter` | 645-654 | Wirker-Radius-Filter |
| `map` | 654 | `distanceKm` auf People |
| `sort` | 589-604 | `sortByRelevance()` — Match-Tier → Distanz → Recency |
| `sort` | 617-620 | Pro Gruppe: works, experiences, events, moments |
| `sort` | 657-671 | people, projects |
| Merge (spread) | 625 | `[...works, ...experiences, ...events, ...moments]` |

### `rhythmizeFeed()` — `src/feed/feedRhythmEngine.js`

| Operation | Zeile(n) | Beschreibung |
|-----------|----------|--------------|
| `filter` | 122 | `rawItems.filter(Boolean)` |
| `map` | 122 | Shallow copy `{...item}` |
| `filter` | 125-127 | Zähler für heavy/moment/inv |
| `push` | 137 | Ghost-Moments an `items` |
| `splice` + `unshift` | 147-148 | R7: Moment vor erste Experience |
| `filter` | 154-157 | Queues pro Typ |
| `push` | 201, 230, 249, 260 | Queue-basiertes Reorder |
| `map` | 273-287 | `_rhythm` Annotation |
| `splice` | 305 | Ghost-Separator zwischen Invitations |

### `useFeedStream()` Hook-State

| Operation | Zeile(n) | Beschreibung |
|-----------|----------|--------------|
| `setItems` | 807, 829, 843-846, 860-863, 925-928, 1036 | State-Updates |
| `prepend` | 925-928 | `flushPendingItems`: `[...newOnes, ...prev]` |
| `concat` | 846, 863 | `loadMore`: `[...prev, ...deduped]` |
| `filter` | 845, 862, 927 | Dedup bei loadMore/flush |
| `rhythmizeFeed` | 778 | `[...items]` → rhythmic |
| Export-Switch | 1045 | `isSearching ? searchItems : rhythmicItems` |

### `UnifiedFeed.jsx`

| Operation | Zeile(n) | Beschreibung |
|-----------|----------|--------------|
| `map` | 1124-1142 | `resolvedItems` via `toFeedItem` |
| `filter` | 1145 | null / no-id entfernen |
| `filter` + `Map` dedup | 538-543 | `FeedList` → `arr` |
| Spread merge | 623, 652 | `{ ...item, _reactions: {...} }` |
| `enriched` | 491-498 | `ReactionCardInner` |

### `useLiveTicker.js`

| Operation | Zeile(n) | Beschreibung |
|-----------|----------|--------------|
| `map` | 73-77, 87-91, … | Pro Quelle Text-Items |
| `filter` | 129, 159, 190, 206 | Leere/ungültige Rows |
| Merge Map | 267-270 | `bufferRef.current.set()` |
| `sort` | 272-273 | `createdAt` DESC |
| `slice` | 274 | Max 30 Items |

### `FeedEventsSection.jsx`

| Operation | Zeile(n) | Beschreibung |
|-----------|----------|--------------|
| `map` | 163-189 | DB-Rows → Display-Shape |

### `DiscoverPage.jsx`

| Operation | Zeile(n) | Beschreibung |
|-----------|----------|--------------|
| `map` | 1739+, 1759+, 1793+, … | Eigene Maps pro Sektion |
| `setState` | people, momente, werke, talente, erlebnisse, projekte | 6 separate Listen |

### Kein Feed-Sort, aber Karten-Mutation

| Datei | Operation | Feed-Relevanz |
|-------|-----------|---------------|
| `FeedRouter.jsx:57-66` | `useMemo` + spread | Re-Normalisierung |
| `unifiedNormalizer.js:125-172` | `toFeedItem` | Neues Objekt, raw unverändert |
| `useReactions.jsx` | DB write | `post_reactions`, nicht Feed-Array |
| `resonanceEngine.js` | Platform signals | **Kein** Feed-Ordering |

---

## Aufgabe 3 — Sämtliche Feed-Quellen

| Komponente | Pfad | Nutzt useFeedStream? | Eigene DB-Queries? |
|------------|------|---------------------|-------------------|
| **useFeedStream** | `src/feed/useFeedStream.js` | — (ist der Hook) | Ja (4 Tabellen + Search) |
| **UnifiedFeed** | `src/feed/UnifiedFeed.jsx` | Ja (intern) | Ja (useHeuteStats) |
| **FeedRouter** | `src/feed/cards/FeedRouter.jsx` | Nein (Rendering) | Nein |
| **feedRhythmEngine** | `src/feed/feedRhythmEngine.js` | Via Hook | Nein |
| **feedNormalizer** | `src/system/feed/unifiedNormalizer.js` | Via Hook | Nein |
| **LiveTicker** | `src/hooks/useLiveTicker.js` + `HuiLiveTicker.jsx` | Nein | Ja (10 Quellen) |
| **Discover** | `src/pages/DiscoverPage.jsx` | Nein | Ja (6+ Tabellen) |
| **Search** | `SearchCommandCenter.jsx` → `useFeedStream.fetchSearchResults` | Ja (Suchzweig) | Ja |
| **Stories** | `src/components/StoryBar.jsx` | Nein | Ja (`stories`) — **nicht** in UnifiedFeed |
| **Home** | `src/pages/Home.jsx` | Via UnifiedFeed | Nein (Orchestrator) |
| **Impact** | `src/pages/ImpactPage.jsx` | Nein | `FeedService.createActivity` → `feed_items` |
| **Resonance** | `src/core/resonanceEngine.js` | Nein | Signals — nicht Feed-Sort |

### Tab-Naming (verwirrend, aber dokumentiert)

`src/components/home/navigation/navConfig.js`:

- `feed` → Label **„Entdecken“** → `UnifiedFeed`
- `discover` → Label **„Home“** → `DiscoverPage`

---

## Aufgabe 4 — Feed-Quellen im Detail

### Pipeline 1: Haupt-Feed (`fetchFeedPage`)

| Aspekt | Wert |
|--------|------|
| **Datenquelle** | `works`, `experiences`, `beitraege`, `invitations` + `ProfileService.getMany` |
| **Sortierung** | `_sortKey` DESC (Experience-Boost FEED.13B), dann `rhythmizeFeed()` Reorder |
| **Cache** | `sessionStorage` `hui_feed_cache_v5` — **LOAD DISABLED** (`loadCache()` Zeile 47-50); `saveCache()` schreibt noch |
| **Pagination** | Multi-Cursor `{works, exps, beitr}`, PAGE_SIZE=20, 10 pro Quelle, `loadMore` + `prefetchedRef` |
| **Query** | PostgREST `.select().eq().order().limit()`, kein RPC |
| **Merge** | 4 Arrays → normalize → `_sortKey` sort → Hook `items` → rhythm |
| **Priorisierung** | (1) Experience-Termin innerhalb 7d, (2) Rhythm R1-R7, (3) invitations immer top-2 der Query |

### Pipeline 2: Suche (`fetchSearchResults`)

| Aspekt | Wert |
|--------|------|
| **Datenquelle** | works, experiences, beitraege, invitations, profiles, impact_projects, wirker_profiles + RPCs `nearby_*` |
| **Sortierung** | `sortByRelevance()` — Match-Tier 0-9, dann Distanz, dann `created_at` |
| **Cache** | Keiner |
| **Pagination** | Keine (`hasMore: false` im Suchmodus) |
| **Query** | ILIKE, `.in()`, `.overlaps()`, RPC bei Radius |
| **Merge** | Gruppiert: works/experiences/events/moments + people/projects separat |
| **Priorisierung** | Text-Match > Distanz > Aktualität |

### Pipeline 3: FeedEventsSection

| Aspekt | Wert |
|--------|------|
| **Datenquelle** | `experiences` (zukünftige Termine) |
| **Sortierung** | `date ASC` (nicht `created_at`) |
| **Cache** | Keiner |
| **Pagination** | LIMIT 12, kein loadMore |
| **Merge** | **Nicht** in Haupt-Feed gemerged |
| **Priorisierung** | Chronologisch nach Event-Datum |

### Pipeline 4: DiscoverPage

| Aspekt | Wert |
|--------|------|
| **Datenquelle** | profiles, beitraege, works, talents, experiences, impact_projects |
| **Sortierung** | Jeweils `created_at DESC`, LIMIT 8-12 |
| **Cache** | Keiner |
| **Pagination** | Keine |
| **Merge** | 6 separate State-Arrays |
| **Priorisierung** | Keine algorithmische — nur DB-Order |

### Pipeline 5: LiveTicker

| Aspekt | Wert |
|--------|------|
| **Datenquelle** | 10 Tabellen (works, experiences, impact_projects, connections, recommendations, post_reactions, project_support, wirker, work_sales, experience_bookings) |
| **Sortierung** | `createdAt` DESC, max 30 |
| **Cache** | `bufferRef` Map (in-memory, über Refreshes) |
| **Pagination** | LIMIT 5 pro Quelle, 60s Polling |
| **Merge** | Map-Dedup über alle Quellen |
| **Priorisierung** | Nur Recency |

### Pipeline 6: Legacy FeedService

| Aspekt | Wert |
|--------|------|
| **Datenquelle** | `feed_items` |
| **Sortierung** | `created_at DESC` |
| **Cache** | `safeQuery` in db.js |
| **Verwendung** | `getHomeFeed()` — **nicht** von UnifiedFeed konsumiert; nur `createActivity()` für Impact |

---

## Aufgabe 5 — „Specktakel“: Beweisführung

### Code-Repository-Befund

```
grep -r "Specktakel" → KEINE TREFFER
grep -r "Spektakel"  → KEINE TREFFER
grep -r "pinned" (Feed-Kontext) → KEIN Feed-Pinning
grep -r "featured" (Feed-Kontext) → nur PeopleSearch/Archive-Schema, nicht Haupt-Feed
```

**„Specktakel“ ist kein hardcodierter oder konfigurierter Beitrag im Code.** Die Position muss über Produktions-DB und Runtime-Debug ermittelt werden.

### Verifizierungs-Checkliste (für Produktion / Safari-Debug)

Im Browser-Konsole (DEV-Modus):

```javascript
// 1. Stream-Debug (gesetzt in fetchFeedPage)
window.__HUI_STREAM_DEBUG__

// 2. Roh-Items vs. rhythmische Items (React DevTools oder temporärer Log)
// useFeedStream exportiert: items (rhythmic/search), rawItems (pre-rhythm)
```

**DB-Query (Beispiel):**

```sql
-- Work?
SELECT id, title, created_at, status, approval_status FROM works WHERE title ILIKE '%Specktakel%';
-- Experience?
SELECT id, title, created_at, date, status FROM experiences WHERE title ILIKE '%Specktakel%';
-- Moment?
SELECT id, caption, created_at, user_id FROM beitraege WHERE caption ILIKE '%Specktakel%';
-- Invitation?
SELECT id, title, text, created_at, expires_at FROM invitations WHERE title ILIKE '%Specktakel%' OR text ILIKE '%Specktakel%';
```

### Codepfade, die einen ALTEN Beitrag OBEN platzieren können (ohne Pinning)

#### Pfad A: `_sortKey`-Boost (nur Experiences)

`useFeedStream.js:232-266` — FEED.13B:

```
_sortKey = max(created_at, event_date - 48h)
```

Wenn „Specktakel“ ein **Experience** mit Termin in den nächsten 7 Tagen ist, steigt `_sortKey` auf nahe „jetzt“, obwohl `created_at` alt ist.

#### Pfad B: `rhythmizeFeed()` — chronologische Ordnung wird aufgehoben

`feedRhythmEngine.js`:

- **R7** (Zeile 140-149): Wenn erste Karte Experience ist → erster Moment wird per `splice`/`unshift` nach vorne gezogen
- **Queue-Reorder** (Zeile 167-270): Items werden nach Typ-Priorität platziert, nicht nach `_sortKey`
- **Ghost-Moments** (Zeile 136-137): `push` erzeugt Platzhalter-Karten

**Beweis:** `rhythmicItems` ≠ chronologische `items`. Ein Beitrag mit altem `created_at` kann nach Rhythm an Position 2-5 landen, wenn er der erste verfügbare Typ seiner Queue ist.

#### Pfad C: Multi-Source-Pagination

`fetchFeedPage` holt **10 Items pro Quelle** unabhängig. Ein altes Werk bleibt in den Top-10 der `works`-Query, solange weniger als 10 neuere published works existieren ODER es durch Cursor-Pagination wieder erscheint.

Invitations: **immer 2 neueste**, kein Cursor (`useFeedStream.js:105-112`) — können in gemergter Liste prominent erscheinen.

#### Pfad D: Realtime Prepend

`flushPendingItems()` (`useFeedStream.js:923-928`): `[...newOnes, ...prev]` — nur für neue Realtime-Items, nicht für persistent alte.

#### Pfad E: Cache (theoretisch, aktuell deaktiviert)

`loadCache()` gibt immer `null` zurück (Zeile 47-50). **Kein Cache-Einfluss** auf aktuelle Builds, aber `saveCache()` schreibt noch → toter Code-Pfad.

### Entscheidungsbaum für „Specktakel“

```
Ist es type=experience mit date in <7 Tagen?
  JA → _sortKey-Boost erklärt hohe Position in items[]
  NEIN ↓
Ist es in rhythmicItems anders positioniert als in rawItems?
  JA → rhythmizeFeed() ist Ursache
  NEIN ↓
Ist es unter Top-10 seiner Quell-Tabelle (works/beitr/...)?
  JA → Multi-Source-Query erklärt Präsenz
  NEIN → DB-Daten oder anderer Tab (Discover) prüfen
```

---

## Aufgabe 6 — Parallele Listen (existierende Äquivalente)

Es gibt **keine** Variablen namens `CachedFeed`, `VisibleFeed`, `RhythmFeed` etc. Die funktionalen Äquivalente:

| Konzept | Variable / State | Datei | Beschreibung |
|---------|------------------|-------|---------------|
| QueryFeed | `items` | `useFeedStream.js:751` | Nach fetchFeedPage + Sort, vor Rhythm |
| RhythmFeed | `rhythmicItems` | `useFeedStream.js:752` | Nach `rhythmizeFeed()` |
| CachedFeed | `prefetchedRef.current` | `useFeedStream.js:762` | In-Memory nächste Seite |
| CachedFeed (disabled) | `sessionStorage` `hui_feed_cache_v5` | `useFeedStream.js:33-50` | Load deaktiviert |
| SearchFeed | `searchItems`, `searchGroups` | `useFeedStream.js:702-714` | Paralleler Such-State |
| PendingFeed | `pendingItems` | `useFeedStream.js:757` | Realtime Soft-Hydration Queue |
| VisibleFeed | `arr` | `UnifiedFeed.jsx:538-543` | Deduped Render-Liste |
| MergedFeed | `resolvedItems` | `UnifiedFeed.jsx:1120-1148` | streamItems + Normalizer-Guard |
| ExportFeed | Hook-Return `items` | `useFeedStream.js:1045` | `searchItems` XOR `rhythmicItems` |
| LocalFeed (Discover) | `people`, `momente`, `werke`, `talente`, `erlebnisse`, `projekte` | `DiscoverPage.jsx` | 6 isolierte Arrays |
| TickerFeed | `items` + `bufferRef` | `useLiveTicker.js:258-280` | Banner-Rotation |
| EventsFeed | `events` | `FeedEventsSection.jsx:114` | Horizontal, nicht gemerged |
| LegacyFeed | `feed_items` | `services/db.js:551-583` | Nicht in UnifiedFeed |

### Keep-Alive: Tabs parallel im DOM

`Home.jsx` + `HomeShell.jsx`: Tabs `feed`, `discover`, `impact` bleiben via `keepFeed`/`keepDiscover` opacity-basiert gemountet (`navConfig.js:33` `KEEP_ALIVE_TABS`). **Der Feed-Hook läuft weiter**, auch wenn ein anderer Tab sichtbar ist.

---

## Aufgabe 7 — Empfehlung: Single Source of Truth

**Keine Code-Änderung — nur Architektur-Empfehlung.**

### Soll-Zustand

```
┌──────────────────────────────────────────┐
│  FeedRepository (eine Schicht)           │
│  - fetchPage(cursor)                     │
│  - subscribeRealtime()                   │
│  - EIN Normalizer (unifiedNormalizer)    │
│  - EIN Sort-Policy-Objekt (konfigurierbar)│
└────────────────┬─────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────┐
│  useFeedStream (ein Hook, ein items[])   │
│  Optional: rhythm als VIEW, nicht SOURCE │
└────────────────┬─────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────┐
│  UnifiedFeed → FeedList → FeedRouter     │
└──────────────────────────────────────────┘
```

### Konkrete Empfehlungen

1. **`items` nach `fetchFeedPage` + Pagination als einzige Daten-Wahrheit** — `rhythmicItems` sollte abgeleitete View sein, dokumentiert und testbar, nicht stillschweigend die Export-Quelle.

2. **`fetchSearchResults` entweder** in gemeinsames Repository **oder** klar als separater Modus mit eigenem UI-Einstieg (nicht im selben `items`-Export vermischt).

3. **`FeedEventsSection` und `useHeuteStats`** — entweder in Feed-Merge integrieren oder als explizit „Nicht-Feed“-Sektionen labeln (aktuell: visuell über Feed, datentechnisch getrennt).

4. **`DiscoverPage`** — langfristig `useFeedStream` oder gemeinsames Repository nutzen; derzeit duplizierte Queries auf `works`/`beitraege`/`experiences`.

5. **`FeedService` / `feed_items`** — deprecaten oder explizit nur für Activity-Log; nicht als zweiter Home-Feed.

6. **Cache:** Entweder `loadCache()` reaktivieren mit Rhythm-Awareness **oder** `saveCache()` entfernen (aktuell inkonsistent).

7. **Virtualizer:** `estimateSize` dynamisch via `measureElement` oder Virtualizer deaktivieren bis Safari-Höhen-Bug gelöst — separater Fix, nicht Teil dieses Audits.

---

## Komponentenmatrix

| Komponente | Input | Output | Verändert Daten? | Abhängigkeiten |
|------------|-------|--------|------------------|----------------|
| `fetchFeedPage` | cursors, userId | `{items, nextCursors, hasMore}` | Ja (sort, _sortKey) | supabase, unifiedNormalizer, ProfileService |
| `fetchSearchResults` | query, filters, geo | 6 Gruppen + flat items | Ja (sort, map) | supabase, RPCs, unifiedNormalizer |
| `useFeedStream` | search props | `items`, pagination, realtime | Ja (state merge) | fetchFeedPage, rhythmizeFeed |
| `rhythmizeFeed` | rawItems[] | reordered[] + _rhythm | Ja (reorder, ghosts) | — |
| `unifiedNormalizer` | raw DB row | FeedItem | Nein (neues Objekt) | OrbEngine (pillar_hint) |
| `UnifiedFeed` | props + hook | JSX | Ja (resolvedItems) | useFeedStream, FeedEventsSection |
| `FeedList` | items[] | virtualized cards | Ja (dedup, spread) | @tanstack/react-virtual |
| `FeedRouter` | item | Card component | Ja (enrich) | lazy *Content |
| `ReactionCardInner` | item | enriched item | Ja (_reactions) | useSingleReaction, SavedPostsContext |
| `FeedEventsSection` | — | carousel | Ja (eigene events[]) | supabase experiences |
| `useLiveTicker` | — | ticker items[] | Ja (buffer merge) | 10 supabase queries |
| `DiscoverPage` | — | 6 Sektionen | Ja (6 states) | supabase (eigen) |
| `FeedService` | — | feed_items | Legacy | supabase feed_items |

---

## Query-Matrix

| ID | Funktion | Tabelle(n) | Filter | Order | Limit | Cursor |
|----|----------|------------|--------|-------|-------|--------|
| Q1 | fetchFeedPage | works | published, approved | created_at DESC | 10 | works cursor |
| Q2 | fetchFeedPage | experiences | published, approved | created_at DESC | 10 | exps cursor |
| Q3 | fetchFeedPage | beitraege | — | created_at DESC | 10 | beitr cursor |
| Q4 | fetchFeedPage | invitations | active, public, not expired | created_at DESC | 2 | **keiner** |
| Q5 | fetchFeedPage | profiles | ProfileService.getMany | — | batch | — |
| Q6 | fetchSearchResults | works/exps/beitr/inv | ILIKE, radius, category | created_at DESC | 15-60 | — |
| Q7 | fetchSearchResults | profiles | talent, text, category | — | 12 | — |
| Q8 | fetchSearchResults | impact_projects | status in [...] | — | 8 | — |
| Q9 | fetchSearchResults | RPC nearby_* | geo radius | distance | 30-200 | — |
| Q10 | FeedEventsSection | experiences | published, date >= today | date ASC | 12 | — |
| Q11 | useHeuteStats | works, experiences, profiles | created_at >= today | — | count | — |
| Q12 | DiscoverPage | profiles, beitraege, works, talents, experiences, impact_projects | diverse | created_at DESC | 8-12 | — |
| Q13 | useLiveTicker | 10 Tabellen | je Quelle | created_at DESC | 5 | — |
| Q14 | Realtime | beitraege, invitations, experiences, works | INSERT filters | — | — | — |
| Q15 | FeedService | feed_items | expires_at | created_at DESC | page | offset |

---

## Cache-Matrix

| Mechanismus | Speicher | Key/Ref | Lesen | Schreiben | Status | Beeinflusst Feed-Reihenfolge? |
|-------------|----------|---------|-------|-----------|--------|-------------------------------|
| sessionStorage Feed Cache | session | `hui_feed_cache_v5` | **DISABLED** | Bei items-Änderung | Inkonsistent | Nein (load=null) |
| prefetchedRef | memory | useFeedStream | loadMore | prefetch @ 70% | Aktiv | Nur Pagination |
| cursorRef | memory | `{works,exps,beitr}` | loadMore | fetchFeedPage | Aktiv | Ja (welche Items geladen) |
| bufferRef (Ticker) | memory | Map id→item | refresh | 60s poll | Aktiv | Nein (nur Ticker) |
| pendingItems | React state | — | flush | Realtime | Aktiv | Ja (prepend) |
| searchAliveRef | ref | stale guard | — | search effect | Aktiv | Nein |
| _scrollPos | module | `{y:0}` | getFeedScrollPos | saveFeedScrollPos | Aktiv | Nein |
| FeedService safeQuery | — | db.js | getHomeFeed | — | Legacy/unbenutzt | — |
| Keep-Alive Tabs | DOM | opacity | — | tab switch | Aktiv | Hook bleibt alive |

---

## Sortiermatrix

| Stufe | Ort | Kriterium | Richtung | Überschreibt vorherige? |
|-------|-----|-----------|----------|-------------------------|
| S1 | DB Query | `created_at` / `date` | DESC/ASC | — |
| S2 | fetchFeedPage | `_sortKey` (Experience 7d-Boost) | DESC | Ja |
| S3 | rhythmizeFeed | Typ/Energie R1-R7 | Queue-Priority | **Ja, vollständig** |
| S4 | fetchSearchResults | matchTier → distance → created_at | ASC tier, DESC date | — (eigener Pfad) |
| S5 | useLiveTicker | `createdAt` | DESC | — |
| S6 | FeedList | Map dedup by id | Insertion order | Nein |
| S7 | flushPendingItems | prepend new | Oben | Ja (nur neue) |

**Kritischer Konflikt:** S2 sortiert chronologisch/relevanz-basiert, S3 **`rhythmizeFeed` zerstört diese Ordnung**. Der Nutzer sieht `rhythmicItems`, nicht `items`.

---

## Safari: Weißer Bereich am Feed-Ende (Korrelation)

| Faktor | Datei | Mechanismus |
|--------|-------|-------------|
| Virtualizer | `UnifiedFeed.jsx:586-634` | `estimateSize: 640`, `totalHeight = getTotalSize()` — bei unterschätzter Höhe: Leerraum |
| Virtualizer Gate | `UnifiedFeed.jsx:595` | `useVirt = scrollContainerRef && arr.length > 6` |
| Sentinel Root | `FeedScrollSentinel.jsx:28` | `root: null` (Viewport) — Scroll-Container ist `mainScrollRef` in Home.jsx |
| Feed-Ende UI | `UnifiedFeed.jsx:672-733` | Wird bei `!hasMore` gerendert — kann unter Virtualizer-Höhe „hängen“ |
| Safari Paint | `Home.jsx:18`, `safariPaintRecovery.js` | GPU-Hint-Strip bei Tab-Wechsel — indirekt Layout |

---

## Realtime-Kanal

| Topic | Tabelle | Event | Filter |
|-------|---------|-------|--------|
| `hui_feed_realtime_v4f` | beitraege | INSERT | — |
| | invitations | INSERT | visibility=public |
| | experiences | INSERT | status=published + JS approval guard |
| | works | INSERT | status=published + JS approval guard |

Dedup: `_receiveLiveItem` → `pendingItems` (nicht sofort in `items`).

---

## Anhang: Datei-Index

```
src/feed/
  useFeedStream.js          — Hook, fetchFeedPage, fetchSearchResults, Cache, Realtime
  feedRhythmEngine.js       — rhythmizeFeed, resolveContentType
  UnifiedFeed.jsx           — FeedList, GroupedSearchResults, useHeuteStats
  FeedEventsSection.jsx     — Events-Carousel
  FeedScrollSentinel.jsx    — loadMore Sentinel, useFeedScrollProgress (unwired)
  FeedSoftHydrationBadge.jsx — pendingCount UI
  cards/FeedRouter.jsx      — Type → Card
  cards/BaseFeedCard.jsx    — Card shell
  cards/*Content.jsx        — Moment, Work, Experience, Event

src/system/feed/
  unifiedNormalizer.js      — toFeedItem (einziger Normalizer)

src/pages/
  Home.jsx                  — Orchestrator, UnifiedFeed mount
  DiscoverPage.jsx          — Separater Browse-Feed

src/hooks/
  useLiveTicker.js          — Ticker-Daten

src/components/
  home/HomeShell.jsx        — Tab + Search State
  home/header/SearchCommandCenter.jsx
  shared/HuiLiveTicker.jsx

src/services/db.js          — FeedService (legacy feed_items)
src/core/resonanceEngine.js — Nicht Feed-Sort
```

---

## Fazit

1. **HUI hat mehrere konkurrierende Feed-Pipelines** — das ist architektonisch bewiesen, nicht nur Verdacht.
2. Der sichtbare „Entdecken“-Feed ist **`rhythmicItems`**, nicht die chronologische DB-Sortierung.
3. **„Specktakel“** kann im Code nicht lokalisiert werden; die erklärbaren Mechanismen für persistente Top-Position sind `_sortKey`-Boost, Rhythm-Reorder und Multi-Source-Top-N — Verifikation erfordert Produktions-DB.
4. **Single Source of Truth** sollte `useFeedStream.items` (post-fetch, pre- oder post-rhythm — bewusst zu entscheiden) mit einem dokumentierten Sort-Contract sein; alle anderen Pipelines konsumieren oder deprecaten.

---

*Erstellt als reine Architektur-Analyse. Keine Bugfixes, Optimierungen oder Refactorings durchgeführt.*
