// src/architecture/policy/types.js
// ══════════════════════════════════════════════════════════════════════════════
// ARCH-006 — Shared Type Definitions (JSDoc)
// ══════════════════════════════════════════════════════════════════════════════

/**
 * @typedef {object} ContractsDocument
 * @property {object} meta
 * @property {DomainContract[]} domains
 * @property {Record<string, DomainContract>} byId
 * @property {string} loadedAt
 * @property {string} source
 */

/**
 * @typedef {object} DomainContract
 * @property {string} id
 * @property {string} label
 * @property {string} version
 * @property {string} status
 * @property {object} data
 * @property {object} ownership
 * @property {object} dependencies
 * @property {object} events
 * @property {object} realtime
 * @property {object} layers
 * @property {object} constitution
 * @property {object[]} scannerRules
 * @property {object} [migration]
 * @property {object[]} [files]
 */

/**
 * @typedef {'ownership'|'import'|'realtime'|'layer'|'service'|'context'|'table'|'event'|'hook'|'ui'|'core'|'scanner'|'migration'} PolicyType
 */

/**
 * @typedef {object} CompiledPolicy
 * @property {string} id
 * @property {PolicyType} type
 * @property {string} domainId
 * @property {string} contractVersion
 * @property {string} description
 * @property {object} spec
 * @property {string[]} constitutionRefs
 * @property {string[]} adrRefs
 * @property {string[]} rfcRefs
 */

/**
 * @typedef {object} CompiledRule
 * @property {string} id
 * @property {string} type
 * @property {string} domainId
 * @property {string} policyId
 * @property {string} severity
 * @property {string} description
 * @property {boolean} enforceable
 * @property {object} check
 * @property {string[]} constitutionRefs
 * @property {string[]} adrRefs
 * @property {string[]} rfcRefs
 */

/**
 * @typedef {object} PolicyViolation
 * @property {string} id
 * @property {string} type
 * @property {string} severity
 * @property {string} domainId
 * @property {string} contractId
 * @property {string} ruleId
 * @property {string} [file]
 * @property {number|null} [line]
 * @property {string} message
 * @property {string} [detail]
 * @property {object} [explanation]
 */
