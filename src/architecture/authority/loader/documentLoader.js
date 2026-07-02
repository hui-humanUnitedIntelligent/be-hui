// src/architecture/authority/loader/documentLoader.js
// ══════════════════════════════════════════════════════════════════════════════
// HUI Architecture Authority — Document Loader (ARCH-004)
// Lädt echte Governance-Dokumente aus dem Repository.
// Keine Mockdaten. Keine erfundenen Regeln.
// ══════════════════════════════════════════════════════════════════════════════

import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
export const PROJECT_ROOT = resolve(__dirname, '../../../..');
export const GOVERNANCE_DIR = join(PROJECT_ROOT, 'docs', 'governance');
export const GENERATED_DIR = join(PROJECT_ROOT, 'docs', 'generated');

const DOCUMENT_PATHS = Object.freeze({
  constitution: join(PROJECT_ROOT, 'HUI_CONSTITUTION.md'),
  queryRules: join(PROJECT_ROOT, 'QUERY_RULES.md'),
  systemOwnership: join(PROJECT_ROOT, 'docs', 'SYSTEM_OWNERSHIP.md'),
  realtimeRegistry: join(PROJECT_ROOT, 'docs', 'REALTIME_REGISTRY.md'),
  architectureIndex: join(PROJECT_ROOT, 'docs', 'ARCHITECTURE_INDEX.md'),
  metrics: join(GENERATED_DIR, 'metrics.json'),
  violations: join(GENERATED_DIR, 'violations.json'),
});

/**
 * Liest eine Datei sicher — gibt null zurück wenn nicht vorhanden.
 * @param {string} path
 */
export function readDocument(path) {
  if (!existsSync(path)) return null;
  return readFileSync(path, 'utf8');
}

/**
 * Liest JSON-Artefakt aus docs/generated/.
 * @param {string} name — z.B. 'metrics.json'
 */
export function readGeneratedJson(name) {
  const path = join(GENERATED_DIR, name);
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return null;
  }
}

/**
 * Lädt HUI_CONSTITUTION.md
 */
export function loadConstitutionDocument() {
  const content = readDocument(DOCUMENT_PATHS.constitution);
  if (!content) return null;

  const versionMatch = content.match(/# HUI Constitution — v([\d.]+)/);
  const statusMatch = content.match(/\*\*Status:\*\*\s*(.+)/);
  const dateMatch = content.match(/\*\*Datum:\*\*\s*(.+)/);

  return {
    id: 'CONSTITUTION',
    path: 'HUI_CONSTITUTION.md',
    version: versionMatch?.[1] || '1.0',
    status: statusMatch?.[1]?.trim() || 'Ratified',
    date: dateMatch?.[1]?.trim() || '2026-06-29',
    content,
  };
}

/**
 * Extrahiert Goldene Regeln aus Constitution.
 * @param {string} content
 */
export function parseGoldenRules(content) {
  const rules = [];
  const section = content.match(/## III\. Die zehn Goldenen Regeln([\s\S]*?)## IV\./);
  if (!section) return rules;

  const matches = [...section[1].matchAll(/### (\d+) — (.+?)\n([\s\S]*?)(?=### \d+|$)/g)];
  for (const m of matches) {
    rules.push({
      id: `GR-${m[1].padStart(2, '0')}`,
      number: parseInt(m[1], 10),
      title: m[2].trim(),
      content: m[3].trim(),
      section: `III.${m[1]}`,
    });
  }
  return rules;
}

/**
 * Extrahiert Grundpfeiler aus Constitution.
 * @param {string} content
 */
export function parsePillars(content) {
  const pillars = [];
  const tableMatch = content.match(/\| # \| Grundpfeiler[\s\S]*?\n((?:\|[^\n]+\n)+)/);
  if (!tableMatch) return pillars;

  const rows = tableMatch[1].trim().split('\n');
  for (const row of rows) {
    const cols = row.split('|').map(c => c.trim()).filter(Boolean);
    if (cols.length >= 2 && /^\d+$/.test(cols[0])) {
      pillars.push({
        id: `PILLAR-${cols[0]}`,
        number: parseInt(cols[0], 10),
        name: cols[1].replace(/[*🤝💚🎨🌱🌍]/g, '').trim(),
        meaning: cols[2] || '',
      });
    }
  }
  return pillars;
}

/**
 * Extrahiert Architekturregeln aus Constitution IV.
 * @param {string} content
 */
export function parseArchitecturePrinciples(content) {
  const principles = [];
  const section = content.match(/### Unveränderliche Architekturregeln([\s\S]*?)---/);
  if (!section) return principles;

  const bullets = [...section[1].matchAll(/- \*\*(.+?)\*\*\s*\n\s*(.+?)(?=\n- |\n\n|$)/gs)];
  for (const [i, m] of bullets.entries()) {
    principles.push({
      id: `ARCH-PRINCIPLE-${i + 1}`,
      title: m[1].trim(),
      description: m[2].trim(),
      section: 'IV — Unveränderliche Architekturregeln',
    });
  }
  return principles;
}

/**
 * Lädt alle ADRs aus docs/governance/ADR-*.md
 */
export function loadAdrDocuments() {
  if (!existsSync(GOVERNANCE_DIR)) return [];

  return readdirSync(GOVERNANCE_DIR)
    .filter(f => f.startsWith('ADR-') && f.endsWith('.md'))
    .map(file => {
      const content = readDocument(join(GOVERNANCE_DIR, file));
      const id = extractDocumentId(file, content) || file.replace('.md', '');
      return {
        id,
        path: `docs/governance/${file}`,
        title: extractHeading(content) || id,
        status: extractMeta(content, 'Status') || 'Unknown',
        date: extractMeta(content, 'Date') || '',
        owner: extractMeta(content, 'Owner') || '',
        release: extractMeta(content, 'Release') || '',
        content,
      };
    })
    .sort((a, b) => a.id.localeCompare(b.id));
}

/**
 * Lädt alle RFCs aus docs/governance/RFC-*.md
 */
export function loadRfcDocuments() {
  if (!existsSync(GOVERNANCE_DIR)) return [];

  return readdirSync(GOVERNANCE_DIR)
    .filter(f => f.startsWith('RFC-') && f.endsWith('.md'))
    .map(file => {
      const content = readDocument(join(GOVERNANCE_DIR, file));
      const id = extractDocumentId(file, content) || file.replace('.md', '');
      return {
        id,
        path: `docs/governance/${file}`,
        title: extractHeading(content) || id,
        status: extractMeta(content, 'Status') || 'Unknown',
        date: extractMeta(content, 'Date') || '',
        owner: extractMeta(content, 'Owner') || '',
        content,
      };
    })
    .sort((a, b) => a.id.localeCompare(b.id));
}

/**
 * Lädt Policy-Dokumente (QUERY_RULES, REALTIME, OWNERSHIP).
 */
export function loadPolicyDocuments() {
  const policies = [];

  const queryRules = readDocument(DOCUMENT_PATHS.queryRules);
  if (queryRules) {
    policies.push({
      id: 'POLICY-QUERY-RULES',
      path: 'QUERY_RULES.md',
      title: 'HUI Query Rules',
      status: 'Accepted',
      content: queryRules,
      rules: parseNumberedRules(queryRules, 'Rule'),
    });
  }

  const realtime = readDocument(DOCUMENT_PATHS.realtimeRegistry);
  if (realtime) {
    policies.push({
      id: 'POLICY-REALTIME',
      path: 'docs/REALTIME_REGISTRY.md',
      title: 'HUI Realtime Channel Registry',
      status: 'Accepted',
      content: realtime,
      rules: parseNumberedRules(realtime, 'Regeln'),
    });
  }

  const ownership = readDocument(DOCUMENT_PATHS.systemOwnership);
  if (ownership) {
    policies.push({
      id: 'POLICY-OWNERSHIP',
      path: 'docs/SYSTEM_OWNERSHIP.md',
      title: 'HUI System Ownership Map',
      status: 'Accepted',
      content: ownership,
      rules: [],
    });
  }

  return policies;
}

/**
 * Parst nummerierte Regeln aus Markdown.
 */
function parseNumberedRules(content, sectionKeyword) {
  const rules = [];
  const sectionIdx = content.indexOf(sectionKeyword);
  if (sectionIdx === -1) {
    const ruleMatches = [...content.matchAll(/## Rule (\d+):\s*(.+)/g)];
    for (const m of ruleMatches) {
      rules.push({ id: `QR-${m[1]}`, number: parseInt(m[1], 10), title: m[2].trim() });
    }
    return rules;
  }

  const numbered = [...content.matchAll(/(\d+)\.\s+\*\*(.+?)\*\*/g)];
  for (const m of numbered) {
    rules.push({ id: `RT-${m[1]}`, number: parseInt(m[1], 10), title: m[2].trim() });
  }
  return rules;
}

function extractMeta(content, field) {
  if (!content) return null;
  const match = content.match(new RegExp(`\\*\\*${field}:\\*\\*\\s*(.+)`));
  return match ? match[1].trim() : null;
}

function extractHeading(content) {
  if (!content) return null;
  return (content.match(/^# (.+)/m) || [])[1] || null;
}

/** Extrahiert kanonische ID (ADR-001, RFC-000, RFC-000A) aus Dateiname oder Heading */
function extractDocumentId(filename, content) {
  const fromFile = filename.match(/^(ADR-\d+|RFC-\d+A?)/i);
  if (fromFile) return fromFile[1].toUpperCase().replace(/^(ADR|RFC)/, (m) => m);

  const heading = extractHeading(content);
  if (heading) {
    const fromHeading = heading.match(/(ADR-\d+|RFC-\d+A?)/i);
    if (fromHeading) return fromHeading[1].toUpperCase();
  }
  return null;
}

export { DOCUMENT_PATHS };
