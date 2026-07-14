// src/guardian/index.js
// ══════════════════════════════════════════════════════════════════════════════
// HUI Release Guardian — GUARD-001
//
// Automatische Überprüfung der Definition of Done gemäß HUI Engineering
// Constitution. Analysiert und berichtet — verändert keinen Code.
//
// Grundlage: HUI_CONSTITUTION.md
// ══════════════════════════════════════════════════════════════════════════════

import { gatherContext } from './context.js';
import { runGitChecks } from './checks/git.js';
import { runBuildChecks } from './checks/build.js';
import { runDeploymentChecks } from './checks/deployment.js';
import { runRepositoryChecks } from './checks/repository.js';
import { runRuntimeChecks } from './checks/runtime.js';
import { buildReport } from './report.js';

export { gatherContext } from './context.js';
export { buildReport, formatTextReport, formatMarkdownReport } from './report.js';
export { GUARDIAN_VERSION, CONSTITUTION_REF } from './types.js';

/**
 * @param {string} projectRoot
 * @param {{ baseBranch?: string, skipBuild?: boolean }} [options]
 * @returns {Promise<import('./types.js').GuardianReport>}
 */
export async function runGuardian(projectRoot, options = {}) {
  const ctx = gatherContext(projectRoot, options);

  const [gitChecks, deploymentChecks, repositoryChecks] = await Promise.all([
    runGitChecks(ctx),
    runDeploymentChecks(ctx),
    runRepositoryChecks(ctx),
  ]);

  // Build muss vor Runtime-Checks abgeschlossen sein (dist/ erforderlich)
  const buildChecks = await runBuildChecks(ctx);
  const runtimeChecks = await runRuntimeChecks(ctx);

  const allChecks = [
    ...gitChecks,
    ...buildChecks,
    ...deploymentChecks,
    ...repositoryChecks,
    ...runtimeChecks,
  ];

  return buildReport(allChecks, ctx);
}
