# Domain Contract — CONNECTION

> **ARCH-005.1 — Fachliche Verfassung**  
> **Domain:** Connection & Community  
> **Status:** Ratifiziert (Governance)  
> **Datum:** 2026-06-30  
> **Basis:** DOMAIN_ARCHITECTURE_BLUEPRINT_V1 · Constitution · ADR · RFC · SYSTEM_OWNERSHIP

---

## Zweck

Menschen verbinden — Beziehungen, Empfehlungen, Einladungen, Match und Referrals.

**Grundpfeiler-Bezug:** 🤝 Verbinden

---

## Verantwortung

### Besitzt (fachlich)

- Follows
- Connections
- Referrals
- Recommendations
- Match-Scores
- Gemeinschafts-Flows

### Besitzt ausdrücklich NICHT

- Chat/Messaging (→ COMMUNICATION)
- Profil-Daten (→ IDENTITY)
- Feed-Ranking (→ DISCOVERY)
- Trust-Scores (→ TRUST)

---

## Daten

### Tabellen — exklusiver Besitz (Write-Owner)

- `follows`
- `connections`
- `recommendations`
- `user_match_scores`
- `referrals`

### Tabellen — nur lesen

- `profiles`
- `trust_scores`

### Tabellen — niemals schreiben

- `profiles`
- `messages`
- `works`
- `bookings`

---

## Ownership

| Kategorie | Owner / Erlaubte Zugriffe |
|---|---|
| **Services** | RecommendationService, MatchService (db.js), lib/referralTracking.js, lib/community/* |
| **Contexts** | AppStateContext.follows (Owner → Ziel: ConnectionContext) |
| **Hooks** | — |
| **Komponenten** | components/connection-create/*, components/GemeinschaftsFlow, components/HuiMatchOverlay, components/shared/ConnectionFlowCard, components/home/header/MatchBar |
| **Pages** | — (embedded / Overlays) |

**Dateien in Domain:** 20 (siehe `docs/generated/domain-file-map.json`)

---

## Public API

| Service / Modul | Sichtbarkeit | Methoden / Export |
| --- | --- | --- |
| RecommendationService | public | createRecommendation, getRecommendations |
| MatchService | public | getMatchScore, computeMatch |
| toggleFollow | public | toggleFollow |
| emitAfterConnection (`lib/events/index.js`) | public | — |

### Intern (nicht cross-domain)

- Domain-interne Helper und private Module
- Temporäre Facade-Anteile in `services/db.js` (Ziel: split)

---

## Events

### Veröffentlicht

- `CONNECTION_OPENED`
- `CONNECTION_ACCEPTED`
- `CONNECTION_DEEPENED`
- `connection.created`
- `follow.toggled`
- `recommendation.received`
- `RECOMMENDATION_GIVEN`

### Konsumiert

- `BOOKING_COMPLETED`
- `WORK_PUBLISHED`

### Darf niemals erzeugen

- `resonance.sent`
- `impact.vote.cast`

---

## Realtime

### Kanäle

_Keine dedizierten Kanäle_

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
- `IDENTITY`
- `WIRKUNG`
- `TRUST`

### Darf abhängig sein von

- `DISCOVERY`
- `INTELLIGENCE`
- `COMMUNICATION`

### Verbotene zyklische Abhängigkeiten

- CONNECTION → DISCOVERY → CONNECTION ohne Event

---

## Constitution

### Besonders geltende Regeln

- Regel 3 — Verbinden wichtiger als Reichweite
- Regel 8 — Keine Gamification

### Invarianten

- Keine Follower-Zählung im UI
- Reichweite nie als Qualitätsmerkmal

### ADRs

_Keine domain-spezifischen ADRs_

### RFCs

- RFC-000

---

## Scanner Rules

- DB_DIRECT_WRITE: WorkDetailPage writes follows
- DUPLICATE_OWNER: follows (AppState + WorkDetailPage)
- CROSS_DOMAIN_WRITE: connections aus fremden Domains

---

## Intelligence

### Empfehlungen

- ConnectionContext extrahieren
- toggleFollow() zentralisieren
- WorkDetailPage → ConnectionService

### Typische Risiken

- WorkDetailPage direct writes
- 8 shadow states analog bookings

### Erlaubte Refactorings

- ConnectionContext
- Follow-Service-Konsolidierung

### Niemals

- Follower-Counts
- Leaderboards

---

## Migration

### Vollständig migriert wenn

- Ein Follow-Owner
- 0 Direct-Writes in UI
- ConnectionContext aktiv

### Metriken „fertig"

- **healthScore:** 40% → 80%
- **duplicateOwners:** 0

**Aktueller Health Score (Baseline):** 40%

---

## Referenzen

- [`DOMAIN_ARCHITECTURE_BLUEPRINT_V1.md`](../DOMAIN_ARCHITECTURE_BLUEPRINT_V1.md)
- [`SYSTEM_OWNERSHIP.md`](../SYSTEM_OWNERSHIP.md)
- [`HUI_CONSTITUTION.md`](../../HUI_CONSTITUTION.md)
- Domain-Dateien: components/GemeinschaftsFlow.jsx, components/HuiMatchOverlay.jsx, components/connection-create/ConnectionCreatePage.jsx, components/connection-create/ConnectionForm.jsx, components/connection-create/ConnectionPreviewCard.jsx, components/connection-create/ConnectionTypeSidebar.jsx, components/connection-create/Selectors.jsx, components/connection-create/StepOneTypeSelection.jsx (+12)

---

*Domain Contract CONNECTION — ARCH-005.1. Keine Runtime-Änderung.*
