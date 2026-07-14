# Domain Contract — WIRKUNG

> **ARCH-005.1 — Fachliche Verfassung**  
> **Domain:** Wirkung, Resonance & Orb  
> **Status:** Ratifiziert (Governance)  
> **Datum:** 2026-06-30  
> **Basis:** DOMAIN_ARCHITECTURE_BLUEPRINT_V1 · Constitution · ADR · RFC · SYSTEM_OWNERSHIP

---

## Zweck

Gelebte Wirkung sichtbar machen — Orb, Resonanz, Grundpfeiler-Signale. Single Source of Truth für Wirkung.

**Grundpfeiler-Bezug:** Alle fünf Grundpfeiler — Constitution-Kern

---

## Verantwortung

### Besitzt (fachlich)

- Core Engine
- Resonance Engine
- Orb Engine
- Pillar-Signale
- Resonanz-Reactions

### Besitzt ausdrücklich NICHT

- UI-Darstellung ohne Engine (→ Components lesen nur)
- Profil-Identität (→ IDENTITY)
- Feed (→ DISCOVERY)
- Commerce

---

## Daten

### Tabellen — exklusiver Besitz (Write-Owner)

- `resonance_signals`
- `orb_states`
- `core_metrics`

### Tabellen — nur lesen

- `profiles`
- `impact_pool`

### Tabellen — niemals schreiben

- `works`
- `bookings`
- `messages`
- `follows`

---

## Ownership

| Kategorie | Owner / Erlaubte Zugriffe |
|---|---|
| **Services** | coreEngine.js, resonanceEngine.js, orbEngine.js, resonanceService (content.js) |
| **Contexts** | — |
| **Hooks** | useCoreEngine, useOrbParams, useCoreProfile |
| **Komponenten** | components/orb/*, system/orb/*, components/OrbCompass, components/HuiPlusSheet, components/profile/OrbSignatur |
| **Pages** | — (embedded / Overlays) |

**Dateien in Domain:** 26 (siehe `docs/generated/domain-file-map.json`)

---

## Public API

| Service / Modul | Sichtbarkeit | Methoden / Export |
| --- | --- | --- |
| coreEngine | public | recordSignal, getCoreProfile, getPillarStrengths |
| resonanceEngine | internal | recordReaction, getResonanceDepth |
| orbEngine | public | computeOrbParams, getOrbTraits |
| useCoreEngine | public | — |

### Intern (nicht cross-domain)

- Domain-interne Helper und private Module
- Temporäre Facade-Anteile in `services/db.js` (Ziel: split)

---

## Events

### Veröffentlicht

- `resonance.sent`
- `orb.evolved`
- `RESONANCE_CREATED`
- `RESONANCE_REMOVED`

### Konsumiert

- `BOOKING_COMPLETED`
- `CONNECTION_ACCEPTED`
- `WORK_PUBLISHED`
- `IMPACT_SUPPORTED`

### Darf niemals erzeugen

- `gamification.*`
- `realtime.orb.levelup`

---

## Realtime

### Kanäle

_Keine dedizierten Kanäle_

### Erlaubte Presence-Informationen

_Keine_

---

## Layer

### Erlaubte Layer

- Domain
- Core
- Infrastructure
- Application

### Verbotene Layer

- Presentation

**RFC-000 Mapping:** Presentation = PAGES/COMPONENTS · Application = HOOKS/CONTEXT/FEATURES · Domain = SERVICES/SYSTEM · Infrastructure = lib/* · Core = core/* + registry/*

---

## Dependencies

### Darf abhängen von

- `KERNEL`

### Darf abhängig sein von

- `IDENTITY`
- `DISCOVERY`
- `CREATION`
- `IMPACT`
- `CONNECTION`
- `WORLD`
- `INTELLIGENCE`

### Verbotene zyklische Abhängigkeiten

- WIRKUNG → UI → WIRKUNG (ohne Engine)

---

## Constitution

### Besonders geltende Regeln

- IV — Core Engine Single Source of Truth
- VI — Orb-Philosophie
- Regel 5 — Orb zeigt keine Leistung
- Regel 8 — Keine Gamification

### Invarianten

- Kein Orb-Update nach Einzelaktion
- Core tables via Core Engine only
- Datenfluss unidirektional

### ADRs

- ADR-0001 (Core Architecture — TODO: Branch-Merge)

### RFCs

- RFC-000 Rule 4

---

## Scanner Rules

- CORE_BYPASS: Jeder Write auf Core-Tabellen außerhalb src/core/
- UI_IMPACT_LOGIC: Wirkungslogik in Components
- ORB_REALTIME: Orb darf nicht Echtzeit-Gamification triggern

---

## Intelligence

### Empfehlungen

- coreEngine als einziger Write-Gateway
- resonanceService → wirkungService umbenennen
- Alle 42 CRITICAL beheben

### Typische Risiken

- 42 CRITICAL Core Bypasses gesamt
- Orb-Gamification-Drift

### Erlaubte Refactorings

- Core Engine Gateway
- Engine-Konsolidierung

### Niemals

- Orb Level-Up Animationen
- Score/XP System

---

## Migration

### Vollständig migriert wenn

- Core Engine Adoption > 90%
- 0 CRITICAL Core Bypass
- Alle Wirkungs-Writes über Engine

### Metriken „fertig"

- **coreEngineAdoption:** 4% → 90%+
- **criticalViolations:** 0

**Aktueller Health Score (Baseline):** 45%

---

## Referenzen

- [`DOMAIN_ARCHITECTURE_BLUEPRINT_V1.md`](../DOMAIN_ARCHITECTURE_BLUEPRINT_V1.md)
- [`SYSTEM_OWNERSHIP.md`](../SYSTEM_OWNERSHIP.md)
- [`HUI_CONSTITUTION.md`](../../HUI_CONSTITUTION.md)
- Domain-Dateien: components/HuiPlusSheet.jsx, components/OrbCompass.jsx, components/orb/OrbLeaf.jsx, components/profile/OrbSignatur.jsx, core/coreEngine.js, core/hui.pillars.js, core/orbEngine.js, core/resonanceEngine.js (+18)

---

*Domain Contract WIRKUNG — ARCH-005.1. Keine Runtime-Änderung.*
