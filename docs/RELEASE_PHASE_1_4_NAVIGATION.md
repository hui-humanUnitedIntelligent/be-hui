# RELEASE Phase 1.4 — Navigation Alignment & Product Architecture

**Release:** NAV-1.4  
**Datum:** 2026-07-01  
**Ziel:** Technische Bereinigung der Navigation ohne Änderung der Produktarchitektur

---

## Finale Navigationsarchitektur

### Bottom Tabbar (UNVERÄNDERT — FINAL)

| UI-Label | Interner Key | Inhalt |
|----------|--------------|--------|
| **Entdecken** | `feed` | Community Feed, Stories, Inspiration, Beiträge, Menschen entdecken |
| **Home** | `discover` | Strukturierte Entdeckungswelt: Kategorien, Werke, Erlebnisse, Projekte, Orte |
| **Mein HUI** | `orb` (kein Tab) | Persönlicher Wirkungsraum: Orb, Kompass, Erstellen, Orientierung |
| **Impact** | `impact` | Wirkung, Projekte, Impact Pool, Community Impact |
| **Profil** | `creator` | Identität, Einstellungen, öffentliches Profil |

### Routing-Schichten

```
React Router (App.jsx)
  └── /Home → HomeShell + Home.jsx
        ├── HUIBottomNavigation (Tabbar)
        ├── handleTab() — einzige autoritative Tab-Entscheidung
        └── Keep-Alive Pages: feed | discover | impact | favorites

Deep-Links
  └── /impact → ImpactDeepLinkRedirect → /Home (state.shellTab=impact)
```

### Autorität

| Bereich | Autorität | Datei |
|---------|-----------|-------|
| URL-Routen | React Router | `src/App.jsx` |
| Shell-Tabs | `handleTab()` | `src/components/home/HomeShell.jsx` |
| Tab-Labels | `NAV_ITEMS` | `src/components/home/navigation/navConfig.js` |
| Route-Dokumentation | Shadow Registry | `src/routes/registry.js` |
| Shell Deep-Links | `shellDeepLink.js` | `src/lib/navigation/shellDeepLink.js` |

### Bereichs-Grenzen (bestätigt, nicht verändert)

| Bereich | Zuständigkeit |
|---------|---------------|
| **Impact** | Ausschließlich HomeShell-Tab (`impact`). Kein paralleles Vollseiten-Mount. |
| **Profil** | Identität, Einstellungen, Sichtbarkeit — kein Creator-Commerce |
| **HUI Studio** (`HuiStudio` Modal) | Arbeitsbereich für Wirker aus dem Profil |
| **Creator Studio** (`/studio`) | URL-basierter Arbeitsbereich, kein Tabbar-Link |
| **Meine Resonanz** | Unverändert — separate Phase geplant |

---

## Entfernte / bereinigte Legacy-Navigation

| Element | Maßnahme |
|---------|----------|
| `/impact` als eigenständiges `ImpactPage`-Mount | Ersetzt durch `ImpactDeepLinkRedirect` → HomeShell |
| Doppelter Tab-Aufruf `GO_TO_TAB` + `handleTab` in BottomNav | Entfernt — nur noch `onTab` → `handleTab` |
| `HomeHeader.onNotif` → `setShowNotifs(true)` | Entfernt — NotificationCenter deaktiviert, Resonanzzentrum über `NotificationButton` |
| `OPEN_COMMUNITY` → Tab `community` (nicht existent) | Repariert → `handleTab("feed")` (Entdecken) |
| `pushState("/impact")` in Studio-Modals | Ersetzt durch `navigateToShellTab()` |
| `DiscoverPage` `navigate("/impact")` | Ersetzt durch `onImpact` → `handleTab("impact")` |
| `window.__HUI_OPEN_CREATOR_DASH` → `CreatorDashboard` | Umgeleitet auf `openCreatorDashboard()` (kanonisches Profil) |

**Nicht entfernt** (bewusst erhalten):

- `NotificationCenter.jsx` — Datei bleibt, System deaktiviert
- `CreatorDashboard.jsx` — Overlay-Code bleibt, Einstieg umgeleitet
- `FavoritesPage` — programmatisch erreichbar, kein Tab-Button (Produktentscheidung)
- `MeineResonanz` — unverändert

---

## Reparierte Buttons / Pfade

| Button / Pfad | Vorher | Nachher |
|---------------|--------|---------|
| Bottom Nav Impact | `GO_TO_TAB` schloss Overlays vor `handleTab` | Nur `handleTab` — Chat bleibt bei Impact-Wechsel offen |
| DiscoverPage Projekt-Karte | Verließ HomeShell via `/impact` | Bleibt in Shell via `handleTab("impact")` |
| HuiStudio Empfehlungen → Projekt | `pushState("/impact")` | `navigateToShellTab("impact")` |
| ImpactStimmenModal → Projekt | `pushState` Fallback | `navigateToShellTab` mit Hash |
| MeineProjekteModal → Projekt | `pushState` Fallback | `navigateToShellTab` |
| WirkerProfile „Alle Menschen" | `OPEN_COMMUNITY` → leerer Tab | `OPEN_COMMUNITY` → Entdecken (`feed`) |
| Favorites „Menschen" Alle | `OPEN_COMMUNITY` → leerer Tab | `OPEN_COMMUNITY` → Entdecken (`feed`) |
| Deep-Link `/impact` | Standalone ImpactPage | Redirect → HomeShell Impact-Tab |
| Deep-Link `/impact#project-*` | Hash auf Standalone-Seite | Hash via `shellHash` State |

---

## Verbliebene technische Schulden

| ID | Thema | Risiko | Empfehlung Phase 1.5 |
|----|-------|--------|----------------------|
| NAV-DEBT-01 | `FavoritesPage` ohne Tab-Button | niedrig | Entscheidung: Tab hinzufügen oder `GO_FAVORITES` deprecaten |
| NAV-DEBT-02 | `CreatorDashboard` Overlay ungenutzt | niedrig | Datei archivieren nach Bestätigung |
| NAV-DEBT-03 | `hui.navigator.jsx` parallel zu `handleTab` | mittel | Konsolidierung oder explizite Abgrenzung |
| NAV-DEBT-04 | `EXCLUDED_REF_PATHS` noch nicht in RefRedirect/referralTracking | niedrig | NAV-002 Konsolidierung |
| NAV-DEBT-05 | `CreatorStudio` vs `HuiStudio` Überschneidung | mittel | Produktentscheidung, nicht NAV-1.4 |
| NAV-DEBT-06 | `showNotifs` State in HomeShell (tot) | niedrig | State entfernen wenn sicher |
| NAV-DEBT-07 | HuiStudio Work/Profile `pushState` ohne React Router | mittel | Auf `navigate()` umstellen |
| NAV-DEBT-08 | `MeineResonanz.onNavigate` Stub | — | Separate Resonance-Phase |
| NAV-DEBT-09 | `OPEN_CALENDAR` Placeholder | niedrig | Feature-Spec oder entfernen |
| NAV-DEBT-10 | APP_ROUTES → ROUTE_REGISTRY Migration | niedrig | NAV-003 |

---

## Empfehlung für Phase 1.5

1. **Referral Exclusion SSOT** — `EXCLUDED_REF_PATHS` aus `registry.js` in `RefRedirect.jsx` und `referralTracking.js` einbinden (NAV-002).

2. **Navigator-Konsolidierung** — `hui.navigator.jsx` entweder an `handleTab` anbinden oder als reines Analytics-Layer dokumentieren und `SCREENS.COMMUNITY` entfernen.

3. **Studio-Routing vereinheitlichen** — `HuiStudio` Empfehlungen für Werke/Profile von `pushState` auf React Router `navigate()` umstellen.

4. **Favorites-Entscheidung** — Produkt klären: eigener Tab-Einstieg oder ausschließlich programmatischer Zugang.

5. **Meine Resonanz** — Eigenständige Spec: Komponenten, Datenquellen, Navigationsziele vor Umbau analysieren.

6. **Legacy-State-Cleanup** — `showNotifs`, `showCreatorDash`, ungenutzte `CreatorDashboard`-Renderpfade nach Monitoring-Zeitraum entfernen.

7. **Registry-Migration vorbereiten** — Parity-Tests zwischen `ROUTE_REGISTRY` und `App.jsx` automatisieren (NAV-003).

---

## Neue / geänderte Dateien

| Datei | Änderung |
|-------|----------|
| `src/lib/navigation/shellDeepLink.js` | Neu — Deep-Link State-Konstanten |
| `src/lib/navigation/navigateToShellTab.js` | Neu — Shell-Tab-Navigation aus Modals |
| `src/components/navigation/ImpactDeepLinkRedirect.jsx` | Neu — `/impact` Redirect |
| `src/App.jsx` | Impact-Route → Redirect |
| `src/components/home/navigation/HUIBottomNavigation.jsx` | Dual-Routing entfernt |
| `src/components/home/HomeShell.jsx` | (unverändert — handleTab war bereits korrekt) |
| `src/pages/Home.jsx` | Shell-Deep-Link Handler, DiscoverPage onImpact |
| `src/pages/DiscoverPage.jsx` | onImpact Prop |
| `src/core/hui.actions.js` | OPEN_COMMUNITY, GO_IMPACT, OPEN_IMPACT |
| `src/components/studio/*.jsx` | Impact-Navigation bereinigt |
| `src/routes/registry.js` | Impact als Redirect dokumentiert |
| `docs/ARCHITECTURE_INDEX.md` | NAV-1.4 Verweis |
| `docs/RELEASE_PHASE_1_4_NAVIGATION.md` | Dieses Dokument |

---

## Definition of Done — Status

| Kriterium | Status |
|-----------|--------|
| Tabbar unverändert | ✅ |
| Alle Buttons funktionieren | ✅ (repariert) |
| Keine doppelte Navigation | ✅ (BottomNav, Impact) |
| Keine tote Navigation | ✅ (community-Tab, onNotif) |
| Keine Legacy-Einstiege (eindeutig tot) | ✅ (pushState impact) |
| Deep Links funktionieren | ✅ (`/impact`, `#project-*`) |
| Build erfolgreich | ⏳ |
| Keine neuen ESLint-Fehler | ⏳ |
| Architektur dokumentiert | ✅ |
