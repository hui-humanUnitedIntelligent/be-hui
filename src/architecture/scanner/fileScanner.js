// src/architecture/scanner/fileScanner.js
// ══════════════════════════════════════════════════════════════════════════════
// HUI File Scanner — ARCH-001
//
// Liest alle JS/JSX-Dateien im src/-Verzeichnis und extrahiert:
//   - Imports / Exports
//   - React-Komponenten (function + arrow + class)
//   - Hooks (use*)
//   - supabase.from()-Calls (SELECT/INSERT/UPDATE/DELETE/UPSERT)
//   - navigate()-Calls
//   - window.location / history.*-Calls
//   - useState / useReducer / Context Provider
//   - @domain / @owner / @responsibility Header-Tags
//   - useHuiActions / dispatch() Action-Engine-Nutzung
//   - Hardcoded Farben / Labels (Registry Bypass)
//   - Core Engine Nutzung (useCoreEngine, coreEngine, resonanceEngine, orbEngine)
// ══════════════════════════════════════════════════════════════════════════════

import { readFileSync } from 'fs';
import { join, relative, extname, basename } from 'path';
import { readdirSync, statSync } from 'fs';

// ── Konstanten ────────────────────────────────────────────────────────────────

// Tabellen die als "Core"-Tabellen gelten (direkter Write = Core Bypass)
const CORE_TABLES = new Set([
  'profiles', 'wirker_profiles', 'impact_pool', 'impact_votes',
  'orb_states', 'resonance_signals', 'core_metrics',
]);

// Bekannte Farb-Pattern (hex, rgb, rgba) — Registry Bypass Detection
const COLOR_PATTERN = /#([0-9A-Fa-f]{3,8})\b|rgb\(|rgba\(/g;

// Action Engine Signale
const ACTION_ENGINE_PATTERNS = [
  /useHuiActions\s*\(/,
  /dispatch\s*\(\s*[A-Z_]+\s*[,)]/,
  /actions\.[A-Z_]+/,
  /\bA\.[A-Z_]+\b/,
];

// Core Engine Signale
const CORE_ENGINE_PATTERNS = [
  /useCoreEngine\s*\(/,
  /coreEngine\./,
  /resonanceEngine\./,
  /orbEngine\./,
  /useOrbParams\s*\(/,
  /useCoreProfile\s*\(/,
];

// Registry Signale
const REGISTRY_PATTERNS = [
  /HuiRegistry\./,
  /from ['"].*registry\/HuiRegistry/,
  /PILLARS\[/,
  /PILLAR_TRAITS\[/,
  /from ['"].*hui\.pillars/,
];

// ── Datei-Parsing ─────────────────────────────────────────────────────────────

/**
 * Parst eine einzelne Datei und gibt eine vollständige Analyse zurück.
 * @param {string} filePath — absoluter Pfad
 * @param {string} srcRoot  — absoluter Pfad zum src/-Verzeichnis
 * @returns {FileScanResult}
 */
export function scanFile(filePath, srcRoot) {
  let content;
  try {
    content = readFileSync(filePath, 'utf8');
  } catch {
    return null;
  }

  const relativePath = relative(srcRoot, filePath).replace(/\\/g, '/');
  const lines = content.split('\n');

  return {
    path:         relativePath,
    absolutePath: filePath,
    ext:          extname(filePath),
    name:         basename(filePath),
    lines:        lines.length,
    header:       extractHeader(content),
    imports:      extractImports(content, relativePath),
    exports:      extractExports(content),
    components:   extractComponents(content),
    hooks:        extractHooks(content),
    supabaseCalls: extractSupabaseCalls(content, lines),
    navigateCalls: extractNavigateCalls(content, lines),
    directRouting: extractDirectRouting(content, lines),
    statePatterns: extractStatePatterns(content),
    actionEngine:  extractActionEngine(content),
    coreEngine:    extractCoreEngine(content),
    registryUsage: extractRegistryUsage(content),
    hardcodedColors: extractHardcodedColors(content),
    hardcodedLabels: extractHardcodedLabels(content),
  };
}

// ── Header Tags ───────────────────────────────────────────────────────────────
function extractHeader(content) {
  const first200 = content.slice(0, 2000);
  return {
    hasDomainTag:      /@domain\s/i.test(first200),
    hasOwnerTag:       /@owner\s/i.test(first200),
    hasResponsibility: /@responsibility\s/i.test(first200),
    domain:    (first200.match(/@domain\s+(\S+)/i) || [])[1] || null,
    owner:     (first200.match(/@owner\s+(\S+)/i) || [])[1] || null,
    responsibility: (first200.match(/@responsibility\s+(.+)/i) || [])[1]?.trim() || null,
  };
}

// ── Imports ───────────────────────────────────────────────────────────────────
function extractImports(content, selfPath) {
  const imports = [];
  // ES6 static imports
  const staticRe = /^import\s+(?:[\s\S]*?\s+from\s+)?['"]([^'"]+)['"]/gm;
  let m;
  while ((m = staticRe.exec(content)) !== null) {
    imports.push({
      source: m[1],
      type:   m[1].startsWith('.') ? 'relative' : 'package',
      line:   content.slice(0, m.index).split('\n').length,
    });
  }
  // Dynamic imports
  const dynRe = /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  while ((m = dynRe.exec(content)) !== null) {
    imports.push({
      source: m[1],
      type:   'dynamic',
      line:   content.slice(0, m.index).split('\n').length,
    });
  }
  return imports;
}

// ── Exports ───────────────────────────────────────────────────────────────────
function extractExports(content) {
  const exports = [];
  const re = /^export\s+(?:default\s+)?(?:function\s+(\w+)|class\s+(\w+)|const\s+(\w+)|let\s+(\w+)|var\s+(\w+)|\{\s*([^}]+)\})/gm;
  let m;
  while ((m = re.exec(content)) !== null) {
    const name = m[1] || m[2] || m[3] || m[4] || m[5] || m[6]?.trim();
    if (name) exports.push({ name: name.trim(), isDefault: m[0].includes('default') });
  }
  return exports;
}

// ── React Components ──────────────────────────────────────────────────────────
function extractComponents(content) {
  const components = new Set();
  // function Component() { return <...> }
  const fnRe = /(?:export\s+(?:default\s+)?)?function\s+([A-Z][A-Za-z0-9]*)\s*\(/g;
  let m;
  while ((m = fnRe.exec(content)) !== null) {
    if (/return\s*\(?\s*</.test(content.slice(m.index, m.index + 3000))) {
      components.add(m[1]);
    }
  }
  // const Component = (...) => <...> / (...) => { return <...> }
  const arrowRe = /(?:export\s+)?const\s+([A-Z][A-Za-z0-9]*)\s*=\s*(?:\([^)]*\)|[a-zA-Z_$]\w*)\s*=>/g;
  while ((m = arrowRe.exec(content)) !== null) {
    const body = content.slice(m.index, m.index + 3000);
    if (/<\w/.test(body)) components.add(m[1]);
  }
  return [...components];
}

// ── Hooks ─────────────────────────────────────────────────────────────────────
function extractHooks(content) {
  const hooks = new Set();
  const re = /(?:export\s+)?(?:default\s+)?function\s+(use[A-Z][A-Za-z0-9]*)\s*\(/g;
  let m;
  while ((m = re.exec(content)) !== null) hooks.add(m[1]);
  // Arrow hooks
  const arrowRe = /(?:export\s+)?const\s+(use[A-Z][A-Za-z0-9]*)\s*=/g;
  while ((m = arrowRe.exec(content)) !== null) hooks.add(m[1]);
  return [...hooks];
}

// ── Supabase Calls ────────────────────────────────────────────────────────────
function extractSupabaseCalls(content, lines) {
  const calls = [];
  const re = /supabase\s*\.\s*from\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g;
  let m;
  while ((m = re.exec(content)) !== null) {
    const lineIdx = content.slice(0, m.index).split('\n').length - 1;
    const surrounding = lines.slice(Math.max(0, lineIdx - 1), lineIdx + 5).join('\n');
    const op = detectSupabaseOperation(surrounding);
    calls.push({
      table: m[1],
      operation: op,
      line: lineIdx + 1,
      raw: lines[lineIdx]?.trim().slice(0, 120),
      isCoreTable: CORE_TABLES.has(m[1]),
    });
  }
  return calls;
}

function detectSupabaseOperation(context) {
  if (/\.upsert\s*\(/.test(context)) return 'UPSERT';
  if (/\.insert\s*\(/.test(context)) return 'INSERT';
  if (/\.update\s*\(/.test(context)) return 'UPDATE';
  if (/\.delete\s*\(/.test(context)) return 'DELETE';
  if (/\.select\s*\(/.test(context)) return 'SELECT';
  return 'UNKNOWN';
}

// ── Navigate Calls ────────────────────────────────────────────────────────────
function extractNavigateCalls(content, lines) {
  const calls = [];
  const re = /\bnavigate\s*\(\s*(['"`][^'"`]+['"`])/g;
  let m;
  while ((m = re.exec(content)) !== null) {
    const lineIdx = content.slice(0, m.index).split('\n').length - 1;
    calls.push({
      target: m[1].replace(/['"`]/g, ''),
      line: lineIdx + 1,
      raw: lines[lineIdx]?.trim().slice(0, 120),
    });
  }
  return calls;
}

// ── Direktes Routing (window.location, history.*) ─────────────────────────────
function extractDirectRouting(content, lines) {
  const calls = [];
  const patterns = [
    { re: /window\.location\.(?:href|assign|replace)\s*=/, type: 'window.location' },
    { re: /window\.location\.(?:href|assign|replace)\s*\(/, type: 'window.location' },
    { re: /history\.push\s*\(/, type: 'history.push' },
    { re: /history\.replace\s*\(/, type: 'history.replace' },
  ];
  for (const { re, type } of patterns) {
    const g = new RegExp(re.source, 'g');
    let m;
    while ((m = g.exec(content)) !== null) {
      const lineIdx = content.slice(0, m.index).split('\n').length - 1;
      // detectReferral ist eine erlaubte Ausnahme
      const raw = lines[lineIdx]?.trim() || '';
      if (raw.includes('detectReferral') || raw.startsWith('//')) continue;
      calls.push({ type, line: lineIdx + 1, raw: raw.slice(0, 120) });
    }
  }
  return calls;
}

// ── State Patterns ────────────────────────────────────────────────────────────
function extractStatePatterns(content) {
  return {
    useState:        (content.match(/\buseState\s*\(/g) || []).length,
    useReducer:      (content.match(/\buseReducer\s*\(/g) || []).length,
    contextProvider: (content.match(/\.Provider\b/g) || []).length,
    createContext:   (content.match(/createContext\s*\(/g) || []).length,
  };
}

// ── Action Engine ─────────────────────────────────────────────────────────────
function extractActionEngine(content) {
  let count = 0;
  for (const re of ACTION_ENGINE_PATTERNS) {
    count += (content.match(new RegExp(re.source, 'g')) || []).length;
  }
  return { uses: count, adopted: count > 0 };
}

// ── Core Engine ───────────────────────────────────────────────────────────────
function extractCoreEngine(content) {
  let count = 0;
  for (const re of CORE_ENGINE_PATTERNS) {
    count += (content.match(new RegExp(re.source, 'g')) || []).length;
  }
  return { uses: count, adopted: count > 0 };
}

// ── Registry Usage ────────────────────────────────────────────────────────────
function extractRegistryUsage(content) {
  let count = 0;
  for (const re of REGISTRY_PATTERNS) {
    count += (content.match(new RegExp(re.source, 'g')) || []).length;
  }
  return { uses: count, adopted: count > 0 };
}

// ── Hardcoded Colors ──────────────────────────────────────────────────────────
function extractHardcodedColors(content) {
  // Nur in JSX/Style-Attributen, nicht in Kommentaren
  const noComments = content
    .replace(/\/\/[^\n]*/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '');
  const matches = [...noComments.matchAll(COLOR_PATTERN)];
  // Bekannte HUI-Farben (Registry-konforme Verwendung) nicht als Verstoß werten
  const KNOWN_REGISTRY_COLORS = new Set([
    'F7F5F2','F9F6F2','16D7C5','FF8A6B','1A1A18',
    'ffffff','FFFFFF','000000','transparent',
  ]);
  const suspicious = matches.filter(m => {
    const hex = (m[1] || '').toUpperCase();
    return hex.length >= 6 && !KNOWN_REGISTRY_COLORS.has(hex);
  });
  return { count: suspicious.length, sample: suspicious.slice(0, 3).map(m => m[0]) };
}

// ── Hardcoded Labels ──────────────────────────────────────────────────────────
function extractHardcodedLabels(content) {
  // Einfache Heuristik: JSX-Textnodes mit Großbuchstaben (wahrscheinlich Labels)
  const re = />\s*([A-ZÄÖÜ][A-Za-zäöüÄÖÜß\s]{3,30})\s*</g;
  const labels = [];
  let m;
  let count = 0;
  while ((m = re.exec(content)) !== null && count < 5) {
    const text = m[1].trim();
    if (text.split(' ').length <= 5) { labels.push(text); count++; }
  }
  return { count: labels.length, samples: labels };
}

// ── Directory Walk ────────────────────────────────────────────────────────────

/**
 * Rekursiv alle JS/JSX-Dateien in einem Verzeichnis sammeln.
 * @param {string} dir
 * @param {string[]} result
 * @returns {string[]}
 */
export function collectFiles(dir, result = []) {
  let entries;
  try { entries = readdirSync(dir); } catch { return result; }

  for (const entry of entries) {
    if (entry === 'node_modules' || entry === '.git' || entry === 'dist') continue;
    const full = join(dir, entry);
    let stat;
    try { stat = statSync(full); } catch { continue; }
    if (stat.isDirectory()) {
      collectFiles(full, result);
    } else if (/\.(js|jsx)$/.test(entry)) {
      result.push(full);
    }
  }
  return result;
}
