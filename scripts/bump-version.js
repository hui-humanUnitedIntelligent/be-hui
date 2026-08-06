#!/usr/bin/env node
// scripts/bump-version.js — HUI Version Bump (Node.js)
// Usage: node scripts/bump-version.js [patch|minor|major]
// Default: patch
// SSOT: package.json → build.gradle → strings.xml

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.join(__dirname, '..');
const pkgPath = path.join(rootDir, 'package.json');
const gradlePath = path.join(rootDir, 'android', 'app', 'build.gradle');
const stringsPath = path.join(rootDir, 'android', 'app', 'src', 'main', 'res', 'values', 'strings.xml');

const mode = process.argv[2] || 'patch';

// Read current version from package.json
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
let [major, minor, patch] = pkg.version.split('.').map(Number);

// Bump
switch (mode) {
  case 'patch':  patch++; break;
  case 'minor':  minor++; patch = 0; break;
  case 'major':  major++; minor = 0; patch = 0; break;
  default:
    if (/^\d+\.\d+\.\d+$/.test(mode)) {
      // Manual version like "1.2.3"
      [major, minor, patch] = mode.split('.').map(Number);
    } else {
      console.error(`Unknown mode: ${mode}`);
      console.error('Usage: node scripts/bump-version.js [patch|minor|major|<version>]');
      process.exit(1);
    }
}

const newVersion = `${major}.${minor}.${patch}`;

// Read current versionCode from build.gradle
let gradle = fs.readFileSync(gradlePath, 'utf8');
const codeMatch = gradle.match(/versionCode\s+(\d+)/);
const currentCode = codeMatch ? parseInt(codeMatch[1], 10) : 1;
const newCode = currentCode + 1;

// Update package.json
pkg.version = newVersion;
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');

// Update build.gradle
gradle = gradle.replace(/versionCode\s+\d+/, `versionCode ${newCode}`);
gradle = gradle.replace(/versionName\s+"[^"]+"/, `versionName "${newVersion}"`);
fs.writeFileSync(gradlePath, gradle);

// Update strings.xml if it exists
if (fs.existsSync(stringsPath)) {
  let strings = fs.readFileSync(stringsPath, 'utf8');
  strings = strings.replace(
    /<string name="app_name">.*<\/string>/,
    `<string name="app_name">HUI v${newVersion}</string>`
  );
  fs.writeFileSync(stringsPath, strings);
}

console.log(`Version: ${newVersion} (Code ${newCode})`);
