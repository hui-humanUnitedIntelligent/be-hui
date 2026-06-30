# Compliance Report

## Authority Self-Check

**Valid:** true
**Errors:** 0
**Warnings:** 0

## Module Compliance (Duplicate Sources)

**Compliant:** false
**Violations:** 2

- **src/architecture/scanner/domains.js:** Definiert DOMAINS lokal statt Authority zu importieren → Import aus src/architecture/authority — getAuthorityState().domainRegistry
- **src/architecture/scanner/violationDetector.js:** Definiert Scanner-Regeln lokal (ALLOWED_DIRECT_DB_PATHS, SEVERITY) → Regeln aus Authority ruleRegistry lesen