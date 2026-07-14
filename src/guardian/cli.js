#!/usr/bin/env node
// src/guardian/cli.js
// ══════════════════════════════════════════════════════════════════════════════
// HUI Release Guardian CLI — GUARD-001
//
// Verwendung:
//   node src/guardian/cli.js
//   npm run release-guardian
//   npm run release-guardian:report
//
// Flags:
//   --base-branch=main     Basis-Branch für Diff (Standard: main)
//   --skip-build           Build überspringen (dist/ muss existieren)
//   --format=text|md|json  Ausgabeformat (Standard: text)
//   --output=PATH          Report in Datei schreiben
//   --quiet                Nur ERGEBNIS-Zeile ausgeben
//
// Exit-Codes:
//   0 — VERIFIZIERT
//   1 — NICHT VERIFIZIERT oder fehlgeschlagene Checks
// ══════════════════════════════════════════════════════════════════════════════

import { mkdirSync, writeFileSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { runGuardian } from './index.js';
import { formatTextReport, formatMarkdownReport } from './report.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '../..');
const DOCS_OUT = join(PROJECT_ROOT, 'docs', 'generated');

const args = process.argv.slice(2);
const BASE_BRANCH = (args.find(a => a.startsWith('--base-branch=')) || '--base-branch=main').split('=')[1];
const SKIP_BUILD = args.includes('--skip-build');
const FORMAT = (args.find(a => a.startsWith('--format=')) || '--format=text').split('=')[1];
const OUTPUT = args.find(a => a.startsWith('--output='))?.split('=').slice(1).join('=');
const QUIET = args.includes('--quiet');

async function main() {
  if (!QUIET) {
    console.log('');
    console.log('╔════════════════════════════════════════════════════╗');
    console.log('║   HUI Release Guardian — GUARD-001 v1.0            ║');
    console.log('║   Grundlage: HUI_CONSTITUTION.md                   ║');
    console.log('╚════════════════════════════════════════════════════╝');
    console.log('');
  }

  const report = await runGuardian(PROJECT_ROOT, {
    baseBranch: BASE_BRANCH,
    skipBuild: SKIP_BUILD,
  });

  let output;
  switch (FORMAT) {
    case 'json':
      output = JSON.stringify(report, null, 2);
      break;
    case 'md':
    case 'markdown':
      output = formatMarkdownReport(report);
      break;
    default:
      output = formatTextReport(report);
  }

  if (OUTPUT) {
    const outPath = resolve(OUTPUT);
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, output, 'utf8');
    if (!QUIET) console.log(`Report geschrieben: ${outPath}`);
  } else if (FORMAT === 'md' || FORMAT === 'markdown') {
    mkdirSync(DOCS_OUT, { recursive: true });
    const defaultPath = join(DOCS_OUT, 'release-guardian-report.md');
    writeFileSync(defaultPath, output, 'utf8');
    if (!QUIET) {
      console.log(formatTextReport(report));
      console.log('');
      console.log(`Markdown-Report: docs/generated/release-guardian-report.md`);
    }
  } else if (!QUIET) {
    console.log(output);
  } else {
    console.log(report.ergebnis);
  }

  // JSON immer zusätzlich schreiben
  if (!QUIET && FORMAT !== 'json') {
    mkdirSync(DOCS_OUT, { recursive: true });
    writeFileSync(join(DOCS_OUT, 'release-guardian-report.json'), JSON.stringify(report, null, 2), 'utf8');
  }

  const exitCode = report.primaryStatus === 'VERIFIZIERT' ? 0 : 1;
  if (!QUIET) {
    console.log('');
    console.log(exitCode === 0 ? '✅ VERIFIZIERT' : '❌ NICHT VERIFIZIERT');
  }
  process.exit(exitCode);
}

main().catch(err => {
  console.error('Guardian-Fehler:', err);
  process.exit(1);
});
