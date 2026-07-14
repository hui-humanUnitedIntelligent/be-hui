// src/architecture/governance/adrRegistry.js
// ══════════════════════════════════════════════════════════════════════════════
// ADR Registry — ARCH-003
// Lädt Architecture Decision Records aus docs/governance/.
// ══════════════════════════════════════════════════════════════════════════════

import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const GOVERNANCE_DIR = join(resolve(__dirname, '../../..'), 'docs', 'governance');

/** @typedef {{ id: string, title: string, status: string, date: string, owner: string, content: string, path: string, governedPaths: string[], violationTypes: string[] }} ADR */

/** Statische ADR-Metadaten — explizite Zuordnungen aus dem Code */
const ADR_METADATA = Object.freeze({
  'ADR-001': {
    governedPaths: ['src/routes/', 'src/pages/'],
    violationTypes: ['DIRECT_ROUTING'],
    implements: ['Route Registry Shadow Mode'],
    supersedes: [],
  },
  'ADR-002': {
    governedPaths: ['src/architecture/'],
    violationTypes: ['CORE_BYPASS', 'DB_DIRECT_WRITE', 'LAYER_VIOLATION', 'DUPLICATE_OWNER', 'REGISTRY_BYPASS', 'MISSING_HEADER'],
    implements: ['Architecture Scanner', 'Architecture Intelligence'],
    supersedes: [],
  },
});

/**
 * Lädt alle ADRs aus docs/governance/ADR-*.md
 * @returns {ADR[]}
 */
export function loadAdrs() {
  if (!existsSync(GOVERNANCE_DIR)) return [];

  const files = readdirSync(GOVERNANCE_DIR).filter(f => f.startsWith('ADR-') && f.endsWith('.md'));
  const adrs = [];

  for (const file of files) {
    const path = join(GOVERNANCE_DIR, file);
    const content = readFileSync(path, 'utf8');
    const id = file.replace('.md', '');

    adrs.push({
      id,
      title: extractField(content, 'title') || extractHeading(content) || id,
      status: extractMeta(content, 'Status') || 'Unknown',
      date: extractMeta(content, 'Date') || '',
      owner: extractMeta(content, 'Owner') || '',
      content,
      path: `docs/governance/${file}`,
      governedPaths: ADR_METADATA[id]?.governedPaths || [],
      violationTypes: ADR_METADATA[id]?.violationTypes || [],
      implements: ADR_METADATA[id]?.implements || [],
      supersedes: ADR_METADATA[id]?.supersedes || [],
    });
  }

  return adrs.sort((a, b) => a.id.localeCompare(b.id));
}

/**
 * Findet ADRs die für eine Datei gelten.
 * @param {string} filePath — src-relative Pfad
 * @param {ADR[]} [adrs]
 * @returns {ADR[]}
 */
export function getAdrsForFile(filePath, adrs = loadAdrs()) {
  const normalized = filePath.replace(/\\/g, '/');
  return adrs.filter(adr =>
    adr.governedPaths.some(p => normalized.startsWith(p.replace(/^src\//, '')) || `src/${normalized}`.startsWith(p))
  );
}

/**
 * Findet ADRs die durch einen Violation-Typ betroffen sind.
 * @param {string} violationType
 * @param {ADR[]} [adrs]
 * @returns {ADR[]}
 */
export function getAdrsForViolationType(violationType, adrs = loadAdrs()) {
  return adrs.filter(adr => adr.violationTypes.includes(violationType));
}

/**
 * Analysiert ADR-Compliance für eine Datei.
 * @param {string} filePath
 * @param {Violation[]} violations
 * @param {ADR[]} [adrs]
 */
export function analyzeAdrCompliance(filePath, violations, adrs = loadAdrs()) {
  const applicable = getAdrsForFile(filePath, adrs);
  const fileViolations = violations.filter(v => v.file === filePath);

  return applicable.map(adr => {
    const violated = fileViolations.filter(v => adr.violationTypes.includes(v.type));
    const implemented = violated.length === 0;

    return {
      adr: adr.id,
      title: adr.title,
      status: implemented ? 'implemented' : 'violated',
      violations: violated,
      source: 'explicit',
      confidence: 'high',
    };
  });
}

function extractMeta(content, field) {
  const match = content.match(new RegExp(`\\*\\*${field}:\\*\\*\\s*(.+)`));
  return match ? match[1].trim() : null;
}

function extractHeading(content) {
  return (content.match(/^# (.+)/m) || [])[1] || null;
}

function extractField(content, field) {
  if (field === 'title') return extractHeading(content);
  return null;
}
