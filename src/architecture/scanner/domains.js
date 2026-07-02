// src/architecture/scanner/domains.js
// ══════════════════════════════════════════════════════════════════════════════
// HUI Domain Registry — ARCH-001 + ARCH-006
//
// Domain-Auflösung erfolgt ausschließlich über Domain Contracts (ARCH-006).
// Keine lokalen Domain-Definitionen mehr.
// ══════════════════════════════════════════════════════════════════════════════

import {
  resolveDomainForFile,
  isDomainImportAllowed,
  getContractForFile,
} from '../policy/domainResolver.js';
import { loadContracts } from '../policy/contractLoader.js';

export const getDomainForPath = resolveDomainForFile;

/**
 * Baut DOMAINS-Map aus Domain Contracts (Kompatibilität).
 */
export function getDomains() {
  const contracts = loadContracts();
  const domains = {};
  for (const contract of contracts.domains) {
    domains[contract.id] = {
      id: contract.id,
      label: contract.label,
      description: contract.purpose,
      paths: (contract.files || []).map(f => 'src/' + f.path.replace(/^src\//, '')),
      allowedDependencies: contract.dependencies?.importMatrix?.allowed || contract.dependencies?.mayDependOn || [],
      color: '#94A3B8',
    };
  }
  return domains;
}

/** @deprecated Nutze getDomains() — lazy für Kompatibilität */
export const DOMAINS = new Proxy({}, {
  get(_, prop) {
    return getDomains()[prop];
  },
  ownKeys() {
    return Object.keys(getDomains());
  },
  getOwnPropertyDescriptor(_, prop) {
    const val = getDomains()[prop];
    return val ? { enumerable: true, configurable: true, value: val } : undefined;
  },
});

export const LAYER_ORDER = Object.keys(getDomains());

/**
 * Prüft ob ein Import erlaubt ist — via Domain Contract Import-Matrix.
 */
export function isImportAllowed(sourceDomain, targetDomain) {
  return isDomainImportAllowed(sourceDomain, targetDomain);
}

export { getContractForFile, resolveDomainForFile, isDomainImportAllowed };
