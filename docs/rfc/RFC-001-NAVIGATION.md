# RFC-001 — Navigation

**Status:** Engineering Architecture Review  
**Version:** 1.0  
**Datum:** 2026-06-30  
**Owner:** HUI Release Engineering  
**Klassifikation:** Architekturgrundlage — keine Release Specification, keine Implementierung

---

## Dokumentzweck

Dieses Dokument analysiert die bestehende Navigationsarchitektur der HUI-Plattform aus technischer Sicht und definiert Anforderungen an eine langfristig stabile, wartbare und skalierbare Navigation. Es beschreibt **Ist-Zustand**, **Zielprinzipien** und **offene Entscheidungen** — nicht einzelne Releases oder Refactorings.

**Explizit ausgeschlossen:**

- Produktentscheidungen (Tab-Reihenfolge, UX-Copy, Feature-Priorisierung)
- Konkrete Implementierungspläne oder Sprint-Spezifikationen
- Code-Änderungen oder Komponenten-Refactorings

---

## 1. Executive Summary

Die HUI-Plattform betreibt **kein einheitliches Navigationssystem**, sondern **acht überlappende Schichten**, die in mehreren Entwicklungsphasen entstanden sind (NAV-001, NAV-001B, Phase 2 Flow, Phase 16 World Surface). Jede Schicht erfüllt einen legitimen Zweck — die Abgrenzung ist jedoch historisch gewachsen und teilweise inkonsistent.

### Ist-Zustand in Kürze

| Schicht | Autoritative Quelle | Reifegrad |
|---------|---------------------|-----------|
| URL-Navigation | `App.jsx` + React Router v6 | Produktiv, teilweise dokumentiert |
| Home-Tab-Navigation | `HomeShell.handleTab` | Produktiv, autoritativ innerhalb `/Home` |
| Overlay-Navigation | ~22 Boolean-Flags in `HomeShell` | Produktiv, hohe Komplexität |
| Intent-Navigation (Actions) | `hui.actions.js` → Shell-Setter | Produktiv, intendiert als SSOT für UI-Events |
| Flow-Gedächtnis | `hui.flow.js` (ref-basierter Stack) | Teilweise — LOOP 1 (Discover→Profil→Chat) funktioniert |
| Screen-Navigator | `hui.navigator.jsx` | **Scaffold — gemountet, aber nicht angebunden** |
| Route-Registry | `routes/registry.js` | **Shadow Mode — kein Laufzeiteinfluss** |
| World-Surface-Lifecycle | `WorldSurfaceContext` | Produktiv, inkonsistent adoptiert |

### Kerndiagnose

HUI verfügt über **mehrere konkurrierende Autoritäten** für dieselbe Navigationsentscheidung. Das System funktioniert im Alltag, weil `HomeShell` und `Home.jsx` als implizite Koordinatoren fungieren — nicht weil eine explizite Architektur die Verantwortlichkeiten trennt.

Die Codebase signalisiert bereits eine **Zielrichtung** (Route-Registry NAV-001B→004, Action Engine, Flow Language, World Surface, Navigator-Scaffold). RFC-001 formalisiert diese Richtung als Architekturprinzipien und Domänengrenzen, ohne vorzeitige Implementierung zu erzwingen.

### Zielbild (architektonisch, nicht release-spezifisch)

```
┌─────────────────────────────────────────────────────────────┐
│  URL Layer          — Adressierbarkeit, Deep Links, Auth    │
├─────────────────────────────────────────────────────────────┤
│  System Layer       — Boot, Entry, Guards, Recovery         │
├─────────────────────────────────────────────────────────────┤
│  Home Shell Layer   — Tab-State, Keep-Alive, Session        │
├─────────────────────────────────────────────────────────────┤
│  Screen Layer       — Screen-Stack (Tabs + Overlays)        │
├─────────────────────────────────────────────────────────────┤
│  Intent Layer       — User Actions → Navigation Commands    │
├─────────────────────────────────────────────────────────────┤
│  Flow Layer         — Semantisches Gedächtnis, Returns      │
├─────────────────────────────────────────────────────────────┤
│  Presentation Layer — World Surface, Blur, Nav-Drift        │
└─────────────────────────────────────────────────────────────┘
```

Jede Schicht hat **genau eine Verantwortlichkeit** und **genau eine autoritative Quelle**.

---

## 2. Navigation Domains

### 2.1 Domänen-Inventar

Nach Analyse des Codebases existieren **zehn technisch unterscheidbare Navigationsdomänen**. Die fünf in der Aufgabenstellung genannten Domänen sind enthalten; fünf weitere wurden identifiziert, weil sie eigenständige Verantwortlichkeiten und State-Quellen besitzen.

| # | Domäne | Kurzbeschreibung | Status |
|---|--------|------------------|--------|
| 1 | **URL Navigation** | Browser-adressierbare Routen, Auth-Gates, Standalone-Pages | Produktiv |
| 2 | **System Navigation** | App-Boot, Entry-State-Machine, Guards, 404 | Produktiv |
| 3 | **Home Navigation** | Tab-Wechsel innerhalb `/Home` | Produktiv |
| 4 | **Overlay Navigation** | Vollbild-/Sheet-Overlays über dem Tab-Shell | Produktiv |
| 5 | **Flow Navigation** | Semantisches Gedächtnis, Return-Strategien | Teilweise |
| 6 | **Intent Navigation** | Action-Dispatch als einziger UI-Eingangskanal | Teilweise durchgesetzt |
| 7 | **Screen Navigation** | Zentraler Screen-Stack (Tabs + Overlays) | Scaffold |
| 8 | **Presentation Navigation** | Visueller Lifecycle (Blur, Dim, Nav-Drift) | Produktiv, inkonsistent |
| 9 | **Content Routing** | Feed-Card-Typ → Komponente (kein räumliches Routing) | Produktiv |
| 10 | **Imperative Navigation** | `window.__HUI_*`, `history.pushState` ohne Router | Legacy/Escape Hatch |

### 2.2 Domänen-Abgrenzung: Bewertung

#### Sinnvoll abgegrenzt

- **URL Navigation** vs. **Home Navigation**: Klare Trennung zwischen browser-adressierbaren Seiten (`/work/:id`, `/studio`) und in-shell Tab-State (`feed`, `discover`). React Router endet bei `/Home`; darunter übernimmt `HomeShell`.
- **Flow Navigation** vs. **Browser History**: Bewusste Entscheidung für semantische Returns (`RETURN_TO`) statt `history.back()`. Korrekte Domänentrennung — Flow kennt *Bedeutung*, nicht *Browser-Stack*.
- **Presentation Navigation** (World Surface): Eigenständige Verantwortlichkeit für visuellen Zustand (Blur, Feed-Opacity, Nav-Translate). Darf nicht mit Overlay-Existenz verwechselt werden.

#### Unzureichend abgegrenzt

- **Overlay Navigation** vs. **Screen Navigation**: `hui.navigator.jsx` definiert `OVERLAY_SCREENS`, während `HomeShell` 22+ unabhängige Booleans verwaltet. Zwei Systeme, eine Verantwortlichkeit — **Verletzung des Single-Authority-Prinzips**.
- **Intent Navigation** vs. **Overlay Navigation**: Actions rufen direkt Shell-Setter auf (`setShowWirker`, `setShowChat`). Intent und State-Mutation sind gekoppelt, nicht getrennt.
- **URL Navigation** vs. **Overlay Navigation**: Profile existieren sowohl als `/profile/:username` (Standalone) als auch als `ProfileLauncher`-Overlay (in-shell). Zwei parallele Implementierungen desselben Konzepts.
- **Home Navigation** vs. **Screen Navigation**: `navConfig.js` Tab-Keys (`feed`, `discover`) weichen von `hui.navigator.jsx` Screen-IDs (`home`, `discover`) ab. Semantische Inkonsistenz.

#### Fehlende Domäne (implizit vorhanden)

- **Session Navigation**: `sessionStorage` (`hui_active_tab`), Scroll-Memory, Welcome-Persistence. Heute verteilt über `sessionHooks.js`, `welcomePersistence.js`, `HomeShell` — keine explizite Domäne, aber eigenständige Verantwortlichkeit.

### 2.3 Domänen-Interaktionsmodell

```
                    ┌──────────────┐
                    │ System Nav   │ Boot → Entry → Ready
                    └──────┬───────┘
                           │ navigate("/Home")
                    ┌──────▼───────┐
                    │  URL Nav     │ React Router — Top-Level
                    └──────┬───────┘
                           │ /Home
              ┌────────────▼────────────┐
              │     Home Navigation      │ Tab-State (feed, discover, …)
              └────────────┬────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
  ┌──────▼──────┐  ┌───────▼───────┐  ┌──────▼──────┐
  │ Overlay Nav │  │ Screen Nav    │  │ Content     │
  │ (Booleans)  │  │ (Scaffold)    │  │ Routing     │
  └──────┬──────┘  └───────────────┘  └─────────────┘
         │
  ┌──────▼──────┐     ┌───────────────┐
  │ Presentation│     │ Flow Nav      │
  │ (World Surf)│     │ (Return Stack)│
  └─────────────┘     └───────────────┘
         ▲
         │ Intent Navigation (Actions)
         └─────────────────────────────
```

**Leserichtung:** Oben autoritativ für Adressierung, unten für Semantik und Präsentation. Querabhängigkeiten (gestrichelt im Ist-Zustand) sind die Hauptursache für Wartungsrisiken.

---

## 3. Architekturprinzipien

Die folgenden Prinzipien definieren Anforderungen an eine professionelle, langfristig stabile Navigationsarchitektur — unabhängig von der konkreten Implementierung.

### 3.1 Single Authority (Einzelne Autorität)

**Anforderung:** Jede navigationsrelevante Entscheidung hat genau eine autoritative Quelle. Kein Screen, kein Overlay und kein Tab darf von mehreren Systemen gleichzeitig gesteuert werden.

**Ist-Verletzung:** Profile-Navigation via `selectedProfileId` (ProfileLauncher) und `showWirker` (Actions). Tab-State in `HomeShell.tab` und verwaistes `AppStateContext.activeTab`.

### 3.2 Separation of Concerns (Trennung der Belange)

**Anforderung:** Intent (Was will der User?), State (Wo ist er?), Presentation (Wie sieht es aus?) und Persistence (Was überlebt einen Reload?) sind getrennte Schichten.

| Belang | Darf | Darf nicht |
|--------|------|------------|
| Intent | Actions dispatchen | Direkt Overlay-Booleans setzen |
| State | Screen-Stack verwalten | Blur-Effekte steuern |
| Presentation | World Surface Tokens ableiten | Navigationstoß auslösen |
| Persistence | Session/URL serialisieren | UI rendern |

### 3.3 Declarative Navigation State

**Anforderung:** Der Navigationszustand ist zu jedem Zeitpunkt als Datenstruktur beschreibbar — nicht als verteilte Booleans. Ein Entwickler muss `getNavigationState()` aufrufen können und erhält ein vollständiges Bild.

**Ist-Verletzung:** 22+ unabhängige `show*`-Flags in `HomeShell` ohne zentrale Serialisierung.

### 3.4 Deep Link Compatibility (Adressierbarkeit)

**Anforderung:** Jeder navigierbare Zustand innerhalb der App muss theoretisch in eine URL oder einen persistenten Identifier übersetzbar sein — auch wenn nicht jeder Zustand sofort als Deep Link freigegeben wird.

**Ist-Verletzung:** Home-Tabs und Overlays sind URL-invisible. `location.state` für Commerce-Cross-Route ist fragil bei Reload.

### 3.5 Semantic Flow Memory (Semantisches Gedächtnis)

**Anforderung:** Navigation kennt Bedeutung, nicht nur History-Position. Returns folgen definierten Regeln (`RETURN_TO`), nicht `history.back()`.

**Ist-Verletzung:** `hui.flow.return.js` ist dokumentiert, existiert aber nicht. Nur LOOP 1 (Chat→Profil) ist manuell implementiert.

### 3.6 Navigation Lifecycle (Lebenszyklus)

**Anforderung:** Jede Navigation durchläuft definierte Phasen:

```
Intent → Validate → Transition → Mount → Confirm → Active → Close → Cleanup → Restore
```

World Surface implementiert `open → confirm → close` für Presentation — diese Phasen müssen architektonisch auf alle Domänen übertragbar sein.

### 3.7 History Management (Geschichtsverwaltung)

**Anforderung:** Browser-History, Screen-Stack, Flow-Stack und Session-State haben explizit dokumentierte Scopes. Kein System darf stillschweigend ein anderes überschreiben.

**Ist-Verletzung:** Fünf parallele History-Konzepte; `window.history.pushState` in Studio-Komponenten umgeht React Router.

### 3.8 Recovery & Resilience (Wiederherstellung)

**Anforderung:** Navigation muss sich von inkonsistenten Zuständen erholen können — ohne Hard-Reload. `forceRecoverWorld()`, `SmartNotFound`, `lazyWithRetry` sind Vorläufer; das Prinzip muss domänenübergreifend gelten.

### 3.9 Fail-Safe Defaults

**Anforderung:** Bei unbekanntem oder korruptem Navigationszustand führt die App zu einem sicheren, nützlichen Default — typischerweise Home-Feed — nicht zu einem leeren Screen oder Crash.

### 3.10 Observability (Beobachtbarkeit)

**Anforderung:** Navigation ist zu Debug-Zwecken introspectierbar: aktiver Screen, Overlay-Stack, Flow-Stack, World-Surface-Phase. Dev-Mode-Logging (`[HUI_ACTION]`, `[HUI_FLOW]`) ist ein Anfang; Produktions-Observability (Sentry-Context) muss strukturiert sein.

### 3.11 Idempotency (Idempotenz)

**Anforderung:** Dieselbe Navigationsintention zweimal ausgeführt führt nicht zu doppeltem Stack-Eintrag oder inkonsistentem Zustand. `hui.navigator.jsx` prüft Duplikate — dieses Prinzip muss global gelten.

### 3.12 Platform Agnosticism (Plattformneutralität)

**Anforderung:** Die Navigationsarchitektur trennt Logik von Plattform-APIs (Browser History, `sessionStorage`, Safari-Paint-Recovery). Neue Plattformen (PWA, Native Shell, Tablet) dürfen nur die Persistence- und Presentation-Adapter austauschen.

### 3.13 Registry-Driven Extensibility

**Anforderung:** Neue Screens, Routen und Overlays werden durch Registry-Einträge registriert — nicht durch manuelles Hinzufügen von Booleans, Route-Blöcken und Exclusion-Listen an drei Stellen.

---

## 4. Verantwortlichkeiten

Für jede Domäne: **eine** Aufgabe, **eine** Verantwortlichkeit, **eine** autoritative Quelle.

### 4.1 URL Navigation

| Aspekt | Definition |
|--------|------------|
| **Aufgabe** | Abbildung von URL-Pfaden auf Seitenkomponenten; Auth-Gating; Lazy Loading; Referral-Routing |
| **Verantwortlichkeit** | Alles, was im Browser-Adressfeld steht |
| **Autoritative Quelle (Ist)** | `src/App.jsx` — manuelle `<Route>`-Definitionen |
| **Autoritative Quelle (Soll)** | `src/routes/registry.js` → generierte Routes (NAV-003/004) |
| **Abhängigkeiten** | AuthContext, AppEntryController, ProtectedRoute |
| **Grenzen** | Kein Tab-State, keine Overlay-Steuerung, kein Flow-Gedächtnis |

### 4.2 System Navigation

| Aspekt | Definition |
|--------|------------|
| **Aufgabe** | App-Lifecycle: Boot → Auth-Check → Welcome → Ready; Block-Guards; 404-Recovery |
| **Verantwortlichkeit** | Erster Screen nach Login; globale Guard-Entscheidungen |
| **Autoritative Quelle** | `AppEntryController.jsx`, `SmartNotFound`, `GlobalBlockGuard` |
| **Abhängigkeiten** | AuthContext, Welcome-Persistence, React Router |
| **Grenzen** | Keine In-Shell-Tab-Logik; keine Overlay-Öffnung |

### 4.3 Home Navigation

| Aspekt | Definition |
|--------|------------|
| **Aufgabe** | Tab-Wechsel innerhalb `/Home`; Keep-Alive; Scroll-Memory; Session-Restore |
| **Verantwortlichkeit** | Aktiver Tab-Key (`feed`, `discover`, `impact`, `creator`) |
| **Autoritative Quelle** | `HomeShell.handleTab` / `switchTab` |
| **Abhängigkeiten** | `navConfig.js`, `sessionHooks.js`, `tabVisibilityController.js` |
| **Grenzen** | Keine URL-Synchronisation (Ist); keine Overlay-Inhalte (nur Tab-Ebene) |

**Sonderregeln (Ist, müssen in NAV-002+ formalisiert werden):**

- `impact` → `_setTab` ohne Overlay-Close
- `creator` → öffnet Creator-Dashboard-Overlay
- `orb` → kein Tab-Switch, sondern OrbCompass-Overlay
- `chat` → bleibt bei Tab-Wechsel offen

### 4.4 Overlay Navigation

| Aspekt | Definition |
|--------|------------|
| **Aufgabe** | Lebenszyklus von Vollbild-/Sheet-Overlays über dem Tab-Shell |
| **Verantwortlichkeit** | Welche Overlays aktiv sind; Overlay-Parameter (profileId, storyId, …) |
| **Autoritative Quelle (Ist)** | 22+ Booleans in `HomeShell` + bedingtes Rendering in `Home.jsx` |
| **Autoritative Quelle (Soll)** | Screen Navigation Layer (Stack-basiert) |
| **Abhängigkeiten** | Home Navigation (Tab bleibt darunter), Flow Navigation (Return) |
| **Grenzen** | Keine visuellen Effekte (Blur/Dim → Presentation); keine URL-Autorität |

### 4.5 Flow Navigation

| Aspekt | Definition |
|--------|------------|
| **Aufgabe** | Semantisches Gedächtnis: Herkunft (source), Return-Ziel, Flow-State, Echo-Signale |
| **Verantwortlichkeit** | LIFO-Stack von Surfaces; Return-Profile; Flow-Signale |
| **Autoritative Quelle** | `hui.flow.js` (ref-basierter Stack), `hui.sources.js` (Surface-Konstanten, RETURN_TO) |
| **Abhängigkeiten** | Intent Navigation (push bei Action), Overlay Navigation (close → return) |
| **Grenzen** | Kein UI-Rendering; keine Tab-Autorität; kein Browser-History-Management |

### 4.6 Intent Navigation

| Aspekt | Definition |
|--------|------------|
| **Aufgabe** | Einziger Eingangskanal für User-Interaktionen; Validierung; Semantik-Normalisierung |
| **Verantwortlichkeit** | Übersetzung von User-Intent in Navigation-Commands |
| **Autoritative Quelle** | `hui.actions.js` + `HuiActionProvider` |
| **Abhängigkeiten** | HomeShell-Setter (Ist — enge Kopplung), Flow Store, Contracts |
| **Grenzen** | Kein direktes Rendering; keine eigene State-Autorität (Soll: dispatch only) |

**Ist-Verletzung der Grenzen:** Viele Komponenten rufen `navigate()`, `openProfileById()` oder Setter direkt auf — die Regel in `hui.actions.js` (*Kein Button darf direkt setState/navigate aufrufen*) ist nicht durchgesetzt.

### 4.7 Screen Navigation

| Aspekt | Definition |
|--------|------------|
| **Aufgabe** | Zentraler Screen-Stack: aktueller Screen, Parameter, History (max 20) |
| **Verantwortlichkeit** | Einheitliches Screen-Modell für Tabs und Overlays |
| **Autoritative Quelle (Ist)** | `hui.navigator.jsx` — **nicht angebunden** |
| **Autoritative Quelle (Soll)** | `NavigatorProvider` als SSOT, synchronisiert mit Home Navigation |
| **Abhängigkeiten** | Home Navigation (Tab-Sync), Overlay Navigation (Overlay-Screens) |
| **Grenzen** | Keine URL-Serialisierung; keine Presentation-Effekte |

### 4.8 Presentation Navigation (World Surface)

| Aspekt | Definition |
|--------|------------|
| **Aufgabe** | Visueller Lifecycle: Feed-Blur, Dim-Overlay, Nav-Drift, Safari-Recovery |
| **Verantwortlichkeit** | CSS-Tokens und Phasen (`open → confirm → close`) |
| **Autoritative Quelle** | `WorldSurfaceContext` + `worldSurfaceController.js` |
| **Abhängigkeiten** | Overlay Navigation (Surface-ID), Orb-Environment-Cleanup |
| **Grenzen** | Keine Entscheidung *welches* Overlay offen ist; nur *wie* die Welt darauf reagiert |

### 4.9 Content Routing

| Aspekt | Definition |
|--------|------------|
| **Aufgabe** | Feed-Card-Typ → Card-Komponente |
| **Verantwortlichkeit** | Content-Darstellung innerhalb eines Tabs |
| **Autoritative Quelle** | `FeedRouter.jsx` |
| **Abhängigkeiten** | Feed-Engine, Card-Registry |
| **Grenzen** | Kein räumliches Routing; keine Navigation aus dem Feed heraus |

### 4.10 Session Navigation

| Aspekt | Definition |
|--------|------------|
| **Aufgabe** | Persistenz von Tab, Scroll-Position, Welcome-Status über Session-Grenzen |
| **Verantwortlichkeit** | `sessionStorage`/`localStorage`-Keys und Restore-Logik |
| **Autoritative Quelle (Ist)** | Verteilt: `sessionHooks.js`, `welcomePersistence.js`, `HomeShell` |
| **Autoritative Quelle (Soll)** | Dedizierte Session-Navigation-Schicht oder Teil der Home Navigation |
| **Abhängigkeiten** | Home Navigation (Tab-Key), AuthContext (Restore erst nach authChecked) |
| **Grenzen** | Keine URL-Autorität; keine Overlay-Logik |

---

## 5. Skalierbarkeit

Bewertung der Navigationsarchitektur entlang sieben Dimensionen — Ist-Zustand und Anforderungen bei deutlichem Plattformwachstum.

### 5.1 Erweiterbarkeit

| Kriterium | Ist | Anforderung bei Wachstum |
|-----------|-----|--------------------------|
| Neuer Tab | `navConfig.js` + `Home.jsx` Render-Block + ggf. `handleTab`-Sonderregel | Registry-Eintrag + automatische Integration |
| Neues Overlay | Neuer Boolean in `HomeShell` + Render in `Home.jsx` + Action + ggf. World Surface | Overlay-Registry-Eintrag; kein neuer Boolean |
| Neue URL-Route | `App.jsx` + `ROUTE_REGISTRY` + `KNOWN_APP_PATHS` + `referralTracking.EXCLUDED` | Ein Registry-Eintrag generiert alles |
| Neues Modul | Moduleigene `navigate()`-Calls | Module dispatchen nur Actions |

**Risiko:** Jede Erweiterung berührt heute 3–5 Dateien. Bei 50+ Screens wird das unwartbar.

### 5.2 Modularität

**Ist:** `Home.jsx` (~800+ Zeilen) kennt jedes Overlay. `hui.actions.js` importiert Shell-Setter direkt — Actions existieren nicht unabhängig von `HomeShell`.

**Anforderung:** Module registrieren Navigation-Handler über Contracts. `HomeShell` wird zum dünnen Koordinator, nicht zum Monolithen.

### 5.3 Testbarkeit

**Ist:** 22+ Booleans erfordern Integrationstests. `window.__HUI_*`-Globals sind nicht mockbar. Navigator-Scaffold ist ungetestet auf dem Hot Path.

**Anforderung:**

- `getNavigationState()` als reine Funktion testbar
- Actions als Command-Objekte unit-testbar
- Flow-Stack ohne React-Render testbar (bereits ref-basiert — gut)
- Parity-Tests: Registry ↔ Router ↔ Navigator Screen-IDs

### 5.4 Wartbarkeit

**Ist:** Dreifache Route-Dokumentation (`App.jsx`, `APP_ROUTES`, `ROUTE_REGISTRY`). Tab-Key-Semantik (`feed` = „Entdecken“, `discover` = „Home“) ist dokumentiert, aber gegenintuitiv. `community` und `favorites` existieren im Code, nicht in der Nav-Bar.

**Anforderung:** Eine Namenskonvention, ein Register, eine Wahrheit. Legacy-Aliase explizit markiert und deprecatable.

### 5.5 Performance

**Ist:** Keep-Alive-Tabs (opacity/position, kein Unmount) — bewusster Safari-Stabilitäts-Tradeoff. Lazy Loading mit Retry. World Surface verhindert premature Blur.

**Anforderung bei Wachstum:**

- Overlay-Stack statt 22 gleichzeitig gemounteter Conditional-Blocks
- Code-Splitting entlang der Registry
- Navigation-State-Updates batched (ein Dispatch statt 5 Setter)
- Virtualisierung darf Tab-Keep-Alive nicht brechen

### 5.6 Debugbarkeit

**Ist:** Dev-Mode-Logging für Actions und Flow. `window.__HUI_WORLD_STATE__` für Sentry. Kein zentrales Navigation-Debug-Panel.

**Anforderung:** Navigation Inspector (Dev-Tools): Screen-Stack, Flow-Stack, aktive Overlays, World-Surface-Phase, letzte 10 Actions.

### 5.7 Observability

**Ist:** Sentry-Context mit `active_surface`, `active_tab`. Keine strukturierten Navigation-Events für Analytics.

**Anforderung:**

- Korrelations-ID pro Navigation-Transition
- Structured Events: `{ type: "navigate", from, to, source, duration }`
- Error-Boundary pro Navigation-Domäne (Route, Overlay, Flow)
- Metriken: Transition-Latenz, Overlay-Mount-Time, Failed-Return-Rate

### 5.8 Wachstumsszenarien

| Szenario | Architekturelle Anforderung |
|----------|-------------------------------|
| **Neue Screens (50+)** | Registry-driven; Screen Navigator als SSOT |
| **Neue Module (Commerce, Health, …)** | Module eigene Overlay-Registry; Intent-Actions als einzige Schnittstelle |
| **Neue Plattformen (Native, Tablet)** | URL Layer und Presentation Layer austauschbar; Core-Stack platform-agnostic |
| **Neue Rollen (Admin, Ambassador, …)** | System Navigation erweitert Guards; URL Layer AUTH-Level aus Registry |
| **Neue Features (Voice, AR, …)** | Flow Navigation erweiterbar um neue Surface-Typen in `hui.sources.js` |
| **Internationalisierung** | Labels in `navConfig.js` / Registry, nicht in Tab-Keys |
| **Push Notifications → Deep Link** | URL Layer muss jeden Zielzustand adressieren können |

---

## 6. Risiken

### 6.1 Architektonische Risiken (langfristig, systemisch)

| ID | Risiko | Schwere | Beschreibung |
|----|--------|---------|--------------|
| R-01 | **Split Authority** | Kritisch | Mehrere Systeme steuern dieselbe Navigation. Jede Änderung kann unvorhersehbare Seiteneffekte haben. |
| R-02 | **Boolean Explosion** | Kritisch | Lineares Wachstum der Overlay-Flags. Kein Mutex, keine Stack-Ordnung, keine zentrale Z-Index-Autorität trotz `Z_INDEX_MAP.md`. |
| R-03 | **Dead Scaffold Entropy** | Hoch | `hui.navigator.jsx`, `HuiContextBridge`, `HuiConnectionEngine` sind gemountet/importiert aber inaktiv. Verwirrung für Entwickler; divergierende Screen-Namen. |
| R-04 | **URL Invisibility** | Hoch | Home-Tabs und Overlays sind nicht adressierbar. Blockiert Sharing, Notifications, PWA-Restore, SEO. |
| R-05 | **Incomplete Flow Returns** | Hoch | `RETURN_TO` definiert, `hui.flow.return.js` fehlt. Jeder neue Overlay braucht handcodierten Close-Handler. |
| R-06 | **History Bypass** | Hoch | `window.history.pushState` in Studio-Komponenten umgeht React Router. Back-Button und Route-Guards brechen. |
| R-07 | **Triple Documentation Drift** | Mittel | Route-Änderungen erfordern Updates an 3+ Stellen. Historisch nachweisbar (Parity Report in `registry.js`). |
| R-08 | **Dual Profile Paths** | Mittel | `/profile/:username` vs. `ProfileLauncher` vs. `showWirker`. Inkonsistente Datenquellen und Close-Verhalten. |
| R-09 | **Implicit Navigation API** | Mittel | `window.__HUI_OPEN_*`-Globals. Untestbar, undokumentiert, nicht versioniert. |
| R-10 | **Presentation Skipping** | Mittel | Viele Overlays umgehen World Surface. Inkonsistente UX; Safari-Recovery greift nicht. |
| R-11 | **Semantic Key Drift** | Mittel | `feed`/`discover`/`home`/`community` — verschiedene Namensräume in navConfig, Navigator, Sources. |
| R-12 | **Orphan State** | Niedrig | `AppStateContext.activeTab`, `useUIState()`-Overlays parallel zu `HomeShell`. Potenzielle Race Conditions. |

### 6.2 Risiko-Kaskaden

```
R-01 Split Authority
  ├─→ R-02 Boolean Explosion (kein zentraler Stack → mehr Booleans)
  ├─→ R-04 URL Invisibility (kein SSOT → nichts zu serialisieren)
  ├─→ R-05 Incomplete Returns (kein Executor → handcodiert pro Overlay)
  └─→ R-07 Documentation Drift (kein Register → manuelle Sync)
```

Die Wurzelursache ist **fehlende Single Authority auf Screen-Ebene**. Alle anderen kritischen Risiken sind Ableitungen.

### 6.3 Nicht-Risiken (bewusst akzeptiert)

- **Keep-Alive-Tabs statt Unmount:** Safari-Stabilität und Scroll-Preservation rechtfertigen den Memory-Tradeoff.
- **Semantische Returns statt `history.back()`:** Korrekte architektonische Entscheidung für eine Flow-orientierte App.
- **Shadow Registry:** Sinnvoller Migrationspfad (NAV-001B→004); kein Risiko solange Parity validiert wird.

---

## 7. Offene Architekturfragen

Die folgenden Entscheidungen sollten **bewusst nicht in RFC-001** getroffen werden, sondern in nachfolgenden RFCs oder ADRs.

### 7.1 Für ADR-002: Screen Authority

**Frage:** Wird `hui.navigator.jsx` die autoritative Screen-Schicht, oder wird ein neues Konzept eingeführt?

**Optionen:**

- A) Navigator wird an HomeShell angebunden (Incremental)
- B) HomeShell-Booleans werden in Navigator migriert (Big-Bang)
- C) Navigator wird entfernt; neues Stack-Modell (Clean Slate)

**RFC-001 Empfehlung:** Entscheidung in ADR-002 nach Parity-Analyse; kein Code bis ADR freigegeben.

### 7.2 Für RFC-002: URL–Shell Synchronisation

**Frage:** Wie werden Home-Tabs und Overlays in URLs kodiert?

**Optionen:**

- `/Home?tab=discover`
- `/Home/discover`
- `/Home#discover`
- Hybrid: Tabs in URL, Overlays in Query/Hash

**Abhängigkeit:** Bestimmt Deep-Link-Strategie für Notifications und Sharing.

### 7.3 Für RFC-003: Overlay Stack Model

**Frage:** Ein Overlay zur Zeit (Modal) oder echter Stack (Overlay über Overlay)?

**Ist:** De facto einzelnes Overlay, aber kein erzwungenes Mutex. `showChat` + `showWirker` theoretisch gleichzeitig möglich.

### 7.4 Für ADR-003: Profile Unification

**Frage:** Ein Profil-Konzept (Overlay) oder zwei (Standalone-Page + Overlay)?

**Kontext:** `/profile/:username` für externe Links; `ProfileLauncher` für In-App. Vereinheitlichung vs. bewusste Dualität.

### 7.5 Für RFC-004: Action Enforcement

**Frage:** Wie wird die Action-Regel (*kein direktes setState/navigate*) technisch durchgesetzt?

**Optionen:**

- Lint-Rule (eslint-plugin)
- Architektur-Test (kein `useNavigate` außerhalb erlaubter Dateien)
- Code-Review-Policy only

### 7.6 Für ADR-004: Flow Return Executor

**Frage:** Implementierung von `hui.flow.return.js` — zentraler Executor vs. dezentrale Close-Handler?

**Kontext:** `RETURN_TO`-Map existiert; LOOP 1 ist manuell. Executor würde alle definierten Returns automatisieren.

### 7.7 Für RFC-005: World Surface Mandate

**Frage:** Obligatorisch für alle Overlays oder optional?

**Kontext:** Commerce-Flows und Membership umgehen World Surface. Vollständige Migration vs. bewusste Ausnahmen.

### 7.8 Für RFC-006: Platform Strategy

**Frage:** Wie verhält sich Navigation in PWA vs. Browser vs. potenzieller Native Shell?

**Abhängigkeit:** Session Navigation Persistence, URL-Strategie, Back-Button-Semantik.

### 7.9 Für ADR-005: Registry Migration Timing

**Frage:** Wann wird NAV-003 (Router generiert aus Registry) freigegeben?

**Voraussetzung:** NAV-002 Parity-Validation muss 100% grün sein. Parity Report in `registry.js` listet aktuelle Abweichungen.

### 7.10 Produktentscheidungen (explizit ausgeklammert)

- Tab-Reihenfolge und -Labels
- Ob `community` und `favorites` Nav-Bar-Tabs werden
- Impact-Tab-Verhalten (Overlays offen lassen)
- Creator vs. Studio vs. Dashboard — Produktkonsolidierung

---

## 8. Engineering-Empfehlungen

### 8.1 Kurzfristig (Architektur-Vorbereitung, kein Feature-Code)

| # | Empfehlung | Begründung |
|---|------------|------------|
| E-01 | **NAV-002 Parity-Validation ausführen** | Registry-Drift ist dokumentiert; muss vor jeder Migration gemessen werden |
| E-02 | **Navigation State Snapshot definieren** | TypeScript-Interface / JSDoc-Typ für `{ tab, overlays[], flowStack, worldPhase }` — rein dokumentarisch |
| E-03 | **Screen-ID-Kanonisierung** | Ein Mapping-Dokument: `navConfig.key` ↔ `SCREENS.*` ↔ `S.*` ↔ `sessionStorage`-Keys |
| E-04 | **`window.__HUI_*`-Inventar** | Alle imperativen Hooks dokumentieren; als deprecated markieren |
| E-05 | **ADR-002 ausarbeiten: Screen Authority** | Blockiert alle strukturellen Navigation-Änderungen |

### 8.2 Mittelfristig (nach ADR-Freigabe)

| # | Empfehlung | Begründung |
|---|------------|------------|
| E-06 | **Navigator anbinden oder entfernen** | Dead Scaffold erzeugt Entropie (R-03) |
| E-07 | **`hui.flow.return.js` implementieren** | RETURN_TO-Map nutzbar machen; LOOP-Muster generalisieren |
| E-08 | **Profile-Pfad vereinheitlichen** | `showWirker` deprecaten; `selectedProfileId` als einziger In-Shell-Weg |
| E-09 | **Action-Enforcement** | Lint/Arch-Test für `navigate()` und direkte Setter |
| E-10 | **EXCLUDED_REF_PATHS konsolidieren** | Eine Liste statt drei (NAV-002) |

### 8.3 Langfristig (Zielarchitektur)

| # | Empfehlung | Begründung |
|---|------------|------------|
| E-11 | **NAV-003/004 Registry Migration** | URL Navigation wird registry-driven |
| E-12 | **Overlay-Registry statt Booleans** | Deklaratives Modell: `{ id, params, presentation }` |
| E-13 | **URL-Shell-Sync** | Deep Links für Tabs und kritische Overlays |
| E-14 | **Navigation Inspector (Dev-Tools)** | Debuggability und Observability |
| E-15 | **World Surface Mandate** | Alle Fullscreen-Overlays durch zwei-Phasen-Lifecycle |

### 8.4 Priorisierte Reihenfolge

```
1. E-01  Parity-Validation          ← messbar, kein Risiko
2. E-02  State Snapshot Typ         ← dokumentarisch
3. E-03  Screen-ID-Kanonisierung    ← dokumentarisch
4. E-05  ADR-002 Screen Authority   ← Entscheidungsvorlage
5. ────  [ADR-002 Entscheidung]  ────
6. E-06  Navigator anbinden/entfernen
7. E-07  Flow Return Executor
8. E-09  Action Enforcement
9. E-10  Ref-Path Konsolidierung
10. E-11 Registry Migration
11. E-12 Overlay Registry
12. E-13 URL-Shell-Sync
```

### 8.5 Was bewusst nicht empfohlen wird

- **Sofortiges Big-Bang-Refactoring** von `HomeShell` — zu hohes Regressionsrisiko ohne Parity-Baseline
- **Entfernen von Keep-Alive-Tabs** — Safari-Stabilität hat Priorität
- **Erzwingen von `history.back()`** — widerspricht Flow Language Philosophie
- **Zusammenlegung aller Domänen in ein System** — die Schichtentrennung ist architektonisch korrekt; die Implementierung muss nachgezogen werden

---

## Anhang A: Referenz-Dateien

| Datei | Domäne |
|-------|--------|
| `src/App.jsx` | URL Navigation |
| `src/routes/registry.js` | URL Navigation (Shadow) |
| `src/components/entry/AppEntryController.jsx` | System Navigation |
| `src/components/home/HomeShell.jsx` | Home + Overlay Navigation |
| `src/components/home/navigation/navConfig.js` | Home Navigation |
| `src/pages/Home.jsx` | Overlay Rendering |
| `src/core/hui.navigator.jsx` | Screen Navigation (Scaffold) |
| `src/core/hui.actions.js` | Intent Navigation |
| `src/core/hui.flow.js` | Flow Navigation |
| `src/core/hui.sources.js` | Flow Navigation (Surfaces) |
| `src/context/WorldSurfaceContext.jsx` | Presentation Navigation |
| `src/lib/sessionHooks.js` | Session Navigation |
| `src/feed/cards/FeedRouter.jsx` | Content Routing |
| `docs/HUI_FLOW_LANGUAGE.md` | Flow Language Spec |
| `docs/Z_INDEX_MAP.md` | Z-Index Dokumentation |

## Anhang B: Begriffslexikon

| Begriff | Definition |
|---------|------------|
| **Surface** | Ein navigierbarer Ort in der App (Tab oder Overlay) |
| **Screen** | Einheit im Screen Navigator Modell |
| **Tab** | Persistenter Home-Shell-Navigationspunkt |
| **Overlay** | Temporäre Schicht über dem Tab-Shell |
| **Action** | Validierter User-Intent als Navigation-Command |
| **Flow** | Semantischer Navigationskontext inkl. Return |
| **Registry** | Deklarative Beschreibung navigierbarer Ziele |
| **Shadow Mode** | Registry dokumentiert, beeinflusst Runtime nicht |

## Anhang C: Verwandte Dokumente

| Dokument | Beziehung |
|----------|-----------|
| ADR-001 (Route Authority) | URL Navigation — in `registry.js` referenziert |
| NAV-001 / NAV-001B | Tab Contracts / Shadow Registry |
| `docs/HUI_FLOW_LANGUAGE.md` | Flow Navigation Spec |
| `docs/HUI_ACTION_SEMANTICS.md` | Intent Navigation Spec |
| `docs/SYSTEM_OWNERSHIP.md` | Ownership-Prinzip (analog für Navigation) |
| `docs/ARCHITECTURE_INDEX.md` | Gesamtarchitektur-Querverweis |

---

*RFC-001 endet hier. Nächster Schritt: ADR-002 (Screen Authority) und NAV-002 (Parity Validation) — beides keine Implementierung, sondern Entscheidungs- bzw. Validierungsgrundlage.*
