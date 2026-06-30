# Decision Report

## ADR-001 — ADR-001 — Route Authority
**Why:** Route definitions were scattered across `App.jsx`, `APP_ROUTES`, and individual page imports. This made it impossible to analyze user journeys, ownership, or route-level governance.
**Status:** Accepted
**Rules:** DIRECT_ROUTING, ACTION_ENGINE_GAP
**Domains:** routes, pages

## ADR-002 — ADR-002 — Architecture Scanner
**Why:** Architecture rules in the Constitution were not automatically enforceable. Manual code review could not scale.
**Status:** Accepted
**Rules:** CORE_BYPASS, DB_DIRECT_WRITE, DB_DIRECT_READ, LAYER_VIOLATION, DUPLICATE_OWNER, DIRECT_ROUTING, ACTION_ENGINE_GAP, REGISTRY_BYPASS, MISSING_HEADER
**Domains:** architecture
