// src/architecture/semantic/reportGenerator.js
// Semantic architecture reports for ARCH-002.1.

import { SEMANTIC_NODE_TYPES } from '../graph/schema.js';
import { createQueryApi } from './queryApi.js';

/**
 * @param {import('../graph/graphStore.js').GraphStore} store
 * @param {Object} metrics
 */
export function generateSemanticReports(store, metrics = {}) {
  const api = createQueryApi(store);

  return {
    'semantic-architecture-report.md': generateSemanticArchitectureReport(store, metrics),
    'capability-report.md': generateCapabilityReport(api),
    'journey-report.md': generateJourneyReport(api),
    'meaning-report.md': generateMeaningReport(store),
    'human-principle-report.md': generateListReport('Human Principle Report', api.getHumanPrinciples()),
    'platform-goals-report.md': generateListReport('Platform Goals Report', api.getPlatformGoals()),
    'quality-report.md': generateListReport('Quality Report', api.getQualityAttributes()),
    'architecture-intent-report.md': generateArchitectureIntentReport(store),
    'decision-trace-report.md': generateDecisionTraceReport(store),
    'constitution-coverage-report.md': generateConstitutionCoverageReport(store),
  };
}

function generateSemanticArchitectureReport(store, metrics) {
  const lines = [
    '# Semantic Architecture Report — ARCH-002.1',
    '',
    `> Scan: ${metrics.scanVersion || 'ARCH-002.1'} | Nodes: ${store.nodes.size} | Edges: ${store.edges.length}`,
    '',
    '## Übersicht',
    '',
    'Der Knowledge Graph verbindet technische Struktur (ARCH-002) mit semantischer Bedeutung (ARCH-002.1).',
    '',
    '| Kategorie | Anzahl |',
    '|-----------|--------|',
  ];

  const types = [...new Set([...store.nodes.values()].map(n => n.type))].sort();
  for (const type of types) {
    const count = store.getNodesByType(type).length;
    lines.push(`| ${type} | ${count} |`);
  }

  const inferred = [...store.nodes.values()].filter(n => n.confidence === 'inferred').length;
  const confirmed = [...store.nodes.values()].filter(n => n.confidence === 'confirmed').length;
  lines.push('', '## Confidence', '', `- Confirmed: ${confirmed}`, `- Inferred: ${inferred}`, '');

  lines.push('## Beispiel-Queries', '', '```javascript');
  lines.push("explain.whyDoesThisExist('lib/bookingContext.js')");
  lines.push("explain.whyDoesThisExist('registry/HuiRegistry.js')");
  lines.push("explain.whatProtects('Discovery')");
  lines.push('```');

  return lines.join('\n');
}

function generateCapabilityReport(api) {
  const caps = api.getCapabilities();
  const lines = [
    '# Capability Report — ARCH-002.1',
    '',
    `> ${caps.length} Capabilities`,
    '',
    '| Capability | Confidence | Code-Signale |',
    '|------------|------------|--------------|',
  ];

  for (const cap of caps.sort((a, b) => a.label.localeCompare(b.label))) {
    const signals = (cap.meta?.fileCount || 0) + (cap.meta?.actionCount || 0) + (cap.meta?.serviceCount || 0);
    lines.push(`| ${cap.label} | ${cap.confidence} | ${signals || '—'} |`);
  }

  return lines.join('\n');
}

function generateJourneyReport(api) {
  const journeys = api.getJourneys();
  const processes = api.getBusinessProcesses();
  const lines = [
    '# Journey Report — ARCH-002.1',
    '',
    '## User Journeys',
    '',
  ];

  for (const j of journeys) {
    lines.push(`### ${j.label}`, '', j.description || '', `Confidence: ${j.confidence}`, '');
  }

  lines.push('## Business Processes', '');
  for (const p of processes) {
    lines.push(`- **${p.label}** (${p.confidence})`);
  }

  return lines.join('\n');
}

function generateMeaningReport(store) {
  const intents = store.getNodesByType(SEMANTIC_NODE_TYPES.INTENT);
  const lines = [
    '# Meaning Report — ARCH-002.1',
    '',
    '## Intent & Meaning Nodes',
    '',
  ];

  for (const i of intents) {
    lines.push(`### ${i.label}`, '', i.description || '', `- Source: ${i.source}`, `- Confidence: ${i.confidence}`, '');
  }

  return lines.join('\n');
}

function generateListReport(title, nodes) {
  const lines = [`# ${title} — ARCH-002.1`, ''];
  for (const n of nodes) {
    lines.push(`## ${n.label}`, '', n.description || '', `- Confidence: ${n.confidence}`, `- Source: ${n.source}`, '');
  }
  return lines.join('\n');
}

function generateArchitectureIntentReport(store) {
  const principles = store.getNodesByType(SEMANTIC_NODE_TYPES.ARCHITECTURE_PRINCIPLE);
  const patterns = store.getNodesByType(SEMANTIC_NODE_TYPES.ARCHITECTURE_PATTERN);
  const decisions = store.getNodesByType(SEMANTIC_NODE_TYPES.DECISION);

  const lines = [
    '# Architecture Intent Report — ARCH-002.1',
    '',
    '## Architecture Principles',
    '',
  ];
  for (const p of principles) lines.push(`- **${p.label}**: ${p.description}`);

  lines.push('', '## Patterns', '');
  for (const p of patterns) lines.push(`- **${p.label}**: ${p.description}`);

  lines.push('', '## Decisions', '');
  for (const d of decisions) lines.push(`- **${d.label}**: ${d.description}`);

  return lines.join('\n');
}

function generateDecisionTraceReport(store) {
  const decisions = store.getNodesByType(SEMANTIC_NODE_TYPES.DECISION);
  const lines = ['# Decision Trace Report — ARCH-002.1', ''];

  for (const d of decisions) {
    const linked = store.getNeighbors(d.id, null, 'out');
    lines.push(`## ${d.label}`, '', d.description || '', '');
    if (linked.length) {
      lines.push('Betrifft:', '');
      for (const l of linked) lines.push(`- ${l.node.label} (${l.edge.type})`);
      lines.push('');
    }
  }

  return lines.join('\n');
}

function generateConstitutionCoverageReport(store) {
  const rules = store.getNodesByType(SEMANTIC_NODE_TYPES.CONSTITUTION_PRINCIPLE);
  const caps = store.getNodesByType(SEMANTIC_NODE_TYPES.CAPABILITY);
  const lines = [
    '# Constitution Coverage Report — ARCH-002.1',
    '',
    '## Regeln → Geschützte Entitäten',
    '',
  ];

  for (const rule of rules) {
    const protected_ = store.getNeighbors(rule.id, 'PROTECTS', 'out');
    lines.push(`### ${rule.label}`, '', `Geschützt: ${protected_.map(p => p.node.label).join(', ') || '—'}`, '');
  }

  const uncovered = caps.filter(cap => {
    const protectors = store.getNeighbors(cap.id, 'PROTECTS', 'in');
    return protectors.length === 0;
  });

  if (uncovered.length) {
    lines.push('## Capabilities ohne Constitution-Schutz (inferred gap)', '');
    for (const c of uncovered) lines.push(`- ${c.label}`);
  }

  return lines.join('\n');
}
