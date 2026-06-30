// src/architecture/policy/domainResolver.js
// ══════════════════════════════════════════════════════════════════════════════
// ARCH-006 — Domain Resolver
// Ordnet Dateien Business-Domains zu — ausschließlich aus Domain Contracts.
// ══════════════════════════════════════════════════════════════════════════════

import { loadContracts, getContract } from './contractLoader.js';

let _fileMap = null;
let _pathPatternMap = null;

function normalizePath(filePath) {
  return filePath
    .replace(/\\/g, '/')
    .replace(/^src\//, '')
    .replace(/^\/+/, '');
}

function buildMaps(contracts) {
  const fileMap = new Map();
  const pathPatterns = [];

  for (const contract of contracts.domains) {
    for (const entry of contract.files || []) {
      const path = normalizePath(entry.path);
      fileMap.set(path, {
        domainId: contract.id,
        multiDomain: entry.multiDomain || false,
        alsoDomains: entry.alsoDomains || [],
      });
    }

    const ownership = contract.ownership || {};
    for (const category of ['services', 'contexts', 'hooks', 'components', 'pages']) {
      for (const pattern of ownership[category] || []) {
        pathPatterns.push({
          domainId: contract.id,
          pattern: normalizePath(pattern),
          category,
        });
      }
    }
  }

  pathPatterns.sort((a, b) => b.pattern.length - a.pattern.length);
  return { fileMap, pathPatterns };
}

function ensureMaps() {
  if (_fileMap) return;
  const contracts = loadContracts();
  const maps = buildMaps(contracts);
  _fileMap = maps.fileMap;
  _pathPatternMap = maps.pathPatterns;
}

/**
 * Löst die primäre Business-Domain für einen Dateipfad auf.
 * @param {string} filePath
 * @returns {string} Domain-ID oder 'UNKNOWN'
 */
export function resolveDomainForFile(filePath) {
  ensureMaps();
  const normalized = normalizePath(filePath);

  const exact = _fileMap.get(normalized);
  if (exact) return exact.domainId;

  for (const { domainId, pattern } of _pathPatternMap) {
    if (pattern.endsWith('/*')) {
      const prefix = pattern.slice(0, -2);
      if (normalized.startsWith(prefix + '/') || normalized === prefix) return domainId;
    } else if (normalized === pattern || normalized.startsWith(pattern + '/')) {
      return domainId;
    } else if (normalized.endsWith('/' + pattern) || normalized.endsWith(pattern)) {
      return domainId;
    }
  }

  return 'UNKNOWN';
}

/**
 * Gibt alle Domains für eine Datei zurück (inkl. Multi-Domain).
 * @param {string} filePath
 */
export function resolveAllDomainsForFile(filePath) {
  ensureMaps();
  const normalized = normalizePath(filePath);
  const exact = _fileMap.get(normalized);

  if (exact) {
    return [exact.domainId, ...(exact.alsoDomains || [])];
  }

  const primary = resolveDomainForFile(filePath);
  return primary === 'UNKNOWN' ? [] : [primary];
}

/**
 * Prüft ob ein Import zwischen zwei Domains erlaubt ist.
 * @param {string} sourceDomainId
 * @param {string} targetDomainId
 */
export function isDomainImportAllowed(sourceDomainId, targetDomainId) {
  if (sourceDomainId === targetDomainId) return { allowed: true, reason: 'same-domain' };
  if (sourceDomainId === 'UNKNOWN' || targetDomainId === 'UNKNOWN') {
    return { allowed: true, reason: 'unknown-domain' };
  }

  const source = getContract(sourceDomainId);
  const matrix = source.dependencies?.importMatrix || {};
  const allowed = matrix.allowed || [];
  const forbidden = matrix.forbidden || [];

  if (forbidden.includes(targetDomainId) || forbidden.includes('*')) {
    return { allowed: false, reason: `import-forbidden: ${sourceDomainId} → ${targetDomainId}` };
  }

  if (allowed.includes('*') || allowed.includes(targetDomainId)) {
    return { allowed: true, reason: 'contract-allowed' };
  }

  if (allowed.length === 0 && forbidden.length === 0) {
    const mayDepend = source.dependencies?.mayDependOn || [];
    if (mayDepend.includes(targetDomainId) || mayDepend.includes('*')) {
      return { allowed: true, reason: 'may-depend-on' };
    }
  }

  return { allowed: false, reason: `DOMAIN_IMPORT: ${sourceDomainId} → ${targetDomainId} nicht in Contract` };
}

/**
 * Gibt den Domain Contract für einen Dateipfad zurück.
 * @param {string} filePath
 */
export function getContractForFile(filePath) {
  const domainId = resolveDomainForFile(filePath);
  if (domainId === 'UNKNOWN') return null;
  return getContract(domainId);
}

/** Cache invalidieren */
export function invalidateDomainResolverCache() {
  _fileMap = null;
  _pathPatternMap = null;
}

// Kompatibilität mit ARCH-001 Scanner API
export const getDomainForPath = resolveDomainForFile;
