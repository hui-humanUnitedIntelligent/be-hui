# ADR-002 — Architecture Scanner

**Status:** Accepted  
**Date:** 2026-06-29  
**Owner:** HUI Architecture  
**Release:** ARCH-001 → ARCH-003  

## Context

Architecture rules in the Constitution were not automatically enforceable. Manual code review could not scale.

## Decision

Implement a static analysis scanner under `src/architecture/` that:

1. Scans all `src/` files without affecting runtime
2. Detects violations against Constitution, RFC-000, and ADR-001
3. Generates metrics, graphs, and compliance reports
4. Provides Architecture Intelligence (ARCH-003) for explain, validate, simulate, and recommend

## Violation Categories

| Type | Severity | Rule |
|------|----------|------|
| CORE_BYPASS | CRITICAL | Core tables via Core Engine only |
| DB_DIRECT_WRITE | HIGH | No DB writes in UI layers |
| LAYER_VIOLATION | HIGH | RFC-000 import direction |
| DUPLICATE_OWNER | HIGH | Single writer per table |
| DIRECT_ROUTING | HIGH | Action Engine required |
| REGISTRY_BYPASS | LOW | HuiRegistry for colors/labels |
| MISSING_HEADER | INFO | @domain + @owner tags |

## Consequences

- Scanner runs in CI before merge
- No runtime code changes from scanner
- All recommendations are advisory until explicitly enforced

## References

- [`src/architecture/scanner/`](../../src/architecture/scanner/)
- [`src/architecture/intelligence/`](../../src/architecture/intelligence/)
