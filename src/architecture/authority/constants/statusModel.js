// src/architecture/authority/constants/statusModel.js
// ══════════════════════════════════════════════════════════════════════════════
// HUI Architecture Authority — Status Model (ARCH-004)
// Kanonisches Statusmodell für alle Governance-Dokumente und Regeln.
// ══════════════════════════════════════════════════════════════════════════════

/** @typedef {'Draft'|'Review'|'Accepted'|'Ratified'|'Locked'|'Experimental'|'Deprecated'|'Superseded'|'Archived'|'Rejected'} GovernanceStatus */

export const STATUS = Object.freeze({
  DRAFT:        'Draft',
  REVIEW:       'Review',
  ACCEPTED:     'Accepted',
  RATIFIED:     'Ratified',
  LOCKED:       'Locked',
  EXPERIMENTAL: 'Experimental',
  DEPRECATED:   'Deprecated',
  SUPERSEDED:   'Superseded',
  ARCHIVED:     'Archived',
  REJECTED:     'Rejected',
});

/** Gültige Statuswerte als Array */
export const STATUS_LIST = Object.freeze(Object.values(STATUS));

/** Status die als verbindlich gelten */
export const BINDING_STATUSES = Object.freeze([
  STATUS.ACCEPTED,
  STATUS.RATIFIED,
  STATUS.LOCKED,
]);

/** Status die als aktiv (nicht historisch) gelten */
export const ACTIVE_STATUSES = Object.freeze([
  STATUS.DRAFT,
  STATUS.REVIEW,
  STATUS.ACCEPTED,
  STATUS.RATIFIED,
  STATUS.LOCKED,
  STATUS.EXPERIMENTAL,
]);

/** Status-Übergänge (von → erlaubte Nachfolger) */
export const STATUS_TRANSITIONS = Object.freeze({
  [STATUS.DRAFT]:        [STATUS.REVIEW, STATUS.REJECTED, STATUS.ARCHIVED],
  [STATUS.REVIEW]:       [STATUS.ACCEPTED, STATUS.REJECTED, STATUS.DRAFT],
  [STATUS.ACCEPTED]:     [STATUS.RATIFIED, STATUS.DEPRECATED, STATUS.SUPERSEDED],
  [STATUS.RATIFIED]:     [STATUS.LOCKED, STATUS.DEPRECATED, STATUS.SUPERSEDED],
  [STATUS.LOCKED]:       [STATUS.SUPERSEDED, STATUS.ARCHIVED],
  [STATUS.EXPERIMENTAL]: [STATUS.ACCEPTED, STATUS.REJECTED, STATUS.DEPRECATED],
  [STATUS.DEPRECATED]:   [STATUS.SUPERSEDED, STATUS.ARCHIVED],
  [STATUS.SUPERSEDED]:   [STATUS.ARCHIVED],
  [STATUS.ARCHIVED]:     [],
  [STATUS.REJECTED]:     [STATUS.ARCHIVED],
});

/**
 * Prüft ob ein Status verbindlich ist.
 * @param {string} status
 */
export function isBindingStatus(status) {
  return BINDING_STATUSES.includes(status);
}

/**
 * Prüft ob ein Status-Übergang erlaubt ist.
 * @param {string} from
 * @param {string} to
 */
export function isValidTransition(from, to) {
  return (STATUS_TRANSITIONS[from] || []).includes(to);
}
