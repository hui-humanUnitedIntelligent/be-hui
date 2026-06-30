// src/architecture/governance/constitution.js
// ══════════════════════════════════════════════════════════════════════════════
// HUI Constitution Parser — ARCH-003
// Liest HUI_CONSTITUTION.md und extrahiert maschinenlesbare Regeln.
// ══════════════════════════════════════════════════════════════════════════════

import { readFileSync, existsSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '../../..');
const CONSTITUTION_PATH = join(PROJECT_ROOT, 'HUI_CONSTITUTION.md');

/** @typedef {{ id: string, title: string, content: string, level: number }} ConstitutionSection */

/**
 * Architekturregeln — abgeleitet aus Constitution IV + Scanner-Regeln.
 * Jede Regel referenziert eine Constitution-Sektion.
 */
export const ARCHITECTURE_RULES = Object.freeze({
  NO_UI_IMPACT_LOGIC: {
    id: 'NO_UI_IMPACT_LOGIC',
    title: 'Keine UI-Komponente besitzt eigene Wirkungslogik',
    constitutionRef: 'IV — Unveränderliche Architekturregeln',
    violationTypes: ['CORE_BYPASS', 'DB_DIRECT_WRITE'],
    severity: 'CRITICAL',
  },
  NO_ENGINE_OWN_LANGUAGE: {
    id: 'NO_ENGINE_OWN_LANGUAGE',
    title: 'Keine Engine besitzt eigene Sprache',
    constitutionRef: 'IV — Unveränderliche Architekturregeln',
    violationTypes: ['REGISTRY_BYPASS'],
    severity: 'LOW',
  },
  REGISTRY_SSOM: {
    id: 'REGISTRY_SSOM',
    title: 'Registry ist Single Source of Meaning',
    constitutionRef: 'IV — Unveränderliche Architekturregeln',
    violationTypes: ['REGISTRY_BYPASS'],
    severity: 'LOW',
  },
  CORE_SSOT: {
    id: 'CORE_SSOT',
    title: 'Core Engine ist Single Source of Truth',
    constitutionRef: 'IV — Unveränderliche Architekturregeln',
    violationTypes: ['CORE_BYPASS'],
    severity: 'CRITICAL',
  },
  UNIDIRECTIONAL_FLOW: {
    id: 'UNIDIRECTIONAL_FLOW',
    title: 'Datenfluss ist unidirektional',
    constitutionRef: 'IV — Schichtenmodell',
    violationTypes: ['LAYER_VIOLATION'],
    severity: 'HIGH',
  },
  SINGLE_OWNERSHIP: {
    id: 'SINGLE_OWNERSHIP',
    title: 'Single Ownership pro Tabelle',
    constitutionRef: 'IV — Unveränderliche Architekturregeln',
    violationTypes: ['DUPLICATE_OWNER'],
    severity: 'HIGH',
  },
  ACTION_ENGINE: {
    id: 'ACTION_ENGINE',
    title: 'Navigation über Action Engine',
    constitutionRef: 'RFC-000 — Layering',
    violationTypes: ['DIRECT_ROUTING', 'ACTION_ENGINE_GAP'],
    severity: 'HIGH',
  },
  SERVICE_LAYER: {
    id: 'SERVICE_LAYER',
    title: 'DB-Zugriff über Service-Layer',
    constitutionRef: 'RFC-000 — Layering',
    violationTypes: ['DB_DIRECT_WRITE', 'DB_DIRECT_READ'],
    severity: 'HIGH',
  },
  OWNERSHIP_HEADER: {
    id: 'OWNERSHIP_HEADER',
    title: 'Dateien benötigen @domain und @owner Header',
    constitutionRef: 'ARCH-001 — Ownership Convention',
    violationTypes: ['MISSING_HEADER'],
    severity: 'INFO',
  },
});

/** Goldene Regeln — Referenz für Compliance-Reports */
export const GOLDEN_RULES = Object.freeze([
  { id: 'GR-01', title: 'Menschen sind keine Produkte', section: 'III.1' },
  { id: 'GR-02', title: 'Wirkung ist wichtiger als Aufmerksamkeit', section: 'III.2' },
  { id: 'GR-03', title: 'Verbinden ist wertvoller als Reichweite', section: 'III.3' },
  { id: 'GR-04', title: 'Wertschöpfung und Gemeinwohl gehören zusammen', section: 'III.4' },
  { id: 'GR-05', title: 'Der Orb zeigt keine Leistung', section: 'III.5' },
  { id: 'GR-06', title: 'Der Feed dient Orientierung', section: 'III.6' },
  { id: 'GR-07', title: 'Die KI ergänzt Menschen', section: 'III.7' },
  { id: 'GR-08', title: 'Keine Gamification', section: 'III.8' },
  { id: 'GR-09', title: 'Jede Funktion stärkt einen Grundpfeiler', section: 'III.9' },
  { id: 'GR-10', title: 'Kurzfristiges Wachstum darf Gemeinschaft nicht schädigen', section: 'III.10' },
]);

/** Grundpfeiler */
export const PILLARS = Object.freeze([
  { id: 'PILLAR-01', name: 'Verbinden', emoji: '🤝' },
  { id: 'PILLAR-02', name: 'Unterstützen', emoji: '💚' },
  { id: 'PILLAR-03', name: 'Erschaffen', emoji: '🎨' },
  { id: 'PILLAR-04', name: 'Wertschöpfen', emoji: '🌱' },
  { id: 'PILLAR-05', name: 'Impact', emoji: '🌍' },
]);

/**
 * Parst HUI_CONSTITUTION.md in Sektionen.
 * @param {string} [constitutionPath]
 * @returns {{ sections: ConstitutionSection[], raw: string, path: string }}
 */
export function parseConstitution(constitutionPath = CONSTITUTION_PATH) {
  if (!existsSync(constitutionPath)) {
    return { sections: [], raw: '', path: constitutionPath };
  }

  const raw = readFileSync(constitutionPath, 'utf8');
  const sections = [];
  const lines = raw.split('\n');
  let current = null;

  for (const line of lines) {
    const h2 = line.match(/^## (.+)/);
    const h3 = line.match(/^### (.+)/);

    if (h2) {
      if (current) sections.push(current);
      current = { id: h2[1].replace(/[^a-zA-Z0-9]+/g, '-').toUpperCase(), title: h2[1], content: '', level: 2 };
    } else if (h3 && current) {
      if (current.content.trim()) sections.push(current);
      current = { id: h3[1].replace(/[^a-zA-Z0-9]+/g, '-').toUpperCase(), title: h3[1], content: '', level: 3 };
    } else if (current) {
      current.content += line + '\n';
    }
  }
  if (current) sections.push(current);

  return { sections, raw, path: constitutionPath };
}

/**
 * Findet die Constitution-Regel für einen Violation-Typ.
 * @param {string} violationType
 * @returns {typeof ARCHITECTURE_RULES[keyof typeof ARCHITECTURE_RULES] | null}
 */
export function getRuleForViolationType(violationType) {
  for (const rule of Object.values(ARCHITECTURE_RULES)) {
    if (rule.violationTypes.includes(violationType)) {
      return rule;
    }
  }
  return null;
}

/**
 * Gibt alle Regeln zurück die für eine Domain gelten.
 * @param {string} domain
 * @returns {Array<typeof ARCHITECTURE_RULES[keyof typeof ARCHITECTURE_RULES]>}
 */
export function getRulesForDomain(domain) {
  const domainRules = {
    PAGES: ['NO_UI_IMPACT_LOGIC', 'SERVICE_LAYER', 'ACTION_ENGINE', 'UNIDIRECTIONAL_FLOW', 'OWNERSHIP_HEADER'],
    COMPONENTS: ['NO_UI_IMPACT_LOGIC', 'SERVICE_LAYER', 'ACTION_ENGINE', 'UNIDIRECTIONAL_FLOW', 'NO_ENGINE_OWN_LANGUAGE', 'OWNERSHIP_HEADER'],
    FEATURES: ['SERVICE_LAYER', 'UNIDIRECTIONAL_FLOW', 'OWNERSHIP_HEADER'],
    HOOKS: ['SERVICE_LAYER', 'UNIDIRECTIONAL_FLOW', 'OWNERSHIP_HEADER'],
    CONTEXT: ['SERVICE_LAYER', 'UNIDIRECTIONAL_FLOW', 'OWNERSHIP_HEADER'],
    CORE: ['CORE_SSOT', 'UNIDIRECTIONAL_FLOW'],
    REGISTRY: ['REGISTRY_SSOM'],
    SERVICES: ['SINGLE_OWNERSHIP', 'UNIDIRECTIONAL_FLOW'],
  };

  const ruleIds = domainRules[domain] || ['UNIDIRECTIONAL_FLOW', 'OWNERSHIP_HEADER'];
  return ruleIds.map(id => ARCHITECTURE_RULES[id]).filter(Boolean);
}
