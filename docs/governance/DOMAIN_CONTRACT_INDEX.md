# DOMAIN CONTRACT INDEX

> **ARCH-005.1 — Zentraler Index aller Domain Contracts**  
> **Status:** Ratifiziert  
> **Datum:** 2026-06-30  
> **Basis:** DOMAIN_ARCHITECTURE_BLUEPRINT_V1 · Constitution · ADR · RFC · SYSTEM_OWNERSHIP · Architecture Authority · Knowledge Graph · Scanner · Intelligence

---

## Domains

| ID | Label | Contract | Dateien | Health (Baseline) |
|---|---|---|---|---|
| **KERNEL** | Platform Kernel & Governance | [KERNEL.md](domain-contracts/KERNEL.md) | 64 | 55% |
| **IDENTITY** | Identity & Membership | [IDENTITY.md](domain-contracts/IDENTITY.md) | 44 | 30% |
| **CONNECTION** | Connection & Community | [CONNECTION.md](domain-contracts/CONNECTION.md) | 20 | 40% |
| **CREATION** | Creation & Publishing | [CREATION.md](domain-contracts/CREATION.md) | 30 | 35% |
| **COMMERCE** | Commerce & Transactions | [COMMERCE.md](domain-contracts/COMMERCE.md) | 13 | 45% |
| **COMMUNICATION** | Communication & Notifications | [COMMUNICATION.md](domain-contracts/COMMUNICATION.md) | 17 | 70% |
| **DISCOVERY** | Discovery & Feed | [DISCOVERY.md](domain-contracts/DISCOVERY.md) | 21 | 40% |
| **IMPACT** | Impact & Stewardship | [IMPACT.md](domain-contracts/IMPACT.md) | 9 | 60% |
| **WIRKUNG** | Wirkung, Resonance & Orb | [WIRKUNG.md](domain-contracts/WIRKUNG.md) | 26 | 45% |
| **TRUST** | Trust & Reputation | [TRUST.md](domain-contracts/TRUST.md) | 2 | 75% |
| **PRESENCE** | Presence & Session | [PRESENCE.md](domain-contracts/PRESENCE.md) | 5 | 65% |
| **INTELLIGENCE** | Assistive Intelligence | [INTELLIGENCE.md](domain-contracts/INTELLIGENCE.md) | 20 | 55% |
| **WORLD** | World & Atmosphere | [WORLD.md](domain-contracts/WORLD.md) | 13 | 60% |
| **STUDIO** | Creator Studio & Operations | [STUDIO.md](domain-contracts/STUDIO.md) | 14 | 30% |

**Gesamt:** 14 Domains · 298 Dateien · 34 Multi-Domain-Dateien

---

## Beziehungen (Abhängigkeitsgraph)

```
                    ┌─────────────────────────────────┐
                    │           KERNEL                │
                    │  Constitution · Registry · Core │
                    └───────────────┬─────────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        │                           │                           │
   ┌────▼────┐               ┌──────▼──────┐              ┌─────▼─────┐
   │IDENTITY │◄─────────────►│ CONNECTION  │◄────────────►│  TRUST    │
   └────┬────┘               └──────┬──────┘              └───────────┘
        │                             │
   ┌────▼────┐    ┌──────────┐   ┌────▼────┐    ┌──────────┐
   │CREATION │◄──►│ COMMERCE │◄─►│COMMUNIC.│    │ PRESENCE │
   └────┬────┘    └──────────┘   └─────────┘    └──────────┘
        │              │               │
   ┌────▼──────────────▼───────────────▼──────────────────────────┐
   │                      DISCOVERY                                │
   └───────────────────────────┬───────────────────────────────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
   ┌────▼────┐           ┌─────▼─────┐          ┌─────▼─────┐
   │ IMPACT  │           │  WIRKUNG  │          │INTELLIGENCE│
   └─────────┘           └─────┬─────┘          └───────────┘
                               │
                          ┌────▼────┐         ┌──────────┐
                          │  WORLD  │         │  STUDIO  │
                          └─────────┘         └──────────┘
```

---

## Erlaubte Kommunikationswege

| Von | Nach | Mechanismus | Richtung |
|---|---|---|---|
| Alle | KERNEL | Import (Registry, Actions, Infra) | Read/Use |
| IDENTITY | WIRKUNG | Core Engine (profiles-Wirkung) | Write via Engine |
| CREATION | DISCOVERY | Events (`WORK_PUBLISHED`) | Async |
| CONNECTION | DISCOVERY | Events (`CONNECTION_OPENED`) | Async |
| COMMERCE | IMPACT | Impact Pool Rate (7%) | Config |
| WIRKUNG | DISCOVERY | Read (Resonanz-Signale) | Read-only |
| INTELLIGENCE | * | Read-only Context | Read-only |
| WORLD | WIRKUNG | Read (Orb-Atmosphäre) | Read-only |
| STUDIO | * | Domain-Services | Read + Delegate Write |
| * | * | Cross-Domain Write | **Verboten** (nur via Owner-Service) |

---

## Import-Matrix

Zeile = Quell-Domain, Spalte = Ziel-Domain darf importiert werden.

|  | KERNEL | WIRKUNG | IDENTITY | CONNECTION | CREATION | COMMERCE | COMMUNICATION | DISCOVERY | IMPACT | TRUST | PRESENCE | INTELLIGENCE | WORLD | STUDIO |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **KERNEL** | — | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **WIRKUNG** | ✅ | — | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **IDENTITY** | ✅ | ✅ | — | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **CONNECTION** | ✅ | ✅ | ✅ | — | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **CREATION** | ✅ | ✅ | ✅ | ❌ | — | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **COMMERCE** | ✅ | ❌ | ✅ | ❌ | ✅ | — | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **COMMUNICATION** | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ | — | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **DISCOVERY** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | — | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **IMPACT** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | — | ❌ | ❌ | ❌ | ❌ | ❌ |
| **TRUST** | ✅ | ❌ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | — | ❌ | ❌ | ❌ | ❌ |
| **PRESENCE** | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | — | ❌ | ❌ | ❌ |
| **INTELLIGENCE** | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | — | ❌ | ❌ |
| **WORLD** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | — | ❌ |
| **STUDIO** | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | — |

**Legende:** ✅ erlaubt · ❌ verboten · — selbst

---

## Event-Matrix

### Publisher → Subscriber

| Event | Publisher | Subscriber (Konsumenten) |
|---|---|---|
| `WORK_PUBLISHED` | CREATION | DISCOVERY, CONNECTION, TRUST, INTELLIGENCE |
| `CONNECTION_OPENED` | CONNECTION | COMMUNICATION, INTELLIGENCE, DISCOVERY |
| `BOOKING_COMPLETED` | COMMERCE | WIRKUNG, TRUST, IMPACT, IDENTITY |
| `RESONANCE_CREATED` | WIRKUNG | DISCOVERY |
| `IMPACT_SUPPORTED` | IMPACT | WIRKUNG |
| `PROFILE_COMPLETED` | IDENTITY | CREATION, PRESENCE |
| `trust.updated` | TRUST | DISCOVERY, CONNECTION |

Vollständige Event-Definitionen: [`src/lib/events/index.js`](../../src/lib/events/index.js)

---

## Maschinenlesbare Artefakte

| Datei | Zweck |
|---|---|
| [`domain-contracts.json`](domain-contracts.json) | Scanner, Authority, Intelligence |
| [`docs/generated/domain-file-map.json`](../generated/domain-file-map.json) | Knowledge Graph Datei→Domain |
| [`docs/DOMAIN_ARCHITECTURE_BLUEPRINT_V1.md`](../DOMAIN_ARCHITECTURE_BLUEPRINT_V1.md) | ARCH-005 Zielarchitektur |

---

## Governance-Regeln (ab ARCH-005.1)

1. Jede Domain hat genau einen Contract (dieses Index)
2. Cross-Domain-Writes nur über Public API des Owners
3. Multi-Domain-Dateien sind in `domain-file-map.json` dokumentiert
4. Scanner (ARCH-006) validiert gegen Contracts, nicht nur Pfad-Convention
5. Intelligence priorisiert Migration nach Health Score und CRITICAL Count

---

*DOMAIN CONTRACT INDEX — ARCH-005.1 abgeschlossen.*
