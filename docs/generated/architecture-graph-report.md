# HUI Architecture Knowledge Graph Report

> Automatisch generiert — HUI Architecture Knowledge Graph (ARCH-002)
> ⚠️ Nicht manuell bearbeiten. Wird bei `npm run architecture:graph` überschrieben.

**Generiert:** 2026-06-30T13:48:06.316Z
**Version:** ARCH-002

## Übersicht

| Metrik | Wert |
|--------|------|
| Knoten gesamt | 2163 |
| Kanten gesamt | 6128 |
| Dateien analysiert | 310 |
| Domains | 11 |
| Tabellen | 98 |
| Violations | 629 |

## Knoten nach Typ

| Typ | Anzahl |
|-----|--------|
| Component | 676 |
| Violation | 629 |
| File | 310 |
| Supabase Table | 127 |
| Hook | 111 |
| Migration | 52 |
| Action | 39 |
| Contract | 28 |
| Context | 28 |
| Page | 24 |
| Engine | 23 |
| Route | 17 |
| Constitution Rule | 15 |
| Domain Charter | 11 |
| Domain | 11 |
| Service | 11 |
| Enum | 10 |
| Context Provider | 10 |
| Invariant | 9 |
| Edge Function | 8 |
| Layer | 7 |
| Constitution | 1 |
| ADR | 1 |
| RFC | 1 |
| Registry | 1 |
| Signal | 1 |
| State Owner | 1 |
| Feature | 1 |

## Kanten nach Typ

| Typ | Anzahl |
|-----|--------|
| DEFINED_IN | 1888 |
| CONSUMES | 738 |
| IMPORTS | 644 |
| VIOLATES | 629 |
| OWNS | 517 |
| DEPENDS_ON | 352 |
| BELONGS_TO | 338 |
| READS | 327 |
| WRITES | 172 |
| PROTECTED_BY | 98 |
| USES_CONTEXT | 96 |
| USES_ACTION | 86 |
| USES_SERVICE | 85 |
| CALLS | 75 |
| USES_ENGINE | 52 |
| USES_CORE | 11 |
| PROVIDES | 10 |
| USES_REGISTRY | 8 |
| USES_CONTRACT | 2 |

## Governance

- Constitution: aus `HUI_CONSTITUTION.md` geparst
- ADRs: aus Quellcode-Kommentaren extrahiert
- RFC-000: Layer-Regeln aus `domains.js`
- Domain Charters: automatisch aus `domains.js`

## API

Der Graph ist über `src/architecture/knowledge-graph/api.js` abrufbar:

```javascript
import { buildGraph, getNode, query, getImpact } from "./knowledge-graph";
const graph = await buildGraph();
getOwner(graph, "profiles");
getImpact(graph, "AppStateContext");
```