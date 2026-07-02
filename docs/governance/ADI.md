# ADI — Architecture Decision Index

**Version:** 1.0  
**Status:** Ratifiziert (CORE-001)  
**Datum:** 2026-06-30

---

## Zweck

Der Architecture Decision Index (ADI) ist der zentrale Katalog aller architekturrelevanten Entscheidungen der HUI-Plattform. Er verknüpft Constitution, ADRs, RFCs und Domain Charters.

---

## Hierarchie

```
HUI_CONSTITUTION.md          ← Unveränderliche Grundlage
    ↓
docs/governance/ADI.md       ← Dieser Index
    ↓
ADR-0001                     ← Core Architecture Adoption
RFC-000A                     ← Architecture Governance
RFC-000                      ← Domain Model
CORE Domain Charter          ← CORE-Domäne
    ↓
src/architecture/            ← Technische Durchsetzung
```

---

## Dokumente

| ID | Dokument | Status | Beschreibung |
|---|---|---|---|
| ADR-0001 | [ADR-0001_ADOPTION_OF_CORE_ARCHITECTURE.md](adr/ADR-0001_ADOPTION_OF_CORE_ARCHITECTURE.md) | Angenommen | Einführung des Schichtenmodells und Domain Ownership |
| RFC-000A | [RFC-000A_ARCHITECTURE_GOVERNANCE.md](RFC-000A_ARCHITECTURE_GOVERNANCE.md) | Ratifiziert | Governance-Regeln für Architekturänderungen |
| RFC-000 | [RFC-000_DOMAIN_MODEL.md](RFC-000_DOMAIN_MODEL.md) | Ratifiziert | Kanonisches Domain Model |
| CORE | [CORE_DOMAIN_CHARTER.md](CORE_DOMAIN_CHARTER.md) | Ratifiziert | CORE-Domäne: Engines, Registry, Action Engine |

---

## Architekturregeln (Kurzreferenz)

1. **UI besitzt keine Wirkungslogik** — Daten aus Core Engine
2. **Kein direktes `supabase.from()` in UI-Komponenten** — über Domain Services
3. **Alle Interaktionen über Action Engine** — `useHuiActions()` / `A.*`
4. **Single Owner pro Datensystem** — siehe `docs/SYSTEM_OWNERSHIP.md`
5. **Unidirektionaler Datenfluss** — Constitution → Registry → Engines → UI
6. **Jede Datei hat eine Domäne** — siehe `src/architecture/domains.js`

---

## Enforcement (CORE-001)

| Mechanismus | Datei |
|---|---|
| Domain-Definitionen | `src/architecture/domains.js` |
| Ownership-Metadaten | `src/architecture/ownership.js` |
| Dev-Warnings & Assertions | `src/architecture/guards.js` |
| Bekannte Verstöße | `src/architecture/violations.js` |
| Audit-Bericht | `docs/CORE-001_AUDIT_REPORT.md` |

---

## Änderungsprozess

1. RFC oder ADR entwerfen
2. Architecture Review (mindestens 1 Maintainer)
3. ADI-Index aktualisieren
4. `src/architecture/` bei Bedarf anpassen
5. Violations-Registry aktualisieren

---

*Grundlage: [HUI_CONSTITUTION.md](../../HUI_CONSTITUTION.md)*
