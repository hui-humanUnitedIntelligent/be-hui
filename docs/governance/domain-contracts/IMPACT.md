# Domain Contract — IMPACT

> **ARCH-005.1 — Fachliche Verfassung**  
> **Domain:** Impact & Stewardship  
> **Status:** Ratifiziert (Governance)  
> **Datum:** 2026-06-30  
> **Basis:** DOMAIN_ARCHITECTURE_BLUEPRINT_V1 · Constitution · ADR · RFC · SYSTEM_OWNERSHIP

---

## Zweck

Gemeinwohl — Impact Pool, Abstimmungen, Projekte und Stewardship.

**Grundpfeiler-Bezug:** 🌍 Impact

---

## Verantwortung

### Besitzt (fachlich)

- Impact-Voting
- Impact-Projekte
- Impact-Runden
- Impact-Pool-Verteilung

### Besitzt ausdrücklich NICHT

- Commerce/Payments (→ COMMERCE)
- Profil (→ IDENTITY)
- Resonanz (→ WIRKUNG)
- Gamification

---

## Daten

### Tabellen — exklusiver Besitz (Write-Owner)

- `impact_projects`
- `impact_rounds`
- `impact_votes`

### Tabellen — nur lesen

- `profiles`
- `impact_pool`

### Tabellen — niemals schreiben

- `profiles`
- `works`
- `bookings`

---

## Ownership

| Kategorie | Owner / Erlaubte Zugriffe |
|---|---|
| **Services** | ImpactService (db.js) |
| **Contexts** | — |
| **Hooks** | — |
| **Komponenten** | components/studio/ImpactStimmenModal, system/flows/impact/* |
| **Pages** | pages/ImpactPage |

**Dateien in Domain:** 9 (siehe `docs/generated/domain-file-map.json`)

---

## Public API

| Service / Modul | Sichtbarkeit | Methoden / Export |
| --- | --- | --- |
| ImpactService | public | getProjects, castVote, getRounds |

### Intern (nicht cross-domain)

- Domain-interne Helper und private Module
- Temporäre Facade-Anteile in `services/db.js` (Ziel: split)

---

## Events

### Veröffentlicht

- `IMPACT_SUPPORTED`
- `IMPACT_CREATED`
- `impact.vote.cast`
- `impact.round.distributed`

### Konsumiert

- `BOOKING_COMPLETED`
- `ORDER_COMPLETED`

### Darf niemals erzeugen

- `resonance.sent`
- `gamification.*`

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
- `WIRKUNG`
- `IDENTITY`

### Darf abhängig sein von

- `STUDIO`

### Verbotene zyklische Abhängigkeiten

- IMPACT → COMMERCE (Pool-Manipulation)

---

## Constitution

### Besonders geltende Regeln

- Regel 4 — Wertschöpfung und Gemeinwohl
- Impact Pool Prinzip
- Regel 8 — Keine Gamification

### Invarianten

- impact_votes via Core Engine
- Kein Ranking der Voter

### ADRs

_Keine domain-spezifischen ADRs_

### RFCs

- RFC-000 Rule 4 — impact_votes Core-Tabelle

---

## Scanner Rules

- CORE_BYPASS: impact_votes Write ohne Core Engine
- DB_DIRECT_WRITE: ImpactStimmenModal, MeinHUI_SubPages
- CROSS_DOMAIN_WRITE: impact_votes aus STUDIO

---

## Intelligence

### Empfehlungen

- ImpactStimmenModal → Core Engine
- ImpactPage → ImpactService

### Typische Risiken

- Core-Tabelle impact_votes
- Studio cross-writes

### Erlaubte Refactorings

- Core Engine Gateway für Votes

### Niemals

- Vote-Leaderboards
- XP für Impact

---

## Migration

### Vollständig migriert wenn

- 0 CRITICAL impact_votes bypasses
- ImpactService alleiniger Writer

### Metriken „fertig"

- **healthScore:** 60% → 95%
- **criticalViolations:** 0

**Aktueller Health Score (Baseline):** 60%

---

## Referenzen

- [`DOMAIN_ARCHITECTURE_BLUEPRINT_V1.md`](../DOMAIN_ARCHITECTURE_BLUEPRINT_V1.md)
- [`SYSTEM_OWNERSHIP.md`](../SYSTEM_OWNERSHIP.md)
- [`HUI_CONSTITUTION.md`](../../HUI_CONSTITUTION.md)
- Domain-Dateien: components/studio/ImpactStimmenModal.jsx, pages/ImpactPage.jsx, system/flows/impact/ImpactFlow.jsx, system/flows/impact/ImpactStep1Projekt.jsx, system/flows/impact/ImpactStep2Vision.jsx, system/flows/impact/ImpactStep3Kontakt.jsx, system/flows/impact/ImpactStep4Review.jsx, system/flows/impact/ImpactTokens.js (+1)

---

*Domain Contract IMPACT — ARCH-005.1. Keine Runtime-Änderung.*
