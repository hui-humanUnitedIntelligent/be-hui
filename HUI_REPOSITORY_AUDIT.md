# HUI Repository Audit — Phase A (IST-Zustand)

**Datum:** 2026-07-16  
**Branch/Commit:** `328768c6b824098a2afb74d94bfb55b4df594780` (detached HEAD)  
**Methode:** Statische Code-Analyse (Import-Graph inkl. `React.lazy()` / dynamische `import()`), Git-Log, Dateisystem-Scan  
**Keine Codeänderungen, kein Build, kein Commit.**

---

## Executive Summary

Das HUI-Repository ist ein **React/Vite-SPA** mit **265 Source-Dateien** (~94.000 Zeilen in `src/`), zentriert um `App.jsx` als Router und `Home.jsx` als App-Shell. Die produktive Architektur ist funktional, aber durch **historische Altlasten**, **parallele Implementierungen** und **fehlende Konsolidierung** stark fragmentiert.

### Kernerkenntnisse

| Kategorie | Befund |
|-----------|--------|
| **Sicher ungenutzt (0 Importe)** | 4 Dateien in `src/` |
| **Produktiv, aber ohne URL-Route** | 3 Profil-Pages (erreichbar via `ProfileLauncher`) |
| **Doppelte Hooks** | `usePresence.js` + `usePresence.jsx` (unterschiedliche Tabellen/Logik) |
| **Doppelte Profil-Systeme** | 4 parallele Profil-Implementierungen |
| **Root-Altlasten** | 71 SQL-Dateien, 12 HTML-Panels, 3 Backups im Repo-Root |
| **Dokumentierte, aber fehlende Dateien** | 14 in `CODEBASE.md` referenziert, nicht vorhanden |
| **Größte technische Schulden** | `ImpactPage.jsx` (3.400 Z.), `MyBasisProfile.jsx` (2.735 Z.), `useNotifications.jsx` (1.091 Z.) |
| **Cleanup-Potenzial (geschätzt)** | ~15–25 % des Repos (vor allem Root-SQL/HTML/Backups + 4 tote Dateien + Duplikate) |

### Routing-Autorität (belegt)

- **URL-Routing:** `src/App.jsx` (einzige aktive Router-Instanz)
- **Tab/Overlay-Navigation:** `src/pages/Home.jsx` + `src/components/home/HomeShell.jsx`
- **Screen-State-Machine:** `src/core/hui.navigator.jsx` (parallel, nicht URL-basiert)
- **Shadow-Registry:** `src/routes/registry.js` (Dokumentation, kein Einfluss auf Routing)

---

## Repository-Größe

| Metrik | Wert | Quelle |
|--------|------|--------|
| Gesamtdateien (ohne `.git`, `node_modules`) | 808 | `find` |
| Repo-Größe | 47 MB | `du -sh` |
| `src/` Dateien (`.js/.jsx/.ts/.tsx`) | 265 | Dateiscan |
| `src/` Zeilen gesamt | ~94.173 | Zeilenzählung |
| Komponenten (`src/components/`) | 108 | Pfadfilter |
| Custom Hooks (`use*`) | 20 | Dateiname + Inhalt |
| Services (`src/services/`) | 3 | Dateiscan |
| Pages (`src/pages/`, ohne Backups) | 19 | Dateiscan |
| Contexts | 12 | `src/context/` + `*Context*` in `lib/` |
| Utilities (`src/lib/`) | 51 | Dateiscan |
| Supabase-Migrationen (`supabase/migrations/`) | 36 | Dateiscan |
| Root-SQL-Dumps | 71 | Dateiscan |
| Root-HTML-Panels | 12 | Dateiscan |

---

# Aufgabe 1 — Dead Code

## Methodik

Für jede `src/`-Datei wurde ermittelt:
- **Statische Importe** (`import … from`)
- **Dynamische Importe** (`import('…')`, `React.lazy(() => import('…'))`)
- **Exporte** (named + default)
- **Letzter Git-Commit** (`git log -1`)
- **Dateigröße** und **Zeilenanzahl**

### Status-Definitionen

| Status | Kriterium |
|--------|-----------|
| **Produktiv** | Mindestens 1 Importeur (statisch oder dynamisch) in der Import-Kette |
| **Wahrscheinlich ungenutzt** | Nur in Backup-Dateien referenziert, oder dokumentiert als Legacy ohne aktive Referenz |
| **Sicher ungenutzt** | 0 Importeure (statisch + dynamisch), kein Entry-Point |

> **Hinweis:** Dateien mit genau 1 Importeur sind **kein Dead Code** — sie sind Blattknoten im Dependency-Tree (z. B. `MessageBubble.jsx` → nur von `ChatMessages.jsx` importiert). Davon gibt es ~155 Dateien; das ist normal und produktiv.

---

## Sicher ungenutzt (4 Dateien)

| Datei | Pfad | Größe | Zeilen | Letzter Commit | Imports | Exporte | Status |
|-------|------|-------|--------|----------------|---------|---------|--------|
| Architecture CLI | `src/architecture/scanner/cli.js` | 10.624 B | 219 | `89612679` 2026-07-14 | 5 | 1 | **Sicher ungenutzt** |
| Architecture Index | `src/architecture/scanner/index.js` | 1.340 B | 31 | `89612679` 2026-07-14 | 1 | 1 | **Sicher ungenutzt** |
| BuyerConfirmSheet | `src/components/commerce/BuyerConfirmSheet.jsx` | 5.960 B | 119 | `89612679` 2026-07-14 | 4 | 1 | **Sicher ungenutzt** |
| Version | `src/version.ts` | 98 B | 5 | N/A (nicht in Git getrackt) | 0 | 2 | **Sicher ungenutzt** |

**Belege:**
- `BuyerConfirmSheet.jsx`: `grep BuyerConfirmSheet src/` → nur Selbstreferenz
- `version.ts`: kein Import in gesamtem `src/`
- `architecture/scanner/cli.js`: Dev-Tool, nicht in `package.json` Scripts oder `main.jsx` eingebunden

---

## Wahrscheinlich ungenutzt — Backup- und Altlasten (außerhalb Import-Graph)

| Datei | Pfad | Größe | Zeilen | Begründung |
|-------|------|-------|--------|------------|
| ImpactPage Backup | `src/pages/ImpactPage.jsx.bak` | ~155 KB | — | `.bak`-Suffix, kein Import |
| ImpactPage Ranking Backup | `src/pages/ImpactPage.jsx.bak_ranking_20260710_1036` | — | — | `.bak`-Suffix, kein Import |
| MeinHUI Backup | `src/pages/MeinHUI.jsx.v1_backup` | — | — | `.v1_backup`, kein Import |
| TalentBookingFlow Backup | `src/components/talents/backup_20260711_TalentBookingFlow.jsx.bak` | — | — | `.bak`, kein Import |
| Root Backup MyBasisProfile | `backup_20260711_MyBasisProfile_talent_button.jsx.bak` | 110 KB | — | Repo-Root, kein Import |
| Root Backup TalentBookingFlow | `backup_20260711_TalentBookingFlow.jsx.bak` | 22 KB | — | Repo-Root, kein Import |
| Root Backup ProfileHeader | `backup_20260713_ProfileHeader_original.jsx` | 16 KB | — | Repo-Root, kein Import |

---

## CODEBASE.md referenziert, Datei existiert nicht (14)

Dokumentiert in `CODEBASE.md` als aktiv oder Legacy, aber **nicht im Dateisystem**:

```
src/components/ChatPage.jsx
src/components/BookingFlow.jsx
src/components/WirkerProfilePage.jsx
src/components/ProfilePage.jsx
src/components/DiscoveryFeed.jsx
src/components/MeinHUI_SubPages.jsx
src/pages/BookingFlow.jsx
src/pages/ChatPage.jsx
src/components/ChatDetailPage.jsx
src/pages/Diagnose.jsx
src/pages/ImpactPool.jsx
src/pages/Index.jsx
src/lib/mockData.js
src/lib/trustContext.js
```

**Beleg:** `fs.existsSync()` auf alle Pfade → `false`. Chat wurde durch `src/components/chat-center/` ersetzt (belegt via `Home.jsx:29`).

---

## Contexts — Vollständige Liste

| Name | Pfad | Zeilen | Importeure | Status |
|------|------|--------|------------|--------|
| ContentPreviewContext | `src/context/ContentPreviewContext.jsx` | 80 | 15 | Produktiv |
| LiveTickerContext | `src/context/LiveTickerContext.jsx` | 31 | 2 | Produktiv |
| OrbWorldContext | `src/context/OrbWorldContext.jsx` | 149 | 3 | Produktiv |
| RadiusContext | `src/context/RadiusContext.jsx` | 132 | 3 | Produktiv |
| SavedPostsContext | `src/context/SavedPostsContext.jsx` | 40 | 5 | Produktiv |
| WorldSurfaceContext | `src/context/WorldSurfaceContext.jsx` | 213 | 3 | Produktiv |
| AuthContext | `src/lib/AuthContext.jsx` | 459 | 50 | Produktiv |
| AppStateContext | `src/lib/AppStateContext.jsx` | 216 | 5 | Produktiv |
| GuidanceContext | `src/components/guidance/GuidanceContext.jsx` | 137 | 1 | Produktiv (App.jsx Provider) |
| chatContext | `src/lib/chatContext.js` | 704 | 3 | Produktiv |
| bookingContext | `src/lib/bookingContext.js` | 427 | 1 | Produktiv (CreatorStudio) |
| journeyContext | `src/lib/journeyContext.js` | 330 | 1 | Produktiv (CreatorStudio) |

**Anmerkung:** `trustContext.js` (in CODEBASE.md als Phase-3-System gelistet) **existiert nicht**.

---

## Lib-Utilities — Ungenutzte Dateien

**Keine lib-Datei mit 0 Importen** (alle 51 `src/lib/`-Dateien sind in der Import-Kette).

Niedrig genutzte Lib-Dateien (1 Importeur):

| Datei | Importeur |
|-------|-----------|
| `src/lib/bookingContext.js` | `src/pages/CreatorStudio.jsx` |
| `src/lib/journeyContext.js` | `src/pages/CreatorStudio.jsx` |
| `src/lib/sessionHooks.js` | `src/components/home/HomeShell.jsx`, `src/components/HuiCreateFlow.jsx` |
| `src/lib/guidance/readabilityEngine.js` | 1 Consumer |

---

# Aufgabe 2 — Doppelte Komponenten

## Feed

| Name | Pfad | Aufgabe | Unterschiede | Vermutlich produktiv |
|------|------|---------|--------------|---------------------|
| **UnifiedFeed** | `src/feed/UnifiedFeed.jsx` | Haupt-Feed auf Home-Tab | Zentraler Feed-Stream, `useFeedStream`, `FeedRouter` | **Ja** — `Home.jsx:25` |
| **FeedRouter** | `src/feed/cards/FeedRouter.jsx` | Card-Typ-Routing (moment/work/experience/event) | Lazy-Subkomponenten pro Content-Typ | **Ja** — von UnifiedFeed |
| **DiscoverPage** | `src/pages/DiscoverPage.jsx` | Entdecken-Tab mit Kategorien + Modals | Eigene Suche, 6 „Alle ansehen"-Modals, Radius-Filter | **Ja** — `Home.jsx:39` lazy |
| **FeedEventsSection** | `src/feed/FeedEventsSection.jsx` | Event-Sektion im Feed | Teil des Feed-Subsystems | **Ja** — von UnifiedFeed |

**Kein `DiscoveryFeed.jsx`** — in CODEBASE.md dokumentiert, existiert nicht. Ersetzt durch `UnifiedFeed` + `DiscoverPage`.

---

## Home

| Name | Pfad | Aufgabe | Unterschiede | Vermutlich produktiv |
|------|------|---------|--------------|---------------------|
| **Home** | `src/pages/Home.jsx` | App-Shell-Orchestrator | Tabs, Overlays, Commerce, Chat | **Ja** — Route `/Home` |
| **HomeShell** | `src/components/home/HomeShell.jsx` | Layout + State (`useHome`) | Header/Nav-Container, ProfileLauncher | **Ja** — von Home |
| **MeinHUI** | `src/pages/MeinHUI.jsx` | Orb-Wirkungsraum-Overlay | Cinematic Orb-UI, eigener Exit-Flow | **Ja** — `Home.jsx:56` direkt importiert |
| **hui.navigator** | `src/core/hui.navigator.jsx` | Screen-State-Machine | Parallel zu URL-Router, nicht URL-sync | **Teilweise** — importiert von HomeShell, aber Screen-Map überlappt mit Tab-System |

---

## Create

| Name | Pfad | Aufgabe | Unterschiede | Vermutlich produktiv |
|------|------|---------|--------------|---------------------|
| **HuiCreateFlow** | `src/components/HuiCreateFlow.jsx` | Unified Create-Flow (1.783 Z.) | All-in-one Erstellungs-UI | **Ja** — `Home.jsx:63` lazy |
| **TeilenFlow** | `src/components/teilen/TeilenFlow.jsx` | Teilen/Moment erstellen | Fokus auf Social-Sharing | **Ja** — `Home.jsx:45` lazy |
| **WorkFlow** | `src/system/flows/work/WorkFlow.jsx` | Werk-Wizard-Flow | System-Flow mit Steps | **Ja** — `Home.jsx:46` lazy |
| **ExperienceFlow** | `src/system/flows/experience/ExperienceFlow.jsx` | Erlebnis-Wizard | System-Flow | **Ja** — `Home.jsx:47` lazy |
| **ImpactFlow** | `src/system/flows/impact/ImpactFlow.jsx` | Impact-Projekt-Flow (1.727 Z.) | Orb-Node-Flow | **Ja** — `Home.jsx:48` lazy |
| **ConnectionCreatePage** | `src/components/connection-create/ConnectionCreatePage.jsx` | Verbindung erstellen | 3-Step-Wizard | **Ja** — `Home.jsx:31` |
| **ExperienceWizard** | `src/components/experiences/ExperienceWizard.jsx` | Erlebnis-Wizard (alt) | Wird von MyBasisProfile lazy geladen | **Ja** — via MyBasisProfile |
| **WerkWizard** | `src/components/works/WerkWizard.jsx` | Werk-Wizard (alt) | Wird von MyBasisProfile lazy geladen | **Ja** — via MyBasisProfile |
| **StoryComposer** | `src/components/StoryComposer.jsx` | Story erstellen | Kurzformat-Media | **Ja** — `Home.jsx:65` lazy |

**Überschneidung:** `HuiCreateFlow` vs. `system/flows/*` vs. `*Wizard` — drei parallele Create-Architekturen.

---

## Profile

| Name | Pfad | Aufgabe | Unterschiede | Vermutlich produktiv |
|------|------|---------|--------------|---------------------|
| **wirker-profile** | `src/pages/wirker-profile/index.jsx` | Fremdes Profil (URL-Route) | Visitor View, `/profile/:username` | **Ja** — `App.jsx:41` lazy |
| **BasisProfilePage** | `src/pages/BasisProfilePage.jsx` | Basis-User öffentliches Profil | Inline-Overlay, keine URL | **Ja** — `ProfileLauncher.jsx:131` lazy |
| **TalentProfilePage** | `src/pages/TalentProfilePage.jsx` | Talent öffentliches Profil | Erweiterte Stats, Buchung | **Ja** — `ProfileLauncher.jsx:132` lazy |
| **MyBasisProfile** | `src/pages/MyBasisProfile.jsx` | Eigenes Profil (2.735 Z.) | Editierbar, Studio-Modals, Ambassador | **Ja** — `ProfileLauncher.jsx:133` lazy |
| **ProfileLauncher** | `src/components/home/profile/ProfileLauncher.jsx` | Routing-Entscheidung | DB-basiert: talent vs. basis vs. own | **Ja** — von HomeShell |
| **PublicProfilePreview** | `src/components/profile/PublicProfilePreview.jsx` | Vorschau-Modus | Lazy-Wrapper für Basis/Talent | **Ja** — von MyBasisProfile |
| **ProfileHeader** | `src/components/profile/ProfileHeader.jsx` | Kanonischer Header | Shared Section-Komponente | **Ja** — von allen Profil-Pages |
| **sections/** | `src/components/profile/sections/*.jsx` | 10 Shared Sections | About, Works, Moments, etc. | **Ja** — von Profil-Pages |

**Routing-Logik (belegt in `ProfileLauncher.jsx:1-5`):**
```
selectedProfileId → DB → TalentProfilePage | BasisProfilePage
showCreatorDashboard → MyBasisProfile
URL /profile/:username → wirker-profile/index.jsx (separater Pfad)
```

---

## Search

| Name | Pfad | Aufgabe | Unterschiede | Vermutlich produktiv |
|------|------|---------|--------------|---------------------|
| **SearchCommandCenter** | `src/components/home/header/SearchCommandCenter.jsx` | Globaler Such-Overlay | Command-Palette-Stil | **Ja** — HomeHeader |
| **PeopleSearch** | `src/components/discovery/PeopleSearch.jsx` | Personensuche | Discovery-spezifisch | **Ja** — DiscoverPage |
| **userSearch** | `src/features/discovery/userSearch.js` | Such-Utility/Hook | Geo-Radius, Supabase-Query | **Ja** — von DiscoverPage |

---

## Impact

| Name | Pfad | Aufgabe | Unterschiede | Vermutlich produktiv |
|------|------|---------|--------------|---------------------|
| **ImpactPage** | `src/pages/ImpactPage.jsx` | Impact-Hub (3.400 Z.) | Ranking, Voting, Projekte | **Ja** — Route `/impact` + Home-Tab lazy |
| **ImpactFlow** | `src/system/flows/impact/ImpactFlow.jsx` | Impact erstellen (Orb) | Create-Flow, 1.727 Z. | **Ja** — Home lazy |
| **ImpactUpdateSheet** | `src/components/studio/ImpactUpdateSheet.jsx` | Projekt-Update posten | Studio-Modal | **Ja** — via MyBasisProfile |
| **ImpactStimmenModal** | `src/components/studio/ImpactStimmenModal.jsx` | Stimmen-Übersicht | Realtime | **Ja** — via MyBasisProfile |
| **useStripeImpactPool** | `src/hooks/useStripeImpactPool.js` | Stripe Impact Pool | Zahlungslogik | **Ja** — ImpactPage |

**Doppelter Datenfluss:** ImpactPage hat eigene Supabase-Queries; ImpactFlow hat eigene; `coreEngine.js` liefert Wirkungsdaten parallel.

---

## Commerce

| Name | Pfad | Aufgabe | Unterschiede | Vermutlich produktiv |
|------|------|---------|--------------|---------------------|
| **WerkKaufFlow** | `src/components/commerce/WerkKaufFlow.jsx` | Einzelwerk kaufen | Stripe-Checkout | **Ja** — Home.jsx |
| **WerkeKorb** | `src/components/commerce/WerkeKorb.jsx` | Warenkorb (1.231 Z.) | Multi-Item | **Ja** — Home.jsx |
| **UnterstutzenFlow** | `src/components/commerce/UnterstutzenFlow.jsx` | Unterstützung senden | Support-Payments | **Ja** — Home.jsx |
| **ExperienceBookingFlow** | `src/components/commerce/ExperienceBookingFlow.jsx` | Erlebnis buchen | Booking + Payment | **Ja** — Home.jsx |
| **commerceEngine** | `src/services/commerceEngine.js` | Order/Item-Service | Kanonischer Commerce-Service | **Ja** — 2 Importeure |
| **creatorEconomy** | `src/services/creatorEconomy.js` | Wallet/Supports/Sales | Creator-Ökonomie | **Ja** — 5 Importeure |
| **BuyerConfirmSheet** | `src/components/commerce/BuyerConfirmSheet.jsx` | Käufer-Bestätigung Escrow | **0 Importeure** | **Nein — tot** |

---

## Chat

| Name | Pfad | Aufgabe | Unterschiede | Vermutlich produktiv |
|------|------|---------|--------------|---------------------|
| **ChatCenterOverlay** | `src/components/chat-center/ChatCenterOverlay.jsx` | Chat-UI (Overlay) | ConversationList + Room | **Ja** — Home.jsx:29 |
| **chatContext** | `src/lib/chatContext.js` | Chat-State + Realtime (704 Z.) | Messages, Conversations | **Ja** — 3 Importeure |
| **ChatPage.jsx** | — | — | In CODEBASE.md dokumentiert | **Existiert nicht** — ersetzt durch chat-center |

---

## Discover — Ordner-Duplikat

| Ordner | Dateien | Aufgabe |
|--------|---------|---------|
| `src/components/discover/` | 6 Modals (`*AllModal.jsx`) | „Alle ansehen"-Modals in DiscoverPage |
| `src/components/discovery/` | `PeopleSearch.jsx` | Personensuche |
| `src/features/discovery/` | `userSearch.js` | Such-Logik |

**Keine funktionale Duplikation**, aber **inkonsistente Benennung** (`discover` vs. `discovery`).

---

# Aufgabe 3 — Hooks

## Vollständige Liste (20 Custom Hooks)

| Name | Pfad | Verantwortlichkeit | Zeilen | useState | useEffect | Supabase | Importiert von | >500 Z. |
|------|------|-------------------|--------|----------|-----------|----------|----------------|---------|
| useNotifications | `src/lib/useNotifications.jsx` | Notification-Polling + Realtime | 1.091 | 12 | 6 | 8 | 2 | **⚠️ JA** |
| useFeedStream | `src/feed/useFeedStream.js` | Feed-Datenstream + Pagination | 586 | 9 | 5 | 4 | UnifiedFeed | **⚠️ JA** |
| useCoreEngine | `src/hooks/useCoreEngine.js` | Core-Engine-Bridge (Resonanz) | 485 | 12 | 5 | 0 | 3 | — |
| useProfileData | `src/hooks/useProfileData.js` | Profil-Daten laden (shared) | 322 | 10 | 2 | 0 | 4 | — |
| useLiveTicker | `src/hooks/useLiveTicker.js` | Live-Ticker-Daten | 293 | 3 | 2 | 12 | LiveTickerContext | — |
| useReactions | `src/lib/useReactions.jsx` | Reaktionen (Herz etc.) | 282 | 5 | 6 | 9 | 5 | — |
| useAmbassador | `src/hooks/useAmbassador.js` | Ambassador-Status | 210 | 7 | 3 | 3 | 2 | — |
| usePresence (v2) | `src/lib/usePresence.jsx` | Presence via `user_presence` + Realtime | 191 | 2 | 3 | 1 | BaseFeedCard | — |
| useTalents | `src/hooks/useTalents.js` | Talent-Angebote CRUD | 181 | 4 | 3 | 5 | 2 | — |
| useAmbassadorPayout | `src/hooks/useAmbassadorPayout.js` | Ambassador-Auszahlungen | 177 | 8 | 2 | 1 | 1 | — |
| useToast | `src/lib/useToast.jsx` | Toast-Notifications | 142 | 3 | 3 | 0 | 11 | — |
| useUsernameCheck | `src/lib/useUsernameCheck.jsx` | Username-Verfügbarkeit | 132 | 3 | 2 | 1 | 1 | — |
| useCartPersistence | `src/hooks/useCartPersistence.js` | Warenkorb localStorage | 125 | 3 | 6 | 0 | 1 | — |
| useTalentBookings | `src/hooks/useTalentBookings.js` | Talent-Buchungen | 121 | 5 | 3 | 4 | 1 | — |
| useProfileLocations | `src/hooks/useProfileLocations.js` | Profil-Standorte | 119 | 3 | 2 | 4 | 1 | — |
| useProfileId | `src/hooks/useProfileId.js` | Username → Profile-ID | 92 | 4 | 3 | 0 | 1 | — |
| useStripeImpactPool | `src/hooks/useStripeImpactPool.js` | Stripe Impact Pool | 87 | 5 | 2 | 0 | 1 | — |
| useMySales | `src/hooks/useMySales.js` | Eigene Verkäufe | 70 | 4 | 3 | 0 | 1 | — |
| usePresence (v1) | `src/lib/usePresence.js` | Presence via `profiles.last_seen_at` | 60 | 0 | 2 | 0 | 4 | — |
| useRadiusFilter | `src/hooks/useRadiusFilter.js` | Geo-Radius-Filter | 30 | 1 | 0 | 0 | 2 | — |

### ⚠️ Hooks über 500 Zeilen

1. **`useNotifications.jsx`** — 1.091 Zeilen, 12 useState, 6 useEffect, 8 Supabase-Calls
2. **`useFeedStream.js`** — 586 Zeilen, 9 useState, 5 useEffect, 4 Supabase-Calls

### Redundanter Hook: usePresence (Doppelimplementierung)

| Version | Datei | Tabelle | Exporte | Importeure |
|---------|-------|---------|---------|------------|
| v1 | `src/lib/usePresence.js` | `profiles.last_seen_at` | `usePresence`, `formatPresence` | Home, DiscoverPage, ConversationCard, ChatHeader |
| v2 | `src/lib/usePresence.jsx` | `user_presence` + Realtime | `usePresence`, `PresenceDot`, `fmtPresence` | BaseFeedCard |

**Beleg:** Beide exportieren `usePresence` mit unterschiedlicher Signatur und Datenquelle.

---

# Aufgabe 4 — Services

## `src/services/` (3 Dateien)

| Service | Pfad | Zweck | Import-Anzahl | Verantwortlichkeit | Überschneidungen |
|---------|------|-------|---------------|-------------------|-------------------|
| **db.js** | `src/services/db.js` | Core DB Layer (668 Z.) | 12 | ProfileService, WorkService, ExperienceService, BookingService, ChatService, ImpactService, cachedQuery | Direkte `supabase.from()` in vielen Components trotz Regel |
| **commerceEngine.js** | `src/services/commerceEngine.js` | Commerce 2.0 (455 Z.) | 2 | Orders, Items, Shipping, Snapshots, Events | Überschneidung mit `creatorEconomy.salesService` |
| **creatorEconomy.js** | `src/services/creatorEconomy.js` | Creator Economy (263 Z.) | 5 | walletService, supportService, salesService, analyticsService, bookingService | Überschneidung mit commerceEngine bei Orders/Sales |

## Engine-Services (außerhalb `services/`)

| Service | Pfad | Zweck | Imports | Überschneidungen |
|---------|------|-------|---------|------------------|
| coreEngine | `src/core/coreEngine.js` | Wirkungsdaten / Impact Truth | 4 | Parallel zu ImpactPage-Queries |
| orbEngine | `src/core/orbEngine.js` | Orb-World-Logik | 4 | — |
| resonanceEngine | `src/core/resonanceEngine.js` | Resonanz-Berechnung | 2 | useCoreEngine |
| HuiConnectionEngine | `src/core/HuiConnectionEngine.jsx` | Verbindungen | 1 | — |
| feedRhythmEngine | `src/feed/feedRhythmEngine.js` | Feed-Rhythmus | 1 | useFeedStream |
| commentsService | `src/lib/commentsService.js` | Kommentare | 4 | — |
| notificationService | `src/lib/notificationService.js` | Notifications | 3 | useNotifications (parallel) |

### Service-Überschneidungen (belegt)

1. **Commerce:** `commerceEngine.createOrder()` vs. `creatorEconomy.salesService` — beide schreiben Orders
2. **Profile:** `ProfileService` (db.js) vs. direkte `supabase.from('profiles')` in 20+ Dateien
3. **Notifications:** `notificationService.js` vs. `useNotifications.jsx` (1.091 Z.) — parallele Notification-Logik
4. **Presence:** `usePresence.js` (profiles) vs. `usePresence.jsx` (user_presence)

---

# Aufgabe 5 — Pages

## Vollständige Page-Liste

| Page | Pfad | Route | Importiert? | Erreichbar? | Produktiv? | Veraltet? |
|------|------|-------|-------------|-------------|------------|-----------|
| Home | `src/pages/Home.jsx` | `/Home` | ✅ App.jsx lazy | ✅ | ✅ | — |
| LoginPage | `src/pages/LoginPage.jsx` | `/login` | ✅ App.jsx eager | ✅ | ✅ | — |
| AuthCallback | `src/pages/AuthCallback.jsx` | `/auth/callback` | ✅ App.jsx eager | ✅ | ✅ | — |
| ImpactPage | `src/pages/ImpactPage.jsx` | `/impact` + Home-Tab | ✅ App.jsx + Home lazy | ✅ | ✅ | — |
| Admin | `src/pages/Admin.jsx` | `/Admin` | ✅ App.jsx lazy | ✅ | ✅ | — |
| DiagnosePage | `src/pages/DiagnosePage.jsx` | `/diagnose` | ✅ App.jsx lazy | ✅ | ✅ (Dev) | — |
| PlatformDashboard | `src/pages/PlatformDashboard.jsx` | `/dashboard` | ✅ App.jsx lazy | ✅ | ✅ (Admin) | — |
| CreatorStudio | `src/pages/CreatorStudio.jsx` | `/studio`, `/studio/:section` | ✅ App.jsx lazy | ✅ | ✅ | — |
| WirkerProfile | `src/pages/wirker-profile/index.jsx` | `/profile/:username` | ✅ App.jsx lazy | ✅ | ✅ | — |
| RefRedirect | `src/pages/RefRedirect.jsx` | `/ref/:username`, `/:username` | ✅ App.jsx lazy | ✅ | ✅ | — |
| DiscoverPage | `src/pages/DiscoverPage.jsx` | Home-Tab (kein URL) | ✅ Home.jsx lazy | ✅ | ✅ | — |
| LiveMapPage | `src/pages/LiveMapPage.jsx` | Home-Overlay | ✅ Home.jsx lazy | ✅ | ✅ | — |
| FavoritesPage | `src/pages/FavoritesPage.jsx` | Home-Tab | ✅ Home.jsx lazy | ✅ | ✅ | — |
| MeinHUI | `src/pages/MeinHUI.jsx` | Home-Overlay (Orb) | ✅ Home.jsx direkt | ✅ | ✅ | — |
| CreatorDashboard | `src/pages/CreatorDashboard.jsx` | Home-Overlay | ✅ Home.jsx lazy | ✅ | ✅ | — |
| BasisProfilePage | `src/pages/BasisProfilePage.jsx` | **Keine URL** | ✅ ProfileLauncher lazy | ✅ Overlay | ✅ | — |
| TalentProfilePage | `src/pages/TalentProfilePage.jsx` | **Keine URL** | ✅ ProfileLauncher lazy | ✅ Overlay | ✅ | — |
| MyBasisProfile | `src/pages/MyBasisProfile.jsx` | **Keine URL** | ✅ ProfileLauncher lazy | ✅ Overlay | ✅ | — |
| MeineResonanz | `src/pages/studio/MeineResonanz.jsx` | CreatorStudio intern | ✅ MyBasisProfile lazy | ✅ | ✅ | — |
| MeineTicketsPage | `src/pages/studio/MeineTicketsPage.jsx` | CreatorStudio intern | ✅ CreatorStudio | ✅ | ✅ | — |
| StudioSubPages | `src/pages/studio/StudioSubPages.jsx` | CreatorStudio intern | ✅ CreatorStudio | ✅ | ✅ | — |
| SupportPage | `src/pages/studio/SupportPage.jsx` | CreatorStudio intern | ✅ CreatorStudio | ✅ | ✅ | — |

### Backups (nicht erreichbar)

| Page | Pfad | Status |
|------|------|--------|
| ImpactPage.bak | `src/pages/ImpactPage.jsx.bak` | Veraltet |
| ImpactPage.bak_ranking | `src/pages/ImpactPage.jsx.bak_ranking_20260710_1036` | Veraltet |
| MeinHUI.v1_backup | `src/pages/MeinHUI.jsx.v1_backup` | Veraltet |

### Pages in CODEBASE.md, nicht vorhanden

`BookingFlow.jsx`, `ChatPage.jsx`, `Diagnose.jsx`, `ImpactPool.jsx`, `Index.jsx` — **gelöscht oder nie migriert**.

---

# Aufgabe 6 — Datenbank

## Migrationen

### Aktive Migrationen (`supabase/migrations/` — 36 Dateien)

```
007_media_stories_pipeline.sql
20260608_block_delete.sql
20260609_works_approval_system.sql
20260611_experiences_approval_system.sql
20260611_previous_data_snapshot.sql
20260627_052_commerce_p0_security.sql
20260627_053_cart_hash_aborted_status.sql
20260627_054_commerce_infrastructure_sync.sql
20260627_057_commerce_schema_final.sql
20260704_058_impact_pool_stripe_payments_fix.sql
20260704_059_user_impact_totals.sql
20260704_060_talents_system.sql
20260705_061_talent_services.sql
20260705_062_orders_seller_select_rls.sql
20260705_063_talent_bookings_table.sql
20260705_064_talent_booking_rpcs.sql
20260706_065_drop_stale_focus_type_check.sql
20260706_067_geo_radius_search.sql
20260706_068_geo_invitations.sql
20260708_069_saved_posts_realtime.sql
20260708_070_saved_posts_replica_identity.sql
20260708_071_talent_month_availability.sql
20260708_072_merken_impact_signal.sql
20260709_072_impact_voting_engine.sql
20260709_073_comments_system.sql
20260709_073_rpc_process_order_fees_distribution.sql
20260709_074_deep_link_slugs_usernames.sql
20260710_074_impact_milestones.sql
20260710_075_balanced_growth_talent_booking_fees.sql
20260710_076_rpc_evaluate_phase_transition.sql
20260710_076_rpc_get_all_transactions_balanced_growth.sql
20260710_077_fix_rpc_process_order_fees_bg_v1.sql
20260711_077_escrow_system.sql
20260711_078_fix_rpc_process_order_fees.sql
phase1.sql
```

### Root-SQL-Altlasten (71 Dateien)

Nicht in `supabase/migrations/`, sondern im Repo-Root:
- 44× `hui_0xx_*.sql` (Entwicklungs-/Deploy-Skripte)
- 18× `ambassador_*.sql` (iterative Fixes)
- 9× `stripe_*.sql`
- `HUI_COMMERCE_COMPLETE_MIGRATION.sql` (48 KB)

**Status:** Historische Deploy-Artefakte, nicht als kanonische Migrationen eingebunden.

### Doppelte Migrationen (gleiche Tabelle in mehreren Dateien)

| Tabelle | Vorkommen in |
|---------|-------------|
| webhook_events | `052`, `054`, `057` |
| commerce_events | `054`, `057` |
| creator_wallets | `054`, `057` |
| creator_payouts | `054`, `057` |
| shipments | `054`, `057` |
| impact_rounds | `054`, `057` |

**Beleg:** `CREATE TABLE` in `20260627_054_commerce_infrastructure_sync.sql` und `20260627_057_commerce_schema_final.sql`.

### Doppelte Migrationsnummern

| Nummer | Dateien |
|--------|---------|
| 072 | `072_merken_impact_signal.sql`, `072_impact_voting_engine.sql` |
| 073 | `073_comments_system.sql`, `073_rpc_process_order_fees_distribution.sql` |
| 074 | `074_deep_link_slugs_usernames.sql`, `074_impact_milestones.sql` |
| 076 | `076_rpc_evaluate_phase_transition.sql`, `076_rpc_get_all_transactions_balanced_growth.sql` |
| 077 | `077_fix_rpc_process_order_fees_bg_v1.sql`, `077_escrow_system.sql` |

---

## Tabellen — Code vs. Migrationen

### Tabellen im Code, nicht in `supabase/migrations/` (54)

Diese Tabellen werden per `.from('…')` referenziert, aber nicht in den kanonischen Migrationen gefunden (können via Root-SQL oder älteren Deploys existieren):

```
ambassador_ref_links, ambassadors_applications, availability_slots, beitraege,
booking_events, chat_participants, chats, comments, connections, conversations,
core_connections, core_content_signals, core_profiles, core_resonance_chains,
core_resonance_stats, core_signals, creator_analytics, creator_supports,
experience_bookings, experiences, feed_items, follows, hui_payments,
impact_applications, impact_monthly_results, impact_project_updates, impact_projects,
impact_score_failures, impact_votes, invitations, memberships, messages, moments,
order_items, payments, platform_events, post_reactions, profile_locations,
profile_relations, profile_watchlist, profiles, project_support, projects,
recommendations, saved_posts, user_match_scores, user_presence, user_recommendations,
wirker, wirker_profiles, work_likes, work_sales, work_saves, works
```

### Tabellen in Migrationen, nicht im Frontend-Code (4)

```
creator_payouts, escrow_disputes, impact_distributions, webhook_events
```

**Interpretation:** Server-seitig / Edge-Functions / zukünftige Features — kein direkter Frontend-Zugriff belegt.

---

# Aufgabe 7 — Bundle (nach Zeilen)

## Größte Dateien gesamt (Top 20)

| Rang | Datei | Zeilen | Kategorie |
|------|-------|--------|-----------|
| 1 | `src/pages/ImpactPage.jsx` | 3.400 | Page |
| 2 | `src/pages/MyBasisProfile.jsx` | 2.735 | Page |
| 3 | `src/pages/DiscoverPage.jsx` | 2.264 | Page |
| 4 | `src/components/HuiCreateFlow.jsx` | 1.783 | Component |
| 5 | `src/system/flows/impact/ImpactFlow.jsx` | 1.727 | Flow |
| 6 | `src/pages/TalentProfilePage.jsx` | 1.425 | Page |
| 7 | `src/pages/Admin.jsx` | 1.311 | Page |
| 8 | `src/components/HuiMembershipFlow.jsx` | 1.247 | Component |
| 9 | `src/components/commerce/WerkeKorb.jsx` | 1.231 | Component |
| 10 | `src/components/teilen/TeilenFlow.jsx` | 1.102 | Component |
| 11 | `src/lib/useNotifications.jsx` | 1.091 | Hook |
| 12 | `src/components/experiences/ExperienceWizard.jsx` | 1.061 | Component |
| 13 | `src/pages/wirker-profile/index.jsx` | 935 | Page |
| 14 | `src/components/studio/MeineProjekteModal.jsx` | 879 | Component |
| 15 | `src/pages/FavoritesPage.jsx` | 875 | Page |
| 16 | `src/pages/Home.jsx` | 866 | Page |
| 17 | `src/components/WorkDetailPage.jsx` | 823 | Component |
| 18 | `src/pages/LiveMapPage.jsx` | 825 | Page |
| 19 | `src/components/ambassador/AmbassadorStudioSection.jsx` | 785 | Component |
| 20 | `src/components/works/WerkWizard.jsx` | 772 | Component |

## Größte Komponenten (Top 10)

1. `HuiCreateFlow.jsx` — 1.783 Z.
2. `HuiMembershipFlow.jsx` — 1.247 Z.
3. `WerkeKorb.jsx` — 1.231 Z.
4. `TeilenFlow.jsx` — 1.102 Z.
5. `ExperienceWizard.jsx` — 1.061 Z.
6. `MeineProjekteModal.jsx` — 879 Z.
7. `WorkDetailPage.jsx` — 823 Z.
8. `AmbassadorStudioSection.jsx` — 785 Z.
9. `WerkWizard.jsx` — 772 Z.
10. `HuiStudio.jsx` — ~700 Z.

## Größte Hooks (Top 5)

1. `useNotifications.jsx` — 1.091 Z. ⚠️
2. `useFeedStream.js` — 586 Z. ⚠️
3. `useCoreEngine.js` — 485 Z.
4. `useProfileData.js` — 322 Z.
5. `useLiveTicker.js` — 293 Z.

## Größte Pages (Top 10)

1. `ImpactPage.jsx` — 3.400 Z.
2. `MyBasisProfile.jsx` — 2.735 Z.
3. `DiscoverPage.jsx` — 2.264 Z.
4. `TalentProfilePage.jsx` — 1.425 Z.
5. `Admin.jsx` — 1.311 Z.
6. `wirker-profile/index.jsx` — 935 Z.
7. `FavoritesPage.jsx` — 875 Z.
8. `Home.jsx` — 866 Z.
9. `LiveMapPage.jsx` — 825 Z.
10. `BasisProfilePage.jsx` — ~666 Z.

---

# Aufgabe 8 — Architektur

## Circular Dependencies

### Echte Zyklen (2 Dateien)

| Zyklus | Beleg |
|--------|-------|
| `HomeShell.jsx` ↔ `HuiActionProvider.jsx` | Gegenseitige Imports |

### Selbst-Referenzen (kein echter Zyklus — barrel/token files)

```
coreEngine.js, orbEngine.js, resonanceEngine.js, hui.pillars.js, hui.sources.js,
hui.design.js, hui.interaction.js, HuiRegistry.js, useToast.jsx, TalentBadge.jsx,
userSearch.js
```

Diese Dateien importieren sich selbst nicht wirklich — der Detektor findet interne Re-Exports.

---

## Doppelte Datenflüsse

| Bereich | Flow A | Flow B | Beleg |
|---------|--------|--------|-------|
| **Feed** | `useFeedStream` → UnifiedFeed | DiscoverPage eigene Queries | Beide laden `works`, `experiences`, `moments` |
| **Impact** | `ImpactPage` direkte Supabase-Queries | `coreEngine.js` | Beide lesen Impact-Daten |
| **Profile** | `ProfileService` (db.js) | Direkte `supabase.from('profiles')` | 20+ Dateien umgehen Service-Layer |
| **Presence** | `usePresence.js` → `profiles` | `usePresence.jsx` → `user_presence` | Zwei parallele Systeme |
| **Notifications** | `useNotifications.jsx` | `notificationService.js` | Parallele Logik |
| **Commerce** | `commerceEngine.js` | `creatorEconomy.js` | Orders/Sales in beiden |

---

## Doppelte State-Verwaltung

| State | Quelle 1 | Quelle 2 |
|-------|----------|----------|
| Navigation | URL-Router (`App.jsx`) | `hui.navigator.jsx` Screen-State |
| Tab-State | `HomeShell.useHome()` | `OrbWorldContext` |
| Auth | `AuthContext` | `AuthGate.jsx` (Gate-Logik) |
| Saved Posts | `SavedPostsContext` | `MerkenSection` eigener Channel |
| Radius | `RadiusContext` | DiscoverPage (früher eigener State, jetzt global) |
| Cart | `useCartPersistence` (localStorage) | `WerkeKorb` interner State |

---

## Doppelte Repositories

| Domäne | Repository A | Repository B |
|--------|-------------|-------------|
| Profile | `ProfileService` (db.js) | Direkte Supabase-Calls |
| Works | `WorkService` (db.js) | Inline in WorkDetailPage |
| Chat | `chatContext.js` | Chat-Center-Komponenten (eigene Queries) |
| Comments | `commentsService.js` | `CommentsSheet.jsx` (Realtime) |

---

## Doppelte Caches

| Cache | Ort | TTL |
|-------|-----|-----|
| Query-Cache | `perfUtils.cachedQuery` | 60s (ProfileService) |
| Cart | `useCartPersistence` → localStorage | Persistent |
| Draft | `sessionHooks.useDraftPersist` | sessionStorage |
| Welcome | `welcomePersistence.js` | localStorage |
| Profile Complete | `localStorage hui_profile_completed` | Persistent |
| Chunk Reload | `sessionStorage chunk_boundary_reloaded` | Session |

---

## Doppelte Realtime-Logik (25 Dateien)

Dateien mit `.channel()`, `.subscribe()` oder `realtime`:

```
App.jsx, AmbassadorStudioSection.jsx, NotificationPanel.jsx, MerkenSection.jsx,
CommentsSheet.jsx, ImpactStimmenModal.jsx, SavedPostsContext.jsx, useFeedStream.js,
useAmbassadorPayout.js, useLiveTicker.js, useMySales.js, useProfileLocations.js,
useStripeImpactPool.js, useTalentBookings.js, useTalents.js, AppStateContext.jsx,
bookingContext.js, chatContext.js, commentsService.js, useNotifications.jsx,
usePresence.jsx, useReactions.jsx, Admin.jsx, ImpactPage.jsx, MyBasisProfile.jsx,
PlatformDashboard.jsx, TalentProfilePage.jsx
```

**Risiko:** Mehrfache Channels auf dieselben Tabellen (z. B. `saved_posts`, `messages`, `profiles`) ohne zentrale Subscription-Verwaltung.

---

# Aufgabe 9 — Cleanup-Kandidaten

## A — Sicher entfernbar

| Datei/Ordner | Begründung |
|--------------|------------|
| `src/components/commerce/BuyerConfirmSheet.jsx` | 0 Importeure (statisch + dynamisch) |
| `src/version.ts` | 0 Importeure, nicht in Git getrackt |
| `src/architecture/scanner/cli.js` + `index.js` | Dev-Tool, 0 externe Importeure (Scanner-Submodule nur intern) |
| `src/pages/ImpactPage.jsx.bak` | Backup, kein Import |
| `src/pages/ImpactPage.jsx.bak_ranking_20260710_1036` | Backup, kein Import |
| `src/pages/MeinHUI.jsx.v1_backup` | Backup, kein Import |
| `src/components/talents/backup_20260711_TalentBookingFlow.jsx.bak` | Backup, kein Import |
| `backup_20260711_MyBasisProfile_talent_button.jsx.bak` | Root-Backup, 110 KB |
| `backup_20260711_TalentBookingFlow.jsx.bak` | Root-Backup |
| `backup_20260713_ProfileHeader_original.jsx` | Root-Backup |
| 71 Root-SQL-Dateien | Nicht in `supabase/migrations/`, historische Deploy-Skripte |
| 12 Root-HTML-Panels (`hui_*_panel.html`, etc.) | Deploy-Dokumentation, kein Code-Import |
| `F7D_mybasisprofile_migration.patch` | Einmaliger Migrations-Patch |

---

## B — Wahrscheinlich entfernbar

| Datei/Ordner | Begründung |
|--------------|------------|
| `src/lib/usePresence.js` (v1) | Wenn `usePresence.jsx` (v2) vollständig migriert — aktuell noch 4 Importeure |
| `CODEBASE.md` veraltete Einträge | 14 referenzierte Dateien existieren nicht — Doku bereinigen |
| `src/pages/CreatorDashboard.jsx` | Overlap mit MyBasisProfile Studio-Bereich; nur 1 Importeur (Home lazy) |
| Doppelte Create-Flows (`*Wizard` vs. `system/flows/*`) | Wenn HuiCreateFlow kanonisch wird |
| `hui.navigator.jsx` | Overlap mit URL-Router + HomeShell Tab-State; nur HomeShell importiert |
| Root `ambassador_*.sql` (18 Varianten) | Iterative Fixes, durch finale Migration ersetzt |
| `debug_compare.json` | Debug-Artefakt im Root |

---

## C — Vor Entfernen prüfen

| Datei/Ordner | Begründung |
|--------------|------------|
| `src/pages/MyBasisProfile.jsx` (2.735 Z.) | Produktiv via ProfileLauncher, aber massiv — Refactoring-Kandidat, nicht Löschung |
| `src/pages/ImpactPage.jsx` (3.400 Z.) | Produktiv (Route + Tab), aber größte Datei — Splitting prüfen |
| `src/pages/TalentProfilePage.jsx` vs. `wirker-profile/index.jsx` | Zwei Fremdprofil-Implementierungen — Konsolidierung prüfen |
| `src/pages/BasisProfilePage.jsx` vs. `TalentProfilePage.jsx` | Routing via ProfileLauncher — Zusammenlegung mit sections/ prüfen |
| `src/lib/bookingContext.js` | Nur CreatorStudio — prüfen ob in db.js integrierbar |
| `src/lib/journeyContext.js` | Nur CreatorStudio — prüfen ob in db.js integrierbar |
| `src/services/commerceEngine.js` vs. `creatorEconomy.js` | Überschneidende Order-Logik — Merge prüfen |
| `useNotifications.jsx` (1.091 Z.) | Produktiv aber monolithisch — Split in Service + Hook |
| `supabase/migrations/phase1.sql` | Unnummeriert, möglicherweise Basis-Migration |
| Tabellen nur im Code (54) | Prüfen ob via Root-SQL deployed oder veraltet |

---

# Aufgabe 10 — Abschlussbericht

## Zusammenfassung der Zahlen

| Metrik | Anzahl |
|--------|--------|
| Gesamtdateien | 808 |
| `src/` Source-Dateien | 265 |
| `src/` Zeilen | ~94.173 |
| Komponenten | 108 |
| Custom Hooks | 20 |
| Services (`src/services/`) | 3 |
| Engine-Services (core/lib/feed) | 9 |
| Pages (produktiv) | 19 |
| Pages (Backups) | 3 |
| Contexts | 12 |
| Lib-Utilities | 51 |
| Sicher ungenutzt | 4 |
| Backup-Dateien | 7 (src + root) |
| Root-SQL-Altlasten | 71 |
| Root-HTML-Panels | 12 |
| Supabase-Migrationen | 36 |
| Doppelte Migrationstabellen | 6 |
| Circular Dependencies (echt) | 1 Paar |
| Realtime-Dateien | 25 |
| Hooks > 500 Zeilen | 2 |

## Größte Dateien

1. `ImpactPage.jsx` — 3.400 Zeilen
2. `MyBasisProfile.jsx` — 2.735 Zeilen
3. `DiscoverPage.jsx` — 2.264 Zeilen

## Cleanup-Potenzial

| Kategorie | Geschätztes Volumen | Risiko |
|-----------|-------------------|--------|
| Root-SQL/HTML/Backups | ~2–3 MB, 86 Dateien | Niedrig (nicht im Build) |
| Tote src-Dateien | 4 Dateien, ~17 KB | Niedrig |
| src-Backups | 3 Dateien, ~300 KB | Niedrig |
| Doku-Bereinigung (CODEBASE.md) | 14 veraltete Referenzen | Kein Code-Risiko |
| usePresence-Duplikat | 1 von 2 Dateien | Mittel (4 Importeure auf v1) |
| Profil-Konsolidierung | 4 Pages → 1–2 | Hoch (Breaking Changes) |
| Create-Flow-Konsolidierung | 3 Systeme → 1 | Hoch |
| ImpactPage-Splitting | 1 Datei → Module | Mittel |

**Gesamt-Cleanup-Potenzial:** ~15–25 % des Repos (vor allem Altlasten außerhalb `src/`), plus signifikante Reduktion der Komplexität durch Konsolidierung der 4 Profil- und 3 Create-Systeme.

## Technische Schulden (priorisiert)

1. **Monolithische Pages** — ImpactPage (3.400 Z.), MyBasisProfile (2.735 Z.), DiscoverPage (2.264 Z.)
2. **Monolithischer Hook** — useNotifications (1.091 Z.)
3. **4 parallele Profil-Systeme** — wirker-profile, BasisProfilePage, TalentProfilePage, MyBasisProfile
4. **3 parallele Create-Architekturen** — HuiCreateFlow, system/flows/*, *Wizard
5. **Doppeltes Presence-System** — usePresence.js vs. usePresence.jsx
6. **Service-Layer-Lücken** — ProfileService-Regel wird in 20+ Dateien umgangen
7. **71 Root-SQL-Dateien** — nicht versioniert in supabase/migrations
8. **Doppelte Commerce-Services** — commerceEngine + creatorEconomy
9. **25 Realtime-Subscriptions** — keine zentrale Verwaltung
10. **CODEBASE.md veraltet** — 14 nicht-existierende Dateien dokumentiert
11. **HomeShell ↔ HuiActionProvider Zyklus**
12. **Parallele Navigation** — URL-Router + hui.navigator + HomeShell Tab-State

## Empfohlene Reihenfolge der Bereinigung

### Phase 1 — Risikofrei (sofort)
1. Root-Backups löschen (3 `.bak`-Dateien)
2. `src/`-Backups löschen (3 Dateien)
3. `BuyerConfirmSheet.jsx`, `version.ts` entfernen
4. Root-SQL/HTML in `archive/` verschieben oder `.gitignore`
5. `CODEBASE.md` aktualisieren (14 veraltete Referenzen)

### Phase 2 — Niedriges Risiko
6. `usePresence.js` (v1) → `usePresence.jsx` (v2) migrieren, v1 entfernen
7. Architecture-Scanner in `scripts/` oder Dev-Dependency auslagern
8. Doppelte Migrationsnummern in supabase/migrations bereinigen (nur Doku/Rename)

### Phase 3 — Mittleres Risiko (nach Review)
9. `useNotifications.jsx` in Service + Hook splitten
10. ImpactPage in Module aufteilen (Ranking, Voting, Projects)
11. Commerce-Services konsolidieren (commerceEngine + creatorEconomy)
12. ProfileService-Regel durchsetzen (direkte supabase.from() entfernen)

### Phase 4 — Hohes Risiko (eigener Sprint)
13. Profil-Pages konsolidieren (4 → 2: own + visitor)
14. Create-Flows konsolidieren (HuiCreateFlow als Single Entry)
15. Navigation vereinheitlichen (URL-Router als einzige Quelle)
16. Realtime-Subscriptions zentralisieren

---

## Anhang: Import-Graph Entry Points

```
main.jsx
  └── App.jsx
        ├── LoginPage, AuthCallback (eager)
        ├── Home (lazy) ──→ [gesamte App-Shell]
        │     ├── UnifiedFeed, DiscoverPage, ImpactPage, FavoritesPage
        │     ├── ProfileLauncher → BasisProfilePage | TalentProfilePage | MyBasisProfile
        │     ├── ChatCenterOverlay, WerkeKorb, Commerce-Flows
        │     └── MeinHUI, OrbCompass, Create-Flows
        ├── ImpactPage (lazy, /impact)
        ├── WirkerProfilePage (lazy, /profile/:username)
        ├── WorkDetailPage (lazy, /work/:id)
        ├── CreatorStudio (lazy, /studio)
        ├── Admin, DiagnosePage, PlatformDashboard (lazy)
        └── RefRedirect (lazy, /:username)
```

---

*Ende des Audit-Berichts. Keine Codeänderungen vorgenommen.*
