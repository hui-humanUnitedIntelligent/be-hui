# Policy Validation — ARCH-006.1

## Regeln (283)

| Metrik | Wert |
|--------|------|
| Eindeutige Regeln | 283 |
| Duplikate | 0 |
| Tote Regeln (enforceable, ungenutzt) | 172 |
| Regeln ohne Ursprung | 0 |

## Violations (1090)

| Severity | Anzahl |
|----------|--------|
| CRITICAL | 811 |
| HIGH | 159 |
| MEDIUM | 67 |
| LOW | 3 |
| INFO | 50 |

## Violation-Typen

- **CROSS_DOMAIN_WRITE**: 719
- **CORE_WRITE**: 92
- **DOMAIN_IMPORT**: 87
- **DOMAIN_TABLE_OWNER**: 67
- **CONTRACT_VIOLATION**: 50
- **WORLD_DB_WRITE**: 42
- **OWNERSHIP_VIOLATION**: 18
- **COMPONENT_BYPASS**: 10
- **PAGE_BYPASS**: 3
- **EVENT_ABUSE**: 2

## Statistik

- Echte Violations (ohne semantische Duplikate): ~449
- ID-Duplikate: 103
- Regelüberschneidungen: 86
- Severity-Eskalationen: 57
