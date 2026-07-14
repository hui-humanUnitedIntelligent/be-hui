// src/architecture/intelligence/confidence.js
// ══════════════════════════════════════════════════════════════════════════════
// Confidence System — ARCH-003
// Jede Aussage erhält Source-Typ und Confidence-Level.
// ══════════════════════════════════════════════════════════════════════════════

export const SOURCE = Object.freeze({
  EXPLICIT: 'explicit',   // Direkt aus Quelldatei / Constitution / ADR
  DERIVED:  'derived',    // Berechnet aus Graph / Scan-Daten
  INFERRED: 'inferred',   // Heuristisch abgeleitet — nie als Fakt darstellen
});

export const CONFIDENCE = Object.freeze({
  HIGH:   'high',
  MEDIUM: 'medium',
  LOW:    'low',
});

/**
 * Erstellt eine nachvollziehbare Aussage mit Quellenangabe.
 * @param {string} statement
 * @param {{ type: string, path?: string, line?: number, section?: string }} source
 * @param {'explicit'|'derived'|'inferred'} sourceType
 * @param {'high'|'medium'|'low'} confidence
 * @param {Array<{ type: string, ref: string }>} [references]
 */
export function createStatement(statement, source, sourceType = SOURCE.DERIVED, confidence = CONFIDENCE.HIGH, references = []) {
  return {
    statement,
    source,
    sourceType,
    confidence,
    references,
    isFactual: sourceType !== SOURCE.INFERRED && confidence !== CONFIDENCE.LOW,
  };
}

/**
 * Kombiniert mehrere Statements zu einer zusammengefassten Aussage.
 * Confidence wird auf das niedrigste Level gesetzt.
 * @param {ReturnType<typeof createStatement>[]} statements
 * @param {string} summary
 */
export function combineStatements(statements, summary) {
  const sourceTypes = statements.map(s => s.sourceType);
  const confidences = statements.map(s => s.confidence);

  const worstSource = sourceTypes.includes(SOURCE.INFERRED) ? SOURCE.INFERRED
    : sourceTypes.includes(SOURCE.DERIVED) ? SOURCE.DERIVED
    : SOURCE.EXPLICIT;

  const worstConfidence = confidences.includes(CONFIDENCE.LOW) ? CONFIDENCE.LOW
    : confidences.includes(CONFIDENCE.MEDIUM) ? CONFIDENCE.MEDIUM
    : CONFIDENCE.HIGH;

  return {
    summary,
    statements,
    sourceType: worstSource,
    confidence: worstConfidence,
    isFactual: worstSource !== SOURCE.INFERRED && worstConfidence !== CONFIDENCE.LOW,
  };
}

/**
 * Markiert eine Aussage als unsicher wenn weniger als minSources Quellen vorhanden.
 * @param {ReturnType<typeof createStatement>} statement
 * @param {number} minSources
 */
export function downgradeIfUncertain(statement, minSources = 1) {
  if ((statement.references?.length || 0) < minSources) {
    return {
      ...statement,
      sourceType: SOURCE.INFERRED,
      confidence: CONFIDENCE.LOW,
      isFactual: false,
    };
  }
  return statement;
}
