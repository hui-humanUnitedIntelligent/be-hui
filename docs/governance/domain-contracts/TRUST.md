# Domain Contract — TRUST

> **ARCH-005.1 — Fachliche Verfassung**  
> **Domain:** Trust & Reputation  
> **Status:** Ratifiziert (Governance)  
> **Datum:** 2026-06-30  
> **Basis:** DOMAIN_ARCHITECTURE_BLUEPRINT_V1 · Constitution · ADR · RFC · SYSTEM_OWNERSHIP

---

## Zweck

Vertrauen aufbauen — Reputation, Zuverlässigkeit und Trust-Signale.

**Grundpfeiler-Bezug:** 💚 Unterstützen

---

## Verantwortung

### Besitzt (fachlich)

- Trust-Signale
- Reputation-Scores
- Verifizierungs-Metadaten

### Besitzt ausdrücklich NICHT

- Profil-Daten (→ IDENTITY)
- Commerce (→ COMMERCE)
- Chat (→ COMMUNICATION)
- Gamification/Badges

---

## Daten

### Tabellen — exklusiver Besitz (Write-Owner)

- `trust_scores`
- `reputation_events`

### Tabellen — nur lesen

- `profiles`
- `bookings`

### Tabellen — niemals schreiben

- `profiles`
- `works`
- `messages`

---

## Ownership

| Kategorie | Owner / Erlaubte Zugriffe |
|---|---|
| **Services** | lib/trust/index.js (Ziel: TrustService) |
| **Contexts** | lib/trustContext.js (Owner) |
| **Hooks** | useReputation |
| **Komponenten** |  |
| **Pages** | — (embedded / Overlays) |

**Dateien in Domain:** 2 (siehe `docs/generated/domain-file-map.json`)

---

## Public API

| Service / Modul | Sichtbarkeit | Methoden / Export |
| --- | --- | --- |
| recordTrustSignal (`lib/trust/index.js`) | public | — |
| useReputation (`trustContext.js`) | public | — |

### Intern (nicht cross-domain)

- Domain-interne Helper und private Module
- Temporäre Facade-Anteile in `services/db.js` (Ziel: split)

---

## Events

### Veröffentlicht

- `trust.updated`

### Konsumiert

- `BOOKING_COMPLETED`
- `CONNECTION_DEEPENED`
- `WORK_PUBLISHED`

### Darf niemals erzeugen

- `gamification.badge`
- `leaderboard.update`

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
- Core

### Verbotene Layer

_Keine zusätzlichen Verbote_

**RFC-000 Mapping:** Presentation = PAGES/COMPONENTS · Application = HOOKS/CONTEXT/FEATURES · Domain = SERVICES/SYSTEM · Infrastructure = lib/* · Core = core/* + registry/*

---

## Dependencies

### Darf abhängen von

- `KERNEL`
- `IDENTITY`
- `COMMERCE`
- `CONNECTION`

### Darf abhängig sein von

- `DISCOVERY`
- `CONNECTION`

### Verbotene zyklische Abhängigkeiten

- TRUST → IDENTITY (Profile-Write)

---

## Constitution

### Besonders geltende Regeln

- Regel 1 — Menschen sind keine Produkte
- Regel 8 — Keine Gamification

### Invarianten

- Keine öffentlichen Scores/Rankings
- Trust ≠ Belohnungssystem

### ADRs

_Keine domain-spezifischen ADRs_

### RFCs

- RFC-000

---

## Scanner Rules

- GAMIFICATION: Keine Badge/Level-Logik in TRUST
- CROSS_DOMAIN_WRITE: trust_scores aus fremden Domains
- PUBLIC_SCORE: Kein Score im UI (Constitution VIII)

---

## Intelligence

### Empfehlungen

- TrustService extrahieren
- Trust-Signale über Events statt Direct-Write

### Typische Risiken

- Kleine Domain — geringe Violation-Dichte
- TODO: trust_scores Tabellen-Existenz verifizieren

### Erlaubte Refactorings

- TrustService
- Event-basierte Trust-Signale

### Niemals

- Reputation-Leaderboards
- Public Trust Scores

---

## Migration

### Vollständig migriert wenn

- trustContext alleiniger Owner
- TrustService dokumentiert

### Metriken „fertig"

- **healthScore:** 75% → 95%

**Aktueller Health Score (Baseline):** 75%

---

## Referenzen

- [`DOMAIN_ARCHITECTURE_BLUEPRINT_V1.md`](../DOMAIN_ARCHITECTURE_BLUEPRINT_V1.md)
- [`SYSTEM_OWNERSHIP.md`](../SYSTEM_OWNERSHIP.md)
- [`HUI_CONSTITUTION.md`](../../HUI_CONSTITUTION.md)
- Domain-Dateien: lib/trust/index.js, lib/trustContext.js

---

*Domain Contract TRUST — ARCH-005.1. Keine Runtime-Änderung.*
