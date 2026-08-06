# HUI Feed Chronology Audit

**Datum:** 2026-07-14  
**Scope:** Live Home-Feed (`UnifiedFeed` → `useFeedStream`)  
**Methode:** Statische Code-Analyse + Ausführung der produktiven Sortier-/Rhythmus-Logik mit konkreten ISO-Timestamps (kein Fix, nur Dokumentation)

---

## Executive Summary

Der Home-Feed ist **nicht durchgängig chronologisch nach dem angezeigten Zeitstempel sortiert**.

| Schicht | Sortierfeld | Chronologisch zur UI? |
|---------|-------------|----------------------|
| DB-Abfrage pro Quelle | `created_at DESC` | Ja (pro Tabelle) |
| Client-Merge (`fetchFeedPage`) | `_sortKey DESC` | **Nein** (Experiences können künstlich nach oben) |
| Rhythmus-Engine (`rhythmizeFeed`) | Content-Typ-Regeln (R1–R7) | **Nein** (bewusst nicht-chronologisch) |
| UI-Zeitanzeige | `relTime(created_at)` → `createdAt` | Referenz für Nutzer |

**Kernbefund:** Sortierung nutzt `_sortKey` (teilweise ≠ `created_at`), Anzeige nutzt immer `created_at`. Das erklärt Fälle wie „3. Juni“ vor „vor 3 Tagen“.

**Live-DB-Hinweis:** In dieser Audit-Umgebung waren keine Supabase-Credentials (`VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`) verfügbar. Die Beispielrechnung in Aufgabe 6 verwendet dieselben Funktionen und Konstanten wie der Produktionscode mit festem Referenzzeitpunkt `2026-07-14T17:49:00Z` (Audit-Datum).

---

## Architektur-Überblick

```
┌─────────────┐  ┌──────────────┐  ┌────────────┐  ┌──────────────┐
│ works (10)  │  │ experiences  │  │ beitraege  │  │ invitations  │
│ ORDER BY    │  │ (10)         │  │ (10)       │  │ (2)          │
│ created_at↓ │  │ created_at↓  │  │ created_at↓│  │ created_at↓  │
└──────┬──────┘  └──────┬───────┘  └─────┬──────┘  └──────┬───────┘
       └────────────────┴────────────────┴─────────────────┘
                              │
                    normalize (unifiedNormalizer)
                              │
                    _sortKey berechnen (FEED.13B)
                              │
                    sort((a,b) => b._sortKey - a._sortKey)   ← Aufgabe 2
                              │
                    rhythmizeFeed(items)                     ← erneute Umordnung
                              │
                    BaseFeedCard: item.createdAt             ← Aufgabe 3
```

**Render-Pfad:** `useFeedStream` exportiert im Normalmodus `rhythmicItems`, nicht die rohe chronologische Liste:

```1045:1046:src/feed/useFeedStream.js
    items:          isSearching ? searchItems : rhythmicItems,
    rawItems:       items,           // Unverarbeitet (für Debug) -- immer der normale Stream
```

---

## Aufgabe 1 — Zeitfelder pro Feed-Quelle

### 1.1 `works` (Feed-Typ: `work`)

| Feld | In DB/Schema | Im Feed-SELECT | Für Sortierung | Für UI |
|------|--------------|----------------|----------------|--------|
| `created_at` | Ja | Ja | **Ja** (DB + `_sortKey`) | **Ja** (via `relTime`) |
| `updated_at` | Ja (Tabelle) | Nein | Nein | Nein |
| `published_at` | Ja (gesetzt in `WerkWizard.jsx` / Admin) | **Nein** | **Nein** | Nein |
| `event_date` | — | — | — | — |
| `_sortKey` | — (client-only) | — | **Ja** (= `created_at`) | Nein |
| `createdAt` | — (normalisiert) | — | Nein | **Ja** (Anzeigestring) |
| `inserted_at` | **Nicht vorhanden** | — | — | — |

**Feed-SELECT (auszugsweise):** `id,title,...,user_id,creator_id,created_at` — kein `published_at`, kein `updated_at`.

**Schema-Referenzen:** `docs/hui_schema_v5_core.sql` (Z.172–174), `hui_031_phase2_content_live.sql`, `supabase/migrations/20260609_works_approval_system.sql` (`approval_status`).

---

### 1.2 `experiences` (Feed-Typ: `experience`)

| Feld | In DB/Schema | Im Feed-SELECT | Für Sortierung | Für UI |
|------|--------------|----------------|----------------|--------|
| `created_at` | Ja | Ja | **Ja** (DB + Basis von `_sortKey`) | **Ja** (Header via `relTime`) |
| `updated_at` | Ja | Nein | Nein | Nein |
| `published_at` | In `docs/hui_schema_v5_core.sql` dokumentiert | **Nein** | **Nein** | Nein |
| `date` | Ja (`TIMESTAMPTZ`, Event-Termin) | Ja | **Ja** (in `_sortKey`-Berechnung) | **Ja** (Karten-Body, nicht Header) |
| `time_start` / `time_end` | Ja | Ja | Nein | Ja (Karten-Body) |
| `event_date` | **Nicht als Spalte** — Code-Kommentar meint `date` | — | indirekt via `item._raw.date` | — |
| `_sortKey` | client-only | — | **Ja** | Nein |
| `createdAt` | normalisiert | — | Nein | **Ja** (Header) |
| `inserted_at` | **Nicht vorhanden** | — | — | — |

**Weitere Zeitfelder in DB, nicht im Feed:** `avail_days`, `avail_times`, `available_days` (Verfügbarkeit, nicht Feed-Chronologie).

**Schema:** `hui_038_experiences_schema_fix.sql` (Z.31: `date TIMESTAMPTZ`).

---

### 1.3 `beitraege` (Feed-Typ: `moment`)

Historisch VIEW über `feed_posts` (Migration 039), später echte Tabelle (Migration 040).

| Feld | In DB/Schema | Im Feed-SELECT | Für Sortierung | Für UI |
|------|--------------|----------------|----------------|--------|
| `created_at` | Ja | Ja | **Ja** | **Ja** |
| `updated_at` | Ja (`feed_posts`) | Nein | Nein | Nein |
| `published_at` | — | — | — | — |
| `event_date` | — | — | — | — |
| `_sortKey` | client-only | — | **Ja** (= `created_at`) | Nein |
| `createdAt` | normalisiert | — | Nein | **Ja** |
| `inserted_at` | **Nicht vorhanden** | — | — | — |

**Feed-SELECT:** `id,user_id,src,type,caption,created_at`

**Unterliegende Tabelle `feed_posts`:** `created_at`, `updated_at`, `is_archived` (`hui_031_phase2_content_live.sql` Z.28–29).

---

### 1.4 `invitations` (Feed-Typ: `event`)

| Feld | In DB/Schema | Im Feed-SELECT | Für Sortierung | Für UI |
|------|--------------|----------------|----------------|--------|
| `created_at` | Ja | Ja | **Ja** (DB + `_sortKey`) | **Ja** (Header) |
| `updated_at` | Ja | Nein | Nein | Nein |
| `starts_at` | Ja | Ja (SELECT) | Nein (nur Filter indirekt) | Nein im Header |
| `expires_at` | Ja | Ja | **Filter** (`gt expires_at now`) | Nein |
| `time_label` | Ja (Freitext, z.B. „Heute 16 Uhr“) | Ja | Nein | möglich in Karte |
| `published_at` | — | — | — | — |
| `event_date` | — | — | — | — |
| `_sortKey` | client-only | — | **Ja** (= `created_at`) | Nein |
| `createdAt` | normalisiert | — | Nein | **Ja** |
| `inserted_at` | **Nicht vorhanden** | — | — | — |

**Schema:** `hui_phase4e_invitations.sql` (Z.18–26).

---

### 1.5 Legacy: `feed_items` (nicht vom Live-Stream genutzt)

| Feld | Verwendung |
|------|------------|
| `created_at` | `FeedService.getHomeFeed()` ORDER BY |
| `published_at` | Schema/Index in `docs/hui_schema_v5_core.sql`, **nicht** in `useFeedStream` |
| `expires_at` | Filter in `FeedService` |
| `score` | Discovery-Schema, nicht Live-Feed |

`UnifiedFeed` nutzt `useFeedStream`, nicht `FeedService.getHomeFeed()`.

---

### 1.6 Separater UI-Block: `FeedEventsSection`

Eigene Abfrage auf `experiences`, **nicht** in den Haupt-Feed-Merge integriert:

| Feld | ORDER BY | Anzeige |
|------|----------|---------|
| `date` | **Ja** (`ASC`, kommende Termine) | Event-Karussell |
| `created_at` | Nein | Nein |

---

## Aufgabe 2 — ORDER BY (exakt, mit Codezeilen)

### Stufe A: Datenbank — pro Quelle `created_at DESC`

```88:88:src/feed/useFeedStream.js
        .order("created_at", { ascending: false })
```

```96:96:src/feed/useFeedStream.js
        .order("created_at", { ascending: false })
```

```102:102:src/feed/useFeedStream.js
        .order("created_at", { ascending: false })
```

```111:111:src/feed/useFeedStream.js
      .order("created_at", { ascending: false })
```

**Pagination-Cursor** (ebenfalls `created_at`, nicht `_sortKey`):

```77:79:src/feed/useFeedStream.js
  const filterWorks = (q) => worksCursor ? q.lt("created_at", worksCursor) : q;
  const filterExps  = (q) => expsCursor  ? q.lt("created_at", expsCursor)  : q;
  const filterBeitr = (q) => beitrCursor ? q.lt("created_at", beitrCursor) : q;
```

---

### Stufe B: Client-Merge — `_sortKey DESC`

Nach Normalisierung wird `_sortKey` gesetzt und sortiert:

```250:269:src/feed/useFeedStream.js
  normalized.forEach(item => {
    const base = item._raw?.created_at ? new Date(item._raw.created_at).getTime() : 0;
    if (item.type === "experience" && item._raw?.date) {
      const eventMs = new Date(item._raw.date).getTime();
      const delta   = eventMs - _now;
      if (delta >= 0 && delta < _WINDOW_MS) {
        const visibilityAnchor = eventMs - EVENT_VISIBILITY_WINDOW_MS;
        item._sortKey = Math.max(base, visibilityAnchor);
      } else {
        item._sortKey = base;
      }
    } else {
      item._sortKey = base;
    }
  });

  normalized.sort((a, b) => (b._sortKey || 0) - (a._sortKey || 0));
```

**Effektives ORDER BY für die zusammengeführte Feed-Seite:** `ORDER BY _sortKey DESC` (JavaScript), wobei `_sortKey` für Experiences von `date` abhängen kann.

---

### Stufe C: Rhythmus-Engine — keine Zeit-Sortierung

```776:779:src/feed/useFeedStream.js
  useEffect(() => {
    if (items.length === 0) { setRhythmicItems([]); return; }
    const rhythmic = rhythmizeFeed([...items]);
    setRhythmicItems(rhythmic);
```

`rhythmizeFeed` ordnet nach Content-Typ-Energie (R1–R7), **nicht** nach Timestamp:

```13:20:src/feed/feedRhythmEngine.js
// KERN-REGELN:
//  R1  Nie gleicher Typ 3× hintereinander
//  R2  Nach high-energy (Experience, big Work) → immer low-energy (Moment)
//  R3  Moments als emotionale Übergänge — stabilisieren den Flow
//  R4  Invitations max. 1 pro 5 Elemente
//  R5  Works max. 2 hintereinander
//  R6  Dominant Experiences max. alle 4–5 Positionen
//  R7  Am Anfang: 1 Moment vor erster Experience (sanfter Einstieg)
```

**Was der Nutzer sieht:** `rhythmicItems` (Stufe C), nicht die `_sortKey`-Sortierung (Stufe B).

---

### Stufe D: Suchmodus — Relevanz, nicht Chronologie

```602:602:src/feed/useFeedStream.js
      return new Date(getters.createdAt(b) || 0) - new Date(getters.createdAt(a) || 0);
```

Tie-Break innerhalb einer Relevanz-Stufe via `_raw.created_at` — primär zählt Text-Match-Tier (`matchTier`), nicht globale Chronologie.

---

## Aufgabe 3 — UI-Zeitanzeige (exakt, mit Codezeilen)

### Normalisierung: `created_at` → deutscher Anzeigestring `createdAt`

```19:31:src/system/feed/unifiedNormalizer.js
function relTime(ts){
  if(!ts)return"";
  try{
    const diff=Date.now()-new Date(ts).getTime();
    const mins=Math.floor(diff/60000);
    if(mins<1)return"gerade eben";
    if(mins<60)return"vor "+mins+" Min";
    const hrs=Math.floor(mins/60);
    if(hrs<24)return"vor "+hrs+" Std";
    const days=Math.floor(hrs/24);
    if(days<7)return"vor "+days+" Tagen";
    return new Date(ts).toLocaleDateString("de-DE",{day:"numeric",month:"short"});
  }catch{return"";}
}
```

```146:146:src/system/feed/unifiedNormalizer.js
      createdAt:relTime(raw.created_at||raw.createdAt),
```

**Regeln:**
- `< 7 Tage` → „vor X Tagen“ / Stunden / Minuten
- `≥ 7 Tage` → Kalenderformat, z.B. **„3. Juni“**

---

### Karten-Header (alle Feed-Typen)

```230:230:src/feed/cards/BaseFeedCard.jsx
  const timeStr  = item?.createdAt || null;
```

```303:306:src/feed/cards/BaseFeedCard.jsx
          {timeStr && (
            <span style={{ fontSize:12, color:"rgba(26,26,46,0.36)", fontWeight:400, whiteSpace:"nowrap" }}>
              {timeStr}
            </span>
```

**Angezeigtes Feld:** normalisiertes `createdAt` (= `relTime(created_at)`), **nie** `_sortKey`, **nie** `date` (Event-Termin).

---

### Zusätzliche Datumsanzeige nur bei Experiences (Karten-Body, nicht Header)

```17:23:src/feed/cards/ExperienceContent.jsx
  let dateStr = null;
  if (item._raw?.date) {
    try {
      const d = new Date(item._raw.date);
      dateStr = d.toLocaleDateString("de-DE", { day:"numeric", month:"long" });
    } catch { dateStr = item._raw.date; }
  }
```

---

## Aufgabe 4 — Vergleich Sortierung vs. UI

| Aspekt | Sortierung (sichtbare Reihenfolge) | UI-Zeit |
|--------|-----------------------------------|---------|
| Works | `_sortKey` = `created_at` | `relTime(created_at)` |
| Beiträge/Moments | `_sortKey` = `created_at` | `relTime(created_at)` |
| Invitations | `_sortKey` = `created_at` | `relTime(created_at)` |
| Experiences | `_sortKey` = `max(created_at, date − 48h)` wenn Termin in 0–7 Tagen | `relTime(created_at)` nur im Header |
| Finaler Output | `rhythmizeFeed()` — Typ-Regeln | unverändert `created_at` |

### Root Causes (priorisiert)

#### RC-1 — Sort-Feld ≠ Anzeige-Feld (P0, erklärt Nutzer-Beispiel)

- **Sort:** `_sortKey` (kann durch `experiences.date` angehoben werden)
- **UI:** `created_at` via `relTime()`
- **Folge:** Ein älterer Post kann weiter oben stehen, zeigt aber einen älteren Zeitstempel als der darunter liegende neuere Post.

#### RC-2 — Rhythmus-Engine bricht Chronologie absichtlich (P0)

Nach `_sortKey`-Sortierung wird `rhythmizeFeed()` angewendet. Die Engine dokumentiert explizit, dass der Feed „keine Datenliste“ ist (`feedRhythmEngine.js` Z.6–7). Items werden nach Typ-Energie umgeordnet.

**Nachweis (Code ausgeführt, Audit-Datum):** Input chronologisch `[1,2,3,4,5]` (Works/Moments/Experiences) → Output `[3,4,5,1,2]` — klare Umordnung trotz absteigender `_sortKey`.

#### RC-3 — Pagination: Append ohne globales Re-Sort (P1)

```843:846:src/feed/useFeedStream.js
      setItems(prev => {
        const existingIds = new Set(prev.map(i => i.id));
        const deduped = nextItems.filter(i => !existingIds.has(i.id));
        return [...prev, ...deduped];
```

Neue Seiten werden angehängt; es gibt **kein** erneutes `sort()` über die gesamte `items`-Liste. Innerhalb einer Seite stimmt die Reihenfolge; über Seitengrenzen kann die globale Chronologie theoretisch kippen, wenn Quellen unterschiedlich paginieren.

#### RC-4 — Soft Hydration: Prepend ohne Re-Sort (P2)

```925:928:src/feed/useFeedStream.js
    setItems(prev => {
      const existingIds = new Set(prev.map(i => i.id));
      const newOnes = pendingItems.filter(i => !existingIds.has(i.id));
      return [...newOnes, ...prev];
```

Realtime-Items werden oben eingefügt, ohne `_sortKey`- oder Rhythmus-Neuberechnung pro Insert.

#### RC-5 — Suchmodus (P2, anderer Kontext)

Im Suchmodus ist Relevanz primär; keine globale Zeit-Sortierung über alle Typen.

---

## Aufgabe 5 — Merge und `_sortKey`-Bildung

### Merge-Ablauf in `fetchFeedPage`

1. **Parallel fetch** (je 10 Items): `works`, `experiences`, `beitraege`, `invitations` (2)
2. **Profile-Enrichment** via `ProfileService.getMany`
3. **Normalisierung** pro Typ (`normalizeWorkRow`, `normalizeExperienceRow`, `normalizeBeitragRow`, `normalizeInvitationRow`)
4. **Concat** zu einem Array (Reihenfolge: works → exps → beitr → invs)
5. **`_sortKey` berechnen** (FEED.13B)
6. **`normalized.sort((a,b) => b._sortKey - a._sortKey)`**

### `_sortKey`-Formel

```
Für alle Typen außer Experience:
  _sortKey = epoch_ms(created_at)

Für Experience mit item._raw.date:
  eventMs = epoch_ms(date)
  delta = eventMs - now
  Wenn 0 ≤ delta < 7 Tage:
    visibilityAnchor = eventMs - 48 Stunden
    _sortKey = max(epoch_ms(created_at), visibilityAnchor)
  Sonst:
    _sortKey = epoch_ms(created_at)
```

**Konstanten** (`useFeedStream.js` Z.247–248):
- `EVENT_VISIBILITY_WINDOW_MS` = 48 h
- `_WINDOW_MS` = 7 Tage

**Mapping Kommentar → Code:**
- Kommentar „`event_date`“ = DB-Spalte `experiences.date` (`item._raw.date`)

### Danach: Rhythmus (separater Schritt)

`rhythmizeFeed` splittet in Typ-Queues (Originalreihenfolge innerhalb des Typs), platziert nach Energie-Regeln — **ignoriert `_sortKey` bei der Platzierung**.

---

## Aufgabe 6 — Warum „3. Juni“ vor „vor 3 Tagen“?

### Bedeutung der UI-Strings (ableitbar aus Code, nicht geraten)

Mit Referenz **jetzt = 2026-07-14**:

| UI-Text | Bedingung in `relTime()` | Bedeutung für `created_at` |
|---------|--------------------------|----------------------------|
| „vor 3 Tagen“ | `days < 7` | ca. **2026-07-11** |
| „3. Juni“ | `days ≥ 7` | **vor 2026-07-07**, z.B. **2026-06-03** |

**Fazit:** Der obere Post ist nach `created_at` **älter** als der untere. Die sichtbare Reihenfolge widerspricht einer reinen `created_at DESC`-Sortierung.

---

### Belegter Codepfad (Hauptursache RC-1)

**Szenario:** Post A = Experience, Post B = Work oder Moment.

| | Post A | Post B |
|---|--------|--------|
| `type` | `experience` | `work` / `moment` |
| `created_at` | `2026-06-03T10:00:00Z` | `2026-07-11T10:00:00Z` |
| `date` (Event) | `2026-07-16T18:00:00Z` (Termin in 2 Tagen) | — |
| UI (`relTime`) | **„3. Juni“** | **„vor 3 Tagen“** |

**Berechnung mit produktiver Logik** (Node-Ausführung am 2026-07-14):

```
Post A:
  created_at = 2026-06-03T10:00:00Z
  event date = 2026-07-16T18:00:00Z
  delta = 2.01 Tage (< 7 Tage Fenster)
  visibilityAnchor = 2026-07-16T18:00:00Z − 48h = 2026-07-14T18:00:00Z
  _sortKey = max(2026-06-03, 2026-07-14T18:00) = 2026-07-14T18:00:00Z

Post B:
  _sortKey = 2026-07-11T10:00:00Z

ORDER BY _sortKey DESC → Post A vor Post B
UI → „3. Juni“ vor „vor 3 Tagen“
```

**Chronologie nach `created_at` allein** wäre: Post B (11. Juli) **vor** Post A (3. Juni).  
**Tatsächliche Sortierung** hebt Post A wegen FEED.13B nach oben, **ohne** den Header-Zeitstempel anzupassen.

---

### Belegter Codepfad (Verstärker RC-2: Experience + Work)

Wenn nur ein boosted Experience (A) und ein neueres Werk (B) in der Liste sind, lässt `rhythmizeFeed` die Reihenfolge **A vor B**:

```
Input nach _sortKey-Sort:  [A(experience), B(work)]
Output rhythmizeFeed:      [A, B]   → A_before_B = true
```

(Ausführung der produktiven `rhythmizeFeed`-Funktion im Repo, gleiches Audit-Datum.)

Damit bleibt der widersprüchliche Zustand „3. Juni“ über „vor 3 Tagen“ auch **nach** der Rhythmus-Stufe bestehen — im Gegensatz zu Experience+Moment, wo R7 den Moment oft nach vorne zieht.

---

### Vollständiger Pfad von DB bis Pixel

```
1. supabase.from("experiences").order("created_at", { ascending: false })
2. supabase.from("works").order("created_at", { ascending: false })
   … (weitere Quellen)

3. fetchFeedPage → normalized.forEach → _sortKey (FEED.13B)
4. normalized.sort((a,b) => b._sortKey - a._sortKey)

5. setItems(newItems)

6. useEffect → rhythmizeFeed(items) → setRhythmicItems

7. UnifiedFeed rendert rhythmicItems

8. BaseFeedCard zeigt item.createdAt = relTime(_raw.created_at)
   → „3. Juni“ bzw. „vor 3 Tagen“
```

---

## Zusammenfassung der Diskrepanz

| Frage | Antwort |
|-------|---------|
| Soll der Feed chronologisch sein? | Produktanforderung P0 impliziert ja (nach angezeigtem Zeitstempel) |
| Ist er es? | **Nein** — absichtlich und unabsichtlich |
| Welches Feld sortiert? | `_sortKey` (abgeleitet von `created_at`, bei Experiences auch `date`) |
| Welches Feld zeigt die UI? | `created_at` → `createdAt` String |
| Warum das Nutzer-Beispiel? | Experience mit nahem Termin: höherer `_sortKey`, aber Header zeigt altes `created_at` („3. Juni“) über neuem Post („vor 3 Tagen“) |

---

## Nicht im Scope dieses Audits

- Keine Code-Änderungen vorgenommen
- Keine Fixes vorgeschlagen (nur Root-Cause-Dokumentation)
- Live-Supabase-Rows nicht abgefragt (fehlende Credentials); Reproduktion via exakter Code-Nachbildung mit ISO-Timestamps

---

## Referenz-Dateien

| Datei | Rolle |
|-------|-------|
| `src/feed/useFeedStream.js` | Fetch, Merge, `_sortKey`, Pagination, Rhythmus-Hook |
| `src/system/feed/unifiedNormalizer.js` | `relTime()`, `createdAt` |
| `src/feed/feedRhythmEngine.js` | `rhythmizeFeed()` |
| `src/feed/cards/BaseFeedCard.jsx` | Header-Zeitanzeige |
| `src/feed/cards/ExperienceContent.jsx` | Event-`date` im Body |
| `src/feed/UnifiedFeed.jsx` | Feed-Shell |
| `src/services/db.js` | Legacy `feed_items` / `FeedService` |
