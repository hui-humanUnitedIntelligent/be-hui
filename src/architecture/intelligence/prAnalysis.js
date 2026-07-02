// src/architecture/intelligence/prAnalysis.js
// ══════════════════════════════════════════════════════════════════════════════
// Pull Request Intelligence — ARCH-003
// Analysiert PR-Diffs auf Architektur-Verstöße.
// ══════════════════════════════════════════════════════════════════════════════

import { getDomainForPath, isImportAllowed } from '../scanner/domains.js';
import { getRuleForViolationType } from '../governance/constitution.js';
import { createStatement, SOURCE, CONFIDENCE } from './confidence.js';

const PR_CHECK_TYPES = Object.freeze([
  'LAYER_VIOLATION',
  'DB_DIRECT_WRITE',
  'CORE_BYPASS',
  'DUPLICATE_OWNER',
  'DIRECT_ROUTING',
  'REGISTRY_BYPASS',
]);

/**
 * Parst einen einfachen Unified-Diff-String.
 * @param {string} diff
 * @returns {Array<{ file: string, additions: string[], deletions: string[] }>}
 */
export function parseDiff(diff) {
  const files = [];
  let current = null;

  for (const line of diff.split('\n')) {
    if (line.startsWith('+++ b/') || line.startsWith('--- a/')) {
      const file = line.slice(6).trim();
      if (line.startsWith('+++')) {
        current = { file: file.replace(/^src\//, ''), additions: [], deletions: [] };
        files.push(current);
      }
    } else if (current && line.startsWith('+') && !line.startsWith('+++')) {
      current.additions.push(line.slice(1));
    } else if (current && line.startsWith('-') && !line.startsWith('---')) {
      current.deletions.push(line.slice(1));
    }
  }

  return files;
}

/**
 * Analysiert geänderte Dateien auf neue Architektur-Verstöße.
 * @param {Array<{ file: string, additions: string[], deletions: string[] }>} changedFiles
 * @param {ScanReport} scan
 */
export function analyzeChangedFiles(changedFiles, scan) {
  const findings = [];

  for (const change of changedFiles) {
    const filePath = change.file;
    const domain = getDomainForPath('src/' + filePath);
    const existingViolations = scan.violations.filter(v => v.file === filePath);

    // Neue DB-Writes in Additions
    for (const line of change.additions) {
      const dbMatch = line.match(/supabase\.from\(['"](\w+)['"]\)\.(insert|update|delete|upsert)/i);
      if (dbMatch) {
        const [, table, operation] = dbMatch;
        const uiDomains = new Set(['PAGES', 'COMPONENTS', 'FEATURES', 'HOOKS', 'CONTEXT']);
        if (uiDomains.has(domain)) {
          findings.push(buildFinding('DB_DIRECT_WRITE', filePath, line, domain, scan));
        }

        const CORE_TABLES = new Set(['profiles', 'wirker_profiles', 'impact_pool', 'impact_votes', 'orb_states', 'resonance_signals', 'core_metrics']);
        if (CORE_TABLES.has(table) && !filePath.includes('core/') && !filePath.includes('services/')) {
          findings.push(buildFinding('CORE_BYPASS', filePath, line, domain, scan, { table }));
        }
      }

      // Direct routing
      if (/window\.location|history\.(push|replace)/.test(line)) {
        findings.push(buildFinding('DIRECT_ROUTING', filePath, line, domain, scan));
      }

      // Hardcoded colors
      if (/#([0-9A-Fa-f]{3,8})\b/.test(line) && (domain === 'COMPONENTS' || domain === 'PAGES')) {
        findings.push(buildFinding('REGISTRY_BYPASS', filePath, line, domain, scan));
      }

      // Import analysis
      const importMatch = line.match(/import\s+.*from\s+['"](\.[^'"]+)['"]/);
      if (importMatch) {
        const targetPath = resolveImportFromFile(filePath, importMatch[1]);
        if (targetPath) {
          const targetDomain = getDomainForPath('src/' + targetPath);
          const { allowed, reason } = isImportAllowed(domain, targetDomain);
          if (!allowed) {
            findings.push(buildFinding('LAYER_VIOLATION', filePath, line, domain, scan, { targetDomain, reason }));
          }
        }
      }
    }

    // Bestehende Violations in geänderten Dateien
    for (const v of existingViolations) {
      if (PR_CHECK_TYPES.includes(v.type)) {
        findings.push({
          ...buildFinding(v.type, filePath, v.detail || v.message, domain, scan),
          existing: true,
          violationId: v.id,
        });
      }
    }
  }

  return deduplicateFindings(findings);
}

/**
 * Analysiert einen Pull Request.
 * @param {{ diff?: string, changedFiles?: string[], title?: string }} pr
 * @param {ScanReport} scan
 */
export function analyzePullRequest(pr, scan) {
  let changedFiles;

  if (pr.diff) {
    changedFiles = parseDiff(pr.diff);
  } else if (pr.changedFiles) {
    changedFiles = pr.changedFiles.map(f => ({ file: f.replace(/^src\//, ''), additions: [], deletions: [] }));
  } else {
    return { error: 'diff oder changedFiles erforderlich' };
  }

  const findings = analyzeChangedFiles(changedFiles, scan);
  const newFindings = findings.filter(f => !f.existing);
  const existingFindings = findings.filter(f => f.existing);

  const blockMerge = newFindings.some(f => f.severity === 'CRITICAL') ||
    newFindings.filter(f => f.severity === 'HIGH').length >= 3;

  return {
    title: pr.title || 'Pull Request Analysis',
    analyzedAt: new Date().toISOString(),
    changedFileCount: changedFiles.length,
    summary: createStatement(
      `${changedFiles.length} Dateien geändert, ${newFindings.length} neue Findings (${newFindings.filter(f => f.severity === 'CRITICAL').length} CRITICAL)`,
      { type: 'pr-analysis' },
      SOURCE.DERIVED,
      CONFIDENCE.HIGH
    ),
    findings,
    newFindings,
    existingFindings,
    blockMerge,
    blockReason: blockMerge
      ? `Kritische Architektur-Verstöße: ${newFindings.filter(f => f.severity === 'CRITICAL').map(f => f.type).join(', ')}`
      : null,
    recommendations: newFindings
      .filter(f => f.severity === 'CRITICAL' || f.severity === 'HIGH')
      .slice(0, 10)
      .map(f => ({
        finding: f.type,
        file: f.file,
        remediation: f.remediation,
        rule: f.rule,
        adr: f.adr,
      })),
    categories: summarizeCategories(findings),
  };
}

function buildFinding(type, file, detail, domain, scan, extra = {}) {
  const rule = getRuleForViolationType(type);
  const severityMap = { CORE_BYPASS: 'CRITICAL', DB_DIRECT_WRITE: 'HIGH', LAYER_VIOLATION: 'HIGH', DUPLICATE_OWNER: 'HIGH', DIRECT_ROUTING: 'HIGH', REGISTRY_BYPASS: 'LOW' };

  return {
    type,
    severity: severityMap[type] || 'MEDIUM',
    file,
    domain,
    detail: detail?.slice?.(0, 200) || detail,
    why: rule?.title || type,
    rule: rule ? { id: rule.id, title: rule.title, constitutionRef: rule.constitutionRef } : null,
    constitution: rule?.constitutionRef || 'HUI_CONSTITUTION.md',
    adr: scan.governance.adrs.find(a => a.violationTypes.includes(type))?.id || null,
    remediation: getRemediation(type),
    existing: false,
    ...extra,
  };
}

function getRemediation(type) {
  const map = {
    CORE_BYPASS: 'DB-Write nach ContentService verschieben. Action über useHuiActions dispatchen.',
    DB_DIRECT_WRITE: 'DB-Write in src/services/ verschieben.',
    LAYER_VIOLATION: 'Import-Richtung korrigieren oder Logik in erlaubte Schicht extrahieren.',
    DIRECT_ROUTING: 'useHuiActions() statt window.location nutzen.',
    REGISTRY_BYPASS: 'HuiRegistry oder Design Tokens nutzen.',
    DUPLICATE_OWNER: 'Single Ownership über Service-Layer herstellen.',
  };
  return map[type] || 'HUI Constitution und RFC-000 prüfen.';
}

function resolveImportFromFile(fromPath, importSource) {
  const parts = fromPath.split('/');
  parts.pop();
  for (const seg of importSource.split('/')) {
    if (seg === '.') continue;
    if (seg === '..') parts.pop();
    else parts.push(seg);
  }
  return parts.join('/');
}

function deduplicateFindings(findings) {
  const seen = new Set();
  return findings.filter(f => {
    const key = `${f.type}:${f.file}:${f.detail?.slice?.(0, 50)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function summarizeCategories(findings) {
  const cats = {};
  for (const f of findings) {
    cats[f.type] = (cats[f.type] || 0) + 1;
  }
  return cats;
}
