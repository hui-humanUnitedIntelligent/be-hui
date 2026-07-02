// src/architecture/index.js
// ══════════════════════════════════════════════════════════════
// HUI Architecture Module — CORE-001
// Central export for domain ownership enforcement
// ══════════════════════════════════════════════════════════════

export { DOMAINS, TABLE_OWNERSHIP, WRITE_OWNER_DOMAINS, getTableOwner, isValidDomain } from './domains.js';
export { FILE_OWNERSHIP, getOwnership, assertDomain } from './ownership.js';
export {
  warnDirectDbAccess,
  warnActionEngineBypass,
  warnHookBusinessLogic,
  warnCrossDomainAccess,
  assertArchitecture,
  logDomainOwnership,
} from './guards.js';
export {
  VIOLATIONS,
  getViolationsByPriority,
  getViolationsForFile,
  getOpenViolations,
  getMigrationList,
  getViolationStats,
} from './violations.js';
