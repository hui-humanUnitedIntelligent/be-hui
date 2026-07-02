// src/architecture/intelligence/simulate.js
// ══════════════════════════════════════════════════════════════════════════════
// Change Intelligence — ARCH-003
// Simuliert Architektur-Änderungen ohne Dateisystem zu modifizieren.
// ══════════════════════════════════════════════════════════════════════════════

import { getDomainForPath, isImportAllowed } from '../scanner/domains.js';
import { getDependents, getDependencies, getTablesForFile } from '../graph/knowledgeGraph.js';
import { getRuleForViolationType } from '../governance/constitution.js';
import { analyzeRfcImpact } from '../governance/rfcRegistry.js';
import { getAdrsForFile } from '../governance/adrRegistry.js';
import { validateProposal } from './validate.js';
import { createStatement, SOURCE, CONFIDENCE } from './confidence.js';

/**
 * Basis-Simulation — analysiert Auswirkungen eines hypothetischen Changes.
 * @param {object} change
 * @param {ScanReport} scan
 */
function simulateBase(change, scan) {
  const affectedFiles = new Set();
  const newViolations = [];
  const risks = [];
  const alternatives = [];

  if (change.file) {
    affectedFiles.add(change.file);
    const dependents = getDependents(change.file, scan.graph);
    dependents.forEach(d => affectedFiles.add(d));
  }

  return { affectedFiles, newViolations, risks, alternatives };
}

/**
 * Simuliert eine generische Änderung.
 */
export function simulateChange(change, scan) {
  const base = simulateBase(change, scan);
  const validation = change.proposal ? validateProposal(change.proposal, scan) : null;

  if (validation?.violations) base.newViolations.push(...validation.violations);

  return buildSimulationResult('change', change, scan, base, validation);
}

/**
 * Simuliert das Löschen einer Datei.
 */
export function simulateDeletion(filePath, scan) {
  const dependents = getDependents(filePath, scan.graph);
  const semantics = scan.semantics.get(filePath);
  const tables = getTablesForFile(filePath, scan.graph);

  const risks = [];
  if (dependents.length > 0) {
    risks.push({ type: 'broken-imports', severity: 'HIGH', detail: `${dependents.length} Dateien verlieren Import` });
  }
  if (tables.some(t => t.operation !== 'SELECT')) {
    risks.push({ type: 'lost-db-writer', severity: 'CRITICAL', detail: 'Einziger Writer für Tabelle(n) könnte entfallen' });
  }
  if (semantics?.journeys?.length > 0) {
    risks.push({ type: 'journey-impact', severity: 'HIGH', detail: `Journeys betroffen: ${semantics.journeys.map(j => j.name).join(', ')}` });
  }

  const alternatives = [
    { action: 'deprecate', description: 'Datei als deprecated markieren statt löschen', risk: 'LOW' },
    { action: 'extract', description: 'Logik in Service extrahieren, UI-Datei entfernen', risk: 'MEDIUM' },
  ];

  return buildSimulationResult('deletion', { file: filePath }, scan, {
    affectedFiles: new Set([filePath, ...dependents]),
    newViolations: [],
    risks,
    alternatives,
  });
}

/**
 * Simuliert das Verschieben einer Datei.
 */
export function simulateMove({ file, toDomain, toPath }, scan) {
  const fromDomain = getDomainForPath('src/' + file);
  const newPath = toPath || file.replace(/^[^/]+/, toDomain.toLowerCase());
  const risks = [];
  const newViolations = [];

  if (fromDomain !== toDomain) {
    risks.push({ type: 'domain-change', severity: 'MEDIUM', detail: `Domain-Wechsel: ${fromDomain} → ${toDomain}` });

    const dependents = getDependents(file, scan.graph);
    for (const dep of dependents) {
      const depDomain = getDomainForPath('src/' + dep);
      const { allowed, reason } = isImportAllowed(depDomain, toDomain);
      if (!allowed) {
        newViolations.push({
          type: 'LAYER_VIOLATION',
          severity: 'HIGH',
          message: `Dependent ${dep} kann nach Move nicht mehr importieren (${reason})`,
          file: dep,
        });
      }
    }
  }

  const adrs = getAdrsForFile(file, scan.governance.adrs);

  return buildSimulationResult('move', { file, toPath: newPath, toDomain }, scan, {
    affectedFiles: new Set([file, ...getDependents(file, scan.graph)]),
    newViolations,
    risks,
    alternatives: [{ action: 'create-wrapper', description: 'Re-Export an alter Stelle für Rückwärtskompatibilität', risk: 'LOW' }],
  }, { adrsToUpdate: adrs.map(a => a.id) });
}

/**
 * Simuliert Umbenennung.
 */
export function simulateRename({ file, newName }, scan) {
  const dependents = getDependents(file, scan.graph);
  return buildSimulationResult('rename', { file, newName }, scan, {
    affectedFiles: new Set([file, ...dependents]),
    newViolations: [],
    risks: dependents.length > 0
      ? [{ type: 'import-update-required', severity: 'MEDIUM', detail: `${dependents.length} Imports müssen aktualisiert werden` }]
      : [],
    alternatives: [],
  });
}

/**
 * Simuliert Datei-Split.
 */
export function simulateSplit({ file, into }, scan) {
  const semantics = scan.semantics.get(file);
  return buildSimulationResult('split', { file, into }, scan, {
    affectedFiles: new Set([file, ...getDependents(file, scan.graph)]),
    newViolations: [],
    risks: [{ type: 'ownership-redistribution', severity: 'MEDIUM', detail: 'Verantwortlichkeiten müssen neu zugeordnet werden' }],
    alternatives: [{ action: 'incremental-split', description: 'Schrittweise extrahieren, alte Datei als Facade behalten', risk: 'LOW' }],
  }, {
    capabilitiesAffected: semantics?.capabilities || [],
  });
}

/**
 * Simuliert Datei-Merge.
 */
export function simulateMerge({ files, into }, scan) {
  const allDependents = files.flatMap(f => getDependents(f, scan.graph));
  const allTables = files.flatMap(f => getTablesForFile(f, scan.graph));

  return buildSimulationResult('merge', { files, into }, scan, {
    affectedFiles: new Set([...files, into, ...allDependents]),
    newViolations: [],
    risks: [
      { type: 'increased-complexity', severity: 'MEDIUM', detail: 'Größere Datei, schwerer wartbar' },
      ...(allTables.length > 0 ? [{ type: 'duplicate-writer-risk', severity: 'HIGH', detail: 'Merge könnte Duplicate Owner erzeugen' }] : []),
    ],
    alternatives: [{ action: 'shared-service', description: 'Gemeinsame Logik in Service, UI-Dateien getrennt lassen', risk: 'LOW' }],
  });
}

/**
 * Simuliert Ownership-Transfer.
 */
export function simulateOwnershipTransfer({ file, newOwner }, scan) {
  const semantics = scan.semantics.get(file);
  return buildSimulationResult('ownership_transfer', { file, newOwner }, scan, {
    affectedFiles: new Set([file]),
    newViolations: [],
    risks: [{ type: 'team-boundary', severity: 'LOW', detail: `Owner-Wechsel: ${semantics?.owner || 'unbekannt'} → ${newOwner}` }],
    alternatives: [],
  });
}

/**
 * Simuliert Layer-Move (Domain-Wechsel).
 */
export function simulateLayerMove({ file, toDomain }, scan) {
  return simulateMove({ file, toDomain }, scan);
}

/**
 * Universelle Simulate-Funktion.
 */
export function simulate(change, scan) {
  switch (change.type) {
    case 'deletion':           return simulateDeletion(change.file, scan);
    case 'move':               return simulateMove(change, scan);
    case 'rename':               return simulateRename(change, scan);
    case 'split':                return simulateSplit(change, scan);
    case 'merge':                return simulateMerge(change, scan);
    case 'ownership_transfer': return simulateOwnershipTransfer(change, scan);
    case 'layer_move':         return simulateLayerMove(change, scan);
    default:                     return simulateChange(change, scan);
  }
}

function buildSimulationResult(type, change, scan, base, extra = {}) {
  const affectedFiles = [...base.affectedFiles];
  const semantics = change.file ? scan.semantics.get(change.file) : null;

  const constitutionViolations = base.newViolations.filter(v => getRuleForViolationType(v.type));
  const rfcImpact = analyzeRfcImpact({ type, ...change }, scan.governance.rfcs);

  return {
    simulationType: type,
    change,
    summary: createStatement(
      `Simulation '${type}': ${affectedFiles.length} Dateien betroffen, ${base.newViolations.length} neue Violations, ${base.risks.length} Risiken`,
      { type: 'simulation' },
      SOURCE.DERIVED,
      CONFIDENCE.HIGH
    ),
    affectedFiles,
    affectedFileCount: affectedFiles.length,
    brokenServices: affectedFiles.filter(f => f.includes('services/') || f.includes('lib/')),
    capabilitiesAffected: semantics?.capabilities || extra.capabilitiesAffected || [],
    journeysAffected: semantics?.journeys || [],
    newViolations: base.newViolations,
    constitutionViolations,
    rfcImpact,
    adrsToUpdate: extra.adrsToUpdate || [],
    risks: base.risks,
    alternatives: base.alternatives,
    sources: [
      { type: 'knowledge-graph', ref: 'src/architecture/graph/knowledgeGraph.js' },
      ...(change.file ? [{ type: 'file', ref: change.file }] : []),
    ],
  };
}
