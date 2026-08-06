# Domain Contract — INTELLIGENCE

> **ARCH-005.1 — Fachliche Verfassung**  
> **Domain:** Assistive Intelligence  
> **Status:** Ratifiziert (Governance)  
> **Datum:** 2026-06-30  
> **Basis:** DOMAIN_ARCHITECTURE_BLUEPRINT_V1 · Constitution · ADR · RFC · SYSTEM_OWNERSHIP

---

## Zweck

Menschen ergänzen, nicht ersetzen — kontextuelle Assistenz, Relationship Memory, Guidance.

**Grundpfeiler-Bezug:** Querschnitt — KI-Prinzipien (Constitution VII)

---

## Verantwortung

### Besitzt (fachlich)

- Relationship Memory
- Resonance Spaces
- Guidance
- Living Memory
- Emotional Identity (privat)

### Besitzt ausdrücklich NICHT

- Wirkungsberechnung (→ WIRKUNG)
- Feed-Ranking (→ DISCOVERY)
- Profil-Writes (→ IDENTITY)
- Aufmerksamkeitsmaximierung

---

## Daten

### Tabellen — exklusiver Besitz (Write-Owner)

_Keine fachlichen Tabellen (Meta/Infrastructure-Domain)_

### Tabellen — nur lesen

- `profiles`
- `works`
- `resonance_signals`
- `connections`

### Tabellen — niemals schreiben

- `profiles`
- `works`
- `bookings`
- `messages`
- `impact_votes`
- `resonance_signals`

---

## Ownership

| Kategorie | Owner / Erlaubte Zugriffe |
|---|---|
| **Services** | lib/intelligence/index.js, lib/intelligence/*, lib/guidance/* |
| **Contexts** | — |
| **Hooks** | useLivingMemory |
| **Komponenten** | components/guidance/* |
| **Pages** | — (embedded / Overlays) |

**Dateien in Domain:** 20 (siehe `docs/generated/domain-file-map.json`)

---

## Public API

| Service / Modul | Sichtbarkeit | Methoden / Export |
| --- | --- | --- |
| relationshipMemory | internal | — |
| resonanceSpaces | internal | — |
| sharedAtmosphere | internal | — |
| emotionalIdentity | internal | — |

### Intern (nicht cross-domain)

- Domain-interne Helper und private Module
- Temporäre Facade-Anteile in `services/db.js` (Ziel: split)

---

## Events

### Veröffentlicht

- `memory.updated`
- `guidance.shown`

### Konsumiert

- `CONNECTION_OPENED`
- `WORK_PUBLISHED`
- `BOOKING_COMPLETED`

### Darf niemals erzeugen

- `engagement.maximized`
- `filterbubble.amplify`
- `profit.recommendation`

---

## Realtime

### Kanäle

_Keine dedizierten Kanäle_

### Erlaubte Presence-Informationen

_Keine_

---

## Layer

### Erlaubte Layer

- Application
- Domain
- Infrastructure

### Verbotene Layer

- Presentation

**RFC-000 Mapping:** Presentation = PAGES/COMPONENTS · Application = HOOKS/CONTEXT/FEATURES · Domain = SERVICES/SYSTEM · Infrastructure = lib/* · Core = core/* + registry/*

---

## Dependencies

### Darf abhängen von

- `KERNEL`
- `DISCOVERY`
- `WIRKUNG`
- `CONNECTION`
- `IDENTITY`

### Darf abhängig sein von

- `WORLD`

### Verbotene zyklische Abhängigkeiten

- INTELLIGENCE → fachliche Domain (Write)

---

## Constitution

### Besonders geltende Regeln

- VII — KI-Prinzipien
- Regel 7 — KI ersetzt Menschen nicht
- Zentrale Frage: sinnvolle Begegnung

### Invarianten

- Read-only auf fremde Domains
- Niemals User-Flow blockieren
- Emotional Identity nie UI-sichtbar

### ADRs

- ADR-002 (Intelligence via Scanner)

### RFCs

- RFC-000A

---

## Scanner Rules

- CROSS_DOMAIN_WRITE: Intelligence schreibt fremde Tabellen
- ATTENTION_MAX: Keine Verweildauer-Optimierung
- UI_EXPOSURE: emotionalIdentity darf nicht in UI importiert werden

---

## Intelligence

### Empfehlungen

- Klare Read-only Grenze dokumentieren
- Multi-Domain-Files (discoverWorld, relationshipMemory) trennen

### Typische Risiken

- Cross-Domain-Reads ohne Contract
- 3 multi-domain intelligence files

### Erlaubte Refactorings

- Read-only Adapter pro Domain
- Guidance-Isolation

### Niemals

- Engagement-KI
- Manipulative Empfehlungen

---

## Migration

### Vollständig migriert wenn

- 0 Cross-Domain-Writes
- Read-only Adapter dokumentiert
- Guidance isoliert

### Metriken „fertig"

- **healthScore:** 55% → 85%
- **crossDomainWrites:** 0

**Aktueller Health Score (Baseline):** 55%

---

## Referenzen

- [`DOMAIN_ARCHITECTURE_BLUEPRINT_V1.md`](../DOMAIN_ARCHITECTURE_BLUEPRINT_V1.md)
- [`SYSTEM_OWNERSHIP.md`](../SYSTEM_OWNERSHIP.md)
- [`HUI_CONSTITUTION.md`](../../HUI_CONSTITUTION.md)
- Domain-Dateien: components/guidance/GuidanceContext.jsx, components/guidance/GuidanceFooter.jsx, components/guidance/GuidanceLayer.jsx, components/guidance/guidanceTokens.js, lib/guidance/focusSystem.js, lib/guidance/readabilityEngine.js, lib/guidance/visualPriority.js, lib/intelligence/discoverWorld.js (+12)

---

*Domain Contract INTELLIGENCE — ARCH-005.1. Keine Runtime-Änderung.*
