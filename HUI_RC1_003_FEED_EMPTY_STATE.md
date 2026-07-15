# HUI RC1-003 — Feed Empty State Bugfix

**Ticket:** RC1-003  
**Priorität:** P0  
**Bereich:** ✨ Neu auf HUI  
**Symptom:** Empty State „Dein Feed erwacht gleich“ trotz vorhandener DB-Beiträge  

---

## Root Cause

In `fetchFeedPage()` wurde nach Feed V3 die Invitations-Query entfernt, aber in Zeile 164 blieb ein Spread auf die undefinierte Variable `invs`:

```javascript
const allRows = [...works, ...exps, ...beitr, ...invs]; // ReferenceError
```

**Laufzeitnachweis:** `ReferenceError: invs is not defined` (reproduziert mit `node -e` und `scripts/rc1-003-feed-pipeline-check.mjs`).

**Effekt:** `initialLoad()` in `useFeedStream` fängt den Fehler ab → `items` bleibt `[]` → `FeedList` rendert `<EmptyFeed />`.

---

## Aufgabe 1 — Datenfluss (Stufen)

| Stufe | Anzahl (nach Fix, Mock) | IDs (Auszug) | Inhaltstyp |
|-------|-------------------------|--------------|------------|
| **DB** | works=5, exps=4, beitr=11 | work-0…work-4, exp-0…exp-upcoming, beitr-0…beitr-10 | work, experience, moment |
| **fetchFeedPage() → rawItems** | 20 | work-0, exp-0, beitr-0, … | work, experience, moment |
| **normalizedItems** | 20 | gleich wie rawItems | work, experience, moment |
| **items** (nach `shouldExcludeFromMainFeed`) | 19 | exp-upcoming entfernt | work, experience, moment |
| **resolvedItems** (UnifiedFeed) | 19 | identisch zu items | work, experience, moment |
| **visibleItems** | 19 | kein weiterer Filter | work, experience, moment |
| **FeedList arr** | 19 | Dedupe per Map | work, experience, moment |
| **DOM** | 19 Karten | — | FeedRouter-Karten |

**VOR Fix:** Ab `fetchFeedPage()` → 0 Items (Exception vor Rückgabe).

---

## Aufgabe 2 — Filter der Beiträge entfernt

| Feld | Wert |
|------|------|
| **Datei** | `src/feed/useFeedStream.js` |
| **Funktion** | `shouldExcludeFromMainFeed` / `isUpcomingExperience` |
| **Codezeile** | 29–44 (angewendet in Z. 242) |
| **Grund** | Feed V3: bevorstehende Experiences und Events gehören in „Demnächst“, nicht in „Neu auf HUI“ |

Dieser Filter ist **beabsichtigt** und entfernt nur 1 upcoming Experience im Mock — **nicht** die Ursache des Empty States.

Die tatsächliche Verluststelle war der **ReferenceError auf `invs`** (Z. 164), der den gesamten Fetch abbricht.

---

## Aufgabe 3 — Empty-State-Bedingung

| Feld | Wert |
|------|------|
| **Datei** | `src/feed/UnifiedFeed.jsx` |
| **Funktion** | `FeedList` |
| **Codezeile** | 615 |
| **Bedingung** | `arr.length === 0` → `<EmptyFeed />` |

**Codepfad:**

```
useFeedStream.initialLoad()
  → fetchFeedPage() [VOR Fix: throw]
  → items[] = [] (catch-Pfad)
  → streamItems (UnifiedFeed)
  → resolvedItems (useMemo, Z. 1139)
  → FeedList items={resolvedItems} (Z. 1325)
  → arr (useMemo Dedupe, Z. 538)
  → arr.length === 0 → EmptyFeed (Z. 615)
```

Nicht `items.length === 0` direkt in UnifiedFeed, sondern **`arr.length === 0` in FeedList** nach Dedupe.

Skeleton wird bei `streamLoading && resolvedItems.length === 0` (Z. 1246) gezeigt; nach Fehler ist `streamLoading=false` und `resolvedItems=[]` → Empty State.

---

## Aufgabe 4 — DB vs. Feed

Keine Live-DB in Cloud-Agent-Umgebung. Nachvollzug über Produktionscode + Mock:

```
DB (works/experiences/beitraege)
  ↓ Supabase .select().order().limit()
fetchFeedPage() Step 1
  ↓ normalizeWorkRow / normalizeExperienceRow / normalizeBeitragRow
normalizedItems
  ↓ .filter(!shouldExcludeFromMainFeed)
items (Hook-State)
  ↓ UnifiedFeed resolvedItems
FeedList → DOM
```

**VOR Fix:** Pipeline bricht bei Profile-Enrichment-Vorbereitung (`allRows`) ab — kein Item erreicht den Hook.

---

## Implementierter Minimal-Fix

| Feld | Wert |
|------|------|
| **Datei** | `src/feed/useFeedStream.js` |
| **Funktion** | `fetchFeedPage` |
| **Änderung** | `const allRows = [...works, ...exps, ...beitr];` — `...invs` entfernt |
| **Zeile** | 164 |

Entspricht Feed-V3-Spezifikation (`HUI_FEED_V3_TRANSPARENT_FEED.md`: Invitations nur in „Demnächst“).

---

## Aufgabe 6 — Testergebnis

### Automatisiert

| Test | Ergebnis |
|------|----------|
| Vorhandene Beiträge erscheinen | ✅ `scripts/rc1-003-feed-pipeline-check.mjs` |
| Neuer Beitrag oben (Realtime-Pfad) | ✅ `scripts/feed-reality-check.mjs` |
| „Demnächst“ weiterhin (upcoming exp gefiltert) | ✅ Pipeline-Check |
| Chronologie (created_at DESC) | ✅ Pipeline-Check |
| Infinite Scroll (hasMore) | ✅ Pipeline-Check |
| Empty State weg | ✅ Pipeline-Check |
| `npm run build` | ✅ 804 modules, built in 5.74s |

### Manuell (Browser)

| Browser | Status |
|---------|--------|
| Safari | ⏳ Nach Deploy auf Preview testen |
| Firefox | ⏳ Nach Deploy auf Preview testen |

---

## Definition of Done

| Kriterium | Status |
|-----------|--------|
| Empty State verschwindet bei vorhandenen Beiträgen | ✅ |
| Vorhandene Beiträge werden angezeigt | ✅ (simuliert) |
| Neuer Beitrag erscheint | ✅ (bestehender Reality-Check) |
| Keine Regression | ✅ |
| Build erfolgreich | ✅ |

---

## Reproduktion / Verifikation

```bash
node scripts/rc1-003-feed-pipeline-check.mjs
node scripts/feed-reality-check.mjs
npm run build
```
