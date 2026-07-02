# Domain Contract — KERNEL

> **ARCH-005.1 — Fachliche Verfassung**  
> **Domain:** Platform Kernel & Governance  
> **Status:** Ratifiziert (Governance)  
> **Datum:** 2026-06-30  
> **Basis:** DOMAIN_ARCHITECTURE_BLUEPRINT_V1 · Constitution · ADR · RFC · SYSTEM_OWNERSHIP

---

## Zweck

Unveränderliche Plattformgrundlage: Verfassung, Semantik, Action-System, Routing-Registry, Design-Tokens, Supabase-Client, Architektur-Scanner und globale App-Orchestrierung.

**Grundpfeiler-Bezug:** Querschnitt — Fundament aller Grundpfeiler

---

## Verantwortung

### Besitzt (fachlich)

- Registry als Single Source of Meaning (HuiRegistry)
- Action Engine und Flow-Navigation (hui.actions, hui.flow, hui.navigator)
- Route Registry im Shadow Mode (ADR-001)
- Infrastruktur: supabaseClient, safeQuery, events/index, ErrorBoundaries
- Architecture Scanner & Governance-Artefakte (ARCH-001–004)
- Cross-Domain-Hub AppStateContext (Ziel: entflechten)
- services/db.js als temporäre Facade (Ziel: Domain-Services)

### Besitzt ausdrücklich NICHT

- Fachliche Wirkungslogik (→ WIRKUNG)
- Profil-, Chat-, Commerce- oder Feed-Daten (→ jeweilige Domain)
- Eigene UI-Features jenseits Shell/Orchestrierung
- Direkte Business-Entscheidungen

---

## Daten

### Tabellen — exklusiver Besitz (Write-Owner)

_Keine fachlichen Tabellen (Meta/Infrastructure-Domain)_

### Tabellen — nur lesen

- `*`

### Tabellen — niemals schreiben

- `profiles`
- `wirker_profiles`
- `impact_votes`
- `resonance_signals`
- `orb_states`
- `core_metrics`
- `bookings`
- `works`
- `messages`
- `notifications`

---

## Ownership

| Kategorie | Owner / Erlaubte Zugriffe |
|---|---|
| **Services** | services/db.js (Facade), lib/supabaseClient.js, lib/safeQuery.js, lib/events/index.js |
| **Contexts** | lib/AppStateContext.jsx (Cross-Domain-Hub — Ziel: reduzieren) |
| **Hooks** | — |
| **Komponenten** | App.jsx, components/ErrorBoundary.jsx, components/ProtectedRoute.jsx, components/entry/* |
| **Pages** | pages/Home.jsx (Orchestrierung) |

**Dateien in Domain:** 64 (siehe `docs/generated/domain-file-map.json`)

---

## Public API

| Service / Modul | Sichtbarkeit | Methoden / Export |
| --- | --- | --- |
| HuiRegistry (`src/registry/HuiRegistry.js`) | public | — |
| HUI_ACTIONS / useHuiActions (`src/core/hui.actions.js`) | public | — |
| ROUTE_REGISTRY (`src/routes/registry.js`) | public | — |
| emit (Platform Events) (`src/lib/events/index.js`) | public | — |
| db.js Facade (`src/services/db.js`) | internal | — |

### Intern (nicht cross-domain)

- Domain-interne Helper und private Module
- Temporäre Facade-Anteile in `services/db.js` (Ziel: split)

---

## Events

### Veröffentlicht

- `HUI_ACTIONS.*`
- `overlay.* (CustomEvents)`

### Konsumiert

_Keine_

### Darf niemals erzeugen

- `resonance.sent`
- `orb.evolved`
- `booking.completed`
- `message.sent`

---

## Realtime

### Kanäle

_Keine dedizierten Kanäle_

### Erlaubte Presence-Informationen

_Keine_

---

## Layer

### Erlaubte Layer

- Core
- Infrastructure
- Application

### Verbotene Layer

- Presentation

**RFC-000 Mapping:** Presentation = PAGES/COMPONENTS · Application = HOOKS/CONTEXT/FEATURES · Domain = SERVICES/SYSTEM · Infrastructure = lib/* · Core = core/* + registry/*

---

## Dependencies

### Darf abhängen von



### Darf abhängig sein von

- `*`

### Verbotene zyklische Abhängigkeiten

- KERNEL → fachliche Domain → KERNEL (ohne Service-Gateway)

---

## Constitution

### Besonders geltende Regeln

- IV — Schichtenmodell
- IV — Registry Single Source of Meaning
- IV — unidirektionaler Datenfluss
- IX — Entscheidungsregel

### Invarianten

- Constitution → Registry → Engines → UI
- Keine Runtime-Imports aus ARCHITECTURE

### ADRs

- ADR-001
- ADR-002

### RFCs

- RFC-000
- RFC-000A

---

## Scanner Rules

- MISSING_HEADER: @domain=KERNEL @owner erforderlich
- LAYER_VIOLATION: ARCHITECTURE darf nicht importiert werden
- CROSS_DOMAIN_WRITE: AppStateContext darf fremde Tabellen nicht schreiben (Ziel)
- REGISTRY_BYPASS: Labels/Farben aus HuiRegistry
- DIRECT_ROUTING: Action Engine statt window.location

---

## Intelligence

### Empfehlungen

- AppStateContext entflechten
- db.js in Domain-Services splitten
- @domain/@owner Header rollout

### Typische Risiken

- Monolithischer Cross-Domain-State
- Facade db.js als Single Point of Failure

### Erlaubte Refactorings

- Header-Tags
- Scanner-Integration
- Route Registry Parity

### Niemals

- Runtime-Routing aus Registry ohne NAV-003 Freigabe

---

## Migration

### Vollständig migriert wenn

- 100% @domain/@owner Header
- domain-file-map.json = Scanner-Quelle
- AppStateContext Entflechtungsplan dokumentiert

### Metriken „fertig"

- **headerCoverage:** 100%
- **architectureCoverage:** 100%
- **violationsReduction:** -267 INFO (MISSING_HEADER)

**Aktueller Health Score (Baseline):** 55%

---

## Referenzen

- [`DOMAIN_ARCHITECTURE_BLUEPRINT_V1.md`](../DOMAIN_ARCHITECTURE_BLUEPRINT_V1.md)
- [`SYSTEM_OWNERSHIP.md`](../SYSTEM_OWNERSHIP.md)
- [`HUI_CONSTITUTION.md`](../../HUI_CONSTITUTION.md)
- Domain-Dateien: App.jsx, architecture/scanner/cli.js, architecture/scanner/domains.js, architecture/scanner/fileScanner.js, architecture/scanner/graphBuilder.js, architecture/scanner/index.js, architecture/scanner/metricsCalculator.js, architecture/scanner/reportGenerator.js (+56)

---

*Domain Contract KERNEL — ARCH-005.1. Keine Runtime-Änderung.*
