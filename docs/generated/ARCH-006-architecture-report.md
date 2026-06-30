# ARCH-006 — Domain Policy Engine — Vollständiger Architekturbericht

**Datum:** 2026-06-30  
**Version:** ARCH-006  
**Status:** Implementiert  
**Branch:** `cursor/arch-006-domain-policy-0dde`

---

## 1. Neue Module

```
src/architecture/policy/
├── contractLoader.js      — Lädt domain-contracts.json (einzige Quelle)
├── domainResolver.js      — Business-Domain-Auflösung aus Contracts
├── policyCompiler.js      — 13 Policy-Typen pro Domain
├── ruleCompiler.js        — Scanner-Regeln aus Policies
├── policyEngine.js        — evaluateFile/Domain/Repository/PR/Architecture
├── evaluator.js           — Regel-Evaluierung gegen Scan-Ergebnisse
├── explanationEngine.js   — Violation-Erklärungen mit Confidence
├── confidence.js          — Confidence-Scoring
├── healthEngine.js          — Domain Health + Policy Health
├── api.js                   — Öffentliche API
├── index.js                 — Entry Point
├── cli.js                   — CLI (5 Modi)
├── types.js                 — JSDoc-Typen
└── reports/
    └── reportGenerator.js   — 8 Markdown-Reports + JSON-Serialisierung
```

Zusätzlich importiert aus ARCH-002/003/004/005:
- `src/architecture/authority/` (ARCH-004)
- `src/architecture/intelligence/` (ARCH-003)
- `src/architecture/graph/`, `semantic/` (ARCH-002.1)
- `src/architecture/knowledge-graph/` (ARCH-002)
- `src/architecture/governance/` (ARCH-003)
- `docs/governance/domain-contracts.json` (ARCH-005.1)

---

## 2. Neue APIs

| Funktion | Modul | Beschreibung |
|---|---|---|
| `loadContracts()` | contractLoader | Lädt Domain Contracts |
| `compilePolicies()` | policyCompiler | 182 Policies aus 14 Domains |
| `compileRules()` | ruleCompiler | 283 Regeln aus Policies |
| `evaluate()` | policyEngine | Repository-Evaluation |
| `evaluateFile()` | policyEngine | Einzeldatei-Evaluation |
| `evaluateDomain()` | policyEngine | Domain-Evaluation |
| `evaluateRepository()` | policyEngine | Vollständiger Scan |
| `evaluatePullRequest()` | policyEngine | PR-Evaluation |
| `evaluateArchitecture()` | policyEngine | Alias für Repository |
| `getPolicy()` | policyCompiler | Policy nach ID |
| `getContract()` | contractLoader | Contract nach Domain-ID |
| `getDomainHealth()` | healthEngine | Domain Health Scores |
| `getPolicyHealth()` | healthEngine | Policy Compliance |
| `getViolations()` | api | Violations aus Evaluation |
| `getRecommendations()` | api | Empfehlungen aus Violations |

---

## 3. Generierte Policies

**182 Policies** (13 Typen × 14 Domains):

| Policy-Typ | Anzahl | Quelle im Contract |
|---|---|---|
| ownership | 14 | `ownership.*` |
| import | 14 | `dependencies.importMatrix` |
| realtime | 14 | `realtime.*` |
| layer | 14 | `layers.*` |
| service | 14 | `publicApi.services` |
| context | 14 | `ownership.contexts` |
| table | 14 | `data.owned/readOnly/neverWrite` |
| event | 14 | `events.*` |
| hook | 14 | `ownership.hooks` |
| ui | 14 | `ownership.components/pages` |
| core | 14 | `constitution.invariants` |
| scanner | 14 | `scannerRules` |
| migration | 14 | `migration + intelligence` |

---

## 4. Generierte Regeln

**283 Regeln** aus Policies:

| Regel-Typ | Anzahl |
|---|---|
| DOMAIN_TABLE_OWNER | 43 |
| CROSS_DOMAIN_WRITE | 72 |
| EVENT_ABUSE | 39 |
| OWNERSHIP_VIOLATION | 19 |
| DOMAIN_IMPORT | 17 |
| CORE_WRITE | 14 |
| SERVICE_BYPASS | 15 |
| CONTRACT_VIOLATION | 15 |
| DOMAIN_CONTEXT | 10 |
| HOOK_BYPASS | 8 |
| DOMAIN_REALTIME | 8 |
| WORLD_DB_WRITE | 8 |
| DOMAIN_LAYER | 7 |
| COMPONENT_BYPASS | 6 |
| PAGE_BYPASS | 1 |
| STUDIO_AGGREGATOR | 1 |

Keine manuell gepflegten Regellisten. Alle Regeln entstehen automatisch aus `domain-contracts.json`.

---

## 5. Scanner-Integration

**Vorher (ARCH-001):** `violationDetector.js` mit hardcodierten `ALLOWED_DIRECT_DB_PATHS`, `CORE_TABLES`, Pfad-basierten Domains.

**Nachher (ARCH-006):**

```
Scanner (ARCH-001)
    ↓ detectViolations()
Policy Engine (ARCH-006)
    ↓ evaluateScanResults()
Domain Contracts (ARCH-005.1)
```

- `src/architecture/scanner/violationDetector.js` — delegiert an `evaluateScanResults()`
- `src/architecture/scanner/domains.js` — delegiert an `domainResolver.js`
- Scanner CLI (`architecture:audit`) funktioniert unverändert
- 367 Dateien gescannt, 1090 Violations erkannt

---

## 6. Authority-Integration

**Vorher (ARCH-004):** `registryBuilder.js` mit `CANONICAL_DOMAINS` und `SCANNER_RULES` als lokale Konstanten.

**Nachher (ARCH-006):**

```
Authority (ARCH-004)
    ↓ buildAuthorityState()
Policy Engine (ARCH-006)
    ↓ compileRules() / loadContracts()
Domain Contracts
```

- `domainRegistry` aus `buildDomainRegistryFromContracts()`
- `ruleRegistry` aus `compileRules()` statt `SCANNER_RULES`
- `policyEngineRegistry` als neues Registry-Feld
- Lokale `CANONICAL_DOMAINS`/`SCANNER_RULES` bleiben als Legacy-Export, werden aber nicht mehr als Quelle genutzt

---

## 7. Intelligence-Integration

**Vorher (ARCH-003):** Eigene Regeln in `constitution.js`, `recommend.js`, `validate.js`.

**Nachher (ARCH-006):**

- `validate.js` — nutzt `domainResolver` + `getContract()` für Core-Tabellen
- `recommend.js` — bevorzugt `violation.explanation` aus Policy Engine
- `simulate.js` — nutzt `domainResolver` für Import-Prüfung
- `decisionTrace.js` — Policy-Erklärungen in Trace integriert
- `runScan.js` — Scan-Version auf ARCH-006 aktualisiert

```
Intelligence (ARCH-003)
    ↓ recommend/simulate/validate/risk/decisionTrace
Policy Engine (ARCH-006)
    ↓
Domain Contracts
```

---

## 8. CI-Integration

Neuer Workflow: `.github/workflows/architecture-policy.yml`

**Trigger:** PR/Push auf `src/**`, `docs/governance/**`, `src/architecture/**`

**Merge-Blockierung bei:**
- `CRITICAL` Severity
- `CONTRACT_VIOLATION`
- `DOMAIN_OWNER_VIOLATION` / `OWNERSHIP_VIOLATION`
- `CROSS_DOMAIN_WRITE`

**Commands:**
```bash
npm run architecture:policy:audit    # CI Gate
npm run architecture:policy:report   # Artefakt-Generierung
```

---

## 9. Reports

| Report | Pfad |
|---|---|
| policy-report.md | `docs/generated/` |
| domain-policy-report.md | `docs/generated/` |
| contract-report.md | `docs/generated/` |
| policy-health.md | `docs/generated/` |
| policy-violations.md | `docs/generated/` |
| cross-domain-report.md | `docs/generated/` |
| contract-compliance.md | `docs/generated/` |
| policy-summary.md | `docs/generated/` |

---

## 10. JSON-Artefakte

| Artefakt | Inhalt |
|---|---|
| policy.json | Engine-Metadaten |
| contracts.json | Geladene Domain Contracts |
| compiled-policies.json | 182 kompilierte Policies |
| compiled-rules.json | 283 kompilierte Regeln |
| policy-health.json | Policy Health Metriken |
| policy-violations.json | Alle Violations mit Erklärungen |
| domain-health.json | 14 Domain Health Scores |

---

## 11. Performance

| Metrik | Wert |
|---|---|
| Scan-Dauer | ~288ms |
| Dateien | 367 |
| Contracts | 14 |
| Policies kompiliert | 182 |
| Regeln kompiliert | 283 |
| Violations | 1090 |
| Memory | In-Process, kein externer Service |

Policy-Kompilierung erfolgt einmalig mit Cache. Scan + Evaluation unter 500ms für gesamtes Repository.

---

## 12. Governance-Auswirkungen

**Fundamentaler Paradigmenwechsel:**

| Aspekt | ARCH-005 | ARCH-006 |
|---|---|---|
| Regelquelle | Contracts + lokale Scanner-Regeln | Contracts allein |
| Domain-Auflösung | Pfadkonventionen (`src/core`) | Business-Domains (`WIRKUNG`) |
| Authority | Eigene `SCANNER_RULES` | Policy Engine |
| Intelligence | Eigene `RECOMMENDATIONS` | Policy-Erklärungen |
| Scanner | Hardcodierte Ausnahmen | Contract-basierte Policies |

**Governance-Flow:**
```
HUI_CONSTITUTION.md
    ↓
domain-contracts.json (ARCH-005.1)
    ↓
Policy Engine (ARCH-006)
    ↓
Scanner / Authority / Intelligence / CI
```

---

## 13. Domain-Health

| Domain | Health | Grade | Violations |
|---|---|---|---|
| TRUST | 90% | A | niedrig |
| INTELLIGENCE | 90% | A | niedrig |
| WORLD | 90% | A | niedrig |
| WIRKUNG | 79% | B | mittel |
| COMMERCE | 66% | B | mittel |
| PRESENCE | 66% | B | mittel |
| STUDIO | 65% | B | mittel |
| IMPACT | 65% | B | mittel |
| CONNECTION | 63% | B | mittel |
| CREATION | 63% | B | mittel |
| DISCOVERY | 63% | B | mittel |
| KERNEL | 62% | B | hoch |
| COMMUNICATION | 60% | B | mittel |
| IDENTITY | 58% | C | hoch |
| **Gesamt** | **70%** | **B** | **1090** |

Health-Dimensionen pro Domain: Ownership, Layer, Events, Realtime, Services, Contexts, Hooks, Imports, Dependencies, Documentation, Constitution, RFC, ADR, Migration, Policy Compliance, Contract Compliance.

---

## 14. Risiken

1. **CI-Blockierung:** 811 CRITICAL Violations in bestehendem Code — CI wird initial fehlschlagen bis Violations behoben sind
2. **Contract-Vollständigkeit:** `files`-Mapping in Contracts deckt 298 Dateien ab, nicht alle 367 — UNKNOWN-Domains möglich
3. **Severity-Mapping:** CONTRACT_VIOLATION für MISSING_HEADER blockiert Merge — beabsichtigt, aber streng
4. **Legacy-Exports:** `CANONICAL_DOMAINS`/`SCANNER_RULES` noch exportiert für Rückwärtskompatibilität — Entfernung in ARCH-007 empfohlen
5. **False Positives:** DB_DIRECT_READ als MEDIUM für alle Reads — kann Noise erzeugen

---

## 15. Technische Schulden

1. `domains.js` DOMAINS-Proxy für Legacy-Kompatibilität — entfernen in ARCH-007
2. `governance/constitution.js` ARCHITECTURE_RULES noch lokal — auf Policy Engine migrieren
3. `recommend.js` RECOMMENDATIONS-Fallback noch vorhanden
4. `authority/registryBuilder.js` CANONICAL_DOMAINS Konstante noch definiert (ungenutzt)
5. Gamification-Detection via Regex — heuristisch, nicht AST-basiert
6. `@domain/@owner` Header-Rollout: 0% Coverage im Codebase

---

## 16. Build

- Keine Runtime-Änderungen
- Keine UI-Änderungen
- Keine SQL/DB-Änderungen
- Nur Governance-Erweiterung in `src/architecture/`
- `npm run architecture:policy` — funktionsfähig
- `npm run architecture:audit` — funktionsfähig (nutzt Policy Engine)

---

## 17. Scanner

ARCH-001 Scanner bleibt funktionsfähig:

| Komponente | Status |
|---|---|
| fileScanner.js | Unverändert |
| graphBuilder.js | Unverändert |
| metricsCalculator.js | Unverändert |
| reportGenerator.js | Unverändert |
| violationDetector.js | **Refactored** → Policy Engine |
| domains.js | **Refactored** → Domain Resolver |
| cli.js | Unverändert |

Metriken: 367 Dateien, 116.984 Zeilen, 327 DB Reads, 171 DB Writes.

---

## 18. Architekturmetriken

```
Contracts:     14 Domains
Policies:      182 (13 Typen × 14 Domains)
Rules:         283 (16 Regeltypen)
Violations:    1090
  CRITICAL:    811
  HIGH:        159
  MEDIUM:      120
Domain Health: 70% (Grade B)
Scan-Dauer:    288ms
```

**Architektur-Flow:**
```
                    ┌─────────────────────┐
                    │  domain-contracts   │
                    │       .json           │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │   Policy Engine      │
                    │   (ARCH-006)         │
                    │                      │
                    │  compilePolicies()   │
                    │  compileRules()      │
                    │  evaluate()          │
                    └──────────┬──────────┘
           ┌───────────────────┼───────────────────┐
           │                   │                   │
    ┌──────▼──────┐    ┌──────▼──────┐    ┌──────▼──────┐
    │  Scanner    │    │  Authority  │    │ Intelligence│
    │  ARCH-001   │    │  ARCH-004   │    │  ARCH-003   │
    └─────────────┘    └─────────────┘    └─────────────┘
```

---

## 19. Unterschiede zu ARCH-005

| Aspekt | ARCH-005 | ARCH-006 |
|---|---|---|
| Contracts | Definiert in JSON + Markdown | **Einzige Regelquelle** |
| Scanner-Regeln | In Contracts + lokal im Scanner | **Nur via Policy Engine** |
| Domain-Auflösung | Pfad-basiert (domains.js) | **Contract-basiert** (files[]) |
| Policy-Kompilierung | Nicht vorhanden | **182 Policies automatisch** |
| Rule-Kompilierung | Nicht vorhanden | **283 Regeln automatisch** |
| Evaluation | violationDetector lokal | **policyEngine.evaluate()** |
| Erklärungen | Intelligence lokal | **explanationEngine** |
| Health | Baseline in Contract Index | **16 Dimensionen berechnet** |
| CI | architecture-scanner (ARCH-001) | **architecture-policy (ARCH-006)** |
| Authority | Eigene Regeln | **Delegiert an Policy Engine** |

ARCH-005 definierte **was** die Domains sind.  
ARCH-006 macht die Contracts zur **einzigen fachlichen Wahrheit** für alle Governance-Module.

---

## 20. Empfehlungen für ARCH-007

1. **Contract-Vollständigkeit:** Alle 367 Dateien in `domain-contracts.json` mappen
2. **Header-Rollout:** `@domain`/`@owner` Tags in alle Dateien — reduziert 811 CONTRACT_VIOLATION
3. **Legacy-Entfernung:** `CANONICAL_DOMAINS`, `SCANNER_RULES`, `RECOMMENDATIONS` entfernen
4. **constitution.js Migration:** `ARCHITECTURE_RULES` aus Policy Engine ableiten
5. **CI-Phasierung:** WARN-Mode für bestehende Violations, STRICT-Mode für neue PRs
6. **Auto-Fix:** Policy Engine → automatische Migrationsempfehlungen als Codemods
7. **PR-Integration:** `evaluatePullRequest()` in GitHub PR Checks einbinden
8. **Realtime-Detection:** AST-basierte Event/Realtime-Analyse statt Regex
9. **Domain Dashboard:** UI für Domain Health (nur Governance, nicht Runtime)
10. **Contract-Versionierung:** Semantische Versionierung mit Breaking-Change-Detection

---

*Domain Contracts sind ab sofort die einzige fachliche Wahrheit.*  
*Scanner, Authority, Intelligence und zukünftige Governance besitzen keine doppelten Regeldefinitionen mehr.*
