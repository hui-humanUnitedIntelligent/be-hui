#!/usr/bin/env node
// src/architecture/intelligence/cli.js
// ══════════════════════════════════════════════════════════════════════════════
// HUI Architecture Intelligence CLI — ARCH-003
//
// Verwendung:
//   npm run architecture:intelligence              → Vollständige Analyse + Reports
//   npm run architecture:intelligence -- --mode=audit   → CI Audit (blockiert bei CRITICAL)
//   npm run architecture:intelligence -- --explain=node --target=pages/Home.jsx
//   npm run architecture:intelligence -- --validate=constitution
//   npm run architecture:intelligence -- --health
// ══════════════════════════════════════════════════════════════════════════════

import { join, resolve, dirname } from 'path';
import { mkdirSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '../../..');
const DOCS_OUT = join(PROJECT_ROOT, 'docs', 'generated');

const args = process.argv.slice(2);
const MODE = getArg('mode', 'all');
const FAIL_ON_HIGH = args.includes('--fail-on-high');
const QUIET = args.includes('--quiet');
const EXPLAIN_TYPE = getArg('explain');
const EXPLAIN_TARGET = getArg('target');
const VALIDATE_SCOPE = getArg('validate');
const SIMULATE_TYPE = getArg('simulate');
const SIMULATE_FILE = getArg('file');

function getArg(name, defaultVal = null) {
  const eq = args.find(a => a.startsWith(`--${name}=`));
  if (eq) return eq.split('=').slice(1).join('=');
  return defaultVal;
}

function log(...msg) { if (!QUIET) console.log(...msg); }
function err(...msg) { console.error(...msg); }

async function main() {
  log('');
  log('╔════════════════════════════════════════════════════╗');
  log('║   HUI Architecture Intelligence — ARCH-003         ║');
  log('╚════════════════════════════════════════════════════╝');
  log('');

  const {
    analyzeArchitecture, explainApi, validateApi, simulateApi,
    getArchitectureHealth, generateAllReports, getRecommendationsApi,
  } = await import('./index.js');

  log('⟳ Architecture Scan + Knowledge Graph + Semantic Layer...');
  const scan = await analyzeArchitecture({ force: true });
  log(`  → ${scan.metrics.totalFiles} Dateien, ${scan.metrics.totalViolations} Violations`);
  log(`  → Graph: ${scan.graph.nodes.length} Nodes, ${scan.graph.edges.length} Edges`);
  log(`  → Semantic Layer: ${scan.semantics.size} Dateien angereichert`);
  log('');

  // ── Explain Mode ──────────────────────────────────────────────────────────
  if (EXPLAIN_TYPE) {
    const result = await explainApi({ type: EXPLAIN_TYPE, target: EXPLAIN_TARGET }, scan);
    console.log(JSON.stringify(result, null, 2));
    process.exit(0);
  }

  // ── Validate Mode ─────────────────────────────────────────────────────────
  if (VALIDATE_SCOPE) {
    const result = await validateApi({ scope: VALIDATE_SCOPE }, scan);
    console.log(JSON.stringify(result, null, 2));
    const exitCode = VALIDATE_SCOPE === 'constitution' && !result.valid ? 1 : 0;
    process.exit(exitCode);
  }

  // ── Simulate Mode ─────────────────────────────────────────────────────────
  if (SIMULATE_TYPE && SIMULATE_FILE) {
    const result = await simulateApi({ type: SIMULATE_TYPE, file: SIMULATE_FILE }, scan);
    console.log(JSON.stringify(result, null, 2));
    process.exit(0);
  }

  // ── Health Mode ───────────────────────────────────────────────────────────
  if (args.includes('--health')) {
    const health = await getArchitectureHealth(scan);
    log('Architecture Health:');
    log(`  Score: ${health.score}/100 (${health.grade})`);
    log(`  Block Merge: ${health.blockMerge ? 'YES' : 'NO'}`);
    process.exit(health.blockMerge ? 1 : 0);
  }

  // ── Metrics Display ───────────────────────────────────────────────────────
  log('┌─────────────────────────────────────────────────────┐');
  log(`│  Health Score:     ${String((await getArchitectureHealth(scan)).score).padStart(6)}/100                   │`);
  log(`│  Dateien:          ${String(scan.metrics.totalFiles).padStart(6)}                        │`);
  log(`│  Violations:       ${String(scan.metrics.totalViolations).padStart(6)} (CRIT: ${scan.metrics.criticalViolations}, HIGH: ${scan.metrics.highViolations})  │`);
  log(`│  Graph Nodes:      ${String(scan.graph.nodes.length).padStart(6)}                        │`);
  log(`│  ADRs:             ${String(scan.governance.adrs.length).padStart(6)}                        │`);
  log(`│  RFCs:             ${String(scan.governance.rfcs.length).padStart(6)}                        │`);
  log('└─────────────────────────────────────────────────────┘');
  log('');

  if (MODE === 'audit') {
    const exitCode = scan.metrics.criticalViolations > 0 ? 1
      : (FAIL_ON_HIGH && scan.metrics.highViolations > 0 ? 1 : 0);
    log(exitCode === 0 ? '✅ Intelligence Audit bestanden' : '❌ Intelligence Audit fehlgeschlagen');
    process.exit(exitCode);
  }

  // ── Generate Reports ──────────────────────────────────────────────────────
  if (MODE === 'report' || MODE === 'all') {
    log('⟳ Intelligence Reports generieren...');
    mkdirSync(DOCS_OUT, { recursive: true });

    const reports = generateAllReports(scan);
    for (const [name, content] of Object.entries(reports)) {
      const filename = `intelligence-${name}.md`;
      writeFileSync(join(DOCS_OUT, filename), content, 'utf8');
      log(`  → docs/generated/${filename}`);
    }

    const recommendations = await getRecommendationsApi({ minSeverity: 'HIGH', limit: 20 }, scan);
    writeFileSync(
      join(DOCS_OUT, 'intelligence-recommendations.json'),
      JSON.stringify(recommendations, null, 2),
      'utf8'
    );
    log('  → docs/generated/intelligence-recommendations.json');

    writeFileSync(
      join(DOCS_OUT, 'intelligence-health.json'),
      JSON.stringify(await getArchitectureHealth(scan), null, 2),
      'utf8'
    );
    log('  → docs/generated/intelligence-health.json');

    // Update metrics.json with ARCH-003 version
    writeFileSync(join(DOCS_OUT, 'metrics.json'), JSON.stringify(scan.metrics, null, 2), 'utf8');
    log('  → docs/generated/metrics.json (ARCH-003)');
  }

  log('');
  log('✅ Architecture Intelligence abgeschlossen.');

  if (scan.metrics.criticalViolations > 0) {
    err('❌ CRITICAL violations — Exit 1');
    process.exit(1);
  }
  if (FAIL_ON_HIGH && scan.metrics.highViolations > 0) {
    err('❌ HIGH violations (--fail-on-high) — Exit 1');
    process.exit(1);
  }

  process.exit(0);
}

main().catch(e => {
  console.error('Intelligence-Fehler:', e);
  process.exit(1);
});
