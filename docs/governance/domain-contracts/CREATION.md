# Domain Contract — CREATION

> **ARCH-005.1 — Fachliche Verfassung**  
> **Domain:** Creation & Publishing  
> **Status:** Ratifiziert (Governance)  
> **Datum:** 2026-06-30  
> **Basis:** DOMAIN_ARCHITECTURE_BLUEPRINT_V1 · Constitution · ADR · RFC · SYSTEM_OWNERSHIP

---

## Zweck

Neues entstehen lassen — Werke, Erlebnisse, Stories, Momente und Publishing-Flows.

**Grundpfeiler-Bezug:** 🎨 Erschaffen · 🌱 Wertschöpfen

---

## Verantwortung

### Besitzt (fachlich)

- Create-Flows
- Publishing
- Media-Upload
- Content-Lifecycle
- Work/Experience/Story-Interaktionen

### Besitzt ausdrücklich NICHT

- Commerce/Payments (→ COMMERCE)
- Feed-Aggregation (→ DISCOVERY)
- Profil (→ IDENTITY)
- Resonanz-Berechnung (→ WIRKUNG)

---

## Daten

### Tabellen — exklusiver Besitz (Write-Owner)

- `works`
- `experiences`
- `stories`
- `story_views`
- `feed_posts`
- `moments`
- `work_likes`
- `work_saves`
- `comments`

### Tabellen — nur lesen

- `profiles`
- `wirker_profiles`

### Tabellen — niemals schreiben

- `profiles`
- `bookings`
- `impact_votes`

---

## Ownership

| Kategorie | Owner / Erlaubte Zugriffe |
|---|---|
| **Services** | WorkService, ExperienceService, StoryService (db.js), worksService, storageService (content.js) |
| **Contexts** | AppStateContext.works (Owner → Ziel: CreationContext) |
| **Hooks** | — |
| **Komponenten** | components/HuiCreateFlow, components/WerkPublisher, components/ExperienceCreator, components/publishing/*, components/works/*, … |
| **Pages** | — (embedded / Overlays) |

**Dateien in Domain:** 30 (siehe `docs/generated/domain-file-map.json`)

---

## Public API

| Service / Modul | Sichtbarkeit | Methoden / Export |
| --- | --- | --- |
| WorkService | public | createWork, updateWork, getWork |
| ExperienceService | public | createExperience, getExperiences |
| StoryService | public | createStory, recordView |
| storageService | public | uploadMedia |

### Intern (nicht cross-domain)

- Domain-interne Helper und private Module
- Temporäre Facade-Anteile in `services/db.js` (Ziel: split)

---

## Events

### Veröffentlicht

- `WORK_PUBLISHED`
- `EXPERIENCE_CREATED`
- `work.published`
- `experience.created`
- `story.posted`
- `moment.shared`
- `WORK_RESONATED`

### Konsumiert

- `PROFILE_COMPLETED`
- `TALENT_ACTIVATED`

### Darf niemals erzeugen

- `resonance.sent (→ WIRKUNG)`
- `impact.vote.cast`

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
- `IDENTITY`
- `WIRKUNG`

### Darf abhängig sein von

- `COMMERCE`
- `DISCOVERY`
- `STUDIO`

### Verbotene zyklische Abhängigkeiten

- CREATION → DISCOVERY → CREATION (Feed-Write-Loop)

---

## Constitution

### Besonders geltende Regeln

- Regel 2 — Wirkung wichtiger als Aufmerksamkeit
- Regel 6 — Feed dient Orientierung

### Invarianten

- Create-Flows: akzeptierte Direct-Writes nur isoliert
- Keine Like-Gamification

### ADRs

_Keine domain-spezifischen ADRs_

### RFCs

- RFC-000

---

## Scanner Rules

- DB_DIRECT_WRITE: WorkDetailPage writes work_likes/work_saves
- DUPLICATE_OWNER: works (11 shadow states)
- CROSS_DOMAIN_WRITE: StoryBar writes messages

---

## Intelligence

### Empfehlungen

- creationService aus WorkService + worksService
- WorkDetailPage → CreationService
- 11 work-shadow-states eliminieren

### Typische Risiken

- HuiCreateFlow 1782 Zeilen
- WorkDetailPage cross-domain writes

### Erlaubte Refactorings

- Service-Konsolidierung
- CreationContext

### Niemals

- Like-Counter UI
- Viral-Loops

---

## Migration

### Vollständig migriert wenn

- creationService kanonisch
- Ein Work-Owner
- Create-Flows über Service

### Metriken „fertig"

- **healthScore:** 35% → 75%
- **duplicateOwners:** 0

**Aktueller Health Score (Baseline):** 35%

---

## Referenzen

- [`DOMAIN_ARCHITECTURE_BLUEPRINT_V1.md`](../DOMAIN_ARCHITECTURE_BLUEPRINT_V1.md)
- [`SYSTEM_OWNERSHIP.md`](../SYSTEM_OWNERSHIP.md)
- [`HUI_CONSTITUTION.md`](../../HUI_CONSTITUTION.md)
- Domain-Dateien: components/ExperienceCreator.jsx, components/HuiCreateFlow.jsx, components/HuiMomentSheet.jsx, components/StoryBar.jsx, components/StoryComposer.jsx, components/WerkPublisher.jsx, components/WorkDetailPage.jsx, components/experiences/ExperienceWizard.jsx (+22)

---

*Domain Contract CREATION — ARCH-005.1. Keine Runtime-Änderung.*
