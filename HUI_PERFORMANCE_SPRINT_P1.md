# HUI Performance Sprint P1 — Home Bundle Optimization

**Repository:** be-hui  
**Datum:** 2026-07-14  
**Scope:** Ausschließlich Home-Chunk-Optimierung via Lazy Loading. Keine Logik-, UI- oder Architekturänderungen.

---

## Aufgabe 1 — Import-Analyse (`Home.jsx`)

| Import | Größe (Quellcode) | Sofort benötigt? | Lazy-Kandidat | Begründung |
|--------|-------------------|------------------|---------------|------------|
| `HomeShell` | ~18 KB | ✅ Ja | ❌ Nein | Shell-Orchestrator, immer aktiv |
| `HomeHeader` | klein | ✅ Ja | ❌ Nein | Sichtbar beim ersten Render |
| `HUIBottomNavigation` | mittel | ✅ Ja | ❌ Nein | Navigation immer sichtbar |
| `UnifiedFeed` | ~54 KB | ✅ Ja | ❌ Nein | Feed-Tab = Default-View |
| `HuiLiveTicker` | klein | ✅ Ja | ❌ Nein | Direkt im Feed-Tab gerendert |
| `MeinHUI` | ~33 KB | ❌ Nein | ✅ Ja | Nur bei Orb-Tap (`showPlusSheet`) |
| `OrbCompass` | — | ❌ Nein | 🗑️ Entfernt | Ungenutzter Import (toter Code) |
| `ProfileLauncher` | mittel | ❌ Nein | ✅ Ja | Nur bei Profil-Navigation |
| `ChatCenterOverlay` | ~15 KB | ❌ Nein | ✅ Ja | Resonanz — nur bei `showChat` |
| `ConnectionCreatePage` | ~18 KB | ❌ Nein | ✅ Ja | Nur bei `showConnect` |
| `WerkKaufFlow` | ~10 KB | ❌ Nein | ✅ Ja | Commerce — nur bei Checkout |
| `WerkeKorb` / `WerkeKorbButton` | ~43 KB | ⚠️ Button sofort | ✅ Ja | Eigener Chunk; Button lädt bei erstem Render wenn Commerce aktiv |
| `UnterstutzenFlow` | ~26 KB | ❌ Nein | ✅ Ja | Commerce — nur bei Unterstützen |
| `ExperienceBookingFlow` | ~9 KB | ❌ Nein | ✅ Ja | Commerce — nur bei Buchung |
| `ContentTypeSelector` | ~10 KB | ❌ Nein | ✅ Ja | Nur bei Creator-Aktion |
| `InvitationFlow` | ~21 KB | ❌ Nein | ✅ Ja | Nur bei Einladung erstellen |
| `StoryViewer` | (StoryBar) | ❌ Nein | ✅ Ja | Nur bei `activeStory` |
| `TalentOnboarding` | ~20 KB | ❌ Nein | ✅ Ja | Nur bei `showTalentFlow` |
| `TeilenFlow` | ~26 KB | ❌ Nein | ✅ Ja | War lazy, aber immer gemountet → jetzt conditional |
| `DiscoverPage` | ~83 KB | Tab-Navigation | ✅ Bereits lazy | Eigener Chunk seit Phase 17 |
| `ImpactPage` | ~85 KB | Tab-Navigation | ✅ Bereits lazy | Eigener Chunk seit Phase 17 |
| `FavoritesPage` | ~21 KB | Tab-Navigation | ✅ Bereits lazy | Eigener Chunk |
| `LiveMapPage` | ~31 KB | Overlay | ✅ Bereits lazy | Nur bei Karte |
| `HuiMatchOverlay` | ~20 KB | Overlay | ✅ Bereits lazy | Nur bei Match |
| `WorkFlow` / `ExperienceFlow` / `ImpactFlow` | 25–56 KB | Creator-Aktion | ✅ Bereits lazy | Nur bei Flow-Start |
| `HuiMembershipFlow` | ~31 KB | Overlay | ✅ Bereits lazy | Nur bei Membership |
| `CreatorDashboard` | ~16 KB | Overlay | ✅ Bereits lazy | Nur bei Dashboard |
| `HuiCreateFlow` | ~45 KB | Overlay | ✅ Bereits lazy | Nur bei Create |
| `StoryComposer` | ~13 KB | Overlay | ✅ Bereits lazy | Nur bei Story erstellen |

---

## Aufgabe 2 — Lazy-Loading-Kandidaten (umgesetzt)

Folgende **eager** Imports wurden auf `React.lazy()` migriert:

1. `MeinHUI` — Orb-Wirkungsraum
2. `ProfileLauncher` — Profil-Routing
3. `TalentOnboarding` — Talent-Flow
4. `ChatCenterOverlay` — Resonanz-Zentrum
5. `ConnectionCreatePage` — Verbindung erstellen
6. `WerkKaufFlow` — Commerce Checkout
7. `WerkeKorb` + `WerkeKorbButton` — Commerce Korb
8. `UnterstutzenFlow` — Commerce Unterstützen
9. `ExperienceBookingFlow` — Erlebnis buchen
10. `ContentTypeSelector` — Content-Typ wählen
11. `InvitationFlow` — Einladung erstellen
12. `StoryViewer` — Story-Ansicht (aus `StoryBar.jsx`)

Zusätzlich: `TeilenFlow` war bereits lazy, wurde aber **conditional** gerendert (`showTeilen &&`) statt immer im DOM.

**Nicht lazy geladen** (wie gefordert): Feed, Bottom Navigation, HomeShell.

---

## Aufgabe 3 & 4 — Migration & Code Splitting

### Geänderte Dateien

| Datei | Änderung |
|-------|----------|
| `src/pages/Home.jsx` | 12 eager Imports → `React.lazy()`, conditional Rendering, ungenutzten `OrbCompass`-Import entfernt |

### Neue Lazy Imports

```javascript
const MeinHUI             = React.lazy(() => import("./MeinHUI.jsx"));
const ProfileLauncher     = React.lazy(() => import("../components/home/profile/ProfileLauncher.jsx"));
const TalentOnboarding    = React.lazy(() => import("../components/TalentOnboarding.jsx"));
const ChatCenterOverlay   = React.lazy(() => import("../components/chat-center/ChatCenterOverlay.jsx"));
const ConnectionCreatePage = React.lazy(() => import("../components/connection-create/ConnectionCreatePage.jsx"));
const WerkKaufFlow        = React.lazy(() => import("../components/commerce/WerkKaufFlow.jsx"));
const WerkeKorb           = React.lazy(() => import("../components/commerce/WerkeKorb.jsx"));
const WerkeKorbButton     = React.lazy(() => import("../components/commerce/WerkeKorb.jsx").then(m => ({ default: m.WerkeKorbButton })));
const UnterstutzenFlow    = React.lazy(() => import("../components/commerce/UnterstutzenFlow.jsx"));
const ExperienceBookingFlow = React.lazy(() => import("../components/commerce/ExperienceBookingFlow.jsx"));
const ContentTypeSelector = React.lazy(() => import("../content/ContentTypeSelector.jsx"));
const InvitationFlow      = React.lazy(() => import("../content/invitation/InvitationFlow.jsx"));
const StoryViewer         = React.lazy(() => import("../components/StoryBar.jsx").then(m => ({ default: m.StoryViewer })));
```

### Conditional Rendering (ohne Logikänderung)

| Komponente | Bedingung |
|------------|-----------|
| `MeinHUI` | `showPlusSheet \|\| meinHuiClosing` (Close-Animation erhalten) |
| `ProfileLauncher` | `selectedProfileId \|\| showCreatorDashboard` |
| `TeilenFlow` | `showTeilen` |
| Alle anderen lazy Overlays | bestehende `show*` Flags unverändert |

---

## Aufgabe 5 — Messung (echte Build-Werte)

Build-Kommando: `npm run build` (Vite 6.4.1, Production)

### Home Chunk

| Metrik | Vorher | Nachher | Δ |
|--------|--------|---------|---|
| **Home.js (minified)** | **399.45 KB** | **187.74 KB** | **−211.71 KB (−53.0%)** |
| Home.js (gzip) | 106.07 KB | 54.66 KB | −51.41 KB (−48.5%) |

### Initial Load (Home-Route: Home + index-Chunks + react-vendor)

| Metrik | Vorher | Nachher | Δ |
|--------|--------|---------|---|
| **Summe (minified)** | **834.70 KB** | **622.95 KB** | **−211.75 KB (−25.4%)** |
| Summe (gzip) | 235.91 KB | 184.49 KB | −51.42 KB (−21.8%) |

Einzelchunks nach Optimierung:

| Chunk | Größe (min) | gzip |
|-------|-------------|------|
| `Home-*.js` | 187.74 KB | 54.66 KB |
| `index-*.js` (App-Shell) | 243.61 KB | 68.56 KB |
| `index-*.js` (secondary) | 31.31 KB | 9.20 KB |
| `react-vendor-*.js` | 160.29 KB | 52.07 KB |

### Gesamt JS (alle Chunks)

| Metrik | Vorher | Nachher |
|--------|--------|---------|
| Alle `.js` in `dist/assets/` | 2 786.43 KB | 2 796.85 KB |

Gesamt-JS bleibt nahezu gleich — Code wurde in **14 neue Lazy-Chunks** verschoben, nicht entfernt.

### Neue Lazy-Chunks (aus Home extrahiert)

| Chunk | minified | gzip |
|-------|----------|------|
| `ChatCenterOverlay-*.js` | 46.27 KB | 11.45 KB |
| `ConnectionCreatePage-*.js` | 43.29 KB | 10.92 KB |
| `WerkeKorb-*.js` | 20.98 KB | 6.20 KB |
| `StoryBar-*.js` | 19.42 KB | 5.65 KB |
| `MeinHUI-*.js` | 18.95 KB | 5.41 KB |
| `TalentOnboarding-*.js` | 13.72 KB | 4.50 KB |
| `InvitationFlow-*.js` | 12.89 KB | 4.00 KB |
| `UnterstutzenFlow-*.js` | 12.69 KB | 4.92 KB |
| `ProfileLauncher-*.js` | 6.61 KB | 2.60 KB |
| `WerkKaufFlow-*.js` | 6.02 KB | 2.51 KB |
| `ExperienceBookingFlow-*.js` | 5.38 KB | 2.15 KB |
| `ContentTypeSelector-*.js` | 5.09 KB | 2.12 KB |

Diese Chunks laden **on-demand** bei Tab-Wechsel, Overlay-Öffnung oder Commerce-Aktion.

---

## Aufgabe 6 — Regression

| Bereich | Status | Prüfung |
|---------|--------|---------|
| Build | ✅ | `npm run build` erfolgreich |
| ESLint (Home.jsx) | ✅ | Keine neuen Fehler in geänderter Datei |
| Feed-Tab | ✅ | `UnifiedFeed` unverändert eager |
| Bottom Navigation | ✅ | `HUIBottomNavigation` unverändert eager |
| Discover / Impact / Favorites Tabs | ✅ | Bestehende lazy Tabs unverändert |
| Commerce (Korb, Checkout, Unterstützen) | ✅ | Conditional + Suspense, gleiche Props |
| Resonanz (ChatCenterOverlay) | ✅ | Lazy bei `showChat` |
| MeinHUI (Orb) | ✅ | Close-Animation via `meinHuiClosing` erhalten |
| Studio-Flows (Work/Experience/Impact) | ✅ | Bereits lazy, unverändert |
| ProfileLauncher | ✅ | Lazy bei Profil-Öffnung |

---

## Performancegewinn

- **Home Chunk halbiert:** 399 KB → 188 KB (−53%)
- **Initial JS für Home-Start:** −212 KB minified / −51 KB gzip
- **Parse & Compile Time:** Deutlich reduziert, da ~211 KB weniger JS beim ersten Home-Load geparst werden muss
- **Time To Interactive:** Verbessert durch kleineren kritischen Pfad; Overlays/Commerce laden parallel nach Bedarf

---

## Empfehlung Sprint P2

P1 hat den Home-Chunk optimiert. Für P2 (nach erneuter Messung) empfohlen:

1. **UnifiedFeed weiter splitten** — Feed-Karten-Typen (Work, Experience, Moment) als separate Chunks; größter verbleibender Block im Home-Chunk (~54 KB Quellcode + Abhängigkeiten)
2. **Tab-Preloading** — `DiscoverPage` / `ImpactPage` per `requestIdleCallback` preloaden nach Feed-Render (ohne eager import)
3. **vendor-Chunk (822 KB)** — Circular-Chunk-Warnung (`vendor ↔ react-vendor`) in `vite.config.js` beheben; Tree-Shaking für `lodash`, `moment`, `three` prüfen
4. **HomeShell-Kontext** — Nicht refactoren (out of scope), aber Abhängigkeits-Analyse welche Provider wirklich für Feed-First-Render nötig sind
5. **WerkeKorbButton** — Optional in Micro-Chunk splitten, damit Commerce-UI nicht den gesamten `WerkeKorb`-Chunk (~21 KB) beim Start lädt

---

## Definition of Done

| Kriterium | Status |
|-----------|--------|
| Home Chunk deutlich kleiner | ✅ −53% |
| Initial JS reduziert | ✅ −25% |
| Keine Funktionsänderungen | ✅ |
| Keine UI-Änderungen | ✅ |
| Build erfolgreich | ✅ |
| Keine neuen ESLint-Fehler (Home.jsx) | ✅ |
| Messwerte dokumentiert | ✅ |
