# HUI Consumer App — Performance Audit V1

**Repository:** be-hui  
**Scope:** Ausschließlich die HUI Consumer-App (SPA unter `src/`)  
**Ausgeschlossen:** Admin Dashboard, Server/Supabase Functions, Architektur-Refactoring  
**Datum:** 2026-07-14  
**Methode:** Statische Code-Analyse + Production-Build-Messung + Lighthouse (lokal, Vite Preview)  
**Keine Codeänderungen durchgeführt.**

---

## Executive Summary

Die HUI Consumer-App fühlt sich auf iPad und Smartphones träge an, weil **beim ersten Öffnen von `/Home` sehr viel JavaScript geparst werden muss**, **mehrere Haupt-Tabs gleichzeitig im DOM bleiben und Daten laden**, und **viele parallele Supabase-Requests** ohne zentrales Caching laufen. Die wichtigsten nutzer spürbaren Engpässe:

| Bereich | Kernbefund | Nutzerwirkung |
|---------|-----------|---------------|
| **Startup / Bundle** | Kritischer JS-Pfad ~**1.619 KB minified** (~**490 KB gzip**) vor Interaktivität auf `/Home` | Langer weißer/Spinner-Zustand, spätes TTI |
| **Keep-Alive Tabs** | Feed + Home (Discover) + Impact werden **gleichzeitig gemountet** | Tabwechsel fühlt sich schwer an; Hintergrund-Rendering |
| **Netzwerk** | **30–45+ Supabase-Queries** im ersten Home-Load (geschätzt, siehe §9) | Langsamer Feed-Aufbau, sichtbare Nachlader |
| **Rendering** | `HomeShell`-Context mit **40+ Dependencies** → jeder Overlay-State triggert Full-Tree-Re-Render | Ruckeln bei Navigation, Modals, Suche |
| **Mein HUI** | **6 gestaffelte CSS-Animationen** + **4 permanente Keyframe-Loops** + `backdrop-filter` | Spürbar langsamer Aufbau des Wirkungsraums |
| **Medien** | **Kein `srcset`/`sizes`** im gesamten `src/`; Originalbild-URLs direkt | Hoher Speicher-/Decode-Druck beim Scrollen |
| **Feed** | Feed-Cache **bewusst deaktiviert**; Virtualisierung erst ab **7+ Items** | Feed wirkt beim Öffnen „schwer“ |

**Lighthouse-Hinweis:** Messungen auf `/` und `/login` zeigen nur den **unauthentifizierten** Pfad (Redirect → `HUILoader` bzw. Login). Der authentifizierte Consumer-Pfad (`/Home` + `Home`-Chunk) ist deutlich schwerer — siehe Build-Messwerte unten.

| Metrik | `/login` Mobile (CPU 4×, Lighthouse) | Bedeutung |
|--------|--------------------------------------|-----------|
| FCP | **3,0 s** | Erster Paint auf Login |
| LCP | **4,7 s** | Größtes sichtbares Element |
| TTI | **4,7 s** | Interaktivität |
| Render-Blocking | Google Fonts Inter (**~220 ms**) | `index.html:42-44` |

**Build-Messung (`npm run build`, 2026-07-14):**

| Chunk | Minified | Gzip | Rolle |
|-------|----------|------|-------|
| `vendor-*.js` | 822 KB | 254 KB | Shared Vendor (u.a. html2canvas, jspdf) |
| `Home-*.js` | **399 KB** | **106 KB** | Home-Shell + Feed + Overlays |
| `index-eRf-*.js` | 244 KB | 69 KB | App-Core, Provider, Auth |
| `react-vendor-*.js` | 160 KB | 52 KB | React |
| **Kritischer Pfad `/Home`** | **~1.619 KB** | **~490 KB** | Muss vor Feed-Interaktion geladen/geparst werden |

---

## 1. Startup

### 1.1 Kritischer Pfad (Reihenfolge)

```
index.html
  → Google Fonts (render-blocking)
  → /src/main.jsx
      → initSentry()                    [src/lib/sentry.js]
      → index.css
      → App.jsx
          → 11 Provider-Kaskade
          → AuthProvider Bootstrap      [src/lib/AuthContext.jsx]
          → lazy: Home chunk            [src/pages/Home.jsx]
              → HomeShell + 4 Keep-Alive-Tabs
              → UnifiedFeed + useFeedStream
              → DiscoverPage (lazy chunk, aber sofort gemountet)
              → ImpactPage (lazy chunk, aber sofort gemountet)
```

**Dateien:** `index.html`, `src/main.jsx`, `src/App.jsx`, `src/pages/Home.jsx`

### 1.2 Messwerte (belegbar)

| Metrik | Wert | Quelle |
|--------|------|--------|
| FCP (Login, Mobile 4× CPU) | 3,0 s | Lighthouse `/login` |
| LCP (Login, Mobile 4× CPU) | 4,7 s | Lighthouse `/login` |
| TTI (Login, Mobile 4× CPU) | 4,7 s | Lighthouse `/login` |
| Render-Blocking | Google Fonts ~220 ms | Lighthouse `render-blocking-resources` |
| JS kritischer Pfad | ~1.619 KB min / ~490 KB gzip | `dist/assets/` Build-Analyse |
| Auth-Profile-Timeout | 8.000 ms max | `AuthContext.jsx:50-51` `withTimeout(..., 8000)` |
| Auth-Loader-Timeout | 25.000 ms | `App.jsx:284` `HUILoader` |

### 1.3 Was blockiert den Start?

| Blocker | Datei | Beweis |
|---------|-------|--------|
| **Render-blocking Google Fonts** | `index.html:42-44` | Externe CSS-Request vor First Paint |
| **Sentry + BrowserTracing + Replay** | `src/lib/sentry.js:26-50` | Init in `main.jsx:9` vor React-Render |
| **11 verschachtelte Provider** | `src/App.jsx:752-780` | Jeder mountet synchron Subtree |
| **Auth-Gate** | `src/App.jsx:345-355` | `ProtectedRoute` zeigt `HUILoader` bis `authChecked` |
| **Profile-Load** | `src/lib/AuthContext.jsx:44-78` | Blockiert `loadingProfile`; bis 8 s Timeout |
| **Home Lazy-Chunk 399 KB** | `dist/assets/Home-*.js` | Größter Feature-Chunk |
| **Vendor-Chunk 822 KB** | `dist/assets/vendor-*.js` | Enthält u.a. `html2canvas`, `jspdf` (nicht Startup-kritisch, aber im Vendor) |
| **StrictMode** | `src/main.jsx:32-34` | Doppelte Effects in Development |

### 1.4 Sofort geladene Daten (nach Auth)

| Datenquelle | Trigger | Datei |
|-------------|---------|-------|
| User-Profil | `AuthProvider` mount | `src/lib/AuthContext.jsx` |
| Notification-Badge-Count | `AppStateProvider` + 60 s Poll | `src/lib/AppStateContext.jsx:52-77` |
| Follow-IDs | `AppStateProvider` | `src/lib/AppStateContext.jsx:79+` |
| LiveTicker (10 Quellen) | `LiveTickerProvider` mount + 60 s | `src/hooks/useLiveTicker.js:251-288` |
| Saved Posts | `SavedPostsProvider` | `src/context/SavedPostsContext.jsx` |
| Feed Page 1 | `useFeedStream` `initialLoad` | `src/feed/useFeedStream.js:817` |
| „Heute auf HUI“ Stats | `FeedWelcomeHeader` mount | `src/feed/UnifiedFeed.jsx:51-93` |
| Feed Events | `FeedEventsSection` mount | `src/feed/FeedEventsSection.jsx:137-149` |
| Discover-Sektionen | `DiscoverPage` mount (Keep-Alive) | `src/pages/DiscoverPage.jsx:1727+` |
| Impact-Daten | `ImpactPageInner` mount (Keep-Alive) | `src/pages/ImpactPage.jsx` |
| Chat-Liste | `useChatList("home")` in Home | `src/pages/Home.jsx:180`, `src/lib/chatContext.js:96+` |
| Presence Heartbeat | `usePresence` | `src/lib/usePresence.jsx:43-53` |

### 1.5 Provider-Hierarchie (Startup-blockierend)

```
ErrorBoundary → BrowserRouter → AuthProvider → AuthGateProvider
  → AppEntryController → AppStateProvider → WorldSurfaceProvider
  → OrbWorldProvider → RadiusProvider → SavedPostsProvider
  → LiveTickerProvider → ContentPreviewProvider → GuidanceProvider
  → AppRoutes → ProtectedRoute → Home
    → HomeShell: NavigatorProvider → FlowCtx → HomeCtx → HuiActionProvider
```

**Dateien:** `src/App.jsx:748-783`, `src/components/home/HomeShell.jsx:370-382`

---

## 2. React Rendering

> **Hinweis zur Methodik:** Exakte Re-Render-Zähler pro Seite erfordern React DevTools Profiler zur Laufzeit. Dieses Audit dokumentiert **strukturelle Re-Render-Risiken** mit Codepfaden. Alle Angaben sind ohne Profiler als „strukturell belegt“ markiert.

### 2.1 Übersicht pro Hauptseite

| Seite | Datei | Re-Render-Risiko | memo | useMemo | useCallback |
|-------|-------|------------------|------|---------|-------------|
| **Entdecken (Feed)** | `src/feed/UnifiedFeed.jsx` | Hoch — `useFeedStream` State-Updates, `resolvedItems` | `LazyCard` only (`:739`) | Ja (`resolvedItems :1120`) | Ja (Callbacks) |
| **Home (Discover)** | `src/pages/DiscoverPage.jsx` | Hoch — 6 State-Arrays, Radius-Hooks | `TalentCard`, `WerkCard`, `ErlebnisCard` (`:1609-1611`) | Teilweise | Teilweise |
| **Mein HUI** | `src/pages/MeinHUI.jsx` | Mittel — nur bei `visible=true` | Nein | Nein | Nein |
| **Impact** | `src/pages/ImpactPage.jsx` (~3.400 Zeilen) | **Sehr hoch** — mehrere Hooks + Realtime | **Kein `React.memo`** | Teilweise in Sub-Hooks | Teilweise |
| **Profil** | `src/components/home/profile/ProfileLauncher.jsx` → `MyBasisProfile.jsx` (80 KB Chunk) | Hoch bei Öffnen | Nein | Teilweise | `openProfileById` in HomeShell |
| **Studio** | `src/pages/CreatorStudio.jsx` | Niedrig bis Start — eigene Route, lazy | — | — | — |
| **Chat** | `src/components/chat-center/ChatCenterOverlay.jsx` | Mittel — nur wenn `showChat` | Nein | In `chatContext` | Ja in `chatContext` |
| **Meine Resonanz** | `src/pages/studio/MeineResonanz.jsx` | Mittel — 5+ sequentielle Loads | Nein | Nein | Nein |

### 2.2 Größte Context-Kaskade: `HomeShell`

**Datei:** `src/components/home/HomeShell.jsx:296-368`

Der `HomeCtx`-Wert ist zwar in `useMemo` gewrappt, hat aber **40+ Dependencies** inkl. aller Overlay-Flags (`showChat`, `showMap`, `showMatch`, `cart`, `searchState`, …). **Jede Änderung an einem Overlay-State erzeugt ein neues Context-Objekt** → alle `useHome()`-Consumer (`Home.jsx`, `ProfileLauncher`, Navigation) re-rendern.

```296:368:src/components/home/HomeShell.jsx
  const ctx = useMemo(() => ({
    user, authProfile, isTalent, ...
    showChat, setShowChat,
    showNotifs, setShowNotifs,
    // ... 40+ Felder
  }), [
    user, authProfile, ...
    showChat, chatRecipient,
    showNotifs, showMap, showMatch, ...
    cart, clearCartPersist,
  ]);
```

### 2.3 Fehlende `React.memo` (kritische Komponenten)

| Komponente | Datei | Wirkung |
|-----------|-------|---------|
| `HomeInner` | `src/pages/Home.jsx` | Gesamter Home-Baum re-rendert |
| `HomeHeader` | `src/components/home/header/HomeHeader.jsx` | Header bei jedem Home-State-Change |
| `HUIBottomNavigation` | `src/components/home/navigation/HUIBottomNavigation.jsx` | Tab-Bar re-rendert mit Parent |
| `HuiLiveTicker` | `src/components/shared/HuiLiveTicker.jsx` | Re-rendert bei Context-Updates |
| `ImpactPageInner` | `src/pages/ImpactPage.jsx` | 3.400-Zeilen-Baum |
| `MeinHUI` / `OrbHero` | `src/pages/MeinHUI.jsx` | Animations-Subtree |
| `FeedRouter` | `src/feed/cards/FeedRouter.jsx` | Jede Feed-Karte |

**Globale `React.memo`-Nutzung:** nur **4 Dateien** im gesamten `src/` (Grep: `React.memo|memo(` → 8 Treffer in 4 Dateien).

### 2.4 `@tanstack/react-query`

**Befund:** In `package.json` deklariert (`^5.84.1`), aber **0 Verwendungen** in `src/` (Grep: `useQuery|QueryClient` → 0 Treffer). Kein Request-Deduplication, kein stale-while-revalidate.

---

## 3. Navigation

### 3.1 Bottom Navigation

**Datei:** `src/components/home/navigation/HUIBottomNavigation.jsx`

- In-Flow-Layout (nicht `position: fixed`) — korrekt für iOS, aber SVG-Tabbar mit `drop-shadow` Filter pro Render
- Kein `React.memo` — re-rendert mit `HomeInner`
- Orb-Tap öffnet Mein HUI via `setShowPlusSheet` → triggert HomeShell-Context-Update

**Tab-Konfiguration:** `src/components/home/navigation/navConfig.js`

| Nav-Label | Tab-Key | Komponente |
|-----------|---------|------------|
| Entdecken | `feed` | `UnifiedFeed` |
| Home | `discover` | `DiscoverPage` |
| Mein HUI | `orb` | Overlay `MeinHUI` |
| Impact | `impact` | `ImpactPage` |
| Profil | `creator` | `ProfileLauncher` |

### 3.2 Keep-Alive-Verhalten

**Datei:** `src/lib/world/tabVisibilityController.js`

Inaktive Tabs werden **nicht unmounted**, sondern per `position: absolute; height: 0; opacity: 0` versteckt:

```46:60:src/lib/world/tabVisibilityController.js
  if (!isActive) {
    return {
      position: "absolute",
      height: 0,
      overflow: "hidden",
      opacity: 0,
      pointerEvents: "none",
      ...
    };
  }
```

**Konsequenz (belegt in `Home.jsx:374-480`):**
- `UnifiedFeed` + `useFeedStream` laufen **immer**
- `DiscoverPage` wird in `<Suspense>` geladen und **bleibt gemountet**
- `ImpactPage` wird in `<Suspense>` geladen und **bleibt gemountet**
- Tabwechsel ändert nur CSS-Sichtbarkeit — **kein Daten-Reload**, aber **laufende Effects/Realtime bleiben aktiv**

### 3.3 Overlay-Navigation

| Overlay | Mount-Verhalten | Datei |
|---------|----------------|-------|
| Mein HUI | Nur wenn `showPlusSheet` (`if (!visible) return null`) | `src/pages/MeinHUI.jsx:647` |
| Chat | Nur wenn `showChat` | `src/pages/Home.jsx:634` |
| Profil | `ProfileLauncher` immer im Baum | `src/pages/Home.jsx:586` |
| Content Preview | Global in `ContentPreviewProvider` | `src/context/ContentPreviewContext.jsx:67-68` |
| Modals/Flows | Conditional `SafeRender` | `src/pages/Home.jsx` |

### 3.4 Daten-Reload bei Navigation

| Aktion | Reload? | Beweis |
|--------|---------|--------|
| Tab Feed ↔ Home ↔ Impact | Nein (Keep-Alive) | `tabVisibilityController.js` |
| Tab → Profil | Overlay öffnet `MyBasisProfile` | `HomeShell.jsx:278-284` |
| Tab-Wechsel | Schließt die meisten Overlays | `HomeShell.jsx:211-245` `switchTab` |
| Chat | Bleibt bei Tab-Wechsel offen | `HomeShell.jsx:241` Kommentar |
| Feed | `useFeedStream` Realtime + Cache disabled | `useFeedStream.js:47-50` |

---

## 4. Feed Performance

### 4.1 Architektur

| Komponente | Datei | Rolle |
|-----------|-------|-------|
| `UnifiedFeed` | `src/feed/UnifiedFeed.jsx` | Feed-Orchestrator |
| `FeedRouter` | `src/feed/cards/FeedRouter.jsx` | Lazy Card-Routing |
| `useFeedStream` | `src/feed/useFeedStream.js` | Daten + Pagination + Realtime |
| `FeedEventsSection` | `src/feed/FeedEventsSection.jsx` | Events-Karussell |
| `FeedScrollSentinel` | `src/feed/FeedScrollSentinel.jsx` | Infinite Scroll |

### 4.2 Virtualisierung

**Datei:** `src/feed/UnifiedFeed.jsx:585-595`

```585:595:src/feed/UnifiedFeed.jsx
  const rowVirtualizer = useVirtualizer({
    count: arr.length,
    getScrollElement: () => scrollContainerRef?.current ?? null,
    estimateSize: () => 640,
    overscan: 3,
  });
  const useVirt = !!scrollContainerRef?.current && arr.length > 6;
```

| Aspekt | Befund |
|--------|--------|
| Virtualisierung aktiv | Nur wenn `arr.length > 6` **und** `scrollContainerRef` gesetzt |
| Erste 6 Karten | **Vollständig gerendert** (kein Virtualizer) |
| `estimateSize` | Fix 640 px — bei variablen Kartenhöhen → Layout-Shifts |
| `overscan` | 3 — auf Mobile akzeptabel |
| Fallback | `contentVisibility: auto` ab Index > 4 (`:647-648`) |
| Lazy Cards | `LazyCard` mit `IntersectionObserver`, `rootMargin: 200px` (`:739-760`) |

### 4.3 Feed-Cache deaktiviert

**Datei:** `src/feed/useFeedStream.js:47-50`

```47:50:src/feed/useFeedStream.js
function loadCache() {
  // CACHE DISABLED — always fresh load
  try { sessionStorage.removeItem(CACHE_KEY); } catch (_) {}
  return null;
}
```

**Nutzerwirkung:** Jeder Cold-Start des Feeds = voller Netzwerk-Load, Skeleton sichtbar.

### 4.4 Bilder & Video im Feed

- `BaseFeedCard.jsx`: `loading="lazy"` vorhanden
- Kein `srcset`/`sizes` (global 0 Treffer in `src/`)
- `FeedRouter` lazy-loaded Card-Types — gut für Code-Splitting
- Kein Autoplay im Feed (Videos in `StoryBar.jsx:317` nur bei Story-Viewer)

### 4.5 Infinite Scroll

- `PAGE_SIZE = 20` initial, +15 bei Scroll (`useFeedStream.js:30`)
- Prefetch bei 70% (`PREFETCH_THRESHOLD = 0.70`)
- `FeedBottomSentinel` triggert `loadMore`

### 4.6 Doppelte LiveTicker-Darstellung

| Ort | Datei |
|-----|-------|
| Feed-Tab (Entdecken) | `src/pages/Home.jsx:375` `<HuiLiveTicker />` |
| Home-Tab (Discover) | `src/pages/DiscoverPage.jsx:2084` `<HuiLiveTicker />` |

Daten kommen korrekt aus **einem** `LiveTickerProvider` — aber **beide Tabs rendern die UI-Komponente** (Keep-Alive → beide im DOM).

---

## 5. Mein HUI

**Datei:** `src/pages/MeinHUI.jsx` (722 Zeilen, eager in `Home`-Chunk importiert)

### 5.1 Aufbau-Choreografie

| Block | Delay | Animation |
|-------|-------|-----------|
| Orb | 0 ms | `mh-fadeup` + `mh-orb-breathe` (8 s Loop) |
| Begrüßung | 70 ms | `mh-fadeup` |
| Info-Karten | 140 ms | `mh-fadeup` + `backdrop-filter: blur` |
| Grundpfeiler | 210 ms | `mh-fadeup` |
| Reise | 280 ms | `mh-fadeup` |
| Impact-Momente | 350 ms | `mh-fadeup` |

**Gesamt:** ~350 ms gestaffeltes Einblenden + **4 permanente Keyframe-Loops** (`mh-orb-breathe`, `mh-atm-outer`, `mh-atm-mid`, `mh-resonance`, `mh-particle-a`).

### 5.2 Render-intensive Elemente

| Element | Datei | Problem |
|---------|-------|---------|
| `OrbHero` | `MeinHUI.jsx:207-346` | 3 animierte Radial-Gradient-Divs + 2 Resonanz-Ringe + 4 Partikel + 168×168 Logo |
| Info-Karten | `MeinHUI.jsx:320-344` | Hardcoded Stats („134 Tage“, „23 Impulse“, „47 Menschen“) — **keine DB-Queries**, aber `backdrop-filter` auf 3 Karten |
| `Pillars` / `Journey` | `MeinHUI.jsx:704-714` | Horizontale Scroll-Container mit Karten |
| Logo-Bild | `MeinHUI.jsx:284-293` | `/assets/brand/hui-logo.png` 168×168, **ohne** `loading="lazy"` |

### 5.3 Mount-Verhalten

- `if (!visible) return null` (`:647`) — **kein DOM wenn geschlossen** ✓
- Modul bleibt im **399 KB Home-Chunk** — wird beim Home-Load geparst, auch wenn Nutzer Mein HUI nie öffnet

### 5.4 Cinematic Close

**Datei:** `src/pages/Home.jsx:125-133`

400 ms Close-Animation blockiert visuell den Übergang zurück zur Tab-Navigation.

---

## 6. Meine Resonanz

### 6.1 Drei „Resonanz“-Bereiche

| Bereich | Datei | Wann geladen |
|---------|-------|--------------|
| **Meine Resonanz** (Timeline) | `src/pages/studio/MeineResonanz.jsx` | Beim Öffnen aus Profil |
| **Resonanzzentrum** (Notifications) | `src/lib/useNotifications.jsx` | Beim Öffnen des Notification-Panels |
| **Chat „Resonanz Center"** | `src/components/chat-center/ChatCenterOverlay.jsx` | Bei `showChat` |

### 6.2 Meine Resonanz — Datenladung

**Datei:** `src/pages/studio/MeineResonanz.jsx:100-200+`

Sequentielle Queries (nicht parallelisiert):

1. `orders` + nested `order_items` (limit 60)
2. `payments` (Legacy, limit 30)
3. `bookings` (limit 30)
4. `impact_votes` + Join `impact_applications` (limit 20)
5. Weitere Quellen in späteren Zeilen

**Nutzerwirkung:** Timeline baut sich stufenweise auf; Shimmer bis alle Queries fertig.

### 6.3 Resonanzzentrum

**Datei:** `src/lib/useNotifications.jsx:101-148`

- Lädt 80 Notifications bei Panel-Open
- Realtime-Channel `notif:{userId}`
- Zusätzlich: `AppStateContext` pollt Badge-Count alle 60 s (`AppStateContext.jsx:72-73`)

### 6.4 Doppelte Notification-Loads

| Mechanismus | Intervall | Datei |
|-------------|-----------|-------|
| Badge-Count Poll | 60 s | `AppStateContext.jsx` |
| Resonanzzentrum Full-Load | Bei Panel-Open | `useNotifications.jsx` |
| LiveTicker | 60 s, 10 Quellen | `useLiveTicker.js` |

---

## 7. Bilder & Medien

### 7.1 Responsive Images

**Befund:** `srcset` / `sizes` — **0 Treffer** im gesamten `src/`.  
Alle Bilder nutzen direkte URLs (`cover_url`, `avatar_url`, `media_url`) in voller Auflösung.

### 7.2 `loading="lazy"`

| Mit lazy | Ohne lazy (Auswahl) |
|----------|---------------------|
| `BaseFeedCard.jsx`, `DiscoverPage.jsx` (15×), `ImpactPage.jsx` (10×) | `MeinHUI.jsx:284` Orb-Logo |
| `PostFullscreenView.jsx`, `ContentPreviewSheet.jsx` | `StoryBar.jsx` (4 img) |

**Gesamt:** ~50 `<img>` vs. ~50 `loading="lazy"` — nicht konsistent auf allen kritischen Pfaden.

### 7.3 GPU/Memory

**Datei:** `index.html:187-188`

```css
img { -webkit-transform: translateZ(0); transform: translateZ(0); }
```

**Wirkung:** Erzwingt GPU-Compositing auf **allen** Bildern → erhöhter Speicherverbrauch auf iPad/Mobile bei langen Feeds.

### 7.4 Video

| Ort | Autoplay | Datei |
|-----|----------|-------|
| Story Viewer | `autoPlay playsInline` | `src/components/StoryBar.jsx:317` |
| Story Composer | `autoPlay muted loop` | `src/components/StoryComposer.jsx:239` |
| Create Flows | Teilweise `autoPlay` | `src/components/HuiCreateFlow.jsx:447` |

### 7.5 Caching

- Service Worker: `public/sw.js` (registriert in `index.html:130-136`)
- `index.html:6-7`: `Cache-Control: no-cache` auf HTML
- Kein CDN-Image-Transform (Supabase Storage URLs direkt)
- Feed sessionStorage-Cache: **deaktiviert** (siehe §4.3)

---

## 8. Netzwerk (Supabase)

### 8.1 Startup-Query-Schätzung (erster `/Home`-Load)

| Quelle | Queries | Parallel? | Datei |
|--------|---------|-----------|-------|
| Auth Profile | 1 | — | `AuthContext.jsx` |
| Notification Badge | 1 | — | `AppStateContext.jsx` |
| Follow IDs | 1 | — | `AppStateContext.jsx` |
| LiveTicker | **10–11** | Ja (`Promise.all`) | `useLiveTicker.js:263-264` |
| Saved Posts | 1 | — | `useReactions.jsx` via `SavedPostsContext` |
| Feed Page 1 | **4** + Profile Enrichment | Ja | `useFeedStream.js:82-113` |
| Heute auf HUI | **5** | Ja | `UnifiedFeed.jsx:63-75` |
| Feed Events | 1 | — | `FeedEventsSection.jsx:144+` |
| Discover Page | **6–7** sequentiell | Nein | `DiscoverPage.jsx:1732-1874` |
| Impact Page | **4+** (Hooks) | Teilweise | `ImpactPage.jsx` |
| Chat List | 1 + Profile-Enrichment | — | `chatContext.js:106+` |
| Presence Upsert | 1 | — | `usePresence.jsx:24-30` |
| **Summe** | **~35–45** | | |

### 8.2 Doppelte / redundante Requests

| Problem | Beweis |
|---------|--------|
| Notification-Count doppelt | `AppStateContext` Poll + `useNotifications` Full-Load |
| Profile-Queries mehrfach | Feed-Enrichment, Discover People, Chat-Enrichment — kein Shared Cache |
| LiveTicker + Feed laden gleiche Tabellen | `works`, `experiences` in beiden (`useLiveTicker.js:66-92`, `useFeedStream.js:84-98`) |
| Feed-Cache disabled | Jeder Refresh = volle 4-Query-Page |

### 8.3 Realtime-Channels (aktiv bei Home-Load)

| Channel | Datei |
|---------|-------|
| `hui_feed_realtime_v4f` | `useFeedStream.js:949-1003` |
| `saved_posts_count:{uid}` | `useReactions.jsx` |
| `notif:{uid}` | `useNotifications.jsx:136+` (bei Panel) |
| `imp_all_rt_*` | `ImpactPage.jsx:432-437` |
| `imp_apps_rt_*` | `ImpactPage.jsx:492-509` |
| Presence | `usePresence.jsx:129-146` |
| Chat | `chatContext.js:208+` |

**Impact-Page allein:** mindestens **3 Realtime-Channels** mit `Date.now()` Topic (`ImpactPage.jsx:432, 492, 1353`).

### 8.4 N+1-Muster

| Muster | Datei |
|--------|-------|
| Feed Profile Enrichment | Batch via `ProfileService.getMany` ✓ (`useFeedStream.js:167`) |
| Discover Talente → Profiles | Extra Query nach Talent-Load (`DiscoverPage.jsx:1824-1831`) |
| LiveTicker Resonance → Works | 2-Step (`useLiveTicker.js:150-157`) |
| Meine Resonanz | 5 sequentielle Queries |

### 8.5 React Query

Installiert aber **ungenutzt** — keine zentrale Query-Deduplication.

---

## 9. Bundle

### 9.1 Größte Chunks (Production Build)

| Rang | Chunk | KB (min) | Gzip | Lazy? |
|------|-------|----------|------|-------|
| 1 | `vendor-*.js` | 803 | 254 | Shared |
| 2 | `Home-*.js` | **390** | **106** | Route-lazy, aber sofort auf `/Home` |
| 3 | `index-eRf-*.js` | 238 | 69 | Entry |
| 4 | `react-vendor-*.js` | 157 | 52 | Entry |
| 5 | `ImpactPage-*.js` | 83 | 21 | Tab Keep-Alive |
| 6 | `DiscoverPage-*.js` | 81 | 19 | Tab Keep-Alive |
| 7 | `MyBasisProfile-*.js` | 78 | 20 | Profil-Overlay |
| 8 | `OrbSignatur-*.js` | 70 | 19 | Profil |

**Gesamt JS:** ~2.786 KB minified über alle Chunks.

### 9.2 Eager Imports in `Home.jsx` (Chunk-Aufblähung)

Diese Module sind **nicht lazy** und blähen den 399 KB Home-Chunk auf:

| Import | Datei |
|--------|-------|
| `UnifiedFeed` | `Home.jsx:25` |
| `MeinHUI` | `Home.jsx:56` |
| `ChatCenterOverlay` | `Home.jsx:29` |
| `ProfileLauncher` | `Home.jsx:24` |
| `WerkKaufFlow`, `ExperienceBookingFlow`, `WerkeKorb` | `Home.jsx:32-36` |
| `ConnectionCreatePage` | `Home.jsx:31` |
| `TalentOnboarding` | `Home.jsx:16` |
| `ContentTypeSelector`, `InvitationFlow` | `Home.jsx:58-59` |
| `OrbCompass` | `Home.jsx:55` (**importiert, nicht gerendert**) |
| `StoryViewer` | `Home.jsx:28` |

### 9.3 Code-Splitting (positiv)

- `FeedRouter` lazy-loaded Card-Types (`FeedRouter.jsx:6-9`)
- Studio, Flows, Modals als separate Chunks
- `manualChunks` in `vite.config.js:22-34`

### 9.4 Probleme

| Problem | Beweis |
|---------|--------|
| Circular chunk `vendor ↔ react-vendor` | Build-Warning: `Circular chunk: vendor -> react-vendor -> vendor` |
| `supabase-vendor` leer (0 KB) | Build: `supabase-vendor-l0sNRNKZ.js 0.00 kB` — `manualChunks` greift nicht |
| `html2canvas` + `jspdf` im Vendor | `tmp-bundle-check`: vendor enthält `html2canvas`, `jspdf` — Export-Funktion, nicht Consumer-Startup |
| `framer-motion`, `three`, `recharts` | In `package.json`, aber **keine direkten Imports** in `src/` gefunden — Dead Weight in node_modules, ggf. transitive Bundling |
| `moment` in DiscoverPage-Chunk | Build: `moment found` in Home-Chunk — zusätzlich zu `date-fns` |

### 9.5 Dynamic Imports

| Bereich | Lazy? |
|---------|-------|
| `Home` Route | ✓ `App.jsx:34` |
| `DiscoverPage`, `ImpactPage` | ✓ `Home.jsx:39-41` — aber sofort gemountet |
| Feed Cards | ✓ `FeedRouter.jsx` |
| Commerce Flows | ✓ `Home.jsx:45-48` |
| `UnifiedFeed` | ✗ direkt importiert |
| `MeinHUI` | ✗ direkt importiert |

---

## 10. Top-30 Performance-Probleme

Priorisiert nach **tatsächlich wahrnehmbarer Wirkung** auf iPad/Smartphone.

| # | Problem | Ursache | Datei(en) | Komponenten | Nutzerwirkung | Aufwand | Prio | Empfehlung |
|---|---------|---------|-----------|-------------|---------------|---------|------|------------|
| 1 | **Home-Chunk 399 KB** | Eager Imports (Feed, MeinHUI, Commerce, Chat) | `src/pages/Home.jsx` | Gesamte Home-Shell | App wirkt beim Öffnen „schwer“ | M | **P0** | `UnifiedFeed`, `MeinHUI`, Commerce-Flows per `React.lazy` aus Home-Chunk auslagern |
| 2 | **Keep-Alive lädt alle Tabs** | `tabVisibilityController` unmounted nicht | `src/lib/world/tabVisibilityController.js`, `src/pages/Home.jsx:374-480` | Feed, Discover, Impact | Tabwechsel träge; Hintergrund-CPU | M | **P0** | Inaktive Tabs unmounten oder Datenladung deferren bis Tab aktiv |
| 3 | **35–45 Supabase-Queries beim Start** | Kein Query-Cache, parallele Subsysteme | `useFeedStream.js`, `useLiveTicker.js`, `DiscoverPage.jsx` | Feed, Discover, Ticker | Feed/Home bauen sich langsam auf | M | **P0** | React Query einführen; Discover-Load parallelisieren; LiveTicker deferren |
| 4 | **Feed-Cache deaktiviert** | `loadCache()` löscht Cache | `src/feed/useFeedStream.js:47-50` | UnifiedFeed | Jeder Start = voller Feed-Reload | S | **P0** | Cache reaktivieren (5 min TTL existiert bereits) |
| 5 | **HomeShell Context-Kaskade** | 40+ useMemo-Dependencies | `src/components/home/HomeShell.jsx:296-368` | Home, Header, Nav, Profile | Jedes Overlay → Full Re-Render | M | **P0** | Context splitten (UI-State / Data / Navigation) |
| 6 | **Vendor-Chunk 822 KB** | Breites vendor-Bundling | `vite.config.js:22-34` | Global | Lange Parse-Zeit auf Mobile-CPU | M | **P0** | `@supabase` fixen; Export-Libs (`html2canvas`, `jspdf`) nur in Export-Routes laden |
| 7 | **Keine responsive Images** | Kein `srcset`/`sizes` | Gesamtes `src/` (0 Treffer) | Feed, Discover, Profile | Hoher Decode/Memory beim Scrollen | M | **P0** | Supabase Image Transform oder CDN mit Width-Parameter |
| 8 | **Virtualizer erst ab 7 Items** | `arr.length > 6` Bedingung | `src/feed/UnifiedFeed.jsx:595` | FeedList | Erste Feed-Items alle voll gerendert | S | **P1** | Virtualizer ab Item 1; `measureElement` beibehalten |
| 9 | **LiveTicker 10 Queries / 60 s** | `SOURCES` Array | `src/hooks/useLiveTicker.js:251-288` | HuiLiveTicker | Hintergrund-Netzwerk + Re-Renders | S | **P1** | Interval auf 120 s; erst nach Feed-Load starten |
| 10 | **Discover sequentiell** | `await` Kette in `load()` | `src/pages/DiscoverPage.jsx:1727-1934` | DiscoverPage | Home-Tab langsam | S | **P1** | `Promise.all` für unabhängige Sektionen |
| 11 | **Impact 3 Realtime-Channels** | Separate Hooks mit eigenem Channel | `src/pages/ImpactPage.jsx:432, 492, 1353` | ImpactPage | WebSocket-Overhead, auch wenn Tab inaktiv | M | **P1** | Ein Channel; nur subscriben wenn Tab aktiv |
| 12 | **Mein HUI Animations-Last** | 4 permanente Keyframe-Loops + blur | `src/pages/MeinHUI.jsx:72-104, 207-272` | OrbHero, FadeUp | Wirkungsraum baut sich langsam auf | S | **P1** | `prefers-reduced-motion`; Loops nach 3 s stoppen |
| 13 | **Google Fonts render-blocking** | Externe CSS | `index.html:42-44` | Global | Verzögerter First Paint ~220 ms | S | **P1** | `font-display: swap` + Self-Host oder System-Font-Stack |
| 14 | **ImpactPage 3.400 Zeilen, kein memo** | Monolith | `src/pages/ImpactPage.jsx` | Impact | Impact-Tab ruckelt | L | **P1** | In Sektionen splitten + `React.memo` |
| 15 | **Chat-Liste lädt bei Home-Mount** | `useChatList("home")` | `src/pages/Home.jsx:180`, `chatContext.js:205` | HomeHeader Badge | Unnötiger Request ohne Chat-Öffnung | S | **P1** | Chat-Load erst bei erstem `showChat` |
| 16 | **Doppelte HuiLiveTicker-UI** | Keep-Alive in Feed + Discover | `Home.jsx:375`, `DiscoverPage.jsx:2084` | HuiLiveTicker | Doppeltes DOM/Animation | S | **P2** | Ticker nur einmal im Scroll-Container |
| 17 | **`img { translateZ(0) }` global** | GPU-Layer auf allen Bildern | `index.html:187-188` | Alle Images | Memory-Druck bei langem Scroll | S | **P2** | Regel entfernen; nur auf animierte Elemente |
| 18 | **FeedWelcomeHeader 5 Extra-Queries** | `useHeuteStats` | `src/feed/UnifiedFeed.jsx:51-93` | FeedWelcomeHeader | Verzögert Feed-First-Paint | S | **P2** | Stats deferren oder in LiveTicker-Daten reuse |
| 19 | **Presence Heartbeat 45 s** | `setInterval` + Upsert | `src/lib/usePresence.jsx:51-53` | Global | Hintergrund-DB-Writes | S | **P2** | Intervall 120 s; nur wenn App foreground |
| 20 | **Notification Poll 60 s** | `setInterval` | `AppStateContext.jsx:72-73` | Header Badge | Hintergrund-Traffic | S | **P2** | Realtime-only oder längeres Intervall |
| 21 | **React Query ungenutzt** | Dependency ohne Integration | `package.json:54` | Global | Keine Deduplication | M | **P2** | QueryClient in `App.jsx` einbinden |
| 22 | **OrbCompass Dead Import** | Import ohne Render | `src/pages/Home.jsx:55` | — | Toter Code im Home-Chunk | S | **P2** | Import entfernen |
| 23 | **MeinHUI im Home-Chunk** | Eager import | `src/pages/Home.jsx:56` | MeinHUI | Parse-Kosten auch ohne Öffnen | S | **P2** | `React.lazy(() => import('./MeinHUI'))` |
| 24 | **Story Video Autoplay** | `autoPlay` | `src/components/StoryBar.jsx:317` | StoryViewer | CPU/Netzwerk bei Story | S | **P2** | Erst bei sichtbarem Slide starten |
| 25 | **Meine Resonanz 5 sequentielle Queries** | `loadTimeline` | `src/pages/studio/MeineResonanz.jsx:100+` | MeineResonanz | Timeline lädt langsam | M | **P2** | `Promise.all` + Pagination |
| 26 | **Feed Realtime sofort aktiv** | Channel on mount | `useFeedStream.js:935+` | Feed | WebSocket auch bei inaktivem Tab | S | **P2** | Nur subscriben wenn Feed-Tab aktiv |
| 27 | **fix 640px estimateSize** | Konstante Schätzung | `UnifiedFeed.jsx:589` | Virtualizer | Scroll-Sprünge / Reflow | S | **P2** | Gemessene Höhen cachen |
| 28 | **Sentry Replay Overhead** | 5% Sessions + Replay | `src/lib/sentry.js:37-49` | Global | Main-Thread bei Monitoring | S | **P3** | `replaysSessionSampleRate` auf 0 für Mobile |
| 29 | **moment + date-fns doppelt** | Zwei Date-Libs | `package.json:60,68` | Discover/Impact | Bundle-Größe | S | **P3** | `moment` entfernen, nur `date-fns` |
| 30 | **Circular vendor chunk** | `manualChunks` Logik | `vite.config.js:22-34` | Build | Suboptimales Caching | S | **P3** | Supabase in eigenen Chunk; Circular fix |

**Aufwand:** S = klein (< 1 Tag), M = mittel (1–3 Tage), L = groß (> 3 Tage)  
**Prio:** P0 = sofort spürbar, P1 = nächster Sprint, P2 = mittelfristig, P3 = Feintuning

---

## 11. Performance Roadmap

### Phase 1 — Quick Wins (maximaler Nutzer-Effekt, geringer Eingriff)

1. Feed-Cache reaktivieren (`useFeedStream.js:47-50`)
2. `OrbCompass`-Import entfernen (`Home.jsx:55`)
3. Google Fonts self-hosten oder System-Font (`index.html:42-44`)
4. Chat-Load deferren bis `showChat` (`Home.jsx:180`)
5. LiveTicker-Start um 3 s nach Feed verzögern (`useLiveTicker.js:284-288`)
6. `img { translateZ(0) }` entfernen (`index.html:187-188`)

**Erwartete Wirkung:** Schnellerer Feed-Start, weniger Hintergrund-Traffic, leichterer First Paint.

### Phase 2 — Strukturelle Entlastung (Tab- & Render-Performance)

1. Keep-Alive-Tabs: Datenladung nur für aktiven Tab
2. `HomeShell`-Context aufteilen (Navigation / Overlays / User)
3. `React.memo` auf `HomeHeader`, `HUIBottomNavigation`, `FeedRouter`
4. `MeinHUI` + `UnifiedFeed` aus Home-Chunk lazy-loaden
5. Discover `load()` parallelisieren (`DiscoverPage.jsx:1727+`)
6. Impact Realtime nur bei aktivem Tab

**Erwartete Wirkung:** Flüssigere Tabwechsel, weniger Ruckeln bei Overlays.

### Phase 3 — Netzwerk & Medien

1. React Query einführen mit Shared Cache für Profile/Feed/Notifications
2. Responsive Images (Supabase Transform `?width=400`)
3. LiveTicker-Daten mit Feed-Queries deduplizieren
4. Virtualizer ab erstem Item

**Erwartete Wirkung:** Weniger Nachlader, flüssigeres Scrollen auf iPad.

### Phase 4 — Bundle-Diät

1. `manualChunks` fixen (supabase-vendor, circular deps)
2. `html2canvas`/`jspdf` nur in Export-Flows dynamic import
3. `moment` entfernen
4. ImpactPage in Sub-Chunks splitten
5. Tree-Shake ungenutzte deps (`three`, `framer-motion` falls wirklich ungenutzt)

**Erwartete Wirkung:** Kürzere Ladezeit auf 3G/4G, weniger Parse-Zeit.

---

## Anhang A — Messprotokoll

| Schritt | Befehl / Tool | Ergebnis |
|---------|--------------|----------|
| Build | `npm run build` | 804 Module, 4,98 s |
| Bundle-Analyse | `dist/assets/*.js` Dateigrößen | siehe §9 |
| Lighthouse Login Mobile | `lighthouse /login --form-factor=mobile --throttling.cpuSlowdownMultiplier=4` | FCP 3,0 s, LCP 4,7 s, TTI 4,7 s |
| Lighthouse Home Redirect | `lighthouse /` | Score 93 — nur Loader (23 DOM-Elemente), nicht repräsentativ |
| Grep memo | `React.memo\|memo(` in `src/` | 4 Dateien |
| Grep srcset | `srcset\|sizes=` in `src/` | 0 Treffe |
| Grep react-query | `useQuery\|QueryClient` in `src/` | 0 Treffer |

## Anhang B — Consumer-App Datei-Index

| Bereich | Pfad |
|---------|------|
| Entry | `src/main.jsx`, `src/App.jsx` |
| Home Shell | `src/pages/Home.jsx`, `src/components/home/HomeShell.jsx` |
| Navigation | `src/components/home/navigation/` |
| Feed | `src/feed/` |
| Mein HUI | `src/pages/MeinHUI.jsx` |
| Resonanz | `src/pages/studio/MeineResonanz.jsx`, `src/lib/useNotifications.jsx` |
| Build | `vite.config.js`, `package.json` |

---

*Ende des Audits. Keine Codeänderungen vorgenommen.*
