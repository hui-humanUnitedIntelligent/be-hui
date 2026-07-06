/**
 * @domain CONTENT
 * @file content.contract.js
 * Shared read-only contract for cross-domain content references.
 * CORE-001: Interface prepared — implementation in Phase 2.
 */

/** @typedef {Object} WorkRef
 *  @property {string} id
 *  @property {string} user_id
 *  @property {string} title
 *  @property {string} [cover_url]
 *  @property {string} [status]
 */

/** @typedef {Object} StoryRef
 *  @property {string} id
 *  @property {string} user_id
 *  @property {string} [media_url]
 *  @property {string} [media_type]
 */

export {};
