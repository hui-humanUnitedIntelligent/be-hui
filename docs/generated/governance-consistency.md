# Governance Consistency — ARCH-006.1

## Kette

Constitution → Contracts → Policies → Rules → Scanner → Authority → Intelligence → CI

**Konsistent:** ❌ Nein

## Brüche (2)

### [Contracts → Authority] Domain-Mismatch: Contracts=14 Business-Domains vs Authority=10 Layer-Domains
Authority nutzt RFC-000 Layer-Domains (CORE, SERVICES), Contracts nutzen Business-Domains (KERNEL, IDENTITY)
Severity: EXPECTED

### [Scanner → Intelligence] Intelligence validate.js nutzt parallel ARCHITECTURE_RULES statt nur Policies
Severity: MEDIUM

