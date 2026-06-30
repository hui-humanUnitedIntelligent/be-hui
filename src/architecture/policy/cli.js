#!/usr/bin/env node
// src/architecture/policy/cli.js
// ══════════════════════════════════════════════════════════════════════════════
// ARCH-006 — Policy Engine CLI
//
// npm run architecture:policy
// npm run architecture:policy:report
// npm run architecture:policy:health
// npm run architecture:policy:contracts
// npm run architecture:policy:audit
// ══════════════════════════════════════════════════════════════════════════════

import { join, resolve, dirname } from 'path';
import { mkdirSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '../../..');
const DOCS_OUT = join(PROJECT_ROOT, 'docs', 'generated');

const args = process.argv.slice(2);
const MODE = args.find(a => a.startsWith('--mode='))?.split('=')[1]
  || process.env.POLICY_MODE
  || 'all';
const QUIET = args.includes('--quiet');

function log(...msg) { if (!QUIET) console.log(...msg); }
function err(...msg) { console.error(...msg); }

async function main() {
  const {
    initializePolicyEngine,
    evaluateRepository,
    loadContracts,
    compilePolicies,
    compileRules,
  } = await import('./api.js');
  const {
    generateAllPolicyReports,
    serializePolicyJson,
  } = await import('./reports/reportGenerator.js');

  log('');
  log('╔════════════════════════════════════════════════════╗');
  log('║   HUI Domain Policy Engine — ARCH-006              ║');
  log('╚════════════════════════════════════════════════════╝');
  log('');
  log(`Mode: ${MODE}`);
  log('');

  initializePolicyEngine({ force: true });

  if (MODE === 'contracts') {
    const contracts = loadContracts();
    const policies = compilePolicies();
    const rules = compileRules();
    log(`Contracts: ${contracts.domains.length}`);
    log(`Policies:  ${policies.length}`);
    log(`Rules:     ${rules.length}`);
    for (const d of contracts.domains) {
      log(`  ${d.id}: ${d.label} (${d.fileCount} files, ${(d.scannerRules||[]).length} scanner rules)`);
    }
    process.exit(0);
    return;
  }

  log('⟳ Policy-Evaluation...');
  const evaluation = {
    ...evaluateRepository(join(PROJECT_ROOT, 'src')),
    contracts: loadContracts(),
    policies: compilePolicies(),
    rules: compileRules(),
  };

  const critical = evaluation.violations.filter(v => v.severity === 'CRITICAL');
  const blocking = evaluation.violations.filter(v =>
    v.severity === 'CRITICAL' ||
    ['CONTRACT_VIOLATION', 'CROSS_DOMAIN_WRITE', 'OWNERSHIP_VIOLATION'].includes(v.type)
  );

  log(`  → ${evaluation.violations.length} Violations (${critical.length} CRITICAL)`);
  log(`  → Domain Health: ${evaluation.domainHealth?.overall?.score ?? 0}%`);
  log(`  → Policy Compliance: ${evaluation.policyHealth?.compliancePct ?? 0}%`);

  if (MODE === 'audit' || MODE === 'health') {
    if (critical.length > 0) {
      err('');
      err('🔴 CRITICAL VIOLATIONS:');
      for (const v of critical.slice(0, 10)) {
        err(`   [${v.domainId}] ${v.file}:${v.line} — ${v.message}`);
      }
    }
    const exitCode = blocking.length > 0 ? 1 : 0;
    log('');
    log(exitCode === 0 ? '✅ Policy Audit bestanden' : '❌ Policy Audit fehlgeschlagen — Merge blockiert');
    process.exit(exitCode);
    return;
  }

  log('');
  log('⟳ Reports generieren...');
  mkdirSync(DOCS_OUT, { recursive: true });

  const reports = generateAllPolicyReports(evaluation);
  for (const [filename, content] of Object.entries(reports)) {
    writeFileSync(join(DOCS_OUT, filename), content, 'utf8');
    log(`  → docs/generated/${filename}`);
  }

  const json = serializePolicyJson(evaluation);
  for (const [filename, content] of Object.entries(json)) {
    writeFileSync(join(DOCS_OUT, filename), content, 'utf8');
    log(`  → docs/generated/${filename}`);
  }

  log('');
  log(`✅ Abgeschlossen. Output: docs/generated/`);

  if (blocking.length > 0) {
    err('❌ Blocking violations — Exit 1');
    process.exit(1);
  }
  process.exit(0);
}

main().catch(e => {
  console.error('Policy Engine Fehler:', e);
  process.exit(1);
});
