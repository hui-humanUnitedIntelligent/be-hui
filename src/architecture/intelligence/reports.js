// src/architecture/intelligence/reports.js
// ══════════════════════════════════════════════════════════════════════════════
// Intelligence Reports — ARCH-003
// Generiert alle Report-Typen als Markdown und JSON.
// ══════════════════════════════════════════════════════════════════════════════

import { explainArchitecture } from './explain.js';
import { validateConstitution, validateAdrs, validateRfcs } from './validate.js';
import { getRecommendations } from './recommend.js';
import { assessAllRisks } from './risk.js';

/**
 * Architecture Intelligence Report — Gesamtübersicht.
 */
export function generateArchitectureIntelligenceReport(scan) {
  const explanation = explainArchitecture(scan);
  const lines = [
    '# Architecture Intelligence Report — ARCH-003',
    '',
    `> Generiert: ${scan.generatedAt}`,
    '',
    '## Zusammenfassung',
    '',
    explanation.summary.statement,
    '',
    '## Health Metrics',
    '',
    '| Metrik | Wert |',
    '|--------|------|',
    `| Dateien | ${scan.metrics.totalFiles} |`,
    `| Violations | ${scan.metrics.totalViolations} |`,
    `| CRITICAL | ${scan.metrics.criticalViolations} |`,
    `| HIGH | ${scan.metrics.highViolations} |`,
    `| Action Engine Adoption | ${scan.metrics.actionEnginePct}% |`,
    `| Core Engine Adoption | ${scan.metrics.coreEnginePct}% |`,
    `| Registry Adoption | ${scan.metrics.registryPct}% |`,
    `| Ownership Coverage | ${scan.metrics.ownershipCoveragePct}% |`,
    '',
    '## Domains',
    '',
  ];

  for (const [domain, data] of Object.entries(scan.metrics.byDomain || {})) {
    lines.push(`- **${data.label || domain}**: ${data.files} Dateien, ${data.violations} Violations`);
  }

  lines.push('', '## Governance', '');
  for (const adr of scan.governance.adrs) {
    lines.push(`- ${adr.id}: ${adr.title} (${adr.status})`);
  }
  for (const rfc of scan.governance.rfcs) {
    lines.push(`- ${rfc.id}: ${rfc.title} (${rfc.status})`);
  }

  return lines.join('\n');
}

/**
 * Constitution Compliance Report.
 */
export function generateConstitutionComplianceReport(scan) {
  const validation = validateConstitution(scan);
  const lines = [
    '# Constitution Compliance Report',
    '',
    `Status: ${validation.valid ? '✅ Compliant (keine CRITICAL)' : '❌ Non-Compliant'}`,
    '',
    '## Regel-Compliance',
    '',
    '| Regel | Status | Violations |',
    '|-------|--------|------------|',
  ];

  for (const rule of validation.rules) {
    lines.push(`| ${rule.title} | ${rule.compliant ? '✅' : '❌'} | ${rule.violationCount} |`);
  }

  return lines.join('\n');
}

/**
 * ADR Compliance Report.
 */
export function generateAdrComplianceReport(scan) {
  const validation = validateAdrs(scan);
  const lines = [
    '# ADR Compliance Report',
    '',
    `Status: ${validation.valid ? '✅ All ADRs compliant' : '❌ ADR violations detected'}`,
    '',
  ];

  for (const adr of validation.adrs) {
    lines.push(`## ${adr.adr}: ${adr.title}`);
    lines.push(`- Status: ${adr.compliant ? '✅' : '❌'} (${adr.violationCount} violations)`);
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * RFC Compliance Report.
 */
export function generateRfcComplianceReport(scan) {
  const validation = validateRfcs(scan);
  const lines = [
    '# RFC Compliance Report',
    '',
    `Status: ${validation.valid ? '✅ All RFCs compliant' : '❌ RFC violations detected'}`,
    '',
  ];

  for (const rfc of validation.rfcs) {
    lines.push(`## ${rfc.rfc}: ${rfc.title}`);
    lines.push(`- Status: ${rfc.compliant ? '✅' : '❌'} (${rfc.violationCount} violations)`);
    lines.push(`- Rules: ${rfc.rules.join(', ')}`);
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Recommendation Report.
 */
export function generateRecommendationReport(scan, options = {}) {
  const recommendations = getRecommendations(scan, options);
  const lines = [
    '# Recommendation Report',
    '',
    `${recommendations.length} Empfehlungen`,
    '',
  ];

  for (const rec of recommendations.slice(0, 20)) {
    lines.push(`## ${rec.title}`);
    lines.push(`- **Datei:** \`${rec.file}\`${rec.line ? `:${rec.line}` : ''}`);
    lines.push(`- **Begründung:** ${rec.rationale.statement}`);
    lines.push(`- **Risiko:** ${rec.risk.overall}/10`);
    lines.push('- **Schritte:**');
    for (const step of rec.steps) lines.push(`  1. ${step}`);
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Risk Report.
 */
export function generateRiskReport(scan) {
  const risks = assessAllRisks(scan);
  const lines = [
    '# Risk Report',
    '',
    `${risks.length} Risiken (CRITICAL + HIGH)`,
    '',
    '| Datei | Typ | Severity | Overall | Architecture | Runtime |',
    '|-------|-----|----------|---------|--------------|---------|',
  ];

  for (const r of risks.slice(0, 30)) {
    lines.push(`| ${r.file} | ${r.type} | ${r.severity} | ${r.risk.overall} | ${r.risk.architectureRisk} | ${r.risk.runtimeRisk} |`);
  }

  return lines.join('\n');
}

/**
 * Change Simulation Report.
 */
export function generateChangeSimulationReport(simulation) {
  return [
    '# Change Simulation Report',
    '',
    `Typ: ${simulation.simulationType}`,
    `Betroffene Dateien: ${simulation.affectedFileCount}`,
    `Neue Violations: ${simulation.newViolations.length}`,
    '',
    '## Risiken',
    ...simulation.risks.map(r => `- [${r.severity}] ${r.type}: ${r.detail}`),
    '',
    '## Alternativen',
    ...simulation.alternatives.map(a => `- ${a.action}: ${a.description} (Risiko: ${a.risk})`),
  ].join('\n');
}

/**
 * PR Review Report.
 */
export function generatePrReviewReport(prAnalysis) {
  const lines = [
    '# PR Review Report',
    '',
    prAnalysis.summary.statement,
    '',
    `Merge blockieren: ${prAnalysis.blockMerge ? '❌ JA' : '✅ NEIN'}`,
  ];

  if (prAnalysis.blockReason) lines.push(`Grund: ${prAnalysis.blockReason}`);
  lines.push('', '## Neue Findings', '');

  for (const f of prAnalysis.newFindings.slice(0, 20)) {
    lines.push(`- [${f.severity}] **${f.type}** in \`${f.file}\`: ${f.why}`);
    lines.push(`  - Fix: ${f.remediation}`);
  }

  return lines.join('\n');
}

/**
 * Decision Trace Report.
 */
export function generateDecisionTraceReport(trace) {
  return [
    '# Decision Trace Report',
    '',
    `Empfehlung: ${trace.recommendationId}`,
    '',
    '## Schlussfolgerung',
    trace.conclusion,
    '',
    '## Verwendete Fakten',
    ...trace.factsUsed.map(f => `- [${f.sourceType}] ${f.type}: ${JSON.stringify(f.data).slice(0, 100)}`),
    '',
    '## Analysierte Dateien',
    ...trace.analyzedFiles.map(f => `- \`${f.path}\`${f.line ? `:${f.line}` : ''} (${f.reason})`),
    '',
    '## Angewandte Regeln',
    ...trace.appliedRules.map(r => `- ${r.id}: ${r.title}`),
    '',
    '## Quellen',
    ...trace.sources.map(s => `- [${s.type}] ${s.ref}`),
  ].join('\n');
}

/**
 * Generiert alle Reports.
 */
export function generateAllReports(scan) {
  return {
    architectureIntelligence: generateArchitectureIntelligenceReport(scan),
    constitutionCompliance: generateConstitutionComplianceReport(scan),
    adrCompliance: generateAdrComplianceReport(scan),
    rfcCompliance: generateRfcComplianceReport(scan),
    recommendations: generateRecommendationReport(scan),
    risks: generateRiskReport(scan),
  };
}
