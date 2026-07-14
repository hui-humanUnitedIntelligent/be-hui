# HUI Performance Sprint P2 — Intelligent Keep-Alive

**Ziel:** Nur der sichtbare Hauptbereich arbeitet vollständig. Hintergrund-Tabs bleiben gemountet (Keep-Alive), pausieren aber Rendering, Realtime, Polling und Animationen.

**Branch:** `cursor/intelligent-keep-alive-p2-5022`

---

## 1. Vorherige Architektur

### Keep-Alive-Modell (unverändert)

Alle vier Scroll-Tabs werden **dauerhaft gemountet** in `Home.jsx` innerhalb eines gemeinsamen Scroll-Containers:

| Tab-Key | Nav-Label | Komponente | Mount |
|---------|-----------|------------|-------|
| `feed` | Entdecken | `UnifiedFeed` | Keep-Alive (immer) |
| `discover` | Home | `DiscoverPage` | Keep-Alive (lazy chunk) |
| `impact` | Impact | `ImpactPage` | Keep-Alive (lazy chunk) |
| `favorites` | Dein Raum | `FavoritesPage` | Keep-Alive (lazy, kein Nav-Item) |

Sichtbarkeit wird ausschließlich über `tabVisibilityController.js` gesteuert:
- Aktiver Tab: `position: relative`, `opacity: 1`
- Inaktiver Tab: `position: absolute`, `height: 0`, `overflow: hidden`, `opacity: 0`, `pointer-events: none`

**Problem vor P2:** React-Hooks, Effects, Realtime-Channels und Timer liefen in **allen** gemounteten Tabs weiter — unabhängig von der Sichtbarkeit.

### Overlays (separat von Scroll-Tabs)

| Bereich | Mount-Modell | Hintergrund vor P2 |
|---------|--------------|-------------------|
| **Mein HUI** | Immer gemountet, `visible`-Prop | Enter-Animation nur bei `visible` |
| **Profil** | Overlay, unmount bei Schließen | Kein Hintergrund wenn geschlossen |
| **Chat** | Conditional mount | `useChatList` in HomeInner läuft immer |
| **Studio / Meine Resonanz** | Modal on-demand | Kein Hintergrund wenn geschlossen |

### Messwerte VORHER (Code-Analyse, 1 aktiver Tab)

| Metrik | Wert |
|--------|------|
| Gleichzeitig gemountete Scroll-Tabs | **4** (feed, discover, impact, favorites) |
| Vollständig aktive Tabs | **1** (sichtbar) — aber **4** mit laufenden Hooks |
| Supabase Realtime-Channels (Hintergrund) | **~6** (Feed ×1, Impact ×4, Chat ×1) |
| Polling-Intervalle (Hintergrund) | **~3** (LiveTicker 60s, Impact-Votes 30s, Presence 2–3 min) |
| LiveTicker-Instanzen (Rotation) | **2** (feed + discover DOM), Daten dedupliziert via Context |
| requestIdleCallback Prefetch (Feed) | Lief in allen Tabs |
| IntersectionObserver (Feed-Sentinel) | Aktiv auch bei verstecktem Feed |
| CSS-Animationen (Hintergrund) | Ungehindert (LiveTicker, Karten, Transitions) |

### Hintergrundaktivitäten pro Bereich (vor P2)

#### Feed (`feed` / Entdecken)
- `useFeedStream`: Initial Load, Pagination, Prefetch, Realtime (`beitraege`, `invitations`, `experiences`, `works`)
- `useHeuteStats`: 4 parallele DB-Queries
- `HuiLiveTicker`: 8–12s Rotations-Timer
- `FeedEventsSection`: Mount-Load
- IntersectionObserver auf Feed-Sentinel

#### Entdecken (`discover` / Home)
- Einmaliger Section-Load (People, Momente, Werke, Talente, Erlebnisse)
- 3× Location-Debounce (450ms → Nominatim)
- `HuiLiveTicker` (eigener Rotations-Timer)

#### Impact
- `useImpactActivities`: **30s Polling**
- `useAllApprovedByVotes`: Realtime `impact_votes`
- `useApprovedApplications`: Realtime `impact_votes` + `impact_applications`
- Haupt-Realtime `votes_rt_main`
- ~10 weitere einmalige Mount-Loads

#### Favorites
- Einmaliger DB-Load (Experiences, Payments)

#### Shell (immer aktiv auf Home)
- `useOwnPresence`: 2 min Interval
- `useChatList`: Realtime Chats + Messages
- `usePresence`: 3 min Poll
- `LiveTickerProvider`: 60s Poll über 10 Tabellen

---

## 2. Bewertung pro Hauptbereich

| Bereich | Voll aktiv? | Pausierbar? | Realtime pausieren? | Rendering pausieren? | Lazy reaktivieren? |
|---------|-------------|-------------|---------------------|----------------------|-------------------|
| **Feed** | Nur wenn sichtbar oder Suche aktiv | Ja | Ja (sinnvoll) | Ja (Virtualizer/Sentinel) | Ja — Resume-Refresh |
| **Entdecken** | Nur wenn sichtbar | Ja | N/A (kein RT) | Ja (CSS contain) | Ja — Reload bei Resume |
| **Impact** | Nur wenn sichtbar | Ja | Ja (4 Channels) | Ja | Ja — Hooks re-subscribe |
| **Favorites** | Nur wenn sichtbar | Ja | N/A | Ja | Ja — Reload bei Resume |
| **Mein HUI** | Nur wenn `visible` | Bereits teilweise | N/A | Ja (bestehend) | Bereits vorhanden |
| **Profil** | Nur wenn Overlay offen | Bereits unmount | Bereits unmount | Bereits unmount | Bereits vorhanden |
| **Chat** | Nur wenn Overlay offen | Overlay unmountet | Badge-Liste bleibt (Shell) | Overlay unmountet | Bereits vorhanden |
| **Studio/Resonanz** | Nur wenn Modal offen | Bereits on-demand | N/A | Bereits on-demand | Bereits vorhanden |

**Ausnahme Suche:** Wenn `searchState.active`, wird `feed` erzwungen sichtbar (`effectiveActiveTab = "feed"`) — Feed bleibt dann voll aktiv.

---

## 3. Neue Keep-Alive-Strategie

### Control Plane: `tabLifecycle.js`

Neue Single Source of Truth für Tab-Aktivität (ergänzt `tabVisibilityController.js`):

```
getEffectiveActiveTab(tab, searchActive)  →  "feed" wenn Suche aktiv
isTabActive(tabId, tab, searchActive)     →  boolean
useTabLifecycle(tabId)                    →  { isActive, paused, effectiveActiveTab }
syncTabLifecycleState()                   →  Module-Sync für App-Level (LiveTicker)
```

`HomeShell` exponiert `isTabActive` und `effectiveActiveTab` via `useHome()`.

### Prinzip

```
Mount:     IMMER (Keep-Alive erhalten)
Sichtbar:  tabVisibilityController (CSS)
Aktiv:     tabLifecycle (Effects, RT, Poll, Animationen)
Resume:    Gezielter Refresh beim Zurückkehren (kein Dauer-Polling)
```

### Pausierte Hintergrundaktivitäten (P2-Implementierung)

| Komponente | Pausiert wenn inaktiv |
|------------|----------------------|
| `useFeedStream` | Realtime-Channel, Prefetch, loadMore, Such-Fetch, Scroll-Sentinel |
| `useLiveTicker` | 60s Polling-Interval |
| `HuiLiveTicker` | 8–12s Rotations-Timer |
| `useHeuteStats` | DB-Queries |
| `useImpactActivities` | 30s Polling |
| `useAllApprovedByVotes` | Realtime + Reload |
| `useApprovedApplications` | Realtime |
| Impact `votes_rt_main` | Realtime |
| `DiscoverPage` load | Section-Load + Nominatim-Debounce |
| `FavoritesPage` load | DB-Load |
| Inaktive Tab-Divs | CSS `animation-play-state: paused`, `contain: strict`, `transition: none` |

### Resume-Verhalten (Tab-Rückkehr)

| Tab | Resume-Aktion |
|-----|---------------|
| Feed | Merge neuer Items aus erster Seite (ohne Scroll-Clear) |
| Discover | Vollständiger Section-Reload |
| Impact | Hooks re-subscriben (Realtime + Polling) |
| Favorites | DB-Reload |
| LiveTicker | Einmaliger Refresh + Interval restart |

---

## 4. Messwerte NACHHER

Annahme: Nutzer auf **Feed-Tab** (typischer Fall)

| Metrik | Vorher | Nachher | Δ |
|--------|--------|---------|---|
| Gemountete Tabs | 4 | 4 | 0 (Keep-Alive) |
| **Vollständig aktive Tabs** | 4 (de facto) | **1** | **−75%** |
| Realtime-Channels (Hintergrund) | ~6 | **~2** (Feed + Chat-Shell) | **−67%** |
| Polling-Intervalle (Hintergrund) | ~3 | **~1** (Presence/Shell) | **−67%** |
| LiveTicker Poll aktiv | Immer (60s) | Nur feed/discover aktiv | **−100%** auf Impact/Favorites |
| Feed Realtime | Immer | Nur feed aktiv | **−100%** wenn nicht auf Feed |
| Impact 30s Poll | Immer | Nur impact aktiv | **−100%** wenn nicht auf Impact |
| HuiLiveTicker Rotation-Timer | 2× immer | 1× (nur sichtbarer Tab) | **−50%** |
| Feed IntersectionObserver | Immer | Nur feed aktiv | Pausiert |
| CSS-Animationen (Hintergrund) | Laufen | `animation-play-state: paused` | Pausiert |

### CPU-Entlastung (qualitativ)

- **Weniger WebSocket-Traffic:** 4 Impact/Feed-Channels weniger bei Nicht-Impact/Feed-Tabs
- **Weniger Timer-Callbacks:** LiveTicker + Impact-Poll + Ticker-Rotation pausiert
- **Weniger Layout/Paint:** `contain: strict` + pausierte Animationen auf inaktiven Tabs
- **Weniger Idle-Prefetch:** Feed lädt keine nächste Seite im Hintergrund

### Auswirkungen auf Tabwechsel

| Kriterium | Status |
|-----------|--------|
| Tabwechsel flüssig | ✔ CSS-Transition nur beim Aktivieren (inaktiv: `transition: none`) |
| Scrollposition | ✔ Unverändert (Mount bleibt, `useScrollMemory`) |
| Formulare | ✔ State in gemounteten Komponenten erhalten |
| Feed-Daten aktuell | ✔ Resume-Merge neuer Items |
| Discover-Daten aktuell | ✔ Reload bei Tab-Rückkehr |
| Commerce (Korb) | ✔ `useCartPersistence` in HomeShell, unabhängig von Tabs |
| Resonance | ✔ Modal on-demand, unverändert |
| Chat | ✔ Overlay-Modell unverändert; Badge-Liste bleibt für Unread |

---

## 5. Geänderte Dateien

| Datei | Änderung |
|-------|----------|
| `src/lib/world/tabLifecycle.js` | **NEU** — Control Plane + Hooks + Pause-CSS |
| `src/lib/world/tabVisibilityController.js` | `contain: strict`, `transition: none` für inaktive Tabs |
| `src/components/home/HomeShell.jsx` | Context: `isTabActive`, `effectiveActiveTab`, Sync |
| `src/components/home/navigation/navConfig.js` | `favorites` in `KEEP_ALIVE_TABS` |
| `src/feed/useFeedStream.js` | `paused`-Parameter, RT/Prefetch/Search-Gating |
| `src/feed/UnifiedFeed.jsx` | `useTabLifecycle`, Sentinel-Gating |
| `src/hooks/useLiveTicker.js` | Pausiert Polling wenn kein feed/discover aktiv |
| `src/components/shared/HuiLiveTicker.jsx` | `tabId`-Prop, Rotation pausiert |
| `src/pages/ImpactPage.jsx` | Hooks + RT mit `impactPaused` |
| `src/pages/DiscoverPage.jsx` | Load + Debounce mit `discoverPaused` |
| `src/pages/FavoritesPage.jsx` | Load mit `favoritesPaused` |
| `src/pages/Home.jsx` | `data-tab-paused`, `TAB_PAUSE_CSS` |

---

## 6. Regression-Checkliste

- [x] Keep-Alive bleibt erhalten (kein Unmount)
- [x] Nur sichtbare Bereiche vollständig aktiv
- [x] Hintergrundaktivitäten deutlich reduziert
- [x] Scrollposition bleibt erhalten
- [x] Keine UI-Änderungen
- [x] Keine Navigation geändert
- [x] Build erfolgreich (`npm run build`)
- [x] Keine neuen ESLint-Fehler in geänderten Kern-Dateien
- [x] Messwerte dokumentiert

---

## 7. Empfehlung für Sprint P3

### P3.1 — Chat-Badge entkoppeln
`useChatList("home")` in `HomeInner` läuft weiterhin immer. P3: Leichtgewichtiger Unread-Only-Channel vs. vollständige Chat-Liste.

### P3.2 — Feed Virtualizer Pause
`@tanstack/react-virtual` misst weiterhin im Hintergrund. P3: `enabled: !feedPaused` am Virtualizer.

### P3.3 — `React.memo` + Selector-Pattern
`useHome()`-Context triggert Re-Renders in allen Consumern. P3: Split-Contexts oder `useSyncExternalStore` für Tab-State.

### P3.4 — `content-visibility: auto` messen
Safari-Kompatibilität prüfen, dann auf inaktive Tab-Container anwenden für stärkere Paint-Reduktion.

### P3.5 — Performance-Telemetrie
`window.__HUI_TAB_PERF__` Debug-Counter: aktive Channels, Timer, letzter Resume-Zeitpunkt — für echte Geräte-Messungen.

### P3.6 — Presence-Optimierung
`useOwnPresence` + `usePresence` pausieren wenn `document.hidden` (bereits teilweise) + wenn kein Overlay Chat/Profil offen.

---

## 8. Definition of Done

| Kriterium | Status |
|-----------|--------|
| Keep-Alive bleibt erhalten | ✔ |
| Nur sichtbare Bereiche vollständig aktiv | ✔ |
| Hintergrundaktivitäten deutlich reduziert | ✔ (~67–75% weniger parallele Aktivität) |
| Scrollposition bleibt erhalten | ✔ |
| Keine UI-Änderungen | ✔ |
| Keine Navigation geändert | ✔ |
| Build erfolgreich | ✔ |
| Keine neuen ESLint-Fehler | ✔ |
| Messwerte dokumentiert | ✔ |
