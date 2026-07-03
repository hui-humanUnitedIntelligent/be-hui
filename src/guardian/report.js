// src/guardian/report.js
// Strukturierter Report-Generator für den HUI Release Guardian
import {
  GUARDIAN_VERSION,
  CONSTITUTION_REF,
  SUMMARY_CHECK_IDS,
} from './types.js';

/**
 * @param {import('./types.js').CheckResult[]} checks
 * @param {Record<string, unknown>} context
 * @returns {import('./types.js').GuardianReport}
 */
export function buildReport(checks, context) {
  const summaryChecks = {};
  for (const [key, id] of Object.entries(SUMMARY_CHECK_IDS)) {
    const check = checks.find(c => c.id === id);
    if (check) summaryChecks[key] = check;
  }

  const allRequiredVerified = Object.values(SUMMARY_CHECK_IDS)
    .map(id => checks.find(c => c.id === id))
    .filter(Boolean)
    .every(c => c.verified);

  const hasImplementation = context.changedFiles?.length > 0
    || context.commit !== 'unknown';

  const statusFlags = [];
  if (hasImplementation) statusFlags.push('IMPLEMENTIERT');
  if (allRequiredVerified) statusFlags.push('VERIFIZIERT');
  if (!allRequiredVerified) statusFlags.push('NICHT VERIFIZIERT');

  const primaryStatus = allRequiredVerified
    ? 'VERIFIZIERT'
    : hasImplementation
      ? 'NICHT VERIFIZIERT'
      : 'NICHT VERIFIZIERT';

  const ergebnis = allRequiredVerified
    ? 'Diese Änderung erfüllt die Definition of Done der HUI Engineering Constitution.'
    : 'Diese Änderung darf noch nicht als abgeschlossen bezeichnet werden.';

  return {
    version: GUARDIAN_VERSION,
    timestamp: new Date().toISOString(),
    constitutionRef: CONSTITUTION_REF,
    primaryStatus,
    statusFlags,
    checks,
    summaryChecks,
    ergebnis,
    context: {
      branch: context.branch,
      commit: context.shortCommit,
      baseBranch: context.baseBranch,
      event: context.github?.eventName,
      changedFiles: context.changedFiles?.length ?? 0,
      newFiles: context.newFiles?.length ?? 0,
    },
  };
}

/**
 * @param {import('./types.js').GuardianReport} report
 * @returns {string}
 */
export function formatTextReport(report) {
  const lines = [];

  lines.push('════════════════════════════════════════════════════════');
  lines.push('  HUI RELEASE GUARDIAN — GUARD-001 v' + report.version);
  lines.push('  Grundlage: ' + report.constitutionRef);
  lines.push('  ' + report.timestamp);
  lines.push('════════════════════════════════════════════════════════');
  lines.push('');

  lines.push('STATUS');
  for (const flag of report.statusFlags) {
    lines.push(flag);
  }
  lines.push('');

  lines.push('CHECKS');
  const summaryLabels = {
    build: 'Build',
    pr: 'PR',
    merge: 'Merge',
    bundle: 'Bundle',
    dom: 'DOM',
    runtime: 'Runtime',
  };
  for (const [key, label] of Object.entries(summaryLabels)) {
    const check = report.summaryChecks[key];
    const icon = check?.verified ? '✅' : (check?.status === 'not_verified' ? '⚠️' : '❌');
    lines.push(`${icon} ${label}`);
  }
  lines.push('');

  lines.push('DETAILLIERTE PRÜFUNGEN');
  lines.push('');

  const categories = {
    git: 'Git',
    build: 'Build',
    deployment: 'Deployment',
    repository: 'Repository',
    runtime: 'Runtime',
  };

  for (const [cat, label] of Object.entries(categories)) {
    const catChecks = report.checks.filter(c => c.category === cat);
    if (catChecks.length === 0) continue;

    lines.push(`── ${label} ──`);
    for (const check of catChecks) {
      const icon = check.verified ? '✅' : (check.status === 'not_verified' ? '⚠️' : '❌');
      lines.push(`  ${icon} ${check.label}`);
      for (const fact of check.facts) {
        lines.push(`     ${fact}`);
      }
    }
    lines.push('');
  }

  lines.push('ERGEBNIS');
  lines.push(report.ergebnis);
  lines.push('');

  lines.push('────────────────────────────────────────────────────────');
  lines.push(`Branch: ${report.context.branch} | Commit: ${report.context.commit}`);
  lines.push(`Basis: ${report.context.baseBranch} | Event: ${report.context.event}`);
  lines.push(`Geänderte Dateien: ${report.context.changedFiles} | Neue: ${report.context.newFiles}`);
  lines.push('────────────────────────────────────────────────────────');

  return lines.join('\n');
}

/**
 * @param {import('./types.js').GuardianReport} report
 * @returns {string}
 */
export function formatMarkdownReport(report) {
  const lines = [];

  lines.push('# HUI Release Guardian Report');
  lines.push('');
  lines.push(`> **GUARD-001 v${report.version}** — Automatisch generiert`);
  lines.push(`> **Grundlage:** [\`${report.constitutionRef}\`](../${report.constitutionRef})`);
  lines.push(`> **Datum:** ${report.timestamp}`);
  lines.push('');
  lines.push('⚠️ Diese Datei ist autogeneriert. Änderungen werden beim nächsten Guardian-Lauf überschrieben.');
  lines.push('');

  lines.push('## STATUS');
  lines.push('');
  for (const flag of report.statusFlags) {
    lines.push(`- **${flag}**`);
  }
  lines.push('');

  lines.push('## CHECKS');
  lines.push('');
  lines.push('| Check | Status |');
  lines.push('|---|---|');
  const summaryLabels = { build: 'Build', pr: 'PR', merge: 'Merge', bundle: 'Bundle', dom: 'DOM', runtime: 'Runtime' };
  for (const [key, label] of Object.entries(summaryLabels)) {
    const check = report.summaryChecks[key];
    const icon = check?.verified ? '✅' : (check?.status === 'not_verified' ? '⚠️' : '❌');
    lines.push(`| ${label} | ${icon} ${check?.status || '—'} |`);
  }
  lines.push('');

  lines.push('## Detaillierte Prüfungen');
  lines.push('');

  const categories = { git: 'Git', build: 'Build', deployment: 'Deployment', repository: 'Repository', runtime: 'Runtime' };
  for (const [cat, label] of Object.entries(categories)) {
    const catChecks = report.checks.filter(c => c.category === cat);
    if (catChecks.length === 0) continue;

    lines.push(`### ${label}`);
    lines.push('');
    for (const check of catChecks) {
      const icon = check.verified ? '✅' : (check.status === 'not_verified' ? '⚠️' : '❌');
      lines.push(`#### ${icon} ${check.label}`);
      lines.push('');
      for (const fact of check.facts) {
        lines.push(`- ${fact}`);
      }
      lines.push('');
    }
  }

  lines.push('## ERGEBNIS');
  lines.push('');
  lines.push(report.ergebnis);
  lines.push('');

  lines.push('## Kontext');
  lines.push('');
  lines.push('| Feld | Wert |');
  lines.push('|---|---|');
  lines.push(`| Branch | \`${report.context.branch}\` |`);
  lines.push(`| Commit | \`${report.context.commit}\` |`);
  lines.push(`| Basis-Branch | \`${report.context.baseBranch}\` |`);
  lines.push(`| Event | ${report.context.event} |`);
  lines.push(`| Geänderte Dateien | ${report.context.changedFiles} |`);
  lines.push(`| Neue Dateien | ${report.context.newFiles} |`);
  lines.push('');

  return lines.join('\n');
}
