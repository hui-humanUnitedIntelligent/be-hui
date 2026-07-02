#!/usr/bin/env node
// ARCH-006.1 — Governance Validation CLI

import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { runGovernanceValidation } from './governanceValidator.js';
import { writeAllReports } from './reportWriter.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '../../../..');

async function main() {
  const quiet = process.argv.includes('--quiet');

  if (!quiet) {
    console.log('');
    console.log('╔════════════════════════════════════════════════════╗');
    console.log('║   ARCH-006.1 — Governance Validation               ║');
    console.log('╚════════════════════════════════════════════════════╝');
    console.log('');
  }

  const validation = runGovernanceValidation({ srcRoot: resolve(PROJECT_ROOT, 'src') });
  const written = writeAllReports(validation);

  if (!quiet) {
    console.log(`Rules:       ${validation.meta.ruleCount}`);
    console.log(`Violations:  ${validation.meta.violationCount}`);
    console.log(`CRITICAL:    ${validation.violationValidation.bySeverity.CRITICAL}`);
    console.log(`UNKNOWN:     ${validation.contractCoverage.unknown} files`);
    console.log(`Duration:    ${validation.performance.timings.totalMs}ms`);
    console.log('');
    console.log('Reports:');
    for (const f of written.md) console.log(`  → docs/generated/${f}`);
    for (const f of written.json) console.log(`  → docs/generated/${f}`);
    console.log('');
    console.log(`Policy Engine: ${validation.policyEngineAudit.overallStatus}`);
    console.log(`Consistency:   ${validation.governanceConsistency.criticalBreaks} critical breaks`);
    console.log('');
    console.log('✅ ARCH-006.1 Validation abgeschlossen');
  }

  process.exit(0);
}

main().catch(e => {
  console.error('Validation Fehler:', e);
  process.exit(1);
});
