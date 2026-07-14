# Domain Contract — WORLD

> **ARCH-005.1 — Fachliche Verfassung**  
> **Domain:** World & Atmosphere  
> **Status:** Ratifiziert (Governance)  
> **Datum:** 2026-06-30  
> **Basis:** DOMAIN_ARCHITECTURE_BLUEPRINT_V1 · Constitution · ADR · RFC · SYSTEM_OWNERSHIP

---

## Zweck

Atmosphärische Hülle — Stimmung, Oberfläche, Orb-Layer, Tab-Transitions.

**Grundpfeiler-Bezug:** Darstellung — kein Wirkungsmodell

---

## Verantwortung

### Besitzt (fachlich)

- World Surface
- Mood
- Ambient UI
- Tab Visibility
- Orb-Atmosphäre (Darstellung)

### Besitzt ausdrücklich NICHT

- Wirkungsberechnung (→ WIRKUNG)
- Feed-Inhalte (→ DISCOVERY)
- Profil (→ IDENTITY)
- Eigene DB-Persistenz

---

## Daten

### Tabellen — exklusiver Besitz (Write-Owner)

_Keine fachlichen Tabellen (Meta/Infrastructure-Domain)_

### Tabellen — nur lesen



### Tabellen — niemals schreiben

- `*`

---

## Ownership

| Kategorie | Owner / Erlaubte Zugriffe |
|---|---|
| **Services** | lib/world/worldSurfaceController.js, lib/world/orbLayer.js, lib/world/safariPaintRecovery.js |
| **Contexts** | context/WorldSurfaceContext, context/OrbWorldContext |
| **Hooks** | — |
| **Komponenten** | components/home/AmbientWorldBar, components/home/mood/*, components/home/header/MoodOrbButton |
| **Pages** | — (embedded / Overlays) |

**Dateien in Domain:** 13 (siehe `docs/generated/domain-file-map.json`)

---

## Public API

| Service / Modul | Sichtbarkeit | Methoden / Export |
| --- | --- | --- |
| worldSurfaceController | public | setSurface, getSurface |
| orbLayer | public | orbAtmosphereFromWorld |
| WORLD_CSS | public | — |

### Intern (nicht cross-domain)

- Domain-interne Helper und private Module
- Temporäre Facade-Anteile in `services/db.js` (Ziel: split)

---

## Events

### Veröffentlicht

- `mood.changed`
- `surface.transitioned`

### Konsumiert

- `orb.evolved (read-only visual)`

### Darf niemals erzeugen

- `resonance.sent`
- `profile.updated`

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
- Infrastructure

### Verbotene Layer

- Domain

**RFC-000 Mapping:** Presentation = PAGES/COMPONENTS · Application = HOOKS/CONTEXT/FEATURES · Domain = SERVICES/SYSTEM · Infrastructure = lib/* · Core = core/* + registry/*

---

## Dependencies

### Darf abhängen von

- `KERNEL`
- `WIRKUNG`

### Darf abhängig sein von

- `DISCOVERY`
- `STUDIO`

### Verbotene zyklische Abhängigkeiten

- WORLD → WIRKUNG (Write)

---

## Constitution

### Besonders geltende Regeln

- V — Designprinzipien (Ruhig, Warm, Organisch)
- VI — Orb Darstellung only

### Invarianten

- Kein eigenes Wirkungsmodell
- World liest WIRKUNG, schreibt nicht

### ADRs

_Keine domain-spezifischen ADRs_

### RFCs

- RFC-000

---

## Scanner Rules

- DB_WRITE: WORLD darf niemals DB schreiben
- WIRKUNG_BYPASS: Keine Orb-Berechnung in WORLD
- LAYER: Presentation only — kein Domain-Layer

---

## Intelligence

### Empfehlungen

- orbLayer vs orbEngine Grenze schärfen
- 6 multi-domain world files dokumentieren

### Typische Risiken

- WIRKUNG/WORLD Grenzverwischung
- Mood-State in HomeShell

### Erlaubte Refactorings

- Atmosphere-Adapter
- World/WIRKUNG Trennung

### Niemals

- Wirkungslogik in World Layer

---

## Migration

### Vollständig migriert wenn

- 0 DB-Writes
- WIRKUNG-Read-only
- WorldSurfaceContext isoliert

### Metriken „fertig"

- **healthScore:** 60% → 90%
- **dbWrites:** 0

**Aktueller Health Score (Baseline):** 60%

---

## Referenzen

- [`DOMAIN_ARCHITECTURE_BLUEPRINT_V1.md`](../DOMAIN_ARCHITECTURE_BLUEPRINT_V1.md)
- [`SYSTEM_OWNERSHIP.md`](../SYSTEM_OWNERSHIP.md)
- [`HUI_CONSTITUTION.md`](../../HUI_CONSTITUTION.md)
- Domain-Dateien: components/home/AmbientWorldBar.jsx, components/home/header/MoodOrbButton.jsx, components/home/mood/MoodSelector.jsx, components/home/mood/MoodSheet.jsx, components/home/mood/moodConfig.js, context/OrbWorldContext.jsx, context/WorldSurfaceContext.jsx, lib/cleanup/cleanupOrbEnvironment.js (+5)

---

*Domain Contract WORLD — ARCH-005.1. Keine Runtime-Änderung.*
