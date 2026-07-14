// src/architecture/governance/index.js
export {
  parseConstitution,
  ARCHITECTURE_RULES,
  GOLDEN_RULES,
  PILLARS,
  getRuleForViolationType,
  getRulesForDomain,
} from './constitution.js';

export {
  loadAdrs,
  getAdrsForFile,
  getAdrsForViolationType,
  analyzeAdrCompliance,
} from './adrRegistry.js';

export {
  loadRfcs,
  getRfcsForDomain,
  analyzeRfcImpact,
} from './rfcRegistry.js';
