// src/architecture/authority/constants/ruleSchema.js
// ══════════════════════════════════════════════════════════════════════════════
// HUI Architecture Authority — Rule Lifecycle Schema (ARCH-004)
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Erstellt ein kanonisches Regel-Objekt mit vollständigem Lifecycle.
 * @param {object} fields
 */
export function createRule(fields) {
  return Object.freeze({
    id:              fields.id,
    title:           fields.title,
    description:     fields.description || '',
    source:          fields.source,
    sourceType:      fields.sourceType || 'document',
    version:         fields.version || '1.0',
    status:          fields.status,
    authority:       fields.authority || 'ARCH-004',
    validSince:      fields.validSince || null,
    supersededBy:    fields.supersededBy || null,
    predecessor:     fields.predecessor || null,
    successor:       fields.successor || null,
    scope:           fields.scope || 'platform',
    affectedDomains: Object.freeze(fields.affectedDomains || []),
    affectedCapabilities: Object.freeze(fields.affectedCapabilities || []),
    affectedLayers:  Object.freeze(fields.affectedLayers || []),
    priority:        fields.priority ?? 100,
    derived:         fields.derived ?? false,
    inferred:        fields.inferred ?? false,
    metadata:        Object.freeze(fields.metadata || {}),
  });
}

/**
 * Erstellt ein kanonisches Entscheidungs-Objekt.
 * @param {object} fields
 */
export function createDecision(fields) {
  return Object.freeze({
    id:                  fields.id,
    title:               fields.title,
    why:                 fields.why || '',
    alternatives:        Object.freeze(fields.alternatives || []),
    acceptedRisks:       Object.freeze(fields.acceptedRisks || []),
    influencedRules:     Object.freeze(fields.influencedRules || []),
    adr:                 fields.adr || null,
    rfc:                 fields.rfc || null,
    constitutionRules:   Object.freeze(fields.constitutionRules || []),
    domains:             Object.freeze(fields.domains || []),
    impacts:             Object.freeze(fields.impacts || []),
    status:              fields.status,
    version:             fields.version || '1.0',
    date:                fields.date || null,
    owner:               fields.owner || null,
    source:              fields.source,
    derived:             fields.derived ?? false,
  });
}

/** Regel-Prioritäten (niedriger = höhere Priorität) */
export const RULE_PRIORITY = Object.freeze({
  CONSTITUTION:  10,
  RFC:           20,
  ADR:           30,
  POLICY:        40,
  SCANNER:       50,
  CONVENTION:    60,
});
