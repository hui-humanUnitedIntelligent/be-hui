# Domain Contract — STUDIO

> **ARCH-005.1 — Fachliche Verfassung**  
> **Domain:** Creator Studio & Operations  
> **Status:** Ratifiziert (Governance)  
> **Datum:** 2026-06-30  
> **Basis:** DOMAIN_ARCHITECTURE_BLUEPRINT_V1 · Constitution · ADR · RFC · SYSTEM_OWNERSHIP

---

## Zweck

Creator-Betrieb — Dashboard, Analytics, Tickets, Admin, Diagnose.

**Grundpfeiler-Bezug:** 🎨 Erschaffen · Operations

---

## Verantwortung

### Besitzt (fachlich)

- Studio-UI
- Creator-Dashboard
- Statistiken
- Support-Tickets
- Admin/Diagnose

### Besitzt ausdrücklich NICHT

- Eigene fachliche Daten (aggregiert nur)
- Profil-Writes (→ IDENTITY)
- Commerce-Transaktionen (→ COMMERCE)
- Wirkungslogik (→ WIRKUNG)

---

## Daten

### Tabellen — exklusiver Besitz (Write-Owner)

_Keine fachlichen Tabellen (Meta/Infrastructure-Domain)_

### Tabellen — nur lesen

- `profiles`
- `works`
- `bookings`
- `orders`
- `impact_projects`
- `messages`

### Tabellen — niemals schreiben

- `profiles`
- `wirker_profiles`
- `impact_votes`
- `works`
- `bookings`
- `messages`
- `availability_slots`

---

## Ownership

| Kategorie | Owner / Erlaubte Zugriffe |
|---|---|
| **Services** | analyticsService (creatorEconomy.js — Ziel: STUDIO only) |
| **Contexts** | — |
| **Hooks** | — |
| **Komponenten** | components/studio/*, components/SupportSheet |
| **Pages** | pages/CreatorStudio, pages/MeinHUI, pages/MyCreatorDashboard, pages/PlatformDashboard, pages/Admin, pages/DiagnosePage, pages/studio/* |

**Dateien in Domain:** 14 (siehe `docs/generated/domain-file-map.json`)

---

## Public API

| Service / Modul | Sichtbarkeit | Methoden / Export |
| --- | --- | --- |
| analyticsService | public | getCreatorStats, getSalesMetrics |

### Intern (nicht cross-domain)

- Domain-interne Helper und private Module
- Temporäre Facade-Anteile in `services/db.js` (Ziel: split)

---

## Events

### Veröffentlicht



### Konsumiert

- `* (read-only Dashboard)`

### Darf niemals erzeugen

- `resonance.sent`
- `profile.updated`
- `booking.created`
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

### Verbotene Layer

- Domain
- Infrastructure

**RFC-000 Mapping:** Presentation = PAGES/COMPONENTS · Application = HOOKS/CONTEXT/FEATURES · Domain = SERVICES/SYSTEM · Infrastructure = lib/* · Core = core/* + registry/*

---

## Dependencies

### Darf abhängen von

- `KERNEL`
- `IDENTITY`
- `CREATION`
- `COMMERCE`
- `COMMUNICATION`
- `IMPACT`
- `WIRKUNG`
- `DISCOVERY`

### Darf abhängig sein von



### Verbotene zyklische Abhängigkeiten

- STUDIO → fachliche Domain (Write) — Aggregator only

---

## Constitution

### Besonders geltende Regeln

- Regel 9 — Funktion muss Grundpfeiler stärken
- DiagnosePage: Admin by design

### Invarianten

- Studio schreibt nicht in fremde Tabellen
- Diagnose: direkter Supabase ok (Admin)

### ADRs

- ADR-001 (Studio Routes)

### RFCs

- RFC-000

---

## Scanner Rules

- CROSS_DOMAIN_WRITE: Studio-Modals schreiben profiles/bookings/impact_votes
- DB_DIRECT_WRITE: StudioSubPages 2047 Zeilen
- AGGREGATOR: Keine eigenen Tabellen

---

## Intelligence

### Empfehlungen

- Studio → Domain-Services delegieren
- ProfilBearbeitenModal → IDENTITY
- 25 HIGH violations beheben

### Typische Risiken

- StudioSubPages cross-writes
- 5 multi-domain studio files
- ProfilBearbeitenModal Core Bypass

### Erlaubte Refactorings

- Service-Delegation
- Modal → Domain-Service

### Niemals

- Studio-eigene DB-Tabellen
- Studio-Wirkungslogik

---

## Migration

### Vollständig migriert wenn

- 0 Direct-Writes (außer DiagnosePage)
- Alle Modals delegieren an Domains
- analyticsService isoliert

### Metriken „fertig"

- **healthScore:** 30% → 70%
- **directWrites:** < 5 (Diagnose only)

**Aktueller Health Score (Baseline):** 30%

---

## Referenzen

- [`DOMAIN_ARCHITECTURE_BLUEPRINT_V1.md`](../DOMAIN_ARCHITECTURE_BLUEPRINT_V1.md)
- [`SYSTEM_OWNERSHIP.md`](../SYSTEM_OWNERSHIP.md)
- [`HUI_CONSTITUTION.md`](../../HUI_CONSTITUTION.md)
- Domain-Dateien: components/SupportSheet.jsx, components/studio/HuiStudio.jsx, components/studio/SicherheitPasswortModal.jsx, pages/Admin.jsx, pages/CreatorDashboard.jsx, pages/CreatorStudio.jsx, pages/DiagnosePage.jsx, pages/MeinHUI.jsx (+6)

---

*Domain Contract STUDIO — ARCH-005.1. Keine Runtime-Änderung.*
