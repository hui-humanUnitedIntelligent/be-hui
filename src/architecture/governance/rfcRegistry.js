// src/architecture/governance/rfcRegistry.js
// ══════════════════════════════════════════════════════════════════════════════
// RFC Registry — ARCH-003
// Lädt Request for Comments aus docs/governance/.
// ══════════════════════════════════════════════════════════════════════════════

import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const GOVERNANCE_DIR = join(resolve(__dirname, '../../..'), 'docs', 'governance');

/** @typedef {{ id: string, title: string, status: string, date: string, owner: string, content: string, path: string, rules: string[], governedDomains: string[] }} RFC */

const RFC_METADATA = Object.freeze({
  'RFC-000': {
    rules: ['layer-import-direction', 'service-layer-db', 'core-table-access', 'registry-for-meaning'],
    governedDomains: ['PAGES', 'COMPONENTS', 'FEATURES', 'HOOKS', 'CONTEXT', 'SERVICES', 'CORE', 'REGISTRY'],
    contracts: ['import-direction', 'db-access-layer', 'core-table-ownership'],
  },
});

/**
 * Lädt alle RFCs aus docs/governance/RFC-*.md
 * @returns {RFC[]}
 */
export function loadRfcs() {
  if (!existsSync(GOVERNANCE_DIR)) return [];

  const files = readdirSync(GOVERNANCE_DIR).filter(f => f.startsWith('RFC-') && f.endsWith('.md'));
  const rfcs = [];

  for (const file of files) {
    const path = join(GOVERNANCE_DIR, file);
    const content = readFileSync(path, 'utf8');
    const id = file.replace('.md', '');

    rfcs.push({
      id,
      title: (content.match(/^# (.+)/m) || [])[1] || id,
      status: extractMeta(content, 'Status') || 'Unknown',
      date: extractMeta(content, 'Date') || '',
      owner: extractMeta(content, 'Owner') || '',
      content,
      path: `docs/governance/${file}`,
      rules: RFC_METADATA[id]?.rules || [],
      governedDomains: RFC_METADATA[id]?.governedDomains || [],
      contracts: RFC_METADATA[id]?.contracts || [],
    });
  }

  return rfcs.sort((a, b) => a.id.localeCompare(b.id));
}

/**
 * Findet RFCs die für eine Domain gelten.
 * @param {string} domain
 * @param {RFC[]} [rfcs]
 */
export function getRfcsForDomain(domain, rfcs = loadRfcs()) {
  return rfcs.filter(rfc => rfc.governedDomains.includes(domain));
}

/**
 * Analysiert welche RFC-Contracts bei einer Änderung betroffen sind.
 * @param {{ type: string, file?: string, domain?: string, import?: { from: string, to: string } }} change
 * @param {RFC[]} [rfcs]
 */
export function analyzeRfcImpact(change, rfcs = loadRfcs()) {
  const affected = [];

  for (const rfc of rfcs) {
    const contracts = [];
    if (change.type === 'import' || change.type === 'layer_move') {
      if (rfc.contracts.includes('import-direction')) contracts.push('import-direction');
    }
    if (change.type === 'db_write' || change.type === 'deletion') {
      if (rfc.contracts.includes('db-access-layer')) contracts.push('db-access-layer');
    }
    if (change.type === 'core_access') {
      if (rfc.contracts.includes('core-table-ownership')) contracts.push('core-table-ownership');
    }

    if (contracts.length > 0) {
      affected.push({ rfc: rfc.id, title: rfc.title, affectedContracts: contracts, source: 'derived', confidence: 'high' });
    }
  }

  return affected;
}

function extractMeta(content, field) {
  const match = content.match(new RegExp(`\\*\\*${field}:\\*\\*\\s*(.+)`));
  return match ? match[1].trim() : null;
}
