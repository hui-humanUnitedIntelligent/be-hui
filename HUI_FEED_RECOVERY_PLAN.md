# HUI Feed Recovery Plan

**Datum:** 2026-07-15  
**Repository:** be-hui (`hui-humanUnitedIntelligent/be-hui`)  
**Recovery-Branch:** `cursor/feed-recovery-base`  
**Basis-Commit (Feed):** `30c98d287d79c7c9978b6a1b9cefc7384f84e14c`  
**Aktueller `main`:** `6f56aa08cc8ef452dd26df2c3f59fd0937c4f86f`

---

## Aufgabe 1 — Letzter stabiler Feed-Commit

### Identifizierter Commit

| Feld | Wert |
|------|------|
| **Commit** | `30c98d287d79c7c9978b6a1b9cefc7384f84e14c` |
| **Kurz** | `30c98d28` |
| **Datum** | 2026-07-13 14:21:17 UTC |
| **Message** | `fix(react-error-300-final): useHome() wirft kein Error mehr außerhalb HomeShell` |

### Warum dieser Commit als letzter stabiler Feed-Stand gilt

Dies ist der **letzte Commit vor Beginn der Feed-/Performance-Optimierungen** (`8855ae6c`, 2026-07-13 14:48). Ab diesem Commit beginnt die Kette widersprüchlicher Feed-Änderungen auf `main`.

#### Kriterien-Nachweis (aus Git-Historie und Repo-Dokumentation)

| Kriterium | Status | Beleg |
|-----------|--------|-------|
| Beiträge wurden angezeigt | ✅ | Feed-Pipeline (`useFeedStream` → `UnifiedFeed` → `FeedRouter`) unverändert; kein P4-Virtualisierungs-Regression-Fix nötig (Regression erst ab `8db63ed4`, Branch, nicht auf `main`) |
| Infinite Scroll funktionierte | ✅ | FEED.2B (`c89fe31a`, 2026-06-11): *„feed stopped at ~30 items — loadMore was implemented but never called"* → `FeedBottomSentinel` verdrahtet; Wiring bei `30c98d28` noch intakt |
| Safari zeigte keinen leeren Feed | ✅ (indirekt) | P4-Regression (`92dc8dd2`): *„Fixes empty scroll area after ~5 visible feed cards"* — verursacht durch `8db63ed4` (2026-07-14), **nach** `30c98d28`. Perf-Batch-1 `will-change:transform` auf `.hui-scroll` (`8855ae6c`) ebenfalls **nach** `30c98d28` |
| Firefox funktionierte | ⚠️ **Nicht belegt** | Kein Commit, kein QA-Dokument im Repo mit explizitem Firefox-Feed-PASS an diesem Stand. `HUI_RC1_QA_TRACKER.md` listet Firefox-Tests durchgängig als ☐ (offen) |
| Neue Beiträge erschienen | ✅ (mit Soft-Hydration) | FEED.3B (`68fa8bf2`): Badge + `flushPendingItems()` — *„Klick auf Badge → Live-Items erscheinen im Feed"*. Soft-Hydration seit Phase-4F (`39125caa`); bewusstes UX-Muster, nicht sofortiges Prepend |

> **Ehrliche Einschränkung:** Vier von fünf Kriterien sind durch Commit-Messages und Repo-Docs belegbar. **Firefox** hat keinen dokumentierten PASS in der Git-Historie. Der Stand `30c98d28` ist dennoch der letzte Commit **vor** allen nachweislich regressionsverursachenden Feed-Sprints auf `main`.

### Was diesen Commit instabil machte (ab `8855ae6c`)

| Commit | Regression |
|--------|------------|
| `8855ae6c` | Perf Batch 1: `will-change:transform` auf Scroll-Container, `UnifiedFeed.jsx`/`FeedEventsSection.jsx` geändert |
| `f18fdc0a` | Feed V2: Rhythm-Engine-Entkopplung — Architekturänderung |
| `cdd953fb` | Feed V3: `_sortKey` entfernt, Demnächst-Bereich — Architekturänderung |
| `356a12cc` | Reality Check: Realtime/Pagination-Fix auf V3-Basis — widerspricht V2/V3-Experimenten |

---

## Aufgabe 2 — Timeline (`30c98d28` → heute)

### Feed-relevante Änderungen auf `main`

| Datum | Commit | PR | Dateien (Feed) | Warum geändert | Kat. |
|-------|--------|-----|----------------|----------------|------|
| 2026-07-13 14:48 | `8855ae6c` | — | `UnifiedFeed.jsx`, `FeedEventsSection.jsx`, `BaseFeedCard.jsx`, `index.css` | Perf Batch 1: lazy images, will-change, Bundle-Split | **B** |
| 2026-07-14 17:40 | `f18fdc0a` | #134 | `useFeedStream.js` | Feed V2: Rhythm Engine vom Haupt-Feed entkoppeln | **C** |
| 2026-07-14 18:06 | `cdd953fb` | #136 | `useFeedStream.js`, `UnifiedFeed.jsx`, `FeedEventsSection.jsx` | Feed V3: chronologische Struktur, Demnächst | **C** |
| 2026-07-14 19:11 | `f8cdb894` | #136 | (merge) | V3-Merge mit Konfliktauflösung in `useFeedStream.js` | **C** |
| 2026-07-14 19:11 | `356a12cc` | #137 | `useFeedStream.js`, `UnifiedFeed.jsx`, `FeedScrollSentinel.jsx` | Reality Check: Realtime sofort sichtbar, IO-Root Fix | **A** |
| 2026-07-14 19:11 | `9042ecfa` | #120 | — (kein Feed-UI) | RC2-Stabilisierung gemergt | **A** |
| 2026-07-15 11:18 | `6f56aa08` | #139 | (Integrations-Merge) | RC1 Integration: Build + Feed + Stabilization | **C** |

### Feed-Änderungen auf parallelen Branches (nicht auf `main`, aber regressionsrelevant)

| Datum | Commit | PR | Dateien | Warum | Kat. |
|-------|--------|-----|---------|-------|------|
| 2026-07-14 10:26 | `0325178f` | #113 | `useFeedStream.js`, `UnifiedFeed.jsx` | P2 Keep-Alive: Tab-Lifecycle pausiert Feed-Realtime | **B** |
| 2026-07-14 12:18 | `8db63ed4` | #115 | `UnifiedFeed.jsx`, `FeedEventsSection.jsx`, `FeedRouter.jsx` | P4: Virtualizer estimateSize 560, Skeleton-Alignment | **B** |
| 2026-07-14 12:29 | `92dc8dd2` | #116 | `UnifiedFeed.jsx` | Hotfix: leerer Scroll-Bereich nach ~5 Karten | **A** |
| 2026-07-14 ~13:00 | `cd0202fb` | #118 | `UnifiedFeed.jsx`, `FeedScrollSentinel.jsx` | Virtualizer-Stabilisierung, Ghost-Items | **D** |
| 2026-07-14 ~14:00 | `f6d61f50` | #121 | `UnifiedFeed.jsx` | Virtualisierung komplett entfernen (Gegenmodell) | **D** |
| 2026-07-14 ~15:00 | `c0d5192d` | #122 | `UnifiedFeed.jsx`, `FeedScrollSentinel.jsx` | Safari IO-Root + content-visibility | **A** |
| 2026-07-14 ~16:00 | `7b8164f0` | #123 | `useFeedStream.js` | Perceived Loading Speed | **B** |
| 2026-07-14 ~17:00 | `8a2b0323` | #124 | `useFeedStream.js`, `UnifiedFeed.jsx` | Runtime-Diagnostik `__HUI_FEED_DEBUG__` | **D** |
| 2026-07-15 12:53 | `18b44a11` | — | `useFeedStream.js` | RC1-003: undefined `invs` spread | **A** |
| 2026-07-15 13:04 | `fcd8b246` | — | `useFeedStream.js` | RC1-004: leerer Feed nach Laden | **A** |
| 2026-07-15 13:20 | `f88bfec3` | — | `useFeedStream.js`, `UnifiedFeed.jsx` | RC1-005: Runtime Truth Instrumentierung | **D** |
| 2026-07-15 14:13 | `32338225` | — | `useFeedStream.js` | RC1-006: invs spread (erneut) | **A** |

### Kategorie-Legende

| Kat. | Bedeutung |
|------|-----------|
| **A** | Fehlerbehebung |
| **B** | Performance |
| **C** | Architektur |
| **D** | Experiment |

---

## Aufgabe 3 — Kategorisierung (Zusammenfassung)

| Kategorie | Commits auf `main` | Commits auf Branches |
|-----------|-------------------|---------------------|
| **A** Fehlerbehebung | `356a12cc`, `9042ecfa` | `92dc8dd2`, `c0d5192d`, `18b44a11`, `fcd8b246`, `32338225` |
| **B** Performance | `8855ae6c` | `0325178f`, `8db63ed4`, `7b8164f0`, `7b883d23` |
| **C** Architektur | `f18fdc0a`, `cdd953fb`, `f8cdb894`, `6f56aa08` | — |
| **D** Experiment | — | `cd0202fb`, `f6d61f50`, `8a2b0323`, `f88bfec3`, `a60822fb` |

---

## Aufgabe 4 — Recovery-Plan

### Übernehmen (auf Recovery-Branch angewendet)

| PR / Change | Commit | Begründung | Status |
|-------------|--------|------------|--------|
| **#131 Dependency Recovery** | `1973165e` | `package.json` bereits korrekt bei `30c98d28` (`@stripe/stripe-js` ✓, Build PASS). Dokumentation `HUI_DEPENDENCY_RECOVERY.md` übernommen | ✅ Bereits erfüllt |
| **#129 Build Recovery** | — | Obsolet — Build auf `30c98d28` erfolgreich ohne Fix | ✅ N/A |
| **#120 RC2 Stabilization** | `39c86269` | P0 Hooks-Fix, Overlay-Leaks, Debug-Log-Guards — **ohne Feed-UI-Dateien** | ✅ Selektiv übernommen |

#### RC2 — selektiv übernommene Dateien

- `src/components/talents/TalentBookingFlow.jsx` — P0-01 Rules of Hooks
- `src/components/home/HomeShell.jsx` — P1-01/02/03 Overlay-Bereinigung
- `src/components/studio/MyRecommendationsModal.jsx` — P1-04 Navigation (manuell, ohne Icon-Migration)
- `src/lib/world/safariPaintRecovery.js` — P1-06 Debug-Guards
- `src/context/OrbWorldContext.jsx`, `WorldSurfaceContext.jsx` — P1-06
- `src/components/chat-center/ChatCenterOverlay.jsx` — P1-06
- `src/system/feed/unifiedNormalizer.js` — P1-06 (Normalizer-Logs, **kein** Feed-UI)
- `HUI_RELEASE_RC2.md`

### Bewusst NICHT übernehmen

| PR / Change | Begründung |
|-------------|------------|
| **#134 Feed V2** | Rhythm-Engine-Entkopplung — Architekturänderung, nicht auf stabilem Stand getestet |
| **#136 Feed V3** | Transparente Struktur, `_sortKey`-Entfernung — widerspricht battle-getesteter Pipeline |
| **#137 Reality Check** | Feed-Fix auf V3-Basis — Teil der widersprüchlichen Sprint-Kette |
| **#139 RC1 Integration** | Merge aller obigen Feed-Änderungen |
| **#111–#115, #117** | Performance-Sprints P1–P5 |
| **#118–#121** | Virtualizer-Experimente (widersprüchliche Ansätze) |
| **#122–#128** | Safari-Hotfixes und CSS-Experimente |
| **#123–#126** | Perceived Speed, Runtime-Diagnostics, iPad-Debug |
| **#132** | Feed-Card-Performance |
| **RC1-003 bis RC1-006** | Weitere Feed-Fixes nach Integration — explizit ausgeschlossen |

---

## Aufgabe 5 — Recovery-Branch

| Feld | Wert |
|------|------|
| **Branch** | `cursor/feed-recovery-base` |
| **Basis** | `30c98d28` (nicht `main`) |
| **Feed-Dateien** | Unverändert gegenüber `30c98d28` |

---

## Aufgabe 7 — Build-Verifikation

Ausgeführt auf `cursor/feed-recovery-base` (2026-07-15):

| Schritt | Ergebnis | Details |
|---------|----------|---------|
| `npm install` | ✅ PASS | Abhängigkeiten aufgelöst |
| `npm run build` | ✅ PASS | Vite build erfolgreich (~5.4s), 722+ Module |

**Basis `30c98d28` allein:** Build PASS (vor RC2-Cherry-Pick)  
**Nach selektivem RC2:** Build PASS

---

## Aufgabe 8 — Scope-Garantie

Auf diesem Branch wurden **keine** Feed-Experimente, Performance-Sprints oder Safari-Hotfixes übernommen.

Unveränderte Feed-UI-Dateien (identisch zu `30c98d28`):

- `src/feed/useFeedStream.js`
- `src/feed/UnifiedFeed.jsx`
- `src/feed/FeedScrollSentinel.jsx`
- `src/feed/FeedEventsSection.jsx`
- `src/feed/cards/FeedRouter.jsx`

---

## Definition of Done

| Kriterium | Status |
|-----------|--------|
| Stabiler Feed-Stand identifiziert | ✅ `30c98d28` mit Belegen |
| Recovery-Branch erstellt | ✅ `cursor/feed-recovery-base` |
| Build erfolgreich | ✅ `npm install` + `npm run build` |
| Keine Feed-Experimente übernommen | ✅ Feed-UI unverändert |
| Saubere Ausgangsbasis für RC1 | ✅ Nur Build/Deps/RC2 |

---

## Nächste Schritte (manuell, außerhalb dieses Sprints)

1. Safari + Firefox Feed-QA auf Recovery-Deploy
2. Entscheidung: Soft-Hydration (Badge) vs. sofortiges Realtime-Prepend — **kein Fix in diesem Sprint**
3. RC1-Bugfixes nur als einzelne, reproduzierbare PRs **nach** Geräte-QA
