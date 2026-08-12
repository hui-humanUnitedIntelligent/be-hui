# ADR-001 — Route Authority

**Status:** Accepted (Shadow Mode)  
**Date:** 2026-06-29  
**Owner:** HUI Release Engineering  
**Release:** NAV-001B  

## Context

Route definitions were scattered across `App.jsx`, `APP_ROUTES`, and individual page imports. This made it impossible to analyze user journeys, ownership, or route-level governance.

## Decision

Create a central Route Registry (`src/routes/registry.js`) as the authoritative documentation of all URL routes.

## Lifecycle

| Phase | Release | Behavior |
|-------|---------|----------|
| 1 | NAV-001B | Shadow Registry — documentation only, no runtime effect |
| 2 | NAV-002 | Parity validation against App.jsx |
| 3 | NAV-003 | Router generates routes from registry |
| 4 | NAV-004 | Registry is sole source, manual routes removed |

## Consequences

- Every route has exactly one owner (`OWNER.*`)
- Every route has an auth level (`AUTH.*`)
- Route-to-page mapping enables journey analysis
- `validateParity()` detects drift between registry and router

## Files Governed

- `src/routes/registry.js`
- All files in `src/pages/` referenced by route entries

## References

- [`src/routes/registry.js`](../../src/routes/registry.js)
