// src/architecture/intelligence/recommend.js
// ══════════════════════════════════════════════════════════════════════════════
// Recommendation Engine — ARCH-003
// Liefert Lösungsvorschläge mit Begründung, betroffenen Dateien und Risiko.
// ══════════════════════════════════════════════════════════════════════════════

import { getRuleForViolationType } from '../governance/constitution.js';
import { getAdrsForViolationType } from '../governance/adrRegistry.js';
import { getDependents } from '../graph/knowledgeGraph.js';
import { createStatement, SOURCE, CONFIDENCE } from './confidence.js';
import { explainViolation } from './explain.js';
import { assessRisk } from './risk.js';
import { buildDecisionTrace } from './decisionTrace.js';

const RECOMMENDATIONS = Object.freeze({
  CORE_BYPASS: {
    title: 'Core Engine nutzen',
    steps: [
      'DB-Write nach src/services/ oder src/core/ verschieben',
      'Action über useHuiActions() dispatchen',
      'State über AppStateContext oder useCoreEngine() delegieren',
    ],
    affectedPattern: ['src/core/coreEngine.js', 'src/hooks/useCoreEngine.js', 'src/services/'],
  },
  DB_DIRECT_WRITE: {
    title: 'Service-Layer einführen',
    steps: [
      'Erstelle Service-Funktion in src/services/',
      'Ersetze direkten supabase.from()-Call durch Service-Aufruf',
      'Optional: Action über useHuiActions dispatchen',
    ],
    affectedPattern: ['src/services/'],
  },
  LAYER_VIOLATION: {
    title: 'Import-Richtung korrigieren',
    steps: [
      'Identifiziere benötigte Logik im falschen Layer',
      'Extrahiere Logik in erlaubte Schicht (Service oder Hook)',
      'Importiere aus der korrekten Schicht',
    ],
    affectedPattern: ['src/services/', 'src/hooks/'],
  },
  DUPLICATE_OWNER: {
    title: 'Single Ownership herstellen',
    steps: [
      'Wähle eine kanonische Service-Datei als Writer',
      'Andere Writer rufen den Service auf',
      'Entferne direkte DB-Writes aus UI-Dateien',
    ],
    affectedPattern: ['src/services/'],
  },
  DIRECT_ROUTING: {
    title: 'Action Engine adoptieren',
    steps: [
      'Ersetze window.location / history.* durch useHuiActions()',
      'Definiere Action in hui.actions.js falls nicht vorhanden',
      'Dispatch über dispatch(A.ACTION_NAME, payload)',
    ],
    affectedPattern: ['src/core/hui.actions.js', 'src/hooks/useHuiActions.js'],
  },
  REGISTRY_BYPASS: {
    title: 'HuiRegistry nutzen',
    steps: [
      'Ersetze hardcodierte Farben durch HuiRegistry oder Design Tokens',
      'Importiere aus src/registry/HuiRegistry.js',
      'Prüfe src/design/hui.design.js für vorhandene Tokens',
    ],
    affectedPattern: ['src/registry/HuiRegistry.js', 'src/design/hui.design.js'],
  },
  MISSING_HEADER: {
    title: 'Architektur-Header hinzufügen',
    steps: [
      'Füge @domain TAG basierend auf Pfad hinzu',
      'Füge @owner TAG basierend auf Team-Zuständigkeit hinzu',
      'Optional: @responsibility für Verantwortungsbeschreibung',
    ],
    affectedPattern: [],
  },
});

/**
 * Generiert Empfehlung für einen Violation.
 * @param {Violation} violation
 * @param {ScanReport} scan
 */
export function recommendForViolation(violation, scan) {
  const template = RECOMMENDATIONS[violation.type];
  const explanation = explainViolation(violation.id, scan);
  const rule = getRuleForViolationType(violation.type);
  const adrs = getAdrsForViolationType(violation.type, scan.governance.adrs);
  const dependents = getDependents(violation.file, scan.graph);

  const recommendation = {
    id: `REC-${violation.id}`,
    violationId: violation.id,
    title: template?.title || `Verstoß beheben: ${violation.type}`,
    file: violation.file,
    line: violation.line,
    rationale: createStatement(
      `${violation.file} verletzt ${rule?.title || violation.type}. ${explanation.remediation}`,
      { type: 'violation', path: violation.file, line: violation.line },
      SOURCE.EXPLICIT,
      CONFIDENCE.HIGH,
      [
        { type: 'constitution', ref: rule?.constitutionRef || 'HUI_CONSTITUTION.md' },
        ...adrs.map(a => ({ type: 'adr', ref: a.path })),
      ]
    ),
    steps: template?.steps || [explanation.remediation],
    affectedFiles: [
      violation.file,
      ...(violation.writers || []),
      ...dependents.slice(0, 5),
      ...(template?.affectedPattern || []),
    ].filter((v, i, a) => a.indexOf(v) === i),
    rule: rule ? { id: rule.id, title: rule.title } : null,
    adrs: adrs.map(a => ({ id: a.id, title: a.title })),
    risk: assessRisk({ violation, scan }),
    trace: null,
  };

  recommendation.trace = buildDecisionTrace(recommendation, scan);
  return recommendation;
}

/**
 * Generiert alle Empfehlungen für kritische und high Violations.
 * @param {ScanReport} scan
 * @param {{ minSeverity?: string, limit?: number }} [options]
 */
export function getRecommendations(scan, options = {}) {
  const minSeverity = options.minSeverity || 'HIGH';
  const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3, INFO: 4 };
  const minOrder = severityOrder[minSeverity] ?? 1;

  const relevant = scan.violations
    .filter(v => (severityOrder[v.severity] ?? 5) <= minOrder)
    .slice(0, options.limit || 50);

  return relevant.map(v => recommendForViolation(v, scan));
}

/**
 * Universelle Recommend-Funktion.
 * @param {{ violationId?: string, file?: string }} query
 * @param {ScanReport} scan
 */
export function recommend(query, scan) {
  if (query.violationId) {
    const violation = scan.violations.find(v => v.id === query.violationId);
    if (!violation) return { error: `Violation nicht gefunden: ${query.violationId}` };
    return recommendForViolation(violation, scan);
  }

  if (query.file) {
    const fileViolations = scan.violations.filter(v => v.file === query.file);
    return fileViolations.map(v => recommendForViolation(v, scan));
  }

  return getRecommendations(scan, query);
}
