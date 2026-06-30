# Health Report

**Architecture Health (aggregated):** 61/100

## Dimensions

| Dimension | Score | Derived |
|-----------|-------|---------|
| Constitution Health | 100 | no |
| Governance Health | 100 | no |
| Layer Health | 68 | yes |
| Ownership Health | 0 | yes |
| Core Health | 0 | yes |
| Domain Health | 90 | yes |
| Capability Health | 100 | no |
| Dependency Health | 60 | yes |
| Security Health | 0 | yes |
| Maintainability Health | 50 | yes |
| Documentation Health | 100 | no |

## Factor Details

### Constitution Health
- Constitution vorhanden: true (impact: 0)
- Goldene Regeln geladen: 10 (impact: 0)
- Grundpfeiler geladen: 5 (impact: 0)
- Data sources: HUI_CONSTITUTION.md

### Governance Health
- ADRs registriert: 2 (impact: 0)
- RFCs registriert: 2 (impact: 0)
- Verbindliche ADRs: 2 (impact: 0)
- Data sources: docs/governance/, ARCH-004 Authority

### Layer Health
- Layer Violations: 16 (impact: -32)
- Layer Violation Anteil: "2.5%" (impact: 0)
- Data sources: docs/generated/violations.json, RFC-000

### Ownership Health
- Ownership Header Coverage: "0%" (impact: -100)
- Duplicate Table Owners: 17 (impact: -51)
- Data sources: docs/generated/metrics.json, docs/SYSTEM_OWNERSHIP.md

### Core Health
- Core Engine Adoption: "4%" (impact: -96)
- Critical Violations (Core Bypass): 42 (impact: -84)
- Data sources: docs/generated/metrics.json

### Domain Health
- Unklassifizierte Dateien: 2 (impact: -10)
- Registrierte Domains: 11 (impact: 0)
- Data sources: docs/generated/metrics.json, ARCH-004 domainRegistry

### Capability Health
- Capabilities registriert: 12 (impact: 0)
- Data sources: docs/SYSTEM_OWNERSHIP.md, ARCH-004 capabilityRegistry

### Dependency Health
- HIGH Violations: 112 (impact: -40)
- Cross-Domain Writes: 0 (impact: 0)
- Data sources: docs/generated/metrics.json, docs/generated/violations.json

### Security Health
- DB Direct Writes in UI: 71 (impact: -71)
- Core Bypass: 42 (impact: -126)
- Data sources: docs/generated/violations.json

### Maintainability Health
- Violation Density: "211.78/100 files" (impact: -50)
- Total Violations: 629 (impact: 0)
- Data sources: docs/generated/metrics.json

### Documentation Health
- Governance-Dokumente: 8 (impact: 0)
- Data sources: docs/governance/, HUI_CONSTITUTION.md
