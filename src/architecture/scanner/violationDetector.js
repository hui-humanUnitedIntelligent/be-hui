// src/architecture/scanner/violationDetector.js
// ══════════════════════════════════════════════════════════════════════════════
// HUI Violation Detector — ARCH-001
//
// Analysiert Scan-Ergebnisse und identifiziert Architekturverstöße.
// Basiert auf: HUI Constitution, RFC-000, ADR-001
//
// Verstoß-Kategorien:
//   DB_DIRECT_WRITE   — direkter DB-Write in UI-Komponenten/Pages/Hooks
//   DB_DIRECT_READ    — direkter DB-Read in UI-Komponenten (außer Services)
//   DUPLICATE_OWNER   — mehrere Dateien schreiben dieselbe Tabelle
//   CORE_BYPASS       — Core-Tabelle direkt beschrieben statt über Core Engine
//   REGISTRY_BYPASS   — Farben/Labels hardcoded statt aus Registry
//   DIRECT_ROUTING    — window.location/history statt Action Engine
//   ACTION_ENGINE_GAP — navigate() ohne Action Engine
//   LAYER_VIOLATION   — Import entgegen der Schichten-Hierarchie
//   MISSING_HEADER    — Datei ohne @domain/@owner-Header
// ══════════════════════════════════════════════════════════════════════════════

import { getDomainForPath, isImportAllowed, DOMAINS } from './domains.js';
import { resolve, dirname } from 'path';

// Dateipfade die DÜRFEN direkt auf die DB schreiben (Service-Layer + Backend)
const ALLOWED_DIRECT_DB_PATHS = [
  'src/services/',
  'src/lib/AppStateContext',
  'src/lib/AuthContext',
  'src/lib/chatContext',
  'src/lib/bookingContext',
  'src/lib/trustContext',
  'src/lib/sessionHooks',
  'src/lib/referralTracking',
  'src/lib/notificationService',
  'src/lib/presence/',
  'src/lib/ambassadorUtils',
  'src/lib/profileMedia',
  'src/lib/resonance/',
  'src/lib/points/',
  'src/lib/security/',
  'src/lib/roles/',
  'functions/',
  'src/lib/supabaseClient',
  'src/lib/safeQuery',
  'src/hooks/useCoreEngine',
  'src/hooks/useAmbassador',
  'src/hooks/useTalentActivation',
  'src/hooks/useProfileData',
  'src/hooks/useProfileId',
];

// Dateipfade für die Direct-Routing-Ausnahmen gelten
const ALLOWED_DIRECT_ROUTING = [
  'src/lib/referralTracking',
  'src/lib/world/',
  'src/lib/ErrorBoundaries',
  'src/pages/RefRedirect',
];

// Severity-Stufen
export const SEVERITY = {
  CRITICAL: 'CRITICAL',  // Verhindert korrekte Architektur
  HIGH:     'HIGH',       // Verletzt Constitution-Regeln
  MEDIUM:   'MEDIUM',     // Technische Schuld
  LOW:      'LOW',        // Empfehlung / Best Practice
  INFO:     'INFO',       // Informativ
};

// ── Haupt-Analyse ─────────────────────────────────────────────────────────────

/**
 * Analysiert alle Scan-Ergebnisse und gibt Verstöße zurück.
 * @param {Map<string, FileScanResult>} scanResults — path → result
 * @returns {Violation[]}
 */
export function detectViolations(scanResults) {
  const violations = [];
  const allResults = [...scanResults.values()].filter(Boolean);

  // Tabellen-Owner-Map aufbauen (für DUPLICATE_OWNER)
  const tableWriters = buildTableWriterMap(allResults);

  for (const result of allResults) {
    const domain = getDomainForPath('src/' + result.path);

    violations.push(...checkDbDirectAccess(result, domain));
    violations.push(...checkCoreBypass(result, domain));
    violations.push(...checkDirectRouting(result, domain));
    violations.push(...checkRegistryBypass(result, domain));
    violations.push(...checkMissingHeader(result, domain));
    violations.push(...checkImportViolations(result, domain, scanResults));
  }

  violations.push(...checkDuplicateOwners(tableWriters));

  return violations.sort((a, b) => {
    const order = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3, INFO: 4 };
    return (order[a.severity] ?? 5) - (order[b.severity] ?? 5);
  });
}

// ── DB Direct Access ──────────────────────────────────────────────────────────
function checkDbDirectAccess(result, domain) {
  const violations = [];
  if (!result.supabaseCalls?.length) return violations;

  const isAllowed = ALLOWED_DIRECT_DB_PATHS.some(p => result.path.includes(p));
  if (isAllowed) return violations;

  // UI-Domains die NICHT direkt auf DB zugreifen sollten
  const uiDomains = new Set(['PAGES', 'COMPONENTS', 'FEATURES', 'HOOKS', 'CONTEXT']);
  if (!uiDomains.has(domain)) return violations;

  const writes = result.supabaseCalls.filter(c => c.operation !== 'SELECT');
  const reads  = result.supabaseCalls.filter(c => c.operation === 'SELECT');

  for (const w of writes) {
    violations.push({
      id:       `DB_DIRECT_WRITE_${result.path}_L${w.line}`,
      type:     'DB_DIRECT_WRITE',
      severity: SEVERITY.HIGH,
      file:     result.path,
      line:     w.line,
      domain,
      message:  `Direkter DB-Write (${w.operation}) auf '${w.table}' in ${domain}-Schicht. Verwende Service-Layer.`,
      detail:   w.raw,
      table:    w.table,
    });
  }

  for (const r of reads) {
    // Reads in UI sind MEDIUM (nicht HIGH) — oft akzeptiert
    violations.push({
      id:       `DB_DIRECT_READ_${result.path}_L${r.line}`,
      type:     'DB_DIRECT_READ',
      severity: SEVERITY.MEDIUM,
      file:     result.path,
      line:     r.line,
      domain,
      message:  `Direkter DB-Read auf '${r.table}' in ${domain}-Schicht. Erwäge Service-Layer.`,
      detail:   r.raw,
      table:    r.table,
    });
  }

  return violations;
}

// ── Core Bypass ───────────────────────────────────────────────────────────────
function checkCoreBypass(result, domain) {
  const violations = [];
  const coreBypasses = result.supabaseCalls?.filter(c =>
    c.isCoreTable && c.operation !== 'SELECT' &&
    !result.path.includes('src/core/') &&
    !result.path.includes('src/services/') &&
    !result.path.includes('src/lib/AppStateContext')
  ) || [];

  for (const bypass of coreBypasses) {
    violations.push({
      id:       `CORE_BYPASS_${result.path}_L${bypass.line}`,
      type:     'CORE_BYPASS',
      severity: SEVERITY.CRITICAL,
      file:     result.path,
      line:     bypass.line,
      domain,
      message:  `Core Bypass: Direkter Write auf Core-Tabelle '${bypass.table}'. Nutze Core Engine (coreEngine.js / resonanceEngine.js / orbEngine.js).`,
      detail:   bypass.raw,
      table:    bypass.table,
    });
  }
  return violations;
}

// ── Direct Routing ────────────────────────────────────────────────────────────
function checkDirectRouting(result, domain) {
  const violations = [];
  if (!result.directRouting?.length) return violations;

  const isAllowed = ALLOWED_DIRECT_ROUTING.some(p => result.path.includes(p));
  if (isAllowed) return violations;

  for (const r of result.directRouting) {
    violations.push({
      id:       `DIRECT_ROUTING_${result.path}_L${r.line}`,
      type:     'DIRECT_ROUTING',
      severity: SEVERITY.HIGH,
      file:     result.path,
      line:     r.line,
      domain,
      message:  `Direktes Routing via ${r.type} ohne Action Engine. Verwende useHuiActions() / navigate().`,
      detail:   r.raw,
    });
  }
  return violations;
}

// ── Registry Bypass ───────────────────────────────────────────────────────────
function checkRegistryBypass(result, domain) {
  const violations = [];
  // Nur UI-Komponenten und Pages prüfen (Services/Core erlaubt hardcoded)
  const uiDomains = new Set(['COMPONENTS', 'PAGES', 'FEATURES']);
  if (!uiDomains.has(domain)) return violations;

  // Sehr viele hardcoded Farben = potenzieller Registry Bypass
  if (result.hardcodedColors?.count > 10) {
    violations.push({
      id:       `REGISTRY_BYPASS_COLOR_${result.path}`,
      type:     'REGISTRY_BYPASS',
      severity: SEVERITY.LOW,
      file:     result.path,
      line:     null,
      domain,
      message:  `Registry Bypass (Farben): ${result.hardcodedColors.count} hardcodierte Farbwerte. Erwäge HuiRegistry oder Design Tokens.`,
      detail:   result.hardcodedColors.sample?.join(', '),
    });
  }
  return violations;
}

// ── Missing Header ────────────────────────────────────────────────────────────
function checkMissingHeader(result, domain) {
  const violations = [];
  // Nur nicht-triviale Dateien prüfen (min. 50 Zeilen)
  if (result.lines < 50) return violations;
  // Architecture-eigene Dateien ausnehmen
  if (result.path.startsWith('architecture/')) return violations;

  if (!result.header?.hasDomainTag || !result.header?.hasOwnerTag) {
    violations.push({
      id:       `MISSING_HEADER_${result.path}`,
      type:     'MISSING_HEADER',
      severity: SEVERITY.INFO,
      file:     result.path,
      line:     1,
      domain,
      message:  `Fehlende Architektur-Header: @domain=${!!result.header?.hasDomainTag} @owner=${!!result.header?.hasOwnerTag}`,
      detail:   'Füge @domain und @owner als JSDoc-Tags im Datei-Header hinzu.',
    });
  }
  return violations;
}

// ── Import Violations ─────────────────────────────────────────────────────────
function checkImportViolations(result, domain, scanResults) {
  const violations = [];
  if (!result.imports?.length) return violations;

  for (const imp of result.imports) {
    if (imp.type !== 'relative') continue;

    // Relativen Pfad zu src-relativem Pfad auflösen
    const sourceDir = dirname('src/' + result.path);
    let targetPath;
    try {
      targetPath = resolve(sourceDir, imp.source)
        .replace(/\\/g, '/')
        .replace(/^.*?src\//, 'src/');
    } catch { continue; }

    const targetDomain = getDomainForPath(targetPath);
    if (targetDomain === 'UNKNOWN' || targetDomain === domain) continue;

    const { allowed, reason } = isImportAllowed(domain, targetDomain);
    if (!allowed) {
      violations.push({
        id:       `LAYER_VIOLATION_${result.path}_${imp.source}`,
        type:     'LAYER_VIOLATION',
        severity: SEVERITY.HIGH,
        file:     result.path,
        line:     imp.line,
        domain,
        message:  `Layer Violation: ${domain} importiert aus ${targetDomain} (${reason}).`,
        detail:   `import from '${imp.source}'`,
        targetDomain,
      });
    }
  }
  return violations;
}

// ── Duplicate Owner ───────────────────────────────────────────────────────────
function buildTableWriterMap(allResults) {
  const map = new Map(); // table → Set<path>
  for (const result of allResults) {
    const writes = result.supabaseCalls?.filter(c =>
      ['INSERT', 'UPDATE', 'DELETE', 'UPSERT'].includes(c.operation)
    ) || [];
    for (const w of writes) {
      if (!map.has(w.table)) map.set(w.table, new Set());
      map.get(w.table).add(result.path);
    }
  }
  return map;
}

function checkDuplicateOwners(tableWriters) {
  const violations = [];
  for (const [table, writers] of tableWriters.entries()) {
    if (writers.size <= 1) continue;

    // Service-Layer-Dateien aus ALLOWED_DIRECT_DB_PATHS herausfiltern
    const nonServiceWriters = [...writers].filter(p =>
      !ALLOWED_DIRECT_DB_PATHS.some(allowed => p.includes(allowed))
    );

    if (nonServiceWriters.length > 0) {
      violations.push({
        id:       `DUPLICATE_OWNER_${table}`,
        type:     'DUPLICATE_OWNER',
        severity: SEVERITY.HIGH,
        file:     [...writers][0],
        line:     null,
        domain:   'MULTI',
        message:  `Duplicate Owner für Tabelle '${table}': ${writers.size} Dateien schreiben diese Tabelle.`,
        detail:   [...writers].join(', '),
        table,
        writers:  [...writers],
      });
    }
  }
  return violations;
}
