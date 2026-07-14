// src/architecture/knowledge-graph/reportGenerator.js
// ══════════════════════════════════════════════════════════════════════════════
// HUI Architecture Knowledge Graph — ARCH-002
// Generiert alle Architektur-Reports aus dem Knowledge Graph.
// ══════════════════════════════════════════════════════════════════════════════

import { NODE_TYPES } from './types.js';
import { SCAN_VERSION } from './types.js';

const HEADER = `> Automatisch generiert — HUI Architecture Knowledge Graph (${SCAN_VERSION})
> ⚠️ Nicht manuell bearbeiten. Wird bei \`npm run architecture:graph\` überschrieben.
`;

export function generateAllReports(graph, queryEngine, impactSimulator) {
  return {
    'architecture-graph-report.md': generateArchitectureGraphReport(graph),
    'dependency-report.md':         generateDependencyReport(graph, queryEngine),
    'ownership-report-kg.md':       generateOwnershipReport(graph, queryEngine),
    'impact-report.md':             generateImpactReport(graph, queryEngine, impactSimulator),
    'service-report-kg.md':         generateServiceReport(graph),
    'core-report-kg.md':            generateCoreReport(graph),
    'registry-report-kg.md':        generateRegistryReport(graph),
    'domain-report.md':             generateDomainReport(graph),
    'violation-report-kg.md':       generateViolationReport(graph),
    'migration-report.md':          generateMigrationReport(graph, queryEngine),
    'refactoring-report.md':        generateRefactoringReport(graph, impactSimulator),
    'dead-code-report.md':          generateDeadCodeReport(graph, queryEngine),
    'circular-dependency-report.md': generateCircularDependencyReport(queryEngine),
  };
}

export function generateArchitectureGraphReport(graph) {
  const byType = {};
  for (const node of graph.nodes.values()) {
    byType[node.type] = (byType[node.type] || 0) + 1;
  }

  const byEdge = {};
  for (const edge of graph.edges) {
    byEdge[edge.type] = (byEdge[edge.type] || 0) + 1;
  }

  return [
    '# HUI Architecture Knowledge Graph Report',
    '',
    HEADER,
    `**Generiert:** ${graph.generatedAt}`,
    `**Version:** ${graph.version}`,
    '',
    '## Übersicht',
    '',
    '| Metrik | Wert |',
    '|--------|------|',
    `| Knoten gesamt | ${graph.stats.nodes} |`,
    `| Kanten gesamt | ${graph.stats.edges} |`,
    `| Dateien analysiert | ${graph.stats.files} |`,
    `| Domains | ${graph.stats.domains} |`,
    `| Tabellen | ${graph.stats.tables} |`,
    `| Violations | ${graph.stats.violations} |`,
    '',
    '## Knoten nach Typ',
    '',
    '| Typ | Anzahl |',
    '|-----|--------|',
    ...Object.entries(byType).sort((a, b) => b[1] - a[1]).map(([t, c]) => `| ${t} | ${c} |`),
    '',
    '## Kanten nach Typ',
    '',
    '| Typ | Anzahl |',
    '|-----|--------|',
    ...Object.entries(byEdge).sort((a, b) => b[1] - a[1]).map(([t, c]) => `| ${t} | ${c} |`),
    '',
    '## Governance',
    '',
    '- Constitution: aus `HUI_CONSTITUTION.md` geparst',
    '- ADRs: aus Quellcode-Kommentaren extrahiert',
    '- RFC-000: Layer-Regeln aus `domains.js`',
    '- Domain Charters: automatisch aus `domains.js`',
    '',
    '## API',
    '',
    'Der Graph ist über `src/architecture/knowledge-graph/api.js` abrufbar:',
    '',
    '```javascript',
    'import { buildGraph, getNode, query, getImpact } from "./knowledge-graph";',
    'const graph = await buildGraph();',
    'getOwner(graph, "profiles");',
    'getImpact(graph, "AppStateContext");',
    '```',
  ].join('\n');
}

export function generateDependencyReport(graph, queryEngine) {
  const topImported = [...(graph.importGraph || [])]
    .map(([path, importers]) => ({ path, count: importers.size }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 30);

  return [
    '# HUI Dependency Report',
    '',
    HEADER,
    '## Meistimportierte Dateien',
    '',
    '| Datei | Importiert von |',
    '|-------|----------------|',
    ...topImported.map(({ path, count }) => `| \`${path}\` | ${count} |`),
    '',
    '## Cross-Domain Dependencies',
    '',
    ...generateCrossDomainSection(graph),
  ].join('\n');
}

function generateCrossDomainSection(graph) {
  const cross = new Map();
  for (const edge of graph.edges) {
    if (edge.type !== 'IMPORTS') continue;
    const src = graph.nodes.get(edge.source);
    const tgt = graph.nodes.get(edge.target);
    if (!src?.domain || !tgt?.domain || src.domain === tgt.domain) continue;
    const key = `${src.domain} → ${tgt.domain}`;
    cross.set(key, (cross.get(key) || 0) + 1);
  }
  return [...cross.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([k, c]) => `- **${k}**: ${c} Imports`);
}

export function generateOwnershipReport(graph, queryEngine) {
  const tables = [...graph.nodes.values()].filter(n => n.type === NODE_TYPES.SUPABASE_TABLE);

  return [
    '# HUI Ownership Report',
    '',
    HEADER,
    '## Tabellen-Ownership',
    '',
    '| Tabelle | Writers | Owner |',
    '|---------|---------|-------|',
    ...tables.slice(0, 50).map(t => {
      const writers = graph.tableWriters?.get(t.name);
      const owner = queryEngine.getOwner(t.name);
      const ownerName = Array.isArray(owner)
        ? owner.map(o => o?.name || o?.path).join(', ')
        : owner?.name || '—';
      return `| \`${t.name}\` | ${writers?.size || 0} | ${ownerName} |`;
    }),
  ].join('\n');
}

export function generateImpactReport(graph, queryEngine, impactSimulator) {
  const targets = ['AppStateContext', 'AuthContext', 'bookingContext', 'db', 'HuiRegistry', 'coreEngine'];
  const sections = targets.map(target => {
    const impact = queryEngine.getImpact(target, 5);
    if (!impact.source && impact.total === 0) return `### ${target}\n\nNicht im Graphen gefunden.\n`;
    return [
      `### ${target}`,
      '',
      `- Direkt betroffen: ${impact.direct.length}`,
      `- Indirekt betroffen: ${impact.indirect.length}`,
      `- Gesamt: ${impact.total}`,
      '',
      impact.indirect.slice(0, 10).map(n => `- \`${n.path || n.name}\``).join('\n'),
      '',
    ].join('\n');
  });

  return ['# HUI Impact Report', '', HEADER, ...sections].join('\n');
}

export function generateServiceReport(graph) {
  const services = [...graph.nodes.values()].filter(n => n.type === NODE_TYPES.SERVICE);
  return [
    '# HUI Service Report',
    '',
    HEADER,
    `**Services gefunden:** ${services.length}`,
    '',
    ...services.map(s => {
      const consumers = graph.edges.filter(e => e.target === s.id && e.type === 'USES_SERVICE');
      return `### ${s.name}\n\n- Datei: \`${s.file}\`\n- Consumer: ${consumers.length}\n`;
    }),
  ].join('\n');
}

export function generateCoreReport(graph) {
  const coreUsers = graph.edges.filter(e => e.type === 'USES_CORE');
  const engineUsers = graph.edges.filter(e => e.type === 'USES_ENGINE');
  return [
    '# HUI Core Engine Report',
    '',
    HEADER,
    `**Core Engine Nutzer:** ${new Set(coreUsers.map(e => e.source)).size} Dateien`,
    `**Engine Nutzer gesamt:** ${new Set(engineUsers.map(e => e.source)).size} Dateien`,
    '',
    '## Engines',
    '',
    ...[...graph.nodes.values()].filter(n => n.type === NODE_TYPES.ENGINE)
      .map(e => `- **${e.name}** (\`${e.file}\`)`),
  ].join('\n');
}

export function generateRegistryReport(graph) {
  const consumers = graph.edges.filter(e => e.type === 'USES_REGISTRY');
  const byDomain = new Map();
  for (const e of consumers) {
    const file = graph.nodes.get(e.source);
    if (file?.domain) byDomain.set(file.domain, (byDomain.get(file.domain) || 0) + 1);
  }
  return [
    '# HUI Registry Report',
    '',
    HEADER,
    `**Registry Consumer:** ${consumers.length} Dateien`,
    '',
    '## Nach Domain',
    '',
    ...[...byDomain.entries()].sort((a, b) => b[1] - a[1])
      .map(([d, c]) => `- **${d}**: ${c}`),
  ].join('\n');
}

export function generateDomainReport(graph) {
  const byDomain = new Map();
  for (const node of graph.nodes.values()) {
    if (!node.domain) continue;
    if (!byDomain.has(node.domain)) byDomain.set(node.domain, { files: 0, violations: 0 });
    if (node.type === NODE_TYPES.FILE) byDomain.get(node.domain).files++;
  }
  for (const v of graph.violations || []) {
    if (byDomain.has(v.domain)) byDomain.get(v.domain).violations++;
  }

  return [
    '# HUI Domain Report',
    '',
    HEADER,
    '| Domain | Dateien | Violations |',
    '|--------|---------|------------|',
    ...[...byDomain.entries()].map(([d, s]) => `| ${d} | ${s.files} | ${s.violations} |`),
  ].join('\n');
}

export function generateViolationReport(graph) {
  const bySeverity = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, INFO: 0 };
  const byType = {};
  for (const v of graph.violations || []) {
    bySeverity[v.severity] = (bySeverity[v.severity] || 0) + 1;
    byType[v.type] = (byType[v.type] || 0) + 1;
  }

  return [
    '# HUI Violation Report (Knowledge Graph)',
    '',
    HEADER,
    '## Nach Severity',
    '',
    ...Object.entries(bySeverity).map(([s, c]) => `- **${s}**: ${c}`),
    '',
    '## Nach Typ',
    '',
    ...Object.entries(byType).sort((a, b) => b[1] - a[1]).map(([t, c]) => `- **${t}**: ${c}`),
    '',
    '## Top Violations',
    '',
    ...(graph.violations || []).slice(0, 20).map(v =>
      `- [${v.severity}] \`${v.file}:${v.line}\` — ${v.message}`
    ),
  ].join('\n');
}

export function generateMigrationReport(graph, queryEngine) {
  const migrations = [...graph.nodes.values()].filter(n => n.type === NODE_TYPES.MIGRATION);
  return [
    '# HUI Migration Report',
    '',
    HEADER,
    `**Migrationen:** ${migrations.length}`,
    '',
    ...migrations.slice(0, 20).map(m =>
      `### ${m.name}\n\n- Pfad: \`${m.path}\`\n- Tabellen: ${(m.tables || []).join(', ') || '—'}\n`
    ),
  ].join('\n');
}

export function generateRefactoringReport(graph, impactSimulator) {
  const scenarios = [
    { target: 'AppStateContext', action: 'remove' },
    { target: 'bookingContext', action: 'modify' },
    { target: 'notifications', action: 'remove' },
    { target: 'HuiRegistry', action: 'modify' },
  ];

  const sections = scenarios.map(({ target, action }) => {
    const sim = target === 'HuiRegistry'
      ? impactSimulator.simulateRegistryChange()
      : impactSimulator.simulate(target, action);
    if (!sim.success) return `### ${target}\n\n${sim.error}\n`;
    return [
      `### ${target} (${action})`,
      '',
      `- Risiko: **${sim.risk || 'N/A'}**`,
      `- Betroffene Dateien: ${sim.totalAffected ?? sim.totalConsumers ?? 0}`,
      sim.recommendation ? `- Empfehlung: ${sim.recommendation}` : '',
      '',
    ].filter(Boolean).join('\n');
  });

  return ['# HUI Refactoring Report', '', HEADER, ...sections].join('\n');
}

export function generateDeadCodeReport(graph, queryEngine) {
  const deadCandidates = [];
  for (const node of graph.nodes.values()) {
    if (node.type !== NODE_TYPES.FILE) continue;
    const dependents = queryEngine.getDependents(node.path);
    const isEntry = node.path.includes('main') || node.path.includes('App.jsx');
    if (dependents.length === 0 && !isEntry && node.lines > 20) {
      deadCandidates.push(node);
    }
  }

  return [
    '# HUI Dead Code Report',
    '',
    HEADER,
    `**Potentiell ungenutzte Dateien:** ${deadCandidates.length}`,
    '',
    '> Heuristik: Keine eingehenden IMPORTS-Kanten und >20 Zeilen.',
    '',
    ...deadCandidates.slice(0, 30).map(n => `- \`${n.path}\` (${n.lines} Zeilen, ${n.domain})`),
  ].join('\n');
}

export function generateCircularDependencyReport(queryEngine) {
  const cycles = queryEngine.findCircularDependencies();
  return [
    '# HUI Circular Dependency Report',
    '',
    HEADER,
    `**Zyklen gefunden:** ${cycles.length}`,
    '',
    ...cycles.slice(0, 10).map((cycle, i) =>
      `### Zyklus ${i + 1}\n\n${cycle.map(p => `- \`${p}\``).join('\n')}\n`
    ),
  ].join('\n');
}
