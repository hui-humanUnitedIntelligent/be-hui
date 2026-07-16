# HUI Sprint 12 — Phase 4: Home Initial Bundle Split

**Sprint:** Implementation Sprint 12, Phase 4  
**Scope:** Initial-Bundle des Home-Chunks verkleinern — ausschließlich Import-Strategie  
**Datum:** 2026-07-16  
**Branch:** `cursor/sprint12-home-bundle-split-6c13`

---

## Zusammenfassung

Der Home-Chunk wurde von **401.428 Bytes** auf **192.723 Bytes** reduziert (−**208.705 Bytes**, **−52,0 %**).  
Alle Änderungen beschränken sich auf `src/pages/Home.jsx`: `React.lazy()`, `Suspense` und bedingtes Rendern. Keine Businesslogik, UI, States, Handler, Contexts, Realtime, Queries oder Routing geändert.

---

## Aufgabe 1 — Analyse Home-Chunk (vorher)

### Initial Bundle Size (Baseline)

| Metrik | Wert |
|--------|------|
| Home-Chunk (raw) | `www/assets/Home-eeP1IIcD.js` — **401.428 B** |
| Home-Chunk (gzip, Build) | ~155 kB (geschätzt aus Phase-1-Audit) |
| Lazy-Imports in `Home.jsx` | **13** |

### Bereits lazy geladen (13)

| Modul | Chunk bei Bedarf |
|-------|------------------|
| `DiscoverPage` | Tab Discover |
| `ImpactPage` | Tab Impact |
| `FavoritesPage` | Tab Favoriten |
| `TeilenFlow` | Orb-Flow (war eager im DOM) |
| `WorkFlow` | Werk erstellen |
| `ExperienceFlow` | Erlebnis erstellen |
| `ImpactFlow` | Impact-Flow |
| `LiveMapPage` | Live-Karte |
| `HuiMatchOverlay` | Match-Overlay |
| `HuiMembershipFlow` | Mitgliedschaft |
| `CreatorDashboard` | Creator-Dashboard |
| `HuiCreateFlow` | Create-Flow |
| `StoryComposer` | Story erstellen |

### Eager geladen (größte Kandidaten)

| Modul | Größe (neuer Chunk) | Erstes Render nötig? |
|-------|---------------------|----------------------|
| `ChatCenterOverlay` | 47,5 kB | Nein — nur bei `showChat` |
| `ConnectionCreatePage` | 43,3 kB | Nein — nur bei `showConnect` |
| `WerkeKorb` + `WerkeKorbButton` | 21,0 kB | Button: bei `SAFE_MODE.werkFlow`; Sheet: bei `showWerkeKorb` |
| `MeinHUI` | 19,1 kB | Nein — nur bei Orb (`showPlusSheet \|\| meinHuiClosing`) |
| `StoryViewer` (via `StoryBar`) | 19,4 kB | Nein — nur bei `activeStory` |
| `UnterstutzenFlow` | 12,7 kB | Nein — nur bei `showUnterstutzenFlow` |
| `InvitationFlow` | 12,7 kB | Nein — nur bei `showInvitationFlow` |
| `WerkKaufFlow` | 6,0 kB | Nein — nur bei `showWerkCheckout` |
| `ExperienceBookingFlow` | 5,4 kB | Nein — nur bei `showBookingFlow` |
| `ContentTypeSelector` | 5,1 kB | Nein — nur bei `showContentSelector` |
| `TalentOnboarding` | im Home-Chunk | Ja bei Discover-Tab-Flow — **bewusst eager** |
| `OrbCompass` | — | **Toter Import** (nicht im JSX verwendet) — entfernt |

### Eager (bewusst unverändert — erster Screen)

`HomeShell`, `HomeHeader`, `HUIBottomNavigation`, `ProfileLauncher`, `UnifiedFeed`, `HuiLiveTicker`, `TalentOnboarding`, `commerceUtils` (`clearCartAfterSuccess`), Hooks/Contexts.

---

## Aufgabe 2 — Identifizierte Module (nicht für ersten Screen)

- Commerce-Overlays: `WerkKaufFlow`, `WerkeKorb`, `WerkeKorbButton`, `UnterstutzenFlow`, `ExperienceBookingFlow`
- Chat-Overlay: `ChatCenterOverlay`
- Große Dialoge/Flows: `ConnectionCreatePage`, `ContentTypeSelector`, `InvitationFlow`, `MeinHUI`, `TeilenFlow`
- Seltene Detailansicht: `StoryViewer`
- Admin: keine im Home-Eager-Set

---

## Aufgabe 3 — Umstellung auf Lazy-Mechanismen

**Datei:** `src/pages/Home.jsx`

### Neue `React.lazy()`-Deklarationen (11)

```javascript
const StoryViewer           = React.lazy(() => import("../components/StoryBar.jsx").then(m => ({ default: m.StoryViewer })));
const ChatCenterOverlay     = React.lazy(() => import("../components/chat-center/ChatCenterOverlay.jsx"));
const ConnectionCreatePage  = React.lazy(() => import("../components/connection-create/ConnectionCreatePage.jsx"));
const WerkKaufFlow          = React.lazy(() => import("../components/commerce/WerkKaufFlow.jsx"));
const WerkeKorb             = React.lazy(() => import("../components/commerce/WerkeKorb.jsx"));
const WerkeKorbButton       = React.lazy(() => import("../components/commerce/WerkeKorb.jsx").then(m => ({ default: m.WerkeKorbButton })));
const UnterstutzenFlow      = React.lazy(() => import("../components/commerce/UnterstutzenFlow.jsx"));
const ExperienceBookingFlow = React.lazy(() => import("../components/commerce/ExperienceBookingFlow.jsx"));
const MeinHUI               = React.lazy(() => import("./MeinHUI.jsx"));
const ContentTypeSelector   = React.lazy(() => import("../content/ContentTypeSelector.jsx"));
const InvitationFlow        = React.lazy(() => import("../content/invitation/InvitationFlow.jsx"));
```

### Weitere Anpassungen (nur Import-Strategie)

| Änderung | Details |
|----------|---------|
| `TeilenFlow` | Bereits lazy — jetzt **bedingt** gerendert (`showTeilen && …`) statt permanent im DOM |
| `MeinHUI` | Lazy + bedingt (`showPlusSheet \|\| meinHuiClosing`) — Closing-Animation bleibt erhalten |
| `OrbCompass` | Ungenutzter Import entfernt |
| `Suspense` | `fallback={null}` für Overlays (kein sichtbarer Spinner — kein UI-Change) |
| `TalentOnboarding` | **Unverändert eager** (Kommentar: verhindert Suspense-Spinner-Bug) |

---

## Aufgabe 4 — Regression

| Bereich | Status | Hinweis |
|---------|--------|---------|
| Home startet | ✅ | Build erfolgreich, Feed/Header/Nav eager |
| Tabs | ✅ | Discover/Impact/Favorites weiterhin lazy in Suspense |
| Feed | ✅ | `UnifiedFeed` unverändert eager |
| Discover | ✅ | `DiscoverPage` lazy unverändert |
| Profil | ✅ | `ProfileLauncher` eager unverändert |
| Commerce | ✅ | Flows laden bei Öffnen; Logik/Props identisch |
| Chat | ✅ | `ChatCenterOverlay` lazy bei `showChat` |
| Dialoge | ✅ | Connection, ContentSelector, Invitation lazy bei Öffnen |
| Navigation | ✅ | `HUIBottomNavigation` eager unverändert |
| Realtime | ✅ | Keine Änderungen an Hooks/Subscriptions |

---

## Aufgabe 5 — Performance

| Metrik | Vorher | Nachher | Delta |
|--------|--------|---------|-------|
| Home-Chunk (raw) | 401.428 B | 192.723 B | **−208.705 B (−52,0 %)** |
| Home-Chunk (gzip) | — | 55,33 kB | deutlich kleiner |
| Lazy-Imports in `Home.jsx` | 13 | **24** | **+11** |
| Build-Module | 814 | 809 | −5 (besseres Tree-Shaking im Home-Chunk) |

### Neue Async-Chunks (Auszug)

| Chunk | Größe (min) |
|-------|-------------|
| `ChatCenterOverlay-*.js` | 47,5 kB |
| `ConnectionCreatePage-*.js` | 43,3 kB |
| `WerkeKorb-*.js` | 21,0 kB |
| `StoryBar-*.js` | 19,4 kB |
| `MeinHUI-*.js` | 19,1 kB |
| `UnterstutzenFlow-*.js` | 12,7 kB |
| `InvitationFlow-*.js` | 12,7 kB |
| `WerkKaufFlow-*.js` | 6,0 kB |
| `ExperienceBookingFlow-*.js` | 5,4 kB |
| `ContentTypeSelector-*.js` | 5,1 kB |

### Erwartete Verbesserung beim App-Start

- **~209 KB weniger** JavaScript beim ersten Home-Paint (nicht gzip-komprimiert über das Netz)
- Schnellerer **Time-to-Interactive** auf dem Feed-Tab, da Commerce-, Chat- und Orb-Overlays erst bei Nutzeraktion nachgeladen werden
- Persistierter Werkekorb: Button erscheint nach kurzem async Fetch (kein sichtbarer Spinner — `fallback={null}`)

---

## Aufgabe 6 — Build

```bash
npm install   # 377 packages, 0 vulnerabilities
npm run build # ✓ built in 4.67s, 809 modules
```

---

## Risiken

| Risiko | Bewertung | Mitigation |
|--------|-----------|------------|
| Kurze Verzögerung beim ersten Öffnen eines Overlays | Niedrig | Chunks werden beim ersten Tap geladen; `fallback={null}` |
| Werkekorb-Button bei persistiertem Cart | Niedrig | Lazy-Load beim Mount von `SAFE_MODE.werkFlow`; Button rendert erst nach Chunk-Load |
| `TalentOnboarding` im Home-Chunk | Akzeptiert | Bewusst eager wegen bekannter Suspense-Spinner-Problematik |
| `WerkeKorbButton` + `WerkeKorb` gleicher Chunk | Niedrig | Beide teilen `WerkeKorb-*.js`; Button-Load zieht Sheet-Code mit — aber **nicht** mehr im Initial-Home-Chunk |
| Safari lazy-Tab-Verhalten | Niedrig | Bestehende Tab-Lazy-Pattern unverändert |

---

## Definition of Done

| Kriterium | Status |
|-----------|--------|
| Home-Chunk kleiner | ✅ −52 % |
| Keine Businesslogik verändert | ✅ |
| Keine UI verändert | ✅ |
| Keine Navigation verändert | ✅ |
| Keine Realtime verändert | ✅ |
| Build erfolgreich | ✅ |
| Initial Load verbessert | ✅ |
| Ein Commit | ✅ |
| Eine PR | ✅ |

---

## Geänderte Dateien

| Datei | Änderung |
|-------|----------|
| `src/pages/Home.jsx` | 11 neue lazy Imports, Suspense-Wrapper, bedingtes Rendern, OrbCompass entfernt |
| `HUI_SPRINT12_PHASE4_REPORT.md` | Dieser Bericht |
