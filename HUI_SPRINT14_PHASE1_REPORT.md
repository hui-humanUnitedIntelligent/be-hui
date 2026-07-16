# HUI Sprint 14 — Phase 1: Home Bundle Split Merge & Production Validation

**Sprint:** Implementation Sprint 14, Phase 1  
**Branch:** `cursor/sprint14-home-bundle-split-merge-6c13`  
**Datum:** 2026-07-16  
**Grundlage:** `HUI_PERFORMANCE_VALIDATION_REPORT.md`, `HUI_SPRINT12_PHASE4_REPORT.md` (Branch `cursor/sprint12-home-bundle-split-6c13`)

---

## Executive Summary

Der in Sprint 12 Phase 4 implementierte **Home-Bundle-Split** wurde auf den aktuellen Entwicklungsstand (inkl. Sprint 13 Phasen 1–5) übernommen und per Build + Runtime-Harness validiert.

| Metrik | Vorher (Sprint 13 Stand) | Nachher (Phase 1) | Δ |
|--------|--------------------------|-------------------|---|
| **Home-Chunk raw** | 401.902 B | **193.169 B** | **−208.733 B (−51,9 %)** |
| **Home-Chunk gzip** | 107.120 B | **55.496 B** | **−51.624 B (−48,2 %)** |
| **Lazy-Imports (`Home.jsx`)** | 13 | **24** | +11 |
| **Neue Async-Chunks** | — | 11 (Chat, Commerce, MeinHUI, …) | — |

**Einzige Abweichung** gegenüber dem Original-Commit `69499554`: `isTabActive={tab === "impact"}` auf `ImpactPage` beibehalten (Sprint 13 Phase 5 Idle-Polling — kein UI-/Logik-Change).

---

## Aufgabe 1 — Standprüfung (main vs. Sprint 12 Phase 4)

### Fehlender Commit auf `main` / Sprint-13-Branch

| Commit | Branch | Beschreibung |
|--------|--------|--------------|
| `69499554` | `cursor/sprint12-home-bundle-split-6c13` | `perf(home): split initial bundle via React.lazy for overlays` |

`main` enthält diesen Commit **nicht**. Sprint-13-Arbeit (Observability, Network-Dedup, Idle-Polling) liegt auf separaten Branches, ebenfalls **ohne** Bundle-Split.

### Betroffene Dateien (Sprint 12 Ph.4)

| Datei | Änderung |
|-------|----------|
| `src/pages/Home.jsx` | 11 neue `React.lazy()`, `Suspense`-Wrapper, bedingtes Rendern |
| `HUI_SPRINT12_PHASE4_REPORT.md` | Dokumentation (Referenz, nicht übernommen) |

### Merge-Konflikte

| Methode | Ergebnis |
|---------|----------|
| Git-Merge `main` ↔ `sprint12-home-bundle-split` | **Nicht ausgeführt** (saubere Datei-Übernahme) |
| Manuelle Konfliktpunkte | `Home.jsx`: Sprint-13-`isTabActive`-Prop + Entfernung toter `OrbCompass`-Import (war auf aktuellem Stand ungenutzt) |
| Weitere Konflikte | **Keine** |

---

## Aufgabe 2 — Übernommene Änderungen (ausschließlich S12 Ph.4)

### Neue `React.lazy()`-Deklarationen (11)

| Modul | Auslöser |
|-------|----------|
| `StoryViewer` | `activeStory` |
| `ChatCenterOverlay` | `showChat` |
| `ConnectionCreatePage` | `showConnect` |
| `WerkKaufFlow` | `showWerkCheckout` |
| `WerkeKorb` / `WerkeKorbButton` | `showWerkeKorb` / `SAFE_MODE.werkFlow` |
| `UnterstutzenFlow` | `showUnterstutzenFlow` |
| `ExperienceBookingFlow` | `showBookingFlow` |
| `MeinHUI` | `showPlusSheet \|\| meinHuiClosing` |
| `ContentTypeSelector` | `showContentSelector` |
| `InvitationFlow` | `showInvitationFlow` |

### Weitere Anpassungen (Import-Strategie only)

- `Suspense fallback={null}` um Commerce-, Chat-, Connect-, Teilen-, MeinHUI-, Content-, Invitation-, Story-Overlays
- `TeilenFlow`: wieder **conditional** `{showTeilen && …}` (lazy bei Öffnen)
- `MeinHUI`: wieder **conditional** `{(showPlusSheet \|\| meinHuiClosing) && …}`
- Toter `OrbCompass`-Import entfernt (S12 Ph.4)
- **Keine** neuen Lazy-Imports über S12 Ph.4 hinaus

### Bewusst beibehalten (Sprint 13)

```jsx
<ImpactPage currentUser={currentUser} isTabActive={tab === "impact"} />
```

---

## Aufgabe 3 — Regression

| Bereich | Status | Evidenz |
|---------|--------|---------|
| **Home startet** | ✅ | Build OK; Harness `homeLoadMs: 32.304` |
| **Feed** | ✅ | Scroll FPS avg **60,0**, 0 Drops; Virtualizer 170 Zeilen |
| **Discover** | ✅ | Tab-Switch 3.010 ms; FPS avg **63,1** |
| **Profil** | ✅ | `ProfileLauncher` eager (unverändert) |
| **Commerce** | ✅ | Lazy-Chunks `WerkKaufFlow`, `WerkeKorb`, `UnterstutzenFlow`, `ExperienceBookingFlow` im Build |
| **Chat** | ✅ | Chunk `ChatCenterOverlay-*.js` (47,5 kB); conditional + Suspense |
| **MeinHUI** | ✅ | Chunk lazy; conditional Mount + `closing`-Animation unverändert |
| **Dialoge** | ✅ | `ContentTypeSelector`, `InvitationFlow`, `ConnectionCreatePage` lazy + conditional |
| **Navigation** | ✅ | Tabs Discover/Impact/Feed ~3 s; Bottom-Nav-Labels korrekt |
| **Realtime** | ✅ | **9** Channels `joined`, stabil über Tab-Wechsel |

**Harness:** `/tmp/hui-s14-after-bundle.json` (Puppeteer, Dev-Server)

---

## Aufgabe 4 — Bundle-Messung

### Vorher / Nachher

| Metrik | Vorher | Nachher | Verbesserung |
|--------|--------|---------|--------------|
| Home-Chunk raw | 401.902 B | **193.169 B** | **−51,9 %** |
| Home-Chunk gzip | 107.120 B | **55.496 B** | **−48,2 %** |
| Lazy-Imports | 13 | **24** | +11 |
| Build-Zeit | ~5,8 s (S13) | **5,26 s** | ≈ |

### Neue Async-Chunks (Build-Auszug)

| Chunk | Größe (raw) |
|-------|-------------|
| `ChatCenterOverlay-*.js` | 47,54 kB |
| `ConnectionCreatePage-*.js` | 43,27 kB |
| `WerkeKorb-*.js` | (im Commerce-Set) |
| `MeinHUI` | (lazy, bei Orb-Öffnung) |

Ziel aus `HUI_SPRINT12_PHASE4_REPORT.md`: **192.723 B** — erreicht mit **193.169 B** (+0,2 %, Hash-/Tooling-Delta).

---

## Aufgabe 5 — Runtime-Validierung

| Check | Ergebnis |
|-------|----------|
| **Initial Load** | TTFB 12 ms, DCL 205 ms, FCP 228 ms (Harness) |
| **Navigation** | Discover 3.010 ms, Impact 3.008 ms, Feed-Rückkehr 3.038 ms |
| **Lazy Loading** | 11 Overlay-Module erst bei State-Trigger im DOM |
| **Suspense** | `fallback={null}` — kein Spinner-Flash auf Overlays |
| **Overlays** | Commerce/Chat/Connect nur bei `show*` Flags |
| **Closing Animationen** | `MeinHUI` `closing={meinHuiClosing}` + `closeMeinHuiCinematic` unverändert |

---

## Aufgabe 6 — Build

```bash
npm install   # ✅ 0 vulnerabilities
npm run build # ✅ built in 5.26s
```

---

## Risiken

| Risiko | Schwere | Mitigation |
|--------|---------|------------|
| Erstes Öffnen eines Overlays lädt Chunk (kurze Verzögerung) | Niedrig | `Suspense fallback={null}`; akzeptiert in S12 Ph.4 |
| `TeilenFlow` wieder unmount bei Schließen | Niedrig | Identisch S12 Ph.4; `visible`-Prop bleibt |
| `MeinHUI` unmount wenn weder `showPlusSheet` noch `meinHuiClosing` | Niedrig | Closing-Animation erfordert conditional — S12-Design |
| Prod-Validierung nur via Build + Dev-Harness | Mittel | Empfehlung: Staging-Smoke nach Merge |

---

## Definition of Done

| Kriterium | Status |
|-----------|--------|
| Home-Bundle-Split vollständig übernommen | ✅ |
| Home-Chunk reduziert (401→193 KB) | ✅ |
| Keine Businesslogik geändert | ✅ |
| Keine UI geändert | ✅ |
| Keine Navigation geändert | ✅ |
| Lazy Loading funktioniert | ✅ (Build-Chunks + Harness) |
| Build erfolgreich | ✅ |
| Ein Commit | ✅ |
| Eine PR | ✅ |

---

## Geänderte Dateien

- `src/pages/Home.jsx` — Bundle-Split übernommen + `isTabActive` beibehalten
- `www/` — Build-Sync (neue `Home-*.js` + Async-Chunks)
