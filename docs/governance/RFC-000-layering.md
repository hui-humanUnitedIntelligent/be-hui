# RFC-000 — HUI Layering Model

**Status:** Accepted  
**Date:** 2026-06-29  
**Owner:** HUI Architecture  

## Summary

Defines the unidirectional layer model for HUI source code. Imports may only flow downward through layers — never upward.

## Layer Stack

```
REGISTRY (0) → CORE (0) → ROUTES (1) → SERVICES/SYSTEM (2) → HOOKS/CONTEXT (3) → FEATURES (4) → PAGES/COMPONENTS (5)
ARCHITECTURE (-1) — analysis only, no runtime imports
```

## Rules

1. **No upward imports.** A lower layer must never import from a higher layer.
2. **Domain boundaries.** Each file belongs to exactly one domain based on its path.
3. **Service layer for DB.** UI layers (PAGES, COMPONENTS, FEATURES, HOOKS, CONTEXT) must not write directly to the database.
4. **Core tables via Core Engine.** Tables `profiles`, `wirker_profiles`, `impact_pool`, `impact_votes`, `orb_states`, `resonance_signals`, `core_metrics` require Core Engine access.
5. **Registry for meaning.** UI text, colors, and labels must come from HuiRegistry.

## Enforcement

- Scanner: `src/architecture/scanner/violationDetector.js` → `LAYER_VIOLATION`, `DB_DIRECT_WRITE`, `CORE_BYPASS`
- Intelligence: `src/architecture/intelligence/validate.js`

## References

- [`HUI_CONSTITUTION.md`](../../HUI_CONSTITUTION.md) — Section IV
- [`src/architecture/scanner/domains.js`](../../src/architecture/scanner/domains.js)
