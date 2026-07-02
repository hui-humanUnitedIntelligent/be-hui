#!/usr/bin/env node
// src/architecture/scanner/cli.js
// ══════════════════════════════════════════════════════════════════════════════
// HUI Architecture Scanner CLI — ARCH-001
//
// Verwendung:
//   node src/architecture/scanner/cli.js [--mode=audit|report|graph|all]
//   npm run architecture:audit    → Violation-Check (Exit-Code 1 bei CRITICAL)
//   npm run architecture:report   → Vollständige Reports generieren
//   npm run architecture:graph    → Mermaid-Diagramme generieren
//
// Flags:
//   --mode=audit    Nur Violations prüfen (kein Report schreiben)
//   --mode=report   Reports + JSONs generieren
//   --mode=graph    Nur Graphen generieren
//   --mode=semantic Semantic Graph + Reports (ARCH-002.1)
//   --mode=all      Alles generieren (Standard)
//   --fail-on-high  Exit 1 bei HIGH+ Violations (für CI/CD)
//   --quiet         Minimale Ausgabe
// ══════════════════════════════════════════════════════════════════════════════

import { join, resolve } from 'path';
import { mkdirSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '../../..');
const SRC_ROOT = join(PROJECT_ROOT, 'src');
const DOCS_OUT  = join(PROJECT_ROOT, 'docs', 'generated');

// ── Args ──────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const MODE = (args.find(a => a.startsWith('--mode=')) || '--mode=all').split('=')[1];
const FAIL_ON_HIGH = args.includes('--fail-on-high');
const QUIET = args.includes('--quiet');

function log(...msg) { if (!QUIET) console.log(...msg); }
function err(...msg) { console.error(...msg); }

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  log('');
  log('╔════════════════════════════════════════════════════╗');
  log('║   HUI Architecture Scanner — ARCH-002.1            ║');
  log('╚════════════════════════════════════════════════════╝');
  log('');
  log(`Mode: ${MODE} | Fail-on-high: ${FAIL_ON_HIGH}`);
  log(`Source: ${SRC_ROOT}`);
  log(`Output: ${DOCS_OUT}`);
  log('');

  // Dynamic imports (ESM)
  const { collectFiles, scanFile } = await import('./fileScanner.js');
  const { detectViolations } = await import('./violationDetector.js');
  const { calculateMetrics } = await import('./metricsCalculator.js');
  const {
    buildDependencyGraph, buildDomainGraph, buildLayerGraph,
    buildServiceGraph, buildOwnershipGraph,
  } = await import('./graphBuilder.js');
  const {
    generateArchitectureReport, generateOwnershipReport, generateViolationsReport,
    generateActionEngineReport, generateRegistryReport, generateCoreReport,
    generateDependencyGraphReport,
  } = await import('./reportGenerator.js');

  // ── 1. Dateien sammeln ────────────────────────────────────────────────────
  log('⟳ Dateien einlesen...');
  const files = collectFiles(SRC_ROOT);
  log(`  → ${files.length} Dateien gefunden`);

  // ── 2. Dateien scannen ────────────────────────────────────────────────────
  log('⟳ Scanning...');
  const scanResults = new Map();
  let scanned = 0;
  for (const file of files) {
    const result = scanFile(file, SRC_ROOT);
    if (result) {
      scanResults.set(result.path, result);
      scanned++;
    }
    if (scanned % 50 === 0) log(`  → ${scanned}/${files.length}...`);
  }
  log(`  → ${scanned} Dateien gescannt`);

  const allResults = [...scanResults.values()];

  // ── 3. Violations erkennen ────────────────────────────────────────────────
  log('⟳ Violations analysieren...');
  const violations = detectViolations(scanResults);
  log(`  → ${violations.length} Violations gefunden`);

  const critical = violations.filter(v => v.severity === 'CRITICAL');
  const high     = violations.filter(v => v.severity === 'HIGH');

  if (critical.length > 0) {
    err('');
    err('🔴 CRITICAL VIOLATIONS:');
    for (const v of critical.slice(0, 10)) {
      err(`   [${v.file}:${v.line}] ${v.message}`);
    }
  }

  if (high.length > 0 && !QUIET) {
    log('');
    log('🟠 HIGH VIOLATIONS (Top 5):');
    for (const v of high.slice(0, 5)) {
      log(`   [${v.file}:${v.line}] ${v.message}`);
    }
  }

  // ── 4. Metriken berechnen ─────────────────────────────────────────────────
  log('');
  log('⟳ Metriken berechnen...');
  const metrics = calculateMetrics(allResults, violations);

  log('');
  log('┌─────────────────────────────────────────────────────┐');
  log(`│  Dateien:          ${String(metrics.totalFiles).padStart(6)}                        │`);
  log(`│  Zeilen:           ${String(metrics.totalLines).padStart(6)}                        │`);
  log(`│  DB Reads:         ${String(metrics.dbReads).padStart(6)}                        │`);
  log(`│  DB Writes:        ${String(metrics.dbWrites).padStart(6)}                        │`);
  log(`│  Action Engine:    ${String(metrics.actionEnginePct + '%').padStart(6)}                        │`);
  log(`│  Ownership Cover.: ${String(metrics.ownershipCoveragePct + '%').padStart(6)}                        │`);
  log(`│  Violations:       ${String(metrics.totalViolations).padStart(6)} (CRIT: ${metrics.criticalViolations}, HIGH: ${metrics.highViolations})  │`);
  log('└─────────────────────────────────────────────────────┘');

  if (MODE === 'audit') {
    // Nur Violations prüfen — kein Report schreiben
    const exitCode = critical.length > 0 ? 1 : (FAIL_ON_HIGH && high.length > 0 ? 1 : 0);
    log('');
    log(exitCode === 0 ? '✅ Audit bestanden' : '❌ Audit fehlgeschlagen');
    process.exit(exitCode);
    return;
  }

  // ── 5. Output-Verzeichnis ─────────────────────────────────────────────────
  log('');
  log('⟳ Ausgabe generieren...');
  mkdirSync(DOCS_OUT, { recursive: true });

  // ── 6. Reports generieren ─────────────────────────────────────────────────
  if (MODE === 'report' || MODE === 'all') {
    const reports = {
      'architecture-report.md': generateArchitectureReport(metrics, violations, allResults),
      'ownership-report.md':    generateOwnershipReport(allResults, metrics),
      'violations.md':          generateViolationsReport(violations, metrics),
      'action-engine-report.md': generateActionEngineReport(allResults, metrics),
      'registry-report.md':     generateRegistryReport(allResults, metrics),
      'core-report.md':         generateCoreReport(allResults, metrics),
    };

    for (const [filename, content] of Object.entries(reports)) {
      writeFileSync(join(DOCS_OUT, filename), content, 'utf8');
      log(`  → docs/generated/${filename}`);
    }

    // JSON-Dateien
    const json = {
      'violations.json':  JSON.stringify(violations, null, 2),
      'ownership.json':   JSON.stringify(allResults.map(r => ({
        path: r.path, lines: r.lines,
        hasDomain: r.header?.hasDomainTag,
        hasOwner: r.header?.hasOwnerTag,
        domain: r.header?.domain,
        owner: r.header?.owner,
      })), null, 2),
      'dependency.json':  JSON.stringify(
        allResults.map(r => ({
          path: r.path,
          imports: r.imports?.filter(i => i.type === 'relative').map(i => i.source),
          exports: r.exports?.map(e => e.name),
        })), null, 2),
      'domains.json':     JSON.stringify(metrics.byDomain, null, 2),
      'metrics.json':     JSON.stringify(metrics, null, 2),
    };

    for (const [filename, content] of Object.entries(json)) {
      writeFileSync(join(DOCS_OUT, filename), content, 'utf8');
      log(`  → docs/generated/${filename}`);
    }
  }

  // ── Semantic graph (ARCH-002.1) ───────────────────────────────────────────
  if (MODE === 'semantic' || MODE === 'all') {
    const { runScan } = await import('../runScan.js');
    const scan = await runScan(SRC_ROOT, { projectRoot: PROJECT_ROOT });

    writeFileSync(join(DOCS_OUT, 'graph.json'), JSON.stringify(scan.graphJSON, null, 2), 'utf8');
    log(`  → docs/generated/graph.json (${scan.graphJSON.nodeCount} nodes)`);

    if (scan.semanticGraphReport) {
      writeFileSync(join(DOCS_OUT, 'semantic-graph.md'), scan.semanticGraphReport, 'utf8');
      log('  → docs/generated/semantic-graph.md');
    }

    if (scan.semanticReports) {
      for (const [filename, content] of Object.entries(scan.semanticReports)) {
        writeFileSync(join(DOCS_OUT, filename), content, 'utf8');
        log(`  → docs/generated/${filename}`);
      }
    }

    // Sample explain output for documentation
    const samples = {
      bookingContext: scan.whyDoesThisExist('lib/bookingContext.js'),
      huiRegistry: scan.whyDoesThisExist('registry/HuiRegistry.js'),
      discoveryProtection: scan.whatProtects('Discovery'),
    };
    writeFileSync(join(DOCS_OUT, 'explain-samples.json'), JSON.stringify(samples, null, 2), 'utf8');
    log('  → docs/generated/explain-samples.json');
  }

  // ── 7. Graphen generieren ─────────────────────────────────────────────────
  if (MODE === 'graph' || MODE === 'all') {
    const graphs = {
      dependency: buildDependencyGraph(allResults),
      domain:     buildDomainGraph(allResults, violations),
      layer:      buildLayerGraph(allResults),
      service:    buildServiceGraph(allResults),
      ownership:  buildOwnershipGraph(allResults),
    };

    const graphReport = generateDependencyGraphReport(graphs);
    writeFileSync(join(DOCS_OUT, 'dependency-graph.md'), graphReport, 'utf8');
    log(`  → docs/generated/dependency-graph.md`);
  }

  // ── 8. Fertig ─────────────────────────────────────────────────────────────
  log('');
  log(`✅ Abgeschlossen. Output: docs/generated/`);

  if (MODE === 'semantic') {
    log('');
    log('✅ Semantic scan abgeschlossen.');
    process.exit(0);
    return;
  }

  // Exit-Code für CI/CD
  if (critical.length > 0) {
    err('❌ CRITICAL violations vorhanden — Exit 1');
    process.exit(1);
  }
  if (FAIL_ON_HIGH && high.length > 0) {
    err('❌ HIGH violations vorhanden (--fail-on-high) — Exit 1');
    process.exit(1);
  }

  process.exit(0);
}

main().catch(e => {
  console.error('Scanner-Fehler:', e);
  process.exit(1);
});
