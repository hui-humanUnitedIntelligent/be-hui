# Domain Contract — DISCOVERY

> **ARCH-005.1 — Fachliche Verfassung**  
> **Domain:** Discovery & Feed  
> **Status:** Ratifiziert (Governance)  
> **Datum:** 2026-06-30  
> **Basis:** DOMAIN_ARCHITECTURE_BLUEPRINT_V1 · Constitution · ADR · RFC · SYSTEM_OWNERSHIP

---

## Zweck

Orientierung — Feed, Suche, Entdeckung. Keine Aufmerksamkeitsmaschine.

**Grundpfeiler-Bezug:** Querschnitt — Orientierung für alle Grundpfeiler

---

## Verantwortung

### Besitzt (fachlich)

- Home-Feed
- Discover
- Search
- Favorites
- Feed-Rhythmus
- People Search

### Besitzt ausdrücklich NICHT

- Content-Erstellung (→ CREATION)
- Resonanz-Engine (→ WIRKUNG)
- Profil-Writes (→ IDENTITY)
- Connection-Logik (→ CONNECTION)

---

## Daten

### Tabellen — exklusiver Besitz (Write-Owner)

- `feed_items`
- `feed_posts`

### Tabellen — nur lesen

- `works`
- `experiences`
- `profiles`
- `stories`
- `resonance_signals`

### Tabellen — niemals schreiben

- `profiles`
- `works`
- `bookings`
- `messages`
- `impact_votes`

---

## Ownership

| Kategorie | Owner / Erlaubte Zugriffe |
|---|---|
| **Services** | FeedService, SearchService (db.js), feedService, discoverService (content.js) |
| **Contexts** | — (Ziel: DiscoveryContext) |
| **Hooks** | useFeedStream |
| **Komponenten** | feed/*, components/discovery/*, components/home/header/SearchCommandCenter, components/DiscoveryFeed.jsx |
| **Pages** | pages/DiscoverPage, pages/FavoritesPage, pages/LiveMapPage |

**Dateien in Domain:** 21 (siehe `docs/generated/domain-file-map.json`)

---

## Public API

| Service / Modul | Sichtbarkeit | Methoden / Export |
| --- | --- | --- |
| FeedService | public | getFeed, refreshFeed |
| SearchService | public | searchUsers, searchWorks |
| useFeedStream (`feed/useFeedStream.js`) | public | — |
| feedRhythmEngine | internal | — |

### Intern (nicht cross-domain)

- Domain-interne Helper und private Module
- Temporäre Facade-Anteile in `services/db.js` (Ziel: split)

---

## Events

### Veröffentlicht

- `feed.refreshed`
- `discovery.search`

### Konsumiert

- `WORK_PUBLISHED`
- `EXPERIENCE_CREATED`
- `CONNECTION_OPENED`
- `RESONANCE_CREATED`

### Darf niemals erzeugen

- `resonance.sent`
- `engagement.maximized`

---

## Realtime

### Kanäle

- `works-feed`

### Erlaubte Presence-Informationen

_Keine_

---

## Layer

### Erlaubte Layer

- Presentation
- Application
- Domain
- Infrastructure
- Core

### Verbotene Layer

_Keine zusätzlichen Verbote_

**RFC-000 Mapping:** Presentation = PAGES/COMPONENTS · Application = HOOKS/CONTEXT/FEATURES · Domain = SERVICES/SYSTEM · Infrastructure = lib/* · Core = core/* + registry/*

---

## Dependencies

### Darf abhängen von

- `KERNEL`
- `CREATION`
- `CONNECTION`
- `WIRKUNG`
- `IDENTITY`

### Darf abhängig sein von

- `INTELLIGENCE`
- `WORLD`

### Verbotene zyklische Abhängigkeiten

- DISCOVERY → CREATION (Write) → DISCOVERY

---

## Constitution

### Besonders geltende Regeln

- Regel 6 — Feed dient Orientierung
- Regel 2 — Wirkung wichtiger als Aufmerksamkeit
- Kein Infinite Scroll ohne Pause

### Invarianten

- Keine algorithmische Outrage-Verstärkung
- Keine Rankings/Leaderboards

### ADRs

_Keine domain-spezifischen ADRs_

### RFCs

- RFC-000

---

## Scanner Rules

- DB_DIRECT_READ: DiscoveryFeed local DB (akzeptiert — Ziel: Service)
- CROSS_DOMAIN_WRITE: Feed schreibt fremde Tabellen
- INFINITE_SCROLL: Constitution-Check (TODO: Scanner-Regel)

---

## Intelligence

### Empfehlungen

- discoveryService = FeedService + feedService + SearchService
- DiscoveryFeed entmonolithisieren

### Typische Risiken

- DiscoveryFeed 2562 Zeilen
- 5 multi-domain files

### Erlaubte Refactorings

- Feed-Service-Konsolidierung
- DiscoveryContext

### Niemals

- Engagement-optimierter Algorithmus
- Ranking-UI

---

## Migration

### Vollständig migriert wenn

- Ein Feed-Owner
- discoveryService kanonisch
- Kein Feed-Monolith

### Metriken „fertig"

- **healthScore:** 40% → 80%

**Aktueller Health Score (Baseline):** 40%

---

## Referenzen

- [`DOMAIN_ARCHITECTURE_BLUEPRINT_V1.md`](../DOMAIN_ARCHITECTURE_BLUEPRINT_V1.md)
- [`SYSTEM_OWNERSHIP.md`](../SYSTEM_OWNERSHIP.md)
- [`HUI_CONSTITUTION.md`](../../HUI_CONSTITUTION.md)
- Domain-Dateien: components/discovery/PeopleSearch.jsx, components/home/header/SearchCommandCenter.jsx, features/discovery/userSearch.js, feed/FeedEventsSection.jsx, feed/FeedScrollSentinel.jsx, feed/FeedSoftHydrationBadge.jsx, feed/UnifiedFeed.jsx, feed/cards/BaseFeedCard.jsx (+13)

---

*Domain Contract DISCOVERY — ARCH-005.1. Keine Runtime-Änderung.*
