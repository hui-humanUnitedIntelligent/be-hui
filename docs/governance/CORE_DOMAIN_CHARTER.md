# CORE Domain Charter

**Domäne:** CORE  
**Status:** Ratifiziert  
**Version:** 1.0  
**Datum:** 2026-06-30

---

## Mission

CORE ist die architektonische Wirbelsäule der HUI-Plattform. Sie stellt sicher, dass Wirkungsdaten, Semantik und Interaktionsflüsse zentral, konsistent und constitution-konform verwaltet werden.

---

## Scope

### In Scope
- `src/registry/HuiRegistry.js` — Single Source of Meaning
- `src/core/coreEngine.js` — Single Source of Truth (Wirkung)
- `src/core/resonanceEngine.js` — Resonanz-Signale
- `src/core/orbEngine.js` — Orb-Parameter
- `src/core/hui.actions.js` — Action Engine
- `src/core/hui.contracts.js` — Action Contracts
- `src/core/hui.flow.js` — Flow-Logik
- `src/core/hui.navigator.jsx` — Navigation
- `src/core/HuiConnectionEngine.jsx` — Connection Engine
- `src/architecture/` — Domain Ownership Enforcement

### Out of Scope
- UI-Komponenten (nur Consumer)
- Domänen-spezifische Businesslogik
- Datenbank-Schemas
- Payment/Commerce-Logik

---

## Verantwortlichkeiten

| Modul | Verantwortung |
|---|---|
| HuiRegistry | Sprache, Texte, Farben, Orb-Traits, LANG |
| coreEngine | Wirkungsprofile, Pillar-Daten, Impact-Aggregation |
| resonanceEngine | Tiefe Resonanz-Signale (keine Like-Logik) |
| orbEngine | Wirkungsdaten → visuelle Orb-Parameter |
| hui.actions | Zentrale Action-Dispatch-Schicht |
| hui.contracts | Action-Validierung und Payload-Contracts |
| architecture/ | Domain-Definitionen, Guards, Violation-Registry |

---

## Grenzen

### CORE darf
- Wirkungsdaten aggregieren und bereitstellen
- Actions validieren und dispatchen
- Semantik aus Registry lesen
- Architektur-Verstöße in Dev warnen

### CORE darf nicht
- Direkt UI rendern (außer Navigator)
- Domänen-spezifische DB-Queries ausführen
- Business-Entscheidungen treffen (z.B. Payment-Flows)
- Eigene Sprache/Texte definieren (nur Registry)

---

## Abhängigkeiten

```
CORE → Registry (liest)
CORE ← alle Domänen (lesen Wirkungsdaten)
CORE ← UI (nutzt Action Engine)
```

CORE hängt von keiner Feature-Domäne ab.

---

## Bekannte Verstöße (CORE-001)

| Verstoß | Datei | Status |
|---|---|---|
| HuiConnectionEngine schreibt direkt `follows` | `core/HuiConnectionEngine.jsx` | TODO(ADR-0001) |
| coreEngine schreibt direkt DB | `core/coreEngine.js` | TODO(ADR-0001) |
| Action Engine nur in ~9 Dateien genutzt | diverse UI | P2 Migration |

---

## Migration-Priorität

1. **P0:** HuiConnectionEngine → SOCIAL Domain Service
2. **P1:** coreEngine DB-Writes → dedizierter Persistence-Layer
3. **P2:** Action Engine Adoption in allen Feature-Komponenten

---

## Referenzen

- [HUI_CONSTITUTION.md](../../HUI_CONSTITUTION.md)
- [ADR-0001](adr/ADR-0001_ADOPTION_OF_CORE_ARCHITECTURE.md)
- [ARCHITECTURE_INDEX.md](../ARCHITECTURE_INDEX.md)
