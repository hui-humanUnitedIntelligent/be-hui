# HUI — Architecture Decision Index (ADI)

> *Single Source of Truth für Architekturentscheidungen.*  
> *Analog zur Core Engine als Single Source of Truth für Wirkungsdaten.*

**Version:** 1.0  
**Aktualisiert:** 2026-06-30  
**Owner:** Engineering Architecture  
**Governance:** [`RFC-000A_ARCHITECTURE_GOVERNANCE.md`](RFC-000A_ARCHITECTURE_GOVERNANCE.md)

---

## Zweck

Das Architecture Decision Index (ADI) ist das zentrale Register aller Architekturentscheidungen der HUI-Plattform. Jeder Eintrag verknüpft RFCs, ADRs, Domänen, Releases und zugehörige Artefakte.

---

## Entscheidungsregister

### Level 0 — Constitution

| ID | Titel | Status | Domain | LOCKED | Referenz |
|---|---|---|---|---|---|
| CONSTITUTION-1.1 | HUI Constitution v1.1 | Ratifiziert | Platform | Kandidat | [`HUI_CONSTITUTION.md`](../HUI_CONSTITUTION.md) |

### ADRs — Architecture Decision Records

| ID | Titel | Status | Domain | RFC | Constitution | LOCKED | Referenz |
|---|---|---|---|---|---|---|---|
| **ADR-0001** | Adoption of the Core Architecture | Council Review | Core (übergreifend) | RFC-000 (strukturell), RFC-000A | passed | Nein | [`adr/ADR-0001_ADOPTION_OF_CORE_ARCHITECTURE.md`](adr/ADR-0001_ADOPTION_OF_CORE_ARCHITECTURE.md) |
| ADR-001 | Route Authority (Shadow Registry) | Implemented | Navigation | — | passed | Nein | [`src/routes/registry.js`](../../src/routes/registry.js) (NAV-001B) |

### RFCs — Request for Comments

| ID | Titel | Status | Domain | Referenz |
|---|---|---|---|---|
| RFC-000A | Architecture Governance v1.0 | Review | Governance | [`RFC-000A_ARCHITECTURE_GOVERNANCE.md`](RFC-000A_ARCHITECTURE_GOVERNANCE.md) |
| RFC-000 | Domain Model v1.0 | Strukturell in ADR-0001 | Platform | *Publikation ausstehend* |

---

## Beziehungsgraph

```
CONSTITUTION-1.1
       │
       ├──► RFC-000A (Governance)
       │         │
       │         └──► ADR-0001 (Core Architecture) ◄── Fundament
       │                    │
       │                    ├──► Domain Charters (ausstehend)
       │                    └──► ADR-001 (Route Authority)
       │
       └──► HuiRegistry + CoreEngine (operativ)
```

---

## Pflege-Regeln

| Aktivität | Trigger | Verantwortlich |
|---|---|---|
| Neuer ADI-Eintrag | RFC/ADR-Erstellung | Autor |
| Status-Update | Lifecycle-Übergang (siehe RFC-000A §5) | Owner |
| Quartals-Review | Alle 3 Monate | Engineering Architecture |
| Jährliche Archivierung | Januar | Architecture Council |
| Integritätscheck | Monatlich | CI oder Steward |

---

## Nächste Einträge (geplant)

| ID | Titel | Priorität |
|---|---|---|
| RFC-000 | Domain Model v1.0 (formale Publikation) | Hoch |
| CHARTER-CORE | CORE Domain Charter v1.0 | Hoch |
| CHARTER-REGISTRY | Registry Domain Charter | Hoch |
| CHARTER-ORB | Orb Domain Charter | Mittel |
| CHARTER-FEED | Feed Domain Charter | Mittel |

---

*Dieses Register wird bei jeder Architekturentscheidung aktualisiert.*  
*Grundlage: [`ADR-0001`](adr/ADR-0001_ADOPTION_OF_CORE_ARCHITECTURE.md) + [`RFC-000A`](RFC-000A_ARCHITECTURE_GOVERNANCE.md)*
