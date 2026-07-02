# False Positive Report — ARCH-006.1

## Zusammenfassung

| Kategorie | Anzahl | Anteil |
|-----------|--------|--------|
| Wahrscheinliche False Positives | 117 | 11% |
| Severity Inflation | 719 | 66% |
| UNKNOWN Domain | 73 Dateien |
| Duplikate | 663 |

## False Positive Kategorien

- DOMAIN_TABLE_OWNER: 67
- CONTRACT_VIOLATION: 50

## Severity Inflation

Ursache: neverWrite → CROSS_DOMAIN_WRITE → CRITICAL

## Unmapped Files (potenzielle False Negatives)

- `architecture/authority/api/authorityApi.js`
- `architecture/authority/cli.js`
- `architecture/authority/constants/ruleSchema.js`
- `architecture/authority/constants/statusModel.js`
- `architecture/authority/graph/authorityGraph.js`
- `architecture/authority/health/governanceHealth.js`
- `architecture/authority/index.js`
- `architecture/authority/loader/documentLoader.js`
- `architecture/authority/registries/registryBuilder.js`
- `architecture/authority/reports/reportGenerator.js`
- `architecture/authority/validation/authorityValidator.js`
- `architecture/authority/validation/ciChecks.js`
- `architecture/governance/adrRegistry.js`
- `architecture/governance/constitution.js`
- `architecture/governance/index.js`
