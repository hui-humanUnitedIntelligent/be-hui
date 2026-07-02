#!/usr/bin/env node
// src/architecture/authority/cli.js
// ══════════════════════════════════════════════════════════════════════════════
// HUI Architecture Authority CLI — ARCH-004
//
// Verwendung:
//   node src/architecture/authority/cli.js [--mode=validate|report|health|graph|ci|all]
//   npm run architecture:authority
//   npm run architecture:authority:ci
//
// Flags:
//   --mode=validate   Authority Self-Check + Module Compliance
//   --mode=report     Alle Reports generieren
//   --mode=health     Governance Health anzeigen
//   --mode=graph      Authority Graph ausgeben
//   --mode=ci         CI-Checks (Exit 1 bei Fehler)
//   --mode=all        Alles (Standard)
//   --fail-on-warn    Exit 1 bei Warnings
//   --quiet           Minimale Ausgabe
// ══════════════════════════════════════════════════════════════════════════════

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const args = process.argv.slice(2);
const MODE = (args.find(a => a.startsWith('--mode=')) || '--mode=all').split('=')[1];
const FAIL_ON_WARN = args.includes('--fail-on-warn');
const QUIET = args.includes('--quiet');

function log(...msg) { if (!QUIET) console.log(...msg); }
function err(...msg) { console.error(...msg); }

async function main() {
  log('');
  log('╔════════════════════════════════════════════════════╗');
  log('║   HUI Architecture Authority — ARCH-004            ║');
  log('║   Single Source of Architectural Authority         ║');
  log('╚════════════════════════════════════════════════════╝');
  log('');
  log(`Mode: ${MODE}`);
  log('');

  const {
    getAuthorityState,
    getConstitution,
    getCurrentRules,
    getCurrentADR,
    getCurrentRFC,
    getGovernanceHealth,
    getAuthorityGraph,
  } = await import('./api/authorityApi.js');

  const { validateAuthority, validateModuleCompliance } = await import('./validation/authorityValidator.js');
  const { runCiChecks } = await import('./validation/ciChecks.js');
  const { generateAllReports } = await import('./reports/reportGenerator.js');

  let exitCode = 0;

  if (MODE === 'validate' || MODE === 'all') {
    log('⟳ Authority Validation...');
    const auth = validateAuthority();
    const modules = validateModuleCompliance();
    log(`  Authority valid: ${auth.valid}`);
    log(`  Errors: ${auth.errors.length}, Warnings: ${auth.warnings.length}`);
    log(`  Module violations: ${modules.violations.length}`);
    if (!auth.valid) exitCode = 1;
    if (FAIL_ON_WARN && auth.warnings.length > 0) exitCode = 1;
    for (const e of auth.errors) err(`  ✗ ${e}`);
    for (const w of auth.warnings) log(`  ⚠ ${w}`);
    log('');
  }

  if (MODE === 'health' || MODE === 'all') {
    log('⟳ Governance Health...');
    const health = getGovernanceHealth();
    log(`  Architecture Health: ${health.architectureHealth.score}/100`);
    for (const [key, dim] of Object.entries(health.dimensions)) {
      log(`  ${dim.label}: ${dim.score}/100`);
    }
    log('');
  }

  if (MODE === 'graph' || MODE === 'all') {
    log('⟳ Authority Graph...');
    const graph = getAuthorityGraph();
    log(`  Nodes: ${graph.nodes.length}, Edges: ${graph.edges.length}`);
    if (!QUIET) log(graph.mermaid);
    log('');
  }

  if (MODE === 'report' || MODE === 'all') {
    log('⟳ Generating Reports...');
    const reports = generateAllReports();
    log(`  Generated: ${Object.keys(reports).join(', ')}`);
    log('');
  }

  if (MODE === 'ci' || MODE === 'all') {
    log('⟳ CI Checks...');
    const ci = runCiChecks({ writeReports: true, failOnWarnings: FAIL_ON_WARN });
    for (const c of ci.checks) {
      const icon = c.passed ? '✓' : '✗';
      const warn = c.warning ? ' (warning)' : '';
      log(`  ${icon} ${c.id}: ${c.message}${warn}`);
    }
    if (!ci.passed) exitCode = 1;
    log('');
    log(`CI Result: ${ci.passed ? 'PASSED' : 'FAILED'}`);
    log(`Output: docs/generated/authority/`);
  }

  if (MODE === 'status') {
    const state = getAuthorityState();
    const constitution = getConstitution();
    log('Authority Status:');
    log(`  Constitution: v${constitution?.version} (${constitution?.status})`);
    log(`  Rules: ${getCurrentRules().length} binding`);
    log(`  ADRs: ${getCurrentADR().length}`);
    log(`  RFCs: ${getCurrentRFC().length}`);
    log(`  Domains: ${Object.keys(state.domainRegistry).length}`);
  }

  log('');
  process.exit(exitCode);
}

const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename) {
  main().catch(e => {
    err('Fatal:', e.message);
    process.exit(1);
  });
}
