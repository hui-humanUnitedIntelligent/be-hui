#!/usr/bin/env node
// src/architecture/knowledge-graph/cli.js
// ══════════════════════════════════════════════════════════════════════════════
// HUI Architecture Knowledge Graph CLI — ARCH-002
//
// Verwendung:
//   npm run architecture:graph     → Mermaid + JSON + Reports
//   npm run architecture:query     → Interaktive Query-Beispiele
//
// Flags:
//   --mode=graph|report|json|query|all  (default: all)
//   --query=<question>                    Einzelne Query ausführen
//   --simulate=<target>                   Impact-Simulation
//   --quiet
// ══════════════════════════════════════════════════════════════════════════════

import { join, resolve, dirname } from 'path';
import { mkdirSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '../../..');
const DOCS_OUT = join(PROJECT_ROOT, 'docs', 'generated');

const args = process.argv.slice(2);
const MODE = (args.find(a => a.startsWith('--mode=')) || '--mode=all').split('=')[1];
const QUERY_ARG = args.find(a => a.startsWith('--query='))?.split('=').slice(1).join('=');
const SIMULATE_ARG = args.find(a => a.startsWith('--simulate='))?.split('=')[1];
const QUIET = args.includes('--quiet');

function log(...msg) { if (!QUIET) console.log(...msg); }

async function main() {
  log('');
  log('╔════════════════════════════════════════════════════╗');
  log('║   HUI Architecture Knowledge Graph — ARCH-002      ║');
  log('╚════════════════════════════════════════════════════╝');
  log('');

  const { buildGraph, createGraphAPI } = await import('./api.js');
  const { generateAllMermaidGraphs, generateMermaidReport } = await import('./mermaidGenerator.js');
  const { generateAllReports } = await import('./reportGenerator.js');
  const { exportAllJson } = await import('./jsonExporter.js');

  log('⟳ Knowledge Graph aufbauen...');
  const graph = await buildGraph({ projectRoot: PROJECT_ROOT, cache: false });
  const api = createGraphAPI(graph);

  log(`  → ${graph.stats.nodes} Knoten, ${graph.stats.edges} Kanten`);
  log(`  → ${graph.stats.files} Dateien, ${graph.stats.violations} Violations`);
  log(`  → ${graph.stats.tables} Tabellen, ${graph.stats.domains} Domains`);

  if (QUERY_ARG || SIMULATE_ARG) {
    runInteractiveQuery(api, QUERY_ARG, SIMULATE_ARG);
    return;
  }

  if (MODE === 'query') {
    runDemoQueries(api);
    return;
  }

  mkdirSync(DOCS_OUT, { recursive: true });

  if (MODE === 'json' || MODE === 'all') {
    log('');
    log('⟳ JSON exportieren...');
    const jsonFiles = exportAllJson(graph, graph.queryEngine);
    for (const [filename, data] of Object.entries(jsonFiles)) {
      writeFileSync(join(DOCS_OUT, filename), JSON.stringify(data, null, 2), 'utf8');
      log(`  → docs/generated/${filename}`);
    }
  }

  if (MODE === 'graph' || MODE === 'all') {
    log('');
    log('⟳ Mermaid-Diagramme generieren...');
    const graphs = generateAllMermaidGraphs(graph);
    const mermaidReport = generateMermaidReport(graphs);
    writeFileSync(join(DOCS_OUT, 'knowledge-graph.md'), mermaidReport, 'utf8');
    log('  → docs/generated/knowledge-graph.md');

    for (const [name, content] of Object.entries(graphs)) {
      const extracted = content.replace(/```mermaid\n?/, '').replace(/\n?```$/, '');
      writeFileSync(join(DOCS_OUT, `graph-${name}.mmd`), extracted, 'utf8');
      log(`  → docs/generated/graph-${name}.mmd`);
    }
  }

  if (MODE === 'report' || MODE === 'all') {
    log('');
    log('⟳ Reports generieren...');
    const reports = generateAllReports(graph, graph.queryEngine, graph.impactSimulator);
    for (const [filename, content] of Object.entries(reports)) {
      writeFileSync(join(DOCS_OUT, filename), content, 'utf8');
      log(`  → docs/generated/${filename}`);
    }
  }

  log('');
  log('✅ ARCH-002 Knowledge Graph abgeschlossen.');
  log(`   Output: docs/generated/`);
  process.exit(0);
}

function runInteractiveQuery(api, queryStr, simulateTarget) {
  if (simulateTarget) {
    const result = api.simulate(simulateTarget, 'modify');
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  const queries = {
    'owner:profiles': () => api.whoOwns('profiles'),
    'writes:notifications': () => api.whoWrites('notifications'),
    'consumers:AppStateContext': () => api.getConsumers('AppStateContext'),
    'violations:CORE': () => api.getViolations('CORE'),
    'impact:bookingContext': () => api.getImpact('bookingContext'),
    'registry': () => api.simulate('HuiRegistry', 'modify'),
    'circular': () => api.findCircularDependencies(),
  };

  const fn = queries[queryStr];
  if (fn) {
    console.log(JSON.stringify(fn(), null, 2));
  } else {
    console.log('Verfügbare Queries:', Object.keys(queries).join(', '));
  }
}

function runDemoQueries(api) {
  const demos = [
    ['Wer besitzt "profiles"?', () => api.whoOwns('profiles')],
    ['Welche Dateien schreiben "notifications"?', () => api.whoWrites('notifications')],
    ['Welche Dateien hängen von AppStateContext ab?', () => api.getConsumers('AppStateContext')],
    ['Impact bei bookingContext-Refactoring', () => api.getImpact('bookingContext')],
    ['Services die HuiRegistry nutzen', () => api.getNodesByType('Registry')],
    ['Zirkuläre Abhängigkeiten', () => api.findCircularDependencies()],
  ];

  for (const [question, fn] of demos) {
    log(`\n▸ ${question}`);
    const result = fn();
    if (Array.isArray(result)) {
      log(`  → ${result.length} Ergebnisse`);
      result.slice(0, 5).forEach(r => log(`    - ${r?.path || r?.name || JSON.stringify(r)}`));
    } else if (result?.total !== undefined) {
      log(`  → ${result.total} betroffen`);
    } else {
      log(`  → ${JSON.stringify(result)?.slice(0, 200)}`);
    }
  }
}

main().catch(e => {
  console.error('ARCH-002 Fehler:', e);
  process.exit(1);
});
