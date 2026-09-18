# HUI iPad Runtime Analysis

**Status:** ⛔ **BLOCKIERT — Runtime-Datei fehlt**  
**Datum:** 2026-07-14  
**Repository:** be-hui  
**Release-Impact:** P0 Release Blocker (unverändert)

---

## Ergebnis dieser Session

Die angekündigte Export-Datei von `window.__HUI_FEED_DEBUG__.export()` (iPad Safari) liegt **nicht** im Workspace vor.

| Prüfung | Ergebnis |
|---------|----------|
| `/workspace/hui-feed-debug*.json` | nicht gefunden |
| `/tmp/**/hui-feed-debug*.json` | nicht gefunden |
| Systemweite Suche nach `hui-feed-debug*.json` | nicht gefunden |
| Cloud-Agent-Anhänge / Artifacts | leer |
| GitHub PR-/Issue-Kommentare | keine Runtime-Payload |
| `main` enthält `window.__HUI_FEED_DEBUG__` | **nein** (nur auf Branch `cursor/hui-feed-runtime-diagnostics-ee9d`, PR #124) |

**Konsequenz gemäß Auftrag:** Ohne die gelieferte Runtime-Datei sind **keine** der folgenden Aufgaben datenbasiert erfüllbar:

- Vollständige Analyse (scrollTop, scrollHeight, …)
- Exakter Inkonsistenz-Zeitpunkt (Zeitpunkt → State → Folge)
- Prüfung Observer / loadMore / ScrollContainer / DOM-Drift / Layout / Rendering
- Minimaler Fix mit datengestützter Begründung

> **Es gibt in diesem Dokument keine Root-Cause-Behauptung und keinen implementierten Fix — weil die einzige erlaubte Wahrheitsquelle fehlt.**

---

## Erwartete Datei (einzige Wahrheitsquelle)

Export via iPad Safari nach Reproduktion des White-Area-Bugs:

```javascript
window.__HUI_FEED_DEBUG__.export()
```

Typischer Dateiname: `hui-feed-debug-<timestamp>.json`

### Pflichtfelder für die Analyse

| Feld | Bedeutung |
|------|-----------|
| `snapshot.scrollTop` | Aktuelle Scrollposition |
| `snapshot.scrollHeight` | Gesamthöhe des Scroll-Inhalts |
| `snapshot.clientHeight` | Sichtbare Viewport-Höhe des Scroll-Containers |
| `snapshot.itemsLength` | Anzahl Items im Feed-State |
| `snapshot.renderedCards` | Anzahl gerenderter Karten im DOM |
| `snapshot.hasNextPage` | Pagination noch aktiv (`hasMore`) |
| `snapshot.isFetching` | Initialer Load läuft |
| `snapshot.isFetchingNextPage` | Pagination-Request läuft |
| `observerEvents[]` | IntersectionObserver-Ereignisse (Bottom-Sentinel) |
| `loadMoreCalls[]` | Jeder `loadMore()`-Aufruf inkl. Block-Grund |
| `anomalies[]` | Automatisch erkannte Verdachtsfälle |
| `lastSuccessfulRender` | Letzter erfolgreicher Render-Zeitpunkt |
| `snapshot.domNodeCount` / `snapshot.feedCardCount` | DOM vs. Daten |

Zusätzlich erforderlich zur Verifikation:

- `userAgent` mit iPad/Safari-Kennung
- `exportedAt` (ISO-Zeitstempel der Messung)

---

## Voraussetzung: Diagnostik-Build auf dem iPad

Auf `main` existiert `window.__HUI_FEED_DEBUG__` **noch nicht**. Die Instrumentierung liegt auf:

- Branch: `cursor/hui-feed-runtime-diagnostics-ee9d`
- PR: [#124 — HUI Feed: Runtime-Diagnostik](https://github.com/hui-humanUnitedIntelligent/be-hui/pull/124)
- Vercel-Preview dieses Branches

**Aktivierung auf dem iPad (DEV-Preview):**

```javascript
localStorage.setItem('hui_feed_debug', '1');
location.reload();
```

**Export nach Bug-Reproduktion:**

```javascript
window.__HUI_FEED_DEBUG__.export()
// oder:
copy(JSON.stringify(window.__HUI_FEED_DEBUG__.getPayload(), null, 2))
```

---

## Analyse-Protokoll (wird ausgeführt sobald Datei vorliegt)

### Aufgabe 1 — Vollständige Auswertung

Chronologische Auswertung von `events[]`, `observerEvents[]`, `loadMoreCalls[]`, finalem `snapshot` und `anomalies[]`.

### Aufgabe 2 — Inkonsistenz-Zeitpunkt

Format:

```
<ISO-Zeitstempel>
  ↓ State: { scrollTop, itemsLength, renderedCards, hasNextPage, isFetchingNextPage, … }
  ↓ Folge: { was danach passierte / was nicht mehr passierte }
```

Nur Einträge, die sich aus den Messwerten ableiten lassen.

### Aufgabe 3 — Mechanismus-Checkliste

| Hypothese | Datenkriterium |
|-----------|----------------|
| Observer stoppt | `observerEvents` endet, obwohl Sentinel sichtbar + `hasNextPage: true` |
| loadMore feuert nicht | `loadMoreCalls` leer trotz `intersecting` in `observerEvents` |
| ScrollContainer falsche Maße | `scrollHeight ≈ clientHeight` bei `itemsLength > renderedCards` |
| DOM/Daten-Drift | `itemsLength` >> `renderedCards` / `feedCardCount` |
| Layout kollabiert | `scrollHeight` sinkt oder stagniert bei wachsendem `itemsLength` |
| Rendering stoppt | `lastSuccessfulRender.ts` deutlich vor `exportedAt`, keine neuen `render`-Events |

### Aufgabe 4 — Minimaler Fix

Genau **ein** minimaler Diff, abgeleitet aus dem identifizierten Inkonsistenz-Punkt. Keine Refactorings.

### Aufgabe 5 — Fix-Begründung

Nur mit Verweis auf konkrete Messwerte aus der gelieferten Datei.

---

## Nächster Schritt

Bitte die JSON-Datei bereitstellen — eine der folgenden Optionen:

1. Datei `hui-feed-debug-*.json` in den Cloud-Agent hochladen / anhängen
2. JSON-Inhalt direkt in die Agent-Nachricht einfügen
3. Datei ins Repository committen (z. B. `docs/runtime/hui-feed-debug-ipad.json`)

Sobald die Datei vorliegt, wird dieses Dokument mit den datenbasierten Abschnitten **Analyse**, **Root Cause**, **Minimalfix** und **Begründung** ergänzt.

---

## Referenzen (keine Runtime-Daten)

| Ressource | Inhalt |
|-----------|--------|
| PR #124 | Diagnostik-Instrumentierung (`huiFeedRuntimeDiagnostics.js`) |
| PR #122 | Spekulativer Safari-Fix (nicht datenbasiert validiert — laut Auftrag nicht anwendbar ohne iPad-Export) |
| `HUI_FEED_RUNTIME_DIAGNOSTICS.md` (PR #124) | Reproduktionsprotokoll |
