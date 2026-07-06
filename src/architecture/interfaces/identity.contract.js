/**
 * @domain IDENTITY
 * @file identity.contract.js
 * Shared read-only contract for cross-domain profile references.
 * CORE-001: Interface prepared — implementation in Phase 2.
 */

/** @typedef {Object} ProfileRef
 *  @property {string} id
 *  @property {string} display_name
 *  @property {string} [username]
 *  @property {string} [avatar_url]
 */

/** @typedef {Object} WirkerRef
 *  @property {string} id
 *  @property {string} user_id
 *  @property {string} slug
 *  @property {string} [talent]
 */

export {};
