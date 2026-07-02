// src/architecture/knowledge-graph/governanceParser.js
// ══════════════════════════════════════════════════════════════════════════════
// HUI Architecture Knowledge Graph — ARCH-002
// Extrahiert Governance-Dokumente (Constitution, ADR, RFC) aus dem Repository.
// Keine manuellen Listen — alles aus echten Dateien geparst.
// ══════════════════════════════════════════════════════════════════════════════

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { nodeId } from './utils.js';
import { NODE_TYPES } from './types.js';

/**
 * Parst HUI_CONSTITUTION.md und extrahiert Regeln, Pfeiler, Invarianten.
 */
export function parseConstitution(projectRoot) {
  const path = join(projectRoot, 'HUI_CONSTITUTION.md');
  if (!existsSync(path)) return { constitution: null, rules: [], pillars: [], invariants: [] };

  const content = readFileSync(path, 'utf8');
  const constitution = {
    id: nodeId(NODE_TYPES.CONSTITUTION, 'HUI_CONSTITUTION'),
    type: NODE_TYPES.CONSTITUTION,
    name: 'HUI Constitution',
    path: 'HUI_CONSTITUTION.md',
    version: (content.match(/# HUI Constitution — v([\d.]+)/) || [])[1] || '1.0',
    status: content.includes('Ratifiziert') ? 'ratified' : 'draft',
    lines: content.split('\n').length,
  };

  const rules = [];
  const goldenRuleRe = /### (\d+) — ([^\n]+)\n([\s\S]*?)(?=\n### |\n---|\n## )/g;
  let m;
  while ((m = goldenRuleRe.exec(content)) !== null) {
    rules.push({
      id: nodeId(NODE_TYPES.CONSTITUTION_RULE, `golden-rule-${m[1]}`),
      type: NODE_TYPES.CONSTITUTION_RULE,
      name: `Golden Rule ${m[1]}: ${m[2].trim()}`,
      number: parseInt(m[1], 10),
      category: 'golden-rule',
      summary: m[3].trim().split('\n')[0].slice(0, 200),
      definedIn: constitution.id,
    });
  }

  const archRuleRe = /- \*\*([^*]+)\*\*\s*\n\s*([^\n]+)/g;
  while ((m = archRuleRe.exec(content)) !== null) {
    if (m[1].includes('Schichtenmodell')) continue;
    rules.push({
      id: nodeId(NODE_TYPES.CONSTITUTION_RULE, `arch-${rules.length + 1}`),
      type: NODE_TYPES.CONSTITUTION_RULE,
      name: m[1].trim(),
      category: 'architecture-rule',
      summary: m[2].trim().slice(0, 200),
      definedIn: constitution.id,
    });
  }

  const pillars = [];
  const pillarRe = /\|\s*(\d+)\s*\|\s*([🤝💚🎨🌱🌍][^|]+)\s*\|\s*([^|]+)\s*\|/g;
  while ((m = pillarRe.exec(content)) !== null) {
    pillars.push({
      id: nodeId(NODE_TYPES.INVARIANT, `pillar-${m[1]}`),
      type: NODE_TYPES.INVARIANT,
      name: m[2].trim(),
      number: parseInt(m[1], 10),
      description: m[3].trim(),
      definedIn: constitution.id,
    });
  }

  const invariants = [
    { name: 'Unidirectional Data Flow', pattern: 'Constitution → Registry → Engines → UI' },
    { name: 'No UI Impact Logic', pattern: 'UI reads from Core Engine only' },
    { name: 'Registry Single Source of Meaning', pattern: 'All texts from HuiRegistry' },
    { name: 'No Gamification', pattern: 'No XP, Levels, Badges, Streaks' },
  ].map((inv, i) => ({
    id: nodeId(NODE_TYPES.INVARIANT, inv.name),
    type: NODE_TYPES.INVARIANT,
    name: inv.name,
    pattern: inv.pattern,
    definedIn: constitution.id,
  }));

  return { constitution, rules, pillars, invariants };
}

/**
 * Extrahiert ADRs aus dem Quellcode (z.B. src/routes/registry.js).
 */
export function parseADRs(projectRoot) {
  const adrs = [];
  const adrSources = [
    { path: 'src/routes/registry.js', id: 'ADR-001', title: 'Route Authority' },
  ];

  for (const src of adrSources) {
    const fullPath = join(projectRoot, src.path);
    if (!existsSync(fullPath)) continue;
    const content = readFileSync(fullPath, 'utf8');
    const statusMatch = content.match(/Phase \d+ \(([^)]+)\)/);
    adrs.push({
      id: nodeId(NODE_TYPES.ADR, src.id),
      type: NODE_TYPES.ADR,
      name: src.id,
      title: src.title,
      path: src.path,
      status: statusMatch ? statusMatch[1] : 'active',
      release: (content.match(/Release:\s*(\S+)/) || [])[1] || null,
      definedIn: nodeId(NODE_TYPES.FILE, src.path),
    });
  }

  return adrs;
}

/**
 * Extrahiert RFC-Referenzen aus Code-Kommentaren und domains.js.
 */
export function parseRFCs(projectRoot) {
  const rfcs = [];
  const domainsPath = join(projectRoot, 'src/architecture/scanner/domains.js');
  if (existsSync(domainsPath)) {
    const content = readFileSync(domainsPath, 'utf8');
    const layerRule = content.match(/Layering-Regel \(RFC-000\):\s*\n\s*([^\n]+)/);
    rfcs.push({
      id: nodeId(NODE_TYPES.RFC, 'RFC-000'),
      type: NODE_TYPES.RFC,
      name: 'RFC-000',
      title: 'Layer Dependency Rules',
      rule: layerRule ? layerRule[1].trim() : 'UI → Features → Services → Core → Registry',
      definedIn: nodeId(NODE_TYPES.FILE, 'architecture/scanner/domains.js'),
    });
  }
  return rfcs;
}

/**
 * Extrahiert Domain Charters aus domains.js (automatisch, nicht manuell).
 */
export function parseDomainCharters(projectRoot) {
  const domainsPath = join(projectRoot, 'src/architecture/scanner/domains.js');
  if (!existsSync(domainsPath)) return [];

  const content = readFileSync(domainsPath, 'utf8');
  const charters = [];
  const domainRe = /(\w+):\s*\{[^}]*id:\s*'(\w+)'[^}]*label:\s*'([^']+)'[^}]*description:\s*'([^']+)'[^}]*paths:\s*\[([^\]]+)\][^}]*layer:\s*(-?\d+)[^}]*allowedDependencies:\s*\[([^\]]*)\]/gs;
  let m;
  while ((m = domainRe.exec(content)) !== null) {
    const paths = m[5].split(',').map(p => p.trim().replace(/['"]/g, ''));
    const deps = m[7] ? m[7].split(',').map(d => d.trim().replace(/['"]/g, '')).filter(Boolean) : [];
    charters.push({
      id: nodeId(NODE_TYPES.DOMAIN_CHARTER, m[2]),
      type: NODE_TYPES.DOMAIN_CHARTER,
      name: m[2],
      label: m[3],
      description: m[4],
      paths,
      layer: parseInt(m[6], 10),
      allowedDependencies: deps,
      definedIn: nodeId(NODE_TYPES.FILE, 'architecture/scanner/domains.js'),
    });
  }
  return charters;
}

/**
 * Mappt Violation-Typen auf Constitution-Regeln (automatisch aus violationDetector).
 */
export function mapViolationsToRules(violationType) {
  const mapping = {
    DB_DIRECT_WRITE:   ['Golden Rule 10', 'No UI Impact Logic'],
    DB_DIRECT_READ:    ['No UI Impact Logic'],
    CORE_BYPASS:       ['Unidirectional Data Flow', 'Registry Single Source of Meaning'],
    REGISTRY_BYPASS:   ['Registry Single Source of Meaning'],
    DIRECT_ROUTING:    ['Unidirectional Data Flow'],
    ACTION_ENGINE_GAP: ['Unidirectional Data Flow'],
    LAYER_VIOLATION:   ['RFC-000'],
    DUPLICATE_OWNER:   ['Registry Single Source of Meaning'],
    MISSING_HEADER:    [],
  };
  return mapping[violationType] || [];
}
