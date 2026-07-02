# Shared Domain Interfaces — Prepared Structure (CORE-001)

> Gemeinsame TypeScript/JSDoc-Interfaces für Cross-Domain-Kommunikation.

## Geplante Interfaces

```javascript
// identity.contract.js
/** @typedef {Object} ProfileRef
 *  @property {string} id
 *  @property {string} display_name
 *  @property {string} [avatar_url]
 */

// content.contract.js
/** @typedef {Object} WorkRef
 *  @property {string} id
 *  @property {string} user_id
 *  @property {string} title
 */

// social.contract.js
/** @typedef {Object} ChatRef
 *  @property {string} id
 *  @property {string[]} participant_ids
 */
```

## Regeln

- Interfaces sind read-only Contracts zwischen Domänen
- Keine Businesslogik in Interfaces
- Jede Domäne exportiert nur ihre eigenen Ref-Types
- Cross-Domain-Writes nur über explizite Service-Methoden

## Status

**CORE-001:** Dokumentiert, Implementierung in Phase 2.
