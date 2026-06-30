// src/architecture/scanner/reportGenerator.js
// ══════════════════════════════════════════════════════════════════════════════
// HUI Report Generator — ARCH-001
// Generiert Markdown-Reports aus Scan-Ergebnissen und Metriken.
// ══════════════════════════════════════════════════════════════════════════════

import { DOMAINS } from './domains.js';

const REPORT_HEADER = (title, release = 'ARCH-001') =>
`# ${title}

> **Automatisch generiert** — HUI Architecture Scanner (${release})
> **Datum:** ${new Date().toISOString().split('T')[0]}
> ⚠️ Diese Datei ist autogeneriert. Änderungen werden beim nächsten \`npm run architecture:audit\` überschrieben.

`;

// ── Architecture Report ───────────────────────────────────────────────────────
export function generateArchitectureReport(metrics, violations, results) {
  const m = metrics;
  const lines = [REPORT_HEADER('HUI Architecture Report')];

  lines.push('## Übersicht\n');
  lines.push('| Metrik | Wert |');
  lines.push('|---|---|');
  lines.push(`| Dateien total | ${m.totalFiles} |`);
  lines.push(`| Codezeilen total | ${m.totalLines.toLocaleString()} |`);
  lines.push(`| Domains | ${m.totalDomains} |`);
  lines.push(`| Komponenten | ${m.totalComponents} |`);
  lines.push(`| Hooks | ${m.totalHooks} |`);
  lines.push(`| DB Reads | ${m.dbReads} |`);
  lines.push(`| DB Writes | ${m.dbWrites} |`);
  lines.push(`| DB Tabellen | ${m.dbTables} |`);
  lines.push(`| Direkte DB-Writes in UI | ${m.dbDirectInUI} |`);
  lines.push(`| Duplicate Owners | ${m.duplicateOwners} |`);
  lines.push(`| Verstöße gesamt | **${m.totalViolations}** |`);
  lines.push(`| CRITICAL | 🔴 ${m.criticalViolations} |`);
  lines.push(`| HIGH | 🟠 ${m.highViolations} |`);
  lines.push(`| MEDIUM | 🟡 ${m.mediumViolations} |`);
  lines.push(`| LOW | 🔵 ${m.lowViolations} |`);
  lines.push(`| INFO | ⚪ ${m.infoViolations} |`);
  lines.push('');

  lines.push('## Adoption\n');
  lines.push('| System | Dateien | % |');
  lines.push('|---|---|---|');
  lines.push(`| Action Engine | ${m.actionEngineFiles} | ${m.actionEnginePct}% |`);
  lines.push(`| Core Engine | ${m.coreEngineFiles} | ${m.coreEnginePct}% |`);
  lines.push(`| Registry | ${m.registryFiles} | ${m.registryPct}% |`);
  lines.push(`| Ownership Coverage | ${m.filesWithOwnerHeader} | ${m.ownershipCoveragePct}% |`);
  lines.push(`| Architecture Coverage | — | ${m.architectureCoveragePct}% |`);
  lines.push('');

  lines.push('## Domain-Übersicht\n');
  lines.push('| Domain | Dateien | Zeilen | Komponenten | Hooks | DB Reads | DB Writes | Verstöße |');
  lines.push('|---|---|---|---|---|---|---|---|');
  for (const [domainId, dm] of Object.entries(m.byDomain || {})) {
    lines.push(`| ${dm.label} | ${dm.files} | ${dm.lines} | ${dm.components} | ${dm.hooks} | ${dm.dbReads} | ${dm.dbWrites} | ${dm.violations} |`);
  }
  lines.push('');

  lines.push('## Top-Verstöße\n');
  const top = violations.slice(0, 20);
  if (top.length === 0) {
    lines.push('✅ Keine kritischen Verstöße gefunden.\n');
  } else {
    lines.push('| Schwere | Typ | Datei | Zeile | Nachricht |');
    lines.push('|---|---|---|---|---|');
    for (const v of top) {
      const sev = { CRITICAL: '🔴', HIGH: '🟠', MEDIUM: '🟡', LOW: '🔵', INFO: '⚪' }[v.severity] || '?';
      lines.push(`| ${sev} ${v.severity} | ${v.type} | \`${v.file}\` | ${v.line ?? '—'} | ${v.message.replace(/\|/g, '/')} |`);
    }
  }
  lines.push('');

  return lines.join('\n');
}

// ── Ownership Report ──────────────────────────────────────────────────────────
export function generateOwnershipReport(results, metrics) {
  const lines = [REPORT_HEADER('HUI Ownership Report')];

  lines.push(`## Coverage: ${metrics.ownershipCoveragePct}%\n`);
  lines.push(`${metrics.filesWithOwnerHeader} von ${results.filter(r => r.lines >= 50).length} relevanten Dateien haben @domain + @owner Header.\n`);

  lines.push('## Dateien MIT Header\n');
  const withHeader = results.filter(r => r.header?.hasDomainTag && r.header?.hasOwnerTag);
  lines.push('| Datei | Domain | Owner |');
  lines.push('|---|---|---|');
  for (const r of withHeader.slice(0, 50)) {
    lines.push(`| \`${r.path}\` | ${r.header.domain || '?'} | ${r.header.owner || '?'} |`);
  }
  if (withHeader.length > 50) lines.push(`\n*... und ${withHeader.length - 50} weitere*`);
  lines.push('');

  lines.push('## Dateien OHNE Header (>50 Zeilen)\n');
  const withoutHeader = results.filter(r =>
    r.lines >= 50 &&
    (!r.header?.hasDomainTag || !r.header?.hasOwnerTag) &&
    !r.path.startsWith('architecture/')
  );
  lines.push('| Datei | Zeilen | Domain (auto) |');
  lines.push('|---|---|---|');
  for (const r of withoutHeader.slice(0, 100)) {
    const domain = r.path.includes('src/') ? r.path.split('/')[0] : 'UNKNOWN';
    lines.push(`| \`${r.path}\` | ${r.lines} | ${domain} |`);
  }
  if (withoutHeader.length > 100) lines.push(`\n*... und ${withoutHeader.length - 100} weitere*`);
  lines.push('');

  return lines.join('\n');
}

// ── Violations Report ─────────────────────────────────────────────────────────
export function generateViolationsReport(violations, metrics) {
  const lines = [REPORT_HEADER('HUI Violations Report')];

  lines.push(`## Zusammenfassung\n`);
  lines.push(`| Severity | Anzahl |`);
  lines.push(`|---|---|`);
  lines.push(`| 🔴 CRITICAL | ${metrics.criticalViolations} |`);
  lines.push(`| 🟠 HIGH | ${metrics.highViolations} |`);
  lines.push(`| 🟡 MEDIUM | ${metrics.mediumViolations} |`);
  lines.push(`| 🔵 LOW | ${metrics.lowViolations} |`);
  lines.push(`| ⚪ INFO | ${metrics.infoViolations} |`);
  lines.push(`| **Gesamt** | **${metrics.totalViolations}** |`);
  lines.push('');

  const types = [...new Set(violations.map(v => v.type))];
  for (const type of types) {
    const typeViolations = violations.filter(v => v.type === type);
    lines.push(`## ${type} (${typeViolations.length})\n`);
    for (const v of typeViolations) {
      const sev = { CRITICAL: '🔴', HIGH: '🟠', MEDIUM: '🟡', LOW: '🔵', INFO: '⚪' }[v.severity] || '?';
      lines.push(`### ${sev} \`${v.file}\`${v.line ? ` L${v.line}` : ''}`);
      lines.push(`**${v.message}**\n`);
      if (v.detail) lines.push(`\`\`\`\n${v.detail}\n\`\`\``);
      lines.push('');
    }
  }

  return lines.join('\n');
}

// ── Action Engine Report ──────────────────────────────────────────────────────
export function generateActionEngineReport(results, metrics) {
  const lines = [REPORT_HEADER('HUI Action Engine Report')];

  lines.push(`## Adoption: ${metrics.actionEnginePct}%\n`);
  lines.push(`${metrics.actionEngineFiles} von ${results.length} Dateien nutzen die Action Engine.\n`);
  lines.push(`Gesamte Action Engine Aufrufe: **${metrics.actionEngineTotal}**\n`);

  lines.push('## Dateien MIT Action Engine\n');
  lines.push('| Datei | Uses |');
  lines.push('|---|---|');
  const adopted = results.filter(r => r.actionEngine?.adopted)
    .sort((a, b) => (b.actionEngine?.uses || 0) - (a.actionEngine?.uses || 0));
  for (const r of adopted.slice(0, 30)) {
    lines.push(`| \`${r.path}\` | ${r.actionEngine?.uses || 0} |`);
  }
  lines.push('');

  lines.push('## Direkte navigate() ohne Action Engine\n');
  lines.push('| Datei | Aufrufe | Ziel |');
  lines.push('|---|---|---|');
  const directNav = results.filter(r => (r.navigateCalls?.length || 0) > 0 && !r.actionEngine?.adopted);
  for (const r of directNav.slice(0, 30)) {
    const targets = r.navigateCalls.map(c => c.target).join(', ');
    lines.push(`| \`${r.path}\` | ${r.navigateCalls.length} | ${targets.slice(0, 80)} |`);
  }
  lines.push('');

  return lines.join('\n');
}

// ── Registry Report ───────────────────────────────────────────────────────────
export function generateRegistryReport(results, metrics) {
  const lines = [REPORT_HEADER('HUI Registry Report')];

  lines.push(`## Adoption: ${metrics.registryPct}%\n`);
  lines.push(`${metrics.registryFiles} Dateien nutzen HuiRegistry.\n`);

  lines.push('## Registry-konforme Dateien\n');
  lines.push('| Datei | Uses |');
  lines.push('|---|---|');
  const adopted = results.filter(r => r.registryUsage?.adopted)
    .sort((a, b) => (b.registryUsage?.uses || 0) - (a.registryUsage?.uses || 0));
  for (const r of adopted.slice(0, 30)) {
    lines.push(`| \`${r.path}\` | ${r.registryUsage?.uses || 0} |`);
  }
  lines.push('');

  lines.push('## Potenzielle Registry Bypasses (>10 hardcodierte Farben)\n');
  lines.push('| Datei | Farben | Beispiele |');
  lines.push('|---|---|---|');
  const bypasses = results.filter(r => (r.hardcodedColors?.count || 0) > 10)
    .sort((a, b) => (b.hardcodedColors?.count || 0) - (a.hardcodedColors?.count || 0));
  for (const r of bypasses.slice(0, 30)) {
    lines.push(`| \`${r.path}\` | ${r.hardcodedColors?.count} | ${r.hardcodedColors?.sample?.join(', ')} |`);
  }
  lines.push('');

  return lines.join('\n');
}

// ── Core Report ───────────────────────────────────────────────────────────────
export function generateCoreReport(results, metrics) {
  const lines = [REPORT_HEADER('HUI Core Engine Report')];

  lines.push(`## Adoption: ${metrics.coreEnginePct}%\n`);
  lines.push(`${metrics.coreEngineFiles} Dateien nutzen Core Engines.\n`);

  lines.push('## Core Engine Verwendung\n');
  lines.push('| Datei | Uses |');
  lines.push('|---|---|');
  const coreUsers = results.filter(r => r.coreEngine?.adopted)
    .sort((a, b) => (b.coreEngine?.uses || 0) - (a.coreEngine?.uses || 0));
  for (const r of coreUsers) {
    lines.push(`| \`${r.path}\` | ${r.coreEngine?.uses || 0} |`);
  }
  lines.push('');

  lines.push('## DB-Zugriffe auf Core-Tabellen\n');
  lines.push('| Datei | Tabelle | Operation | Zeile |');
  lines.push('|---|---|---|---|');
  for (const r of results) {
    const coreCalls = (r.supabaseCalls || []).filter(c => c.isCoreTable);
    for (const c of coreCalls) {
      lines.push(`| \`${r.path}\` | ${c.table} | ${c.operation} | ${c.line} |`);
    }
  }
  lines.push('');

  return lines.join('\n');
}

// ── Dependency Graph Report ───────────────────────────────────────────────────
export function generateDependencyGraphReport(graphs) {
  const lines = [REPORT_HEADER('HUI Dependency Graph')];
  lines.push('## Dependency Graph (Top Dateien)\n');
  lines.push(graphs.dependency);
  lines.push('');
  lines.push('## Domain Graph\n');
  lines.push(graphs.domain);
  lines.push('');
  lines.push('## Layer Graph\n');
  lines.push(graphs.layer);
  lines.push('');
  lines.push('## Service Graph\n');
  lines.push(graphs.service);
  lines.push('');
  lines.push('## Ownership Distribution\n');
  lines.push(graphs.ownership);
  lines.push('');
  return lines.join('\n');
}
