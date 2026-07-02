# Severity Analysis — ARCH-006.1

## Verteilung (Violations)

- **CRITICAL**: 811
- **HIGH**: 159
- **MEDIUM**: 67
- **LOW**: 3
- **INFO**: 50

## Compiler-Schwellen (SEVERITY_BY_TYPE)

```json
{
  "CORE_WRITE": "CRITICAL",
  "CROSS_DOMAIN_WRITE": "CRITICAL",
  "WORLD_DB_WRITE": "HIGH",
  "OWNERSHIP_VIOLATION": "HIGH",
  "DOMAIN_LAYER": "HIGH",
  "DOMAIN_IMPORT": "HIGH",
  "DOMAIN_EVENT": "HIGH",
  "DOMAIN_REALTIME": "HIGH",
  "DOMAIN_CONTEXT": "MEDIUM",
  "DOMAIN_TABLE_OWNER": "MEDIUM",
  "SERVICE_BYPASS": "HIGH",
  "HOOK_BYPASS": "MEDIUM",
  "PAGE_BYPASS": "HIGH",
  "COMPONENT_BYPASS": "LOW",
  "EVENT_ABUSE": "HIGH",
  "INTELLIGENCE_WRITE": "HIGH",
  "STUDIO_AGGREGATOR": "MEDIUM",
  "CONTRACT_VIOLATION": "CRITICAL"
}
```

## ADR-002 Inkonsistenzen

- MISSING_HEADER: ADR-002=INFO, Compiler=CRITICAL

## Empfehlungen

### [CRITICAL] CRITICAL überrepräsentiert (74% aller Violations)

neverWrite-Regeln auf HIGH herabstufen oder nur echte Cross-Domain-Writes als CRITICAL markieren

### [MEDIUM] ADR-002 vs SEVERITY_BY_TYPE Abweichungen

SEVERITY_BY_TYPE mit ADR-002 harmonisieren oder ADR aktualisieren

### [INFO] MISSING_HEADER als INFO korrekt

Beibehalten — Dokumentationspflicht, kein Merge-Blocker

