#!/usr/bin/env node
// ══════════════════════════════════════════════════════════
// scripts/i18n-scan.js — HUI i18n Hardcoded String Scanner
// ══════════════════════════════════════════════════════════
// Scans src/**/*.jsx for hardcoded German strings that should
// be using t() instead. Reports findings and optionally adds
// missing keys to locale files.
//
// Usage:
//   node scripts/i18n-scan.js          # Scan + report only
//   node scripts/i18n-scan.js --fix    # Scan + auto-add keys
//   node scripts/i18n-scan.js --ci     # Exit 1 if hardcoded strings found
// ══════════════════════════════════════════════════════════

const fs = require('fs');
const path = require('path');

const SRC_DIR = path.resolve(__dirname, '..', 'src');
const LOCALES_DIR = path.resolve(__dirname, '..', 'src', 'i18n', 'locales');
const DO_FIX = process.argv.includes('--fix');
const CI_MODE = process.argv.includes('--ci');

// German character patterns (Umlaute, ß, common German words)
const GERMAN_PATTERNS = [
  /[äöüÄÖÜß]/,
  /\b(der|die|das|den|dem|des|ein|eine|einer|eines|einem|einen|und|oder|nicht|ist|sind|wird|werden|haben|hat|mit|von|zu|auf|für|als|auch|wenn|wird|kann|muss|soll|aber|noch|schon|mehr|neue|neuen|neuer|mein|meine|dein|deine|sein|ihre|unser|euer|Abbrechen|Speichern|Löschen|Bearbeiten|Suche|Werk|Erlebnis|Moment|Talent|Profil|Kategorie|Erstellen|Veröffentlichen|Kaufen|Buchen|Senden|Melden|Teilen|Schließen|Zurück|Weiter|Bestätigen|Entfernen|Hinzufügen|Anmelden|Registrieren)\b/,
];

// Attribute patterns to check
const ATTR_PATTERNS = [
  /label="([^"]*[A-Za-zäöüÄÖÜß][^"]*)"/g,
  /placeholder="([^"]*[A-Za-zäöüÄÖÜß][^"]*)"/g,
  /aria-label="([^"]*[A-Za-zäöüÄÖÜß][^"]*)"/g,
  /title="([^"]*[A-Za-zäöüÄÖÜß][^"]*)"/g,
];

// Directories to skip
const SKIP_DIRS = ['node_modules', 'www', 'android', '.git', 'dist', '__tests__'];

function findFiles(dir, ext = '.jsx') {
  const results = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      if (!SKIP_DIRS.includes(item.name)) {
        results.push(...findFiles(fullPath, ext));
      }
    } else if (item.isFile() && item.name.endsWith(ext)) {
      results.push(fullPath);
    }
  }
  return results;
}

function isGerman(text) {
  return GERMAN_PATTERNS.some(p => p.test(text));
}

function isLikelyHardcoded(text) {
  // Skip if it looks like a variable or expression
  if (text.includes('{') && text.includes('}')) return false;
  // Skip if it's already a t() call
  if (text.startsWith('t(')) return false;
  // Skip if too short (1-2 chars)
  if (text.trim().length < 3) return false;
  // Skip pure numbers/symbols
  if (/^[0-9\s\.,\-+\/€$%()]+$/.test(text)) return false;
  // Skip if already translated (contains t() or {t())
  if (/^\{t\(/.test(text)) return false;
  return true;
}

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const findings = [];
  
  // Skip files that already use useTranslation (they might have remaining hardcoded)
  const hasI18n = content.includes('useTranslation');
  
  lines.forEach((line, idx) => {
    // Skip comments
    if (line.trim().startsWith('//') || line.trim().startsWith('/*')) return;
    
    for (const pattern of ATTR_PATTERNS) {
      let match;
      while ((match = pattern.exec(line)) !== null) {
        const text = match[1];
        if (isGerman(text) && isLikelyHardcoded(text)) {
          findings.push({
            file: path.relative(process.cwd(), filePath),
            line: idx + 1,
            attr: match[0],
            text,
          });
        }
      }
    }
  });
  
  return findings;
}

function generateKey(filePath, text) {
  // Generate a namespace from the file path
  const rel = path.relative(SRC_DIR, filePath);
  const parts = rel.replace(/\.jsx$/, '').split(path.sep);
  const fileName = parts[parts.length - 1].replace(/Page|Modal|Section|Component|Flow|Step|Sheet|Panel|Card|Header|Footer|Bar|Button|Input/g, '');
  const ns = fileName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'common';
  const textKey = text.toLowerCase()
    .replace(/[^a-z0-9äöüß]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .substring(0, 40);
  return `${ns}.${textKey}`;
}

function loadLocale(lang) {
  const p = path.join(LOCALES_DIR, `${lang}.json`);
  if (!fs.existsSync(p)) return {};
  return JSON.parse(fs.readFileSync(p, 'utf-8'));
}

function saveLocale(lang, data) {
  fs.writeFileSync(
    path.join(LOCALES_DIR, `${lang}.json`),
    JSON.stringify(data, null, 2) + '\n',
    'utf-8'
  );
}

function ensureNamespace(data, ns) {
  if (!data[ns]) data[ns] = {};
  return data[ns];
}

function main() {
  console.log('🔍 HUI i18n Scanner — Searching for hardcoded German strings...\n');
  
  const files = findFiles(SRC_DIR);
  console.log(`Scanning ${files.length} JSX files...\n`);
  
  const allFindings = [];
  for (const file of files) {
    const findings = scanFile(file);
    if (findings.length > 0) {
      allFindings.push(...findings);
    }
  }
  
  // Deduplicate by text
  const unique = new Map();
  for (const f of allFindings) {
    if (!unique.has(f.text)) {
      unique.set(f.text, f);
    }
  }
  
  const uniqueFindings = Array.from(unique.values());
  
  if (uniqueFindings.length === 0) {
    console.log('✅ No hardcoded German strings found!');
    process.exit(0);
  }
  
  console.log(`⚠️  Found ${uniqueFindings.length} unique hardcoded strings:\n`);
  
  // Group by file
  const byFile = {};
  for (const f of uniqueFindings) {
    if (!byFile[f.file]) byFile[f.file] = [];
    byFile[f.file].push(f);
  }
  
  for (const [file, items] of Object.entries(byFile)) {
    console.log(`  ${file}:`);
    for (const item of items) {
      console.log(`    L${item.line}: ${item.text}`);
    }
  }
  
  if (DO_FIX) {
    console.log('\n📝 Auto-adding keys to locale files...');
    
    const de = loadLocale('de');
    const en = loadLocale('en');
    let added = 0;
    
    for (const f of uniqueFindings) {
      const key = generateKey(f.file, f.text);
      const [ns, ...keyParts] = key.split('.');
      const keyPath = keyParts.join('.');
      
      // Add to DE if not exists
      const deNs = ensureNamespace(de, ns);
      if (!deNs[keyPath]) {
        deNs[keyPath] = f.text;
        added++;
      }
      
      // Add to EN as TODO (will be auto-translated)
      const enNs = ensureNamespace(en, ns);
      if (!enNs[keyPath]) {
        enNs[keyPath] = f.text; // Will be auto-translated later
      }
    }
    
    saveLocale('de', de);
    saveLocale('en', en);
    
    console.log(`✅ Added ${added} keys to de.json + en.json`);
    console.log('⚠️  ES/FR/IT/TR/EL will be auto-translated at runtime via the auto-translate edge function.');
    console.log('⚠️  You still need to manually replace hardcoded strings with t() calls in the JSX files.');
  } else {
    console.log('\n💡 Run with --fix to auto-add keys to locale files.');
  }
  
  if (CI_MODE) process.exit(1);
}

main();
