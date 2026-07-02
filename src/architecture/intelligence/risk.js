// src/architecture/intelligence/risk.js
// ══════════════════════════════════════════════════════════════════════════════
// Risk Engine — ARCH-003
// Bewertet Risiken basierend auf echten Scan-Daten — keine Fantasiewerte.
// ══════════════════════════════════════════════════════════════════════════════

import { createStatement, SOURCE, CONFIDENCE } from './confidence.js';
import { getDependents } from '../graph/knowledgeGraph.js';

const SEVERITY_WEIGHT = Object.freeze({
  CRITICAL: 10,
  HIGH: 7,
  MEDIUM: 4,
  LOW: 2,
  INFO: 1,
});

/**
 * Berechnet Risiko-Scores für eine Empfehlung oder Simulation.
 * Alle Werte sind nachvollziehbar aus Scan-Daten abgeleitet.
 * @param {object} context — { violation?, simulation?, recommendation?, scan }
 */
export function assessRisk(context) {
  const { violation, simulation, recommendation, scan } = context;

  const impactScore = calculateImpactScore(context);
  const architectureRisk = calculateArchitectureRisk(context);
  const runtimeRisk = calculateRuntimeRisk(context);
  const migrationRisk = calculateMigrationRisk(context);
  const constitutionRisk = calculateConstitutionRisk(context);
  const regressionRisk = calculateRegressionRisk(context);
  const complexity = calculateComplexity(context);
  const confidence = calculateConfidence(context);

  const overall = Math.round(
    (architectureRisk * 0.25 + runtimeRisk * 0.2 + migrationRisk * 0.15 +
     constitutionRisk * 0.2 + regressionRisk * 0.15 + complexity * 0.05) * 10
  ) / 10;

  return {
    impactScore,
    architectureRisk,
    runtimeRisk,
    migrationRisk,
    constitutionRisk,
    regressionRisk,
    complexity,
    confidence,
    overall,
    summary: createStatement(
      `Gesamtrisiko: ${overall}/10 (Confidence: ${confidence.level})`,
      { type: 'risk-assessment' },
      confidence.sourceType,
      confidence.level === 'high' ? CONFIDENCE.HIGH : confidence.level === 'medium' ? CONFIDENCE.MEDIUM : CONFIDENCE.LOW
    ),
    factors: buildRiskFactors(context),
  };
}

function calculateImpactScore(context) {
  const { violation, simulation, scan } = context;
  if (simulation) {
    const count = simulation.affectedFileCount || simulation.affectedFiles?.length || 0;
    return Math.min(10, Math.round(count / 5));
  }
  if (violation && scan) {
    const dependents = getDependents(violation.file, scan.graph);
    return Math.min(10, 1 + Math.round(dependents.length / 3));
  }
  return 1;
}

function calculateArchitectureRisk(context) {
  const { violation, simulation } = context;
  if (violation) return (SEVERITY_WEIGHT[violation.severity] || 5);
  if (simulation?.newViolations?.length > 0) {
    return Math.min(10, simulation.newViolations.reduce((s, v) => s + (SEVERITY_WEIGHT[v.severity] || 3), 0));
  }
  return 2;
}

function calculateRuntimeRisk(context) {
  const { violation, simulation } = context;
  if (violation?.type === 'CORE_BYPASS') return 9;
  if (violation?.type === 'DB_DIRECT_WRITE') return 7;
  if (simulation?.brokenServices?.length > 0) return Math.min(10, simulation.brokenServices.length * 2);
  if (simulation?.simulationType === 'deletion') return 6;
  return 2;
}

function calculateMigrationRisk(context) {
  const { simulation } = context;
  if (!simulation) return 1;
  const count = simulation.affectedFileCount || 0;
  if (simulation.simulationType === 'move' || simulation.simulationType === 'layer_move') return Math.min(10, 3 + Math.round(count / 4));
  if (simulation.simulationType === 'merge' || simulation.simulationType === 'split') return Math.min(10, 5 + Math.round(count / 6));
  return Math.min(10, Math.round(count / 8));
}

function calculateConstitutionRisk(context) {
  const { violation, simulation } = context;
  if (violation?.severity === 'CRITICAL') return 10;
  if (violation?.severity === 'HIGH') return 7;
  if (simulation?.constitutionViolations?.length > 0) return 8;
  return 1;
}

function calculateRegressionRisk(context) {
  const { simulation, scan, violation } = context;
  if (simulation) {
    const deps = simulation.affectedFiles?.filter(f => f.includes('pages/') || f.includes('components/')) || [];
    return Math.min(10, Math.round(deps.length / 2));
  }
  if (violation && scan) {
    return Math.min(10, getDependents(violation.file, scan.graph).length);
  }
  return 2;
}

function calculateComplexity(context) {
  const { recommendation, simulation } = context;
  const steps = recommendation?.steps?.length || 0;
  const files = recommendation?.affectedFiles?.length || simulation?.affectedFileCount || 0;
  return Math.min(10, Math.round((steps + files) / 3));
}

function calculateConfidence(context) {
  const { scan, violation } = context;
  if (!scan) return { level: 'low', sourceType: SOURCE.INFERRED, reason: 'Kein Scan-Daten verfügbar' };

  const hasExplicitSource = violation?.file && scan.scanResults.has(violation.file);
  if (hasExplicitSource) return { level: 'high', sourceType: SOURCE.EXPLICIT, reason: 'Direkt aus Scan und Violation' };

  return { level: 'medium', sourceType: SOURCE.DERIVED, reason: 'Aus Graph und Heuristiken abgeleitet' };
}

function buildRiskFactors(context) {
  const factors = [];
  const { violation, simulation } = context;

  if (violation) {
    factors.push({ factor: 'violation-severity', value: violation.severity, weight: SEVERITY_WEIGHT[violation.severity] });
    factors.push({ factor: 'violation-type', value: violation.type });
  }
  if (simulation) {
    factors.push({ factor: 'affected-files', value: simulation.affectedFileCount });
    factors.push({ factor: 'new-violations', value: simulation.newViolations?.length || 0 });
    factors.push({ factor: 'simulation-type', value: simulation.simulationType });
  }
  return factors;
}

/**
 * Bewertet Risiken für alle Violations.
 * @param {ScanReport} scan
 */
export function assessAllRisks(scan) {
  const criticalAndHigh = scan.violations.filter(v => v.severity === 'CRITICAL' || v.severity === 'HIGH');

  return criticalAndHigh.map(v => ({
    violationId: v.id,
    file: v.file,
    type: v.type,
    severity: v.severity,
    risk: assessRisk({ violation: v, scan }),
  })).sort((a, b) => b.risk.overall - a.risk.overall);
}
